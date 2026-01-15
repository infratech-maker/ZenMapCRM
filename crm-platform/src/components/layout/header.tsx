"use client";

import { usePathname } from "next/navigation";
import { UserNav } from "./user-nav";
import { ReleaseNotesDialog } from "./release-notes-dialog";
import { OrganizationSwitcher } from "./organization-switcher";

interface HeaderProps {
  userName: string;
  userEmail: string;
  userRole: string;
}

// ページタイトルマッピング（ZenMapコンセプトに統一）
const pageTitles: Record<string, string> = {
  "/dashboard": "Command Center",
  "/dashboard/leads": "Action Inbox",
  "/dashboard/customers": "Customers",
  "/dashboard/master-leads": "Intelligence",
  "/dashboard/projects": "Campaigns",
  "/dashboard/pricing": "Pricing",
  "/dashboard/settings/users": "Users",
  "/dashboard/settings/organizations": "Organization",
  "/dashboard/settings": "Settings",
  "/dashboard/scraper": "Scraper",
};

export function Header({ userName, userEmail, userRole }: HeaderProps) {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-gray-200 bg-white px-6">
      <div className="flex flex-1 items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <div className="flex items-center gap-4">
          <OrganizationSwitcher />
          <ReleaseNotesDialog />
          <UserNav
            userName={userName}
            userEmail={userEmail}
            userRole={userRole}
          />
        </div>
      </div>
    </header>
  );
}

