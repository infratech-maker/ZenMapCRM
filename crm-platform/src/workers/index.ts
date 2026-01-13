/**
 * BullMQ Worker Entry Point
 * 
 * Railway/Docker環境で実行されるWorkerプロセス
 * BullMQのWorkerクラスを使用してイベント駆動型でスクレイピングジョブを処理します
 */

import { config } from "dotenv";
import { resolve } from "path";

// 環境変数の読み込み
// Railway環境では環境変数が直接設定されるため、.env.localはオプション
const envPath = resolve(__dirname, "../../.env.local");
try {
  config({ path: envPath });
  console.log("✅ Environment variables loaded from .env.local");
} catch (error) {
  console.log("ℹ️  .env.local not found, using environment variables from Railway");
}

import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { db } from "../lib/db";
import { scrapingJobs, leads, masterLeads } from "../lib/db/schema";
import { scrapeUrl } from "../features/scraper/worker";
import { eq, or, and, sql } from "drizzle-orm";

// Redis接続設定
// RailwayのRedisはTLS接続が必要な場合があるため、適切に設定
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.error("❌ REDIS_URL environment variable is not set");
  process.exit(1);
}

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null, // BullMQ使用時は必須
  enableReadyCheck: false, // Railway Redis用の設定
  enableOfflineQueue: false, // Railway Redis用の設定
  // URLが rediss:// (s付き) で始まる場合、TLSオプションを有効化
  tls: redisUrl.startsWith("rediss://")
    ? { rejectUnauthorized: false }
    : undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// データベース接続確認
async function checkDatabaseConnection() {
  try {
    await db.execute(sql`SELECT 1`);
    console.log("✅ Database connection established");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

// Redis接続確認
connection.on("connect", () => {
  console.log("✅ Redis connection established");
});

connection.on("error", (error: Error) => {
  console.error("❌ Redis connection error:", error);
});

connection.on("close", () => {
  console.log("⚠️  Redis connection closed");
});

// Worker設定
const QUEUE_NAME = "scraping-queue";
const CONCURRENCY = 1; // CRITICAL: Set to 1 to prevent OOM (Playwright memory consumption)

/**
 * CUIDを生成する関数（MasterLeadのID生成用）
 */
function generateCuid(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `c${timestamp}${randomPart}`;
}

/**
 * ジョブ処理関数
 */
async function processJob(job: Job<any, { jobId: string; tenantId: string; url: string }, string>): Promise<any> {
  // job.idがundefinedの場合はエラー
  if (!job.id) {
    throw new Error("Job ID is undefined");
  }

  const { jobId, tenantId, url } = job.data;

  console.log(`📡 Processing job ${job.id} (DB Job ID: ${jobId}, URL: ${url})`);

  try {
    // 1. ステータスを'running'に更新（スキーマでは'running'が定義されている）
    await db
      .update(scrapingJobs)
      .set({
        status: "running",
        startedAt: new Date(),
        bullmqJobId: job.id,
      })
      .where(eq(scrapingJobs.id, jobId));

    // 2. スクレイピング実行
    console.log(`  🔍 Scraping: ${url}`);
    const result = await scrapeUrl(url);

    // 3. 既存のリードをチェック（重複防止）
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
          result: result as any,
        })
        .where(eq(scrapingJobs.id, jobId));

      return { status: "skipped", result };
    }

    // 4. MasterLeadを作成または取得（Drizzle ORM使用）
    // 既存のMasterLeadを検索（URLまたは店舗名で）
    const whereConditions = result.name
      ? or(eq(masterLeads.source, url), eq(masterLeads.companyName, result.name))
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
      masterLeadId = generateCuid();
      await db.insert(masterLeads).values({
        id: masterLeadId,
        companyName: result.name || "不明",
        phone: result.phone || null,
        address: result.address || null,
        source: url,
        data: result as any,
      });
      console.log(`  ✅ Created MasterLead: ${masterLeadId}`);
    }

    // 5. Leadを作成
    await db.insert(leads).values({
      tenantId: tenantId,
      scrapingJobId: jobId,
      masterLeadId: masterLeadId,
      source: url,
      data: result as any,
      status: "new",
    });

    // 6. ジョブを完了に更新
    await db
      .update(scrapingJobs)
      .set({
        status: "completed",
        completedAt: new Date(),
        result: result as any,
      })
      .where(eq(scrapingJobs.id, jobId));

    console.log(`  ✅ Completed: ${url}`);
    return { status: "success", result };
  } catch (error) {
    console.error(`  ❌ Error processing job ${job.id}:`, error);

    // エラーをDBに保存
    await db
      .update(scrapingJobs)
      .set({
        status: "failed",
        completedAt: new Date(),
        error: error instanceof Error ? error.message : String(error),
      })
      .where(eq(scrapingJobs.id, jobId));

    // BullMQにエラーを通知（リトライ可能）
    throw error;
  }
}

// Workerインスタンス作成
const worker = new Worker(
  QUEUE_NAME,
  async (job: Job<any, { jobId: string; tenantId: string; url: string }, string>) => {
    return await processJob(job) as any;
  },
  {
    connection,
    concurrency: CONCURRENCY, // CRITICAL: Set to 1
    removeOnComplete: {
      count: 100, // 完了したジョブを100件保持
      age: 24 * 3600, // 24時間
    },
    removeOnFail: {
      count: 500, // 失敗したジョブを500件保持
    },
  }
);

// Workerイベントハンドラー
worker.on("completed", (job: Job<any, { jobId: string; tenantId: string; url: string }, string>) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job: Job<any, { jobId: string; tenantId: string; url: string }, string> | undefined, err: Error) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});

worker.on("error", (err: Error) => {
  console.error("❌ Worker error:", err);
});

// Graceful Shutdown
let isShuttingDown = false;

const shutdown = async (signal: string) => {
  if (isShuttingDown) {
    console.log("⚠️  Shutdown already in progress...");
    return;
  }

  isShuttingDown = true;
  console.log(`\n🛑 ${signal} received, shutting down gracefully...`);

  try {
    // Workerを閉じる（現在のジョブ完了を待機）
    await worker.close();
    console.log("✅ Worker closed");

    // Redis接続を閉じる
    await connection.quit();
    console.log("✅ Redis connection closed");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// 起動処理
async function main() {
  console.log("🚀 BullMQ Worker starting...");
  console.log(`📊 Queue: ${QUEUE_NAME}`);
  console.log(`⚙️  Concurrency: ${CONCURRENCY} (CRITICAL: Set to 1 to prevent OOM)`);
  if (redisUrl) {
    console.log(`🔗 Redis URL: ${redisUrl.replace(/:[^:@]+@/, ":****@")}`); // パスワードをマスク
  }

  // データベース接続確認
  const dbConnected = await checkDatabaseConnection();
  if (!dbConnected) {
    console.error("❌ Failed to connect to database. Exiting...");
    process.exit(1);
  }

  console.log("✅ Worker started and listening for jobs...");
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
