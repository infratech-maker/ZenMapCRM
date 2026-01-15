import { auth, update } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

    // ユーザーが指定された組織に所属しているかDBから確認
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
        organizationId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this organization" },
        { status: 403 }
      );
    }

    // セッションを更新（activeOrganizationIdを変更）
    await update({
      activeOrganizationId: organizationId,
    });

    return NextResponse.json({
      success: true,
      organizationId,
      role: membership.role.name,
    });
  } catch (error) {
    console.error("Error switching organization:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
