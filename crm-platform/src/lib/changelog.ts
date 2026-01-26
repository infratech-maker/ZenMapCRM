/**
 * CHANGELOG.mdを読み込み、最新のリリース情報を抽出するユーティリティ
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export interface ReleaseNote {
  version: string;
  date: string;
  content: string;
}

/**
 * CHANGELOG.mdを読み込み、最新のリリース情報を抽出する
 * @param limit 取得するリリース数（デフォルト: 5）
 * @returns リリース情報の配列
 */
export async function getChangelog(limit: number = 5): Promise<ReleaseNote[]> {
  try {
    // プロジェクトルートのdocs/CHANGELOG.mdを読み込む
    const changelogPath = join(process.cwd(), 'docs', 'CHANGELOG.md');
    const changelogContent = readFileSync(changelogPath, 'utf-8');

    // リリースセクションを抽出する正規表現
    // 形式: ## [x.x.x] - YYYY-MM-DD
    const releasePattern = /^## \[([\d.]+)\]\s*-\s*(\d{4}-\d{2}-\d{2})/gm;
    
    const releases: ReleaseNote[] = [];
    let lastIndex = 0;
    let match;

    // すべてのリリースヘッダーを検索
    const allMatches: Array<{ version: string; date: string; index: number; startIndex: number; endIndex: number }> = [];
    
    while ((match = releasePattern.exec(changelogContent)) !== null) {
      const version = match[1];
      const date = match[2];
      const index = match.index;
      const startIndex = match.index + match[0].length;
      
      allMatches.push({
        version,
        date,
        index,
        startIndex,
        endIndex: 0, // 後で設定
      });
    }

    // 各リリースの終了位置を設定（次のリリースの開始位置、またはファイルの終わり）
    for (let i = 0; i < allMatches.length; i++) {
      if (i < allMatches.length - 1) {
        // 次のリリースヘッダーの開始位置を終了位置とする
        allMatches[i].endIndex = allMatches[i + 1].index;
      } else {
        allMatches[i].endIndex = changelogContent.length;
      }
    }

    // 最新のlimit件を取得
    const recentReleases = allMatches.slice(0, limit);

    // 各リリースのコンテンツを抽出
    for (const release of recentReleases) {
      let content = changelogContent
        .substring(release.startIndex, release.endIndex)
        .trim();

      // 先頭の改行や空白を削除
      content = content.replace(/^\n+/, '').trim();

      // Unreleasedセクションは除外
      if (content.includes('[Unreleased]')) {
        continue;
      }

      releases.push({
        version: release.version,
        date: release.date,
        content,
      });
    }

    return releases;
  } catch (error) {
    console.error('Failed to read changelog:', error);
    // エラー時は空配列を返す
    return [];
  }
}
