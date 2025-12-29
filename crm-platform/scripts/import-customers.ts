/**
 * 顧客データインポートスクリプト
 * 
 * 既存のリストデータを customers テーブルにインポートします
 * 
 * 使用方法:
 *   tsx scripts/import-customers.ts <ファイルパス> [--format csv|json]
 * 
 * 例:
 *   tsx scripts/import-customers.ts data/customers.csv --format csv
 *   tsx scripts/import-customers.ts data/customers.json --format json
 */

import { config } from "dotenv";
import { resolve } from "path";

// .env.localから環境変数を読み込む
config({ path: resolve(__dirname, "../.env.local") });

import { db } from "../src/lib/db";
import { customers } from "../src/lib/db/schema";
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

// 顧客データをインポート
async function importCustomers(
  data: Array<Record<string, any>>,
  source: string = "import"
) {
  return await withTenant(async (tenantId) => {
    const importedCustomers = [];

    for (const row of data) {
      try {
        // データの正規化
        const customerData = {
          phoneNumber: row.phone_number || row.phoneNumber || row.phone || row.tel || null,
          email: row.email || row.mail || null,
          name: row.name || row.氏名 || row.名前 || null,
          status: row.status || "lead",
          source: row.source || source,
          notes: row.notes || row.note || row.備考 || null,
          tags: row.tags ? (Array.isArray(row.tags) ? row.tags : row.tags.split(",")) : null,
        };

        // 電話番号またはメールアドレスが必須
        if (!customerData.phoneNumber && !customerData.email) {
          console.warn(`⚠️  スキップ: 電話番号またはメールアドレスが必要です`, row);
          continue;
        }

        // 顧客を挿入
        const [customer] = await db
          .insert(customers)
          .values({
            tenantId: tenantId,
            phoneNumber: customerData.phoneNumber,
            email: customerData.email,
            name: customerData.name,
            status: customerData.status as any,
            source: customerData.source,
            notes: customerData.notes,
            tags: customerData.tags,
          })
          .returning();

        importedCustomers.push(customer);
      } catch (error) {
        console.error(`❌ エラー:`, row, error);
      }
    }

    return importedCustomers;
  });
}

// メイン処理
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log("使用方法:");
    console.log("  tsx scripts/import-customers.ts <ファイルパス> [--format csv|json]");
    console.log("");
    console.log("例:");
    console.log("  tsx scripts/import-customers.ts data/customers.csv --format csv");
    console.log("  tsx scripts/import-customers.ts data/customers.json --format json");
    console.log("");
    console.log("CSV形式の例:");
    console.log("  phone_number,email,name,status,notes");
    console.log("  09012345678,test@example.com,山田太郎,lead,備考");
    console.log("");
    console.log("JSON形式の例:");
    console.log('  [{"phone_number":"09012345678","email":"test@example.com","name":"山田太郎","status":"lead"}]');
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
    const importedCustomers = await importCustomers(data, filePath);

    console.log(`✅ ${importedCustomers.length}件の顧客をインポートしました`);
    console.log("");
    console.log("インポートされた顧客ID:");
    importedCustomers.forEach((customer, index) => {
      console.log(`  ${index + 1}. ${customer.id} - ${customer.name || customer.phoneNumber || customer.email}`);
    });
  } catch (error) {
    console.error("❌ インポートエラー:", error);
    process.exit(1);
  }
}

main();

