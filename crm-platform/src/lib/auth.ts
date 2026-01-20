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

        // アクティブな組織とロールを取得（1つだけ）
        // isPrimary: true を優先し、なければ createdAt が古い順で1つだけ取得
        let activeOrganizationId: string | null = null;
        let activeOrganizationRole = "User";
        const permissions = new Set<string>();

        // 新規: OrganizationMemberから取得（1つだけ）
        if (user.organizationMembers && user.organizationMembers.length > 0) {
          // isPrimary: true を優先、なければ createdAt が古い順で1つだけ取得
          const activeMember = user.organizationMembers.find(m => m.isPrimary) 
            || user.organizationMembers.sort((a, b) => 
                a.createdAt.getTime() - b.createdAt.getTime()
              )[0];
          
          activeOrganizationId = activeMember.organization.id;
          activeOrganizationRole = activeMember.role.name;

          // アクティブな組織のロールの権限のみを収集
          for (const rolePermission of activeMember.role.rolePermissions) {
            const permission = rolePermission.permission;
            permissions.add(`${permission.resource}:${permission.action}`);
          }
        } else {
          // 後方互換性: 既存のUserOrganizationとUserRoleから取得
          const primaryOrg = user.userOrganizations[0]?.organization;
          activeOrganizationId = primaryOrg?.id || null;
          
          // 最初のロールの権限を取得
          const firstRole = user.userRoles[0];
          if (firstRole) {
            activeOrganizationRole = firstRole.role.name;
            for (const rolePermission of firstRole.role.rolePermissions) {
              const permission = rolePermission.permission;
              permissions.add(`${permission.resource}:${permission.action}`);
            }
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          activeOrganizationId,
          activeOrganizationRole,
          permissions: Array.from(permissions),
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
        token.activeOrganizationId = (user as any).activeOrganizationId || null;
        token.activeOrganizationRole = (user as any).activeOrganizationRole || "User";
        token.permissions = (user as any).permissions || [];
      }
      
      // 組織切り替え時（updateセッション時）
      if (trigger === "update") {
        const newActiveOrgId = (token as any).activeOrganizationId as string | null;
        
        if (newActiveOrgId && token.id) {
          // 組織切り替え後のロールと権限をDBから再取得
          const organizationMember = await prisma.organizationMember.findFirst({
            where: {
              userId: token.id as string,
              organizationId: newActiveOrgId,
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
          });
          
          if (organizationMember) {
            token.activeOrganizationId = newActiveOrgId;
            token.activeOrganizationRole = organizationMember.role.name;
            
            // アクティブな組織のロールの権限を取得
            const permissions = new Set<string>();
            for (const rolePermission of organizationMember.role.rolePermissions) {
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
        session.user.activeOrganizationId = token.activeOrganizationId as string | null;
        session.user.activeOrganizationRole = token.activeOrganizationRole as string;
        session.user.permissions = token.permissions as string[];
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);

