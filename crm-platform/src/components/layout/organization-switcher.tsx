"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  code: string | null;
  type: string;
  isActive: boolean;
  role: {
    id: string;
    name: string;
    description: string | null;
  };
  isPrimary: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}

export function OrganizationSwitcher() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // APIから組織一覧を取得
    const fetchOrganizations = async () => {
      try {
        const response = await fetch("/api/organizations/mine");
        if (!response.ok) {
          throw new Error("Failed to fetch organizations");
        }
        const data = await response.json();
        setOrganizations(data.organizations || []);
      } catch (error) {
        console.error("Error fetching organizations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchOrganizations();
    }
  }, [session]);

  if (!session?.user) {
    return null;
  }

  const currentOrgId = session.user.activeOrganizationId;

  // 複数の組織に所属していない場合は表示しない
  if (!isLoading && organizations.length <= 1) {
    return null;
  }

  const handleSwitch = async (organizationId: string) => {
    if (organizationId === currentOrgId) {
      return;
    }

    setIsSwitching(true);
    try {
      // セッションを更新（activeOrganizationIdを変更）
      await update({
        activeOrganizationId: organizationId,
      });
      
      // ページをリロードして新しい組織のデータを表示
      router.refresh();
    } catch (error) {
      console.error("Error switching organization:", error);
      alert("組織の切り替えに失敗しました");
    } finally {
      setIsSwitching(false);
    }
  };

  const currentOrg = organizations.find((org) => org.id === currentOrgId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-gray-500" />
        <div className="h-10 w-[200px] rounded-md border border-gray-200 bg-gray-50 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-gray-500" />
      <Select
        value={currentOrgId || ""}
        onValueChange={handleSwitch}
        disabled={isSwitching}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="組織を選択">
            {currentOrg ? (
              <span className="flex items-center gap-2">
                <span>{currentOrg.name}</span>
                <span className="text-xs text-gray-500">
                  ({currentOrg.role.name})
                </span>
              </span>
            ) : (
              "組織を選択"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              <div className="flex flex-col">
                <span>{org.name}</span>
                <span className="text-xs text-gray-500">
                  {org.role.name}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
