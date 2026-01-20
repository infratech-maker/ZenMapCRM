# リリースワークフロー v0.5.0

## 📋 現在のブランチ構成

- **develop**: 開発ブランチ（通常の開発作業）
- **release/v0.5.0**: リリースブランチ（v0.5.0向けの修正・調整）
- **main**: プロダクションブランチ（リリース完了後にマージ）

## 🔄 作業フロー

### 通常の開発作業

1. **developブランチで作業**
   ```bash
   git checkout develop
   # 開発作業
   git add .
   git commit -m "feat: 新機能の追加"
   git push origin develop
   ```

2. **release/v0.5.0ブランチにも同じ変更を適用**
   ```bash
   git checkout release/v0.5.0
   git merge develop
   # または、cherry-pickで特定のコミットを適用
   git cherry-pick <commit-hash>
   git push origin release/v0.5.0
   ```

### リリース専用の修正

リリースブランチでのみ必要な修正（バグ修正、ドキュメント更新など）の場合：

1. **release/v0.5.0ブランチで作業**
   ```bash
   git checkout release/v0.5.0
   # 修正作業
   git add .
   git commit -m "fix: リリース前のバグ修正"
   git push origin release/v0.5.0
   ```

2. **必要に応じてdevelopブランチにも適用**
   ```bash
   git checkout develop
   git cherry-pick <commit-hash>
   git push origin develop
   ```

## 📝 コミットメッセージの例

### 両ブランチに適用する場合
```bash
# developでコミット
git commit -m "feat: CHANGELOG連携機能の追加"

# release/v0.5.0にも適用
git checkout release/v0.5.0
git merge develop
git push origin release/v0.5.0
```

### リリース専用の修正
```bash
# release/v0.5.0でコミット
git commit -m "fix: v0.5.0リリース前のバグ修正"

# 必要に応じてdevelopにも適用
git checkout develop
git cherry-pick <commit-hash>
```

## 🚀 リリース完了後の手順

1. **最終確認**
   - release/v0.5.0ブランチで動作確認
   - テストの実行
   - ドキュメントの確認

2. **mainブランチへマージ**
   ```bash
   git checkout main
   git merge release/v0.5.0 --no-ff -m "Release v0.5.0"
   git push origin main
   ```

3. **タグの作成**
   ```bash
   git tag -a v0.5.0 -m "Release version 0.5.0"
   git push origin v0.5.0
   ```

4. **developブランチの更新**
   ```bash
   git checkout develop
   git merge release/v0.5.0
   git push origin develop
   ```

## ⚠️ 注意事項

- **developブランチ**: 通常の開発作業はこちらで行う
- **release/v0.5.0ブランチ**: リリース向けの修正・調整のみ
- **mainブランチ**: リリース完了後にマージ（直接コミットしない）

## 📋 チェックリスト

リリース前に確認すること：

- [ ] すべてのテストが通過している
- [ ] CHANGELOG.mdが更新されている
- [ ] バージョン番号が正しく更新されている（package.json）
- [ ] ドキュメントが最新である
- [ ] 環境変数の設定が正しい
- [ ] ビルドが成功する

---

**現在のバージョン**: v0.5.0  
**リリースブランチ**: `release/v0.5.0`  
**最終更新**: 2025-01-20
