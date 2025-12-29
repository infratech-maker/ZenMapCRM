# データモデル設計ドキュメント

## 1. 組織階層: Closure Table パターン

### 設計理由

**問題:**
- 単純な `parent_id` による階層構造では、深い階層の集計時に再帰CTEが必要
- 「直営配下の全代理店の売上合計」のようなクエリが複雑でパフォーマンスが劣化

**解決策:**
- **Closure Table パターン**を採用
- 任意の2ノード間の関係を事前計算して保持
- 1回のJOINで任意の深さの階層を取得可能

### 実装詳細

#### `organizations` テーブル
- 組織の基本情報を保持
- `parent_id`: 直接の親組織への参照（UI表示用）
- `path`: Materialized Path（補助的な高速化用、例: "/root/direct/partner-001"）
- `level`: 階層レベル（0 = ルート）

#### `organization_closure` テーブル
- **ancestor_id**: 祖先組織ID
- **descendant_id**: 子孫組織ID
- **depth**: 距離（0 = 自己参照、1 = 直接の親子、2+ = 間接的）

**例:**
組織A > 組織B > 組織C の場合:
```
(ancestor_id, descendant_id, depth)
(A, A, 0)      # 自己参照
(A, B, 1)      # Aの直接の子
(A, C, 2)      # Aの孫
(B, B, 0)      # 自己参照
(B, C, 1)      # Bの直接の子
(C, C, 0)      # 自己参照
```

### クエリ例

**直営配下の全組織を取得:**
```sql
SELECT o.*
FROM organizations o
INNER JOIN organization_closure oc ON o.id = oc.descendant_id
WHERE oc.ancestor_id = '直営組織ID'
  AND oc.depth > 0;  -- 自分自身を除外
```

**1次代理店配下の全ユニットの売上合計:**
```sql
SELECT SUM(pl.amount)
FROM pl_records pl
INNER JOIN organization_closure oc ON pl.organization_id = oc.descendant_id
WHERE oc.ancestor_id = '1次代理店ID'
  AND oc.depth > 0
  AND pl.item_type = 'revenue';
```

### パフォーマンス

- **インデックス戦略:**
  - `(ancestor_id, descendant_id)` 複合主キー
  - `ancestor_id` 単独インデックス
  - `descendant_id` 単独インデックス
  - `depth` インデックス

- **集計クエリの高速化:**
  - 再帰CTE不要
  - 1回のJOINで全子孫を取得
  - Materialized Viewとの組み合わせで更なる高速化が可能

---

## 2. 動的カラム: メタデータ駆動設計

### 設計理由

**問題:**
- 商材ごとに管理項目が異なる
  - 通信系: 回線速度、契約期間、オプション
  - 保険系: 保険金額、被保険者情報、特約
  - 不動産系: 物件情報、希望エリア、予算
- スキーマ変更なしで項目を追加・編集したい

**解決策:**
- **定義（Definitions）と値（Values）を分離**
- メタデータテーブルで項目定義を管理
- JSONBで柔軟な値の格納

### 実装詳細

#### `product_field_definitions` テーブル
商材ごとのフィールド定義を保持:

- `product_id`: 商材ID
- `field_key`: 内部キー（例: "phone_number"）
- `field_label`: 表示ラベル（例: "電話番号"）
- `field_type`: フィールドタイプ（text, number, date, select, etc.）
- `is_required`: 必須フラグ
- `is_unique`: 重複チェック用フラグ
- `options`: 選択肢（select/multiselect用のJSONB）

#### `customer_field_values` テーブル
顧客ごとのフィールド値を保持:

- `customer_id`: 顧客ID
- `field_definition_id`: フィールド定義ID
- `value`: 値（JSONBで型に応じた値を格納）

**値の形式例:**
```json
// text
"090-1234-5678"

// number
123.45

// date
"2024-01-01"

// select
"option1"

// multiselect
["option1", "option2"]

// boolean
true

// currency
{ "amount": 10000, "currency": "JPY" }
```

### パフォーマンス考慮

**頻繁に検索されるフィールドの最適化:**
- 電話番号など、重複チェックや検索で頻繁に使われるフィールドは、`customers` テーブルに専用カラムとして追加
- 例: `customers.phone_number` カラムを追加し、動的フィールドと同期

**インデックス戦略:**
- `(customer_id, field_definition_id)` 複合インデックス
- 電話番号など、`is_unique=true` のフィールドにはGINインデックスを検討

### UI実装方針（Phase 2）

1. **フィールド定義管理画面:**
   - 商材を選択
   - フィールドを追加・編集・削除
   - フィールドタイプ、必須、重複チェックなどの設定

2. **顧客リスト（TanStack Table）:**
   - フィールド定義に基づいて列を動的生成
   - 編集可能なセル
   - フィルタリング・ソート対応

---

## 3. KPI/PL管理: 多軸集計対応

### 設計理由

**要件:**
- 組織階層（直営/パートナー/ユニット/個人）ごとの集計
- 商材別の集計
- 期間別（日次/週次/月次/年次）の集計
- ドリルダウン分析

**解決策:**
- 正規化されたテーブル設計
- `organization_id`, `product_id`, `record_date`, `period_type` で多軸集計を実現

### 実装詳細

#### `kpi_records` テーブル
KPI記録を保持:

- `organization_id`: 組織ID（NULL可、全体集計の場合）
- `product_id`: 商材ID（NULL可、全体集計の場合）
- `customer_id`: 顧客ID（NULL可、個別記録の場合）
- `kpi_type`: KPI種別（toss_count, toss_rate, pre_confirmed, etc.）
- `value`: 値（numeric(15, 4) - 率は小数点4桁まで）
- `record_date`: 記録日
- `period_type`: 期間タイプ（daily, weekly, monthly, yearly）

#### `pl_records` テーブル
PL記録（損益計算書）を保持:

- `organization_id`, `product_id`, `customer_id`: 同上
- `item_type`: PL項目種別（revenue, gross_profit, operating_profit, etc.）
- `amount`: 金額（numeric(15, 2)）
- `record_date`, `period_type`: 同上
- `is_actual`: 予実区分（actual, forecast, simulation）
- `simulation_id`: シミュレーション実行時のID

#### `simulations` テーブル
シミュレーション実行履歴:

- `name`: シミュレーション名
- `parameters`: シミュレーション条件（JSON）
- `projected_revenue`, `projected_gross_profit`, `projected_operating_profit`: 計算済み結果

### 集計クエリ戦略

**リアルタイム集計:**
- 負荷が高いため、Materialized View または非同期集計を推奨
- Supabase Edge Functions での非同期集計

**集計例:**
```sql
-- 直営配下の全組織の月次売上合計
SELECT 
  DATE_TRUNC('month', pl.record_date) AS month,
  SUM(pl.amount) AS total_revenue
FROM pl_records pl
INNER JOIN organization_closure oc ON pl.organization_id = oc.descendant_id
WHERE oc.ancestor_id = '直営組織ID'
  AND pl.item_type = 'revenue'
  AND pl.period_type = 'monthly'
GROUP BY DATE_TRUNC('month', pl.record_date);
```

### インデックス戦略

- `(organization_id, record_date)` 複合インデックス
- `(product_id, record_date)` 複合インデックス
- `period_type` インデックス

---

## 4. 金額計算: 正確性の担保

### 設計理由

**問題:**
- JavaScriptの `number` 型は浮動小数点数のため、金銭計算で誤差が発生
- 例: `0.1 + 0.2 = 0.30000000000000004`

**解決策:**
- **DB側**: `numeric(15, 2)` 型を使用
- **アプリ側**: `decimal.js` ライブラリを使用
- 両者で整合性を保つ

### 実装方針

```typescript
import Decimal from "decimal.js";

// アプリ側での計算
const amount1 = new Decimal("100.50");
const amount2 = new Decimal("200.30");
const total = amount1.plus(amount2); // "300.80"

// DBへの保存
await db.insert(plRecords).values({
  amount: total.toString(), // "300.80"
  // ...
});
```

---

## 5. パフォーマンス最適化戦略

### Materialized View

リアルタイム集計の負荷を下げるため、Materialized Viewを活用:

```sql
CREATE MATERIALIZED VIEW mv_organization_revenue_monthly AS
SELECT 
  oc.ancestor_id AS organization_id,
  DATE_TRUNC('month', pl.record_date) AS month,
  SUM(pl.amount) AS total_revenue
FROM pl_records pl
INNER JOIN organization_closure oc ON pl.organization_id = oc.descendant_id
WHERE pl.item_type = 'revenue'
GROUP BY oc.ancestor_id, DATE_TRUNC('month', pl.record_date);

-- 定期的にリフレッシュ（cron jobなど）
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_organization_revenue_monthly;
```

### 非同期集計（Supabase Edge Functions）

Supabase Edge Functions を使用して非同期で集計を実行:

1. データ更新時にトリガー
2. Edge Function で集計を実行
3. 結果をキャッシュテーブルに保存
4. ダッシュボードはキャッシュから読み取り

---

## まとめ

### 設計のポイント

1. **Closure Table**: 深い階層の高速集計
2. **メタデータ駆動**: スキーマ変更なしで柔軟な拡張
3. **多軸集計**: 組織/商材/期間でのドリルダウン分析
4. **正確な金額計算**: numeric + decimal.js
5. **パフォーマンス**: Materialized View / 非同期集計

### 次のステップ（Phase 2以降）

- TanStack Table による動的テーブル実装
- フィールド定義管理画面
- KPI集計クエリの実装
- Recharts ダッシュボード
- シミュレーション機能


