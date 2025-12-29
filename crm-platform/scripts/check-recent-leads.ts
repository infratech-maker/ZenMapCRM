import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { db } from "../src/lib/db";
import { leads } from "../src/lib/db/schema";
import { withTenant } from "../src/lib/db/tenant-helper";
import { sql, desc } from "drizzle-orm";

async function checkRecentLeads() {
  await withTenant(async (tenantId) => {
    // 直近1時間以内のレコード数をカウント
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const recentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(sql`${leads.createdAt} > ${oneHourAgo.toISOString()}`);
    
    console.log(`\n📊 直近1時間以内の新規リード数: ${Number(recentCount[0]?.count || 0)}件`);
    
    // 最新の5件をサンプリング
    const recentLeads = await db
      .select({
        id: leads.id,
        source: leads.source,
        data: leads.data,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .orderBy(desc(leads.createdAt))
      .limit(5);
    
    console.log(`\n📋 最新5件のサンプル:`);
    recentLeads.forEach((lead, index) => {
      const data = lead.data as any;
      console.log(`\n${index + 1}. ID: ${lead.id}`);
      console.log(`   Source: ${lead.source}`);
      console.log(`   Name: ${data?.name || "-"}`);
      console.log(`   Phone: ${data?.phone || "null"}`);
      console.log(`   Business Hours: ${data?.business_hours || "null"}`);
      console.log(`   Budget: ${data?.budget || "null"}`);
      console.log(`   Created At: ${lead.createdAt}`);
    });
  });
}

checkRecentLeads()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
