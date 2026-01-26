/**
 * Pipeline Queue for Multi-Step Processing
 * 
 * BullMQ FlowProducerを使用して、複数ステップのパイプラインを実装
 * 
 * パイプラインの流れ:
 * 1. scraping: スクレイピング実行
 * 2. transform: データ変換・正規化
 * 3. validate: データ検証
 * 4. enrich: データ補完（電話番号、住所など）
 * 5. save: データベース保存
 * 6. notify: 通知送信（オプション）
 */

import { FlowProducer } from "bullmq";
import IORedis from "ioredis";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL environment variable is not set");
}

// Redis接続設定
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

// FlowProducerインスタンス
export const pipelineFlowProducer = new FlowProducer({
  connection,
});

/**
 * パイプラインジョブのデータ型
 */
export interface PipelineJobData {
  jobId: string; // データベースのジョブID
  tenantId: string;
  url: string;
  [key: string]: any; // 各ステップで追加されるデータ
}

/**
 * パイプラインを開始
 * 
 * パイプラインの流れ:
 * scraping → transform → validate → enrich → save → notify
 * 
 * @param jobId データベースのジョブID
 * @param tenantId テナントID
 * @param url スクレイピング対象のURL
 * @returns FlowProducerのジョブID
 */
export async function startPipeline(
  jobId: string,
  tenantId: string,
  url: string
): Promise<string> {
  const flow = await pipelineFlowProducer.add({
    name: "scraping",
    queueName: "scraping-queue",
    data: {
      jobId,
      tenantId,
      url,
    } as PipelineJobData,
    opts: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
    },
    children: [
      {
        name: "transform",
        queueName: "transform-queue",
        data: {
          jobId,
          tenantId,
          url,
        } as PipelineJobData,
        opts: {
          attempts: 2,
        },
        children: [
          {
            name: "validate",
            queueName: "validate-queue",
            data: {
              jobId,
              tenantId,
              url,
            } as PipelineJobData,
            opts: {
              attempts: 2,
            },
            children: [
              {
                name: "enrich",
                queueName: "enrich-queue",
                data: {
                  jobId,
                  tenantId,
                  url,
                } as PipelineJobData,
                opts: {
                  attempts: 2,
                },
                children: [
                  {
                    name: "save",
                    queueName: "save-queue",
                    data: {
                      jobId,
                      tenantId,
                      url,
                    } as PipelineJobData,
                    opts: {
                      attempts: 2,
                    },
                    children: [
                      {
                        name: "notify",
                        queueName: "notify-queue",
                        data: {
                          jobId,
                          tenantId,
                          url,
                        } as PipelineJobData,
                        opts: {
                          attempts: 1,
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });

  return flow.job.id!;
}
