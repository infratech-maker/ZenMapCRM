/**
 * リードデータインポートスクリプト
 * 
 * 既存のリストデータを leads テーブルにインポートします
 * 
 * 使用方法:
 *   tsx scripts/import-leads.ts <ファイルパス> [--format csv|json]
 * 
 * 例:
 *   tsx scripts/import-leads.ts data/leads.csv --format csv
 *   tsx scripts/import-leads.ts data/leads.json --format json
 */

import { config } from "dotenv";
import { resolve } from "path";

// .env.localから環境変数を読み込む
config({ path: resolve(__dirname, "../.env.local") });

import { db } from "../src/lib/db";
import { leads } from "../src/lib/db/schema";
import { withTenant } from "../src/lib/db/tenant-helper";
import * as fs from "fs";
import * as path from "path";

// CSV形式のデータをパース
function parseCSV(csvContent: string): Array<Record<string, string>> {
  const lines = csvContent.trim().split("\n");
  if (lines.length === 0) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    rows.push(row);
  }

  return rows;
}

// JSON形式のデータをパース
function parseJSON(jsonContent: string): Array<Record<string, any>> {
  return JSON.parse(jsonContent);
}

// リードデータをインポート
async function importLeads(
  data: Array<Record<string, any>>,
  source: string = "import"
) {
  return await withTenant(async (tenantId) => {
    const importedLeads = [];

    for (const row of data) {
      try {
        // データの正規化
        // CSVの場合、列名に応じてマッピング
        // JSONの場合、そのまま使用
        const leadData = {
          // 必須フィールド
          source: row.source || row.url || row.website || source,
          data: row.data || row, // データ全体をJSONBとして保存
          status: row.status || "new",
          notes: row.notes || row.note || null,
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
      } catch (error) {
        console.error(`Error importing row:`, row, error);
      }
    }

    return importedLeads;
  });
}

// メイン処理
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("使用方法:");
    console.log("  tsx scripts/import-leads.ts <ファイルパス> [--format csv|json]");
    console.log("");
    console.log("例:");
    console.log("  tsx scripts/import-leads.ts data/leads.csv --format csv");
    console.log("  tsx scripts/import-leads.ts data/leads.json --format json");
    process.exit(1);
  }

  const filePath = args[0];
  const formatIndex = args.indexOf("--format");
  const format = formatIndex !== -1 ? args[formatIndex + 1] : path.extname(filePath).slice(1);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ ファイルが見つかりません: ${filePath}`);
    process.exit(1);
  }

  console.log(`📂 ファイルを読み込み中: ${filePath}`);
  const fileContent = fs.readFileSync(filePath, "utf-8");

  let data: Array<Record<string, any>>;

  try {
    if (format === "csv" || filePath.endsWith(".csv")) {
      console.log("📊 CSV形式として解析中...");
      data = parseCSV(fileContent);
    } else if (format === "json" || filePath.endsWith(".json")) {
      console.log("📊 JSON形式として解析中...");
      data = parseJSON(fileContent);
      // JSONが配列でない場合、配列に変換
      if (!Array.isArray(data)) {
        data = [data];
      }
    } else {
      console.error(`❌ サポートされていない形式: ${format}`);
      console.log("サポートされている形式: csv, json");
      process.exit(1);
    }

    console.log(`✅ ${data.length}件のレコードを読み込みました`);

    console.log("💾 データベースにインポート中...");
    const importedLeads = await importLeads(data, filePath);

    console.log(`✅ ${importedLeads.length}件のリードをインポートしました`);
    console.log("");
    console.log("インポートされたリードID:");
    importedLeads.forEach((lead, index) => {
      console.log(`  ${index + 1}. ${lead.id} - ${lead.source}`);
    });
  } catch (error) {
    console.error("❌ インポートエラー:", error);
    process.exit(1);
  }
}

main();

