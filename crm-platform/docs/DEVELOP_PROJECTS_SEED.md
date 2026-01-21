# Develop環境 プロジェクトとリードデータのシード手順

develop環境の`dashboard/projects`にリードデータを反映させる手順です。

## 📋 前提条件

- ローカル開発環境が起動している
- データベースに基本的なシードデータ（テナント、ユーザー、組織）が投入されている
- MasterLeadデータが存在する（またはリードデータがインポートされている）

## 🔧 シード手順

### ステップ1: 基本的なシードデータの確認

まず、テナント、ユーザー、組織が作成されているか確認：

```bash
cd crm-platform
npx prisma db seed
```

このコマンドで以下が作成されます：
- テナント（zenmao, demo-partner）
- ユーザー（admin@zenmao.com, admin@partner.com, user@zenmao.com）
- 権限（Permission）
- ロール（Role）
- 組織（Organization）

### ステップ2: リードデータのインポート（必要に応じて）

もしリードデータがまだない場合：

#### オプション1: CSVファイルからインポート

```bash
npm run db:import:leads <ファイルパス> --format csv
```

#### オプション2: JSONファイルからインポート

```bash
npm run db:import:leads <ファイルパス> --format json
```

#### オプション3: MasterLeadデータの確認

既存のMasterLeadデータがあるか確認：

```bash
npx prisma studio
```

Prisma Studioで`MasterLead`テーブルにデータが存在するか確認してください。

### ステップ3: プロジェクトとリードデータのシード

プロジェクトを作成し、リードデータを紐付けます：

```bash
npm run db:seed:projects
```

または：

```bash
npx tsx scripts/seed-develop-projects.ts
```

このスクリプトは以下を実行します：
1. 既存のMasterLeadから最大50件を取得
2. サンプルプロジェクトを作成
3. リードデータをプロジェクトに紐付け
4. 組織IDを設定して、`dashboard/projects`で表示可能にする

### ステップ4: データの確認

#### ブラウザで確認

1. ローカル開発環境にアクセス: `http://localhost:5000/dashboard/projects`
2. プロジェクトが表示されることを確認
3. プロジェクトを開いて、リード一覧が表示されることを確認

#### Prisma Studioで確認

```bash
npx prisma studio
```

以下を確認：
- `Project`テーブルにプロジェクトが作成されている
- `Lead`テーブルの`projectId`が正しく設定されている
- `Lead`テーブルの`organizationId`が正しく設定されている

## 📋 スクリプトの詳細

### seed-develop-projects.ts

**機能:**
- 既存のMasterLeadからサンプルプロジェクトを作成
- リードデータをプロジェクトに紐付け
- 組織IDを設定

**処理内容:**
1. テナント（zenmao）と組織を取得
2. MasterLeadを最大50件取得
3. サンプルプロジェクトを作成
4. 各MasterLeadに対応するリードを作成または更新
5. リードをプロジェクトに紐付け

## ⚠️ 注意事項

### データの重複

- 既存のリードがある場合、プロジェクトに紐付けます
- 新しいリードがない場合、新規作成します
- 同じMasterLeadに対して複数のリードが作成されないように制御されています

### 組織IDの設定

- リードデータには`organizationId`が設定されます
- これにより、`dashboard/projects`で正しく表示されます

## 🔍 トラブルシューティング

### エラー: "テナントが見つかりません"

**解決方法:**
```bash
npx prisma db seed
```

### エラー: "MasterLeadデータがありません"

**解決方法:**
1. リードデータをインポート:
   ```bash
   npm run db:import:leads <ファイルパス>
   ```

2. または、MasterLeadデータを直接作成

### プロジェクトが表示されない

**確認事項:**
1. ログインしているユーザーの`activeOrganizationId`が正しく設定されているか
2. リードデータの`organizationId`が正しく設定されているか
3. プロジェクトにリードが紐付けられているか

## ✅ 確認チェックリスト

- [ ] 基本的なシードデータが投入されている
- [ ] MasterLeadデータが存在する
- [ ] プロジェクトシードスクリプトを実行
- [ ] `dashboard/projects`でプロジェクトが表示される
- [ ] プロジェクトを開いて、リード一覧が表示される

## 📝 まとめ

develop環境の`dashboard/projects`にリードデータを反映させる手順：

1. **基本的なシードデータの投入**: `npx prisma db seed`
2. **リードデータのインポート**（必要に応じて）: `npm run db:import:leads`
3. **プロジェクトとリードデータのシード**: `npm run db:seed:projects`
4. **動作確認**: `http://localhost:5000/dashboard/projects`で確認

---

**最終更新**: 2025-01-20
