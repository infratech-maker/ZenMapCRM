/**
 * BullMQ Queue for Scraping Jobs
 * 
 * Producer側で使用するQueueインスタンス
 */

import { Queue } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL environment variable is not set");
}

// Redis接続設定（Producer側）
const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null, // BullMQ使用時は必須
  enableReadyCheck: false,
  enableOfflineQueue: false,
  // URLが rediss:// (s付き) で始まる場合、TLSオプションを有効化
  tls: redisUrl.startsWith("rediss://")
    ? { rejectUnauthorized: false }
    : undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

// Queueインスタンス
export const scrapingQueue = new Queue("scraping-queue", {
  connection,
});

/**
 * スクレイピングジョブをキューに追加
 * 
 * @param jobId データベースのジョブID
 * @param tenantId テナントID
 * @param url スクレイピング対象のURL
 * @returns BullMQのジョブID
 */
export async function addScrapingJob(jobId: string, tenantId: string, url: string) {
  const job = await scrapingQueue.add(
    "scraping",
    {
      jobId,
      tenantId,
      url,
    },
    {
      attempts: 3, // 最大3回リトライ
      backoff: {
        type: "exponential",
        delay: 5000, // 5秒から開始
      },
      removeOnComplete: {
        count: 100, // 完了したジョブを100件保持
        age: 24 * 3600, // 24時間
      },
      removeOnFail: {
        count: 500, // 失敗したジョブを500件保持
      },
    }
  );

  return job.id;
}
