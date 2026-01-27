"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getCurrentOrgId } from "@/lib/auth/get-current-org";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getJson } from "serpapi";
import OpenAI from "openai";

/**
 * OpenAI Structured Output用のZodスキーマ
 */
const LeadEnrichmentSchema = z.object({
  websiteUrl: z.string().nullable().describe("企業の公式サイトURL"),
  instagramUrl: z.string().nullable().describe("公式Instagram URL"),
  twitterUrl: z.string().nullable().describe("公式X(Twitter) URL"),
  facebookUrl: z.string().nullable().describe("公式Facebook URL"),
  tabelogUrl: z.string().nullable().describe("食べログURL"),
  googleMapsUrl: z.string().nullable().describe("Google Maps URL"),
  summary: z.string().describe("店舗の特徴を20文字以内で要約"),
  confidenceScore: z.number().min(1).max(100).describe("情報の確度(1-100)"),
});

type LeadEnrichment = z.infer<typeof LeadEnrichmentSchema>;

/**
 * URLが有効なHTTP/HTTPS URLか検証する
 */
function isValidUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * HTMLタグを除去し、テキストのみを抽出
 */
function sanitizeText(text: string): string {
  if (!text || typeof text !== "string") return "";
  // HTMLタグを除去
  return text.replace(/<[^>]*>/g, "").trim();
}

/**
 * エラーメッセージをユーザーフレンドリーな形式に変換
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // SerpApi関連のエラー
    if (message.includes("serpapi") || message.includes("serp")) {
      if (message.includes("quota") || message.includes("limit")) {
        return "検索クォータを超過しました。しばらく時間をおいてから再試行してください。";
      }
      if (message.includes("key") || message.includes("api key")) {
        return "検索APIの設定に問題があります。管理者にお問い合わせください。";
      }
      return "検索サービスでエラーが発生しました。しばらく時間をおいてから再試行してください。";
    }
    
    // OpenAI関連のエラー
    if (message.includes("openai") || message.includes("gpt")) {
      if (message.includes("timeout") || message.includes("timed out")) {
        return "AIが応答しませんでした。時間がかかりすぎたため、処理を中断しました。";
      }
      if (message.includes("rate limit") || message.includes("quota")) {
        return "AIサービスの利用制限に達しました。しばらく時間をおいてから再試行してください。";
      }
      if (message.includes("api key") || message.includes("authentication")) {
        return "AIサービスの設定に問題があります。管理者にお問い合わせください。";
      }
      return "AI処理中にエラーが発生しました。しばらく時間をおいてから再試行してください。";
    }
    
    // ネットワークエラー
    if (message.includes("network") || message.includes("fetch") || message.includes("connection")) {
      return "ネットワークエラーが発生しました。インターネット接続を確認してください。";
    }
    
    // その他のエラーはそのまま返す（ただし長すぎる場合は要約）
    return error.message.length > 100 
      ? `${error.message.substring(0, 100)}...`
      : error.message;
  }
  
  return "予期しないエラーが発生しました。しばらく時間をおいてから再試行してください。";
}

/**
 * リード情報をAIで強化する
 * 
 * @param leadId リードID
 * @param force 強制更新フラグ（24時間制限を無視する）
 * @returns 強化結果
 */
export async function enrichLeadWithIntelligence(
  leadId: string,
  force: boolean = false
) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const { tenantId } = session.user;
  const currentOrgId = await getCurrentOrgId();

  // リードを取得（まずIDで検索、見つからない場合はマスターリードIDとして検索）
  let lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      tenantId,
      organizationId: currentOrgId,
    },
  });

  // Leadレコードが見つからない場合、マスターリードIDとして検索
  if (!lead) {
    const masterLead = await prisma.masterLead.findUnique({
      where: { id: leadId },
      include: {
        leads: {
          where: {
            tenantId,
            organizationId: currentOrgId,
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!masterLead || !masterLead.leads[0]) {
      throw new Error("Lead not found");
    }

    lead = masterLead.leads[0];
  }

  // ============================================
  // 1. コスト制御と冪等性チェック
  // ============================================
  if (!force && lead.lastEnrichedAt) {
    const lastEnriched = new Date(lead.lastEnrichedAt);
    const now = new Date();
    const hoursSinceLastEnrich = (now.getTime() - lastEnriched.getTime()) / (1000 * 60 * 60);
    
    // 24時間以内の場合は既存データを返す
    if (hoursSinceLastEnrich < 24) {
      const data = lead.data as Record<string, any>;
      const existingEnrichment: LeadEnrichment = {
        websiteUrl: data.websiteUrl || null,
        instagramUrl: data.instagramUrl || null,
        twitterUrl: data.twitterUrl || null,
        facebookUrl: data.facebookUrl || null,
        tabelogUrl: data.tabelogUrl || null,
        googleMapsUrl: data.googleMapsUrl || null,
        summary: data.aiSummary || "",
        confidenceScore: data.confidenceScore || 0,
      };
      
      return {
        success: true,
        enrichment: existingEnrichment,
        message: "24時間以内に取得済みのデータです。強制更新する場合は、再度お試しください。",
        cached: true,
      };
    }
  }

  const data = lead.data as Record<string, any>;
  const storeName = data.name || data.store_name || data.店舗名 || "";
  const address = data.address || data.詳細住所 || data.住所 || "";

  if (!storeName) {
    throw new Error("店舗名が取得できませんでした");
  }

  try {
    // ============================================
    // 2. SerpApiで検索
    // ============================================
    const serpApiKey = process.env.SERPAPI_API_KEY;
    if (!serpApiKey) {
      throw new Error("SERPAPI_API_KEY環境変数が設定されていません");
    }

    const searchQuery = `${storeName} ${address}`.trim();
    
    let serpResults;
    try {
      serpResults = await getJson({
        engine: "google",
        q: searchQuery,
        api_key: serpApiKey,
        hl: "ja",
        gl: "jp",
      });
    } catch (serpError) {
      const errorMessage = getErrorMessage(serpError);
      throw new Error(`検索エラー: ${errorMessage}`);
    }

    // 検索結果をテキスト化
    const organicResults = (serpResults.organic_results || []).slice(0, 5);
    const knowledgeGraph = serpResults.knowledge_graph || {};
    
    const searchResultsText = [
      "=== 検索結果（上位5件） ===",
      ...organicResults.map((result: any, index: number) => 
        `${index + 1}. ${result.title || ""}\n   URL: ${result.link || ""}\n   Snippet: ${result.snippet || ""}`
      ),
      "\n=== ナレッジグラフ ===",
      knowledgeGraph.title ? `タイトル: ${knowledgeGraph.title}` : "",
      knowledgeGraph.description ? `説明: ${knowledgeGraph.description}` : "",
      knowledgeGraph.website ? `ウェブサイト: ${knowledgeGraph.website}` : "",
      knowledgeGraph.social_links ? `SNSリンク: ${JSON.stringify(knowledgeGraph.social_links)}` : "",
    ].filter(Boolean).join("\n\n");

    // ============================================
    // 3. OpenAIで構造化データを抽出
    // ============================================
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY環境変数が設定されていません");
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey,
      timeout: 30000, // 30秒のタイムアウト
    });

    const prompt = `あなたはデータ調査のプロです。以下の検索結果から、この店舗の公式情報を抽出してください。個人のブログやまとめサイトは除外してください。

店舗名: ${storeName}
住所: ${address}

検索結果:
${searchResultsText}

以下の情報を抽出してください:
- 公式サイトURL（HP）
- 公式Instagram URL
- 公式X(Twitter) URL
- 公式Facebook URL
- 食べログURL
- Google Maps URL
- 店舗の特徴を20文字以内で要約
- 情報の確度(1-100)

URLが見つからない場合はnullを返してください。`;

    let completion;
    try {
      completion = await openai.beta.chat.completions.parse({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "あなたはデータ調査のプロです。検索結果から正確な情報を抽出してください。",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "lead_enrichment",
            description: "リード情報の強化データ",
            schema: {
              type: "object",
              properties: {
                websiteUrl: {
                  type: ["string", "null"],
                  description: "企業の公式サイトURL",
                },
                instagramUrl: {
                  type: ["string", "null"],
                  description: "公式Instagram URL",
                },
                twitterUrl: {
                  type: ["string", "null"],
                  description: "公式X(Twitter) URL",
                },
                facebookUrl: {
                  type: ["string", "null"],
                  description: "公式Facebook URL",
                },
                tabelogUrl: {
                  type: ["string", "null"],
                  description: "食べログURL",
                },
                googleMapsUrl: {
                  type: ["string", "null"],
                  description: "Google Maps URL",
                },
                summary: {
                  type: "string",
                  description: "店舗の特徴を20文字以内で要約",
                },
                confidenceScore: {
                  type: "number",
                  description: "情報の確度(1-100)",
                  minimum: 1,
                  maximum: 100,
                },
              },
              required: ["websiteUrl", "instagramUrl", "twitterUrl", "facebookUrl", "tabelogUrl", "googleMapsUrl", "summary", "confidenceScore"],
              additionalProperties: false,
            },
          },
        },
        temperature: 0.3,
      });
    } catch (openaiError) {
      const errorMessage = getErrorMessage(openaiError);
      throw new Error(`AI処理エラー: ${errorMessage}`);
    }

    const parsedContent = completion.choices[0]?.message?.parsed;
    if (!parsedContent) {
      throw new Error("AIのレスポンスをパースできませんでした");
    }

    // Zodでバリデーション
    let enrichment: LeadEnrichment;
    try {
      enrichment = LeadEnrichmentSchema.parse(parsedContent);
    } catch (validationError) {
      throw new Error("AIが返したデータの形式が正しくありません");
    }

    // ============================================
    // 4. セキュリティ: URL検証とサニタイズ
    // ============================================
    // URLが有効なHTTP/HTTPS URLか検証
    const validatedEnrichment: LeadEnrichment = {
      websiteUrl: enrichment.websiteUrl && isValidUrl(enrichment.websiteUrl) 
        ? enrichment.websiteUrl 
        : null,
      instagramUrl: enrichment.instagramUrl && isValidUrl(enrichment.instagramUrl)
        ? enrichment.instagramUrl
        : null,
      twitterUrl: enrichment.twitterUrl && isValidUrl(enrichment.twitterUrl)
        ? enrichment.twitterUrl
        : null,
      facebookUrl: enrichment.facebookUrl && isValidUrl(enrichment.facebookUrl)
        ? enrichment.facebookUrl
        : null,
      tabelogUrl: enrichment.tabelogUrl && isValidUrl(enrichment.tabelogUrl)
        ? enrichment.tabelogUrl
        : null,
      googleMapsUrl: enrichment.googleMapsUrl && isValidUrl(enrichment.googleMapsUrl)
        ? enrichment.googleMapsUrl
        : null,
      summary: sanitizeText(enrichment.summary), // HTMLタグを除去
      confidenceScore: enrichment.confidenceScore,
    };

    // ============================================
    // 5. データを更新
    // ============================================
    const currentData = data || {};
    const updatedData = {
      ...currentData,
      website: validatedEnrichment.websiteUrl || currentData.website || currentData.websiteUrl,
      websiteUrl: validatedEnrichment.websiteUrl || currentData.websiteUrl,
      instagramUrl: validatedEnrichment.instagramUrl || currentData.instagramUrl,
      twitterUrl: validatedEnrichment.twitterUrl || currentData.twitterUrl,
      facebookUrl: validatedEnrichment.facebookUrl || currentData.facebookUrl,
      tabelogUrl: validatedEnrichment.tabelogUrl || currentData.tabelogUrl,
      googleMapsUrl: validatedEnrichment.googleMapsUrl || currentData.googleMapsUrl,
      aiSummary: validatedEnrichment.summary || currentData.aiSummary,
      confidenceScore: validatedEnrichment.confidenceScore || currentData.confidenceScore,
    };

    const now = new Date();

    // 実際のLeadレコードのIDを使用
    const actualLeadId = lead.id;

    await prisma.lead.update({
      where: { id: actualLeadId },
      data: {
        data: updatedData,
        enrichStatus: "COMPLETED",
        enrichedAt: now,
        lastEnrichedAt: now,
        updatedBy: session.user.id,
      },
    });

    // パスを再検証
    revalidatePath("/dashboard/leads");

    return {
      success: true,
      enrichment: validatedEnrichment,
      message: "リード情報を強化しました",
      cached: false,
    };
  } catch (error) {
    console.error("enrichLeadWithIntelligence error:", error);

    // エラー時はステータスを更新（leadが取得できている場合のみ）
    if (lead) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          enrichStatus: "FAILED",
          updatedBy: session.user.id,
        },
      }).catch((updateError) => {
        console.error("Failed to update enrichStatus:", updateError);
      });
    }

    // ユーザーフレンドリーなエラーメッセージを返す
    const errorMessage = getErrorMessage(error);
    throw new Error(errorMessage);
  }
}
