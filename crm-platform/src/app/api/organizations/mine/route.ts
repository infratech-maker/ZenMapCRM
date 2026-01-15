import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * 所属組織一覧取得API
 * 
 * GET /api/organizations/mine
 * 
 * ログインユーザーが所属している全ての組織を返します。
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // OrganizationMemberテーブルからユーザーが所属している全ての組織を取得
    const memberships = await prisma.organizationMember.findMany({
      where: {
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            isActive: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: [
        { isPrimary: "desc" }, // 主所属を優先
        { createdAt: "asc" }, // 作成日時順
      ],
    });

    // レスポンス形式に整形
    const organizations = memberships.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      code: membership.organization.code,
      type: membership.organization.type,
      isActive: membership.organization.isActive,
      role: {
        id: membership.role.id,
        name: membership.role.name,
        description: membership.role.description,
      },
      isPrimary: membership.isPrimary,
      expiresAt: membership.expiresAt,
      createdAt: membership.createdAt,
    }));

    return NextResponse.json({
      success: true,
      organizations,
    });
  } catch (error) {
    console.error("Error fetching user organizations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
