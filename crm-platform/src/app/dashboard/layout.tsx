import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // セッションを取得
  const session = await auth();

  // セッションがない場合はログインページへリダイレクト
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - Fixed */}
      <aside className="fixed left-0 top-0 z-40 h-screen">
        <Sidebar userRole={session.user.role} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <Header
          userName={session.user.name}
          userEmail={session.user.email}
          userRole={session.user.role}
        />

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
