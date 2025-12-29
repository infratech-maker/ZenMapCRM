# スクレイピングロジック実装ガイド

## 実装完了

食べログのスクレイピングロジックを実装しました。

## ファイル構成

- `src/features/scraper/worker.ts` - メインのスクレイピングロジック
- `src/features/scraper/scraper-utils.ts` - ユーティリティ関数
- `src/features/scraper/test-scraper.ts` - テスト用スクリプト

## 住所取得ロジック

### 実装内容

1. **Selector Strategy:**
   - 「住所」というテキストを持つ`<th>`を見つけ、その兄弟要素である`<td>`の中の`<p class="rstinfo-table__address">`を取得
   - Playwrightの `filter({ hasText: '住所' })` を使用

2. **Text Extraction:**
   - `.innerText()` でネストされたタグ（`<a>`, `<span>`）内のテキストをすべて結合
   - 改行コード（`\n`）をスペースに置換
   - キャリッジリターン（`\r`）を削除
   - タブ（`\t`）をスペースに置換
   - 連続する空白を1つに正規化
   - 前後の空白をトリム

3. **フォールバック処理:**
   - 方法1: `<p class="rstinfo-table__address">` を取得
   - 方法2: `<td>` 内のテキストを直接取得
   - 方法3: テーブル全体から「住所」を含む行を探す

## テスト方法

### 1. Playwrightのインストール

```bash
cd /Users/a/CallSenderApp/crm-platform
export PATH="/opt/homebrew/bin:$PATH"
npx playwright install chromium
```

### 2. スクレイピングテスト

```bash
npm run scraper:test https://tabelog.com/tokyo/A1309/A130905/13315562/
```

### 期待される結果

```
✅ スクレイピング結果:
{
  "name": "店舗名",
  "address": "東京都新宿区神楽坂6-21 NEO神楽坂 2F-3",
  "category": "カテゴリ",
  "phone": "電話番号",
  "url": "https://tabelog.com/tokyo/A1309/A130905/13315562/"
}
```

## 次のステップ

1. **BullMQ統合**: スクレイピングジョブをBullMQに追加
2. **リード保存**: スクレイピング結果を `leads` テーブルに保存
3. **エラーハンドリング**: より詳細なエラー処理とリトライロジック

## トラブルシューティング

### Playwrightのブラウザがインストールされていない

```bash
npx playwright install chromium
```

### スクレイピングがタイムアウトする

`worker.ts` の `timeout` を調整してください：

```typescript
await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
```

### 住所が取得できない

1. ページのHTML構造が変更されていないか確認
2. セレクタが正しいか確認
3. フォールバック処理が動作しているか確認

