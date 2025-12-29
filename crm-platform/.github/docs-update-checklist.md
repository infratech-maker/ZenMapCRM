# ドキュメント更新チェックリスト

実装を変更した際は、このチェックリストを確認してドキュメントを更新してください。

## スキーマ変更時

### 新しいテーブルの追加
- [ ] `docs/SCHEMA_REFERENCE.md` の「テーブル定義」セクションに追加
- [ ] `docs/SCHEMA_REFERENCE.md` の「リレーション」セクションに追加（該当する場合）
- [ ] `docs/IMPLEMENTATION.md` の「データベーススキーマ > テーブル一覧」に追加
- [ ] `docs/IMPLEMENTATION.md` の「データベーススキーマ > 詳細スキーマ定義」に追加
- [ ] `docs/CHANGELOG.md` の `[Unreleased]` セクションに追加

### 既存テーブルの変更
- [ ] `docs/SCHEMA_REFERENCE.md` の該当テーブル定義を更新
- [ ] `docs/IMPLEMENTATION.md` の該当テーブル定義を更新
- [ ] `docs/CHANGELOG.md` の `[Unreleased]` セクションに変更内容を追加

### 新しいEnum型の追加
- [ ] `docs/SCHEMA_REFERENCE.md` の「Enum型」セクションに追加
- [ ] `docs/IMPLEMENTATION.md` に追加（該当する場合）
- [ ] `docs/CHANGELOG.md` の `[Unreleased]` セクションに追加

### インデックスの追加/変更
- [ ] `docs/SCHEMA_REFERENCE.md` の「インデックス」セクションを更新
- [ ] `docs/IMPLEMENTATION.md` に追加（該当する場合）
- [ ] `src/lib/db/migrations/` にSQLファイルを追加（該当する場合）

## 機能追加時

### 新しい関数/ユーティリティの追加
- [ ] `docs/IMPLEMENTATION.md` の「主要機能の実装」または「ユーティリティ関数」セクションに追加
- [ ] 使用例を含める
- [ ] `docs/CHANGELOG.md` の `[Unreleased]` セクションに追加

### 新しいAPIエンドポイントの追加
- [ ] `docs/IMPLEMENTATION.md` に追加（該当する場合）
- [ ] API仕様を記録
- [ ] `docs/CHANGELOG.md` の `[Unreleased]` セクションに追加

## プロジェクト構造変更時

- [ ] `docs/IMPLEMENTATION.md` の「プロジェクト構造」セクションを更新
- [ ] 新しいディレクトリ/ファイルの説明を追加
- [ ] `docs/CHANGELOG.md` の `[Unreleased]` セクションに追加

## 設定ファイル変更時

- [ ] `docs/IMPLEMENTATION.md` の「設定ファイル」セクションを更新
- [ ] 変更内容と理由を説明
- [ ] `docs/CHANGELOG.md` の `[Unreleased]` セクションに追加

## リリース時

- [ ] `docs/CHANGELOG.md` の `[Unreleased]` を新しいバージョン番号のセクションに移動
- [ ] 日付を更新
- [ ] すべてのドキュメントの「最終更新日」を更新
- [ ] `docs/IMPLEMENTATION.md` の「変更履歴」セクションを更新

## ドキュメントファイル一覧

更新が必要な可能性があるドキュメントファイル:

- `README.md` - プロジェクト概要
- `DESIGN.md` - 設計ドキュメント
- `docs/IMPLEMENTATION.md` - 実装ドキュメント
- `docs/SCHEMA_REFERENCE.md` - スキーマリファレンス
- `docs/CHANGELOG.md` - 変更履歴
- `docs/README.md` - ドキュメント一覧


