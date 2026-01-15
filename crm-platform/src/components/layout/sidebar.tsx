'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Activity,       // Command Center (Dashboard)
  Rocket,         // Campaigns (Projects)
  Radar,          // Intelligence (Master Leads)
  Inbox,          // Action Inbox (Leads)
  Bot,            // AI Agents (Future placeholder)
  Settings,
  Users,
  Building2,
  LogOut,
  UserCog,
  CreditCard,     // Pricing
  Shield,          // Admin section icon
} from "lucide-react"

interface SidebarProps {
  userRole: string;
}

// メニュー構造の定義
const menuGroups = [
  {
    label: "COMMAND", // 指揮・判断
    items: [
      { href: "/dashboard", label: "Command Center", icon: Activity },
      { href: "/dashboard/leads", label: "Action Inbox", icon: Inbox },
    ],
  },
  {
    label: "STRATEGY", // 戦略・実行
    items: [
      { href: "/dashboard/projects", label: "Campaigns", icon: Rocket },
      // ※将来実装機能: AIエージェント管理
      // { href: "/dashboard/agents", label: "AI Agents", icon: Bot }, 
    ],
  },
  {
    label: "MARKET", // 市場・情報
    items: [
      { href: "/dashboard/master-leads", label: "Intelligence", icon: Radar },
    ],
  },
  {
    label: "SYSTEM", // 基盤
    items: [
      { href: "/dashboard/customers", label: "Customers", icon: Users },
      { href: "/dashboard/pricing", label: "Pricing", icon: CreditCard },
      { href: "/dashboard/settings/users", label: "Users", icon: UserCog, roles: ["Super Admin", "Org Admin"] },
      { href: "/dashboard/settings/organizations", label: "Organization", icon: Building2, roles: ["Super Admin", "Org Admin"] },
      { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["Super Admin"] },
    ],
  },
  {
    label: "ADMIN", // システム管理者専用
    items: [
      { href: "/dashboard/admin/organizations", label: "Organizations", icon: Building2, roles: ["Super Admin"] },
    ],
  },
]

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()

  // ロールに基づいてメニューをフィルタリング
  const filteredMenuGroups = menuGroups.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (!item.roles) return true; // ロール制限がない場合は表示
      return item.roles.includes(userRole);
    })
  })).filter(group => group.items.length > 0); // 空のグループを除外

  return (
    <div className="flex h-full w-64 flex-col bg-slate-950 text-white border-r border-slate-900 shadow-2xl">
      {/* ロゴエリア: ZenMap Identity */}
      <div className="flex h-16 items-center px-6 gap-3 border-b border-slate-900/50">
        <div className="relative flex h-8 w-8 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-purple-600 blur opacity-40 animate-pulse" />
          <div className="relative h-6 w-6 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 shadow-inner" />
        </div>
        <span className="font-bold text-xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
          ZenMap
        </span>
      </div>

      {/* メニューエリア */}
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-8 px-4">
          {filteredMenuGroups.map((group, i) => (
            <div key={i}>
              <h3 className="mb-3 px-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-[0.2em]">
                {group.label}
              </h3>
              
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  // パスの判定: 完全一致 または 配下ページを含む (Dashboard以外)
                  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`))
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 relative overflow-hidden",
                        isActive
                          ? "bg-purple-500/10 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.1)] border border-purple-500/20" 
                          : "text-slate-400 hover:bg-slate-900 hover:text-slate-100 hover:translate-x-1"
                      )}
                    >
                      {/* Active時の左端アクセントバー */}
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 shadow-[0_0_10px_#a855f7]" />
                      )}

                      <Icon className={cn(
                        "h-4 w-4 transition-colors duration-300", 
                        isActive ? "text-purple-400" : "text-slate-500 group-hover:text-slate-300"
                      )} />
                      <span className="relative z-10">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* ユーザーフッター */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/50">
        <div className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-slate-900 cursor-pointer group">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-xs font-bold ring-2 ring-slate-800 group-hover:ring-purple-500/50 transition-all">
            {userRole === "Super Admin" ? "SA" : userRole === "Org Admin" ? "OA" : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white">Admin User</p>
            <p className="text-xs text-slate-500 truncate">{userRole}</p>
          </div>
          <LogOut className="h-4 w-4 text-slate-600 group-hover:text-slate-400" />
        </div>
      </div>
    </div>
  )
}
