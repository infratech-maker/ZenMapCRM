'use client'

import { useState, useTransition } from 'react'
import { ShoppingBag, Search, Loader2 } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { startUbereatsScraping } from '@/lib/actions/ubereats'

export function UbereatsScraperDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  // フォームの状態
  const [areaUrl, setAreaUrl] = useState('')
  const [maxItems, setMaxItems] = useState('20')

  // 主要都市のプリセット
  const cityPresets = [
    { label: '東京', value: 'https://www.ubereats.com/jp/location/tokyo' },
    { label: '大阪', value: 'https://www.ubereats.com/jp/location/osaka' },
    { label: '横浜', value: 'https://www.ubereats.com/jp/location/yokohama' },
    { label: '名古屋', value: 'https://www.ubereats.com/jp/location/nagoya' },
    { label: '福岡', value: 'https://www.ubereats.com/jp/location/fukuoka' },
    { label: '札幌', value: 'https://www.ubereats.com/jp/location/sapporo' },
    { label: '仙台', value: 'https://www.ubereats.com/jp/location/sendai' },
    { label: '京都', value: 'https://www.ubereats.com/jp/location/kyoto' },
  ]

  const handleStartScraping = () => {
    if (!areaUrl || !areaUrl.includes('ubereats.com')) {
      toast({
        title: "入力エラー",
        description: "有効なUberEatsのエリアURLを入力してください。",
        variant: "destructive"
      })
      return
    }

    startTransition(async () => {
      try {
        const result = await startUbereatsScraping(
          areaUrl,
          parseInt(maxItems)
        )

        if (result.success) {
          toast({
            title: "収集ジョブを開始しました",
            description: "バックグラウンドで収集中です。完了次第リストに追加されます。",
          })
          setOpen(false)
          // 入力リセット
          setAreaUrl('')
          setMaxItems('20')
        } else {
          toast({
            title: "エラーが発生しました",
            description: result.error || "ジョブの開始に失敗しました。",
            variant: "destructive"
          })
        }
      } catch (error) {
        toast({
          title: "予期せぬエラー",
          description: "通信エラーが発生しました。",
          variant: "destructive"
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ShoppingBag className="h-4 w-4" />
          UberEats収集
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>UberEats収集</DialogTitle>
          <DialogDescription>
            指定したエリアのUberEats店舗リストを収集し、自動的にリードとして追加します。
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="area-url">エリアURL</Label>
            <Input
              id="area-url"
              placeholder="https://www.ubereats.com/jp/location/tokyo"
              value={areaUrl}
              onChange={(e) => setAreaUrl(e.target.value)}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              主要都市のプリセットから選択するか、直接URLを入力してください
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="city-preset">主要都市（プリセット）</Label>
            <Select
              value=""
              onValueChange={(value) => {
                if (value) {
                  setAreaUrl(value)
                }
              }}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="都市を選択" />
              </SelectTrigger>
              <SelectContent>
                {cityPresets.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="max-items">収集上限数 (概算)</Label>
            <Select 
              value={maxItems} 
              onValueChange={setMaxItems}
              disabled={isPending}
            >
              <SelectTrigger id="max-items">
                <SelectValue placeholder="件数を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10件 (テスト用)</SelectItem>
                <SelectItem value="20">20件</SelectItem>
                <SelectItem value="50">50件</SelectItem>
                <SelectItem value="100">100件</SelectItem>
                <SelectItem value="200">200件</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              ※ 収集には時間がかかる場合があります
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            キャンセル
          </Button>
          <Button onClick={handleStartScraping} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                開始中...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                収集開始
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
