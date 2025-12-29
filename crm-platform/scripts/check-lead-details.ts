import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { db } from "../src/lib/db";
import { leads } from "../src/lib/db/schema";
import { withTenant } from "../src/lib/db/tenant-helper";
import { desc } from "drizzle-orm";

async function checkLeadDetails() {
  await withTenant(async (tenantId) => {
    // 最新の5件を取得
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
    
    console.log(`\n📋 最新5件の詳細データ:\n`);
    recentLeads.forEach((lead, index) => {
      const data = lead.data as any;
      console.log(`${index + 1}. ========================================`);
      console.log(`ID: ${lead.id}`);
      console.log(`Source: ${lead.source}`);
      console.log(`Name: ${data?.name || "-"}`);
      console.log(`Address: ${data?.address || "null"}`);
      console.log(`Phone: ${data?.phone || "null"}`);
      console.log(`Open Date: ${data?.open_date || "null"}`);
      console.log(`Business Hours: ${data?.business_hours || "null"}`);
      console.log(`Transport: ${data?.transport || "null"}`);
      console.log(`Budget: ${data?.budget || "null"}`);
      console.log(`Category: ${data?.category || "null"}`);
      console.log(`Is Franchise: ${data?.is_franchise || false}`);
      console.log(`Related Stores: ${data?.related_stores || "null"}`);
      console.log(`Created At: ${lead.createdAt}`);
      console.log(``);
    });
  });
}

checkLeadDetails()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
