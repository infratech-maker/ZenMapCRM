# AIリード強化機能 マニュアル

## 概要

Zen-Map Intelligence Engineは、SerpApiとOpenAIを連携させて、リード情報を自動的に強化する機能です。店舗名と住所から、公式サイト、SNSアカウント、食べログ、Google MapsなどのURLを自動取得し、店舗の特徴を要約します。

## 機能説明

### 主な機能

1. **Google検索による情報収集**
   - SerpApiを使用してGoogle検索を実行
   - 検索結果の上位5件とナレッジグラフを取得

2. **AIによる構造化データ抽出**
   - OpenAI (gpt-4o-mini) で検索結果を解析
   - 公式サイト、SNS、食べログ、Google Maps URLを抽出
   - 店舗の特徴を20文字以内で要約

3. **取得情報の表示**
   - リード詳細画面で取得したURLを表示
   - 新規取得データは光る枠線でハイライト表示
   - AIが生成したサマリーを店舗名の下に表示

## 使い方

### 1. リード詳細画面を開く

1. ダッシュボードの「Action Inbox」をクリック
2. リード一覧から任意のリードをクリック
3. リード詳細シートが右側に表示されます

### 2. AI強化ボタンをクリック

1. リード詳細シートの上部にある「✨ AIで情報を補完する」ボタンをクリック
2. 処理が開始され、以下のステップが表示されます：
   - 🔍 Googleで検索中...
   - 🧠 AIがWebサイトを解析中...
   - 📝 データをクレンジング中...

### 3. 結果の確認

処理が完了すると：
- ✅ 完了メッセージが表示されます
- 取得したURL（Instagram、X、Facebook、Website、Google Maps）のアイコンが表示されます
- リード詳細シートに取得したURLが追加表示されます
- 新規取得データは「🆕 AIが見つけました」バッジと光る枠線で強調表示されます

## コスト制御機能

### 24時間制限

同じリードに対して、24時間以内に再度AI強化を実行した場合：
- SerpApi/OpenAIは呼び出されません
- 既存のデータがそのまま返されます
- 不要なAPIコストを防止します

### 強制更新

24時間以内でも再度取得したい場合は：
- エラー状態になった場合、「再試行する」ボタンをクリック
- これにより強制更新（`force: true`）が実行されます

## エラーハンドリング

### エラーが発生した場合

エラーが発生すると：
- ボタンが赤色に変化し、「❌ エラーが発生しました」と表示されます
- 具体的なエラーメッセージが表示されます
- 「再試行する」ボタンが表示されます

### 主なエラーメッセージ

- **検索クォータを超過しました**: SerpApiの利用制限に達しました
- **AIが応答しませんでした**: OpenAIのタイムアウト（30秒）
- **ネットワークエラーが発生しました**: インターネット接続の問題
- **検索APIの設定に問題があります**: `SERPAPI_API_KEY` が設定されていません

## 環境変数の設定

### 必要な環境変数

以下の環境変数を `.env.local` に設定してください：

```bash
# SerpApiのAPIキー
SERPAPI_API_KEY=your_serpapi_key_here

# OpenAIのAPIキー
OPENAI_API_KEY=your_openai_key_here
```

### APIキーの取得方法

#### SerpApi

1. [SerpApi](https://serpapi.com/) にアクセス
2. アカウントを作成
3. ダッシュボードからAPIキーを取得

#### OpenAI

1. [OpenAI Platform](https://platform.openai.com/) にアクセス
2. アカウントを作成
3. API KeysセクションからAPIキーを取得

### Railway/Vercelへのデプロイ時

本番環境にデプロイする場合も、環境変数を設定してください：

**Railway:**
1. Railwayダッシュボードでサービスを選択
2. 「Variables」タブを開く
3. `SERPAPI_API_KEY` と `OPENAI_API_KEY` を追加

**Vercel:**
1. Vercelダッシュボードでプロジェクトを選択
2. 「Settings」→「Environment Variables」を開く
3. `SERPAPI_API_KEY` と `OPENAI_API_KEY` を追加

## データベース変更

### マイグレーション

以下のマイグレーションが適用されています：

```sql
ALTER TABLE leads 
ADD COLUMN enrich_status TEXT,
ADD COLUMN enriched_at TIMESTAMP(3),
ADD COLUMN last_enriched_at TIMESTAMP(3);
```

### フィールド説明

- **enrichStatus**: 強化ステータス
  - `PENDING`: 処理中
  - `COMPLETED`: 完了
  - `FAILED`: 失敗

- **enrichedAt**: 初回強化日時
- **lastEnrichedAt**: 最終強化日時（24時間制限チェック用）

## セキュリティ機能

### URL検証

- すべてのURLが `http://` または `https://` で始まることを検証
- 無効なURLは `null` として保存されます

### HTMLサニタイズ

- AIが生成したテキストからHTMLタグを除去
- XSS攻撃を防止します

## トラブルシューティング

### ボタンをクリックしても何も起こらない

1. ブラウザのコンソールでエラーを確認
2. 環境変数が正しく設定されているか確認
3. ネットワーク接続を確認

### 「検索APIの設定に問題があります」エラー

- `SERPAPI_API_KEY` が `.env.local` に設定されているか確認
- 本番環境の場合は、Railway/Vercelの環境変数を確認

### 「AIサービスの設定に問題があります」エラー

- `OPENAI_API_KEY` が `.env.local` に設定されているか確認
- 本番環境の場合は、Railway/Vercelの環境変数を確認

### 処理が途中で止まる

- ネットワーク接続を確認
- ブラウザのコンソールでエラーを確認
- 「再試行する」ボタンをクリック

## 技術詳細

### 処理フロー

1. **リード情報の取得**
   - データベースから店舗名と住所を取得

2. **Google検索**
   - SerpApiで `店舗名 住所` を検索
   - 検索結果の上位5件とナレッジグラフを取得

3. **AI解析**
   - OpenAIに検索結果を送信
   - Structured Outputで構造化データを抽出

4. **データ検証**
   - URLの妥当性を検証
   - HTMLタグを除去

5. **データベース更新**
   - 取得した情報を `leads.data` に保存
   - `enrichStatus`, `enrichedAt`, `lastEnrichedAt` を更新

### 使用技術

- **SerpApi**: Google検索API
- **OpenAI**: gpt-4o-mini（Structured Output）
- **Zod**: データバリデーション
- **framer-motion**: アニメーション
- **sonner**: トースト通知

## 関連ドキュメント

- [CHANGELOG.md](./CHANGELOG.md): 変更履歴
- [README.md](../README.md): プロジェクト概要
- [API_MIGRATION_GUIDE.md](./API_MIGRATION_GUIDE.md): API変更手順
