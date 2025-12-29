import { config } from "dotenv";
import { resolve } from "path";

// 環境変数の読み込み (.env.local)
config({ path: resolve(__dirname, "../.env.local") });

import { db } from "../src/lib/db";
import { scrapingJobs, leads } from "../src/lib/db/schema";
import { withTenant } from "../src/lib/db/tenant-helper";
import { scrapeTabelogStore, scrapeUbereatsStore, scrapeUrl } from "../src/features/scraper/worker";
import { eq, and } from "drizzle-orm";

const BATCH_SIZE = 10;
const DELAY_MS = 500; // 待機時間を短縮（2秒→0.5秒）
const CONCURRENT_LIMIT = 5; // 並列処理数（同時に5件処理）

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processPendingJobs() {
  const startTime = Date.now();

  await withTenant(async (tenantId) => {
    console.log("🔍 Pending状態のスクレイピングジョブを取得中...");

    // Pending状態のジョブを取得
    const pendingJobs = await db
      .select()
      .from(scrapingJobs)
      .where(and(
        eq(scrapingJobs.tenantId, tenantId),
        eq(scrapingJobs.status, "pending")
      ))
      .limit(200); // 最大200件まで処理（増加）

    console.log(`✅ 対象件数: ${pendingJobs.length}件`);

    if (pendingJobs.length === 0) {
      console.log("処理対象のジョブがありません。");
      return;
    }

    let processed = 0;
    let success = 0;
    let failed = 0;
    let skipped = 0;

    // 並列処理用の関数（結果を返す）
    async function processJob(job: typeof pendingJobs[0], index: number): Promise<"success" | "failed" | "skipped"> {
      try {
        // ジョブステータスをrunningに更新
        await db
          .update(scrapingJobs)
          .set({
            status: "running",
            startedAt: new Date(),
          })
          .where(eq(scrapingJobs.id, job.id));

        console.log(`📡 [${index + 1}/${pendingJobs.length}] スクレイピング中: ${job.url}`);

        // スクレイピング実行（URLに基づいて適切な関数を選択）
        let result;
        try {
          // 汎用関数を使用（URLから自動判定）
          result = await scrapeUrl(job.url);
        } catch (error) {
          // エラーの場合は詳細をログに記録
          console.error(`  ❌ スクレイピングエラー: ${job.url}`, error);
          throw error;
        }

        // 既存のリードをチェック（重複防止）
        const existingLead = await db
          .select()
          .from(leads)
          .where(eq(leads.source, job.url))
          .limit(1);

        if (existingLead.length > 0) {
          console.log(`  ⏭️ 既存リードが存在するためスキップ: ${job.url}`);
          
          // ジョブを完了に更新
          await db
            .update(scrapingJobs)
            .set({
              status: "completed",
              completedAt: new Date(),
              result: result as any,
            })
            .where(eq(scrapingJobs.id, job.id));
          
          return "skipped";
        }

        // リードを作成
        await db.insert(leads).values({
          tenantId: tenantId,
          scrapingJobId: job.id,
          source: job.url,
          data: result as any,
          status: "new",
        });

        // ジョブを完了に更新
        await db
          .update(scrapingJobs)
          .set({
            status: "completed",
            completedAt: new Date(),
            result: result as any,
          })
          .where(eq(scrapingJobs.id, job.id));

        console.log(`  ✅ 保存完了: ${result.name || job.url}`);
        return "success";
      } catch (error) {
        console.error(`  ❌ エラー: ${job.url}`, error);

        // ジョブを失敗に更新
        await db
          .update(scrapingJobs)
          .set({
            status: "failed",
            completedAt: new Date(),
            error: error instanceof Error ? error.message : String(error),
          })
          .where(eq(scrapingJobs.id, job.id));

        return "failed";
      }
    }

    // 並列処理の実行
    for (let i = 0; i < pendingJobs.length; i += CONCURRENT_LIMIT) {
      const batch = pendingJobs.slice(i, i + CONCURRENT_LIMIT);
      
      // バッチを並列処理して結果を集計
      const results = await Promise.all(batch.map((job, batchIndex) => processJob(job, i + batchIndex)));
      
      // 結果を集計
      results.forEach((result) => {
        processed++;
        if (result === "success") success++;
        else if (result === "failed") failed++;
        else if (result === "skipped") skipped++;
      });
      
      // バッチ間の待機時間（負荷対策）
      if (i + CONCURRENT_LIMIT < pendingJobs.length) {
        await sleep(DELAY_MS);
      }

      // 進捗ログ
      if (processed % BATCH_SIZE === 0 || processed === pendingJobs.length) {
        console.log(
          `--- 進捗: ${processed}/${pendingJobs.length}件 (成功: ${success}, 失敗: ${failed}, スキップ: ${skipped}) ---`
        );
      }
    }

    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime % 60;

    console.log("\n🎉 処理完了");
    console.log(
      `総件数: ${pendingJobs.length}, 成功: ${success}, 失敗: ${failed}, スキップ: ${skipped}`
    );
    console.log(`処理時間: ${minutes}分${seconds}秒`);
  });
}

// 実行
processPendingJobs()
  .then(() => {
    console.log("✅ スクリプトが正常に完了しました");
    process.exit(0);
  })
  .catch((e) => {
    console.error("❌ スクリプトがエラーで終了しました:", e);
    process.exit(1);
  });


