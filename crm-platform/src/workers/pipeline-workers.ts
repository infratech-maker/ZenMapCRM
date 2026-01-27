/**
 * Pipeline Workers
 * 
 * パイプラインの各ステップを処理するワーカー
 * 
 * ステップ:
 * 1. transform: データ変換・正規化
 * 2. validate: データ検証
 * 3. enrich: データ補完
 * 4. save: データベース保存
 * 5. notify: 通知送信
 */

import { Worker, Job, Queue } from "bullmq";
import IORedis from "ioredis";
import { db } from "../lib/db";
import { scrapingJobs, leads, masterLeads } from "../lib/db/schema";
import { eq, or } from "drizzle-orm";
import { PipelineJobData } from "../lib/queue/pipeline-queue";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL environment variable is not set");
}

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  enableOfflineQueue: false,
  tls: redisUrl.startsWith("rediss://")
    ? { rejectUnauthorized: false }
    : undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

/**
 * 親ジョブの結果を取得するヘルパー関数
 * 
 * BullMQのFlowProducerでは、親ジョブの結果は子ジョブのdataに自動的にマージされません。
 * この関数を使用して、親ジョブの結果を取得します。
 * 
 * @param job 現在のジョブ
 * @param parentQueueName 親ジョブのキュー名
 * @returns 親ジョブの結果（親ジョブがない場合はjob.data）
 */
async function getParentJobResult(
  job: Job<PipelineJobData>,
  parentQueueName: string
): Promise<any> {
  // 親ジョブのIDを取得
  const parentId = job.parent?.id;
  
  if (!parentId) {
    // 親ジョブがない場合は、job.dataから直接取得を試みる
    // これは、パイプラインの最初のステップ（scraping）の場合や、
    // 親ジョブの情報が取得できない場合に使用されます
    return job.data;
  }
  
  // 親ジョブのキューを取得
  const parentQueue = new Queue(parentQueueName, { connection });
  
  try {
    // 親ジョブを取得
    const parentJob = await parentQueue.getJob(parentId);
    
    if (!parentJob) {
      console.warn(`⚠️  Parent job ${parentId} not found in queue ${parentQueueName}, using job.data`);
      return job.data;
    }
    
    // 親ジョブの状態を確認
    const parentState = await parentJob.getState();
    
    if (parentState === "completed") {
      // 親ジョブが完了している場合、結果を取得
      const parentReturnValue = await parentJob.returnvalue;
      
      if (parentReturnValue) {
        // 親ジョブの結果とjob.dataをマージ
        return {
          ...job.data,
          ...parentReturnValue,
        };
      }
    } else if (parentState === "failed") {
      // 親ジョブが失敗している場合
      console.warn(`⚠️  Parent job ${parentId} failed, using job.data`);
      return job.data;
    } else {
      // 親ジョブがまだ実行中の場合は、job.dataを使用
      // これは通常発生しないはずですが、念のため
      console.warn(`⚠️  Parent job ${parentId} is still ${parentState}, using job.data`);
      return job.data;
    }
    
    // フォールバック: job.dataを使用
    return job.data;
  } catch (error) {
    console.warn(`⚠️  Failed to get parent job result for ${parentId}: ${error}, using job.data`);
    return job.data;
  } finally {
    // キューを閉じる（リソースリークを防ぐ）
    await parentQueue.close();
  }
}

/**
 * データ変換・正規化ワーカー
 */
export const transformWorker = new Worker(
  "transform-queue",
  async (job: Job<PipelineJobData>) => {
    const { jobId, tenantId, url, ...data } = job.data;
    
    console.log(`🔄 [Transform] Processing job ${jobId} for URL: ${url}`);
    
    // 前のステップ（scraping）の結果を取得
    // BullMQのFlowProducerでは、親ジョブの結果は子ジョブのdataに自動的にマージされないため、
    // 親ジョブの結果を明示的に取得する必要があります
    const parentResult = await getParentJobResult(job, "scraping-queue");
    const scrapingResult = parentResult.scrapingResult || parentResult || data;
    
    // データの正規化・変換処理
    const transformed = {
      name: scrapingResult.name?.trim() || null,
      address: scrapingResult.address?.trim() || null,
      phone: normalizePhone(scrapingResult.phone) || null,
      category: scrapingResult.category?.trim() || null,
      businessHours: scrapingResult.business_hours || scrapingResult.businessHours || null,
      website: scrapingResult.website || scrapingResult.url || null,
      rating: scrapingResult.rating ? parseFloat(String(scrapingResult.rating)) : null,
      ratingCount: scrapingResult.rating_count || scrapingResult.ratingCount || null,
      latitude: scrapingResult.latitude ? parseFloat(String(scrapingResult.latitude)) : null,
      longitude: scrapingResult.longitude ? parseFloat(String(scrapingResult.longitude)) : null,
      // 元のデータも保持
      rawData: scrapingResult,
    };
    
    console.log(`✅ [Transform] Completed for job ${jobId}`);
    
    return {
      ...job.data,
      transformedData: transformed,
    };
  },
  {
    connection,
    concurrency: 5,
  }
);

/**
 * データ検証ワーカー
 */
export const validateWorker = new Worker(
  "validate-queue",
  async (job: Job<PipelineJobData>) => {
    const { jobId, tenantId, url } = job.data;
    
    console.log(`✅ [Validate] Processing job ${jobId} for URL: ${url}`);
    
    // 前のステップ（transform）の結果を取得
    const parentResult = await getParentJobResult(job, "transform-queue");
    const transformedData = parentResult.transformedData || job.data.transformedData;
    
    if (!transformedData) {
      throw new Error("Transformed data is missing");
    }
    
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // 必須フィールドの検証
    if (!transformedData.name) {
      errors.push("店舗名が取得できませんでした");
    }
    
    // 電話番号の検証
    if (transformedData.phone && !isValidPhone(transformedData.phone)) {
      warnings.push("電話番号の形式が不正です");
    }
    
    // 住所の検証
    if (!transformedData.address) {
      warnings.push("住所が取得できませんでした");
    }
    
    // エラーがある場合は失敗
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`);
    }
    
    console.log(`✅ [Validate] Completed for job ${jobId}${warnings.length > 0 ? ` (warnings: ${warnings.length})` : ""}`);
    
    return {
      ...job.data,
      validationResult: {
        isValid: true,
        errors: [],
        warnings,
      },
    };
  },
  {
    connection,
    concurrency: 10,
  }
);

/**
 * データ補完ワーカー
 */
export const enrichWorker = new Worker(
  "enrich-queue",
  async (job: Job<PipelineJobData>) => {
    const { jobId, tenantId, url } = job.data;
    
    console.log(`🔍 [Enrich] Processing job ${jobId} for URL: ${url}`);
    
    // 前のステップ（validate）の結果を取得（transformedDataを含む）
    const parentResult = await getParentJobResult(job, "validate-queue");
    const transformedData = parentResult.transformedData || job.data.transformedData;
    
    if (!transformedData) {
      throw new Error("Transformed data is missing");
    }
    
    const enriched = { ...transformedData };
    
    // 電話番号が不足している場合、既存のMasterLeadから補完を試みる
    if (!enriched.phone && enriched.name) {
      const existingMasterLead = await db
        .select()
        .from(masterLeads)
        .where(eq(masterLeads.companyName, enriched.name))
        .limit(1);
      
      if (existingMasterLead.length > 0 && existingMasterLead[0].phone) {
        enriched.phone = existingMasterLead[0].phone;
        console.log(`  📞 Enriched phone from existing MasterLead: ${enriched.phone}`);
      }
    }
    
    // 住所が不足している場合、既存のMasterLeadから補完を試みる
    if (!enriched.address && enriched.name) {
      const existingMasterLead = await db
        .select()
        .from(masterLeads)
        .where(eq(masterLeads.companyName, enriched.name))
        .limit(1);
      
      if (existingMasterLead.length > 0 && existingMasterLead[0].address) {
        enriched.address = existingMasterLead[0].address;
        console.log(`  📍 Enriched address from existing MasterLead`);
      }
    }
    
    console.log(`✅ [Enrich] Completed for job ${jobId}`);
    
    return {
      ...job.data,
      enrichedData: enriched,
    };
  },
  {
    connection,
    concurrency: 5,
  }
);

/**
 * データベース保存ワーカー
 */
export const saveWorker = new Worker(
  "save-queue",
  async (job: Job<PipelineJobData>) => {
    const { jobId, tenantId, url } = job.data;
    
    console.log(`💾 [Save] Processing job ${jobId} for URL: ${url}`);
    
    // 前のステップ（enrich）の結果を取得
    const parentResult = await getParentJobResult(job, "enrich-queue");
    const enrichedData = parentResult.enrichedData || job.data.enrichedData;
    
    if (!enrichedData) {
      throw new Error("Enriched data is missing");
    }
    
    // 既存のリードをチェック（重複防止）
    const existingLead = await db
      .select()
      .from(leads)
      .where(eq(leads.source, url))
      .limit(1);
    
    if (existingLead.length > 0) {
      console.log(`  ⏭️  Skipping: Lead already exists for ${url}`);
      
      // ジョブを完了に更新（スキップ）
      await db
        .update(scrapingJobs)
        .set({
          status: "completed",
          completedAt: new Date(),
          result: enrichedData as any,
        })
        .where(eq(scrapingJobs.id, jobId));
      
      return {
        ...job.data,
        saved: false,
        skipped: true,
        leadId: existingLead[0].id,
      };
    }
    
    // MasterLeadを作成または取得
    const whereConditions = enrichedData.name
      ? or(eq(masterLeads.source, url), eq(masterLeads.companyName, enrichedData.name))
      : eq(masterLeads.source, url);
    
    const existingMasterLeads = await db
      .select()
      .from(masterLeads)
      .where(whereConditions)
      .limit(1);
    
    let masterLeadId: string;
    
    if (existingMasterLeads.length > 0) {
      masterLeadId = existingMasterLeads[0].id;
      console.log(`  ℹ️  Using existing MasterLead: ${masterLeadId}`);
    } else {
      // MasterLeadが存在しない場合は作成
      const cuid = `c${Date.now().toString(36)}${Math.random().toString(36).substring(2, 15)}`;
      masterLeadId = cuid;
      await db.insert(masterLeads).values({
        id: masterLeadId,
        companyName: enrichedData.name || "不明",
        phone: enrichedData.phone || null,
        address: enrichedData.address || null,
        source: url,
        data: enrichedData as any,
      });
      console.log(`  ✅ Created MasterLead: ${masterLeadId}`);
    }
    
    // Leadを作成
    const [newLead] = await db.insert(leads).values({
      tenantId: tenantId,
      scrapingJobId: jobId,
      masterLeadId: masterLeadId,
      source: url,
      data: enrichedData as any,
      status: "new",
    }).returning();
    
    // ジョブを完了に更新
    await db
      .update(scrapingJobs)
      .set({
        status: "completed",
        completedAt: new Date(),
        result: enrichedData as any,
      })
      .where(eq(scrapingJobs.id, jobId));
    
    console.log(`✅ [Save] Completed for job ${jobId}, Lead ID: ${newLead.id}`);
    
    return {
      ...job.data,
      saved: true,
      leadId: newLead.id,
      masterLeadId,
    };
  },
  {
    connection,
    concurrency: 5,
  }
);

/**
 * 通知送信ワーカー
 */
export const notifyWorker = new Worker(
  "notify-queue",
  async (job: Job<PipelineJobData>) => {
    const { jobId, tenantId, url } = job.data;
    
    console.log(`📢 [Notify] Processing job ${jobId} for URL: ${url}`);
    
    // 前のステップ（save）の結果を取得
    const parentResult = await getParentJobResult(job, "save-queue");
    const saved = parentResult.saved || job.data.saved;
    const skipped = parentResult.skipped || job.data.skipped;
    
    // 通知はオプション（失敗してもパイプラインは成功とする）
    try {
      // Slack通知（オプション）
      const webhookUrl = process.env.SLACK_WEBHOOK_URL;
      if (webhookUrl && saved) {
        await sendSlackNotification(
          webhookUrl,
          `✅ スクレイピング完了: ${url}`,
          "good"
        );
      }
      
      console.log(`✅ [Notify] Completed for job ${jobId}`);
    } catch (error) {
      console.warn(`⚠️  [Notify] Failed for job ${jobId}:`, error);
      // 通知の失敗はパイプラインの失敗としない
    }
    
    return {
      ...job.data,
      notified: true,
    };
  },
  {
    connection,
    concurrency: 10,
  }
);

// ユーティリティ関数

/**
 * 電話番号を正規化
 */
function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  // 数字以外を削除
  const digits = phone.replace(/\D/g, "");
  
  // 日本の電話番号形式に変換
  if (digits.length === 10 || digits.length === 11) {
    if (digits.startsWith("0")) {
      return digits;
    }
  }
  
  return phone.trim();
}

/**
 * 電話番号の妥当性を検証
 */
function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  
  const digits = phone.replace(/\D/g, "");
  
  // 日本の電話番号: 10桁または11桁（0で始まる）
  return (digits.length === 10 || digits.length === 11) && digits.startsWith("0");
}

/**
 * Slack通知を送信
 */
async function sendSlackNotification(
  webhookUrl: string,
  message: string,
  color: "good" | "warning" | "danger" | "info" = "info"
): Promise<void> {
  const colorMap = {
    good: "#36a64f",
    warning: "#ff9900",
    danger: "#ff0000",
    info: "#439fe0",
  };
  
  const payload = {
    attachments: [
      {
        color: colorMap[color],
        text: message,
        footer: "Scraping Pipeline",
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
  
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    throw new Error(`Slack notification failed: ${response.statusText}`);
  }
}

// エラーハンドリング
[transformWorker, validateWorker, enrichWorker, saveWorker, notifyWorker].forEach((worker) => {
  worker.on("completed", (job: Job) => {
    console.log(`✅ Worker ${worker.name} completed job ${job.id}`);
  });
  
  worker.on("failed", (job: Job | undefined, err: Error) => {
    console.error(`❌ Worker ${worker.name} failed job ${job?.id}:`, err);
  });
  
  worker.on("error", (err: Error) => {
    console.error(`❌ Worker ${worker.name} error:`, err);
  });
});
