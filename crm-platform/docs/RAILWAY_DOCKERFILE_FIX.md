# Railway Dockerfile パスの修正

Railwayでルートディレクトリが`crm-platform`に設定されている場合、`railway.json`のDockerfileパスも調整が必要な場合があります。

## 問題

`railway.json`で`dockerfilePath: "Dockerfile"`と指定していますが、ルートディレクトリが`crm-platform`に設定されている場合、Railwayは`crm-platform/Dockerfile`を探します。

## 解決方法

### オプション1: railway.jsonを削除（推奨）

Railwayは自動的に`Dockerfile`を検出するため、`railway.json`がなくても動作します。

1. `railway.json`を削除または無視
2. RailwayのSettings → Build → Dockerfile Path で確認

### オプション2: railway.jsonのパスを確認

`railway.json`が存在する場合、パスが正しいか確認してください。

現在の設定:
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  }
}
```

ルートディレクトリが`crm-platform`の場合、この設定は正しいはずです（Railwayが自動的に`crm-platform/Dockerfile`を探します）。

## 確認手順

1. Web App Serviceの「Settings」タブを開く
2. 「Build」セクションを確認
3. 「Dockerfile Path」が正しく設定されているか確認
4. 必要に応じて、`Dockerfile`または`./Dockerfile`に設定

## その他の確認事項

### 1. Logsタブでエラーメッセージを確認

- 「Logs」タブを開く
- エラーメッセージを確認
- エラーメッセージに「Cannot find Dockerfile」や「Dockerfile not found」が含まれているか確認

### 2. Deploymentsタブでビルドログを確認

- 「Deployments」タブを開く
- 最新のデプロイをクリック
- ビルドログを確認
- エラーが発生している行を特定

## よくあるエラー

### "Cannot find Dockerfile"

**原因**: Dockerfileのパスが正しくない

**解決方法**:
1. Settings → Build → Dockerfile Path を確認
2. `Dockerfile`または`./Dockerfile`に設定
3. ルートディレクトリが`crm-platform`に設定されていることを確認

### "Build failed" または "npm run build failed"

**原因**: ビルドプロセスでエラーが発生

**解決方法**:
1. ローカルで `npm run build` が成功するか確認
2. エラーメッセージを確認
3. エラーを修正してGitHubにプッシュ

---

## 参考

- [Railway - Dockerfile](https://docs.railway.app/deploy/dockerfiles)
- [Railway - Build Configuration](https://docs.railway.app/deploy/builds)
