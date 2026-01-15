import NextAuth, { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * NextAuth.js設定
 * 
 * 機能:
 * - Credentials Provider（Email/Password）による認証
 * - セッション情報の拡張（tenantId, organizationId, role, permissions）
 */
export const authConfig: NextAuthConfig = {
  trustHost: true, // Railwayなどのクラウド環境で必要
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        // ユーザーを検索（テナントIDは後で取得するため、まずはemailで検索）
        // 注意: tenantId_emailは複合UNIQUEなので、全テナントから検索する必要がある
        const user = await prisma.user.findFirst({
          where: {
            email: credentials.email as string,
          },
          include: {
            tenant: true,
            // 新規: OrganizationMemberから組織とロールを取得
            organizationMembers: {
              where: {
                OR: [
                  { expiresAt: null },
                  { expiresAt: { gt: new Date() } },
                ],
              },
              include: {
                organization: true,
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
              orderBy: [
                { isPrimary: "desc" }, // 主所属を優先
                { createdAt: "asc" }, // 作成日時順
              ],
            },
            // 後方互換性: 既存のUserOrganizationとUserRoleも取得
            userOrganizations: {
              where: { isPrimary: true },
              include: {
                organization: true,
              },
            },
            userRoles: {
              where: {
                OR: [
                  { expiresAt: null },
                  { expiresAt: { gt: new Date() } },
                ],
              },
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        // ユーザーが無効な場合はログインを拒否
        if (!user.isActive) {
          throw new Error("User account is inactive");
        }

        // パスワードを検証
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        // 主所属組織とロールを取得（OrganizationMemberを優先、なければ既存方式を使用）
        let primaryOrganization: { id: string } | null = null;
        let roleName = "User";
        const permissions = new Set<string>();
        const organizationMemberships: Array<{ id: string; name: string; roleId: string; roleName: string }> = [];

        // 新規: OrganizationMemberから取得
        if (user.organizationMembers && user.organizationMembers.length > 0) {
          const primaryMember = user.organizationMembers.find(m => m.isPrimary) || user.organizationMembers[0];
          primaryOrganization = { id: primaryMember.organization.id };
          roleName = primaryMember.role.name;

          // すべての組織メンバーシップを収集
          for (const member of user.organizationMembers) {
            organizationMemberships.push({
              id: member.organization.id,
              name: member.organization.name,
              roleId: member.role.id,
              roleName: member.role.name,
            });

            // 権限を収集
            for (const rolePermission of member.role.rolePermissions) {
              const permission = rolePermission.permission;
              permissions.add(`${permission.resource}:${permission.action}`);
            }
          }
        } else {
          // 後方互換性: 既存のUserOrganizationとUserRoleから取得
          primaryOrganization = user.userOrganizations[0]?.organization || null;
          
          for (const userRole of user.userRoles) {
            for (const rolePermission of userRole.role.rolePermissions) {
              const permission = rolePermission.permission;
              permissions.add(`${permission.resource}:${permission.action}`);
            }
          }
          
          roleName = user.userRoles[0]?.role.name || "User";
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          organizationId: primaryOrganization?.id || null,
          role: roleName,
          permissions: Array.from(permissions),
          organizationMemberships, // 新規: 所属組織一覧
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // 初回ログイン時、ユーザー情報をトークンに追加
      if (user) {
        token.id = user.id;
        token.tenantId = user.tenantId;
        token.organizationId = user.organizationId;
        token.role = user.role;
        token.permissions = user.permissions;
        token.organizationMemberships = (user as any).organizationMemberships || [];
      }
      
      // 組織切り替え時（updateセッション時）
      if (trigger === "update" && token.organizationId) {
        // 組織切り替え後のロールと権限を再取得
        const activeOrgId = token.organizationId as string;
        const memberships = (token.organizationMemberships || []) as Array<{
          id: string;
          name: string;
          roleId: string;
          roleName: string;
        }>;
        
        const activeMembership = memberships.find(m => m.id === activeOrgId);
        if (activeMembership) {
          // アクティブな組織のロールと権限を取得
          const role = await prisma.role.findUnique({
            where: { id: activeMembership.roleId },
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          });
          
          if (role) {
            token.role = role.name;
            const permissions = new Set<string>();
            for (const rolePermission of role.rolePermissions) {
              permissions.add(`${rolePermission.permission.resource}:${rolePermission.permission.action}`);
            }
            token.permissions = Array.from(permissions);
          }
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      // セッションに拡張情報を追加
      if (session.user) {
        session.user.id = token.id as string;
        session.user.tenantId = token.tenantId as string;
        session.user.organizationId = token.organizationId as string | null;
        session.user.role = token.role as string;
        session.user.permissions = token.permissions as string[];
        session.user.organizationMemberships = (token.organizationMemberships || []) as Array<{
          id: string;
          name: string;
          roleId: string;
          roleName: string;
        }>;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, signIn, signOut, auth, update } = NextAuth(authConfig);

