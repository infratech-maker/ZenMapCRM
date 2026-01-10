"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, X, HelpCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type BillingPeriod = "monthly" | "yearly"

interface PricingPlan {
  id: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  features: string[]
  limitations?: string[]
  popular?: boolean
  cta: {
    label: string
    variant?: "default" | "outline" | "secondary"
    action?: () => void
  }
}

const plans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "個人利用や小規模チーム向けの無料プラン",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "最大100件のリード管理",
      "基本的なCRM機能",
      "メールサポート",
      "モバイルアプリ対応",
    ],
    limitations: [
      "チーム機能なし",
      "高度な分析機能なし",
    ],
    cta: {
      label: "無料で始める",
      variant: "outline",
    },
  },
  {
    id: "pro",
    name: "Pro",
    description: "中小企業向けの包括的なソリューション",
    monthlyPrice: 9800,
    yearlyPrice: 94080, // 月額9800円 × 12ヶ月 × 0.8 (20% OFF)
    features: [
      "無制限のリード管理",
      "高度な分析・レポート機能",
      "チームコラボレーション（最大10名）",
      "API連携",
      "優先メールサポート",
      "カスタムフィールド",
      "ワークフロー自動化",
      "AI検索機能",
    ],
    popular: true,
    cta: {
      label: "今すぐ始める",
      variant: "default",
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "大規模組織向けのカスタマイズ可能なソリューション",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      "Proプランの全機能",
      "無制限のユーザー数",
      "専任サポート（24/7）",
      "カスタム統合開発",
      "オンプレミス展開オプション",
      "SLA保証",
      "セキュリティ監査",
      "専用トレーニング",
    ],
    cta: {
      label: "お問い合わせ",
      variant: "outline",
    },
  },
]

export function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly")
  const isYearly = billingPeriod === "yearly"

  const formatPrice = (price: number) => {
    if (price === 0) return "カスタム"
    return `¥${price.toLocaleString()}`
  }

  const getPrice = (plan: PricingPlan) => {
    return isYearly ? plan.yearlyPrice : plan.monthlyPrice
  }

  const getMonthlyEquivalent = (plan: PricingPlan) => {
    if (plan.yearlyPrice === 0) return null
    return Math.floor(plan.yearlyPrice / 12)
  }

  return (
    <div className="container mx-auto py-16 px-4">
      {/* ヘッダー */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold tracking-tight mb-4">
          料金プラン
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          あなたのビジネスに最適なプランを選択してください
        </p>
      </div>

      {/* 期間切り替えスイッチ */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <span className={cn("text-sm font-medium", !isYearly && "text-foreground")}>
          月払い
        </span>
        <Switch
          checked={isYearly}
          onCheckedChange={(checked) => setBillingPeriod(checked ? "yearly" : "monthly")}
        />
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-medium", isYearly && "text-foreground")}>
            年払い
          </span>
          {isYearly && (
            <Badge variant="secondary" className="ml-2">
              20% OFF
            </Badge>
          )}
        </div>
      </div>

      {/* プランカード */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan, index) => {
          const price = getPrice(plan)
          const monthlyEquivalent = getMonthlyEquivalent(plan)

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
            >
              <Card
                className={cn(
                  "relative h-full flex flex-col",
                  plan.popular && "border-primary shadow-lg scale-105"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      一番人気
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  {/* 価格表示 */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">
                        {formatPrice(price)}
                      </span>
                      {isYearly && monthlyEquivalent && (
                        <span className="text-sm text-muted-foreground">
                          /月（年払い換算）
                        </span>
                      )}
                      {!isYearly && price > 0 && (
                        <span className="text-sm text-muted-foreground">/月</span>
                      )}
                    </div>
                    {isYearly && monthlyEquivalent && plan.monthlyPrice > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        通常 {formatPrice(plan.monthlyPrice)}/月 → 年払いで
                        {formatPrice(plan.monthlyPrice - monthlyEquivalent)}/月 お得
                      </p>
                    )}
                  </div>

                  {/* 機能リスト */}
                  <div className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 + idx * 0.05 }}
                        className="flex items-start gap-2"
                      >
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </motion.div>
                    ))}
                    {plan.limitations?.map((limitation, idx) => (
                      <motion.div
                        key={`limit-${idx}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 + (plan.features.length + idx) * 0.05 }}
                        className="flex items-start gap-2 text-muted-foreground"
                      >
                        <X className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{limitation}</span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.cta.variant || "default"}
                    size="lg"
                    onClick={plan.cta.action}
                  >
                    {plan.cta.label}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* フッター説明 */}
      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
          <HelpCircle className="h-4 w-4" />
          すべてのプランに14日間の無料トライアルが含まれます。解約はいつでも可能です。
        </p>
      </div>
    </div>
  )
}
