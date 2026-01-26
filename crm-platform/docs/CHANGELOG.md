# 変更履歴

このファイルは、プロジェクトのすべての重要な変更を記録します。

形式は [Keep a Changelog](https://keepachangelog.com/ja/1.0.0/) に基づいています。

## [Unreleased]

### 追加

#### RAG実装 Phase 5: Frontend Integration（フロントエンド統合）
- **Hybrid Search UI (`src/components/leads/ai-search-dialog.tsx`)**
  - ハイブリッド検索に対応: `hybridSearchMasterLeads()` を使用
  - フィルターUI追加:
    - エリアフィルター: 都道府県/市区町村を入力（例: "東京都 渋谷区"）
    - カテゴリフィルター: 業種を入力（例: "カフェ", "美容室"）
  - 検索結果にマッチした条件を表示（"エリア一致", "カテゴリ一致"バッジ）
  - リアルタイム検索対応（Enterキーで検索実行）

- **Secure Edit Action (`src/lib/actions/lead-actions.ts`)**
  - `updateLeadAction()` Server Action: Service層を呼び出すラッパー
  - 権限チェックとキャッシュ更新を実装

- **Lead Detail Sheet 統合 (`src/components/leads/lead-detail-sheet.tsx`)**
  - 新しい`updateLeadAction`を使用するように変更
  - sonnerでToast通知を表示（"更新しました（AIインデックスも再計算済み）"）
  - ステータス更新とメモ保存時に自動的にベクトル再計算

#### RAG実装 Phase 4: Logic Layer（データ整合性とハイブリッド検索）
- **Data Integrity Service (`src/services/lead-service.ts`)**
  - `updateLead()` メソッド: リード情報の更新を一元管理
  - トランザクション内で以下を実行:
    1. Snapshot: 更新前のデータを `LeadSnapshot` テーブルに保存（履歴作成）
    2. Update: `Lead` / `MasterLead` テーブルを更新
    3. Vectorize: 更新後のテキストを生成し、OpenAI Embedding APIをコールして `LeadVector` を再更新
  - ユーザーが編集した瞬間に「検索結果」と「履歴」が同期される

- **Hybrid Search Action (`src/lib/actions/hybrid-search.ts`)**
  - `hybridSearchMasterLeads()` 関数: 構造化フィルター + ベクトル検索
  - 2段階の検索を実行:
    1. Pre-filtering: filters に基づいて MasterLead のIDリストを絞り込み
    2. Vector Search: そのIDリストを使ってpgvectorで類似度検索
  - 「渋谷区(Filter) の 静かなカフェ(Vector)」という高精度な検索を実現

- **LeadSnapshot モデル (`prisma/schema.prisma`)**
  - リード情報の履歴管理用テーブル
  - 更新前のデータを自動保存
  - 将来の予知AIの燃料となる履歴データを蓄積

#### RAG実装 Phase 3: HNSWインデックス（高速検索対応）
- **HNSWインデックス追加**: ベクトル検索のパフォーマンス大幅向上
  - `lead_vectors_embedding_idx`: HNSWアルゴリズムによる近似最近傍検索
  - 大規模データセットでも高速な検索が可能
  - 将来の「予知機能」と「空気感検索」に対応可能な基盤
  - マイグレーション: `20260126133733_add_hnsw_index`
  - パラメータ: `m = 16`, `ef_construction = 64`, `vector_cosine_ops`

- **Prismaスキーマでのpgvector拡張機能設定**
  - `generator client` に `previewFeatures = ["postgresqlExtensions"]` を追加
  - `datasource db` に `extensions = [vector]` を追加
  - Prismaが自動的に `CREATE EXTENSION IF NOT EXISTS vector;` を実行

### 予定
- Phase 3: CRM Core & Dynamic Table 実装
- Phase 4: Analytics & Dashboard 実装
- Phase 5: Simulation 機能実装
- Phase 6: Scraping & CTI 統合（BullMQ、Playwright、Twilio）

---

## [2.0.1] - 2025-01-21

### 追加

#### AIリード強化機能 (Zen-Map Intelligence Engine)
- **Backend実装**: SerpApi + OpenAI連携によるリード情報自動強化
  - `enrichLeadWithIntelligence` Server Action: Google検索とAI解析による情報抽出
  - SerpApiでGoogle検索を実行し、検索結果（上位5件 + ナレッジグラフ）を取得
  - OpenAI (gpt-4o-mini) で構造化データを抽出（Structured Output）
  - 公式サイト、Instagram、X(Twitter)、Facebook、食べログ、Google Maps URLを自動取得
  - 店舗の特徴を20文字以内で要約生成

- **UI/UX実装**: アニメーション付きプロセス可視化
  - `AIEnrichButton` コンポーネント: 処理ステップを可視化するリッチなUI
  - framer-motionによるアニメーション（検索中 → 解析中 → 保存中）
  - 完了時に取得したSNSアイコンをポコポコと表示
  - モバイル対応のレスポンシブデザイン

- **結果表示機能**: 新規取得データのハイライト表示
  - リード詳細画面で新しく取得されたURLを光る枠線で強調表示
  - AIが生成したサマリーを店舗名の下に表示
  - 「🆕 AIが見つけました」バッジ表示（1分以内の新規取得データ）

#### Enterprise Grade 品質機能
- **コスト制御と冪等性**: 24時間以内の再実行を防止
  - `lastEnrichedAt` を確認し、24時間以内の場合は既存データを返す
  - 強制更新フラグ (`force`) による再実行オプション
  - 不要なAPIコスト（二重課金）を物理的に防止

- **エレガントなエラーハンドリング**: 具体的なエラーメッセージ表示
  - SerpApi/OpenAIのエラーを識別し、ユーザーフレンドリーなメッセージに変換
  - クォータ超過、タイムアウト、認証エラーなどを具体的に表示
  - フロントエンドでエラー状態を表示（赤色、再試行ボタン）

- **セキュリティとサニタイズ**: URL検証とHTMLタグ除去
  - すべてのURLが `http://` または `https://` で始まることを検証
  - AIが生成したテキストからHTMLタグを除去
  - 入力バリデーションとZodスキーマによる型安全性

### 変更
- `leads` テーブルに `enrichStatus`, `enrichedAt`, `lastEnrichedAt` フィールドを追加
- `sonner` パッケージを追加（トースト通知）
- `serpapi` パッケージを追加（Google検索API）
- `openai` パッケージを追加（AI構造化データ抽出）
- ルートレイアウトに `SonnerToaster` を追加
- `LeadDetailSheet` コンポーネントにAI強化ボタンを統合

### 技術スタック
- **serpapi**: Google検索API連携
- **openai**: AI構造化データ抽出（gpt-4o-mini）
- **sonner**: トースト通知システム
- **framer-motion**: アニメーションライブラリ
- **zod**: データバリデーション

### データベース変更
- `leads.enrichStatus`: 強化ステータス（PENDING/COMPLETED/FAILED）
- `leads.enrichedAt`: 初回強化日時
- `leads.lastEnrichedAt`: 最終強化日時（24時間制限チェック用）

### 環境変数
以下の環境変数の設定が必要です：
- `SERPAPI_API_KEY`: SerpApiのAPIキー
- `OPENAI_API_KEY`: OpenAIのAPIキー

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


