import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { scrapeTabelogStore } from "../src/features/scraper/worker";

async function testScraping() {
  const testUrl = "https://tabelog.com/tokyo/A1314/A131402/13316814/";
  console.log(`🔍 テストスクレイピング: ${testUrl}\n`);
  
  try {
    const result = await scrapeTabelogStore(testUrl);
    console.log("📊 スクレイピング結果:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("❌ エラー:", error);
  }
}

testScraping()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
