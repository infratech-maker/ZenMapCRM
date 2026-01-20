"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateOrganizationDialog } from "./create-organization-dialog";
import { getAllOrganizations } from "@/lib/actions/organizations";

interface Organization {
  id: string;
  name: string;
  code: string | null;
  type: string;
  memberCount: number;
  createdAt: Date;
  isActive: boolean;
}

interface OrganizationsPageClientProps {
  initialOrganizations: Organization[];
}

export function OrganizationsPageClient({
  initialOrganizations,
}: OrganizationsPageClientProps) {
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSuccess = async () => {
    // 組織一覧を再取得
    try {
      const updatedOrganizations = await getAllOrganizations();
      setOrganizations(updatedOrganizations);
    } catch (error) {
      console.error("Failed to refresh organizations:", error);
    }
    setIsDialogOpen(false);
  };

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        組織を新規作成
      </Button>
      <CreateOrganizationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={handleSuccess}
      />
    </>
  );
}
