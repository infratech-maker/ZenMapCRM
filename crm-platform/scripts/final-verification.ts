import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { db } from "../src/lib/db";
import { leads } from "../src/lib/db/schema";
import { withTenant } from "../src/lib/db/tenant-helper";
import { sql, desc } from "drizzle-orm";

async function finalVerification() {
  await withTenant(async (tenantId) => {
    // 直近1時間以内のレコード数
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const recentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(sql`${leads.createdAt} > ${oneHourAgo.toISOString()}`);
    
    console.log(`\n📊 直近1時間以内の新規リード数: ${Number(recentCount[0]?.count || 0)}件\n`);
    
    // 詳細情報が充実しているレコードをサンプリング
    const leadsWithDetails = await db
      .select({
        id: leads.id,
        source: leads.source,
        data: leads.data,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .where(sql`${leads.createdAt} > ${oneHourAgo.toISOString()}`)
      .orderBy(desc(leads.createdAt))
      .limit(10);
    
    console.log(`📋 最新10件の詳細検証:\n`);
    
    let hasPhone = 0;
    let hasBusinessHours = 0;
    let hasBudget = 0;
    let hasTransport = 0;
    
    leadsWithDetails.forEach((lead, index) => {
      const data = lead.data as any;
      const phone = data?.phone;
      const businessHours = data?.business_hours;
      const budget = data?.budget;
      const transport = data?.transport;
      
      if (phone) hasPhone++;
      if (businessHours) hasBusinessHours++;
      if (budget) hasBudget++;
      if (transport) hasTransport++;
      
      console.log(`${index + 1}. ${data?.name || "-"}`);
      console.log(`   URL: ${lead.source}`);
      console.log(`   Phone: ${phone || "❌ null"}`);
      console.log(`   Business Hours: ${businessHours ? (businessHours.length > 30 ? businessHours.slice(0, 30) + "..." : businessHours) : "❌ null"}`);
      console.log(`   Budget: ${budget || "❌ null"}`);
      console.log(`   Transport: ${transport ? (transport.length > 20 ? transport.slice(0, 20) + "..." : transport) : "❌ null"}`);
      console.log(``);
    });
    
    console.log(`\n📈 データ充実度:`);
    console.log(`   電話番号あり: ${hasPhone}/${leadsWithDetails.length}件 (${Math.round(hasPhone/leadsWithDetails.length*100)}%)`);
    console.log(`   営業時間あり: ${hasBusinessHours}/${leadsWithDetails.length}件 (${Math.round(hasBusinessHours/leadsWithDetails.length*100)}%)`);
    console.log(`   予算あり: ${hasBudget}/${leadsWithDetails.length}件 (${Math.round(hasBudget/leadsWithDetails.length*100)}%)`);
    console.log(`   交通手段あり: ${hasTransport}/${leadsWithDetails.length}件 (${Math.round(hasTransport/leadsWithDetails.length*100)}%)`);
  });
}

finalVerification()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
