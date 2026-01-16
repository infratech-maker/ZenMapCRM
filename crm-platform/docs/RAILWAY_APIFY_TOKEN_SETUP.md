# Railway環境変数 APIFY_API_TOKEN の作成手順

RailwayのVariablesタブに`APIFY_API_TOKEN`が存在しない場合の新規作成手順です。

## 📋 手順

### ステップ1: Railwayダッシュボードにアクセス

1. [Railway](https://railway.app/) にログイン
2. プロジェクトを選択
3. 「**Web App**」サービスを選択
4. 「**Variables**」タブを開く

### ステップ2: 新しい環境変数を作成

1. 「**+ New Variable**」ボタンをクリック
2. 以下の情報を入力：
   - **Name**: `APIFY_API_TOKEN`
   - **Value**: Apify Consoleで取得したAPIトークンを貼り付け（例: `apify_api_xxxxxxxxxxxxx`）
3. 「**Add**」または「**Save**」をクリック

### ステップ3: その他の必要な環境変数を確認

`APIFY_API_TOKEN`と合わせて、以下の環境変数も設定されているか確認してください：

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `APIFY_API_TOKEN` | Apify APIトークン | ✅ 必須 |
| `APIFY_WEBHOOK_SECRET` | Webhook認証用のシークレット | ✅ 推奨 |
| `NEXT_PUBLIC_APP_URL` | アプリケーションのベースURL | ✅ 必須 |

**`APIFY_WEBHOOK_SECRET`が存在しない場合:**
1. ランダムな文字列を生成：
   ```bash
   openssl rand -hex 32
   ```
2. 生成された文字列を`APIFY_WEBHOOK_SECRET`として追加

**`NEXT_PUBLIC_APP_URL`が存在しない場合:**
1. Railwayの「Settings」タブ → 「Networking」でPublic URLを確認
2. そのURLを`NEXT_PUBLIC_APP_URL`として追加
   - 例: `https://web-app-staging-xxxx.up.railway.app`

### ステップ4: 再デプロイの確認

環境変数を追加すると、Railwayが自動的に再デプロイを開始します。

1. 「**Deployments**」タブを開く
2. 新しいデプロイが開始されていることを確認
3. デプロイが完了するまで待つ（通常2-3分）
4. ステータスが「**Active**」になることを確認

---

## ✅ 確認事項

環境変数を追加した後、以下を確認してください：

- [ ] `APIFY_API_TOKEN` が正しく設定されている
- [ ] `APIFY_WEBHOOK_SECRET` が設定されている（推奨）
- [ ] `NEXT_PUBLIC_APP_URL` が設定されている
- [ ] 再デプロイが完了している
- [ ] Staging環境で動作確認ができる

---

## 🧪 動作確認

環境変数を追加し、再デプロイが完了したら：

1. Staging環境のURLにアクセス
2. ログイン
3. `/dashboard/leads` にアクセス
4. 「Google Map収集」機能をテスト実行
5. エラーが表示されないことを確認

---

## ⚠️ 注意事項

- **セキュリティ**: APIトークンは機密情報です。他人と共有しないでください
- **トークンの有効性**: 無効なトークンを使用するとエラーになります
- **再デプロイ**: 環境変数を追加/変更すると、自動的に再デプロイが開始されます

---

## 🔍 トラブルシューティング

### エラー: "APIFY_API_TOKEN is not configured"

**原因**: 環境変数が設定されていない、または再デプロイが完了していない

**解決方法:**
1. Variablesタブで`APIFY_API_TOKEN`が存在するか確認
2. トークンが正しく貼り付けられているか確認
3. 再デプロイが完了するまで待つ

### エラー: "Invalid API token"

**原因**: トークンが無効、または間違っている

**解決方法:**
1. Apify Consoleでトークンが有効か確認
2. トークンを再コピーして貼り付け直す
