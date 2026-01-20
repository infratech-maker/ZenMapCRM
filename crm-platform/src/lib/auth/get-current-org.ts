import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * 現在アクティブな組織IDを取得
 * 
 * セッションから現在の組織IDを取得します。
 * 組織IDが存在しない場合は、組織選択ページへリダイレクトします。
 * 
 * @returns 現在アクティブな組織ID
 * @throws 組織IDが存在しない場合はリダイレクト
 */
export async function getCurrentOrgId(): Promise<string> {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/login");
  }

  const orgId = session.user.activeOrganizationId;

  if (!orgId) {
    // 組織コンテキストがない場合は組織選択へ
    // 将来的に組織選択ページを作成する場合は、以下のパスに変更
    // redirect("/dashboard/select-org");
    
    // 現時点では、所属組織一覧APIから最初の組織を取得してセッションを更新
    // または、エラーを返す
    throw new Error("No active organization found. Please select an organization.");
  }

  return orgId;
}

/**
 * 現在アクティブな組織IDを取得（オプショナル）
 * 
 * セッションから現在の組織IDを取得します。
 * 組織IDが存在しない場合は null を返します。
 * 
 * @returns 現在アクティブな組織ID、または null
 */
export async function getCurrentOrgIdOptional(): Promise<string | null> {
  const session = await auth();
  
  if (!session?.user) {
    return null;
  }

  return session.user.activeOrganizationId || null;
}
