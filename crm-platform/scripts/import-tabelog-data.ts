/**
 * Tabelogデータインポートスクリプト
 * 
 * Tabelogから収集したJSONデータを leads テーブルにインポートします
 * 
 * 使用方法:
 *   tsx scripts/import-tabelog-data.ts <JSONファイルパス>
 * 
 * 例:
 *   tsx scripts/import-tabelog-data.ts ~/Desktop/名称未設定フォルダ/out/tabelog_東京.json
 */

import { config } from "dotenv";
import { resolve } from "path";

// .env.localから環境変数を読み込む
config({ path: resolve(__dirname, "../.env.local") });

import { db } from "../src/lib/db";
import { leads } from "../src/lib/db/schema";
import { withTenant } from "../src/lib/db/tenant-helper";
import * as fs from "fs";

interface TabelogStore {
  name?: string;
  tabelog_url?: string;
  url?: string;
  store_id?: string;
  address?: string;
  category?: string;
  phone?: string;
  phone_number?: string;
  city?: string;
  prefecture?: string;
  data_source?: string;
  collected_at?: string;
  opening_date?: string;
  [key: string]: any;
}

interface TabelogData {
  metadata?: {
    total_stores?: number;
    generated_at?: string;
    version?: string;
  };
  stores?: TabelogStore[];
}

// Tabelogデータをインポート
async function importTabelogData(filePath: string) {
  return await withTenant(async (tenantId) => {
    console.log(`📂 ファイルを読み込み中: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const tabelogData: TabelogData = JSON.parse(fileContent);

    const stores = tabelogData.stores || [];
    if (stores.length === 0) {
      console.log("⚠️  店舗データが見つかりませんでした");
      return [];
    }

    console.log(`✅ ${stores.length}件の店舗データを読み込みました`);

    const importedLeads = [];
    let successCount = 0;
    let errorCount = 0;

    console.log("💾 データベースにインポート中...");

    for (let i = 0; i < stores.length; i++) {
      const store = stores[i];
      
      try {
        // データの正規化
        const source = store.tabelog_url || store.url || filePath;
        const leadData = {
          source: source,
          data: {
            name: store.name,
            store_id: store.store_id,
            address: store.address,
            category: store.category,
            phone: store.phone || store.phone_number,
            city: store.city,
            prefecture: store.prefecture,
            url: store.tabelog_url || store.url,
            collected_at: store.collected_at || store.opening_date,
            data_source: store.data_source || "tabelog",
            // 元のデータをすべて保持
            ...store,
          },
          status: "new" as const,
          notes: `Tabelogデータ: ${store.city || store.prefecture || ""}`,
        };

        // リードを挿入
        const [lead] = await db
          .insert(leads)
          .values({
            tenantId: tenantId,
            source: leadData.source,
            data: leadData.data,
            status: leadData.status,
            notes: leadData.notes,
          })
          .returning();

        importedLeads.push(lead);
        successCount++;

        // 進捗表示（100件ごと）
        if ((i + 1) % 100 === 0) {
          console.log(`  進捗: ${i + 1}/${stores.length}件処理済み`);
        }
      } catch (error) {
        errorCount++;
        if (errorCount <= 5) {
          console.error(`❌ エラー (${i + 1}件目):`, store.name || store.store_id, error);
        }
      }
    }

    console.log("");
    console.log(`✅ インポート完了:`);
    console.log(`   成功: ${successCount}件`);
    console.log(`   エラー: ${errorCount}件`);
    console.log(`   合計: ${stores.length}件`);

    return importedLeads;
  });
}

// メイン処理
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("使用方法:");
    console.log("  tsx scripts/import-tabelog-data.ts <JSONファイルパス>");
    console.log("");
    console.log("例:");
    console.log("  tsx scripts/import-tabelog-data.ts ~/Desktop/名称未設定フォルダ/out/tabelog_東京.json");
    console.log("");
    console.log("複数ファイルをインポートする場合:");
    console.log("  for file in ~/Desktop/名称未設定フォルダ/out/tabelog_*.json; do");
    console.log("    tsx scripts/import-tabelog-data.ts \"$file\"");
    console.log("  done");
    process.exit(1);
  }

  const filePath = args[0];

  if (!fs.existsSync(filePath)) {
    console.error(`❌ ファイルが見つかりません: ${filePath}`);
    process.exit(1);
  }

  try {
    const importedLeads = await importTabelogData(filePath);
    
    if (importedLeads.length > 0) {
      console.log("");
      console.log("インポートされたリードID（最初の5件）:");
      importedLeads.slice(0, 5).forEach((lead, index) => {
        const data = lead.data as any;
        console.log(`  ${index + 1}. ${lead.id.slice(0, 8)}... - ${data.name || lead.source}`);
      });
    }
  } catch (error) {
    console.error("❌ インポートエラー:", error);
    process.exit(1);
  }
}

main();

