"use server";

import { updateLead as updateLeadService } from "@/services/lead-service";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { UpdateLeadData } from "@/services/lead-service";

/**
 * リード情報を更新するServer Action
 * 
 * この関数は、Service層のupdateLeadを呼び出し、以下の処理を実行します：
 * 1. Snapshot: 更新前のデータを LeadSnapshot に保存
 * 2. Update: Lead / MasterLead テーブルを更新
 * 3. Vectorize: Embedding APIをコールして LeadVector を再更新
 * 
 * @param id - 更新するLeadのID
 * @param data - 更新データ
 * @param reason - スナップショットの理由（デフォルト: "user_edit"）
 * @returns 更新結果
 */
export async function updateLeadAction(
  id: string,
  data: UpdateLeadData,
  reason: string = "user_edit"
) {
  try {
    // 権限チェック
    const session = await auth();
    if (!session?.user) {
      throw new Error("認証が必要です");
    }

    // Service層のupdateLeadを呼び出し
    const result = await updateLeadService(id, data, reason);

    // キャッシュ更新
    revalidatePath("/dashboard/leads");
    revalidatePath(`/dashboard/leads/${id}`);

    return {
      success: true,
      message: "更新しました（AIインデックスも再計算済み）",
      lead: result.lead,
      masterLead: result.masterLead,
    };
  } catch (error) {
    console.error("updateLeadAction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新に失敗しました",
    };
  }
}
