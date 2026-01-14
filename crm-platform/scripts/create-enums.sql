-- Prismaスキーマで定義されているENUM型の作成

-- OrganizationType (Prismaスキーマに合わせて大文字のキャメルケースで作成)
DO $$ BEGIN
  DROP TYPE IF EXISTS "OrganizationType" CASCADE;
  CREATE TYPE "OrganizationType" AS ENUM ('DIRECT', 'PARTNER_1ST', 'PARTNER_2ND', 'UNIT', 'INDIVIDUAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 既存のorganization_type ENUM型がある場合は削除（Drizzle ORMで作成されたもの）
DO $$ BEGIN
  DROP TYPE IF EXISTS organization_type CASCADE;
EXCEPTION
  WHEN undefined_object THEN null;
END $$;

-- CustomerStatus
DO $$ BEGIN
  CREATE TYPE "CustomerStatus" AS ENUM ('LEAD', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST', 'CLOSED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- DealStatus
DO $$ BEGIN
  CREATE TYPE "DealStatus" AS ENUM ('PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ProductCategory
DO $$ BEGIN
  CREATE TYPE "ProductCategory" AS ENUM ('SERVICE', 'HARDWARE', 'SOFTWARE', 'CONSULTING', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- FieldType
DO $$ BEGIN
  CREATE TYPE "FieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'SELECT', 'MULTISELECT', 'TEXTAREA', 'BOOLEAN', 'CURRENCY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- KpiType
DO $$ BEGIN
  CREATE TYPE "KpiType" AS ENUM ('TOSS_COUNT', 'TOSS_RATE', 'PRE_CONFIRMED', 'POST_CONFIRMED', 'ET_COUNT', 'ACTIVATION_SAME_DAY', 'ACTIVATION_NEXT_DAY', 'CONVERSION_RATE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- PlItemType
DO $$ BEGIN
  CREATE TYPE "PlItemType" AS ENUM ('REVENUE', 'GROSS_PROFIT', 'OPERATING_PROFIT', 'COST_OF_SALES', 'SGA', 'AGENCY_PAYMENT', 'OTHER_INCOME', 'OTHER_EXPENSE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ScrapingJobStatus
DO $$ BEGIN
  CREATE TYPE "ScrapingJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- InvitationStatus
DO $$ BEGIN
  CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ActivityType
DO $$ BEGIN
  CREATE TYPE "ActivityType" AS ENUM ('CALL', 'VISIT', 'EMAIL', 'CHAT', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
