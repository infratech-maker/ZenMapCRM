import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getMasterLeadsAsLeads } from "@/lib/actions/master-leads";
import { LeadsPageClient } from "@/components/leads/leads-page-client";

interface LeadsPageProps {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
  }>;
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const query = params.q || undefined;
  const statuses = params.status
    ? params.status.split(",").filter((s) => s.trim().length > 0)
    : undefined;

  try {
    // マスターリードから取得（既存のUIコンポーネントとの互換性のため）
    const { leads, total, page: currentPage, pageSize, totalPages } = await getMasterLeadsAsLeads(
      page,
      20,
      query,
      statuses
    );

    return (
      <LeadsPageClient
        initialLeads={leads}
        initialTotal={total}
        initialPage={currentPage}
        initialPageSize={pageSize}
        initialTotalPages={totalPages}
        initialQuery={query}
        initialStatuses={statuses || []}
      />
    );
  } catch (error) {
    console.error("LeadsPage error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Action Inbox</h1>
        </div>
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm font-semibold text-red-800 mb-2">
            エラーが発生しました
          </p>
          <p className="text-sm text-red-700 mb-2">
            {errorMessage}
          </p>
          {errorStack && (
            <details className="mt-2">
              <summary className="text-xs text-red-600 cursor-pointer">
                詳細を表示
              </summary>
              <pre className="text-xs text-red-600 mt-2 p-2 bg-red-100 rounded overflow-auto max-h-40">
                {errorStack}
              </pre>
            </details>
          )}
          <p className="text-xs text-red-600 mt-2">
            開発サーバーのログも確認してください。
          </p>
        </div>
      </div>
    );
  }
}
