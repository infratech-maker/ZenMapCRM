# Apifyアカウント変更チェックリスト

Apifyアカウントを変更した際の確認事項と手順です。

## ✅ コード側の確認

コードは環境変数ベースで実装されているため、**コードの変更は不要**です。

### 確認ポイント

1. **環境変数のみで動作**
   - `APIFY_API_TOKEN` は環境変数から読み込まれます
   - Actor ID (`compass/crawler-google-places`) は変更不要です

2. **使用箇所**
   - `src/lib/actions/apify.ts`: Apify API呼び出し
   - `src/app/api/webhooks/apify/route.ts`: Webhook受信

---

## 🔧 必要な設定変更

### 1. 環境変数の更新

#### ローカル環境（`.env.local`）

```bash
# 新しいApifyアカウントのAPIトークンに更新
APIFY_API_TOKEN=your_new_apify_api_token_here

# 以下は変更不要（既存の値を使用）
APIFY_WEBHOOK_SECRET=your_existing_webhook_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000  # または本番URL
```

#### Railway環境変数の更新

1. Railwayダッシュボードで「Web App」サービスを選択
2. 「Variables」タブを開く
3. `APIFY_API_TOKEN` を編集して新しいトークンに更新
4. 保存後、サービスが自動的に再デプロイされます

---

### 2. 新しいApifyアカウントでの確認事項

#### ✅ Actorの利用可能性

使用しているActor: `compass/crawler-google-places`

**確認方法:**
1. [Apify Console](https://console.apify.com/)にログイン
2. 検索バーで `compass/crawler-google-places` を検索
3. Actorが表示され、実行可能であることを確認

**注意**: もしActorが見つからない、または実行できない場合は：
- Actorが有料プランでのみ利用可能な可能性があります
- 新しいアカウントのプランを確認してください

#### ✅ クレジット残高

1. Apify Consoleの「Usage & Billing」を確認
2. 十分なクレジットがあることを確認
3. プランが適切であることを確認

#### ✅ APIトークンの権限

1. Settings > Integrations > Personal API tokens
2. 使用しているトークンが有効であることを確認
3. 必要に応じて新しいトークンを作成

---

### 3. Webhook設定の確認

Webhookは自動的に設定されるため、**手動での設定変更は不要**です。

**確認ポイント:**
- `NEXT_PUBLIC_APP_URL` が正しいURLを指しているか
- `APIFY_WEBHOOK_SECRET` が設定されているか
- Webhookエンドポイント (`/api/webhooks/apify`) がアクセス可能か

---

## 🧪 動作確認手順

### 1. ローカル環境でのテスト

```bash
# 環境変数を更新
# .env.local に新しい APIFY_API_TOKEN を設定

# 開発サーバーを再起動
npm run dev
```

**テスト手順:**
1. ブラウザで `http://localhost:3000/dashboard/leads` にアクセス
2. 「Google Map収集」ボタンをクリック
3. テスト用のキーワードとエリアを入力（例: キーワード「ラーメン」、エリア「東京」）
4. 収集上限数を「10件」に設定
5. 「収集開始」をクリック
6. エラーが表示されないことを確認

### 2. Railway環境でのテスト

1. Railwayで環境変数を更新
2. 自動再デプロイを待つ（2-3分）
3. Staging環境で同様のテストを実行

---

## ⚠️ よくある問題と解決方法

### 問題1: "APIFY_API_TOKEN is not configured"

**原因**: 環境変数が設定されていない、または更新されていない

**解決方法:**
1. `.env.local` に `APIFY_API_TOKEN` が正しく設定されているか確認
2. Railwayの環境変数を確認
3. アプリケーションを再起動

### 問題2: "Actor not found" または "Actor not accessible"

**原因**: 新しいアカウントでActorが利用できない

**解決方法:**
1. Apify ConsoleでActorが存在するか確認
2. アカウントのプランを確認（有料プランが必要な可能性）
3. Actorの代替案を検討

### 問題3: "Insufficient credits"

**原因**: 新しいアカウントのクレジットが不足

**解決方法:**
1. Apify Consoleの「Usage & Billing」でクレジット残高を確認
2. 必要に応じてクレジットを追加

### 問題4: Webhookが受信されない

**原因**: Webhook URLが正しくない、またはシークレットが一致しない

**解決方法:**
1. `NEXT_PUBLIC_APP_URL` が正しいURLを指しているか確認
2. `APIFY_WEBHOOK_SECRET` が一致しているか確認
3. Webhookエンドポイントがアクセス可能か確認（本番環境の場合）

---

## 📋 チェックリスト

変更作業を進める際のチェックリスト：

- [ ] 新しいApifyアカウントでAPIトークンを取得
- [ ] ローカル環境の `.env.local` に `APIFY_API_TOKEN` を更新
- [ ] Railway環境変数の `APIFY_API_TOKEN` を更新
- [ ] 新しいアカウントで `compass/crawler-google-places` Actorが利用可能か確認
- [ ] 新しいアカウントのクレジット残高を確認
- [ ] ローカル環境でテスト実行
- [ ] Railway環境でテスト実行
- [ ] エラーなく動作することを確認

---

## 🔍 確認コマンド

### 環境変数の確認（ローカル）

```bash
# .env.local の内容を確認（トークンは表示されませんが、設定されているか確認）
grep APIFY_API_TOKEN .env.local
```

### ログの確認（Railway）

1. Railwayダッシュボードで「Web App」サービスを選択
2. 「Deploy Logs」タブを開く
3. エラーメッセージがないか確認

---

## 📝 まとめ

**結論**: コードの変更は不要です。環境変数 `APIFY_API_TOKEN` を新しいアカウントのトークンに更新するだけで動作します。

**必要な作業:**
1. 新しいApifyアカウントのAPIトークンを取得
2. 環境変数 `APIFY_API_TOKEN` を更新（ローカル・Railway）
3. 動作確認

**注意事項:**
- 新しいアカウントで `compass/crawler-google-places` Actorが利用可能であることを確認
- クレジット残高が十分であることを確認
