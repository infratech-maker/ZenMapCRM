import { config } from "dotenv";
import { resolve } from "path";

// 環境変数の読み込み (.env.local)
config({ path: resolve(__dirname, "../.env.local") });

import { db } from "../src/lib/db";
import { leads } from "../src/lib/db/schema";
import { withTenant } from "../src/lib/db/tenant-helper";
import { scrapeTabelogStore } from "../src/features/scraper/worker"; // Workerの関数を再利用
import { eq } from "drizzle-orm";

type LeadRow = {
  id: string;
  source: string;
  data: any;
};

const BATCH_SIZE = 5; // API負荷軽減のため少なめに
const DELAY_MS = 2000; // スクレイピングマナーとして待機時間を確保

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 「駅 691m / …」のようなアクセス形式かどうか判定するロジック
function isAccessLikeAddress(address: string | null | undefined): boolean {
  if (!address) return false;
  // 数字+m や "/" が含まれる場合はアクセス情報とみなす
  return /駅\s*\d+m\s*\/.*|m\s*\/.*|徒歩/.test(address);
}

async function updateTabelogLeads() {
  // テナントコンテキストを解決してDB操作を行う
  await withTenant(async () => {
    console.log("🔍 既存Tabelogリードを取得中...");

    // 全リード取得（件数が多い場合は本来limitを入れるべきだが、今回は全件処理）
    const existingLeads = (await db
      .select({
        id: leads.id,
        source: leads.source,
        data: leads.data,
      })
      .from(leads)) as LeadRow[];

    // 食べログのソースを持つものだけフィルタリング
    const tabelogLeads = existingLeads.filter(
      (lead) => lead.source && lead.source.includes("tabelog.com")
    );

    console.log(`✅ 対象件数: ${tabelogLeads.length}件`);

    let processed = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < tabelogLeads.length; i++) {
      const lead = tabelogLeads[i];
      processed++;

      const data = lead.data || {};
      // 現在の住所らしき値を取得
      const currentAddress: string | null =
        data.address || data.住所 || data.location || null;

      // 既に「東京都...」のような正しい住所が入っていればスキップ（再実行時のため）
      if (
        currentAddress &&
        !isAccessLikeAddress(currentAddress) &&
        currentAddress.startsWith("東京")
      ) {
        // console.log(`  ⏭️ スキップ (既に正しい住所): ${currentAddress}`);
        skipped++;
        continue;
      }

      try {
        console.log(
          `📡 [${processed}/${tabelogLeads.length}] 再取得中: ${lead.source}`
        );

        // Workerの関数を直接呼んでスクレイピング実行
        const result = await scrapeTabelogStore(lead.source);

        if (!result.address) {
          console.warn("  ⚠️ 住所が取得できませんでした。");
          skipped++;
          continue;
        }

        // データを更新（古い住所は access に退避）
        const newData = {
          ...data,
          address: result.address, // 正しい住所
          access: currentAddress || data.access, // 元の値をaccessに移動
          category: result.category || data.category,
        };

        await db
          .update(leads)
          .set({ data: newData })
          .where(eq(leads.id, lead.id));

        updated++;
        console.log(`  ✅ 更新: ${result.address}`);
      } catch (error) {
        errors++;
        console.error(`  ❌ エラー: ${lead.source}`, error);
      }

      // 負荷対策のウェイト
      await sleep(DELAY_MS);

      // バッチごとに進捗ログを出す（オプション）
      if (processed % BATCH_SIZE === 0) {
        console.log(
          `--- 進捗: ${processed}/${tabelogLeads.length}件 (更新: ${updated}, スキップ: ${skipped}, エラー: ${errors}) ---`
        );
      }
    }

    console.log("\n🎉 処理完了");
    console.log(
      `総件数: ${tabelogLeads.length}, 更新: ${updated}, スキップ: ${skipped}, エラー: ${errors}`
    );
  });
}

// 実行
updateTabelogLeads()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

import { config } from "dotenv";
import { resolve } from "path";

// 環境変数の読み込み (.env.local)
config({ path: resolve(__dirname, "../.env.local") });

import { db } from "../src/lib/db";
import { leads } from "../src/lib/db/schema";
import { withTenant } from "../src/lib/db/tenant-helper";
import { scrapeTabelogStore } from "../src/features/scraper/worker"; // Workerの関数を再利用
import { eq } from "drizzle-orm";

type LeadRow = {
  id: string;
  source: string;
  data: any;
};

const BATCH_SIZE = 5; // API負荷軽減のため少なめに
const DELAY_MS = 2000; // スクレイピングマナーとして待機時間を確保

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 「駅 691m / …」のようなアクセス形式かどうか判定するロジック
function isAccessLikeAddress(address: string | null | undefined): boolean {
  if (!address) return false;
  // 数字+m や "/" が含まれる場合はアクセス情報とみなす
  return /駅\s*\d+m\s*\/.*|m\s*\/.*|徒歩/.test(address);
}

async function updateTabelogLeads() {
  // テナントコンテキストを解決してDB操作を行う
  await withTenant(async () => {
    console.log("🔍 既存Tabelogリードを取得中...");

    // 全リード取得（件数が多い場合は本来limitを入れるべきだが、今回は全件処理）
    const existingLeads = (await db
      .select({
        id: leads.id,
        source: leads.source,
        data: leads.data,
      })
      .from(leads)) as LeadRow[];

    // 食べログのソースを持つものだけフィルタリング
    const tabelogLeads = existingLeads.filter(
      (lead) => lead.source && lead.source.includes("tabelog.com")
    );

    console.log(`✅ 対象件数: ${tabelogLeads.length}件`);

    let processed = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < tabelogLeads.length; i++) {
      const lead = tabelogLeads[i];
      processed++;

      const data = lead.data || {};
      // 現在の住所らしき値を取得
      const currentAddress: string | null =
        data.address || data.住所 || data.location || null;

      // 既に「東京都...」のような正しい住所が入っていればスキップ（再実行時のため）
      if (
        currentAddress &&
        !isAccessLikeAddress(currentAddress) &&
        currentAddress.startsWith("東京")
      ) {
        // console.log(`  ⏭️ スキップ (既に正しい住所): ${currentAddress}`);
        skipped++;
        continue;
      }

      try {
        console.log(
          `📡 [${processed}/${tabelogLeads.length}] 再取得中: ${lead.source}`
        );

        // Workerの関数を直接呼んでスクレイピング実行
        const result = await scrapeTabelogStore(lead.source);

        if (!result.address) {
          console.warn("  ⚠️ 住所が取得できませんでした。");
          skipped++;
          continue;
        }

        // データを更新（古い住所は access に退避）
        const newData = {
          ...data,
          address: result.address, // 正しい住所
          access: currentAddress || data.access, // 元の値をaccessに移動
          category: result.category || data.category,
        };

        await db
          .update(leads)
          .set({ data: newData })
          .where(eq(leads.id, lead.id));

        updated++;
        console.log(`  ✅ 更新: ${result.address}`);
      } catch (error) {
        errors++;
        console.error(`  ❌ エラー: ${lead.source}`, error);
      }

      // 負荷対策のウェイト
      await sleep(DELAY_MS);

      // バッチごとに進捗ログを出す（オプション）
      if (processed % BATCH_SIZE === 0) {
        console.log(
          `--- 進捗: ${processed}/${tabelogLeads.length}件 (更新: ${updated}, スキップ: ${skipped}, エラー: ${errors}) ---`
        );
      }
    }

    console.log("\n🎉 処理完了");
    console.log(
      `総件数: ${tabelogLeads.length}, 更新: ${updated}, スキップ: ${skipped}, エラー: ${errors}`
    );
  });
}

// 実行
updateTabelogLeads()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

import { config } from "dotenv";
import { resolve } from "path";

// 環境変数の読み込み (.env.local)
config({ path: resolve(__dirname, "../.env.local") });

import { db } from "../src/lib/db";
import { leads } from "../src/lib/db/schema";
import { withTenant } from "../src/lib/db/tenant-helper";
import { scrapeTabelogStore } from "../src/features/scraper/worker"; // Workerの関数を再利用
import { eq } from "drizzle-orm";

type LeadRow = {
  id: string;
  source: string;
  data: any;
};

const BATCH_SIZE = 5; // API負荷軽減のため少なめに
const DELAY_MS = 2000; // スクレイピングマナーとして待機時間を確保

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 「駅 691m / …」のようなアクセス形式かどうか判定するロジック
function isAccessLikeAddress(address: string | null | undefined): boolean {
  if (!address) return false;
  // 数字+m や "/" が含まれる場合はアクセス情報とみなす
  return /駅\s*\d+m\s*\/.*|m\s*\/.*|徒歩/.test(address);
}

async function updateTabelogLeads() {
  // テナントコンテキストを解決してDB操作を行う
  await withTenant(async () => {
    console.log("🔍 既存Tabelogリードを取得中...");

    // 全リード取得（件数が多い場合は本来limitを入れるべきだが、今回は全件処理）
    const existingLeads = (await db
      .select({
        id: leads.id,
        source: leads.source,
        data: leads.data,
      })
      .from(leads)) as LeadRow[];

    // 食べログのソースを持つものだけフィルタリング
    const tabelogLeads = existingLeads.filter(
      (lead) => lead.source && lead.source.includes("tabelog.com")
    );

    console.log(`✅ 対象件数: ${tabelogLeads.length}件`);

    let processed = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < tabelogLeads.length; i++) {
      const lead = tabelogLeads[i];
      processed++;

      const data = lead.data || {};
      // 現在の住所らしき値を取得
      const currentAddress: string | null =
        data.address || data.住所 || data.location || null;

      // 既に「東京都...」のような正しい住所が入っていればスキップ（再実行時のため）
      if (
        currentAddress &&
        !isAccessLikeAddress(currentAddress) &&
        currentAddress.startsWith("東京")
      ) {
        // console.log(`  ⏭️ スキップ (既に正しい住所): ${currentAddress}`);
        skipped++;
        continue;
      }

      try {
        console.log(
          `📡 [${processed}/${tabelogLeads.length}] 再取得中: ${lead.source}`
        );

        // Workerの関数を直接呼んでスクレイピング実行
        const result = await scrapeTabelogStore(lead.source);

        if (!result.address) {
          console.warn("  ⚠️ 住所が取得できませんでした。");
          skipped++;
          continue;
        }

        // データを更新（古い住所は access に退避）
        const newData = {
          ...data,
          address: result.address, // 正しい住所
          access: currentAddress || data.access, // 元の値をaccessに移動
          category: result.category || data.category,
        };

        await db
          .update(leads)
          .set({ data: newData })
          .where(eq(leads.id, lead.id));

        updated++;
        console.log(`  ✅ 更新: ${result.address}`);
      } catch (error) {
        errors++;
        console.error(`  ❌ エラー: ${lead.source}`, error);
      }

      // 負荷対策のウェイト
      await sleep(DELAY_MS);

      // バッチごとに進捗ログを出す（オプション）
      if (processed % BATCH_SIZE === 0) {
        console.log(
          `--- 進捗: ${processed}/${tabelogLeads.length}件 (更新: ${updated}, スキップ: ${skipped}, エラー: ${errors}) ---`
        );
      }
    }

    console.log("\n🎉 処理完了");
    console.log(
      `総件数: ${tabelogLeads.length}, 更新: ${updated}, スキップ: ${skipped}, エラー: ${errors}`
    );
  });
}

// 実行
updateTabelogLeads()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

/**
 * 既存のTabelogリードの住所を再取得して更新するスクリプト
 *
 * 使用例:
 *   tsx scripts/update-tabelog-leads.ts
 *
 * 注意:
 * - Playwright を使用するため、事前に `npx playwright install chromium` が必要です
 * - 1200件程度のデータで数分〜十数分かかる可能性があります
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

import { db } from "../src/lib/db";
import { leads } from "../src/lib/db/schema";
import { withTenant } from "../src/lib/db/tenant-helper";
import { scrapeTabelogStore } from "../src/features/scraper/worker";
import { eq } from "drizzle-orm";

type LeadRow = {
  id: string;
  source: string;
  data: any;
};

const BATCH_SIZE = 25;
const DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 既存の住所が「駅 距離 / …」形式かどうかを判定（簡易）
function isAccessLikeAddress(address: string | null | undefined): boolean {
  if (!address) return false;
  // 「駅」「m /」などが含まれている場合をアクセス情報とみなす
  return /駅\s*\d+m\s*\/.*/.test(address) || /m\s*\/.*/.test(address);
}

async function updateTabelogLeads() {
  await withTenant(async (tenantId) => {
    console.log("🔍 既存Tabelogリードを取得中...");

    const existingLeads = (await db
      .select({
        id: leads.id,
        source: leads.source,
        data: leads.data,
      })
      .from(leads)) as LeadRow[];

    const tabelogLeads = existingLeads.filter((lead) =>
      lead.source.includes("tabelog.com")
    );

    console.log(
      `✅ Tabelogリード: ${tabelogLeads.length}件（テナント: ${tenantId}）`
    );

    let processed = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < tabelogLeads.length; i++) {
      const lead = tabelogLeads[i];
      processed++;

      const data = lead.data || {};
      const currentAddress: string | null =
        data.address || data.住所 || data.location || null;

      // 既に「東京都」などから始まる住所が入っている場合はスキップ
      if (currentAddress && !isAccessLikeAddress(currentAddress)) {
        skipped++;
        if (processed % 100 === 0) {
          console.log(
            `  ↪ Skipped (already ok) ${processed}/${tabelogLeads.length}`
          );
        }
        continue;
      }

      try {
        console.log(
          `📡 [${processed}/${tabelogLeads.length}] 再スクレイピング: ${lead.source}`
        );
        const result = await scrapeTabelogStore(lead.source);

        if (!result.address) {
          console.warn("  ⚠️ 住所が取得できませんでした。スキップします。");
          skipped++;
          continue;
        }

        const newData = {
          ...data,
          address: result.address,
          // 以前の「駅 距離 / ...」形式の値を access として保存（あれば）
          access: currentAddress || data.access || null,
          // カテゴリも更新できる場合は更新
          category: result.category || data.category || null,
        };

        await db
          .update(leads)
          .set({
            data: newData,
          })
          .where(eq(leads.id, lead.id));

        updated++;
        console.log(
          `  ✅ 更新完了: ${lead.id} -> ${result.address} (アクセス: ${currentAddress || "-"
          })`
        );
      } catch (error) {
        errors++;
        console.error(
          `  ❌ エラー (id=${lead.id}, source=${lead.source}):`,
          error
        );
      }

      // レートリミット回避のため少し待機
      if (i < tabelogLeads.length - 1) {
        await sleep(DELAY_MS);
      }

      // バッチごとに進捗表示
      if (processed % BATCH_SIZE === 0) {
        console.log(
          `--- 進捗: ${processed}/${tabelogLeads.length}件 処理済み (更新: ${updated}, スキップ: ${skipped}, エラー: ${errors}) ---`
        );
      }
    }

    console.log("");
    console.log("🎉 更新完了");
    console.log(`  総件数:   ${tabelogLeads.length}`);
    console.log(`  更新:     ${updated}`);
    console.log(`  スキップ: ${skipped}`);
    console.log(`  エラー:   ${errors}`);
  });
}

updateTabelogLeads()
  .then(() => {
    console.log("✅ スクリプト完了");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ スクリプトエラー:", error);
    process.exit(1);
  });

/**
 * 既存のTabelogリードの住所を再取得して更新するスクリプト
 *
 * 使用例:
 *   tsx scripts/update-tabelog-leads.ts
 *
 * 注意:
 * - Playwright を使用するため、事前に `npx playwright install chromium` が必要です
 * - 1200件程度のデータで数分〜十数分かかる可能性があります
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

import { db } from "../src/lib/db";
import { leads } from "../src/lib/db/schema";
import { withTenant } from "../src/lib/db/tenant-helper";
import { scrapeTabelogStore } from "../src/features/scraper/worker";
import { eq } from "drizzle-orm";

type LeadRow = {
  id: string;
  source: string;
  data: any;
};

const BATCH_SIZE = 25;
const DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 既存の住所が「駅 距離 / ...」形式かどうかを判定（簡易）
function isAccessLikeAddress(address: string | null | undefined): boolean {
  if (!address) return false;
  // 「駅」「m /」などが含まれている場合をアクセス情報とみなす
  return /駅\s*\d+m\s*\/.*/.test(address) || /m\s*\/.*/.test(address);
}

async function updateTabelogLeads() {
  await withTenant(async (tenantId) => {
    console.log("🔍 既存Tabelogリードを取得中...");

    const existingLeads = (await db
      .select({
        id: leads.id,
        source: leads.source,
        data: leads.data,
      })
      .from(leads)) as LeadRow[];

    const tabelogLeads = existingLeads.filter((lead) =>
      lead.source.includes("tabelog.com")
    );

    console.log(
      `✅ Tabelogリード: ${tabelogLeads.length}件（テナント: ${tenantId}）`
    );

    let processed = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < tabelogLeads.length; i++) {
      const lead = tabelogLeads[i];
      processed++;

      const data = lead.data || {};
      const currentAddress: string | null =
        data.address || data.住所 || data.location || null;

      // 既に「東京都」などから始まる住所が入っている場合はスキップ
      if (currentAddress && !isAccessLikeAddress(currentAddress)) {
        skipped++;
        if (processed % 100 === 0) {
          console.log(
            `  ↪ Skipped (already ok) ${processed}/${tabelogLeads.length}`
          );
        }
        continue;
      }

      try {
        console.log(
          `📡 [${processed}/${tabelogLeads.length}] 再スクレイピング: ${lead.source}`
        );
        const result = await scrapeTabelogStore(lead.source);

        if (!result.address) {
          console.warn("  ⚠️ 住所が取得できませんでした。スキップします。");
          skipped++;
          continue;
        }

        const newData = {
          ...data,
          address: result.address,
          // 以前の「駅 距離 / ...」形式の値を access として保存（あれば）
          access: currentAddress || data.access || null,
          // カテゴリも更新できる場合は更新
          category: result.category || data.category || null,
        };

        await db
          .update(leads)
          .set({
            data: newData,
          })
          .where(eq(leads.id, lead.id));

        updated++;
        console.log(
          `  ✅ 更新完了: ${lead.id} -> ${result.address} (アクセス: ${currentAddress || "-"
          })`
        );
      } catch (error) {
        errors++;
        console.error(
          `  ❌ エラー (id=${lead.id}, source=${lead.source}):`,
          error
        );
      }

      // レートリミット回避のため少し待機
      if (i < tabelogLeads.length - 1) {
        await sleep(DELAY_MS);
      }

      // バッチごとに進捗表示
      if (processed % BATCH_SIZE === 0) {
        console.log(
          `--- 進捗: ${processed}/${tabelogLeads.length}件 処理済み (更新: ${updated}, スキップ: ${skipped}, エラー: ${errors}) ---`
        );
      }
    }

    console.log("");
    console.log("🎉 更新完了");
    console.log(`  総件数:   ${tabelogLeads.length}`);
    console.log(`  更新:     ${updated}`);
    console.log(`  スキップ: ${skipped}`);
    console.log(`  エラー:   ${errors}`);
  });
}

updateTabelogLeads()
  .then(() => {
    console.log("✅ スクリプト完了");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ スクリプトエラー:", error);
    process.exit(1);
  });


