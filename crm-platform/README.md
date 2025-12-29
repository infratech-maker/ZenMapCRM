# 統合CRMプラットフォーム

高度なBI機能を持つ統合CRMプラットフォーム。スクレイピング、CTI統合、多軸集計・KPI分析、売上シミュレーション機能を提供します。

## 技術スタック

- **Frontend:** Next.js 15 (App Router), React, TypeScript
- **UI Framework:** Tailwind CSS + Shadcn/UI
- **Data Grid:** TanStack Table v8
- **Charts:** Recharts
- **State Management:** Zustand, TanStack Query
- **Database:** PostgreSQL (Supabase互換)
- **ORM:** Drizzle ORM
- **Calculation:** decimal.js
- **Queue:** BullMQ (Redis)

## アーキテクチャ設計

### 1. マルチテナント対応（SaaS化）

**設計理由:**
- 複数のクライアント企業が同じデータベースを使用
- テナント間のデータを完全に分離
- Row Level Security (RLS) によるデータベース層での自動フィルタリング

**実装:**
- `tenants` テーブル: テナントマスタ
- すべてのテーブルに `tenant_id` カラムを追加
- PostgreSQLのRow Level Security (RLS) を実装
- アプリケーション層でのテナントコンテキスト管理（`withTenant` ヘルパー）

### 2. 組織階層: Closure Table パターン

**設計理由:**
- 深い階層（直営 > 1次代理店 > 2次代理店 > ユニット > 個人）の集計時に、再帰CTEが不要
- 任意の深さの階層を1回のJOINで取得可能
- 「直営配下の全代理店の売上合計」のような集計クエリが高速化

**実装:**
- `organizations` テーブル: 組織の基本情報
- `organization_closure` テーブル: 全パスを保持（ancestor_id, descendant_id, depth）

### 3. 動的カラム: メタデータ駆動設計

**設計理由:**
- 商材ごとに管理項目が異なる（通信系は「回線速度」、保険系は「保険金額」）
- スキーマ変更なしで、管理画面から項目を追加・編集可能
- 型安全性を保つため、`fieldType` でバリデーションルールを定義

**実装:**
- `product_field_definitions`: 商材ごとのフィールド定義
- `customer_field_values`: 顧客ごとのフィールド値（JSONB）

### 4. KPI/PL管理: 多軸集計対応

**設計理由:**
- 組織階層（直営/パートナー/ユニット/個人）ごとの集計
- 商材別、期間別のドリルダウン分析
- リアルタイム集計は負荷が高いため、Materialized View または非同期集計を推奨

**実装:**
- `kpi_records`: KPI記録（トス数/率、前確/後確、ET数、開通数など）
- `pl_records`: PL記録（売上、粗利、営業利益、営業原価、販管費、代理店支払い）
- `simulations`: シミュレーション実行履歴

## クイックスタート

**⚠️ 重要: まずNode.jsをインストールしてください**

1. **Node.jsのインストール**（必須）:
   ```bash
   # macOS (Homebrew)
   brew install node
   
   # または https://nodejs.org/ からダウンロード
   ```

2. **自動セットアップスクリプト**:
   ```bash
   cd crm-platform
   ./start-dev.sh
   ```

詳細な手順は [QUICK_SETUP.md](./QUICK_SETUP.md) または [QUICK_START.md](./QUICK_START.md) を参照してください。

### 1. 環境変数の設定

```bash
cd crm-platform
cp .env.local.example .env.local
# .env.local を編集（DATABASE_URL と TEST_TENANT_ID を設定）
```

`.env.local` の例:

**Slack通知機能（オプション）:**
バッチスクリプト（`scripts/update-tabelog-leads.ts`）の進捗をSlackに通知する場合は、以下の環境変数を追加してください：

```bash
# Slack Incoming Webhook URL
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

Slack Webhook URLの取得方法:
1. Slackワークスペースにアクセス
2. [Incoming Webhooks](https://api.slack.com/messaging/webhooks) を設定
3. Webhook URLをコピーして `.env.local` に追加

**注意:** `SLACK_WEBHOOK_URL` が設定されていない場合、バッチスクリプトは正常に動作しますが、Slack通知はスキップされます。

`.env.local` の例（完全版）:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crm_platform
TEST_TENANT_ID=00000000-0000-0000-0000-000000000000
```

### 2. Docker環境の起動

```bash
# プロジェクトルートで実行
cd ..
docker-compose up -d
```

これにより以下が起動します:
- PostgreSQL 16 (localhost:5432)
- Redis 7 (localhost:6379)
- Redis Commander (localhost:8081) - 開発用UI

### 3. 依存関係のインストール

```bash
cd crm-platform
npm install
```

### 4. データベースセットアップ

```bash
# スキーマをDBにプッシュ
npm run db:push

# テスト用テナントを作成
npm run db:seed:tenant

# RLSポリシーを適用
psql -U postgres -d crm_platform -f src/lib/db/migrations/003_rls_policies.sql

# インデックスを追加
psql -U postgres -d crm_platform -f src/lib/db/migrations/002_multitenant_indexes.sql
psql -U postgres -d crm_platform -f src/lib/db/migrations/005_scraper_rls_indexes.sql
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

### 6. アクセス

- ホーム: http://localhost:3000
- ダッシュボード: http://localhost:3000/dashboard
- Scraper: http://localhost:3000/dashboard/scraper
- Leads: http://localhost:3000/dashboard/leads

## プロジェクト構造

```
crm-platform/
├── src/
│   ├── app/
│   │   ├── dashboard/    # ダッシュボード（App Shell）
│   │   │   ├── layout.tsx    # サイドバー付きレイアウト
│   │   │   ├── page.tsx      # ダッシュボード
│   │   │   ├── scraper/      # スクレイピング画面
│   │   │   ├── leads/        # リード一覧画面
│   │   │   └── settings/    # 設定画面
│   │   ├── layout.tsx    # ルートレイアウト
│   │   └── page.tsx      # ホームページ
│   ├── features/
│   │   ├── analytics/    # ダッシュボード、グラフ、集計ロジック
│   │   ├── simulation/   # 将来予測、計算シミュレーター
│   │   ├── crm/          # 顧客リスト、マスタ管理
│   │   ├── scraper/      # スクレイピング機能
│   │   │   ├── actions.ts              # Server Actions
│   │   │   ├── scraping-job-form.tsx   # ジョブ作成フォーム
│   │   │   ├── scraping-job-list.tsx   # ジョブ一覧
│   │   │   ├── leads-actions.ts        # リード取得
│   │   │   └── leads-table.tsx         # リードテーブル
│   │   └── cti/          # CTI統合
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema/   # Drizzle ORMスキーマ
│   │   │   │   ├── tenants.ts          # テナント
│   │   │   │   ├── organizations.ts    # 組織階層
│   │   │   │   ├── products.ts         # 商材
│   │   │   │   ├── dynamicFields.ts    # 動的カラム
│   │   │   │   ├── customers.ts        # 顧客
│   │   │   │   ├── kpi.ts              # KPI記録
│   │   │   │   ├── pl.ts               # PL記録
│   │   │   │   ├── deals.ts            # 商談
│   │   │   │   └── scraper.ts          # スクレイピング
│   │   │   ├── utils/
│   │   │   │   └── closureTable.ts     # Closure Tableヘルパー
│   │   │   ├── migrations/             # SQLマイグレーション
│   │   │   ├── tenant-helper.ts        # テナントコンテキスト管理
│   │   │   └── index.ts                # DB接続
│   │   └── utils/
│   └── components/ui/    # Shadcn/UIコンポーネント
│       ├── button.tsx
│       ├── input.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       └── ...
├── scripts/
│   └── seed-tenant.ts   # テスト用テナント作成
├── docs/                 # ドキュメント
├── drizzle/              # マイグレーションファイル（生成）
└── docker-compose.yml    # Docker環境設定
```

## 主要機能

### Phase 0: インフラ & セキュリティ ✅
- [x] Docker環境（PostgreSQL, Redis）
- [x] マルチテナント対応（SaaS化）
- [x] Row Level Security (RLS) 実装
- [x] テナントコンテキスト管理

### Phase 1: データモデリング ✅
- [x] 組織階層（Closure Table）
- [x] 動的カラム（メタデータ駆動）
- [x] KPI/PL管理テーブル
- [x] スクレイピングジョブ・リードテーブル

### Phase 2: UI実装（MVP） ✅
- [x] App Shell（サイドバー付きダッシュボード）
- [x] Scraper UI（ジョブ登録・一覧表示）
- [x] Leads Grid（TanStack Table）
- [x] Server Actions（テナントコンテキスト対応）

### Phase 3: CRM Core（実装予定）
- [ ] 動的テーブル（TanStack Table）
- [ ] フィールド定義管理画面
- [ ] CSVインポート/エクスポート

### Phase 4: Analytics & Dashboard（実装予定）
- [ ] KPI集計クエリ
- [ ] Rechartsダッシュボード
- [ ] ドリルダウン機能

### Phase 5: Simulation（実装予定）
- [ ] 売上シミュレーション
- [ ] 粗利・入金予測

### Phase 6: Scraping & CTI（実装予定）
- [ ] Playwright + BullMQ
- [ ] Twilio統合

## ドキュメント

詳細なドキュメントは `docs/` ディレクトリにあります:

- **[📚 ドキュメントインデックス](docs/DOCUMENTATION_INDEX.md)**: すべてのドキュメントへのクイックアクセス
- **[📘 実装ドキュメント](docs/IMPLEMENTATION.md)**: 実装の詳細、プロジェクト構造、主要機能の説明
- **[📊 スキーマリファレンス](docs/SCHEMA_REFERENCE.md)**: データベーススキーマの完全なリファレンス
- **[📝 変更履歴](docs/CHANGELOG.md)**: プロジェクトのすべての重要な変更
- **[🏗️ 設計ドキュメント](DESIGN.md)**: 設計思想とアーキテクチャ詳細
- **[🔐 マルチテナント対応](docs/MULTITENANT.md)**: マルチテナント対応の詳細
- **[🛡️ RLS実装](docs/RLS_IMPLEMENTATION.md)**: Row Level Security実装の詳細
- **[🚀 クイックスタート](QUICK_START.md)**: セットアップと動作確認ガイド
- **[✅ 動作確認ガイド](VERIFICATION_GUIDE.md)**: 動作確認の詳細手順

## 動作確認

### 基本的な動作確認

1. **サーバー起動**:
   ```bash
   npm run dev
   ```

2. **Scraper画面にアクセス**:
   ```
   http://localhost:3000/dashboard/scraper
   ```

3. **スクレイピングジョブを作成**:
   - URL入力フォームに `https://example.com` を入力
   - "Start Scraping" ボタンをクリック
   - ジョブ一覧に "Pending" ステータスで追加されることを確認

4. **データベース確認**:
   ```sql
   SELECT * FROM scraping_jobs 
   WHERE tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
   ORDER BY created_at DESC;
   ```

詳細な手順は [VERIFICATION_GUIDE.md](./VERIFICATION_GUIDE.md) を参照してください。

### ドキュメント更新ガイドライン

実装に変更が入るたびに、以下のドキュメントを更新してください:

1. **スキーマ変更時**:
   - `docs/SCHEMA_REFERENCE.md` を更新
   - `docs/IMPLEMENTATION.md` の「データベーススキーマ」セクションを更新

2. **新機能追加時**:
   - `docs/IMPLEMENTATION.md` の「主要機能の実装」セクションに追加
   - `docs/CHANGELOG.md` の `[Unreleased]` セクションに追加

3. **プロジェクト構造変更時**:
   - `docs/IMPLEMENTATION.md` の「プロジェクト構造」セクションを更新

4. **設定ファイル変更時**:
   - `docs/IMPLEMENTATION.md` の「設定ファイル」セクションを更新

## ライセンス

MIT

