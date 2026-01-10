"use client"

import { type Table } from "@tanstack/react-table"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { exportTableToCSV } from "@/lib/utils/export"

interface DataTableExportButtonProps<TData> {
  table: Table<TData>
  filename?: string
}

export function DataTableExportButton<TData>({
  table,
  filename = "data",
}: DataTableExportButtonProps<TData>) {
  const handleExport = () => {
    exportTableToCSV(table, filename)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="ml-auto h-8"
    >
      <Download className="mr-2 h-4 w-4" />
      エクスポート (CSV)
    </Button>
  )
}
