/**
 * Lead Service - データの鮮度と履歴を管理するサービスクラス
 * 
 * このサービスは、リード情報の更新を一元管理し、以下の処理をトランザクション内で実行します：
 * 1. Snapshot: 更新前のデータを LeadSnapshot テーブルに保存（履歴作成）
 * 2. Update: Lead / MasterLead テーブルを更新
 * 3. Vectorize: 更新後のテキストを生成し、OpenAI Embedding APIをコールして LeadVector を再更新
 */

import { prisma } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/ai/embedding";

/**
 * MasterLeadから検索用テキストを生成する
 * generate-embeddings.ts の createContent 関数と同じロジック
 */
function createContentFromMasterLead(lead: {
  companyName: string;
  address: string | null;
  phone: string | null;
  source: string;
  data: any;
}): string {
  const data = lead.data as any || {};
  
  // 検索に引っかかってほしい重要項目を列挙
  const parts = [
    `店名: ${lead.companyName || '不明'}`,
    `住所: ${lead.address || '不明'}`,
    `電話番号: ${lead.phone || '不明'}`,
    `ソース: ${lead.source || '不明'}`,
  ];

  // data内の情報を追加
  if (data.category) {
    parts.push(`カテゴリ: ${data.category}`);
  }
  if (data.description) {
    parts.push(`概要: ${data.description}`);
  }
  if (data.name && data.name !== lead.companyName) {
    parts.push(`名称: ${data.name}`);
  }
  if (data.店舗名 && data.店舗名 !== lead.companyName) {
    parts.push(`店舗名: ${data.店舗名}`);
  }
  
  // Google Maps等の詳細データがある場合
  if (data.rating) {
    parts.push(`評価: ${data.rating}`);
  }
  if (data.reviews) {
    parts.push(`レビュー数: ${data.reviews}`);
  }
  if (data.totalScore) {
    parts.push(`総合スコア: ${data.totalScore}`);
  }
  if (data.reviewsCount) {
    parts.push(`レビュー数: ${data.reviewsCount}`);
  }
  
  // その他のキーワード
  if (data.categoryName) {
    parts.push(`カテゴリ名: ${data.categoryName}`);
  }
  if (data.transport || data.交通手段 || data.交通アクセス) {
    parts.push(`交通手段: ${data.transport || data.交通手段 || data.交通アクセス}`);
  }
  if (data.businessHours || data.営業時間) {
    parts.push(`営業時間: ${data.businessHours || data.営業時間}`);
  }
  if (data.regularHoliday || data.定休日) {
    parts.push(`定休日: ${data.regularHoliday || data.定休日}`);
  }

  return parts.filter(p => p && !p.includes(': 不明')).join('\n');
}

/**
 * Lead更新データの型定義
 */
export interface UpdateLeadData {
  data?: any;
  status?: string;
  notes?: string;
  organizationId?: string | null;
  projectId?: string | null;
  // MasterLeadに関連するフィールド
  companyName?: string;
  address?: string | null;
  phone?: string | null;
  source?: string;
  masterLeadData?: any; // MasterLeadのdataフィールド
}

/**
 * リード情報を更新し、履歴を保存し、ベクトルを再生成する
 * 
 * @param leadId - 更新するLeadのID
 * @param updateData - 更新データ
 * @param reason - スナップショットの理由（デフォルト: "update"）
 * @returns 更新されたLeadとMasterLead
 */
export async function updateLead(
  leadId: string,
  updateData: UpdateLeadData,
  reason: string = "update"
) {
  return await prisma.$transaction(async (tx) => {
    // 1. 現在のLeadデータを取得（スナップショット用）
    const currentLead = await tx.lead.findUnique({
      where: { id: leadId },
      include: {
        masterLead: true,
      },
    });

    if (!currentLead) {
      throw new Error(`Lead with id ${leadId} not found`);
    }

    // 2. Snapshot: 更新前のデータを LeadSnapshot に保存
    await tx.leadSnapshot.create({
      data: {
        leadId: currentLead.id,
        status: currentLead.status,
        data: currentLead.data as any,
        reason,
      },
    });

    // 3. Update: Lead テーブルを更新
    const updatedLead = await tx.lead.update({
      where: { id: leadId },
      data: {
        data: updateData.data !== undefined ? updateData.data : currentLead.data,
        status: updateData.status !== undefined ? updateData.status : currentLead.status,
        notes: updateData.notes !== undefined ? updateData.notes : currentLead.notes,
        organizationId: updateData.organizationId !== undefined ? updateData.organizationId : currentLead.organizationId,
        projectId: updateData.projectId !== undefined ? updateData.projectId : currentLead.projectId,
      },
      include: {
        masterLead: true,
      },
    });

    // 4. MasterLeadの更新（masterLeadIdが存在する場合）
    let updatedMasterLead = updatedLead.masterLead;
    
    if (updatedLead.masterLeadId && updatedMasterLead) {
      // MasterLeadの更新データを準備
      const masterLeadUpdateData: any = {};
      
      if (updateData.companyName !== undefined) {
        masterLeadUpdateData.companyName = updateData.companyName;
      }
      if (updateData.address !== undefined) {
        masterLeadUpdateData.address = updateData.address;
      }
      if (updateData.phone !== undefined) {
        masterLeadUpdateData.phone = updateData.phone;
      }
      if (updateData.source !== undefined) {
        masterLeadUpdateData.source = updateData.source;
      }
      if (updateData.masterLeadData !== undefined) {
        masterLeadUpdateData.data = updateData.masterLeadData;
      }

      // MasterLeadを更新
      if (Object.keys(masterLeadUpdateData).length > 0) {
        updatedMasterLead = await tx.masterLead.update({
          where: { id: updatedLead.masterLeadId },
          data: masterLeadUpdateData,
        });
      }
    }

    // 5. Vectorize: 更新後のテキストを生成し、Embedding APIをコールして LeadVector を再更新
    if (updatedMasterLead) {
      const content = createContentFromMasterLead({
        companyName: updatedMasterLead.companyName,
        address: updatedMasterLead.address,
        phone: updatedMasterLead.phone,
        source: updatedMasterLead.source,
        data: updatedMasterLead.data,
      });

      // 空データや極端に短いものはスキップ
      if (content.length >= 10) {
        try {
          // Embedding生成
          const vector = await generateEmbedding(content);

          // LeadVectorを更新（存在しない場合は作成）
          await tx.$executeRaw`
            INSERT INTO lead_vectors (id, "masterLeadId", content, embedding, "createdAt")
            VALUES (gen_random_uuid(), ${updatedMasterLead.id}, ${content}, ${vector}::vector, NOW())
            ON CONFLICT ("masterLeadId") 
            DO UPDATE SET 
              content = EXCLUDED.content,
              embedding = EXCLUDED.embedding
          `;
        } catch (error) {
          // Embedding生成に失敗しても、Leadの更新は成功とする
          console.error(`Failed to update vector for MasterLead ${updatedMasterLead.id}:`, error);
        }
      }
    }

    return {
      lead: updatedLead,
      masterLead: updatedMasterLead,
    };
  });
}
