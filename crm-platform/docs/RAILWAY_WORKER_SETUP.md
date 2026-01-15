# Railway Worker Service 設定ガイド

このドキュメントは、RailwayでWorker Serviceを正しく設定する方法を説明します。

## Worker Serviceの特徴

Worker Serviceは以下の特徴があります：
- **ビルドが不要**: Next.jsのビルドは不要で、TypeScriptを直接実行します
- **Railpackビルダーを使用**: Railwayの自動検出機能（Railpack）を使用
- **シンプルな起動**: `npm run start:worker` を実行するだけ

## 正しい設定

### Buildセクション

1. **Builder**: `Railpack Default`（自動検出）
   - 変更不要
   - Railwayが自動的にプロジェクトの種類を検出します

2. **Metal Build Environment**: オフ（デフォルト）
   - 変更不要

3. **Custom Build Command**: **設定しない**
   - Worker Serviceはビルドが不要です
   - ビルドコマンドを設定するとエラーが発生する可能性があります

4. **Watch Paths**: 設定不要（デフォルト）

### Deployセクション

1. **Start Command**: `npm run start:worker`
   - 必須: このコマンドを設定してください
   - Settings → Deploy → Start Command に設定

2. **Restart Policy**: `ON_FAILURE`（デフォルト）
   - 変更不要

## よくあるエラーと解決方法

### エラー: "Build failed"

**原因**: ビルドコマンドが設定されている、またはRailpackがビルドを試みている

**解決方法**:
1. Custom Build Commandが設定されている場合は削除
2. Railpackが自動的にビルドを試みる場合、`package.json`に`build`スクリプトがあるため、これは正常です
3. ビルドが失敗する場合は、Logsタブでエラーメッセージを確認

### エラー: "Cannot find module"

**原因**: 依存関係がインストールされていない

**解決方法**:
1. `package.json`に必要な依存関係が追加されているか確認
2. GitHubにプッシュされているか確認
3. Railwayが最新のコードを取得しているか確認

### エラー: "REDIS_URL environment variable is not set"

**原因**: 環境変数が設定されていない

**解決方法**:
1. Variablesタブで`REDIS_URL`が設定されているか確認
2. 変数参照（`${{Redis.REDIS_URL}}`）を使用しているか確認

### エラー: "Database connection failed"

**原因**: データベースに接続できない

**解決方法**:
1. Variablesタブで`DATABASE_URL`が設定されているか確認
2. 変数参照（`${{Postgres.DATABASE_URL}}`）を使用しているか確認
3. Postgresサービスが起動しているか確認

## 設定の確認手順

### ステップ1: Buildセクションの確認

1. Worker Serviceの「Settings」タブを開く
2. 「Build」セクションを確認
3. 以下を確認：
   - Builder: `Railpack Default`
   - Custom Build Command: **設定されていない**（空欄）

### ステップ2: Deployセクションの確認

1. 「Deploy」セクションを開く
2. 「Start Command」を確認
3. `npm run start:worker` が設定されていることを確認

### ステップ3: Variablesセクションの確認

1. 「Variables」タブを開く
2. 以下が設定されていることを確認：
   - `DATABASE_URL = ${{Postgres.DATABASE_URL}}`
   - `REDIS_URL = ${{Redis.REDIS_URL}}`
   - `NEXTAUTH_SECRET = (生成された値)`
   - `NEXTAUTH_URL = https://${{RAILWAY_PUBLIC_DOMAIN}}`

### ステップ4: Logsタブで確認

1. 「Logs」タブを開く
2. 以下のログが表示されることを確認：
   - `✅ Database connection established`
   - `✅ Redis connection established`
   - `✅ Worker started and listening for jobs...`

## デプロイの確認

設定が完了すると、Railwayが自動的にリデプロイを開始します。

### 確認方法

1. **Deploymentsタブ**
   - 最新のデプロイが「Active」になっているか確認

2. **Logsタブ**
   - エラーが解消されているか確認
   - 正常に起動しているか確認

## トラブルシューティング

### Worker Serviceが起動しない

1. Logsタブでエラーメッセージを確認
2. Start Commandが正しく設定されているか確認
3. 環境変数が設定されているか確認

### ビルドエラーが発生する

1. Custom Build Commandが設定されていないか確認
2. `package.json`の`build`スクリプトが正しいか確認
3. ローカルで `npm install` が成功するか確認

---

## 参考

- [Railway - Build Configuration](https://docs.railway.app/deploy/builds)
- [Railway - Start Commands](https://docs.railway.app/deploy/start-commands)
