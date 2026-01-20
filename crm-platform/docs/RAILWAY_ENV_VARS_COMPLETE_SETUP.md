# Railway環境変数の完全セットアップ手順

`APIFY_API_TOKEN`、`APIFY_WEBHOOK_SECRET`、`NEXT_PUBLIC_APP_URL`が存在しない場合の新規作成手順です。

## 📋 必要な環境変数一覧

| 変数名 | 説明 | 必須 | 取得方法 |
|--------|------|------|----------|
| `APIFY_API_TOKEN` | Apify APIトークン | ✅ 必須 | Apify Consoleで取得 |
| `APIFY_WEBHOOK_SECRET` | Webhook認証用のシークレット | ✅ 必須 | ランダム文字列を生成 |
| `NEXT_PUBLIC_APP_URL` | アプリケーションのベースURL | ✅ 必須 | RailwayのPublic URL |

---

## 📋 ステップ1: APIFY_WEBHOOK_SECRETの生成

### 方法1: ターミナルで生成（推奨）

```bash
openssl rand -hex 32
```

**実行例:**
```
c24607f2ed7b9a6b699cf8fd848d78c89589801bffd942b3df48229a4181595c
```

生成された文字列をコピーしてください。

### 方法2: Node.jsで生成

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📋 ステップ2: NEXT_PUBLIC_APP_URLの確認

### RailwayのPublic URLを確認

1. Railwayダッシュボードで「**Web App**」サービスを選択
2. 「**Settings**」タブを開く
3. 「**Networking**」セクションを確認
4. 「**Public Networking**」に表示されているURLを確認
   - 例: `https://web-app-staging-xxxx.up.railway.app`

**または、Railway-added Variablesから確認:**
1. 「**Variables**」タブを開く
2. 「**Railway-added Variables**」セクションを展開
3. `RAILWAY_PUBLIC_DOMAIN` の値を確認
4. `https://` + `RAILWAY_PUBLIC_DOMAIN` の値 = `NEXT_PUBLIC_APP_URL`

---

## 📋 ステップ3: Railway環境変数の作成

### 1. Railwayダッシュボードにアクセス

1. [Railway](https://railway.app/) にログイン
2. プロジェクトを選択
3. 「**Web App**」サービスを選択
4. 「**Variables**」タブを開く

### 2. APIFY_API_TOKENの作成

1. 「**+ New Variable**」ボタンをクリック
2. **Name**: `APIFY_API_TOKEN`
3. **Value**: Apify Consoleで取得したAPIトークンを貼り付け（例: `apify_api_xxxxxxxxxxxxx`）
4. 「**Add**」をクリック

### 3. APIFY_WEBHOOK_SECRETの作成

1. 「**+ New Variable**」ボタンをクリック
2. **Name**: `APIFY_WEBHOOK_SECRET`
3. **Value**: ステップ1で生成したランダム文字列を貼り付け
   - 例: `c24607f2ed7b9a6b699cf8fd848d78c89589801bffd942b3df48229a4181595c`
4. 「**Add**」をクリック

### 4. NEXT_PUBLIC_APP_URLの作成

1. 「**+ New Variable**」ボタンをクリック
2. **Name**: `NEXT_PUBLIC_APP_URL`
3. **Value**: RailwayのPublic URLを貼り付け
   - 例: `https://web-app-staging-xxxx.up.railway.app`
   - または: `https://` + `RAILWAY_PUBLIC_DOMAIN` の値
4. 「**Add**」をクリック

---

## 📋 ステップ4: 環境変数の確認

作成した環境変数が正しく設定されているか確認：

1. 「**Variables**」タブで以下が表示されていることを確認：
   - ✅ `APIFY_API_TOKEN`
   - ✅ `APIFY_WEBHOOK_SECRET`
   - ✅ `NEXT_PUBLIC_APP_URL`

2. 各変数の値が正しいことを確認（値は`****`でマスクされていますが、編集画面で確認できます）

---

## 📋 ステップ5: 再デプロイの確認

環境変数を追加すると、Railwayが自動的に再デプロイを開始します。

1. 「**Deployments**」タブを開く
2. 新しいデプロイが開始されていることを確認
3. デプロイが完了するまで待つ（通常2-3分）
4. ステータスが「**Active**」になることを確認

---

## 🧪 動作確認

再デプロイが完了したら、Staging環境で動作確認：

1. Staging環境のURLにアクセス（`NEXT_PUBLIC_APP_URL`の値）
2. ログイン
3. `/dashboard/leads` にアクセス
4. 「**Google Map収集**」ボタンをクリック
5. テストデータを入力：
   - 検索キーワード: `ラーメン`
   - エリア・場所: `東京`
   - 収集上限数: `10件`（テスト用）
6. 「**収集開始**」をクリック
7. エラーが表示されないことを確認

---

## ⚠️ 注意事項

### セキュリティ

- `APIFY_WEBHOOK_SECRET`は機密情報です。他人と共有しないでください
- 環境変数の値は`****`でマスクされていますが、編集画面で確認できます

### トークンの有効性

- `APIFY_API_TOKEN`が無効な場合は、新しいトークンを作成してください
- Apify Consoleでトークンが有効か確認できます

### URLの形式

- `NEXT_PUBLIC_APP_URL`は`https://`で始まる完全なURLである必要があります
- 末尾にスラッシュ（`/`）は不要です

---

## 🔍 トラブルシューティング

### エラー: "APIFY_WEBHOOK_SECRET is not configured"

**原因**: 環境変数が設定されていない

**解決方法:**
1. Variablesタブで`APIFY_WEBHOOK_SECRET`が存在するか確認
2. 存在しない場合は、ステップ3-3の手順で作成

### エラー: "NEXT_PUBLIC_APP_URL is not configured"

**原因**: 環境変数が設定されていない、またはURLが正しくない

**解決方法:**
1. Variablesタブで`NEXT_PUBLIC_APP_URL`が存在するか確認
2. URLが`https://`で始まっているか確認
3. RailwayのPublic URLと一致しているか確認

### エラー: "Invalid secret" (Webhookエラー)

**原因**: `APIFY_WEBHOOK_SECRET`が一致していない

**解決方法:**
1. Variablesタブで`APIFY_WEBHOOK_SECRET`の値を確認
2. Webhook URLのクエリパラメータと一致しているか確認
3. 一致していない場合は、新しいシークレットを生成して再設定

---

## ✅ 確認チェックリスト

- [ ] `APIFY_API_TOKEN` を作成
- [ ] `APIFY_WEBHOOK_SECRET` を生成して作成
- [ ] `NEXT_PUBLIC_APP_URL` を確認して作成
- [ ] すべての環境変数が正しく設定されていることを確認
- [ ] 再デプロイが完了するまで待つ
- [ ] Staging環境で動作確認

---

## 📝 まとめ

3つの環境変数を作成する手順：

1. **APIFY_API_TOKEN**: Apify Consoleで取得したAPIトークン
2. **APIFY_WEBHOOK_SECRET**: `openssl rand -hex 32` で生成したランダム文字列
3. **NEXT_PUBLIC_APP_URL**: RailwayのPublic URL（Settings → Networkingで確認）

すべての環境変数を作成し、再デプロイが完了したら、Staging環境で動作確認してください。
