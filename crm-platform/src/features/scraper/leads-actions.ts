"use server";

import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { withTenant } from "@/lib/db/tenant-helper";
import { desc, asc, eq, like, sql, and, or } from "drizzle-orm";

const ITEMS_PER_PAGE = 50;

export type GetLeadsParams = {
  page?: number;
  status?: string;
  city?: string;
  category?: string;
  search?: string;
  sortBy?: "updatedAt" | "createdAt" | "status";
  sortOrder?: "asc" | "desc";
};

/**
 * リード一覧を取得（ページネーション対応）
 * 
 * @param params ページネーションとフィルタリングパラメータ
 * @returns リードの一覧と総件数
 */
export async function getLeads(params: GetLeadsParams = {}) {
  return await withTenant(async (tenantId) => {
    const page = params.page || 1;
    const offset = (page - 1) * ITEMS_PER_PAGE;

    // フィルター条件を構築
    const conditions = [];

    if (params.status) {
      conditions.push(eq(leads.status, params.status));
    }

    if (params.search) {
      // JSONB内のnameフィールドを検索
      conditions.push(
        sql`${leads.data}->>'name' ILIKE ${`%${params.search}%`}`
      );
    }

    // ソート設定
    const sortColumn = params.sortBy === "createdAt" 
      ? leads.createdAt 
      : params.sortBy === "status"
      ? leads.status
      : leads.updatedAt;
    
    const sortOrder = params.sortOrder === "asc" ? asc : desc;

    // クエリ実行
    const leadsList = await db
      .select({
        id: leads.id,
        source: leads.source,
        data: leads.data,
        status: leads.status,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
      })
      .from(leads)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sortOrder(sortColumn))
      .limit(ITEMS_PER_PAGE)
      .offset(offset);

    // 総件数を取得
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const totalCount = Number(countResult[0]?.count || 0);

    return {
      leads: leadsList,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE),
    };
  });
}

/**
 * リードの総件数を取得
 * 
 * @returns リードの総件数
 */
export async function getLeadsCount() {
  return await withTenant(async (tenantId) => {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads);
    
    return Number(result[0]?.count || 0);
  });
}

/**
 * CSVエクスポート用の全リードデータを取得
 * 
 * @returns 全リードデータ
 */
export async function getAllLeadsForExport() {
  return await withTenant(async (tenantId) => {
    const leadsList = await db
      .select({
        id: leads.id,
        source: leads.source,
        data: leads.data,
        status: leads.status,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
      })
      .from(leads)
      .orderBy(desc(leads.updatedAt));

    return leadsList;
  });
}

/**
 * 統計情報を取得
 * 
 * @returns 統計情報（総店舗数、電話番号取得率、ウェブサイト取得率など）
 */
export async function getLeadsStatistics() {
  return await withTenant(async (tenantId) => {
    // 総件数
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads);
    const totalCount = Number(totalCountResult[0]?.count || 0);

    if (totalCount === 0) {
      return {
        totalStores: 0,
        phoneAcquisitionRate: 0,
        websiteAcquisitionRate: 0,
        cityCount: 0,
        completedStores: 0,
      };
    }

    // 電話番号ありの件数
    const phoneCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(sql`${leads.data}->>'phone' IS NOT NULL AND ${leads.data}->>'phone' != ''`);
    const phoneCount = Number(phoneCountResult[0]?.count || 0);

    // ウェブサイトありの件数（URLフィールドから判定）
    const websiteCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(
        sql`(
          ${leads.data}->>'url' IS NOT NULL AND ${leads.data}->>'url' != '' OR
          ${leads.data}->>'website' IS NOT NULL AND ${leads.data}->>'website' != ''
        )`
      );
    const websiteCount = Number(websiteCountResult[0]?.count || 0);

    // 都市数の取得（data->>'city'からユニークな都市数をカウント）
    const cityCountResult = await db
      .select({ 
        count: sql<number>`count(DISTINCT ${leads.data}->>'city')` 
      })
      .from(leads)
      .where(sql`${leads.data}->>'city' IS NOT NULL AND ${leads.data}->>'city' != ''`);
    const cityCount = Number(cityCountResult[0]?.count || 0);

    // 補完完了店舗数（電話番号、営業時間、予算がすべて揃っている）
    const completedCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(
        sql`(
          ${leads.data}->>'phone' IS NOT NULL AND ${leads.data}->>'phone' != '' AND
          ${leads.data}->>'business_hours' IS NOT NULL AND ${leads.data}->>'business_hours' != '' AND
          ${leads.data}->>'address' IS NOT NULL AND ${leads.data}->>'address' != ''
        )`
      );
    const completedCount = Number(completedCountResult[0]?.count || 0);

    return {
      totalStores: totalCount,
      phoneAcquisitionRate: totalCount > 0 ? Math.round((phoneCount / totalCount) * 100 * 100) / 100 : 0,
      websiteAcquisitionRate: totalCount > 0 ? Math.round((websiteCount / totalCount) * 100 * 100) / 100 : 0,
      cityCount: cityCount,
      completedStores: completedCount,
    };
  });
}

