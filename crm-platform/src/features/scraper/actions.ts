"use server";

import { db } from "@/lib/db";
import { scrapingJobs } from "@/lib/db/schema";
import { withTenant } from "@/lib/db/tenant-helper";
import { revalidatePath } from "next/cache";
import { desc, sql } from "drizzle-orm";

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

    // TODO: BullMQへの追加ロジック
    // await queue.add('scraping', {
    //   tenantId: await getCurrentTenant(),
    //   jobId: job.id,
    //   url: url.trim(),
    // });

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

