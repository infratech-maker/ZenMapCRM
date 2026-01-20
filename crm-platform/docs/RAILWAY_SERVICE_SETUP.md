# Railwayサービス作成の詳細手順

このドキュメントは、RailwayでWeb App ServiceとWorker Serviceを別々に作成する手順を詳しく説明します。

## 現在の状態

画像を見ると、以下のサービスが既に作成されています：
- ✅ Postgres (Online)
- ✅ Redis (Online)
- ✅ ZenMapCRM (Build failed) ← これをWeb Appとして使用するか、新規作成

## オプション1: 既存のZenMapCRMサービスをWeb Appとして使用

既にZenMapCRMサービスが作成されている場合：

1. 左側の「Architecture」パネルで「ZenMapCRM」サービスを選択
2. 右側の「Settings」タブを開く
3. 「Source」セクションで「Add Root Directory」をクリック
4. `crm-platform` を入力して保存
5. サービス名を「Web App」に変更（任意）

その後、Worker Serviceを新規作成します。

## オプション2: 新規にWeb App Serviceを作成

### ステップ1: Web App Serviceの作成

1. **左側の「Architecture」パネル**を見る
2. 左上または適切な場所にある **「+ New」ボタン**をクリック
3. ドロップダウンメニューから **「GitHub Repo」**を選択
4. リポジトリ一覧から **`infratech-maker/ZenMapCRM`** を選択
5. サービスが作成されると、左側のパネルに新しいサービスカードが表示されます

### ステップ2: ルートディレクトリの設定

1. 作成したサービスをクリックして選択
2. 右側のパネルで **「Settings」タブ**を開く
3. **「Source」セクション**を探す
4. **「Add Root Directory」**というリンクをクリック
5. テキストボックスに **`crm-platform`** を入力
6. 保存（Enterキーまたは保存ボタン）

### ステップ3: サービス名の変更（任意）

1. 左側のサービスカードで右クリック（または設定メニューから）
2. 「Rename」を選択
3. 「Web App」に変更

## Worker Serviceの作成

### ステップ1: Worker Serviceの作成

1. **左側の「Architecture」パネル**で **「+ New」ボタン**をクリック
2. **「GitHub Repo」**を選択
3. **同じリポジトリ** `infratech-maker/ZenMapCRM` を選択
   - ⚠️ 重要: Web Appと同じリポジトリを選択します
   - これにより、同じコードベースから2つの異なるサービスが作成されます

### ステップ2: ルートディレクトリの設定

1. 作成したWorkerサービスをクリック
2. 右側の「Settings」タブを開く
3. 「Source」セクションで「Add Root Directory」をクリック
4. `crm-platform` を入力して保存

### ステップ3: サービス名の変更

1. サービス名を「Worker」に変更

## 最終的な構成

設定が完了すると、左側の「Architecture」パネルに以下の4つのサービスが表示されます：

```
┌─────────────────┐
│   Postgres      │  (Database)
│   Online        │
└─────────────────┘

┌─────────────────┐
│   Redis         │  (Database)
│   Online        │
└─────────────────┘

┌─────────────────┐
│   Web App       │  (GitHub Repo)
│   [GitHub Icon] │  ← npm start を実行
└─────────────────┘

┌─────────────────┐
│   Worker        │  (GitHub Repo)
│   [GitHub Icon] │  ← npm run start:worker を実行
└─────────────────┘
```

## よくある質問

### Q: 同じリポジトリから2つのサービスを作成できますか？

A: はい、可能です。同じリポジトリから複数のサービスを作成し、それぞれ異なるスタートコマンドを設定できます。

### Q: ルートディレクトリとは何ですか？

A: リポジトリのルートではなく、アプリケーションのコードがあるディレクトリを指定します。このプロジェクトでは `crm-platform` がアプリケーションのルートディレクトリです。

### Q: 既存のZenMapCRMサービスを削除して新規作成した方が良いですか？

A: 既存のサービスがある場合は、それをWeb Appとして使用し、Worker Serviceだけを新規作成する方が効率的です。

## トラブルシューティング

### 「+ New」ボタンが見つからない

- 左側の「Architecture」パネルの上部を確認
- プロジェクトの権限を確認（編集権限が必要）

### ルートディレクトリを設定できない

- 「Settings」タブが開いていることを確認
- 「Source」セクションまでスクロールダウン
- 「Add Root Directory」リンクをクリック

### サービスが2つ作成できない

- 同じリポジトリから複数のサービスを作成することは可能です
- 各サービスに異なる名前を付けて区別してください
