import { type Table } from "@tanstack/react-table";

/**
 * TanStack Tableのインスタンスを受け取り、CSVとしてエクスポートする
 * @param table TanStack Tableのインスタンス
 * @param filename 出力ファイル名（拡張子なし）
 */
export function exportTableToCSV<TData>(
  table: Table<TData>,
  filename: string = "export"
) {
  // 1. ヘッダー行の取得（表示されているカラムのみ、アクション列などは除外したい場合は調整が必要）
  const headers = table
    .getVisibleLeafColumns()
    .map((column) => {
      // ヘッダーが関数の場合は実行して文字列化
      const header = column.columnDef.header;
      if (typeof header === "function") {
        return column.id;
      }
      return header?.toString() || column.id;
    });

  // 2. データ行の取得（フィルタリング済みの行モデルを使用）
  const rows = table.getFilteredRowModel().rows.map((row) =>
    table
      .getVisibleLeafColumns()
      .map((column) => {
        const value = row.getValue(column.id);
        // null や undefined, オブジェクトのハンドリング
        if (value === null || value === undefined) return "";
        if (typeof value === "object") return JSON.stringify(value);
        // CSVエスケープ処理（ダブルクォートを2つに、全体をダブルクォートで囲む）
        const stringValue = String(value);
        return `"${stringValue.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  // 3. CSV文字列の結合
  const csvContent = [headers.join(","), ...rows].join("\n");

  // 4. BOM付与（Excelでの文字化け防止）
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  // 5. ダウンロード発火
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
