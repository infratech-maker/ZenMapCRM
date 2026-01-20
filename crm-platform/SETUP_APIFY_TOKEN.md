# Apify APIトークンの設定手順（簡易版）

## 🎯 手順概要

1. Apify ConsoleでAPIトークンを取得
2. `.env.local` ファイルに追加
3. Railwayの環境変数を更新

---

## 📝 ステップ1: Apify APIトークンの取得

### 1. Apify Consoleにアクセス
- URL: https://console.apify.com/
- 新しいApifyアカウントでログイン

### 2. APIトークンを作成
1. 右上のユーザーメニュー（アバター）をクリック
2. 「**Settings**」を選択
3. 左メニューから「**Integrations**」をクリック
4. 「**Personal API tokens**」セクションで「**Create token**」をクリック
5. トークン名を入力（例: "ZenMap CRM"）
6. 「**Create**」をクリック
7. **表示されたトークンをコピー**（⚠️ 重要: この画面を閉じると二度と表示されません）

**トークンの形式:**
```
apify_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 📝 ステップ2: ローカル環境（.env.local）に設定

### 方法1: エディタで編集（推奨）

1. VS Codeやテキストエディタで `.env.local` ファイルを開く
2. 以下の行を追加または更新：

```bash
APIFY_API_TOKEN=ここにコピーしたトークンを貼り付け
```

**例:**
```bash
APIFY_API_TOKEN=apify_api_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

3. ファイルを保存

### 方法2: ターミナルで追加

```bash
cd /Users/a/CallSenderApp/crm-platform

# .env.localファイルに追加（既存の設定を上書きしない）
echo "" >> .env.local
echo "# Apify API設定" >> .env.local
echo "APIFY_API_TOKEN=ここにトークンを貼り付け" >> .env.local
```

その後、エディタで開いて実際のトークンに置き換えてください。

---

## 📝 ステップ3: Railway環境変数の更新

### 1. Railwayダッシュボードにアクセス
- https://railway.app/ にログイン
- プロジェクトを選択
- 「**Web App**」サービスを選択

### 2. 環境変数を更新
1. 上部の「**Variables**」タブをクリック
2. 検索ボックスで「APIFY」と検索
3. `APIFY_API_TOKEN` を見つけてクリック
4. 新しいトークンを貼り付け
5. 「**Save**」をクリック

**新規追加の場合:**
1. 「**+ New Variable**」ボタンをクリック
2. **Name**: `APIFY_API_TOKEN`
3. **Value**: 新しいトークンを貼り付け
4. 「**Add**」をクリック

### 3. 再デプロイの確認
- 環境変数を保存すると自動的に再デプロイが開始されます
- 「**Deployments**」タブで進行状況を確認

---

## ✅ 動作確認

### ローカル環境
1. 開発サーバーを再起動：
   ```bash
   # 現在のサーバーを停止（Ctrl+C）
   npm run dev
   ```

2. ブラウザでテスト：
   - `http://localhost:3000/dashboard/leads` にアクセス
   - 「Google Map収集」ボタンをクリック
   - テストデータを入力して実行
   - エラーが表示されないことを確認

### Railway環境
- Staging環境で同様のテストを実行
- エラーが表示されないことを確認

---

## ⚠️ 注意事項

1. **トークンの機密性**
   - APIトークンは機密情報です
   - 他人と共有しないでください
   - Gitにコミットしないでください（`.gitignore`に含まれています）

2. **トークンの有効性**
   - トークンが無効になった場合は、新しいトークンを作成してください
   - Apify Consoleでトークンを削除すると無効になります

3. **ファイルの場所**
   - `.env.local` は `crm-platform/` ディレクトリに配置してください
   - ファイル名は正確に `.env.local` である必要があります

---

## 🔍 トラブルシューティング

### エラー: "APIFY_API_TOKEN is not configured"

**解決方法:**
1. `.env.local` ファイルが正しい場所にあるか確認
2. トークンが正しく貼り付けられているか確認（前後にスペースがないか）
3. 開発サーバーを再起動

### エラー: "Invalid API token"

**解決方法:**
1. Apify Consoleでトークンが有効か確認
2. トークンを再コピーして貼り付け直す

---

## 📚 詳細な手順

より詳細な手順は `docs/APIFY_TOKEN_SETUP.md` を参照してください。
