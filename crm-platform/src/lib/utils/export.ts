"use client"

import { type Table } from "@tanstack/react-table";

// xlsxライブラリはクライアントサイドでのみ使用
let XLSX: typeof import("xlsx") | null = null;

/**
 * テーブルデータを取得する共通関数
 */
function getTableData<TData>(table: Table<TData>) {
  // ヘッダー行の取得
  const headers = table
    .getVisibleLeafColumns()
    .map((column) => {
      const header = column.columnDef.header;
      if (typeof header === "function") {
        return column.id;
      }
      return header?.toString() || column.id;
    });

  // データ行の取得（フィルタリング済み）
  const rows = table.getFilteredRowModel().rows.map((row) =>
    table.getVisibleLeafColumns().map((column) => {
      const value = row.getValue(column.id);
      if (value === null || value === undefined) return "";
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    })
  );

  return { headers, rows };
}

/**
 * CSVとしてエクスポート
 */
export function exportTableToCSV<TData>(
  table: Table<TData>,
  filename: string = "export"
) {
  const { headers, rows } = getTableData(table);

  // CSV文字列の生成
  const csvRows = rows.map((row) =>
    row.map((cell) => {
      const stringValue = String(cell);
      return `"${stringValue.replace(/"/g, '""')}"`;
    }).join(",")
  );
  const csvContent = [headers.join(","), ...csvRows].join("\n");

  // BOM付与（Excelでの文字化け防止）
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  downloadFile(blob, `${filename}_${getDateString()}.csv`);
}

/**
 * Excelとしてエクスポート
 */
export async function exportTableToExcel<TData>(
  table: Table<TData>,
  filename: string = "export"
) {
  // xlsxライブラリを動的にインポート（クライアントサイドのみ）
  if (typeof window === "undefined") {
    throw new Error("Excel export is only available in the browser");
  }
  
  if (!XLSX) {
    XLSX = await import("xlsx");
  }
  
  const { headers, rows } = getTableData(table);

  // ワークブックの作成
  const wb = XLSX.utils.book_new();
  
  // データをワークシート形式に変換
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // 列幅の自動調整
  const colWidths = headers.map((_, colIndex) => {
    const maxLength = Math.max(
      headers[colIndex]?.length || 0,
      ...rows.map((row) => String(row[colIndex] || "").length)
    );
    return { wch: Math.min(maxLength + 2, 50) };
  });
  ws["!cols"] = colWidths;

  // ワークシートをワークブックに追加
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  // Excelファイルとしてダウンロード
  XLSX.writeFile(wb, `${filename}_${getDateString()}.xlsx`);
}

/**
 * JSONとしてエクスポート
 */
export function exportTableToJSON<TData>(
  table: Table<TData>,
  filename: string = "export"
) {
  const { headers, rows } = getTableData(table);

  // オブジェクト配列に変換
  const jsonData = rows.map((row) => {
    const obj: Record<string, any> = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || null;
    });
    return obj;
  });

  // JSON文字列に変換
  const jsonContent = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([jsonContent], {
    type: "application/json;charset=utf-8;",
  });

  downloadFile(blob, `${filename}_${getDateString()}.json`);
}

/**
 * Googleスプレッドシート形式（TSV）としてエクスポート
 */
export function exportTableToSpreadsheet<TData>(
  table: Table<TData>,
  filename: string = "export"
) {
  const { headers, rows } = getTableData(table);

  // TSV形式（タブ区切り）で生成
  const tsvRows = rows.map((row) =>
    row.map((cell) => {
      const stringValue = String(cell);
      // タブや改行をエスケープ
      return stringValue.replace(/\t/g, " ").replace(/\n/g, " ");
    }).join("\t")
  );
  const tsvContent = [headers.join("\t"), ...tsvRows].join("\n");

  // TSVファイルとしてダウンロード
  const blob = new Blob([tsvContent], {
    type: "text/tab-separated-values;charset=utf-8;",
  });

  downloadFile(blob, `${filename}_${getDateString()}.tsv`);
}

/**
 * ファイルダウンロードの共通関数
 */
function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 日付文字列を取得（YYYY-MM-DD形式）
 */
function getDateString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * 全件データをCSVとしてエクスポート（サーバーから取得したデータを使用）
 */
export function exportAllDataToCSV<TData>(
  allData: any[],
  table: Table<TData>,
  filename: string = "export"
) {
  // テーブルのカラム定義からヘッダーを取得
  const headers = table
    .getVisibleLeafColumns()
    .map((column) => {
      const header = column.columnDef.header;
      if (typeof header === "function") {
        return column.id;
      }
      return header?.toString() || column.id;
    });

  // 全件データを行に変換
  const rows = allData.map((item) =>
    table.getVisibleLeafColumns().map((column) => {
      const value = column.accessorFn
        ? column.accessorFn(item as any, 0)
        : (item as any)[column.id];
      
      if (value === null || value === undefined) return "";
      if (typeof value === "object") return JSON.stringify(value);
      const stringValue = String(value);
      return `"${stringValue.replace(/"/g, '""')}"`;
    }).join(",")
  );

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  downloadFile(blob, `${filename}_${getDateString()}.csv`);
}

/**
 * 全件データをExcelとしてエクスポート
 */
export async function exportAllDataToExcel<TData>(
  allData: any[],
  table: Table<TData>,
  filename: string = "export"
) {
  if (typeof window === "undefined") {
    throw new Error("Excel export is only available in the browser");
  }
  
  if (!XLSX) {
    XLSX = await import("xlsx");
  }

  const headers = table
    .getVisibleLeafColumns()
    .map((column) => {
      const header = column.columnDef.header;
      if (typeof header === "function") {
        return column.id;
      }
      return header?.toString() || column.id;
    });

  const rows = allData.map((item) =>
    table.getVisibleLeafColumns().map((column) => {
      const value = column.accessorFn
        ? column.accessorFn(item as any, 0)
        : (item as any)[column.id];
      
      if (value === null || value === undefined) return "";
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    })
  );

  const wb = XLSX.utils.book_new();
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  const colWidths = headers.map((_, colIndex) => {
    const maxLength = Math.max(
      headers[colIndex]?.length || 0,
      ...rows.map((row) => String(row[colIndex] || "").length)
    );
    return { wch: Math.min(maxLength + 2, 50) };
  });
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${filename}_${getDateString()}.xlsx`);
}

/**
 * 全件データをJSONとしてエクスポート
 */
export function exportAllDataToJSON<TData>(
  allData: any[],
  table: Table<TData>,
  filename: string = "export"
) {
  const headers = table
    .getVisibleLeafColumns()
    .map((column) => {
      const header = column.columnDef.header;
      if (typeof header === "function") {
        return column.id;
      }
      return header?.toString() || column.id;
    });

  const jsonData = allData.map((item) => {
    const obj: Record<string, any> = {};
    headers.forEach((header, index) => {
      const column = table.getVisibleLeafColumns()[index];
      const value = column.accessorFn
        ? column.accessorFn(item as any, 0)
        : (item as any)[column.id];
      obj[header] = value || null;
    });
    return obj;
  });

  const jsonContent = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([jsonContent], {
    type: "application/json;charset=utf-8;",
  });

  downloadFile(blob, `${filename}_${getDateString()}.json`);
}

/**
 * 全件データをスプレッドシート形式（TSV）としてエクスポート
 */
export function exportAllDataToSpreadsheet<TData>(
  allData: any[],
  table: Table<TData>,
  filename: string = "export"
) {
  const headers = table
    .getVisibleLeafColumns()
    .map((column) => {
      const header = column.columnDef.header;
      if (typeof header === "function") {
        return column.id;
      }
      return header?.toString() || column.id;
    });

  const rows = allData.map((item) =>
    table.getVisibleLeafColumns().map((column) => {
      const value = column.accessorFn
        ? column.accessorFn(item as any, 0)
        : (item as any)[column.id];
      
      if (value === null || value === undefined) return "";
      const stringValue = String(value);
      return stringValue.replace(/\t/g, " ").replace(/\n/g, " ");
    }).join("\t")
  );

  const tsvContent = [headers.join("\t"), ...rows].join("\n");
  const blob = new Blob([tsvContent], {
    type: "text/tab-separated-values;charset=utf-8;",
  });

  downloadFile(blob, `${filename}_${getDateString()}.tsv`);
}
