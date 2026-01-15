# Apify APIトークンの設定手順

このドキュメントでは、ApifyのAPIトークンを取得して環境変数に設定する手順を説明します。

## 📋 手順1: Apify APIトークンの取得

### ステップ1: Apify Consoleにログイン

1. ブラウザで [https://console.apify.com/](https://console.apify.com/) にアクセス
2. 新しいApifyアカウントでログイン

### ステップ2: APIトークンの作成

1. 右上のユーザーメニュー（アバターアイコン）をクリック
2. 「**Settings**」を選択
3. 左側のメニューから「**Integrations**」タブをクリック
4. 「**Personal API tokens**」セクションを探す
5. 「**Create token**」ボタンをクリック
6. トークン名を入力（例: "ZenMap CRM"）
7. 「**Create**」をクリック
8. **表示されたトークンをコピー**（⚠️ この画面を閉じると二度と表示されません）

**トークンの例:**
```
apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 📋 手順2: ローカル環境での設定（.env.local）

### ステップ1: .env.localファイルの作成/確認

プロジェクトのルートディレクトリ（`crm-platform/`）に `.env.local` ファイルを作成または編集します。

```bash
cd /Users/a/CallSenderApp/crm-platform
```

### ステップ2: 環境変数の追加

`.env.local` ファイルを開き、以下の内容を追加または更新します：

```bash
# Apify API設定
APIFY_API_TOKEN=ここにコピーしたトークンを貼り付け

# Webhook認証用のシークレット（既に設定済みの場合は変更不要）
APIFY_WEBHOOK_SECRET=既存のシークレットまたは新規生成

# アプリケーションのルートURL
# ローカル開発: http://localhost:3000
# 本番環境: https://your-domain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**例:**
```bash
APIFY_API_TOKEN=apify_api_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
APIFY_WEBHOOK_SECRET=your_existing_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### ステップ3: ファイルの保存

`.env.local` ファイルを保存します。

---

## 📋 手順3: Railway環境での設定

### ステップ1: Railwayダッシュボードにアクセス

1. [Railway](https://railway.app/) にログイン
2. プロジェクトを選択
3. 「**Web App**」サービスを選択

### ステップ2: 環境変数の更新

1. 上部の「**Variables**」タブをクリック
2. `APIFY_API_TOKEN` を探す（検索ボックスで "APIFY" と検索）
3. 既存の `APIFY_API_TOKEN` をクリックして編集
4. 新しいトークンを貼り付け
5. 「**Save**」をクリック

**または、新規追加の場合:**
1. 「**+ New Variable**」ボタンをクリック
2. **Name**: `APIFY_API_TOKEN`
3. **Value**: 新しいApify APIトークンを貼り付け
4. 「**Add**」をクリック

### ステップ3: 再デプロイの確認

環境変数を更新すると、Railwayが自動的に再デプロイを開始します。

1. 「**Deployments**」タブで再デプロイの進行状況を確認
2. デプロイが完了するまで待つ（通常2-3分）

---

## 🧪 動作確認

### ローカル環境での確認

1. 開発サーバーを再起動（環境変数の変更を反映させるため）

```bash
# 現在実行中のサーバーを停止（Ctrl+C）
# 再度起動
cd /Users/a/CallSenderApp/crm-platform
npm run dev
```

2. ブラウザで `http://localhost:3000/dashboard/leads` にアクセス
3. 「**Google Map収集**」ボタンをクリック
4. テスト用のデータを入力：
   - 検索キーワード: `ラーメン`
   - エリア・場所: `東京`
   - 収集上限数: `10件`（テスト用）
5. 「**収集開始**」をクリック
6. エラーが表示されないことを確認

### Railway環境での確認

1. Staging環境のURLにアクセス
2. 同様の手順でテスト実行
3. エラーが表示されないことを確認

---

## ⚠️ 注意事項

### セキュリティ

- `.env.local` ファイルは**Gitにコミットしないでください**（既に`.gitignore`に含まれています）
- APIトークンは機密情報です。他人と共有しないでください
- トークンが漏洩した場合は、Apify Consoleでトークンを削除して新しいトークンを作成してください

### トークンの有効期限

- ApifyのAPIトークンに有効期限はありませんが、削除すると無効になります
- トークンが無効になった場合は、新しいトークンを作成して環境変数を更新してください

---

## 🔍 トラブルシューティング

### エラー: "APIFY_API_TOKEN is not configured"

**原因**: 環境変数が設定されていない、または読み込まれていない

**解決方法:**
1. `.env.local` ファイルが正しい場所（`crm-platform/` ディレクトリ）にあるか確認
2. ファイル名が `.env.local` であることを確認（`.env.local.txt` などではない）
3. トークンが正しく貼り付けられているか確認（前後に余分なスペースがないか）
4. 開発サーバーを再起動

### エラー: "Invalid API token"

**原因**: トークンが無効、または間違っている

**解決方法:**
1. Apify Consoleでトークンが有効か確認
2. トークンを再コピーして貼り付け直す
3. 新しいトークンを作成して試す

### エラー: "Actor not found" または "Actor not accessible"

**原因**: 新しいアカウントでActorが利用できない

**解決方法:**
1. Apify Consoleで `compass/crawler-google-places` を検索
2. Actorが存在し、実行可能であることを確認
3. アカウントのプランを確認（有料プランが必要な可能性）

---

## 📝 チェックリスト

- [ ] Apify ConsoleでAPIトークンを作成
- [ ] トークンをコピー
- [ ] `.env.local` ファイルに `APIFY_API_TOKEN` を追加/更新
- [ ] Railwayの環境変数 `APIFY_API_TOKEN` を更新
- [ ] 開発サーバーを再起動
- [ ] ローカル環境でテスト実行
- [ ] Railway環境でテスト実行
- [ ] エラーなく動作することを確認

---

## 📚 関連ドキュメント

- [Apify Setup Guide](./APIFY_SETUP.md) - 詳細なセットアップ手順
- [Apify Account Change Checklist](./APIFY_ACCOUNT_CHANGE_CHECKLIST.md) - アカウント変更時のチェックリスト
