# 変更履歴

このファイルは、プロジェクトのすべての重要な変更を記録します。

形式は [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に基づいています。

## [Unreleased]

### 予定
- Phase 3: CRM Core & Dynamic Table 実装
- Phase 4: Analytics & Dashboard 実装
- Phase 5: Simulation 機能実装
- Phase 6: Scraping & CTI 統合（BullMQ、Playwright、Twilio）

---

## [0.4.0] - 2025-01-20

### 追加

#### UberEats収集機能
- **UberEats収集機能**: UberEatsから店舗リストを自動収集
  - `startUbereatsScraping` Server Action: UberEatsエリアURLから店舗情報を収集
  - `UbereatsScraperDialog` コンポーネント: 収集UI（エリア選択、収集上限数設定）
  - 主要都市のプリセットエリア（東京、大阪、横浜、名古屋、福岡、札幌、仙台、京都）
  - Apify統合による自動収集とMasterLeadへの自動登録

#### 組織管理機能（SUPER_ADMIN専用）
- **組織管理ページ**: システム全体の組織を管理
  - `/dashboard/admin/organizations` ページ: 組織一覧表示
  - `createOrganization` Server Action: 組織の新規作成
  - `CreateOrganizationDialog` コンポーネント: 組織作成UI
  - サイドバーに「ADMIN」セクションを追加（Super Adminのみ表示）

#### UI/UX改善
- **アニメーション背景コンポーネント**: リッチなアニメーション効果
  - `AnimatedBackground` コンポーネント: オーロラ風のアニメーション
  - 日本地図のフェードインアニメーション
  - Tailwind CSS keyframes定義（`aurora-move`, `map-fade-in`）
- **ログインページのデザイン統一**: トップページと統一されたデザイン
  - ダークネイビーテーマの統一
  - アニメーション背景の共有
  - 半透明のログインフォーム（`bg-slate-900/60`）

#### マルチテナント対応の強化
- **組織スイッチャー**: 複数組織に所属するユーザー向け
  - `OrganizationSwitcher` コンポーネント: 組織の切り替えUI
  - `/api/organizations/mine` エンドポイント: ユーザーの組織一覧取得
  - `/api/organization/switch` エンドポイント: アクティブ組織の切り替え
  - Slim Session Pattern: セッションに`activeOrganizationId`と`activeOrganizationRole`を保存
- **データフィルタリングの改善**: 組織単位でのデータアクセス
  - プロジェクト一覧を`organizationId`でフィルタリング
  - リード、マスターリード、顧客データを組織単位で管理
  - `getCurrentOrgId()` ヘルパー関数: アクティブ組織IDの取得

#### ドキュメント追加
- Railway環境変数セットアップガイド（`APIFY_API_TOKEN`, `APIFY_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`）
- Staging環境Master Leadsマイグレーション手順
- Apify APIトークンセットアップガイド
- Railway `PUBLIC_DATABASE_URL` セットアップガイド
- API移行ガイド

### 変更

#### 認証・セッション管理
- NextAuth.jsセッション構造の変更: `organizationMemberships`を削除し、`activeOrganizationId`と`activeOrganizationRole`に簡素化
- ログアウト時のリダイレクト先を相対パス（`/login`）に変更

#### データベーススキーマ
- `OrganizationMember` テーブル: ユーザーと組織の多対多関係を管理
- `MasterLead` モデル: `organizationId`フィールドを追加（テナント共通マスタの場合はnull）

### 修正

#### バグ修正
- Google Maps収集のエラーハンドリング改善: ApifyClientの遅延初期化、環境変数チェックの追加
- ログアウト時のリダイレクト先エラー修正: 絶対URLではなく相対パスを使用
- アニメーションが動作しない問題の修正: インラインスタイルでのアニメーション適用
- `ScrapingJobStatus` enum値の修正: `'pending'` → `ScrapingJobStatus.PENDING`
- プロジェクト一覧のフィルタリング修正: `userId`から`organizationId`に変更

#### データアクセス修正
- プロジェクト一覧・詳細ページ: `organizationId`でフィルタリング
- リード、マスターリード、顧客データ: 組織単位でのアクセス制御

---

## [0.4.0] - 2025-01-10

### 追加

#### プライシング画面（料金プラン）機能
- **PricingSectionコンポーネント**: SaaS型CRMの料金プラン選択セクション
  - Shadcn/UIのCard, Button, Badge, Switchを使用
  - framer-motionによるマイクロインタラクション（ホバー、アニメーション）
  - 期間切り替え: 月払い/年払いトグル（年払いは20% OFFバッジ表示）
  - 3つのプラン構成:
    - Starter: 無料/個人向け
    - Pro: 中小企業向け（「一番人気」バッジ）
    - Enterprise: 大規模向け（お問い合わせボタン）
  - プライシングページ (`/dashboard/pricing`) の実装
  - サイドバーに「Pricing」メニューを追加

#### CSVエクスポート機能
- **DataTableExportButtonコンポーネント**: TanStack TableデータのCSVエクスポート
  - クライアントサイドでのCSV生成（外部ライブラリ不要）
  - BOM付与によるExcelでの文字化け防止
  - フィルタリング済みデータのエクスポート対応
  - ファイル名に日付を自動付与（`data-YYYY-MM-DD.csv`）
- **exportTableToCSVユーティリティ関数**: 汎用的なCSVエクスポート機能
  - TanStack Tableのインスタンスを受け取りCSV変換
  - 表示されているカラムのみをエクスポート
  - CSVエスケープ処理（ダブルクォート対応）

### 変更
- `@radix-ui/react-switch` パッケージを追加
- `framer-motion` パッケージを追加
- サイドバーに「Pricing」メニューを追加（SYSTEMグループ）
- ヘッダーのページタイトルマッピングに「Pricing」を追加

---

## [0.3.0] - 2025-01-10

### 追加

#### UI刷新: ZenMapコンセプトの実装
- **サイドバーUIの全面刷新**: 未来型ダークテーマデザイン
  - ダークモード（`bg-slate-950`）を基調とした深みのあるデザイン
  - グローエフェクトとグラデーションによる視覚的インパクト
  - メニューグループ化（COMMAND/STRATEGY/MARKET/SYSTEM）
  - アニメーション効果（ホバー、アクティブ状態のグロー）
  - ZenMapロゴの実装（パープルグローエフェクト）

- **メニュー名称の統一**: ZenMapコンセプトに基づく命名
  - Dashboard → **Command Center** (指揮所)
  - Leads → **Action Inbox** (アクション・インボックス)
  - Projects → **Campaigns** (戦略キャンペーン)
  - Master Leads → **Intelligence** (市場インテリジェンス)

- **リリースノート機能**: UI上でリリース情報を表示
  - `ReleaseNotesDialog` コンポーネントの実装
  - ヘッダーにリリースノートボタンを追加
  - 最新リリース情報をカード形式で表示

#### エラーハンドリングの改善
- エラーメッセージにスタックトレースを追加
- 詳細なエラー情報を表示可能に
- デバッグガイドの作成（`docs/DEBUG_500_ERROR.md`）

### 変更
- サイドバーを固定位置（`fixed`）に設定
- レイアウト構造の改善（flexレイアウト）
- すべてのページタイトルをZenMapコンセプトに統一
- ヘッダーのページタイトルマッピングを更新

### 修正
- ビルドキャッシュクリアによる404エラーの解消
- レイアウトのデザイン崩れを修正

---

## [0.2.0] - 2025-01-08

### 追加

#### AI検索とプロジェクト管理機能
- **AI検索機能**: ベクトル検索による自然言語でのリード検索
  - `searchMasterLeadsByAI` Server Action: OpenAI Embedding APIを使用したベクトル検索
  - `AISearchDialog` コンポーネント: 検索UIと結果表示
  - pgvector拡張を使用したコサイン類似度検索

- **プロジェクト（営業リスト）機能**
  - `Project` モデルの追加: 営業リストを管理するコンテナ
  - `Lead.projectId` フィールド追加: プロジェクトへの所属関係
  - `createProjectFromSearch` Server Action: AI検索結果からプロジェクトを作成
  - プロジェクト一覧ページ (`/dashboard/projects`): カード形式での一覧表示
  - プロジェクト詳細ページ (`/dashboard/projects/[projectId]`): リード一覧テーブル表示
  - サイドバーに「Projects (プロジェクト)」メニューを追加

#### Google Maps収集機能（Apify統合）
- Apify Webhook統合: `compass/crawler-google-places` Actorとの連携
- `startGoogleMapsScraping` Server Action: Google Mapsからの店舗情報収集
- `GoogleMapsScraperDialog` コンポーネント: 収集UI
- レビュー数・評価の取得対応
- MasterLeadへの自動登録と重複チェック

#### RAG実装 Phase 2: データ埋め込みバッチ処理
- `generate-embeddings.ts` スクリプト: MasterLeadデータのベクトル化
- `generateEmbedding` 関数: OpenAI `text-embedding-3-small` を使用
- `LeadVector` テーブルへのバッチ保存
- レート制限対策（バッチ処理と待機時間）

#### バックアップ機能の強化
- Slack通知機能: バックアップ成功/失敗時に通知
- `backup-leads.ts` スクリプトの改善
- バックアップファイルの世代管理（2世代保存）

#### UIコンポーネント
- Toast通知システム (`shadcn/ui`): 成功/エラー通知
- Dialog、Button、Input、Label、Selectコンポーネントの追加

### 変更
- `docker-compose.yml`: PostgreSQLイメージを `pgvector/pgvector:pg16` に変更（pgvector拡張対応）
- Prismaスキーマ: `Lead` モデルに `projectId` フィールドを追加（Optional、既存データ移行対応）
- `Tenant` モデル: `projects` リレーションを追加

### インフラ
- pgvector拡張の有効化
- ベクトル検索用インデックスの追加

---

## [0.3.0] - 2024-12-19

### 追加

#### Phase 2: UI実装（MVP）
- App Shell（サイドバー付きダッシュボードレイアウト）
- Scraper UI（ジョブ登録・一覧表示画面）
- Leads Grid（TanStack Tableによるリード一覧）
- Server Actions（テナントコンテキスト対応）

#### スクレイピング機能
- `scraping_jobs` テーブル: スクレイピングジョブの実行履歴
- `leads` テーブル: スクレイピングで取得したリード情報
- ジョブ作成・一覧表示機能
- ステータス管理（Pending/Running/Completed/Failed）

#### Shadcn/UIコンポーネント
- Button, Input, Label, Card, Badge コンポーネント
- Tailwind CSS設定

### 変更
- `withTenant` ヘルパーのAPI変更（tenantIdを引数として渡すように）

---

## [0.2.0] - 2024-12-19

### 追加

#### マルチテナント対応
- `tenants` テーブルの作成
- すべてのテーブルに `tenant_id` カラムを追加
- 複合UNIQUE制約の追加（tenant_id + code/phone_number）
- マルチテナント対応用インデックスの追加

#### Row Level Security (RLS) 実装
- RLSポリシーの実装（すべてのテナント依存テーブル）
- セッション変数によるテナントコンテキスト管理
- テナントヘルパー関数（`withTenant`）
- Next.js用ミドルウェア

### 変更
- `organizations.code`: UNIQUE → (tenant_id, code) UNIQUE
- `products.code`: UNIQUE → (tenant_id, code) UNIQUE
- `customers.phone_number`: UNIQUE → (tenant_id, phone_number) UNIQUE

---

## [0.1.0] - 2024-12-19

### 追加

#### Phase 0: Docker環境セットアップ
- `docker-compose.yml` を作成
  - PostgreSQL 16 コンテナ（ポート: 5432）
  - Redis 7 コンテナ（ポート: 6379）
  - Redis Commander コンテナ（ポート: 8081、開発用UI）

#### Phase 1: データモデリング

**プロジェクト構造**
- Next.js 15 プロジェクトの初期セットアップ
- TypeScript設定
- Tailwind CSS設定
- Drizzle ORM設定

**データベーススキーマ**

1. **組織階層（Closure Table実装）**
   - `organizations` テーブル
     - 組織の基本情報（name, code, type, parent_id）
     - Materialized Path（path, level）による補助的な高速化
   - `organization_closure` テーブル
     - Closure Tableパターンによる階層関係の管理
     - (ancestor_id, descendant_id, depth) の組み合わせ
   - Closure Tableヘルパー関数（`src/lib/db/utils/closureTable.ts`）
     - `addOrganization()`: 組織追加とClosure Table自動更新
     - `getDescendants()`: 全子孫取得
     - `getAncestors()`: 全祖先取得
     - `deleteOrganization()`: 組織削除

2. **動的カラム（メタデータ駆動設計）**
   - `product_field_definitions` テーブル
     - 商材ごとのフィールド定義
     - field_key, field_label, field_type, is_required, is_unique, options
   - `customer_field_values` テーブル
     - 顧客ごとのフィールド値（JSONB）
     - 型に応じた柔軟な値の格納

3. **KPI/PL管理テーブル**
   - `kpi_records` テーブル
     - KPI記録（トス数/率、前確/後確、ET数、開通数など）
     - 組織/商材/期間での多軸集計対応
   - `pl_records` テーブル
     - PL記録（売上、粗利、営業利益、営業原価、販管費、代理店支払い）
     - 予実区分（actual/forecast/simulation）
   - `simulations` テーブル
     - シミュレーション実行履歴
     - 予測売上・粗利・営業利益の保存

4. **その他のテーブル**
   - `products`: 商材マスタ
   - `customers`: 顧客マスタ（電話番号を重複チェック用キー）
   - `deals`: 商談管理

**Enum型定義**
- `organization_type`: direct, partner_1st, partner_2nd, unit, individual
- `field_type`: text, number, date, select, multiselect, textarea, boolean, currency
- `customer_status`: lead, contacted, qualified, proposal, negotiation, won, lost, closed
- `kpi_type`: toss_count, toss_rate, pre_confirmed, post_confirmed, et_count, activation_same_day, activation_next_day, conversion_rate
- `pl_item_type`: revenue, gross_profit, operating_profit, cost_of_sales, sga, agency_payment, other_income, other_expense
- `deal_status`: prospecting, qualification, proposal, negotiation, closed_won, closed_lost
- `product_category`: service, hardware, software, consulting, other

**インデックス最適化**
- `src/lib/db/migrations/001_closure_table_indexes.sql`
  - Closure Tableの複合主キーとインデックス
  - 組織テーブルのインデックス
  - 動的フィールド値の複合インデックス
  - KPI/PL記録の集計用インデックス

**ドキュメント**
- `README.md`: プロジェクト概要とセットアップ手順
- `DESIGN.md`: 設計思想とアーキテクチャ詳細
- `docs/IMPLEMENTATION.md`: 実装ドキュメント
- `docs/SCHEMA_REFERENCE.md`: スキーマリファレンス
- `docs/CHANGELOG.md`: 変更履歴（本ファイル）

**設定ファイル**
- `package.json`: 依存関係定義
- `drizzle.config.ts`: Drizzle ORM設定
- `tsconfig.json`: TypeScript設定
- `tailwind.config.ts`: Tailwind CSS設定
- `next.config.js`: Next.js設定
- `.env.local.example`: 環境変数テンプレート

### 変更

なし（初版）

### 削除

なし（初版）

### セキュリティ

なし（初版）

---

## 更新ガイドライン

### 変更の分類

- **追加**: 新機能の追加
- **変更**: 既存機能の変更
- **非推奨**: まもなく削除される機能
- **削除**: 削除された機能
- **修正**: バグ修正
- **セキュリティ**: セキュリティ関連の修正

### 更新手順

1. 変更を実装
2. このファイルの `[Unreleased]` セクションに変更内容を追加
3. リリース時に、`[Unreleased]` の内容を新しいバージョン番号のセクションに移動
4. 日付を更新

### バージョン番号

[Semantic Versioning](https://semver.org/lang/ja/) に従います:
- **MAJOR**: 互換性のない変更
- **MINOR**: 後方互換性のある機能追加
- **PATCH**: 後方互換性のあるバグ修正


