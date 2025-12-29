# データベースセットアップ（高速版）

## 問題点

`drizzle-kit push`は対話的な確認が必要で時間がかかります。

## より早い方法

### 方法1: マイグレーションファイルを生成して直接実行（推奨）

```bash
cd /Users/a/CallSenderApp/crm-platform
export PATH="/opt/homebrew/bin:$PATH"

# 1. マイグレーションファイルを生成
npm run db:generate

# 2. 生成されたSQLファイルを直接実行
cd /Users/a/CallSenderApp
docker exec -i crm-postgres psql -U postgres -d crm_platform < crm-platform/drizzle/0000_*.sql
```

### 方法2: 手動でSQLを実行

スキーマ定義から直接SQLを生成して実行する方法です。

## 現在の状況

- drizzle-kit pushが対話的な確認で待機中
- テーブルはまだ作成されていない

## 推奨アクション

**方法1を試してください** - これが最も確実で早い方法です。

