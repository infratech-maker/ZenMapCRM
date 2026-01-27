# Railway ポート設定の修正

## 🔴 問題点

Workerサービスがポート3001で起動していましたが、Railwayは環境変数`PORT`で指定されたポートを使用します。

## 🔧 修正内容

### 1. package.jsonの修正

**変更前:**
```json
"start": "next start -p 3001"
```

**変更後:**
```json
"start": "next start"
```

Next.jsは自動的に`process.env.PORT`環境変数を参照します。Railwayが自動的に`PORT`環境変数を設定するため、明示的にポートを指定する必要はありません。

### 2. Dockerfileの修正

**変更前:**
```dockerfile
EXPOSE 3000
```

**変更後:**
```dockerfile
EXPOSE ${PORT:-3000}
```

デフォルト値として3000を使用しますが、Railwayが`PORT`環境変数を設定した場合はそれを使用します。

## 📋 Railwayのポート設定

Railwayでは、以下のようにポートが設定されます：

1. **環境変数`PORT`**: Railwayが自動的に設定
2. **Next.js**: `process.env.PORT`を自動的に参照
3. **デフォルト**: `PORT`が設定されていない場合は3000を使用

## ✅ 確認事項

### ステップ1: 再デプロイの確認

1. 変更をGitHubにプッシュすると、Railwayが自動的に再デプロイを開始します
2. 「**Deployments**」タブで進行状況を確認
3. デプロイが完了するまで待つ（通常2-3分）

### ステップ2: ログの確認

1. **Web Appサービス**の「**Logs**」タブを開く
2. 以下のログが表示されれば正常：
   - `- Local: http://localhost:${PORT}`
   - `- Network: http://...`
   - `✓ Ready in XXXms`
   - エラーログが表示されない

3. **Workerサービス**の「**Logs**」タブを開く
4. 同様に正常に起動しているか確認

### ステップ3: アプリケーションの動作確認

1. Production環境のURLにアクセス: `https://web-app-production-1763.up.railway.app`
2. 502エラーが解消されているか確認
3. ログイン画面が表示されるか確認

## ⚠️ 重要なポイント

- **ポートの固定指定は不要**: Railwayが自動的に`PORT`環境変数を設定します
- **Next.jsの自動対応**: Next.jsは`process.env.PORT`を自動的に参照します
- **複数サービスのポート**: Web AppとWorkerは異なるポートを使用できます（Railwayが自動的に割り当て）

## 📝 まとめ

ポート設定の問題を修正しました：

1. `package.json`の`start`スクリプトから固定ポート指定を削除
2. `Dockerfile`の`EXPOSE`を環境変数対応に変更
3. Railwayが自動的に設定する`PORT`環境変数を使用

この修正により、Railwayが適切なポートを割り当て、サービス間の通信が正常に機能するようになります。

---

**修正日**: 2025-01-20  
**対象**: Production環境のポート設定問題
