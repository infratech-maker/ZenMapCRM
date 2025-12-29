/**
 * スクレイピングユーティリティ関数
 */

/**
 * テキストから改行コードを削除し、空白を正規化
 * 
 * @param text 処理対象のテキスト
 * @returns 正規化されたテキスト
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return "";
  
  return text
    .replace(/\n/g, " ")      // 改行をスペースに置換
    .replace(/\r/g, "")        // キャリッジリターンを削除
    .replace(/\t/g, " ")       // タブをスペースに置換
    .replace(/\s+/g, " ")      // 連続する空白を1つに
    .trim();                   // 前後の空白を削除
}

/**
 * カテゴリ文字列からスラッシュより後ろの部分を抽出
 * 
 * @param category カテゴリ文字列（例: "駅名 距離 / カテゴリ"）
 * @returns 抽出されたカテゴリ（例: "カテゴリ"）
 */
export function extractCategory(category: string | null | undefined): string {
  if (!category) return "";
  
  const parts = category.split("/");
  if (parts.length > 1) {
    return normalizeText(parts[parts.length - 1]);
  }
  return normalizeText(category);
}

/**
 * 住所文字列からアクセス情報（スラッシュより前）を抽出
 * 
 * @param address 住所文字列（例: "駅名 距離 / カテゴリ"）
 * @returns 抽出されたアクセス情報（例: "駅名 距離"）
 */
export function extractAccessInfo(address: string | null | undefined): string {
  if (!address) return "";
  
  const parts = address.split("/");
  return normalizeText(parts[0]);
}

