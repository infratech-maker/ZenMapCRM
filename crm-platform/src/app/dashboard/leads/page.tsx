import { getLeads } from "@/features/scraper/leads-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadsTable } from "@/features/scraper/leads-table";
import { CSVExportButton } from "@/components/csv-export-button";

export const dynamic = 'force-dynamic';

export default async function LeadsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // ★重要: Next.js 15では searchParams が Promise なので await が必要
  const searchParams = await props.searchParams;
  
  const page = parseInt((searchParams.page as string) || "1", 10);
  const validPage = page > 0 ? page : 1;

  const result = await getLeads({
    page: validPage,
    status: searchParams.status as string | undefined,
    city: searchParams.city as string | undefined,
    category: searchParams.category as string | undefined,
    search: searchParams.search as string | undefined,
    sortBy: searchParams.sortBy as "updatedAt" | "createdAt" | "status" | undefined,
    sortOrder: searchParams.sortOrder as "asc" | "desc" | undefined,
  });

  // Dateオブジェクトを文字列に変換（シリアライゼーション対応）
  const serializedLeads = result.leads.map((lead) => ({
    ...lead,
    createdAt: lead.createdAt ? lead.createdAt.toISOString() : null,
    updatedAt: lead.updatedAt ? lead.updatedAt.toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads (CRM)</h1>
          <p className="mt-2 text-sm text-gray-600">
            スクレイピングで取得したリード情報を管理します
          </p>
        </div>
        <CSVExportButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>リード一覧</CardTitle>
          <CardDescription>
            {result.leads.length}件のリードを表示中（総件数: {result.totalCount}件）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LeadsTable 
            initialLeads={serializedLeads} 
            totalCount={result.totalCount}
            page={result.page}
            totalPages={result.totalPages}
          />
        </CardContent>
      </Card>
    </div>
  );
}
