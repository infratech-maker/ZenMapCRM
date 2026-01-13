"use client"

import { useState } from "react"
import { type Table } from "@tanstack/react-table"
import { Download, FileSpreadsheet, FileJson, FileSpreadsheet as FileExcel, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  exportTableToCSV,
  exportTableToExcel,
  exportTableToJSON,
  exportTableToSpreadsheet,
  exportAllDataToCSV,
  exportAllDataToExcel,
  exportAllDataToJSON,
  exportAllDataToSpreadsheet,
} from "@/lib/utils/export"
import { getAllMasterLeadsAsLeadsForExport } from "@/lib/actions/master-leads"

interface DataTableExportButtonProps<TData> {
  table: Table<TData>
  filename?: string
  query?: string
  statuses?: string[]
}

export function DataTableExportButton<TData>({
  table,
  filename = "data",
  query,
  statuses,
}: DataTableExportButtonProps<TData>) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async (format: "csv" | "excel" | "json" | "spreadsheet") => {
    try {
      setIsExporting(true)

      // サーバーから全件データを取得（検索・フィルター条件を適用）
      const allLeads = await getAllMasterLeadsAsLeadsForExport(
        query,
        statuses && statuses.length > 0 ? statuses : undefined
      )

      // 全件データでエクスポート
      switch (format) {
        case "csv":
          exportAllDataToCSV(allLeads, table, filename)
          break
        case "excel":
          await exportAllDataToExcel(allLeads, table, filename)
          break
        case "json":
          exportAllDataToJSON(allLeads, table, filename)
          break
        case "spreadsheet":
          exportAllDataToSpreadsheet(allLeads, table, filename)
          break
      }
    } catch (error) {
      console.error("Export error:", error)
      alert("エクスポートに失敗しました。ブラウザのコンソールを確認してください。")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-8"
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              エクスポート中...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              エクスポート
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleExport("csv")}
          disabled={isExporting}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          CSV形式
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport("excel")}
          disabled={isExporting}
        >
          <FileExcel className="mr-2 h-4 w-4" />
          Excel形式
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport("json")}
          disabled={isExporting}
        >
          <FileJson className="mr-2 h-4 w-4" />
          JSON形式
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleExport("spreadsheet")}
          disabled={isExporting}
        >
          <FileText className="mr-2 h-4 w-4" />
          スプレッドシート形式 (TSV)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
