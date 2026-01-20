"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * 組織作成のバリデーションスキーマ
 */
const createOrganizationSchema = z.object({
  name: z.string().min(1, "組織名は必須です"),
  code: z.string().min(1, "スラッグは必須です").regex(/^[a-z0-9-]+$/, "スラッグは小文字の英数字とハイフンのみ使用可能です"),
});

/**
 * 全組織一覧を取得（SUPER_ADMIN専用）
 * 
 * @returns 組織一覧（メンバー数を含む）
 */
export async function getAllOrganizations() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // SUPER_ADMINのみアクセス可能
  if (session.user.activeOrganizationRole !== "Super Admin") {
    throw new Error("Access denied: SUPER_ADMIN role required");
  }

  const tenantId = session.user.tenantId;

  // 全組織を取得（メンバー数も含む）
  const organizations = await prisma.organization.findMany({
    where: {
      tenantId,
    },
    include: {
      _count: {
        select: {
          members: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return organizations.map((org) => ({
    id: org.id,
    name: org.name,
    code: org.code,
    type: org.type,
    memberCount: org._count.members,
    createdAt: org.createdAt,
    isActive: org.isActive,
  }));
}

/**
 * 組織を新規作成（SUPER_ADMIN専用）
 * 
 * @param name 組織名
 * @param code スラッグ（URL用ID）
 * @returns 作成された組織
 */
export async function createOrganization(name: string, code: string) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // SUPER_ADMINのみアクセス可能
  if (session.user.activeOrganizationRole !== "Super Admin") {
    throw new Error("Access denied: SUPER_ADMIN role required");
  }

  const tenantId = session.user.tenantId;

  // バリデーション
  const validationResult = createOrganizationSchema.safeParse({ name, code });
  if (!validationResult.success) {
    throw new Error(validationResult.error.errors[0].message);
  }

  // スラッグの重複チェック
  const existingOrg = await prisma.organization.findFirst({
    where: {
      tenantId,
      code: code.trim(),
    },
  });

  if (existingOrg) {
    throw new Error("このスラッグは既に使用されています");
  }

  // 組織を作成
  const organization = await prisma.organization.create({
    data: {
      tenantId,
      name: name.trim(),
      code: code.trim(),
      type: "DIRECT", // デフォルトタイプ
      isActive: true,
    },
  });

  // UIを更新
  revalidatePath("/dashboard/admin/organizations");

  return {
    id: organization.id,
    name: organization.name,
    code: organization.code,
  };
}
