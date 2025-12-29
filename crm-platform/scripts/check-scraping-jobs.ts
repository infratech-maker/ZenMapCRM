import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { db } from "../src/lib/db";
import { scrapingJobs } from "../src/lib/db/schema";
import { withTenant } from "../src/lib/db/tenant-helper";
import { eq, desc, sql } from "drizzle-orm";

async function checkScrapingJobs() {
  await withTenant(async (tenantId) => {
    // 直近1時間以内のpendingジョブをカウント
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const pendingJobs = await db
      .select()
      .from(scrapingJobs)
      .where(eq(scrapingJobs.status, "pending"))
      .orderBy(desc(scrapingJobs.createdAt))
      .limit(10);
    
    console.log(`\n📊 Pending状態のジョブ数: ${pendingJobs.length}件（最新10件）`);
    
    if (pendingJobs.length > 0) {
      console.log(`\n📋 最新のPendingジョブ:`);
      pendingJobs.forEach((job, index) => {
        console.log(`\n${index + 1}. ID: ${job.id}`);
        console.log(`   URL: ${job.url}`);
        console.log(`   Status: ${job.status}`);
        console.log(`   Created At: ${job.createdAt}`);
      });
    }
  });
}

checkScrapingJobs()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
