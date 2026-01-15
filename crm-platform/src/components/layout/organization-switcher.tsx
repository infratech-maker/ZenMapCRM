"use client";

import { useState } from "react";
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

export function OrganizationSwitcher() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);

  if (!session?.user) {
    return null;
  }

  const memberships = session.user.organizationMemberships || [];
  const currentOrgId = session.user.organizationId;

  // 複数の組織に所属していない場合は表示しない
  if (memberships.length <= 1) {
    return null;
  }

  const handleSwitch = async (organizationId: string) => {
    if (organizationId === currentOrgId) {
      return;
    }

    setIsSwitching(true);
    try {
      const response = await fetch("/api/organization/switch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ organizationId }),
      });

      if (!response.ok) {
        throw new Error("Failed to switch organization");
      }

      // セッションを更新
      await update();
      
      // ページをリロードして新しい組織のデータを表示
      router.refresh();
    } catch (error) {
      console.error("Error switching organization:", error);
      alert("組織の切り替えに失敗しました");
    } finally {
      setIsSwitching(false);
    }
  };

  const currentOrg = memberships.find((m) => m.id === currentOrgId);

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
                  ({currentOrg.roleName})
                </span>
              </span>
            ) : (
              "組織を選択"
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {memberships.map((membership) => (
            <SelectItem key={membership.id} value={membership.id}>
              <div className="flex flex-col">
                <span>{membership.name}</span>
                <span className="text-xs text-gray-500">
                  {membership.roleName}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
