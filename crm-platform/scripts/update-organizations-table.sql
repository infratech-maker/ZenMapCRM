-- organizationsテーブルに不足しているカラムを追加

-- typeカラムを追加（既に存在する場合はスキップ）
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN IF NOT EXISTS type "OrganizationType";
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

-- 既存のorganization_type ENUM型がある場合は、OrganizationTypeに変換
DO $$ BEGIN
  -- 既存のorganization_typeカラムがある場合は、OrganizationTypeに変換
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' 
    AND column_name = 'type' 
    AND data_type = 'USER-DEFINED'
    AND udt_name = 'organization_type'
  ) THEN
    -- organization_typeからOrganizationTypeに変換
    ALTER TABLE organizations ALTER COLUMN type TYPE "OrganizationType" USING 
      CASE type::text
        WHEN 'direct' THEN 'DIRECT'::"OrganizationType"
        WHEN 'partner_1st' THEN 'PARTNER_1ST'::"OrganizationType"
        WHEN 'partner_2nd' THEN 'PARTNER_2ND'::"OrganizationType"
        WHEN 'unit' THEN 'UNIT'::"OrganizationType"
        WHEN 'individual' THEN 'INDIVIDUAL'::"OrganizationType"
        ELSE 'DIRECT'::"OrganizationType"
      END;
  END IF;
EXCEPTION
  WHEN OTHERS THEN null;
END $$;
