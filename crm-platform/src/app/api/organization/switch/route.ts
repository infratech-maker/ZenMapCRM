import { auth, update } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * 組織切り替えAPI
 * 
 * POST /api/organization/switch
 * Body: { organizationId: string }
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 }
      );
    }

    // ユーザーが指定された組織に所属しているか確認
    const membership = session.user.organizationMemberships.find(
      (m) => m.id === organizationId
    );

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this organization" },
        { status: 403 }
      );
    }

    // セッションを更新
    await update({
      organizationId,
    });

    return NextResponse.json({
      success: true,
      organizationId,
      role: membership.roleName,
    });
  } catch (error) {
    console.error("Error switching organization:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
