# Production環境 502エラー解決ログ

## 🔴 発生した問題

**日時**: 2025-01-20  
**環境**: Production環境（`web-app-production-1763.up.railway.app`）  
**エラー**: 502エラー（Application failed to respond）

### エラーログ

```
2026-01-20 20:17:18.699 UTC [33823] FATAL: password authentication failed for user "postgres"
2026-01-20 20:18:18.625 UTC [33828] FATAL: password authentication failed for user "postgres"
2026-01-20 20:19:20.272 UTC [33836] FATAL: password authentication failed for user "postgres"
```

## 🔍 原因の調査

### 1. PostgreSQLパスワード認証エラー

最初に確認した原因：
- Postgresサービスの`DATABASE_URL`とWeb App/Workerサービスの`DATABASE_URL`が不一致
- パスワードの最後の文字が異なっていた（`0` vs `O`）

### 2. ポート設定の問題（根本原因）

**発見**: Workerサービスのログで、Next.jsアプリケーションがポート3001で起動していた

```
> next start -p 3001
- Local: http://localhost:3001
```

**問題点**:
- `package.json`の`start`スクリプトが`next start -p 3001`で固定ポートを指定
- Railwayは環境変数`PORT`で指定されたポートを使用する
- ポートの不一致により、サービス間の通信が正常に機能していなかった

## 🔧 解決方法

### 修正1: package.jsonのポート指定を削除

**ファイル**: `crm-platform/package.json`

**変更前:**
```json
"start": "next start -p 3001"
```

**変更後:**
```json
"start": "next start"
```

**理由**: Next.jsは自動的に`process.env.PORT`環境変数を参照します。Railwayが自動的に`PORT`環境変数を設定するため、明示的にポートを指定する必要はありません。

### 修正2: DockerfileのEXPOSEを環境変数対応に変更

**ファイル**: `crm-platform/Dockerfile`

**変更前:**
```dockerfile
EXPOSE 3000
```

**変更後:**
```dockerfile
EXPOSE ${PORT:-3000}
```

**理由**: デフォルト値として3000を使用しますが、Railwayが`PORT`環境変数を設定した場合はそれを使用します。

### 修正3: DATABASE_URLの確認と統一

**実施内容**:
1. Postgresサービスの`DATABASE_URL`を確認
2. Web Appサービスの`DATABASE_URL`を確認・更新
3. Workerサービスの`DATABASE_URL`を確認・更新

**正しい値**:
```
postgresql://postgres:QZrnStFMBwoESAMCureccsNeuxvCIyQO@postgres.railway.internal:5432/railway
```

**注意**: パスワードの最後の文字は大文字の`O`（オー）で、数字の`0`（ゼロ）ではありません。

## ✅ 解決確認

### 確認項目

- [x] Postgresサービスが正常に起動
- [x] Web Appサービスが正常に起動
- [x] Workerサービスが正常に起動
- [x] パスワード認証エラーが解消
- [x] 502エラーが解消
- [x] アプリケーションが正常にアクセス可能

### 解決後の状態

- Production環境のURLに正常にアクセス可能
- ログイン画面が表示される
- データベース接続が正常に機能

## 📝 学んだ教訓

### 1. Railwayのポート設定

- Railwayは環境変数`PORT`を自動的に設定する
- アプリケーションは`process.env.PORT`を参照すべき
- 固定ポートを指定すると、サービス間の通信が正常に機能しない

### 2. パスワードの取り扱い

- パスワードの1文字の違い（`0` vs `O`）で認証エラーが発生
- コピー&ペーストを使用して誤字を防ぐ
- すべてのサービス（Web App、Worker）で同じ`DATABASE_URL`を使用する必要がある

### 3. エラーログの確認方法

- Postgresサービスのログで認証エラーを確認
- Web App/Workerサービスのログで接続エラーを確認
- タイムスタンプを確認して、最新のエラーかどうかを判断

## 🔄 今後の対策

### 1. ポート設定のベストプラクティス

- `package.json`の`start`スクリプトで固定ポートを指定しない
- Next.jsのデフォルト動作（`process.env.PORT`の自動参照）を利用
- Dockerfileの`EXPOSE`は環境変数対応にする

### 2. 環境変数の管理

- すべてのサービスで同じ`DATABASE_URL`を使用
- 変数参照（`${{Postgres.DATABASE_URL}}`）を使用する場合は、正しく解決されているか確認
- 直接値を設定する場合は、正確な値をコピー&ペーストで設定

### 3. デプロイ前の確認

- 環境変数が正しく設定されているか確認
- ポート設定が適切か確認
- すべてのサービスが正常に起動するか確認

## 📋 関連ドキュメント

- `docs/RAILWAY_PORT_CONFIGURATION.md`: Railwayポート設定の詳細
- `docs/PRODUCTION_DATABASE_URL_FIX.md`: DATABASE_URL修正手順
- `docs/PRODUCTION_DATABASE_ERROR_PERSISTENT.md`: 継続的なエラーの対処方法

---

**解決日時**: 2025-01-20  
**解決者**: AI Assistant  
**影響範囲**: Production環境  
**ダウンタイム**: 約1時間
