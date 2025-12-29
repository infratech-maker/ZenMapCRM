"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { getAllLeadsForExport } from "@/features/scraper/leads-actions"

type Lead = {
  id: string
  source: string
  data: any
  status: string
  createdAt: Date | string | null
  updatedAt: Date | string | null
}

function extractCategory(category: string | null | undefined): string {
  if (!category) return ""
  const parts = category.split("/")
  if (parts.length > 1) {
    return parts[parts.length - 1].trim()
  }
  return category.trim()
}

function formatDate(date: Date | string | null): string {
  if (!date) return ""
  try {
    // DateオブジェクトまたはISO文字列の両方に対応
    const dateObj = date instanceof Date ? date : new Date(date)
    return dateObj.toLocaleString("ja-JP")
  } catch {
    return ""
  }
}

function escapeCsvValue(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function convertLeadsToCSV(leads: Lead[]): string {
  // BOM付きUTF-8
  const BOM = "\uFEFF"
  
  // ヘッダー行
  const headers = [
    "ID",
    "店舗名",
    "フランチャイズ",
    "住所",
    "アクセス",
    "電話番号",
    "交通手段",
    "カテゴリ",
    "都市",
    "都道府県",
    "オープン日",
    "営業時間",
    "予算",
    "関連店舗",
    "Source",
    "Status",
    "Created At",
    "Updated At",
  ]

  // データ行
  const rows = leads.map((lead) => {
    const data = lead.data || {}
    const name = data.name || data.store_name || ""
    const isFranchise = data.is_franchise === true ? "はい" : "いいえ"
    const address = data.address || data.住所 || ""
    const access = data.access || ""
    const phone = data.phone || data.電話番号 || ""
    const transport = data.transport || data.交通手段 || ""
    const category = extractCategory(data.category || data.カテゴリ)
    const city = data.city || data.都市 || ""
    const prefecture = data.prefecture || data.都道府県 || ""
    const openDate = data.open_date || data.オープン日 || ""
    const businessHours = data.business_hours || data.営業時間 || data.regular_holiday || data.定休日 || ""
    const budget = data.budget || data.予算 || ""
    const relatedStores = data.related_stores 
      ? (Array.isArray(data.related_stores) ? data.related_stores.join("; ") : String(data.related_stores))
      : ""

    return [
      lead.id,
      name,
      isFranchise,
      address,
      access,
      phone,
      transport,
      category,
      city,
      prefecture,
      openDate,
      businessHours,
      budget,
      relatedStores,
      lead.source,
      lead.status,
      formatDate(lead.createdAt),
      formatDate(lead.updatedAt),
    ].map(escapeCsvValue)
  })

  // CSV文字列を生成
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n")

  return BOM + csvContent
}

export function CSVExportButton() {
  const handleExport = async () => {
    try {
      const leads = await getAllLeadsForExport()
      const csvContent = convertLeadsToCSV(leads)
      
      // Blobを作成してダウンロード
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `leads_export_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("CSVエクスポートエラー:", error)
      alert("CSVエクスポートに失敗しました")
    }
  }

  return (
    <Button onClick={handleExport} variant="outline" size="sm">
      <Download className="mr-2 h-4 w-4" />
      CSVエクスポート
    </Button>
  )
}

