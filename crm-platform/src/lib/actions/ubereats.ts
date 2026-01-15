'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCurrentOrgId } from '@/lib/auth/get-current-org';

export interface StartUbereatsScrapingParams {
  areaUrl: string;
  maxItems?: number;
}

export interface StartUbereatsScrapingResult {
  success: boolean;
  jobId?: string;
  error?: string;
}

/**
 * UberEatsから店舗リストを収集するジョブを開始する
 * 
 * @param areaUrl - UberEatsのエリア別一覧ページURL（例: "https://www.ubereats.com/jp/location/tokyo"）
 * @param maxItems - 最大収集件数（デフォルト: 50）
 * @returns ジョブ開始結果
 */
export async function startUbereatsScraping(
  areaUrl: string,
  maxItems: number = 50
): Promise<StartUbereatsScrapingResult> {
  try {
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    const tenantId = session.user.tenantId;
    const organizationId = await getCurrentOrgId();

    // URLの検証
    if (!areaUrl || !areaUrl.includes('ubereats.com')) {
      return {
        success: false,
        error: 'Invalid UberEats URL',
      };
    }

    // スクレイピングジョブを作成
    const scrapingJob = await prisma.scrapingJob.create({
      data: {
        tenantId,
        url: areaUrl,
        status: 'PENDING', // ScrapingJobStatus enumは大文字
        result: {
          source: 'ubereats',
          areaUrl,
          maxItems,
          organizationId,
        } as any,
        createdBy: session.user.id,
      },
    });

    // バックグラウンドで実行するため、ジョブIDを返す
    // 実際のスクレイピングはWorkerサービスで実行される
    console.log(`✅ UberEats scraping job created: ${scrapingJob.id}`);

    return {
      success: true,
      jobId: scrapingJob.id,
    };
  } catch (error) {
    console.error('❌ UberEats scraping job creation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create scraping job',
    };
  }
}
