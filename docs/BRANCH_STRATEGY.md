# ブランチ戦略とリリースフロー

## 📋 ブランチ構成

### 主要ブランチ

```
main
  ├── develop (開発ブランチ)
  │   ├── feature/* (機能ブランチ)
  │   └── fix/* (バグ修正ブランチ)
  └── release/v*.*.* (リリースブランチ)
```

### ブランチの役割

| ブランチ | 役割 | 説明 |
|---------|------|------|
| **main** | プロダクション | 本番環境にデプロイされる安定版コード。直接コミットしない |
| **develop** | 開発 | 通常の開発作業を行うブランチ。機能開発の統合先 |
| **release/v*.*.*** | リリース準備 | リリース前の最終調整・バグ修正を行うブランチ |
| **feature/*** | 機能開発 | 新機能開発用のブランチ。developから分岐 |
| **fix/*** | バグ修正 | 緊急のバグ修正用ブランチ。developから分岐 |

### 現在のブランチ一覧

**ローカルブランチ:**
- `develop` (現在のブランチ)
- `main`
- `release/v0.4.0`
- `release/v0.5.0`
- `release/v1.0.1`

**リモートブランチ:**
- `origin/develop`
- `origin/main`
- `origin/release/v0.4.0`
- `origin/release/v0.5.0`
- `origin/release/v1.0.1`
- `origin/dependabot/*` (依存関係の自動更新)

## 🔄 開発フロー

### 1. 通常の開発作業

```bash
# 1. developブランチに切り替え
git checkout develop
git pull origin develop

# 2. 機能ブランチを作成（オプション）
git checkout -b feature/new-feature

# 3. 開発作業
# ... コードを編集 ...

# 4. 変更をコミット
git add .
git commit -m "feat: 新機能の追加"

# 5. プッシュ
git push origin develop
# または、機能ブランチの場合
git push origin feature/new-feature
```

### 2. Pull Request の作成

**developブランチへのPR:**
1. GitHubでPull Requestを作成
2. ベースブランチ: `develop`
3. 比較ブランチ: `feature/*` または `fix/*`
4. レビューを受ける
5. 承認後、マージ

**mainブランチへのPR（リリース時）:**
1. GitHubでPull Requestを作成
2. ベースブランチ: `main`
3. 比較ブランチ: `release/v*.*.*`
4. レビューとテストを実施
5. 承認後、マージ

### 3. リリース準備

```bash
# 1. リリースブランチを作成（developから）
git checkout develop
git pull origin develop
git checkout -b release/v1.0.2

# 2. リリース前の最終調整
# - バージョン番号の更新
# - CHANGELOG.mdの更新
# - ドキュメントの確認

# 3. コミット
git add .
git commit -m "chore: prepare release v1.0.2"
git push origin release/v1.0.2
```

### 4. リリース完了（mainブランチへのマージ）

```bash
# 1. mainブランチに切り替え
git checkout main
git pull origin main

# 2. リリースブランチをマージ
git merge release/v1.0.2 --no-ff -m "Release v1.0.2"

# 3. タグを作成
git tag -a v1.0.2 -m "Release version 1.0.2"

# 4. プッシュ
git push origin main
git push origin v1.0.2
```

**注意:** タグをプッシュすると、GitHub Actionsが自動的にリリースを作成します。

### 5. developブランチの更新

```bash
# 1. developブランチに切り替え
git checkout develop
git pull origin develop

# 2. リリースブランチの変更を取り込む
git merge release/v1.0.2

# 3. プッシュ
git push origin develop
```

## 🚀 リリースフロー（詳細）

### ステップ1: 開発完了

```
develop ブランチで開発完了
  ↓
Pull Request を作成
  ↓
レビューと承認
  ↓
develop にマージ
```

### ステップ2: リリース準備

```
develop から release/v*.*.* ブランチを作成
  ↓
リリース前の最終調整
  - バージョン番号の更新
  - CHANGELOG.mdの更新
  - ドキュメントの確認
  - テストの実行
  ↓
release/v*.*.* ブランチにコミット
```

### ステップ3: リリース実行

```
release/v*.*.* から main への Pull Request
  ↓
レビューと最終確認
  ↓
main にマージ
  ↓
タグを作成（v*.*.*）
  ↓
GitHub Actions が自動的にリリースを作成
```

### ステップ4: 後処理

```
main の変更を develop にマージ
  ↓
次の開発サイクルへ
```

## 📝 コミットメッセージ規約

[Conventional Commits](https://www.conventionalcommits.org/) に準拠：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### タイプ

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメントのみの変更
- `style`: コードの動作に影響しない変更（フォーマットなど）
- `refactor`: バグ修正や機能追加を伴わないコード変更
- `perf`: パフォーマンス改善
- `test`: テストの追加・変更
- `chore`: ビルドプロセスやツールの変更
- `ci`: CI設定の変更

### 例

```bash
git commit -m "feat(rag): Add hybrid search functionality"
git commit -m "fix(lead): Resolve merge conflict in CHANGELOG"
git commit -m "docs: Update RAG implementation documentation"
```

## 🔍 GitHub Actions

### CI (Continuous Integration)

**トリガー:**
- `main` または `develop` ブランチへのpush
- `main` または `develop` へのPull Request

**実行内容:**
- .NET アプリケーションのビルド
- Next.js アプリケーションのビルド
- 型チェック
- Lintチェック

**設定ファイル:** `.github/workflows/ci.yml`

### Release

**トリガー:**
- タグのpush（`v*.*.*` 形式）

**実行内容:**
- CHANGELOG.mdからリリースノートを抽出
- GitHub Releaseを作成

**設定ファイル:** `.github/workflows/release.yml`

## 📋 リリース前チェックリスト

リリース前に以下を確認してください：

- [ ] すべてのテストが通過している
- [ ] CHANGELOG.mdが更新されている
- [ ] バージョン番号が正しく更新されている
  - `crm-platform/package.json`
  - `VERSION` ファイル（該当する場合）
- [ ] ドキュメントが最新である
- [ ] 環境変数の設定が正しい
- [ ] ビルドが成功する
- [ ] セキュリティチェックが完了している
- [ ] 依存関係の更新が適切である

## 🏷️ タグ管理

### 現在のタグ

- `v0.2.0`
- `v0.3.0`
- `v1.0.0`

### タグの命名規則

- セマンティックバージョニングに準拠: `v<major>.<minor>.<patch>`
- 例: `v1.0.0`, `v1.0.1`, `v1.1.0`, `v2.0.0`

### タグの作成方法

```bash
# アノテーション付きタグ（推奨）
git tag -a v1.0.2 -m "Release version 1.0.2"
git push origin v1.0.2

# 軽量タグ
git tag v1.0.2
git push origin v1.0.2
```

## ⚠️ 重要な注意事項

### mainブランチ

- **直接コミットしない**
- リリースブランチからのマージのみ
- 常に安定した状態を保つ

### developブランチ

- 通常の開発作業はこちらで行う
- 機能ブランチからのマージを受け入れる
- 定期的にmainから変更を取り込む

### releaseブランチ

- リリース前の最終調整のみ
- バグ修正やドキュメント更新が主な作業
- リリース完了後は削除してもよい（任意）

### マージ戦略

- **mainへのマージ**: `--no-ff` オプションを使用（マージコミットを作成）
- **developへのマージ**: 通常のマージまたはfast-forward

## 🔗 関連ドキュメント

- [リリースワークフロー](./crm-platform/docs/RELEASE_WORKFLOW.md)
- [環境とブランチの関係](./crm-platform/docs/ENVIRONMENT_CLARIFICATION.md)
- [CHANGELOG](./CHANGELOG.md)
- [GitHub Actions ワークフロー](./.github/workflows/)

## 📊 現在の状態（2026年1月時点）

- **現在のブランチ**: `develop`
- **最新のリリース**: `v1.0.0`
- **リリースブランチ**: `release/v0.4.0`, `release/v0.5.0`, `release/v1.0.1`
- **次のリリース予定**: 未定

---

**最終更新**: 2026-01-26  
**メンテナー**: ZenMapCRM Team
