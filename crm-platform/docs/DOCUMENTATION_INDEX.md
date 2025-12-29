# ドキュメントインデックス

統合CRMプラットフォームのすべてのドキュメントへのクイックアクセスガイドです。

## 📚 ドキュメント一覧

### プロジェクト概要

- **[README.md](../README.md)**
  - プロジェクト概要
  - 技術スタック
  - セットアップ手順
  - プロジェクト構造
  - 主要機能（実装予定）

### 設計ドキュメント

- **[DESIGN.md](../DESIGN.md)**
  - 設計思想とアーキテクチャ
  - Closure Table パターンの詳細
  - 動的カラム設計の詳細
  - KPI/PL管理の設計
  - パフォーマンス最適化戦略

### 実装ドキュメント

- **[IMPLEMENTATION.md](IMPLEMENTATION.md)**
  - プロジェクト構造の詳細
  - データベーススキーマの詳細
  - 主要機能の実装
  - ユーティリティ関数
  - 設定ファイル
  - 変更履歴

- **[SCHEMA_REFERENCE.md](SCHEMA_REFERENCE.md)**
  - Enum型定義
  - テーブル定義（全カラムの詳細）
  - リレーション定義
  - インデックス定義

### 変更履歴

- **[CHANGELOG.md](CHANGELOG.md)**
  - バージョンごとの変更内容
  - 追加・変更・削除された機能
  - セキュリティ修正

### ドキュメント管理

- **[docs/README.md](README.md)**
  - ドキュメント構成の説明
  - ドキュメント更新チェックリスト
  - ドキュメントの目的

- **[.github/docs-update-checklist.md](../.github/docs-update-checklist.md)**
  - 実装変更時のチェックリスト
  - ドキュメント更新ガイドライン

---

## 🎯 用途別ドキュメント検索

### セットアップしたい
→ **[README.md](../README.md)** の「セットアップ」セクション

### データベーススキーマを理解したい
→ **[SCHEMA_REFERENCE.md](SCHEMA_REFERENCE.md)**
→ **[DESIGN.md](../DESIGN.md)** の「データモデル設計」セクション

### 実装の詳細を知りたい
→ **[IMPLEMENTATION.md](IMPLEMENTATION.md)**
→ **[DESIGN.md](../DESIGN.md)**

### 設計の理由を知りたい
→ **[DESIGN.md](../DESIGN.md)**
→ **[IMPLEMENTATION.md](IMPLEMENTATION.md)** の各セクションの「設計理由」

### 変更履歴を確認したい
→ **[CHANGELOG.md](CHANGELOG.md)**

### ドキュメントを更新したい
→ **[docs/README.md](README.md)** の「ドキュメント更新チェックリスト」
→ **[.github/docs-update-checklist.md](../.github/docs-update-checklist.md)**

---

## 📋 ドキュメント更新フロー

```
実装変更
    ↓
チェックリスト確認
(.github/docs-update-checklist.md)
    ↓
該当ドキュメントを更新
    ↓
CHANGELOG.md の [Unreleased] に追加
    ↓
リリース時にバージョン番号を付与
```

---

## 🔄 ドキュメントの同期

すべてのドキュメントは、実装に変更が入るたびに更新する必要があります。

**更新が必要なケース**:
- スキーマ変更（テーブル追加・変更、Enum追加）
- 新機能追加
- プロジェクト構造変更
- 設定ファイル変更

**更新手順**:
1. `.github/docs-update-checklist.md` を確認
2. 該当するドキュメントを更新
3. `CHANGELOG.md` の `[Unreleased]` セクションに追加
4. 最終更新日を更新

---

## 📝 ドキュメントの最終更新日

| ドキュメント | 最終更新日 | バージョン |
|------------|----------|----------|
| README.md | 2024-12-19 | 0.1.0 |
| DESIGN.md | 2024-12-19 | 0.1.0 |
| IMPLEMENTATION.md | 2024-12-19 | 0.1.0 |
| SCHEMA_REFERENCE.md | 2024-12-19 | 0.1.0 |
| CHANGELOG.md | 2024-12-19 | 0.1.0 |

---

## 💡 ドキュメント作成のベストプラクティス

1. **明確な説明**: 専門用語を使う場合は説明を追加
2. **使用例**: コード例や使用例を含める
3. **設計理由**: なぜその設計を選んだかを説明
4. **更新履歴**: 変更内容を記録
5. **相互参照**: 関連ドキュメントへのリンクを追加

---

## 🚀 次のステップ

ドキュメントを読んだ後は:

1. **[README.md](../README.md)** に従ってセットアップ
2. **[DESIGN.md](../DESIGN.md)** で設計思想を理解
3. **[IMPLEMENTATION.md](IMPLEMENTATION.md)** で実装詳細を確認
4. 開発を開始！


