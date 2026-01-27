-- AlterTable
ALTER TABLE "leads" ADD COLUMN "enrich_status" TEXT,
ADD COLUMN "enriched_at" TIMESTAMP(3),
ADD COLUMN "last_enriched_at" TIMESTAMP(3);
