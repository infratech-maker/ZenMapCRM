/**
 * Staging環境のMaster Leadsマイグレーションスクリプト
 * 
 * 実行方法:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/migrate-staging-master-leads.ts
 * 
 * 機能:
 * 1. 基本的なシードデータ（テナント、ユーザー、権限）の投入
 * 2. 既存のleadsデータからMasterLeadを生成（存在する場合）
 * 3. LeadとMasterLeadの紐付け
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * 組織階層のClosure Tableを構築する関数
 */
async function buildOrganizationClosure(
  tenantId: string,
  organizationId: string,
  parentId: string | null = null
) {
  // 自己参照を追加（depth = 0）
  await prisma.organizationClosure.upsert({
    where: {
      ancestorId_descendantId: {
        ancestorId: organizationId,
        descendantId: organizationId,
      },
    },
    update: {},
    create: {
      tenantId,
      ancestorId: organizationId,
      descendantId: organizationId,
      depth: 0,
    },
  });

  // 親組織がある場合、親のすべての祖先との関係を追加
  if (parentId) {
    const parentAncestors = await prisma.organizationClosure.findMany({
      where: {
        tenantId,
        descendantId: parentId,
      },
    });

    for (const ancestor of parentAncestors) {
      await prisma.organizationClosure.upsert({
        where: {
          ancestorId_descendantId: {
            ancestorId: ancestor.ancestorId,
            descendantId: organizationId,
          },
        },
        update: {},
        create: {
          tenantId,
          ancestorId: ancestor.ancestorId,
          descendantId: organizationId,
          depth: ancestor.depth + 1,
        },
      });
    }
  }
}

/**
 * 基本的なシードデータの投入
 */
async function seedBasicData() {
  console.log('🌱 基本的なシードデータを投入します...');

  // 1. テナントの作成
  console.log('📦 テナントを作成中...');
  const zenmaoTenant = await prisma.tenant.upsert({
    where: { slug: 'zenmao' },
    update: {},
    create: {
      name: 'ZenMao Inc.',
      slug: 'zenmao',
      isActive: true,
    },
  });

  console.log('✅ テナントを作成しました');

  // 2. ユーザーの作成（既存の場合はスキップ）
  console.log('👤 ユーザーを作成中...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const masterUser = await prisma.user.upsert({
    where: { email: 'admin@zenmao.com' },
    update: {},
    create: {
      email: 'admin@zenmao.com',
      name: 'Master Admin',
      password: hashedPassword,
      tenantId: zenmaoTenant.id,
    },
  });

  console.log('✅ ユーザーを作成しました');

  // 3. 権限とロールの作成（簡易版）
  console.log('🔐 権限とロールを作成中...');
  
  // 基本的な権限を作成
  const permissions = [
    { name: 'leads.read', description: 'リード閲覧' },
    { name: 'leads.write', description: 'リード作成・編集' },
    { name: 'master-leads.read', description: 'マスターリード閲覧' },
    { name: 'master-leads.write', description: 'マスターリード作成・編集' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: {
        name_tenantId: {
          name: perm.name,
          tenantId: zenmaoTenant.id,
        },
      },
      update: {},
      create: {
        name: perm.name,
        description: perm.description,
        tenantId: zenmaoTenant.id,
        isSystemPermission: false,
      },
    });
  }

  // Super Adminロールを作成
  const superAdminRole = await prisma.role.upsert({
    where: {
      name_tenantId: {
        name: 'Super Admin',
        tenantId: zenmaoTenant.id,
      },
    },
    update: {},
    create: {
      name: 'Super Admin',
      description: 'システム管理者',
      tenantId: zenmaoTenant.id,
      isSystemRole: true,
      isActive: true,
    },
  });

  // すべての権限をSuper Adminロールに割り当て
  const allPermissions = await prisma.permission.findMany({
    where: { tenantId: zenmaoTenant.id },
  });

  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: perm.id,
        tenantId: zenmaoTenant.id,
      },
    });
  }

  // 4. 組織の作成
  console.log('🏢 組織を作成中...');
  const mainOrg = await prisma.organization.upsert({
    where: {
      code_tenantId: {
        code: 'zenmao-main',
        tenantId: zenmaoTenant.id,
      },
    },
    update: {},
    create: {
      name: 'ZenMao Main',
      code: 'zenmao-main',
      type: 'COMPANY',
      tenantId: zenmaoTenant.id,
      isActive: true,
    },
  });

  // Closure Tableを構築
  await buildOrganizationClosure(zenmaoTenant.id, mainOrg.id, null);

  // 5. ユーザーを組織に追加
  await prisma.organizationMember.upsert({
    where: {
      userId_organizationId: {
        userId: masterUser.id,
        organizationId: mainOrg.id,
      },
    },
    update: {},
    create: {
      userId: masterUser.id,
      organizationId: mainOrg.id,
      roleId: superAdminRole.id,
      tenantId: zenmaoTenant.id,
      isPrimary: true,
    },
  });

  console.log('✅ 基本的なシードデータの投入が完了しました');
}

/**
 * 既存のleadsデータからMasterLeadを生成
 */
async function migrateLeadsToMaster() {
  console.log('\n🚀 Master Leadsマイグレーションを開始します...');
  const startTime = Date.now();

  try {
    // まだマスタに紐付いていないリードを取得
    const totalLeads = await prisma.lead.count({
      where: { masterLeadId: null },
    });

    console.log(`📋 対象リード数: ${totalLeads}件`);

    if (totalLeads === 0) {
      console.log('✅ 移行対象のリードがありません。移行は完了しています。');
      return;
    }

    const BATCH_SIZE = 1000;
    let processed = 0;
    let created = 0;
    let linked = 0;
    let errors = 0;
    let skip = 0;

    while (true) {
      const leads = await prisma.lead.findMany({
        where: { masterLeadId: null },
        orderBy: { createdAt: 'asc' },
        take: BATCH_SIZE,
        skip: skip,
      });

      if (leads.length === 0) {
        break;
      }

      for (const lead of leads) {
        try {
          const data = lead.data as Record<string, any>;
          const phone = data['phone'] || data['電話番号'] || null;
          const name = data['name'] || data['店舗名'] || '名称不明';
          const address = data['address'] || data['住所'] || null;

          // 電話番号の正規化
          const normalizedPhone = phone
            ? phone.toString().trim().replace(/\s+/g, '').replace(/[ー－]/g, '-')
            : null;

          // MasterLeadを作成または取得
          let masterLead;

          if (normalizedPhone && normalizedPhone !== '') {
            masterLead = await prisma.masterLead.findFirst({
              where: { phone: normalizedPhone },
            });
          }

          if (!masterLead) {
            masterLead = await prisma.masterLead.create({
              data: {
                companyName: name,
                phone: normalizedPhone,
                address: address,
                source: lead.source,
                data: lead.data || {},
              },
            });
            created++;
          }

          // Leadに紐付け
          await prisma.lead.update({
            where: { id: lead.id },
            data: {
              masterLeadId: masterLead.id,
            },
          });

          linked++;
          processed++;

          if (processed % 100 === 0) {
            const progress = Math.round((processed / totalLeads) * 100);
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            console.log(
              `✅ ${processed}/${totalLeads}件 処理完了 (${progress}%) | 作成: ${created}, 紐付け: ${linked}, エラー: ${errors} | 経過: ${Math.floor(elapsed / 60)}分${elapsed % 60}秒`
            );
          }
        } catch (error) {
          errors++;
          console.error(`❌ リードID ${lead.id} の処理中にエラー:`, error);
        }
      }

      skip += leads.length;

      if (leads.length < BATCH_SIZE) {
        break;
      }
    }

    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(totalTime / 60);
    const seconds = totalTime % 60;

    console.log('\n🎉 Master Leadsマイグレーションが完了しました！');
    console.log(`   総処理件数: ${processed}件`);
    console.log(`   新規作成: ${created}件`);
    console.log(`   紐付け: ${linked}件`);
    console.log(`   エラー: ${errors}件`);
    console.log(`   総処理時間: ${minutes}分${seconds}秒`);

    // 統計情報を表示
    const masterLeadCount = await prisma.masterLead.count();
    const linkedLeadCount = await prisma.lead.count({
      where: { masterLeadId: { not: null } },
    });
    const unlinkedLeadCount = await prisma.lead.count({
      where: { masterLeadId: null },
    });

    console.log('\n📊 移行後の統計:');
    console.log(`   MasterLead数: ${masterLeadCount}件`);
    console.log(`   紐付け済みLead: ${linkedLeadCount}件`);
    console.log(`   未紐付けLead: ${unlinkedLeadCount}件`);
  } catch (error) {
    console.error('❌ マイグレーション中にエラーが発生しました:', error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Staging環境のMaster Leadsマイグレーションを開始します...\n');

  try {
    // 1. 基本的なシードデータの投入
    await seedBasicData();

    // 2. 既存のleadsデータからMasterLeadを生成
    await migrateLeadsToMaster();

    console.log('\n✨ すべてのマイグレーションが完了しました！');
  } catch (error) {
    console.error('❌ マイグレーション中にエラーが発生しました:', error);
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
