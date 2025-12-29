"use client"

import { Column } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff, SortAsc, SortDesc } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Checkbox } from "@/components/ui/checkbox"

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
  facetedValues?: Map<string, number>
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  facetedValues,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  
  // 安全にフィルター値を取得
  const filterValue = column.getFilterValue()
  const currentFilter = Array.isArray(filterValue) ? filterValue : undefined
  const [selectedValues, setSelectedValues] = useState<Set<string>>(
    new Set(Array.isArray(filterValue) ? filterValue : [])
  )

  // currentFilterの変更を監視
  useEffect(() => {
    if (Array.isArray(filterValue) && filterValue.length > 0) {
      setSelectedValues(new Set(filterValue))
    } else {
      setSelectedValues(new Set())
    }
  }, [filterValue])

  if (!column.getCanSort() && !facetedValues) {
    return <div className={cn(className)}>{title}</div>
  }

  // facetedValuesが存在する場合のみ処理
  const sortedValues = facetedValues && facetedValues.size > 0
    ? Array.from(facetedValues.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([value]) => value)
    : []

  const filteredValues = sortedValues.filter((value) => {
    if (value == null) return false
    const valueStr = typeof value === "string" ? value : String(value)
    const searchStr = typeof searchValue === "string" ? searchValue : String(searchValue)
    return valueStr.toLowerCase().includes(searchStr.toLowerCase())
  })

  const handleValueToggle = (value: string) => {
    const newSelected = new Set(selectedValues)
    if (newSelected.has(value)) {
      newSelected.delete(value)
    } else {
      newSelected.add(value)
    }
    setSelectedValues(newSelected)

    // フィルターを適用
    if (newSelected.size === 0) {
      column.setFilterValue(undefined)
    } else {
      column.setFilterValue(Array.from(newSelected))
    }
  }

  const handleSelectAll = () => {
    const allValues = new Set(filteredValues)
    setSelectedValues(allValues)
    column.setFilterValue(Array.from(allValues))
  }

  const handleClear = () => {
    setSelectedValues(new Set())
    column.setFilterValue(undefined)
  }

  // 安全に配列かどうかをチェック
  const isFiltered = Array.isArray(currentFilter) && currentFilter.length > 0

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent"
          >
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
            {isFiltered && (
              <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800">
                {Array.isArray(currentFilter) ? currentFilter.length : 0}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder={`${title}で検索...`}
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>結果が見つかりません</CommandEmpty>
              <CommandGroup>
                {/* ソートオプション */}
                {column.getCanSort() && (
                  <>
                    <CommandItem
                      onSelect={() => {
                        column.toggleSorting(false)
                        setOpen(false)
                      }}
                    >
                      <SortAsc className="mr-2 h-4 w-4" />
                      昇順で並べ替え
                    </CommandItem>
                    <CommandItem
                      onSelect={() => {
                        column.toggleSorting(true)
                        setOpen(false)
                      }}
                    >
                      <SortDesc className="mr-2 h-4 w-4" />
                      降順で並べ替え
                    </CommandItem>
                  </>
                )}
                {column.getCanSort() && facetedValues && <Separator />}
                {/* フィルターオプション */}
                {facetedValues && (
                  <>
                    <div className="px-2 py-1.5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">フィルター</span>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSelectAll}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            すべて選択
                          </button>
                          <button
                            onClick={handleClear}
                            className="text-xs text-gray-600 hover:underline"
                          >
                            クリア
                          </button>
                        </div>
                      </div>
                      <div className="max-h-[200px] overflow-y-auto space-y-1">
                        {filteredValues.map((value) => {
                          const count = facetedValues && facetedValues.has(value) ? (facetedValues.get(value) || 0) : 0
                          const isSelected = Array.isArray(currentFilter) && currentFilter.includes(value)
                          return (
                            <div
                              key={value}
                              className="flex items-center space-x-2 px-2 py-1 hover:bg-gray-50 rounded"
                              onClick={() => handleValueToggle(value)}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleValueToggle(value)}
                              />
                              <span className="flex-1 text-sm">{value || "(空)"}</span>
                              <span className="text-xs text-gray-500">
                                ({count})
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </CommandGroup>
            </CommandList>
            {facetedValues && (
              <div className="border-t p-2">
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => setOpen(false)}
                >
                  OK
                </Button>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

