'use server'

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { generateEmbedding } from "@/lib/ai/embedding"

/**
 * ハイブリッド検索のフィルター条件
 */
export interface HybridSearchFilters {
  // エリアフィルター（住所に含まれる文字列）
  area?: string;
  // 業種フィルター（カテゴリ）
  category?: string;
  // ソースフィルター
  source?: string;
  // 電話番号フィルター
  phone?: string;
  // その他のカスタムフィルター（dataフィールド内の検索）
  customFilters?: {
    [key: string]: string | number | boolean;
  };
}

/**
 * ハイブリッド検索結果
 */
export interface HybridSearchResult {
  id: string;
  companyName: string;
  phone: string | null;
  address: string | null;
  source: string;
  data: any;
  similarity: number;
}

/**
 * ハイブリッド検索: 構造化フィルター + ベクトル検索
 * 
 * この関数は、以下の2段階の検索を実行します：
 * 1. Pre-filtering: filters に基づいて MasterLead のIDリストを絞り込む
 * 2. Vector Search: そのIDリストを使ってpgvectorで類似度検索を行う
 * 
 * これにより、「渋谷区(Filter) の 静かなカフェ(Vector)」という高精度な検索を実現します。
 * 
 * @param query - 自然言語の検索クエリ
 * @param filters - 構造化データによるフィルター条件
 * @param limit - 取得件数（デフォルト: 20）
 * @returns 検索結果のMasterLeadリスト
 */
export async function hybridSearchMasterLeads(
  query: string,
  filters: HybridSearchFilters = {},
  limit: number = 20
) {
  try {
    // セッション確認
    const session = await auth();
    if (!session?.user) {
      throw new Error("認証が必要です");
    }

    if (!query || query.trim().length === 0) {
      // クエリが空の場合は、フィルターのみで検索
      return await searchByFiltersOnly(filters, limit);
    }

    // 1. Pre-filtering: filters に基づいて MasterLead のIDリストを絞り込む
    // PrismaのJSONB検索は複雑なため、SQLで直接検索する
    const filterConditions: string[] = [];
    const filterParams: any[] = [];
    let paramIndex = 1;

    if (filters.area) {
      filterConditions.push(`(address ILIKE $${paramIndex} OR (data->>'address')::text ILIKE $${paramIndex} OR (data->>'住所')::text ILIKE $${paramIndex})`);
      filterParams.push(`%${filters.area}%`);
      paramIndex++;
    }

    if (filters.category) {
      filterConditions.push(`((data->>'category')::text = $${paramIndex} OR (data->>'カテゴリ')::text = $${paramIndex})`);
      filterParams.push(filters.category);
      paramIndex++;
    }

    if (filters.source) {
      filterConditions.push(`source = $${paramIndex}`);
      filterParams.push(filters.source);
      paramIndex++;
    }

    if (filters.phone) {
      filterConditions.push(`(phone ILIKE $${paramIndex} OR (data->>'phone')::text ILIKE $${paramIndex} OR (data->>'電話番号')::text ILIKE $${paramIndex})`);
      filterParams.push(`%${filters.phone}%`);
      paramIndex++;
    }

    // カスタムフィルターの処理
    if (filters.customFilters) {
      for (const [key, value] of Object.entries(filters.customFilters)) {
        filterConditions.push(`(data->>'${key}')::text = $${paramIndex}`);
        filterParams.push(String(value));
        paramIndex++;
      }
    }

    // SQLクエリでフィルタリング
    let filteredIds: string[] = [];
    
    if (filterConditions.length > 0) {
      const whereClause = filterConditions.join(' AND ');
      const filteredLeads = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `SELECT id FROM master_leads WHERE ${whereClause}`,
        ...filterParams
      );
      filteredIds = filteredLeads.map(lead => lead.id);
    } else {
      // フィルターがない場合は、すべてのMasterLeadのIDを取得
      const allLeads = await prisma.masterLead.findMany({
        select: { id: true },
      });
      filteredIds = allLeads.map(lead => lead.id);
    }

    // フィルター結果が空の場合は、空の結果を返す
    if (filteredIds.length === 0) {
      return {
        success: true,
        results: [],
        count: 0,
      };
    }

    // 2. Vector Search: そのIDリストを使ってpgvectorで類似度検索を行う
    const queryVector = await generateEmbedding(query.trim());

    // SQLクエリでベクトル検索を実行
    // filteredIdsが空の場合は空の結果を返す
    if (filteredIds.length === 0) {
      return {
        success: true,
        results: [],
        count: 0,
      };
    }

    // Prismaの$queryRawテンプレートリテラルを使用（既存のai-search.tsと同じ方法）
    const results = await prisma.$queryRaw<Array<{
      id: string;
      companyName: string;
      phone: string | null;
      address: string | null;
      source: string;
      data: any;
      similarity: number;
    }>>`
      SELECT 
        ml.id,
        ml.company_name as "companyName",
        ml.phone,
        ml.address,
        ml.source,
        ml.data,
        1 - (lv.embedding <=> ${queryVector}::vector) as similarity
      FROM master_leads ml
      INNER JOIN lead_vectors lv ON lv."masterLeadId" = ml.id
      WHERE lv."masterLeadId" = ANY(${filteredIds}::text[])
        AND lv.embedding <=> ${queryVector}::vector < 1.0
      ORDER BY lv.embedding <=> ${queryVector}::vector ASC
      LIMIT ${limit}
    `;

    return {
      success: true,
      results: results.map((r: typeof results[0]) => ({
        id: r.id,
        companyName: r.companyName,
        phone: r.phone,
        address: r.address,
        source: r.source,
        data: r.data,
        similarity: r.similarity,
      })),
      count: results.length,
    };

  } catch (error) {
    console.error("Hybrid search error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "検索に失敗しました",
      results: [],
      count: 0,
    };
  }
}

/**
 * フィルターのみで検索（クエリが空の場合）
 */
async function searchByFiltersOnly(
  filters: HybridSearchFilters,
  limit: number
) {
  const filterConditions: string[] = [];
  const filterParams: any[] = [];
  let paramIndex = 1;

  if (filters.area) {
    filterConditions.push(`(address ILIKE $${paramIndex} OR (data->>'address')::text ILIKE $${paramIndex} OR (data->>'住所')::text ILIKE $${paramIndex})`);
    filterParams.push(`%${filters.area}%`);
    paramIndex++;
  }

  if (filters.category) {
    filterConditions.push(`((data->>'category')::text = $${paramIndex} OR (data->>'カテゴリ')::text = $${paramIndex})`);
    filterParams.push(filters.category);
    paramIndex++;
  }

  if (filters.source) {
    filterConditions.push(`source = $${paramIndex}`);
    filterParams.push(filters.source);
    paramIndex++;
  }

  if (filters.phone) {
    filterConditions.push(`(phone ILIKE $${paramIndex} OR (data->>'phone')::text ILIKE $${paramIndex} OR (data->>'電話番号')::text ILIKE $${paramIndex})`);
    filterParams.push(`%${filters.phone}%`);
    paramIndex++;
  }

  // カスタムフィルターの処理
  if (filters.customFilters) {
    for (const [key, value] of Object.entries(filters.customFilters)) {
      filterConditions.push(`(data->>'${key}')::text = $${paramIndex}`);
      filterParams.push(String(value));
      paramIndex++;
    }
  }

  const whereClause = filterConditions.length > 0 
    ? `WHERE ${filterConditions.join(' AND ')}`
    : '';

  const results = await prisma.$queryRawUnsafe<Array<{
    id: string;
    company_name: string;
    phone: string | null;
    address: string | null;
    source: string;
    data: any;
    updated_at: Date;
  }>>(
    `SELECT 
      id,
      company_name,
      phone,
      address,
      source,
      data,
      updated_at
    FROM master_leads
    ${whereClause}
    ORDER BY updated_at DESC
    LIMIT $${paramIndex}`,
    ...filterParams,
    limit
  );

  return {
    success: true,
    results: results.map(lead => ({
      id: lead.id,
      companyName: lead.company_name,
      phone: lead.phone,
      address: lead.address,
      source: lead.source,
      data: lead.data,
      similarity: 1.0, // フィルターのみの場合は類似度を1.0とする
    })),
    count: results.length,
  };
}
