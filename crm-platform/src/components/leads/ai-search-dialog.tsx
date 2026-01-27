'use client'

import { useState, useTransition } from 'react'
import { Search, FolderPlus, Loader2, Sparkles, MapPin, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { hybridSearchMasterLeads, HybridSearchFilters } from '@/lib/actions/hybrid-search'
import { createProjectFromSearch } from '@/lib/actions/project'
import { Badge } from '@/components/ui/badge'

interface SearchResult {
  id: string
  companyName: string
  phone: string | null
  address: string | null
  source: string
  data: any
  similarity: number
}

export function AISearchDialog() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [areaFilter, setAreaFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [isSearching, startSearchTransition] = useTransition()
  const [isSaving, setIsSaving] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const { toast } = useToast()

  const handleSearch = () => {
    // クエリまたはフィルターのいずれかが入力されている必要がある
    if ((!query || query.trim().length === 0) && !areaFilter.trim() && !categoryFilter.trim()) {
      toast({
        title: "入力エラー",
        description: "検索キーワードまたは絞り込み条件を入力してください。",
        variant: "destructive"
      })
      return
    }

    startSearchTransition(async () => {
      try {
        // フィルター条件を構築
        const filters: HybridSearchFilters = {}
        if (areaFilter.trim()) {
          filters.area = areaFilter.trim()
        }
        if (categoryFilter.trim()) {
          filters.category = categoryFilter.trim()
        }

        const result = await hybridSearchMasterLeads(
          query.trim() || '', // クエリが空でもフィルターのみで検索可能
          filters,
          50
        )
        
        if (result.success) {
          setResults(result.results || [])
          if (result.results && result.results.length === 0) {
            toast({
              title: "検索結果なし",
              description: "該当するリードが見つかりませんでした。",
            })
          } else {
            // 検索成功時のフィードバック
            const filterInfo = []
            if (areaFilter.trim()) filterInfo.push(`エリア: ${areaFilter}`)
            if (categoryFilter.trim()) filterInfo.push(`カテゴリ: ${categoryFilter}`)
            if (query.trim()) filterInfo.push(`キーワード: ${query}`)
            
            toast({
              title: "検索完了",
              description: `${result.results.length}件見つかりました${filterInfo.length > 0 ? ` (${filterInfo.join(', ')})` : ''}`,
            })
          }
        } else {
          toast({
            title: "検索エラー",
            description: result.error || "検索に失敗しました。",
            variant: "destructive"
          })
          setResults([])
        }
      } catch (error) {
        toast({
          title: "予期せぬエラー",
          description: "通信エラーが発生しました。",
          variant: "destructive"
        })
        setResults([])
      }
    })
  }

  const handleSaveProject = async () => {
    if (results.length === 0) return;
    
    setIsSaving(true);
    
    try {
      const ids = results.map(r => r.id);
      // 検索クエリをプロジェクト名にする（長すぎる場合は切り詰め）
      const projectName = query.length > 50 ? query.substring(0, 50) + '...' : query;
      
      const result = await createProjectFromSearch(projectName, ids);

      if (result.success) {
        toast({
          title: "プロジェクトを作成しました",
          description: `フォルダ「${projectName}」に${result.count}件を保存しました。`,
        });
        setOpen(false);
        setQuery('');
        setResults([]);
      } else {
        toast({ 
          title: "エラー", 
          description: result.error || "保存処理に失敗しました", 
          variant: "destructive" 
        });
      }
    } catch (e) {
      toast({ 
        title: "エラー", 
        description: "保存処理に失敗しました", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          AI検索
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>AI検索（ハイブリッド検索）</DialogTitle>
          <DialogDescription>
            自然言語で検索し、エリアやカテゴリで絞り込んで、類似したリードをAIが自動で見つけます。
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* フィルター条件 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="area-filter" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                エリア
              </Label>
              <Input
                id="area-filter"
                placeholder="例: 渋谷区, 東京都 新宿区"
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSearching) {
                    handleSearch();
                  }
                }}
                disabled={isSearching}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-filter" className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                カテゴリ
              </Label>
              <Input
                id="category-filter"
                placeholder="例: カフェ, 美容室, レストラン"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSearching) {
                    handleSearch();
                  }
                }}
                disabled={isSearching}
              />
            </div>
          </div>

          {/* 検索キーワード */}
          <div className="grid gap-2">
            <Label htmlFor="search-query">検索キーワード（自然言語）</Label>
            <div className="flex gap-2">
              <Input
                id="search-query"
                placeholder="例: 隠れ家っぽいデート向きの店, 静かなカフェ, 高評価のイタリアン"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSearching) {
                    handleSearch();
                  }
                }}
                disabled={isSearching}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || (!query.trim() && !areaFilter.trim() && !categoryFilter.trim())}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* 検索結果表示エリア */}
          <div className="flex-1 overflow-y-auto border rounded-md p-4 bg-gray-50">
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">検索中...</span>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="p-3 bg-white rounded border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{result.companyName}</h4>
                          {result.similarity < 1.0 && (
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(result.similarity * 100)}% マッチ
                            </Badge>
                          )}
                        </div>
                        {result.address && (
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {result.address}
                            {areaFilter.trim() && result.address.includes(areaFilter) && (
                              <Badge variant="outline" className="ml-1 text-xs">エリア一致</Badge>
                            )}
                          </p>
                        )}
                        {result.phone && (
                          <p className="text-xs text-gray-500">{result.phone}</p>
                        )}
                        {result.data && (result.data as any).category && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <Tag className="h-3 w-3" />
                            {(result.data as any).category}
                            {categoryFilter.trim() && (result.data as any).category === categoryFilter && (
                              <Badge variant="outline" className="ml-1 text-xs">カテゴリ一致</Badge>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : query && !isSearching ? (
              <div className="text-center py-8 text-sm text-gray-500">
                検索結果がありません
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-gray-400">
                検索キーワードを入力して検索してください
              </div>
            )}
          </div>

          {/* 保存ボタン */}
          {results.length > 0 && (
            <div className="pt-4 mt-4 border-t flex justify-between items-center bg-white sticky bottom-0">
              <span className="text-sm text-muted-foreground">
                {results.length}件 ヒット
              </span>
              <Button 
                onClick={handleSaveProject} 
                disabled={isSaving} 
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <FolderPlus className="mr-2 h-4 w-4" />
                    リストとして保存
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => {
            setOpen(false);
            setQuery('');
            setAreaFilter('');
            setCategoryFilter('');
            setResults([]);
          }}>
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
