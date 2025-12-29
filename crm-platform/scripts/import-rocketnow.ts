import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync, existsSync } from "fs";

// 環境変数の読み込み (.env.local)
config({ path: resolve(__dirname, "../.env.local") });

import { db } from "../src/lib/db";
import { leads } from "../src/lib/db/schema";
import { withTenant } from "../src/lib/db/tenant-helper";
import { eq, sql, and, inArray } from "drizzle-orm";

/**
 * ロケットナウの店舗データ型定義
 */
interface RocketNowStore {
  id?: string;
  name: string;
  address?: string;
  phone?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  description?: string;
  [key: string]: any; // その他のフィールド
}

/**
 * ロケットナウのデータ構造をleadsテーブルの形式にマッピング
 */
function mapRocketNowToLead(store: RocketNowStore): {
  source: string;
  data: any;
} {
  // sourceフィールド: ロケットナウの店舗IDまたは名前+住所で一意のURLを生成
  const storeId = store.id || `${store.name}-${store.address || "unknown"}`.replace(/\s+/g, "-");
  const source = `rocketnow://${storeId}`;

  // dataフィールド: leadsテーブルのJSONB構造に合わせてマッピング
  const data: any = {
    name: store.name || null,
    address: store.address || null,
    phone: store.phone || null,
    category: store.category || null,
    latitude: store.latitude || null,
    longitude: store.longitude || null,
    rating: store.rating || null,
    description: store.description || null,
    source_type: "rocketnow", // ソースタイプを記録
  };

  // その他のフィールドがあれば追加
  Object.keys(store).forEach((key) => {
    if (!["id", "name", "address", "phone", "category", "latitude", "longitude", "rating", "description"].includes(key)) {
      data[key] = store[key];
    }
  });

  return { source, data };
}

/**
 * 重複判定: 店舗IDまたは名前+住所で判定
 */
function getStoreKey(store: RocketNowStore): string {
  if (store.id) {
    return `id:${store.id}`;
  }
  // 名前+住所で一意性を確保
  const name = (store.name || "").trim().toLowerCase();
  const address = (store.address || "").trim().toLowerCase();
  return `name_address:${name}|${address}`;
}

/**
 * ロケットナウの店舗データをDBに登録
 * 
 * @param stores 店舗データの配列
 * @param filePath JSONファイルのパス（オプション）
 */
async function importRocketNowStores(
  stores?: RocketNowStore[],
  filePath?: string
) {
  const startTime = Date.now();

  await withTenant(async (tenantId) => {
    console.log("🚀 ロケットナウの店舗データをインポート中...");

    let storeData: RocketNowStore[] = [];

    // データソースの確認
    if (stores && Array.isArray(stores)) {
      // 引数で直接配列を受け取った場合
      storeData = stores;
      console.log(`📊 引数から ${storeData.length}件のデータを受け取りました`);
    } else if (filePath && existsSync(filePath)) {
      // JSONファイルから読み込む場合
      try {
        const fileContent = readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(fileContent);
        
        // 配列かオブジェクトかを判定
        if (Array.isArray(parsed)) {
          storeData = parsed;
        } else if (parsed.stores && Array.isArray(parsed.stores)) {
          storeData = parsed.stores;
        } else if (parsed.data && Array.isArray(parsed.data)) {
          storeData = parsed.data;
        } else {
          // オブジェクトの場合は配列に変換
          storeData = [parsed];
        }
        
        console.log(`📄 JSONファイルから ${storeData.length}件のデータを読み込みました: ${filePath}`);
      } catch (error) {
        console.error(`❌ JSONファイルの読み込みエラー: ${filePath}`, error);
        throw error;
      }
    } else {
      throw new Error("店舗データまたはJSONファイルのパスを指定してください");
    }

    if (storeData.length === 0) {
      console.log("⚠️ インポートするデータがありません");
      return;
    }

    // データをマッピング
    const mappedData = storeData.map((store) => ({
      ...mapRocketNowToLead(store),
      storeKey: getStoreKey(store),
      originalStore: store,
    }));

    console.log(`📝 ${mappedData.length}件のデータをマッピングしました`);

    // 既存のリードをチェック（重複判定）
    console.log("🔍 既存リードとの重複チェック中...");
    
    const existingSources = mappedData.map((m) => m.source);
    const existingLeads = existingSources.length > 0
      ? await db
          .select({ source: leads.source, data: leads.data })
          .from(leads)
          .where(
            and(
              eq(leads.tenantId, tenantId),
              inArray(leads.source, existingSources)
            )
          )
      : [];

    const existingSourceSet = new Set(existingLeads.map((lead) => lead.source));

    // 重複判定: 名前+住所でもチェック（sourceが異なる場合）
    const existingNameAddressSet = new Set<string>();
    for (const lead of existingLeads) {
      const data = lead.data as any;
      if (data.name && data.address) {
        const key = `name_address:${(data.name || "").trim().toLowerCase()}|${(data.address || "").trim().toLowerCase()}`;
        existingNameAddressSet.add(key);
      }
    }

    // 新規データと更新データを分離
    const newData: typeof mappedData = [];
    const updateData: typeof mappedData = [];

    for (const mapped of mappedData) {
      if (existingSourceSet.has(mapped.source)) {
        // sourceが一致する場合は更新対象
        updateData.push(mapped);
      } else if (existingNameAddressSet.has(mapped.storeKey)) {
        // 名前+住所が一致する場合も更新対象（sourceが異なる可能性がある）
        updateData.push(mapped);
      } else {
        // 新規データ
        newData.push(mapped);
      }
    }

    console.log(`  ✅ 新規: ${newData.length}件, 更新: ${updateData.length}件, 既存: ${existingLeads.length}件`);

    let inserted = 0;
    let updated = 0;
    let errors = 0;

    // 新規データの挿入
    if (newData.length > 0) {
      console.log(`📥 新規データ ${newData.length}件を挿入中...`);
      
      const BATCH_SIZE = 50;
      for (let i = 0; i < newData.length; i += BATCH_SIZE) {
        const batch = newData.slice(i, i + BATCH_SIZE);
        
        try {
          await db.insert(leads).values(
            batch.map((mapped) => ({
              tenantId: tenantId,
              source: mapped.source,
              data: mapped.data,
              status: "new",
            }))
          );
          inserted += batch.length;
        } catch (error) {
          console.error(`❌ バッチ挿入エラー (${i}-${i + batch.length}):`, error);
          // バッチ挿入に失敗した場合、個別に挿入を試みる
          for (const mapped of batch) {
            try {
              await db.insert(leads).values({
                tenantId: tenantId,
                source: mapped.source,
                data: mapped.data,
                status: "new",
              });
              inserted++;
            } catch (individualError) {
              console.error(`❌ 個別挿入エラー: ${mapped.source}`, individualError);
              errors++;
            }
          }
        }
      }
    }

    // 既存データの更新（upsert）
    if (updateData.length > 0) {
      console.log(`🔄 既存データ ${updateData.length}件を更新中...`);
      
      for (const mapped of updateData) {
        try {
          // sourceで検索
          const existingLead = await db
            .select()
            .from(leads)
            .where(
              and(
                eq(leads.tenantId, tenantId),
                eq(leads.source, mapped.source)
              )
            )
            .limit(1);

          if (existingLead.length > 0) {
            // 既存レコードを更新
            await db
              .update(leads)
              .set({
                data: mapped.data,
                updatedAt: new Date(),
              })
              .where(eq(leads.id, existingLead[0].id));
            updated++;
          } else {
            // sourceが一致しないが、名前+住所が一致する場合
            // 名前+住所で検索
            const nameAddressLeads = await db
              .select()
              .from(leads)
              .where(
                and(
                  eq(leads.tenantId, tenantId),
                  sql`${leads.data}->>'name' = ${mapped.data.name}`,
                  sql`${leads.data}->>'address' = ${mapped.data.address}`
                )
              )
              .limit(1);

            if (nameAddressLeads.length > 0) {
              // 既存レコードを更新（sourceも更新）
              await db
                .update(leads)
                .set({
                  source: mapped.source,
                  data: mapped.data,
                  updatedAt: new Date(),
                })
                .where(eq(leads.id, nameAddressLeads[0].id));
              updated++;
            } else {
              // 見つからない場合は新規挿入
              await db.insert(leads).values({
                tenantId: tenantId,
                source: mapped.source,
                data: mapped.data,
                status: "new",
              });
              inserted++;
            }
          }
        } catch (error) {
          console.error(`❌ 更新エラー: ${mapped.source}`, error);
          errors++;
        }
      }
    }

    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime % 60;

    console.log("\n🎉 処理完了");
    console.log(`新規挿入: ${inserted}件`);
    console.log(`更新: ${updated}件`);
    console.log(`エラー: ${errors}件`);
    console.log(`処理時間: ${minutes}分${seconds}秒`);
  });
}

// 実行
// コマンドライン引数からJSONファイルパスを取得
const filePath = process.argv[2];

if (filePath) {
  // JSONファイルから読み込む
  importRocketNowStores(undefined, filePath)
    .then(() => {
      console.log("✅ スクリプトが正常に完了しました");
      process.exit(0);
    })
    .catch((e) => {
      console.error("❌ スクリプトがエラーで終了しました:", e);
      process.exit(1);
    });
} else {
  // プログラムから直接データを渡す場合の例
  console.log("📝 使用方法:");
  console.log("  npx tsx scripts/import-rocketnow.ts <JSONファイルパス>");
  console.log("");
  console.log("例:");
  console.log("  npx tsx scripts/import-rocketnow.ts data/rocketnow-stores.json");
  process.exit(1);
}

