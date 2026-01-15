# API変更手順ガイド

このドキュメントでは、アプリケーションで使用している外部APIを新しいものに変更する手順を説明します。

## 現在使用中のAPI一覧

### 1. Apify API（Google Maps収集用）
- **環境変数**: `APIFY_API_TOKEN`
- **使用箇所**: `src/lib/actions/apify.ts`
- **Actor ID**: `compass/crawler-google-places`

### 2. OpenAI API（Embedding用）
- **環境変数**: `OPENAI_API_KEY`
- **使用箇所**: `src/lib/ai/embedding.ts`
- **エンドポイント**: `https://api.openai.com/v1/embeddings`

### 3. UberEats（スクレイピング）
- **API使用**: なし（直接スクレイピング）
- **使用箇所**: `src/features/scraper/worker.ts`

---

## API変更の一般的な手順

### ステップ1: 新しいAPIの準備

1. **新しいAPIのアカウント作成**
   - 新しいAPIプロバイダーのアカウントを作成
   - APIキー/トークンを取得

2. **API仕様の確認**
   - エンドポイントURL
   - 認証方法（API Key, Bearer Token, OAuth等）
   - リクエスト/レスポンス形式
   - レート制限
   - エラーハンドリング

### ステップ2: コードの修正

#### 2-1. 環境変数の追加/変更

**ローカル環境（`.env.local`）:**
```bash
# 古いAPI（コメントアウトまたは削除）
# OLD_API_TOKEN=old_token_here

# 新しいAPI
NEW_API_TOKEN=new_token_here
NEW_API_URL=https://api.newprovider.com/v1
```

**Railway環境変数の設定:**
1. Railwayダッシュボードで「Web App」サービスを選択
2. 「Variables」タブを開く
3. 新しい環境変数を追加
4. 古い環境変数は削除または無効化

#### 2-2. APIクライアントの実装

新しいAPI用のクライアント関数を作成：

```typescript
// src/lib/actions/new-api.ts
'use server';

export async function callNewAPI(params: any) {
  const apiKey = process.env.NEW_API_TOKEN;
  if (!apiKey) {
    throw new Error('NEW_API_TOKEN is not configured');
  }

  const response = await fetch('https://api.newprovider.com/v1/endpoint', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return await response.json();
}
```

#### 2-3. 既存コードの置き換え

古いAPI呼び出しを新しいAPIに置き換え：

```typescript
// 修正前
import { oldAPICall } from '@/lib/actions/old-api';
const result = await oldAPICall(params);

// 修正後
import { callNewAPI } from '@/lib/actions/new-api';
const result = await callNewAPI(params);
```

### ステップ3: テスト

1. **ローカル環境でのテスト**
   ```bash
   npm run dev
   ```
   - 新しいAPIが正しく動作するか確認
   - エラーハンドリングが適切か確認

2. **型定義の確認**
   ```bash
   npm run build
   ```
   - TypeScriptの型エラーがないか確認

### ステップ4: デプロイ

1. **GitHubにプッシュ**
   ```bash
   git add .
   git commit -m "feat: migrate to new API"
   git push origin develop
   ```

2. **Railwayでの環境変数設定**
   - 新しい環境変数を追加
   - 古い環境変数を削除（動作確認後）

3. **動作確認**
   - Staging環境で動作確認
   - 問題なければ本番環境に反映

---

## 具体的なAPI変更例

### 例1: Apify APIの変更

#### 新しいApify Actorに変更する場合

**ファイル**: `src/lib/actions/apify.ts`

```typescript
// 修正前
const run = await apifyClient.actor('compass/crawler-google-places').start(input, {
  // ...
});

// 修正後
const run = await apifyClient.actor('new-actor-id/new-actor-name').start(input, {
  // ...
});
```

**環境変数**: 変更不要（同じ`APIFY_API_TOKEN`を使用）

---

### 例2: OpenAI APIから別のEmbedding APIに変更

#### OpenAI → 別のEmbedding API（例: Cohere, Hugging Face）

**ファイル**: `src/lib/ai/embedding.ts`

```typescript
// 修正前
const response = await fetch('https://api.openai.com/v1/embeddings', {
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  // ...
});

// 修正後
const response = await fetch('https://api.cohere.ai/v1/embed', {
  headers: {
    'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
  },
  // ...
});
```

**環境変数の変更**:
- 削除: `OPENAI_API_KEY`
- 追加: `COHERE_API_KEY`

---

### 例3: 新しいスクレイピングサービスに変更

#### Apify → 別のスクレイピングサービス（例: ScraperAPI, Bright Data）

**新しいサービス用のServer Actionを作成**:

```typescript
// src/lib/actions/scraper-api.ts
'use server';

export async function startScraperAPICollection(params: any) {
  const apiKey = process.env.SCRAPER_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: 'SCRAPER_API_KEY is not configured',
    };
  }

  // 新しいAPIの実装
  // ...
}
```

**UIコンポーネントの更新**:
- `src/components/leads/google-maps-scraper-dialog.tsx`で新しいAPIを呼び出すように変更

---

## トラブルシューティング

### エラー: "API_TOKEN is not configured"

**原因**: 環境変数が設定されていない

**解決方法**:
1. `.env.local`に環境変数を追加
2. Railwayの環境変数を確認
3. アプリケーションを再起動

### エラー: "API rate limit exceeded"

**原因**: APIのレート制限に達した

**解決方法**:
1. APIプロバイダーのプランを確認
2. リクエスト間隔を調整
3. バッチ処理を実装

### エラー: "Invalid API response format"

**原因**: 新しいAPIのレスポンス形式が異なる

**解決方法**:
1. APIドキュメントでレスポンス形式を確認
2. レスポンスのパース処理を修正
3. 型定義を更新

---

## チェックリスト

変更作業を進める際のチェックリスト：

- [ ] 新しいAPIのアカウント作成とキー取得
- [ ] 新しいAPIのドキュメント確認
- [ ] 環境変数の追加（ローカル・Railway）
- [ ] 新しいAPIクライアントの実装
- [ ] 既存コードの置き換え
- [ ] 型定義の更新
- [ ] ローカル環境でのテスト
- [ ] ビルドエラーの確認
- [ ] GitHubへのプッシュ
- [ ] Railwayでの環境変数設定
- [ ] Staging環境での動作確認
- [ ] 本番環境への反映

---

## 参考資料

- [Apify API Documentation](https://docs.apify.com/api)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
