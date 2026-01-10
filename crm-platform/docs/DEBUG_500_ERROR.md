# 500 Internal Server Error デバッグガイド

## ロールバック/コード削除後に発生しやすい500エラーの原因チェックリスト

### 1. 構文エラー（Syntax Errors）

#### チェックポイント
- [ ] **括弧の不一致**: `()`, `{}`, `[]` の開閉が一致しているか
- [ ] **セミコロンの欠落**: 文末のセミコロンが正しいか
- [ ] **文字列の引用符**: シングルクォート `'` とダブルクォート `"` の閉じ忘れ
- [ ] **テンプレートリテラル**: バッククォート `` ` `` の閉じ忘れ
- [ ] **JSXの閉じタグ**: `<div>`, `<Component>` などの閉じタグが存在するか

#### 確認方法
```bash
# TypeScriptの型チェック
npx tsc --noEmit

# ESLintの実行
npm run lint
```

---

### 2. インポート/エクスポートエラー

#### チェックポイント
- [ ] **存在しないファイルのインポート**: 削除したファイルをインポートしていないか
  ```typescript
  // ❌ 削除したファイルをインポート
  import { something } from "@/lib/deleted-file";
  
  // ✅ 正しいインポート
  import { something } from "@/lib/existing-file";
  ```
- [ ] **存在しないエクスポートのインポート**: 削除した関数/変数をインポートしていないか
  ```typescript
  // ❌ 削除した関数をインポート
  import { deletedFunction } from "@/lib/actions/some-file";
  
  // ✅ 存在する関数をインポート
  import { existingFunction } from "@/lib/actions/some-file";
  ```
- [ ] **循環依存**: ファイル間で相互にインポートしていないか
- [ ] **パスの誤り**: `@/` エイリアスや相対パスが正しいか
- [ ] **デフォルトエクスポート vs 名前付きエクスポート**: インポート方法が一致しているか
  ```typescript
  // ❌ デフォルトエクスポートを名前付きでインポート
  import { Component } from "./component"; // export default Component の場合
  
  // ✅ 正しいインポート
  import Component from "./component";
  ```

#### 確認方法
```bash
# インポートエラーを検出
npx tsc --noEmit | grep -i "import\|export\|module"
```

---

### 3. 型エラー（Type Errors）

#### チェックポイント
- [ ] **必須プロパティの欠落**: オブジェクトに必要なプロパティが不足していないか
  ```typescript
  // ❌ 必須プロパティが欠落
  const lead = {
    name: "Test",
    // phone が必須なのに欠落
  };
  
  // ✅ 必須プロパティを含む
  const lead = {
    name: "Test",
    phone: "090-1234-5678",
  };
  ```
- [ ] **型の不一致**: 関数の引数や戻り値の型が一致しているか
- [ ] **null/undefined チェック**: オプショナルな値にアクセスする前にチェックしているか
  ```typescript
  // ❌ nullチェックなし
  const value = user.org.name; // user.org が null の可能性
  
  // ✅ nullチェックあり
  const value = user.org?.name;
  ```

#### 確認方法
```bash
# TypeScriptの型チェック
npx tsc --noEmit
```

---

### 4. データベース/Prisma関連エラー

#### チェックポイント
- [ ] **削除したテーブル/カラムへの参照**: スキーマから削除したテーブルやカラムを参照していないか
- [ ] **リレーションの不整合**: 外部キーやリレーションが正しく定義されているか
- [ ] **Prisma Clientの再生成**: スキーマ変更後に `npx prisma generate` を実行したか
  ```bash
  # Prisma Clientの再生成
  npx prisma generate
  ```
- [ ] **マイグレーションの適用**: データベースマイグレーションが適用されているか
  ```bash
  # マイグレーションの確認
  npx prisma migrate status
  
  # マイグレーションの適用
  npx prisma migrate deploy
  ```

---

### 5. 環境変数/設定エラー

#### チェックポイント
- [ ] **削除した環境変数の参照**: `.env.local` から削除した変数をコードで参照していないか
  ```typescript
  // ❌ 削除した環境変数を参照
  const apiKey = process.env.DELETED_API_KEY;
  
  // ✅ 存在する環境変数を参照、またはデフォルト値を設定
  const apiKey = process.env.EXISTING_API_KEY || "default";
  ```
- [ ] **必須環境変数の欠落**: アプリケーションに必要な環境変数が設定されているか

#### 確認方法
```bash
# 環境変数の確認
cat .env.local
```

---

### 6. 非同期処理エラー

#### チェックポイント
- [ ] **await の欠落**: 非同期関数の呼び出しに `await` が付いているか
  ```typescript
  // ❌ await なし
  const data = getData(); // Promise が返される
  
  // ✅ await あり
  const data = await getData();
  ```
- [ ] **エラーハンドリング**: `try-catch` ブロックが適切に配置されているか
- [ ] **Promise のチェーン**: `.then()` と `async/await` の混在による問題

---

### 7. コンポーネント/Props エラー

#### チェックポイント
- [ ] **削除したコンポーネントの使用**: 削除したコンポーネントをレンダリングしていないか
- [ ] **必須Propsの欠落**: コンポーネントに必要なPropsが渡されているか
- [ ] **Propsの型不一致**: 渡しているPropsの型がコンポーネントの期待する型と一致しているか

---

### 8. パス/ルーティングエラー

#### チェックポイント
- [ ] **削除したページへのリンク**: 削除したページへのリンクやリダイレクトがないか
- [ ] **動的ルートのパラメータ**: `[id]` などの動的ルートのパラメータが正しく処理されているか

---

## VS Code上でエラーログを確認する方法

### 1. ターミナル（統合ターミナル）

**場所**: `View` → `Terminal` または `` Ctrl+` `` (バッククォート)

**確認内容**:
- 開発サーバー（`npm run dev`）のログ
- エラーメッセージとスタックトレース
- ビルドエラー

**例**:
```
Error: Cannot find module '@/lib/deleted-file'
    at Object.<anonymous> (/path/to/file.ts:5:1)
```

---

### 2. 問題パネル（Problems Panel）

**場所**: `View` → `Problems` または `Ctrl+Shift+M`

**確認内容**:
- TypeScriptの型エラー
- ESLintの警告・エラー
- 構文エラー

**表示内容**:
- ファイル名
- 行番号
- エラーメッセージ
- エラーの種類（Error/Warning）

---

### 3. 出力パネル（Output Panel）

**場所**: `View` → `Output` または `Ctrl+Shift+U`

**確認内容**:
- TypeScript Server のログ
- ESLint のログ
- その他の拡張機能のログ

**設定方法**:
1. 出力パネルを開く
2. 右上のドロップダウンから「TypeScript」や「ESLint」を選択

---

### 4. デバッグコンソール（Debug Console）

**場所**: `Run and Debug` パネル内、または `Ctrl+Shift+Y`

**確認内容**:
- `console.log()` の出力
- `console.error()` の出力
- デバッグセッション中のログ

---

### 5. ブラウザの開発者ツール

**場所**: ブラウザで `F12` または `Cmd+Option+I` (Mac)

**確認内容**:
- ネットワークタブ: リクエスト/レスポンスの詳細
- コンソールタブ: クライアント側のエラー
- ソースタブ: ブレークポイントを設定してデバッグ

---

## 実際のデバッグ手順

### Step 1: ターミナルでエラーログを確認

```bash
# 開発サーバーを起動
npm run dev

# エラーメッセージを確認
# 通常、エラーの原因が最初に表示されます
```

### Step 2: TypeScriptの型チェック

```bash
# 型エラーを確認
npx tsc --noEmit

# エラーが表示されたら、該当ファイルを確認
```

### Step 3: 問題パネルでエラーを確認

1. `Ctrl+Shift+M` で問題パネルを開く
2. エラーをクリックして該当ファイルに移動
3. エラーメッセージを読んで原因を特定

### Step 4: 該当ファイルを確認

1. エラーが発生しているファイルを開く
2. エラーが指摘している行を確認
3. 最近変更した部分を重点的に確認

### Step 5: Gitで変更履歴を確認

```bash
# 最近の変更を確認
git diff

# 特定のファイルの変更履歴
git log -p -- path/to/file.ts
```

---

## よくあるエラーパターンと解決方法

### パターン1: "Cannot find module"

**原因**: 削除したファイルをインポートしている

**解決方法**:
1. インポート文を確認
2. 削除したファイルへの参照を削除
3. または、正しいファイルパスに修正

### パターン2: "Property does not exist on type"

**原因**: 削除したプロパティにアクセスしている

**解決方法**:
1. 該当プロパティへのアクセスを削除
2. または、型定義を更新

### パターン3: "Unexpected token" または "SyntaxError"

**原因**: 構文エラー（括弧の不一致、セミコロンの欠落など）

**解決方法**:
1. エラーが指摘している行を確認
2. 括弧やセミコロンを修正

### パターン4: "Cannot read property 'xxx' of undefined"

**原因**: null/undefined チェックなしでプロパティにアクセス

**解決方法**:
1. オプショナルチェーン (`?.`) を使用
2. または、null チェックを追加

---

## 緊急時の対処法

### 1. 最新のコミットに戻す

```bash
# 変更を破棄して最新のコミットに戻す
git reset --hard HEAD

# または、特定のコミットに戻す
git reset --hard <commit-hash>
```

### 2. ビルドキャッシュをクリア

```bash
# Next.jsのビルドキャッシュを削除
rm -rf .next

# node_modulesを再インストール（必要に応じて）
rm -rf node_modules
npm install
```

### 3. 開発サーバーを再起動

```bash
# サーバーを停止（Ctrl+C）
# 再度起動
npm run dev
```

---

## まとめ

500エラーの原因を特定するには：

1. **ターミナルのログを確認** - 最も重要
2. **TypeScriptの型チェック** - 型エラーを検出
3. **問題パネルでエラーを確認** - VS Code上で視覚的に確認
4. **最近変更したファイルを重点的に確認** - ロールバック作業の影響範囲を特定
5. **Gitで変更履歴を確認** - 何を削除/変更したかを把握

最も効率的な方法は、**ターミナルで開発サーバーを起動し、エラーメッセージを直接確認すること**です。
