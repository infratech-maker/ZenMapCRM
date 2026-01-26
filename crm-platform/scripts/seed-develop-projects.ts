/**
 * Develop環境のプロジェクトとリードデータをシードするスクリプト
 * 
 * 実行方法:
 *   npx tsx scripts/seed-develop-projects.ts
 * 
 * 機能:
 * 1. 既存のMasterLeadからサンプルプロジェクトを作成
 * 2. リードデータをプロジェクトに紐付け
 * 3. 組織IDを設定して、dashboard/projectsで表示可能にする
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Develop環境のプロジェクトとリードデータをシードします...\n');

  try {
    // 1. テナントと組織を取得
    // データベースの実際のカラム名に合わせてクエリを調整
    const tenant = await prisma.$queryRaw<Array<{ id: string; name: string; slug: string }>>`
      SELECT id, name, slug FROM tenants WHERE slug = 'zenmao' LIMIT 1
    `.then(rows => rows[0] ? { id: rows[0].id, name: rows[0].name, slug: rows[0].slug } : null);

    if (!tenant) {
      console.error('❌ テナントが見つかりません。先にシードデータを投入してください。');
      console.log('   実行: npx prisma db seed');
      process.exit(1);
    }

    // 組織を取得（生SQLで取得）
    // データベースの実際のカラム名を確認するため、まずテーブル構造を確認
    const orgColumns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'organizations' 
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Organizationsテーブルのカラム:', orgColumns.map(c => c.column_name).join(', '));
    
    // tenant_idカラムが存在するか確認
    const hasTenantId = orgColumns.some(c => c.column_name === 'tenant_id');
    
    let organization;
    if (hasTenantId) {
      organization = await prisma.$queryRaw<Array<{ id: string; name: string; tenantId: string }>>`
        SELECT id, name, tenant_id as "tenantId" FROM organizations 
        WHERE tenant_id = ${tenant.id} AND type = 'COMPANY' 
        LIMIT 1
      `.then(rows => rows[0] ? { id: rows[0].id, name: rows[0].name, tenantId: rows[0].tenantId } : null);
    } else {
      // tenant_idがない場合は、最初の組織を取得
      organization = await prisma.$queryRaw<Array<{ id: string; name: string }>>`
        SELECT id, name FROM organizations 
        WHERE type = 'COMPANY' 
        LIMIT 1
      `.then(rows => rows[0] ? { id: rows[0].id, name: rows[0].name, tenantId: tenant.id } : null);
    }

    if (!organization) {
      console.error('❌ 組織が見つかりません。先にシードデータを投入してください。');
      console.log('   実行: npx prisma db seed');
      process.exit(1);
    }

    console.log(`✅ テナント: ${tenant.name} (${tenant.id})`);
    console.log(`✅ 組織: ${organization.name} (${organization.id})\n`);

    // 2. MasterLeadを取得（最大50件）
    const masterLeads = await prisma.masterLead.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    if (masterLeads.length === 0) {
      console.log('⚠️  MasterLeadデータがありません。');
      console.log('   先にリードデータをインポートしてください。');
      console.log('   実行: npm run db:import:leads <ファイルパス>');
      process.exit(0);
    }

    console.log(`📋 取得したMasterLead数: ${masterLeads.length}件\n`);

    // 3. プロジェクトを作成
    const projectName = `サンプルプロジェクト - ${new Date().toLocaleDateString('ja-JP')}`;
    
    const project = await prisma.project.upsert({
      where: {
        id: `sample-project-${tenant.id}`,
      },
      update: {
        name: projectName,
        description: 'Develop環境用のサンプルプロジェクト',
      },
      create: {
        id: `sample-project-${tenant.id}`,
        name: projectName,
        description: 'Develop環境用のサンプルプロジェクト',
        tenantId: tenant.id,
      },
    });

    console.log(`✅ プロジェクトを作成: ${project.name} (${project.id})\n`);

    // 4. リードを作成してプロジェクトに紐付け
    let created = 0;
    let linked = 0;
    let errors = 0;

    for (const masterLead of masterLeads) {
      try {
        // 既存のリードを確認
        const existingLead = await prisma.lead.findFirst({
          where: {
            tenantId: tenant.id,
            organizationId: organization.id,
            masterLeadId: masterLead.id,
          },
        });

        if (existingLead) {
          // 既存のリードをプロジェクトに紐付け
          await prisma.lead.update({
            where: { id: existingLead.id },
            data: {
              projectId: project.id,
            },
          });
          linked++;
        } else {
          // 新しいリードを作成
          const leadData = masterLead.data as Record<string, any>;
          
          await prisma.lead.create({
            data: {
              tenantId: tenant.id,
              organizationId: organization.id,
              projectId: project.id,
              masterLeadId: masterLead.id,
              source: masterLead.source,
              data: masterLead.data,
              status: 'new',
            },
          });
          created++;
        }
      } catch (error) {
        errors++;
        console.error(`❌ リード作成エラー (MasterLead ID: ${masterLead.id}):`, error);
      }
    }

    console.log('\n📊 処理結果:');
    console.log(`   新規作成: ${created}件`);
    console.log(`   既存リードの紐付け: ${linked}件`);
    console.log(`   エラー: ${errors}件`);
    console.log(`   合計: ${created + linked}件のリードがプロジェクトに紐付けられました\n`);

    // 5. プロジェクトのリード数を確認
    const projectWithLeads = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        _count: {
          select: { leads: true },
        },
      },
    });

    console.log(`✅ プロジェクト「${project.name}」に ${projectWithLeads?._count.leads || 0}件のリードが紐付けられました\n`);

    console.log('✨ シードが完了しました！');
    console.log(`\n📋 次のステップ:`);
    console.log(`   1. http://localhost:5000/dashboard/projects にアクセス`);
    console.log(`   2. プロジェクト「${project.name}」が表示されることを確認`);
    console.log(`   3. プロジェクトを開いて、リード一覧が表示されることを確認\n`);

  } catch (error) {
    console.error('❌ シード中にエラーが発生しました:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
