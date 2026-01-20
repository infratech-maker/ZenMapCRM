# Railway DATABASE_URL 設定の修正手順

## 📋 現在の状況

Postgresサービスの`DATABASE_URL`:
```
postgresql://postgres:QZrnStFMBwoESAMCureccsNeuxvCIyQO@postgres.railway.internal:5432/railway
```

このURLは`.railway.internal`で終わっており、Railway内部のサービス間通信用です。

## 🔧 修正手順

### ステップ1: Web AppサービスのDATABASE_URLを確認

1. Railwayダッシュボードで「**Web App**」サービスを選択
2. 「**Variables**」タブを開く
3. **`DATABASE_URL`** の値を確認

### ステップ2: DATABASE_URLの更新

Web Appサービスの`DATABASE_URL`が以下のいずれかの場合、更新が必要です：

#### ケース1: DATABASE_URLが存在しない、または古い値

1. 「**Variables**」タブで`DATABASE_URL`を検索
2. 存在しない場合は「**+ New Variable**」をクリック
3. 存在する場合は編集ボタンをクリック
4. 以下の値を設定：
   ```
   postgresql://postgres:QZrnStFMBwoESAMCureccsNeuxvCIyQO@postgres.railway.internal:5432/railway
   ```
5. 「**Save**」をクリック

#### ケース2: DATABASE_URLが外部接続用（.proxy.rlwy.net）になっている

Railway内部のサービス間通信の場合は、`.railway.internal`のURLを使用する必要があります。

1. `DATABASE_URL`を編集
2. 値を以下に更新：
   ```
   postgresql://postgres:QZrnStFMBwoESAMCureccsNeuxvCIyQO@postgres.railway.internal:5432/railway
   ```
3. 「**Save**」をクリック

### ステップ3: 再デプロイの確認

1. 環境変数を保存すると、Railwayが自動的に再デプロイを開始します
2. 「**Deployments**」タブで進行状況を確認
3. デプロイが完了するまで待つ（通常2-3分）

### ステップ4: 接続の確認

1. デプロイ完了後、「**Logs**」タブを開く
2. パスワード認証エラーが解消されているか確認
3. アプリケーションが正常に起動しているか確認

## ⚠️ 注意事項

### Railway内部接続 vs 外部接続

- **`.railway.internal`**: Railway内部のサービス間通信用（推奨）
  - Web AppサービスからPostgresサービスへの接続に使用
  - より高速で安全
- **`.proxy.rlwy.net`**: 外部接続用
  - ローカル環境から接続する場合に使用
  - `PUBLIC_DATABASE_URL`として設定

### パスワードの取り扱い

- パスワードは機密情報です
- GitHubなどにコミットしないでください
- 環境変数としてのみ管理してください

## 🔍 トラブルシューティング

### エラーが続く場合

#### 1. パスワードの確認

Postgresサービスの「**Variables**」タブで、`PGPASSWORD`の値を確認：
- `QZrnStFMBwoESAMCureccsNeuxvCIyQO` と一致しているか確認

#### 2. 接続URLの形式確認

正しい形式：
```
postgresql://postgres:パスワード@postgres.railway.internal:5432/railway
```

**確認ポイント:**
- ユーザー名: `postgres`
- パスワード: `QZrnStFMBwoESAMCureccsNeuxvCIyQO`
- ホスト: `postgres.railway.internal`
- ポート: `5432`
- データベース名: `railway`

#### 3. Postgresサービスの状態確認

1. 「**Postgres**」サービスの「**Metrics**」タブを確認
2. サービスが正常に動作しているか確認
3. 接続数やリソース使用状況を確認

#### 4. ログの確認

1. 「**Web App**」サービスの「**Logs**」タブを開く
2. エラーメッセージの詳細を確認
3. 接続試行のタイミングとエラー内容を記録

### パスワードが変更された場合

もしPostgresサービスのパスワードが変更された場合：

1. Postgresサービスの「**Variables**」タブで`PGPASSWORD`を確認
2. 新しいパスワードで`DATABASE_URL`を更新
3. Web Appサービスを再デプロイ

## ✅ 確認チェックリスト

- [ ] Web Appサービスの`DATABASE_URL`が設定されている
- [ ] `DATABASE_URL`の値が正しい形式である
- [ ] パスワードが`QZrnStFMBwoESAMCureccsNeuxvCIyQO`と一致している
- [ ] ホストが`postgres.railway.internal`である
- [ ] ポートが`5432`である
- [ ] データベース名が`railway`である
- [ ] 再デプロイが完了している
- [ ] ログでエラーが解消されている

## 📝 まとめ

Web AppサービスからPostgresサービスへの接続には、以下の`DATABASE_URL`を使用してください：

```
postgresql://postgres:QZrnStFMBwoESAMCureccsNeuxvCIyQO@postgres.railway.internal:5432/railway
```

このURLをWeb Appサービスの環境変数`DATABASE_URL`に設定し、再デプロイを待てば、パスワード認証エラーは解消されるはずです。

問題が続く場合は、Railwayのサポートに問い合わせるか、Postgresサービスのパスワードをリセットしてください。

---

**最終更新**: 2025-01-20
