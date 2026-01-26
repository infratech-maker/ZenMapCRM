"use server";

import { db } from "@/lib/db";
import { scrapingJobs } from "@/lib/db/schema";
import { withTenant } from "@/lib/db/tenant-helper";
import { revalidatePath } from "next/cache";
import { desc, sql, eq } from "drizzle-orm";

/**
 * スクレイピングジョブを作成
 * 
 * @param url スクレイピング対象のURL
 * @returns 作成されたジョブID
 */
export async function createScrapingJob(url: string) {
  return await withTenant(async (tenantId) => {
    // URLのバリデーション
    if (!url || !url.trim()) {
      throw new Error("URL is required");
    }

    try {
      new URL(url);
    } catch {
      throw new Error("Invalid URL format");
    }

    // スクレイピングジョブを作成
    // withTenant 内で既にセッション変数が設定されているため、
    // RLSにより自動的にテナント分離されるが、tenantId は明示的に設定する必要がある
    const [job] = await db
      .insert(scrapingJobs)
      .values({
        tenantId: tenantId, // withTenant から渡されたテナントIDを使用
        url: url.trim(),
        status: "pending",
      })
      .returning();

    // パイプラインを開始（または従来のキューに追加）
    try {
      // 環境変数でパイプラインの使用を制御
      const usePipeline = process.env.USE_PIPELINE === "true";
      
      if (usePipeline) {
        // パイプラインを使用
        const { startPipeline } = await import("@/lib/queue/pipeline-queue");
        const bullmqJobId = await startPipeline(job.id, tenantId, url.trim());
        
        // BullMQのジョブIDをDBに保存
        await db
          .update(scrapingJobs)
          .set({ bullmqJobId })
          .where(eq(scrapingJobs.id, job.id));
      } else {
        // 従来のキューを使用（後方互換性）
        const { addScrapingJob } = await import("@/lib/queue/scraping-queue");
        const bullmqJobId = await addScrapingJob(job.id, tenantId, url.trim());
        
        // BullMQのジョブIDをDBに保存
        await db
          .update(scrapingJobs)
          .set({ bullmqJobId })
          .where(eq(scrapingJobs.id, job.id));
      }
    } catch (error) {
      console.error("Failed to add job to BullMQ queue:", error);
      // BullMQへの追加に失敗しても、DBにはジョブが作成されているので続行
    }

    // UIを更新
    revalidatePath("/dashboard/scraper");

    return { id: job.id, url: job.url, status: job.status };
  });
}

/**
 * スクレイピングジョブ一覧を取得
 * 
 * @returns スクレイピングジョブの一覧
 */
export async function getScrapingJobs() {
  return await withTenant(async (tenantId) => {
    const jobs = await db
      .select({
        id: scrapingJobs.id,
        url: scrapingJobs.url,
        status: scrapingJobs.status,
        createdAt: scrapingJobs.createdAt,
        startedAt: scrapingJobs.startedAt,
        completedAt: scrapingJobs.completedAt,
        error: scrapingJobs.error,
      })
      .from(scrapingJobs)
      .orderBy(desc(scrapingJobs.createdAt))
      .limit(50);

    return jobs;
  });
}

