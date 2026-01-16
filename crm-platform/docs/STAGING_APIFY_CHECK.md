# Staging環境でのApify動作確認手順

Staging環境（Railway）でApify APIトークンが正しく設定されているか確認する手順です。

## 📋 ステップ1: Railway環境変数の確認・更新

### 1. Railwayダッシュボードにアクセス

1. [Railway](https://railway.app/) にログイン
2. プロジェクトを選択
3. 「**Web App**」サービスを選択

### 2. 環境変数の確認

1. 上部の「**Variables**」タブをクリック
2. 検索ボックスで「**APIFY**」と検索
3. 以下の環境変数が設定されているか確認：
   - `APIFY_API_TOKEN`
   - `APIFY_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_APP_URL`

### 3. APIFY_API_TOKENの更新

1. `APIFY_API_TOKEN` をクリックして編集
2. 新しいトークンを貼り付け（Apify Consoleで取得したトークン）
3. 「**Save**」をクリック

**新規追加の場合:**
1. 「**+ New Variable**」ボタンをクリック
2. **Name**: `APIFY_API_TOKEN`
3. **Value**: Apify Consoleで取得したAPIトークンを貼り付け
4. 「**Add**」をクリック

### 4. 再デプロイの確認

環境変数を保存すると、Railwayが自動的に再デプロイを開始します。

1. 「**Deployments**」タブを開く
2. 新しいデプロイが開始されていることを確認
3. デプロイが完了するまで待つ（通常2-3分）
4. ステータスが「**Active**」になることを確認

---

## 📋 ステップ2: Staging環境のURLを確認

### 方法1: Settingsタブから確認

1. Railwayダッシュボードで「**Web App**」サービスを選択
2. 「**Settings**」タブを開く
3. 「**Networking**」セクションを確認
4. 「**Public Networking**」に表示されているURLを確認
   - 例: `https://web-app-staging-xxxx.up.railway.app`

### 方法2: Deploymentsタブから確認

1. 「**Deployments**」タブを開く
2. 最新のデプロイをクリック
3. デプロイ詳細ページでURLを確認

### 方法3: Variablesタブから確認

1. 「**Variables**」タブを開く
2. `NEXT_PUBLIC_APP_URL` または `RAILWAY_PUBLIC_DOMAIN` を確認

---

## 📋 ステップ3: Staging環境での動作確認

### 1. Staging環境にアクセス

ブラウザでStaging環境のURLにアクセス：
- 例: `https://web-app-staging-xxxx.up.railway.app`

### 2. ログイン

1. ログインページが表示されることを確認
2. テストアカウントでログイン：
   - Email: `admin@zenmao.com`
   - Password: `password123`

### 3. Google Maps収集機能のテスト

1. ダッシュボードにアクセス
2. 左側のメニューから「**Leads**」を選択
3. ページ上部の「**Google Map収集**」ボタンをクリック
4. テスト用のデータを入力：
   - **検索キーワード**: `ラーメン`
   - **エリア・場所**: `東京`
   - **収集上限数**: `10件`（テスト用、コストを抑えるため）
5. 「**収集開始**」ボタンをクリック

### 4. エラーの確認

**正常な場合:**
- 「収集ジョブを開始しました」という成功メッセージが表示される
- エラーメッセージが表示されない

**エラーが表示される場合:**
- エラーメッセージの内容を確認
- 以下を確認：
  - `APIFY_API_TOKEN` が正しく設定されているか
  - 新しいアカウントで `compass/crawler-google-places` Actorが利用可能か
  - クレジット残高が十分か

---

## 📋 ステップ4: ログの確認

### Railway Logsで確認

1. Railwayダッシュボードで「**Web App**」サービスを選択
2. 「**Logs**」タブを開く
3. 以下のログメッセージを確認：

**正常な場合:**
```
🚀 Starting Apify job with params: { keywords: [...], location: '...', ... }
✅ Apify job started: xxxxxx
```

**エラーの場合:**
```
❌ APIFY_API_TOKEN is not set
❌ Apify Start Error: ...
```

### ブラウザの開発者ツールで確認

1. Staging環境のページを開く
2. ブラウザの開発者ツール（F12）を開く
3. 「**Console**」タブを確認
4. エラーメッセージがないか確認

---

## 🔍 トラブルシューティング

### 問題1: "APIFY_API_TOKEN is not configured"

**原因**: 環境変数が設定されていない、または更新されていない

**解決方法:**
1. Railwayの「Variables」タブで `APIFY_API_TOKEN` が設定されているか確認
2. トークンが正しく貼り付けられているか確認（前後にスペースがないか）
3. 環境変数を保存後、再デプロイが完了するまで待つ

### 問題2: "Actor not found" または "Actor not accessible"

**原因**: 新しいアカウントでActorが利用できない

**解決方法:**
1. Apify Consoleで `compass/crawler-google-places` を検索
2. Actorが存在し、実行可能であることを確認
3. アカウントのプランを確認（有料プランが必要な可能性）

### 問題3: "Insufficient credits"

**原因**: 新しいアカウントのクレジットが不足

**解決方法:**
1. Apify Consoleの「Usage & Billing」でクレジット残高を確認
2. 必要に応じてクレジットを追加

### 問題4: 再デプロイが完了しない

**原因**: ビルドエラーやデプロイエラー

**解決方法:**
1. 「Deployments」タブでエラーメッセージを確認
2. 「Logs」タブでビルドログを確認
3. エラーの内容に応じて修正

---

## ✅ 確認チェックリスト

- [ ] Railwayの環境変数 `APIFY_API_TOKEN` を新しいトークンに更新
- [ ] 環境変数を保存
- [ ] 再デプロイが完了するまで待つ（2-3分）
- [ ] Staging環境のURLを確認
- [ ] Staging環境にアクセスしてログイン
- [ ] Google Maps収集機能をテスト実行
- [ ] エラーが表示されないことを確認
- [ ] Railway Logsで正常なログが出力されていることを確認

---

## 📝 まとめ

Staging環境での確認手順：

1. **Railway環境変数の更新**: `APIFY_API_TOKEN` を新しいトークンに更新
2. **再デプロイの確認**: 自動再デプロイが完了するまで待つ
3. **Staging環境でのテスト**: Google Maps収集機能を実行して動作確認
4. **ログの確認**: Railway Logsでエラーがないか確認

問題があれば、エラーメッセージを共有してください。
