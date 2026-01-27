/**
 * pgvector拡張機能とHNSWインデックスの状態を確認するスクリプト
 */

import { prisma } from "../src/lib/prisma";

async function checkVectorSetup() {
  try {
    console.log("🔍 pgvector拡張機能とHNSWインデックスの状態を確認中...\n");

    // 1. pgvector拡張機能の確認
    console.log("1. pgvector拡張機能の確認:");
    const extensions = await prisma.$queryRaw<Array<{
      extname: string;
      extversion: string;
    }>>`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname = 'vector'
    `;

    if (extensions.length > 0) {
      console.log(`   ✅ pgvector拡張機能が有効化されています (version: ${extensions[0].extversion})`);
    } else {
      console.log("   ❌ pgvector拡張機能が有効化されていません");
      console.log("   💡 以下のコマンドで有効化できます:");
      console.log("      npx prisma db execute --stdin <<< \"CREATE EXTENSION IF NOT EXISTS vector;\"");
    }

    // 2. lead_vectorsテーブルの存在確認
    console.log("\n2. lead_vectorsテーブルの確認:");
    const tables = await prisma.$queryRaw<Array<{
      tablename: string;
    }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'lead_vectors'
    `;

    if (tables.length > 0) {
      console.log("   ✅ lead_vectorsテーブルが存在します");
    } else {
      console.log("   ⚠️  lead_vectorsテーブルが存在しません（まだデータがない可能性があります）");
    }

    // 3. HNSWインデックスの確認
    console.log("\n3. HNSWインデックスの確認:");
    const indexes = await prisma.$queryRaw<Array<{
      indexname: string;
      indexdef: string;
    }>>`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'lead_vectors' 
      AND indexname LIKE '%hnsw%'
    `;

    if (indexes.length > 0) {
      console.log(`   ✅ HNSWインデックスが存在します: ${indexes[0].indexname}`);
      console.log(`   📋 定義: ${indexes[0].indexdef.substring(0, 100)}...`);
    } else {
      console.log("   ❌ HNSWインデックスが存在しません");
      console.log("   💡 以下のコマンドで作成できます:");
      console.log("      npx prisma migrate deploy");
      console.log("      または");
      console.log("      npx prisma db execute --file prisma/migrations/20260126133733_add_hnsw_index/migration.sql");
    }

    // 4. ベクトルデータの件数確認
    console.log("\n4. ベクトルデータの件数:");
    try {
      const count = await prisma.$queryRaw<Array<{
        count: bigint;
      }>>`
        SELECT COUNT(*) as count 
        FROM lead_vectors
      `;
      console.log(`   📊 ベクトルデータ: ${count[0].count}件`);
    } catch (error) {
      console.log("   ⚠️  テーブルが存在しないため、件数を取得できませんでした");
    }

    console.log("\n✨ 確認完了！");
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkVectorSetup();
