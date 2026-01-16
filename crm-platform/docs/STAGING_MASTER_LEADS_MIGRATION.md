# Staging環境 Master Leads マイグレーション手順

Staging環境の`dashboard/master-leads`にデータを反映させるためのマイグレーション手順です。

## 📋 前提条件

- Staging環境のデータベース接続情報（`PUBLIC_DATABASE_URL`）を取得済み
- ローカル環境にPrisma CLIがインストール済み
- Production環境と同様のデータ構造をStaging環境に反映したい

---

## 📋 ステップ1: Staging環境のデータベース接続情報を取得

### Railwayから接続情報を取得

1. Railwayダッシュボードで「**Postgres**」サービスを選択
2. 「**Variables**」タブを開く
3. **`PUBLIC_DATABASE_URL`** の値をコピー
   - 形式: `postgresql://postgres:password@hostname.proxy.rlwy.net:port/railway`
   - 例: `postgresql://postgres:password@hopper.proxy.rlwy.net:44735/railway`

**または、Databaseタブから取得:**
1. 「**Database**」タブを開く
2. 「**Connection**」セクションの「**Connection URL**」をコピー

---

## 📋 ステップ2: ローカル環境での準備

### 1. 環境変数の設定

`.env.local`ファイルにStaging環境のデータベースURLを追加：

```bash
# Staging環境のデータベース接続（マイグレーション用）
STAGING_DATABASE_URL=postgresql://postgres:password@hostname.proxy.rlwy.net:port/railway
```

**注意**: この環境変数は一時的なものです。マイグレーション完了後は削除しても構いません。

### 2. データベーススキーマの確認

Staging環境のデータベースに必要なテーブルが存在することを確認：

```bash
# Staging環境のデータベースに接続して確認
DATABASE_URL=$STAGING_DATABASE_URL npx prisma db pull
```

---

## 📋 ステップ3: 基本的なシードデータの投入

### 1. テナント、ユーザー、権限の作成

Staging環境のデータベースに基本的なシードデータを投入：

```bash
# Staging環境のデータベースURLを指定してシード実行
DATABASE_URL=$STAGING_DATABASE_URL npx prisma db seed
```

このコマンドで以下が作成されます：
- テナント（zenmao, demo-partner）
- ユーザー（admin@zenmao.com, admin@partner.com, user@zenmao.com）
- 権限（Permission）
- ロール（Role）
- 組織（Organization）

---

## 📋 ステップ4: Master Leadsデータのマイグレーション

### オプション1: 既存のLeadsデータからMasterLeadを生成

Staging環境に既存の`leads`データがある場合：

```bash
# migrate-to-master.tsスクリプトをStaging環境のデータベースに対して実行
DATABASE_URL=$STAGING_DATABASE_URL npx tsx scripts/migrate-to-master.ts
```

このスクリプトは：
- 既存の`leads`データから`MasterLead`を生成
- 電話番号による名寄せ（重複データの統合）
- `Lead`と`MasterLead`の紐付け

### オプション2: Production環境からデータをエクスポート/インポート

Production環境からMaster LeadsデータをエクスポートしてStaging環境にインポートする場合：

#### 2-1. Production環境からエクスポート

```bash
# Production環境のデータベースURLを指定
DATABASE_URL=$PRODUCTION_DATABASE_URL npx tsx scripts/export-master-leads.ts
```

#### 2-2. Staging環境にインポート

```bash
# Staging環境のデータベースURLを指定
DATABASE_URL=$STAGING_DATABASE_URL npx tsx scripts/import-master-leads.ts
```

**注意**: エクスポート/インポートスクリプトが存在しない場合は、後述の手順で作成します。

---

## 📋 ステップ5: データの確認

### 1. Master Leadsの件数確認

```bash
# Staging環境のデータベースに接続して確認
DATABASE_URL=$STAGING_DATABASE_URL npx prisma studio
```

Prisma Studioで以下を確認：
- `MasterLead`テーブルにデータが存在するか
- `Lead`テーブルの`masterLeadId`が正しく紐付けられているか

### 2. ブラウザで確認

1. Staging環境のURLにアクセス
2. ログイン
3. `/dashboard/master-leads` にアクセス
4. データが表示されることを確認

---

## 🔧 補助スクリプトの作成（必要に応じて）

### Master Leadsエクスポートスクリプト

Production環境からMaster Leadsデータをエクスポートするスクリプト：

```typescript
// scripts/export-master-leads.ts
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const prisma = new PrismaClient();

async function exportMasterLeads() {
  const masterLeads = await prisma.masterLead.findMany({
    include: {
      leads: {
        select: {
          id: true,
          tenantId: true,
          organizationId: true,
        }
      }
    }
  });

  const exportData = {
    exportedAt: new Date().toISOString(),
    masterLeads: masterLeads.map(ml => ({
      id: ml.id,
      companyName: ml.companyName,
      phone: ml.phone,
      address: ml.address,
      source: ml.source,
      data: ml.data,
      createdAt: ml.createdAt,
      updatedAt: ml.updatedAt,
    }))
  };

  writeFileSync('master-leads-export.json', JSON.stringify(exportData, null, 2));
  console.log(`✅ Exported ${masterLeads.length} master leads`);
}

exportMasterLeads()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### Master Leadsインポートスクリプト

Staging環境にMaster Leadsデータをインポートするスクリプト：

```typescript
// scripts/import-master-leads.ts
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const prisma = new PrismaClient();

async function importMasterLeads() {
  const exportData = JSON.parse(readFileSync('master-leads-export.json', 'utf-8'));
  
  let imported = 0;
  let skipped = 0;

  for (const ml of exportData.masterLeads) {
    try {
      await prisma.masterLead.upsert({
        where: { id: ml.id },
        update: {
          companyName: ml.companyName,
          phone: ml.phone,
          address: ml.address,
          source: ml.source,
          data: ml.data,
          updatedAt: new Date(),
        },
        create: {
          id: ml.id,
          companyName: ml.companyName,
          phone: ml.phone,
          address: ml.address,
          source: ml.source,
          data: ml.data,
          createdAt: ml.createdAt ? new Date(ml.createdAt) : new Date(),
          updatedAt: ml.updatedAt ? new Date(ml.updatedAt) : new Date(),
        }
      });
      imported++;
    } catch (error) {
      console.error(`Error importing master lead ${ml.id}:`, error);
      skipped++;
    }
  }

  console.log(`✅ Imported ${imported} master leads, skipped ${skipped}`);
}

importMasterLeads()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## ⚠️ 注意事項

### データの整合性

- Master Leadsはテナント非依存（グローバル）なテーブルです
- 複数のテナントで同じMaster Leadを共有できます
- インポート時はIDの重複に注意してください

### パフォーマンス

- 大量のデータをインポートする場合は、バッチ処理を推奨します
- インデックスが正しく作成されているか確認してください

### セキュリティ

- `STAGING_DATABASE_URL`は機密情報です
- `.env.local`に追加した後、Gitにコミットしないでください
- マイグレーション完了後は削除することを推奨します

---

## ✅ 確認チェックリスト

- [ ] Staging環境のデータベース接続情報を取得
- [ ] `.env.local`に`STAGING_DATABASE_URL`を設定
- [ ] 基本的なシードデータを投入（`npx prisma db seed`）
- [ ] Master Leadsデータのマイグレーションを実行
- [ ] Prisma Studioでデータを確認
- [ ] Staging環境の`/dashboard/master-leads`でデータを確認
- [ ] マイグレーション完了後、`STAGING_DATABASE_URL`を削除

---

## 🔍 トラブルシューティング

### エラー: "Connection refused"

**原因**: データベースURLが正しくない、またはネットワーク接続の問題

**解決方法:**
1. `PUBLIC_DATABASE_URL`が正しいか確認
2. RailwayのPostgresサービスが起動しているか確認
3. ファイアウォール設定を確認

### エラー: "Table does not exist"

**原因**: データベーススキーマが適用されていない

**解決方法:**
1. `npx prisma db push`を実行してスキーマを適用
2. 必要なテーブルが作成されているか確認

### エラー: "Foreign key constraint failed"

**原因**: 参照先のデータが存在しない

**解決方法:**
1. 基本的なシードデータ（テナント、ユーザーなど）が投入されているか確認
2. 参照先のデータを先に作成

---

## 📝 まとめ

Staging環境にMaster Leadsデータを反映させる手順：

1. **データベース接続情報の取得**: Railwayから`PUBLIC_DATABASE_URL`を取得
2. **基本的なシードデータの投入**: `npx prisma db seed`を実行
3. **Master Leadsデータのマイグレーション**: 既存データから生成、またはProduction環境からインポート
4. **動作確認**: Staging環境で`/dashboard/master-leads`を確認

問題があれば、エラーメッセージを共有してください。
