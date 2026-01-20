'use server';

import { ApifyClient } from 'apify-client';

// ApifyClientを遅延初期化（トークンが設定されている場合のみ）
function getApifyClient() {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    throw new Error('APIFY_API_TOKEN is not configured');
  }
  return new ApifyClient({ token });
}

export interface StartGoogleMapsScrapingParams {
  keywords: string[];
  location: string;
  maxItems?: number;
}

export interface StartGoogleMapsScrapingResult {
  success: boolean;
  runId?: string;
  error?: string;
}

/**
 * Google Mapsから店舗リストを収集するApifyジョブを開始する
 * 
 * @param keywords - 検索キーワードの配列（例: ["ラーメン", "うどん"]）
 * @param location - 検索場所（例: "東京都", "大阪府"）
 * @param maxItems - 1キーワードあたりの最大収集件数（デフォルト: 50）
 * @returns ジョブ開始結果
 */
export async function startGoogleMapsScraping(
  keywords: string[],
  location: string,
  maxItems: number = 50
): Promise<StartGoogleMapsScrapingResult> {

  // 環境変数のチェック
  if (!process.env.APIFY_API_TOKEN) {
    console.error('❌ APIFY_API_TOKEN is not set');
    return {
      success: false,
      error: 'APIFY_API_TOKEN is not configured',
    };
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.error('❌ NEXT_PUBLIC_APP_URL is not set');
    return {
      success: false,
      error: 'NEXT_PUBLIC_APP_URL is not configured',
    };
  }

  if (!process.env.APIFY_WEBHOOK_SECRET) {
    console.error('❌ APIFY_WEBHOOK_SECRET is not set');
    return {
      success: false,
      error: 'APIFY_WEBHOOK_SECRET is not configured',
    };
  }

  // Webhook URLの構築
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/apify?secret=${process.env.APIFY_WEBHOOK_SECRET}`;

  // Apify Actorの入力パラメータ
  const input = {
    searchStringsArray: keywords,
    locationQuery: location,
    maxCrawledPlacesPerSearch: maxItems,
    language: 'ja',
    country: 'JP',
    zoom: 15, // 精度向上のためズームレベルを指定
  };

  try {
    const apifyClient = getApifyClient();
    
    console.log(`🚀 Starting Apify job with params:`, {
      keywords,
      location,
      maxItems,
      webhookUrl: webhookUrl.replace(process.env.APIFY_WEBHOOK_SECRET!, '***'),
    });

    // Apify Actorを開始
    const run = await apifyClient.actor('compass/crawler-google-places').start(input, {
      webhooks: [
        {
          eventTypes: ['ACTOR.RUN.SUCCEEDED'],
          requestUrl: webhookUrl,
        },
      ],
    });

    console.log(`✅ Apify job started: ${run.id}`);

    return {
      success: true,
      runId: run.id,
    };
  } catch (error) {
    console.error('❌ Apify Start Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start scraping job',
    };
  }
}

/**
 * Apifyジョブのステータスを取得する
 * 
 * @param runId - Apifyジョブの実行ID
 * @returns ジョブのステータス情報
 */
export async function getApifyJobStatus(runId: string) {
  if (!process.env.APIFY_API_TOKEN) {
    return {
      success: false,
      error: 'APIFY_API_TOKEN is not configured',
    };
  }

  try {
    const apifyClient = getApifyClient();
    const run = await apifyClient.run(runId).get();
    if (!run) {
      return {
        success: false,
        error: 'Run not found',
      };
    }
    return {
      success: true,
      status: run.status,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
    };
  } catch (error) {
    console.error('❌ Failed to get Apify job status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get job status',
    };
  }
}

