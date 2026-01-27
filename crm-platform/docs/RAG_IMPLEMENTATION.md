# RAG実装ドキュメント

## 概要

本システムでは、Retrieval-Augmented Generation (RAG) の技術を活用して、MasterLeadデータに対する自然言語ベースのベクトル検索機能を実装しています。OpenAIのEmbedding APIとPostgreSQLのpgvector拡張を使用し、セマンティック検索を実現しています。

**実装状況（2026年1月時点）:**
- ✅ Phase 1: 基本的なベクトル検索機能
- ✅ Phase 2: HNSWインデックスによる高速検索
- ✅ Phase 3: ハイブリッド検索（構造化フィルター + ベクトル検索）
- ✅ Phase 4: データ整合性サービス（自動ベクトル化、履歴管理）

## アーキテクチャ

```
┌─────────────────┐
│  ユーザー検索    │
│  (自然言語)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AISearchDialog  │
│  (UI Component) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ hybridSearch    │
│ MasterLeads     │
│ (Server Action) │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌──────────────┐
│generate │ │ PostgreSQL   │
│Embedding│ │ + pgvector   │
│(OpenAI) │ │ + HNSW Index │
└────┬────┘ └──────┬───────┘
     │             │
     │             │
     └─────┬───────┘
           │
           ▼
    ┌──────────────┐
    │ LeadVector   │
    │ テーブル     │
    │ (ベクトルDB) │
    └──────────────┘
```

## データベーススキーマ

### LeadVector テーブル

```prisma
model LeadVector {
  id           String                      @id @default(uuid())
  masterLeadId String                      @unique @map("master_lead_id")
  masterLead   MasterLead                  @relation(fields: [masterLeadId], references: [id], onDelete: Cascade)
  content      String // ベクトル化したテキスト
  embedding    Unsupported("vector(1536)") // OpenAI text-embedding-3-small の次元数
  createdAt    DateTime                    @default(now()) @map("created_at")

  @@index([masterLeadId])
  @@map("lead_vectors")
}
```

**特徴:**
- `embedding`: 1536次元のベクトル（OpenAI `text-embedding-3-small` モデル）
- `content`: ベクトル化された元のテキスト（検索対象の情報を構造化）
- `masterLeadId`: MasterLeadとの1対1リレーション
- **HNSWインデックス**: `lead_vectors_embedding_idx` により高速検索を実現

### MasterLead テーブル

```prisma
model MasterLead {
  id          String  @id @default(cuid())
  companyName String  @map("company_name")
  phone       String?
  address     String?
  source      String
  data        Json

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  leads      Lead[]
  leadVector LeadVector?

  @@index([companyName])
  @@index([phone])
  @@map("master_leads")
}
```

### LeadSnapshot テーブル（履歴管理）

```prisma
model LeadSnapshot {
  id         String   @id @default(cuid())
  leadId     String   @map("lead_id")
  lead       Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  status     String
  data       Json     // その時点での全データ
  capturedAt DateTime @default(now()) @map("captured_at")
  reason     String?  // 例: "update", "daily_log", "user_edit"

  @@index([leadId])
  @@map("lead_snapshots")
}
```

**用途:**
- リード情報の更新履歴を保存
- 将来の予知AIの燃料となる履歴データを蓄積
- データの整合性と監査証跡を提供

## 主要コンポーネント

### 1. Embedding生成 (`src/lib/ai/embedding.ts`)

**機能:** テキストをベクトル化する

**使用モデル:**
- `text-embedding-3-small` (デフォルト)
- 次元数: 1536

**実装:**

```typescript
export async function generateEmbedding(
  text: string,
  options: EmbeddingOptions = {}
): Promise<number[]>
```

**特徴:**
- OpenAI Embedding APIを直接呼び出し
- エラーハンドリングとバリデーション
- カスタマイズ可能なモデル・次元数

### 2. AI検索 (`src/lib/actions/ai-search.ts`)

**機能:** ベクトル類似度検索でMasterLeadを検索

**実装:**

```typescript
export async function searchMasterLeadsByAI(
  query: string,
  limit: number = 20
)
```

**検索アルゴリズム:**
1. 検索クエリをベクトル化
2. pgvectorの `<=>` 演算子でコサイン距離を計算
3. HNSWインデックスを使用して高速検索
4. 類似度スコア（1 - 距離）でソート
5. 上位N件を返却

**SQLクエリ:**
```sql
SELECT 
  ml.id,
  ml.company_name as "companyName",
  ml.phone,
  ml.address,
  ml.source,
  ml.data,
  1 - (lv.embedding <=> ${queryVector}::vector) as similarity
FROM master_leads ml
INNER JOIN lead_vectors lv ON lv."masterLeadId" = ml.id
WHERE lv.embedding <=> ${queryVector}::vector < 1.0
ORDER BY lv.embedding <=> ${queryVector}::vector ASC
LIMIT ${limit}
```

### 3. ハイブリッド検索 (`src/lib/actions/hybrid-search.ts`)

**機能:** 構造化フィルター + ベクトル検索の組み合わせ

**実装:**

```typescript
export async function hybridSearchMasterLeads(
  query: string,
  filters: HybridSearchFilters = {},
  limit: number = 20
)
```

**検索アルゴリズム（2段階）:**
1. **Pre-filtering**: filters に基づいて MasterLead のIDリストを絞り込み
   - エリア（住所）
   - カテゴリ（業種）
   - ソース
   - 電話番号
   - カスタムフィルター（dataフィールド内の検索）
2. **Vector Search**: そのIDリストを使ってpgvectorで類似度検索
   - HNSWインデックスを活用した高速検索

**使用例:**
```typescript
// 「渋谷区の静かなカフェ」を検索
const results = await hybridSearchMasterLeads(
  "静かなカフェ",
  { area: "渋谷区" },
  20
);
```

**フィルター条件:**
```typescript
interface HybridSearchFilters {
  area?: string;        // エリアフィルター（住所に含まれる文字列）
  category?: string;    // 業種フィルター（カテゴリ）
  source?: string;      // ソースフィルター
  phone?: string;       // 電話番号フィルター
  customFilters?: {     // その他のカスタムフィルター
    [key: string]: string | number | boolean;
  };
}
```

### 4. データ整合性サービス (`src/services/lead-service.ts`)

**機能:** リード情報の更新を一元管理し、履歴とベクトルを自動更新

**実装:**

```typescript
export async function updateLead(
  leadId: string,
  updateData: UpdateLeadData,
  reason: string = "update"
)
```

**処理フロー（トランザクション内）:**
1. **Snapshot**: 更新前のデータを `LeadSnapshot` テーブルに保存（履歴作成）
2. **Update**: `Lead` / `MasterLead` テーブルを更新
3. **Vectorize**: 更新後のテキストを生成し、OpenAI Embedding APIをコールして `LeadVector` を再更新

**特徴:**
- ユーザーが編集した瞬間に「検索結果」と「履歴」が同期される
- トランザクションにより、データの整合性を保証
- Embedding生成に失敗しても、Leadの更新は成功とする（エラーハンドリング）

### 5. Server Action Wrapper (`src/actions/lead-actions.ts`)

**機能:** Service層を呼び出すServer Action

**実装:**

```typescript
export async function updateLeadAction(
  id: string,
  data: UpdateLeadData,
  reason: string = "user_edit"
)
```

**処理:**
- 権限チェック
- Service層の `updateLead` を呼び出し
- キャッシュ更新（`revalidatePath`）

### 6. バッチ処理スクリプト (`scripts/generate-embeddings.ts`)

**機能:** MasterLeadデータを一括でベクトル化

**実行方法:**
```bash
npx tsx scripts/generate-embeddings.ts
```

**処理フロー:**
1. 既存のベクトルデータを確認
2. 未処理のMasterLeadを取得
3. バッチ処理（10件ずつ、200ms待機）
4. 各リードのテキストを生成
5. Embedding APIでベクトル化
6. LeadVectorテーブルに保存

**テキスト生成ロジック (`createContent`):**
- 店名、住所、電話番号、ソース
- カテゴリ、概要、評価、レビュー数
- 営業時間、定休日、交通手段
- その他のメタデータ

**レート制限対策:**
- バッチサイズ: 10件
- API呼び出し間隔: 200ms
- エラーハンドリングとリトライ

### 7. UIコンポーネント (`src/components/leads/ai-search-dialog.tsx`)

**機能:** 検索UIと結果表示

**特徴:**
- 自然言語での検索入力
- フィルター条件の指定（エリア、カテゴリなど）
- リアルタイム検索結果表示
- 類似度スコアの表示（%）
- 検索結果からプロジェクト作成機能

**使用方法:**
```tsx
<AISearchDialog />
```

## 使用方法

### 1. 環境変数の設定

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### 2. データベースの準備

**Prismaスキーマでの拡張機能設定:**

`prisma/schema.prisma` でpgvector拡張を有効化:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector]
}
```

この設定により、Prismaが自動的に `CREATE EXTENSION IF NOT EXISTS vector;` を実行します。

**Dockerイメージの確認:**

`docker-compose.yml` でpgvector対応のPostgreSQLイメージを使用していることを確認:

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16  # 標準のpostgres:16では動作しません
```

### 3. HNSWインデックスの適用

高速検索のためのHNSWインデックスを適用:

```bash
cd crm-platform
npx prisma migrate deploy
```

または、開発環境の場合:

```bash
npx prisma db push
```

**注意:** 既存のベクトルデータが多い場合、インデックス作成に数分〜数十分かかる可能性があります。

**インデックス定義:**
```sql
CREATE INDEX IF NOT EXISTS lead_vectors_embedding_idx 
ON lead_vectors 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

**パラメータ説明:**
- `m = 16`: 各ノードが接続できる最大のリンク数（デフォルト16、推奨16-64）
- `ef_construction = 64`: インデックス構築時の探索範囲（デフォルト64、推奨64-200）
- `vector_cosine_ops`: コサイン類似度検索用の演算子クラス

### 4. ベクトルデータの生成

既存のMasterLeadデータをベクトル化:

```bash
cd crm-platform
npx tsx scripts/generate-embeddings.ts
```

**出力例:**
```
🚀 ベクトル生成バッチを開始します...
📊 既存のベクトルデータを確認中...
   ✅ 既存ベクトル: 1000件
📋 未処理のMasterLeadを取得中...
   ✅ 未処理のリード数: 500件
📦 バッチ処理を開始します（バッチサイズ: 10件、待機時間: 200ms）
...
✅ 成功: 500件
❌ エラー: 0件
⏭️  スキップ: 0件
```

### 5. 検索の実行

**UIから自然言語で検索:**
- 「大阪のカフェ」
- 「高評価のレストラン」
- 「渋谷の美容院」

**ハイブリッド検索の使用例:**
```typescript
// エリア + キーワード検索
const results = await hybridSearchMasterLeads(
  "隠れ家っぽいデート向きの店",
  { area: "渋谷区" },
  20
);
```

## 実装の詳細

### ベクトル化されるテキストの構造

各MasterLeadは以下のような構造化テキストに変換されます:

```
店名: 〇〇カフェ
住所: 大阪府大阪市...
電話番号: 06-1234-5678
ソース: tabelog.com
カテゴリ: カフェ・喫茶
評価: 4.5
レビュー数: 120
営業時間: 10:00-22:00
定休日: 火曜日
```

### 類似度計算

- **コサイン距離**: pgvectorの `<=>` 演算子を使用
- **類似度スコア**: `1 - 距離` (0に近いほど類似、1に近いほど類似)
- **閾値**: 距離 < 1.0 のレコードのみ取得

### パフォーマンス最適化

1. **HNSWインデックス**: `embedding` カラムにHNSWインデックスを追加
   - 高速な近似最近傍検索を実現
   - 大規模データセットでも高速な検索が可能
   - 将来の「予知機能」と「空気感検索」に対応
   - マイグレーション: `20260126133733_add_hnsw_index`
2. **インデックス**: `masterLeadId` にインデックス
3. **バッチ処理**: レート制限を考慮したバッチサイズ
4. **LIMIT句**: 検索結果数を制限
5. **Pre-filtering**: ハイブリッド検索で検索範囲を事前に絞り込み

## 実装フェーズ

### ✅ Phase 1: 基本的なベクトル検索機能
- Embedding生成機能
- ベクトル検索機能
- UIコンポーネント

### ✅ Phase 2: HNSWインデックス（高速検索対応）
- HNSWインデックスの追加
- パフォーマンスの大幅向上
- 大規模データセットへの対応

### ✅ Phase 3: ハイブリッド検索
- 構造化フィルター + ベクトル検索の組み合わせ
- Pre-filteringによる検索範囲の最適化
- 高精度な検索の実現

### ✅ Phase 4: データ整合性サービス
- 自動ベクトル化（更新時の自動再計算）
- 履歴管理（LeadSnapshot）
- トランザクションによる整合性保証

## 今後の改善案

### Phase 5: 検索精度の向上
- チャンキング戦略の改善
- メタデータの活用
- フィルタリング機能の追加
- 重み付けによる検索結果の最適化

### Phase 6: パフォーマンス改善
- ベクトルインデックスの最適化
- キャッシュ機能の実装
- 検索結果のページネーション
- 非同期処理によるバックグラウンドジョブ

### Phase 7: 予知機能と空気感検索
- 履歴データを活用した予測機能
- 感情分析や雰囲気検索
- 時系列データの分析

## 関連ファイル

- `src/lib/ai/embedding.ts` - Embedding生成関数
- `src/lib/actions/ai-search.ts` - 基本的なベクトル検索Server Action
- `src/lib/actions/hybrid-search.ts` - ハイブリッド検索Server Action
- `src/services/lead-service.ts` - データ整合性サービス
- `src/actions/lead-actions.ts` - Server Action Wrapper
- `src/components/leads/ai-search-dialog.tsx` - 検索UI
- `scripts/generate-embeddings.ts` - バッチ処理スクリプト
- `prisma/schema.prisma` - データベーススキーマ
- `prisma/migrations/20260126133733_add_hnsw_index/migration.sql` - HNSWインデックスマイグレーション

## 参考資料

- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [HNSW Algorithm](https://arxiv.org/abs/1603.09320)
- [RAG (Retrieval-Augmented Generation)](https://arxiv.org/abs/2005.11401)
