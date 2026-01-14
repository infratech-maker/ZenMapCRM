# データベーススキーマ差分チェック結果

## 実施日時
2024年（最新）

## チェック内容
Prismaスキーマとデータベースの差分を確認し、不足している`@map`アノテーションとテーブルを特定しました。

## 修正内容

### 1. `@map`アノテーションの追加

#### Productモデル
以下のフィールドに`@map`アノテーションを追加：
- `tenantId` → `@map("tenant_id")`
- `basePrice` → `@map("base_price")`
- `isActive` → `@map("is_active")`
- `createdAt` → `@map("created_at")`
- `updatedAt` → `@map("updated_at")`

#### LeadVectorモデル
以下のフィールドに`@map`アノテーションを追加：
- `masterLeadId` → `@map("master_lead_id")`
- `createdAt` → `@map("created_at")`

### 2. 確認済みのモデル
以下のモデルはすべて`@map`アノテーションが正しく設定されています：
- `Tenant`
- `User`
- `Organization`
- `UserOrganization`
- `Role`
- `Permission`
- `UserRole`
- `RolePermission`
- `Invitation`
- `OrganizationClosure`
- `ProductFieldDefinition`
- `CustomerFieldValue`
- `Customer`
- `Lead`
- `Deal`
- `KpiRecord`
- `PlRecord`
- `Simulation`
- `Project`
- `MasterLead`
- `ScrapingJob`
- `ActivityLog`

## データベーステーブル確認

### 作成済みテーブル（SQLスクリプト実行済み）
- `tenants`
- `users`
- `organizations`
- `user_organizations`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `invitations`
- `organization_closure`
- `projects`
- `activity_logs`
- `leads`（カラム名修正済み）
- `scraping_jobs`（カラム名修正済み）
- `master_leads`

### 確認が必要なテーブル
以下のテーブルがデータベースに存在するか確認が必要です：
- `products`
- `product_field_definitions`
- `customer_field_values`
- `customers`
- `deals`
- `kpi_records`
- `pl_records`
- `simulations`
- `lead_vectors`

## 次のステップ

1. **テーブル存在確認**
   ```bash
   DATABASE_URL="postgresql://..." npx prisma db execute --file scripts/verify-all-tables.sql --schema prisma/schema.prisma
   ```

2. **不足テーブルの作成**
   不足しているテーブルがある場合は、以下を実行：
   ```bash
   DATABASE_URL="postgresql://..." npx prisma db execute --file scripts/create-missing-tables-comprehensive.sql --schema prisma/schema.prisma
   ```

3. **Prisma Clientの再生成**
   ```bash
   npx prisma generate
   ```

4. **Railwayでの再デプロイ**
   - GitHubにプッシュ後、Railwayが自動的に再デプロイを開始
   - デプロイ完了後、エラーが解消されているか確認

## 注意事項

- `lead_vectors`テーブルは`pgvector`拡張が必要です
- ENUM型は`create-enums.sql`で作成済みです
- 外部キー制約は既存のテーブルに依存するため、順序に注意してください
