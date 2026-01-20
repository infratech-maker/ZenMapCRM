# Worker ServiceのDockerfile問題の解決

このドキュメントは、Worker ServiceでDockerfileが使用されてエラーが発生する問題を解決する方法を説明します。

## 問題

Worker ServiceはDockerfileを使用する必要がありませんが、`railway.json`が存在するため、RailwayがDockerfileを使用しようとしている可能性があります。

## 原因

1. **railway.jsonの影響**: `railway.json`に`"builder": "DOCKERFILE"`が設定されているため、RailwayがDockerfileを使用しようとしている
2. **Worker Serviceの設定**: Worker ServiceではDockerfileを使用せず、Railpackビルダーを使用する必要がある

## 解決方法

### 方法1: Settingsで明示的にRailpackを指定（推奨）

1. **Worker ServiceのSettingsタブを開く**
2. **Buildセクションを開く**
3. **Builderを確認**
   - `DOCKERFILE`になっている場合は、`Railpack`に変更
4. **保存**

### 方法2: railway.jsonを無視する

RailwayのSettingsで、`railway.json`の設定を上書きできます。

1. **Worker ServiceのSettingsタブを開く**
2. **Buildセクションを開く**
3. **Builderを`Railpack`に設定**
4. **保存**

### 方法3: Worker Service専用の設定ファイルを作成（将来の対応）

現在、Railwayはサービスごとの設定ファイルをサポートしていないため、Settingsで明示的に設定する必要があります。

## 確認手順

### ステップ1: Builderの確認

1. **Worker ServiceのSettingsタブを開く**
2. **Buildセクションを開く**
3. **Builderを確認**
   - `Railpack`または`Railpack Default`になっていることを確認
   - `DOCKERFILE`になっている場合は、`Railpack`に変更

### ステップ2: Start Commandの確認

1. **Deployセクションを開く**
2. **Start Commandを確認**
   - `npm run start:worker`が設定されていることを確認

### ステップ3: 再デプロイ

1. **設定を保存**
2. **Railwayが自動的に再デプロイを開始**
3. **Deploymentsタブでデプロイの進行状況を確認**

## よくあるエラー

### エラー: "Cannot find Dockerfile"

**原因**: Worker ServiceがDockerfileを使用しようとしている

**解決方法**:
1. Settings → Build → Builder を`Railpack`に変更
2. 再デプロイ

### エラー: "Build failed" (Dockerfile使用時)

**原因**: Worker ServiceはDockerfileを使用する必要がない

**解決方法**:
1. Settings → Build → Builder を`Railpack`に変更
2. 再デプロイ

### エラー: "npm run build failed"

**原因**: Worker Serviceはビルドが不要

**解決方法**:
1. Settings → Build → Builder を`Railpack`に変更
2. Custom Build Commandが設定されている場合は削除
3. 再デプロイ

## 正しい設定

### Worker Service

- **Builder**: `Railpack`または`Railpack Default`
- **Custom Build Command**: 設定しない（空欄）
- **Start Command**: `npm run start:worker`

### Web App Service

- **Builder**: `DOCKERFILE`（railway.jsonで設定済み）
- **Dockerfile Path**: `Dockerfile`
- **Start Command**: `npm start`

## 次のステップ

設定を変更したら：

1. **Deploymentsタブで確認**
   - 最新のデプロイが「Active」になっているか確認

2. **Logsタブで確認**
   - エラーが解消されているか確認
   - 正常に起動しているか確認

---

## 参考

- [Railway - Build Configuration](https://docs.railway.app/deploy/builds)
- [Railway - Service-Specific Settings](https://docs.railway.app/deploy/config-as-code)
