import { config } from "dotenv";
import { resolve } from "path";
import * as fs from "fs";

// .env.local から環境変数を読み込み
config({ path: resolve(__dirname, "../.env.local") });

import { db } from "../src/lib/db";
import { leads } from "../src/lib/db/schema";
import { withTenant } from "../src/lib/db/tenant-helper";

type LeadRow = {
  id: string;
  source: string;
  status: string;
  data: any;
  createdAt: Date | null;
  updatedAt: Date | null;
};

function toCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

async function exportLeadsToCsv() {
  await withTenant(async () => {
    console.log("🔍 leads を取得中...");

    const rows = (await db
      .select({
        id: leads.id,
        source: leads.source,
        status: leads.status,
        data: leads.data,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
      })
      .from(leads)) as LeadRow[];

    console.log(`✅ ${rows.length}件 取得`);

    const header = [
      "id",
      "source",
      "status",
      "name",
      "address",
      "access",
      "category",
      "city",
      "prefecture",
      "created_at",
      "updated_at",
    ];

    const lines: string[] = [header.join(",")];

    for (const row of rows) {
      const d = (row.data || {}) as any;

      const line = [
        toCsvValue(row.id),
        toCsvValue(row.source),
        toCsvValue(row.status),
        toCsvValue(d.name),
        toCsvValue(d.address),
        toCsvValue(d.access),
        toCsvValue(d.category),
        toCsvValue(d.city),
        toCsvValue(d.prefecture),
        toCsvValue(
          row.createdAt && (row.createdAt as any).toISOString
            ? (row.createdAt as any).toISOString()
            : row.createdAt
        ),
        toCsvValue(
          row.updatedAt && (row.updatedAt as any).toISOString
            ? (row.updatedAt as any).toISOString()
            : row.updatedAt
        ),
      ].join(",");

      lines.push(line);
    }

    const outPath = resolve(__dirname, "../data/leads-export.csv");
    fs.writeFileSync(outPath, lines.join("\n"), "utf-8");

    console.log(`📦 エクスポート完了: ${outPath}`);
  });
}

exportLeadsToCsv()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ エクスポートエラー:", e);
    process.exit(1);
  });

import { config } from "dotenv";
import { resolve } from "path";
import * as fs from "fs";

// .env.local から環境変数を読み込み
config({ path: resolve(__dirname, "../.env.local") });

import { db } from "../src/lib/db";
import { leads } from "../src/lib/db/schema";
import { withTenant } from "../src/lib/db/tenant-helper";

type LeadRow = {
  id: string;
  source: string;
  status: string;
  data: any;
  createdAt: Date | null;
  updatedAt: Date | null;
};

function toCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

async function exportLeadsToCsv() {
  await withTenant(async () => {
    console.log("🔍 leads を取得中...");

    const rows = (await db
      .select({
        id: leads.id,
        source: leads.source,
        status: leads.status,
        data: leads.data,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
      })
      .from(leads)) as LeadRow[];

    console.log(`✅ ${rows.length}件 取得`);

    const header = [
      "id",
      "source",
      "status",
      "name",
      "address",
      "access",
      "category",
      "city",
      "prefecture",
      "created_at",
      "updated_at",
    ];

    const lines: string[] = [header.join(",")];

    for (const row of rows) {
      const d = (row.data || {}) as any;

      const line = [
        toCsvValue(row.id),
        toCsvValue(row.source),
        toCsvValue(row.status),
        toCsvValue(d.name),
        toCsvValue(d.address),
        toCsvValue(d.access),
        toCsvValue(d.category),
        toCsvValue(d.city),
        toCsvValue(d.prefecture),
        toCsvValue(
          row.createdAt && (row.createdAt as any).toISOString
            ? (row.createdAt as any).toISOString()
            : row.createdAt
        ),
        toCsvValue(
          row.updatedAt && (row.updatedAt as any).toISOString
            ? (row.updatedAt as any).toISOString()
            : row.updatedAt
        ),
      ].join(",");

      lines.push(line);
    }

    const outPath = resolve(__dirname, "../data/leads-export.csv");
    fs.writeFileSync(outPath, lines.join("\n"), "utf-8");

    console.log(`📦 エクスポート完了: ${outPath}`);
  });
}

exportLeadsToCsv()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ エクスポートエラー:", e);
    process.exit(1);
  });


