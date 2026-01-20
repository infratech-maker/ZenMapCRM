import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      tenantId: string;
      activeOrganizationId: string | null; // 現在アクティブな組織ID
      activeOrganizationRole: string; // 現在アクティブな組織でのロール
      permissions: string[]; // 現在アクティブな組織での権限
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    tenantId: string;
    activeOrganizationId: string | null;
    activeOrganizationRole: string;
    permissions: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    tenantId: string;
    activeOrganizationId: string | null; // 現在アクティブな組織ID
    activeOrganizationRole: string; // 現在アクティブな組織でのロール
    permissions: string[]; // 現在アクティブな組織での権限
  }
}

