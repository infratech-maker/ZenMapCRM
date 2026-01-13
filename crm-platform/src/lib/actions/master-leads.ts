"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

/**
 * マスターリード一覧を取得
 * 
 * @param page ページ番号（1から開始）
 * @param pageSize 1ページあたりの件数
 * @param query 検索クエリ（会社名、電話番号、住所に対する部分一致検索）
 * @returns マスターリード一覧と総件数
 */
export async function getMasterLeads(
  page: number = 1,
  pageSize: number = 20,
  query?: string
) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const { tenantId } = session.user;

    // ユーザーの主所属組織を取得
    let userOrg;
    try {
      userOrg = await prisma.userOrganization.findFirst({
        where: {
          userId: session.user.id,
          isPrimary: true,
        },
        select: {
          organizationId: true,
        },
      });
    } catch (dbError: any) {
      console.error("Database connection error in getMasterLeads:", dbError);
      // データベース接続エラーの場合、より詳細なエラーメッセージを返す
      if (dbError.message?.includes("Can't reach database server") || 
          dbError.message?.includes("connect ECONNREFUSED")) {
        throw new Error("データベースサーバーに接続できません。PostgreSQLが起動しているか確認してください。");
      }
      throw dbError;
    }

  if (!userOrg) {
    // 組織が設定されていない場合は空の結果を返す
    return {
      masterLeads: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  const skip = (page - 1) * pageSize;

  // where条件を動的に構築
  const whereCondition: any = {};

  // キーワード検索がある場合は、生のSQLを使用してJSONBフィールドを検索
  if (query && query.trim().length > 0) {
    try {
      const searchQuery = query.trim();
      const searchPattern = `%${searchQuery}%`;

      // 生のSQLクエリで検索（$queryRawUnsafeを使用、パラメータ化クエリでSQLインジェクション対策）
      type MasterLeadRow = {
        id: string;
        companyName: string;
        phone: string | null;
        address: string | null;
        source: string;
        data: any;
        createdAt: Date;
        updatedAt: Date;
        leadsCount: number;
      };

      const masterLeadsResult = await prisma.$queryRawUnsafe(
        `SELECT 
          ml.id,
          ml.company_name as "companyName",
          ml.phone,
          ml.address,
          ml.source,
          ml.data,
          ml.created_at as "createdAt",
          ml.updated_at as "updatedAt",
          COUNT(l.id)::int as "leadsCount"
        FROM master_leads ml
        LEFT JOIN leads l ON l."masterLeadId" = ml.id
          AND l."tenantId" = $1::uuid
          AND l."organizationId" = $2::uuid
        WHERE (
          company_name ILIKE $3
          OR phone ILIKE $3
          OR address ILIKE $3
          OR (data->>'name')::text ILIKE $3
          OR (data->>'店舗名')::text ILIKE $3
          OR (data->>'phone')::text ILIKE $3
          OR (data->>'電話番号')::text ILIKE $3
          OR (data->>'address')::text ILIKE $3
          OR (data->>'住所')::text ILIKE $3
        )
        GROUP BY ml.id, ml.company_name, ml.phone, ml.address, ml.source, ml.data, ml.created_at, ml.updated_at
        ORDER BY ml.updated_at DESC
        LIMIT $4 OFFSET $5`,
        tenantId,
        userOrg.organizationId,
        searchPattern,
        pageSize,
        skip
      ) as MasterLeadRow[];

      // 総件数を取得
      const totalResult = await prisma.$queryRawUnsafe(
        `SELECT COUNT(DISTINCT ml.id)::bigint as count
        FROM master_leads ml
        WHERE (
          company_name ILIKE $1
          OR phone ILIKE $1
          OR address ILIKE $1
          OR (data->>'name')::text ILIKE $1
          OR (data->>'店舗名')::text ILIKE $1
          OR (data->>'phone')::text ILIKE $1
          OR (data->>'電話番号')::text ILIKE $1
          OR (data->>'address')::text ILIKE $1
          OR (data->>'住所')::text ILIKE $1
        )`,
        searchPattern
      ) as Array<{ count: bigint }>;

      const total = Number(totalResult[0]?.count || 0);
      const totalPages = Math.ceil(total / pageSize);

      // リード数を取得するために追加クエリ
      const masterLeadsWithCounts = await Promise.all(
        masterLeadsResult.map(async (ml: MasterLeadRow) => {
          const leadsCount = await prisma.lead.count({
            where: {
              masterLeadId: ml.id,
              tenantId,
              organizationId: userOrg.organizationId,
            },
          });

          return {
            id: ml.id,
            companyName: ml.companyName,
            phone: ml.phone,
            address: ml.address,
            source: ml.source,
            data: ml.data,
            createdAt: ml.createdAt,
            updatedAt: ml.updatedAt,
            leadsCount,
          };
        })
      );

      return {
        masterLeads: masterLeadsWithCounts,
        total,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error("Error in getMasterLeads (SQL search):", error);
      // SQLエラーの場合は通常のPrismaクエリにフォールバック
    }
  }

  // 通常のPrismaクエリ（検索なし、またはSQLエラー時）
  const [masterLeads, total] = await Promise.all([
    prisma.masterLead.findMany({
      skip,
      take: pageSize,
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        _count: {
          select: {
            leads: {
              where: {
                tenantId,
                organizationId: userOrg.organizationId,
              },
            },
          },
        },
      },
    }),
    prisma.masterLead.count(),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return {
    masterLeads: masterLeads.map((ml: typeof masterLeads[0]) => ({
      id: ml.id,
      companyName: ml.companyName,
      phone: ml.phone,
      address: ml.address,
      source: ml.source,
      data: ml.data,
      createdAt: ml.createdAt,
      updatedAt: ml.updatedAt,
      leadsCount: ml._count.leads,
    })),
    total,
    page,
    pageSize,
    totalPages,
  };
  } catch (error: any) {
    console.error("Error in getMasterLeads:", error);
    // データベース接続エラーの場合、より詳細なエラーメッセージを返す
    if (error.message?.includes("Can't reach database server") || 
        error.message?.includes("connect ECONNREFUSED")) {
      throw new Error("データベースサーバーに接続できません。PostgreSQLが起動しているか確認してください。");
    }
    throw error;
  }
}

/**
 * マスターリードをLead型の形式に変換（既存のUIコンポーネントとの互換性のため）
 */
export async function getMasterLeadsAsLeads(
  page: number = 1,
  pageSize: number = 20,
  query?: string,
  statuses?: string[]
) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const { tenantId } = session.user;

    // ユーザーの主所属組織を取得
    let userOrg;
    try {
      userOrg = await prisma.userOrganization.findFirst({
        where: {
          userId: session.user.id,
          isPrimary: true,
        },
        select: {
          organizationId: true,
        },
      });
    } catch (dbError: any) {
      console.error("Database connection error in getMasterLeadsAsLeads:", dbError);
      // データベース接続エラーの場合、より詳細なエラーメッセージを返す
      if (dbError.message?.includes("Can't reach database server") || 
          dbError.message?.includes("connect ECONNREFUSED")) {
        throw new Error("データベースサーバーに接続できません。PostgreSQLが起動しているか確認してください。");
      }
      throw dbError;
    }

    if (!userOrg) {
      return {
        leads: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }

    const skip = (page - 1) * pageSize;

    // where条件を動的に構築
    let whereCondition: any = {};

    // キーワード検索がある場合
    if (query && query.trim().length > 0) {
      const searchQuery = query.trim();
      whereCondition = {
        OR: [
          { companyName: { contains: searchQuery, mode: "insensitive" } },
          { phone: { contains: searchQuery, mode: "insensitive" } },
          { address: { contains: searchQuery, mode: "insensitive" } },
        ],
      };
    }

    // マスターリードを取得（紐付いているリードのステータスでフィルタリング）
    const masterLeads = await prisma.masterLead.findMany({
    where: whereCondition,
    skip,
    take: pageSize,
    orderBy: {
      updatedAt: "desc",
    },
    include: {
      leads: {
        where: {
          tenantId,
          organizationId: userOrg.organizationId,
          ...(statuses && statuses.length > 0
            ? { status: { in: statuses } }
            : {}),
        },
        take: 1, // 最新のリード1件を取得（表示用）
        orderBy: {
          updatedAt: "desc",
        },
      },
      _count: {
        select: {
          leads: {
            where: {
              tenantId,
              organizationId: userOrg.organizationId,
              ...(statuses && statuses.length > 0
                ? { status: { in: statuses } }
                : {}),
            },
          },
        },
      },
    },
    });

    // ステータスフィルターがある場合は、該当するリードを持つマスターのみを返す
    const filteredMasterLeads = statuses && statuses.length > 0
      ? masterLeads.filter((ml: typeof masterLeads[0]) => ml._count.leads > 0)
      : masterLeads;

    // 総件数を取得
    const total = await prisma.masterLead.count({
      where: {
        ...whereCondition,
        ...(statuses && statuses.length > 0
          ? {
              leads: {
                some: {
                  tenantId,
                  organizationId: userOrg.organizationId,
                  status: { in: statuses },
                },
              },
            }
          : {}),
      },
    });

    const totalPages = Math.ceil(total / pageSize);

    // Lead型の形式に変換
    const leads = filteredMasterLeads.map((ml: typeof filteredMasterLeads[0]) => {
      // 最新のリードを取得（なければマスターリードのデータを使用）
      const latestLead = ml.leads[0];

      return {
        id: ml.id, // マスターリードのIDを使用
        source: ml.source,
        data: ml.data as any,
        status: latestLead?.status || "new",
        notes: latestLead?.notes || null,
        createdAt: ml.createdAt,
        updatedAt: ml.updatedAt,
        // マスターリード情報を追加
        masterLeadId: ml.id,
        leadsCount: ml._count.leads,
      };
    });

    return {
      leads,
      total,
      page,
      pageSize,
      totalPages,
    };
  } catch (error: any) {
    console.error("Error in getMasterLeadsAsLeads:", error);
    // データベース接続エラーの場合、より詳細なエラーメッセージを返す
    if (error.message?.includes("Can't reach database server") || 
        error.message?.includes("connect ECONNREFUSED")) {
      throw new Error("データベースサーバーに接続できません。PostgreSQLが起動しているか確認してください。");
    }
    throw error;
  }
}

/**
 * マスターリードを全件取得（エクスポート用、ページネーションなし）
 */
export async function getAllMasterLeadsAsLeadsForExport(
  query?: string,
  statuses?: string[]
) {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const { tenantId } = session.user;

    // ユーザーの主所属組織を取得
    let userOrg;
    try {
      userOrg = await prisma.userOrganization.findFirst({
        where: {
          userId: session.user.id,
          isPrimary: true,
        },
        select: {
          organizationId: true,
        },
      });
    } catch (dbError: any) {
      console.error("Database connection error in getAllMasterLeadsAsLeadsForExport:", dbError);
      if (dbError.message?.includes("Can't reach database server") || 
          dbError.message?.includes("connect ECONNREFUSED")) {
        throw new Error("データベースサーバーに接続できません。PostgreSQLが起動しているか確認してください。");
      }
      throw dbError;
    }

    if (!userOrg) {
      return [];
    }

    // where条件を動的に構築
    let whereCondition: any = {};

    // キーワード検索がある場合
    if (query && query.trim().length > 0) {
      const searchQuery = query.trim();
      whereCondition = {
        OR: [
          { companyName: { contains: searchQuery, mode: "insensitive" } },
          { phone: { contains: searchQuery, mode: "insensitive" } },
          { address: { contains: searchQuery, mode: "insensitive" } },
        ],
      };
    }

    // マスターリードを全件取得（ページネーションなし）
    const masterLeads = await prisma.masterLead.findMany({
      where: {
        ...whereCondition,
        ...(statuses && statuses.length > 0
          ? {
              leads: {
                some: {
                  tenantId,
                  organizationId: userOrg.organizationId,
                  status: { in: statuses },
                },
              },
            }
          : {}),
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        leads: {
          where: {
            tenantId,
            organizationId: userOrg.organizationId,
            ...(statuses && statuses.length > 0
              ? { status: { in: statuses } }
              : {}),
          },
          take: 1, // 最新のリード1件を取得
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
    });

    // Lead型の形式に変換
    const leads = masterLeads.map((ml: typeof masterLeads[0]) => {
      const latestLead = ml.leads[0];

      return {
        id: ml.id,
        source: ml.source,
        data: ml.data as any,
        status: latestLead?.status || "new",
        notes: latestLead?.notes || null,
        createdAt: ml.createdAt,
        updatedAt: ml.updatedAt,
        masterLeadId: ml.id,
      };
    });

    return leads;
  } catch (error: any) {
    console.error("Error in getAllMasterLeadsAsLeadsForExport:", error);
    if (error.message?.includes("Can't reach database server") || 
        error.message?.includes("connect ECONNREFUSED")) {
      throw new Error("データベースサーバーに接続できません。PostgreSQLが起動しているか確認してください。");
    }
    throw error;
  }
}

/**
 * マスターリードの詳細を取得（紐付いているリード一覧も含む）
 */
export async function getMasterLeadDetail(masterLeadId: string) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const { tenantId } = session.user;

  // ユーザーの主所属組織を取得
  const userOrg = await prisma.userOrganization.findFirst({
    where: {
      userId: session.user.id,
      isPrimary: true,
    },
    select: {
      organizationId: true,
    },
  });

  if (!userOrg) {
    throw new Error("Organization not found");
  }

  const masterLead = await prisma.masterLead.findUnique({
    where: { id: masterLeadId },
    include: {
      leads: {
        where: {
          tenantId,
          organizationId: userOrg.organizationId,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100, // 最新100件まで
      },
      _count: {
        select: {
          leads: {
            where: {
              tenantId,
              organizationId: userOrg.organizationId,
            },
          },
        },
      },
    },
  });

  if (!masterLead) {
    throw new Error("Master lead not found");
  }

  return {
    ...masterLead,
    leadsCount: masterLead._count.leads,
  };
}

