/**
 * スクレイピングロジックのテスト用スクリプト
 * 
 * 使用方法:
 *   tsx src/features/scraper/test-scraper.ts <URL>
 * 
 * 例:
 *   tsx src/features/scraper/test-scraper.ts https://tabelog.com/tokyo/A1309/A130905/13315562/
 */

import { scrapeTabelogStore } from "./worker";

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("使用方法:");
    console.log("  tsx src/features/scraper/test-scraper.ts <URL>");
    console.log("");
    console.log("例:");
    console.log("  tsx src/features/scraper/test-scraper.ts https://tabelog.com/tokyo/A1309/A130905/13315562/");
    process.exit(1);
  }

  const url = args[0];

  console.log(`🔍 スクレイピング開始: ${url}`);
  console.log("");

  try {
    const result = await scrapeTabelogStore(url);

    console.log("✅ スクレイピング結果:");
    console.log("");
    console.log(JSON.stringify(result, null, 2));
    console.log("");

    // 期待される結果との比較
    if (url.includes("13315562")) {
      const expectedAddress = "東京都新宿区神楽坂6-21 NEO神楽坂 2F-3";
      console.log("📋 検証:");
      console.log(`  期待される住所: ${expectedAddress}`);
      console.log(`  取得した住所: ${result.address || "(取得できませんでした)"}`);
      
      if (result.address && result.address.includes("東京都新宿区神楽坂")) {
        console.log("  ✅ 住所が正しく取得できました！");
      } else {
        console.log("  ⚠️  住所が期待通りに取得できていません");
      }
    }
  } catch (error) {
    console.error("❌ エラー:", error);
    process.exit(1);
  }
}

main();

