import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Apify Webhook Handler
 * Apifyから送信されるWebhookリクエストを受け取り、データを処理する
 */
export async function POST(request: NextRequest) {
  try {
    // シークレットの検証
    const searchParams = request.nextUrl.searchParams;
    const secret = searchParams.get("secret");
    
    if (secret !== process.env.APIFY_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Invalid secret" },
        { status: 401 }
      );
    }

    // リクエストボディの取得
    const body = await request.json();
    
    // データの処理（必要に応じて実装）
    console.log("Apify webhook received:", body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Apify webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
