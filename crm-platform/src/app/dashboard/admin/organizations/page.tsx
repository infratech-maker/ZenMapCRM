import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAllOrganizations } from "@/lib/actions/organizations";
import { OrganizationsPageClient } from "@/components/admin/organizations-page-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminOrganizationsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // SUPER_ADMINのみアクセス可能
  if (session.user.activeOrganizationRole !== "Super Admin") {
    redirect("/dashboard");
  }

  // 組織一覧を取得
  let organizations: Awaited<ReturnType<typeof getAllOrganizations>> = [];
  try {
    organizations = await getAllOrganizations();
  } catch (error) {
    console.error("Failed to fetch organizations:", error);
    // エラーが発生した場合は空配列を返す
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Organizations (組織管理)
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            システム全体の組織を管理します（SUPER_ADMIN専用）
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>組織一覧</CardTitle>
              <CardDescription>
                登録済みの全組織を表示します
              </CardDescription>
            </div>
            <OrganizationsPageClient initialOrganizations={organizations} />
          </div>
        </CardHeader>
        <CardContent>
          <OrganizationsTable organizations={organizations} />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 組織一覧テーブルコンポーネント
 */
function OrganizationsTable({
  organizations,
}: {
  organizations: Awaited<ReturnType<typeof getAllOrganizations>>;
}) {
  if (organizations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        組織が登録されていません
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
              組織名
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
              スラッグ (ID)
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
              タイプ
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
              メンバー数
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
              作成日
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
              ステータス
            </th>
          </tr>
        </thead>
        <tbody>
          {organizations.map((org) => (
            <tr key={org.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-900">{org.name}</td>
              <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                {org.code || "-"}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{org.type}</td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {org.memberCount}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {new Date(org.createdAt).toLocaleDateString("ja-JP")}
              </td>
              <td className="px-4 py-3 text-sm">
                {org.isActive ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    有効
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    無効
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
