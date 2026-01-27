/**
 * Pipeline Workers Entry Point
 * 
 * パイプラインの全ワーカーを起動するエントリーポイント
 * 
 * 使用方法:
 * npm run start:pipeline-workers
 * 
 * または
 * tsx src/workers/pipeline-index.ts
 */

import { config } from "dotenv";
import { resolve } from "path";

// 環境変数の読み込み
const envPath = resolve(__dirname, "../.env.local");
try {
  config({ path: envPath });
  console.log("✅ Environment variables loaded from .env.local");
} catch (error) {
  console.log("ℹ️  .env.local not found, using environment variables from Railway");
}

// スクレイピングワーカー（既存）
import "./index";

// パイプラインワーカー
import {
  transformWorker,
  validateWorker,
  enrichWorker,
  saveWorker,
  notifyWorker,
} from "./pipeline-workers";

console.log("🚀 Pipeline Workers starting...");
console.log("📊 Workers:");
console.log("  - Scraping Worker (scraping-queue)");
console.log("  - Transform Worker (transform-queue)");
console.log("  - Validate Worker (validate-queue)");
console.log("  - Enrich Worker (enrich-queue)");
console.log("  - Save Worker (save-queue)");
console.log("  - Notify Worker (notify-queue)");
console.log("✅ All pipeline workers started and listening for jobs...");

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
    // すべてのワーカーを閉じる
    await Promise.all([
      transformWorker.close(),
      validateWorker.close(),
      enrichWorker.close(),
      saveWorker.close(),
      notifyWorker.close(),
    ]);

    console.log("✅ All workers closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
