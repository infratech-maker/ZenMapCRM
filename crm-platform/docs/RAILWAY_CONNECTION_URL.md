# Railway Connection URLの取得方法

このドキュメントは、RailwayでPostgresとRedisのConnection URLを取得する方法を説明します。

## Postgres Connection URLの取得

### 方法1: Variablesタブから取得（推奨）

1. Railwayダッシュボードで**「Postgres」サービス**を選択
2. 上部のタブから**「Variables」タブ**をクリック
3. **`DATABASE_URL`** という変数が表示されます
4. 値の右側にある**コピーボタン**（📋アイコン）をクリック
5. Connection URLがコピーされます

**表示例：**
```
DATABASE_URL = postgresql://postgres:password@hopper.proxy.rlwy.net:44735/railway
```

### 方法2: Databaseタブから取得

1. Railwayダッシュボードで**「Postgres」サービス**を選択
2. 上部のタブから**「Database」タブ**をクリック
3. 「Connection」セクションに「Connection URL」が表示されます
4. コピーボタンをクリックしてコピー

### 方法3: SettingsタブのNetworkingから構築

1. Railwayダッシュボードで**「Postgres」サービス**を選択
2. **「Settings」タブ**を開く
3. **「Networking」セクション**を確認
4. 「Public Networking」に表示されているエンドポイントを確認
   - 例: `hopper.proxy.rlwy.net:44735`
5. 内部ポートは通常 `5432`（PostgreSQLのデフォルト）
6. ユーザー名とパスワードは「Variables」タブの`DATABASE_URL`から確認

**注意**: この方法は複雑なので、方法1または方法2を推奨します。

---

## Redis Connection URLの取得

### 方法1: Variablesタブから取得（推奨）

1. Railwayダッシュボードで**「Redis」サービス**を選択
2. 上部のタブから**「Variables」タブ**をクリック
3. **`REDIS_URL`** という変数が表示されます
4. 値の右側にある**コピーボタン**（📋アイコン）をクリック
5. Connection URLがコピーされます

**表示例：**
```
REDIS_URL = redis://default:password@containers-us-west-xxx.railway.app:6379
```

またはTLS接続の場合：
```
REDIS_URL = rediss://default:password@containers-us-west-xxx.railway.app:6379
```

### 方法2: SettingsタブのNetworkingから構築

1. Railwayダッシュボードで**「Redis」サービス**を選択
2. **「Settings」タブ**を開く
3. **「Networking」セクション**を確認
4. エンドポイントとポートを確認

---

## よくある質問

### Q: Variablesタブが見つかりません

A: サービスを選択した後、上部のタブバーを確認してください。「Variables」タブは「Settings」タブの隣にあります。

### Q: DATABASE_URLが表示されません

A: Postgresサービスが正しく作成され、起動していることを確認してください。サービスが起動していない場合、変数が表示されないことがあります。

### Q: Connection URLの形式がわかりません

A: Railwayが自動生成するConnection URLを使用することを推奨します。手動で構築する必要はありません。

### Q: パスワードが表示されません

A: セキュリティ上の理由で、パスワードは完全なConnection URLとしてのみ表示されます。個別のパスワードは表示されません。

---

## 次のステップ

Connection URLを取得したら：

1. **環境変数として設定**（Web AppとWorkerサービス）
   - `DATABASE_URL`: PostgresのConnection URL
   - `REDIS_URL`: RedisのConnection URL

2. **DBスキーマのプッシュ**（ローカルから実行）
   ```bash
   cd crm-platform
   DATABASE_URL="コピーしたPostgres Connection URL" npm run db:push
   ```

---

## 参考

- [Railway公式ドキュメント - Variables](https://docs.railway.app/develop/variables)
- [Railway公式ドキュメント - Database](https://docs.railway.app/databases/postgresql)
