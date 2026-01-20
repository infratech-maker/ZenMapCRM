# Railway環境変数の設定方法

このドキュメントは、Railwayで環境変数を設定する方法と、変数参照の使い方を説明します。

## 重要なポイント

### パブリックエンドポイント vs プライベートエンドポイント

- **パブリックエンドポイント** (`REDIS_PUBLIC_URL`, `DATABASE_PUBLIC_URL`)
  - 外部から接続可能
  - egress費用がかかる可能性がある
  - ローカルからの接続時に使用

- **プライベートエンドポイント** (`REDIS_URL`, `DATABASE_URL`)
  - Railway内部のサービス間通信用
  - egress費用がかからない
  - **Railwayのサービス間通信ではこちらを使用**

## 環境変数の設定手順

### ステップ1: Web App Serviceの環境変数設定

1. Railwayダッシュボードで「Web App」サービスを選択
2. 「Variables」タブを開く
3. 「+ New Variable」をクリック
4. 以下の環境変数を追加：

| 変数名 | 値 | 説明 |
|--------|-----|------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | プライベートエンドポイント（変数参照） |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` | プライベートエンドポイント（変数参照） |
| `NEXTAUTH_SECRET` | `xxvBhKgjRjffncqPzNRzn5Rg4q9lmgTIODyGI/my1f8=` | NextAuth.jsの秘密鍵 |
| `NEXTAUTH_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` | NextAuth.jsのベースURL（変数参照） |

**重要**: `DATABASE_URL`と`REDIS_URL`は、**変数参照**（`${{ServiceName.VARIABLE}}`）を使用してください。直接URLを入力しないでください。

### ステップ2: Worker Serviceの環境変数設定

1. Railwayダッシュボードで「Worker」サービスを選択
2. 「Variables」タブを開く
3. 「+ New Variable」をクリック
4. **Web Appと同じ環境変数**を追加：

| 変数名 | 値 |
|--------|-----|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |
| `NEXTAUTH_SECRET` | `xxvBhKgjRjffncqPzNRzn5Rg4q9lmgTIODyGI/my1f8=` |
| `NEXTAUTH_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` |

## 変数参照の使い方

### 変数参照とは？

Railwayでは、他のサービスの環境変数を参照できます。これにより：
- プライベートエンドポイントを使用できる
- egress費用を回避できる
- 接続情報の管理が簡単になる

### 変数参照の形式

```
${{ServiceName.VARIABLE_NAME}}
```

**例**:
- `${{Postgres.DATABASE_URL}}` - Postgresサービスの`DATABASE_URL`を参照
- `${{Redis.REDIS_URL}}` - Redisサービスの`REDIS_URL`を参照
- `${{RAILWAY_PUBLIC_DOMAIN}}` - Railwayが提供する公開ドメインを参照

### 変数参照の設定方法

1. 「+ New Variable」をクリック
2. **Name**に変数名を入力（例: `REDIS_URL`）
3. **Value**に変数参照を入力（例: `${{Redis.REDIS_URL}}`）
4. 保存

**注意**: 変数参照は、サービス名が正確に一致している必要があります。サービス名を変更した場合は、変数参照も更新してください。

## 警告メッセージについて

### 「Connecting to a public endpoint will incur egress fees」

この警告は、`REDIS_PUBLIC_URL`や`DATABASE_PUBLIC_URL`を使用するとegress費用がかかる可能性があることを示しています。

**対応方法**:
- 変数参照（`${{Redis.REDIS_URL}}`）を使用することで、プライベートエンドポイントが使用され、egress費用を回避できます
- この警告は無視しても問題ありませんが、変数参照を使用することを推奨します

## よくある質問

### Q: 変数参照が機能しない

A: 以下を確認してください：
- サービス名が正確に一致しているか（大文字小文字を区別）
- 変数名が正確に一致しているか
- サービスが作成されているか

### Q: REDIS_PUBLIC_URLとREDIS_URLの違いは？

A:
- `REDIS_PUBLIC_URL`: 外部から接続可能なパブリックエンドポイント（egress費用がかかる可能性）
- `REDIS_URL`: Railway内部のプライベートエンドポイント（egress費用なし）

Railwayのサービス間通信では、`REDIS_URL`（変数参照）を使用してください。

### Q: 環境変数を設定した後、どうなる？

A:
- 環境変数を設定すると、Railwayが自動的にリデプロイを開始します
- ビルドとデプロイが自動的に実行されます
- ログで進行状況を確認できます

## 次のステップ

環境変数の設定が完了したら：

1. **スタートコマンドの確認**
   - Web App Service: `npm start`
   - Worker Service: `npm run start:worker`

2. **デプロイの確認**
   - 「Deployments」タブでデプロイの進行状況を確認
   - 「Logs」タブでログを確認

3. **動作確認**
   - Web Appの公開URLにアクセス
   - Workerのログで正常起動を確認

---

## 参考

- [Railway - Environment Variables](https://docs.railway.app/develop/variables)
- [Railway - Variable References](https://docs.railway.app/develop/variables#referencing-variables)
