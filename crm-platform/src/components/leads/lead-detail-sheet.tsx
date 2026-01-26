"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeadStatusBadge } from "./lead-status-badge";
import { ActivityLogSection } from "./activity-log-section";
import { updateLead } from "@/lib/actions/leads";
import { ExternalLink, Phone, MapPin, Link as LinkIcon, Instagram, Twitter, Facebook, Globe, MapPin as MapPinIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { AIEnrichButton } from "./ai-enrich-button";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface Lead {
  id: string;
  source: string;
  data: any;
  status: string;
  notes: string | null;
  enrichStatus?: string | null;
  enrichedAt?: Date | null;
  lastEnrichedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_OPTIONS = [
  { value: "NEW", label: "新規" },
  { value: "CALLING", label: "架電中" },
  { value: "CONNECTED", label: "接続済み" },
  { value: "APPOINTMENT", label: "アポイント獲得" },
  { value: "NG", label: "お断り" },
  { value: "CALLBACK", label: "掛け直し" },
];

export function LeadDetailSheet({
  lead,
  open,
  onOpenChange,
}: LeadDetailSheetProps) {
  const router = useRouter();
  const [status, setStatus] = useState(lead?.status || "NEW");
  const [notes, setNotes] = useState(lead?.notes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // リードが変更されたときに状態を更新
  useEffect(() => {
    if (lead) {
      setStatus(lead.status || "NEW");
      setNotes(lead.notes || "");
      setError("");
    }
  }, [lead]);

  const handleStatusChange = async (newStatus: string) => {
    if (!lead) return;

    setStatus(newStatus);
    setIsSaving(true);
    setError("");

    try {
      await updateLead(lead.id, { status: newStatus });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ステータスの更新に失敗しました。");
      setStatus(lead.status); // 元に戻す
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotesSave = async () => {
    if (!lead) return;

    setIsSaving(true);
    setError("");

    try {
      await updateLead(lead.id, { notes });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "メモの保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  if (!lead) {
    return null;
  }

  const data = lead.data || {};
  const storeName = data.name || data.store_name || data.店舗名 || "店舗名不明";
  const phone = data.phone || data.phone_number || data.電話番号 || "-";
  const address = data.address || data.詳細住所 || data.住所 || "-";
  const url = lead.source || "";
  const aiSummary = data.aiSummary || data.summary || "";
  
  // ハイライト判定: lastEnrichedAtが1分以内の場合
  const isRecentlyEnriched = lead.lastEnrichedAt 
    ? new Date().getTime() - new Date(lead.lastEnrichedAt).getTime() < 60000
    : false;

  // 取得されたURL情報
  const websiteUrl = data.websiteUrl || data.website || "";
  const instagramUrl = data.instagramUrl || "";
  const twitterUrl = data.twitterUrl || "";
  const facebookUrl = data.facebookUrl || "";
  const tabelogUrl = data.tabelogUrl || "";
  const googleMapsUrl = data.googleMapsUrl || "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span>{storeName}</span>
            <LeadStatusBadge status={status} />
          </SheetTitle>
          <SheetDescription>
            作成日: {new Date(lead.createdAt).toLocaleDateString("ja-JP")}
          </SheetDescription>
          {aiSummary && (
            <div className="mt-2">
              <p className="text-sm text-gray-600 italic">"{aiSummary}"</p>
            </div>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* AI強化セクション */}
          <div className="space-y-4">
            <AIEnrichButton 
              leadId={lead.id}
              onComplete={() => {
                router.refresh();
              }}
            />
          </div>

          {/* 基本情報 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">基本情報</h3>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                電話番号
              </Label>
              <div className="text-sm text-gray-700">
                {phone !== "-" ? (
                  <a
                    href={`tel:${phone}`}
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    {phone}
                  </a>
                ) : (
                  phone
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                住所
              </Label>
              <div className="text-sm text-gray-700">{address}</div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-gray-500" />
                URL
              </Label>
              <div className="text-sm">
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
                  >
                    {url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-gray-500">-</span>
                )}
              </div>
            </div>

            {/* AIで取得したURL情報 */}
            {(websiteUrl || instagramUrl || twitterUrl || facebookUrl || tabelogUrl || googleMapsUrl) && (
              <div className="space-y-3 pt-2">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <span>AIで取得した情報</span>
                  {isRecentlyEnriched && (
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                      🆕 AIが見つけました
                    </Badge>
                  )}
                </Label>
                <div className="space-y-2">
                  {websiteUrl && (
                    <motion.div
                      initial={isRecentlyEnriched ? { scale: 1.02 } : {}}
                      animate={isRecentlyEnriched ? { 
                        boxShadow: [
                          "0 0 0px rgba(99, 102, 241, 0)",
                          "0 0 20px rgba(99, 102, 241, 0.5)",
                          "0 0 0px rgba(99, 102, 241, 0)",
                        ],
                      } : {}}
                      transition={isRecentlyEnriched ? { 
                        duration: 2, 
                        repeat: Infinity,
                        repeatType: "reverse" 
                      } : {}}
                      className={`p-2 rounded-lg border ${isRecentlyEnriched ? "border-indigo-500/50 bg-indigo-500/5" : "border-gray-200"}`}
                    >
                      <a
                        href={websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 underline flex items-center gap-2 text-sm"
                      >
                        <Globe className="h-4 w-4" />
                        公式サイト
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </motion.div>
                  )}
                  {instagramUrl && (
                    <motion.div
                      initial={isRecentlyEnriched ? { scale: 1.02 } : {}}
                      animate={isRecentlyEnriched ? { 
                        boxShadow: [
                          "0 0 0px rgba(99, 102, 241, 0)",
                          "0 0 20px rgba(99, 102, 241, 0.5)",
                          "0 0 0px rgba(99, 102, 241, 0)",
                        ],
                      } : {}}
                      transition={isRecentlyEnriched ? { 
                        duration: 2, 
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: 0.2
                      } : {}}
                      className={`p-2 rounded-lg border ${isRecentlyEnriched ? "border-indigo-500/50 bg-indigo-500/5" : "border-gray-200"}`}
                    >
                      <a
                        href={instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-pink-600 hover:text-pink-700 underline flex items-center gap-2 text-sm"
                      >
                        <Instagram className="h-4 w-4" />
                        Instagram
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </motion.div>
                  )}
                  {twitterUrl && (
                    <motion.div
                      initial={isRecentlyEnriched ? { scale: 1.02 } : {}}
                      animate={isRecentlyEnriched ? { 
                        boxShadow: [
                          "0 0 0px rgba(99, 102, 241, 0)",
                          "0 0 20px rgba(99, 102, 241, 0.5)",
                          "0 0 0px rgba(99, 102, 241, 0)",
                        ],
                      } : {}}
                      transition={isRecentlyEnriched ? { 
                        duration: 2, 
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: 0.4
                      } : {}}
                      className={`p-2 rounded-lg border ${isRecentlyEnriched ? "border-indigo-500/50 bg-indigo-500/5" : "border-gray-200"}`}
                    >
                      <a
                        href={twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-500 underline flex items-center gap-2 text-sm"
                      >
                        <Twitter className="h-4 w-4" />
                        X (Twitter)
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </motion.div>
                  )}
                  {facebookUrl && (
                    <motion.div
                      initial={isRecentlyEnriched ? { scale: 1.02 } : {}}
                      animate={isRecentlyEnriched ? { 
                        boxShadow: [
                          "0 0 0px rgba(99, 102, 241, 0)",
                          "0 0 20px rgba(99, 102, 241, 0.5)",
                          "0 0 0px rgba(99, 102, 241, 0)",
                        ],
                      } : {}}
                      transition={isRecentlyEnriched ? { 
                        duration: 2, 
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: 0.6
                      } : {}}
                      className={`p-2 rounded-lg border ${isRecentlyEnriched ? "border-indigo-500/50 bg-indigo-500/5" : "border-gray-200"}`}
                    >
                      <a
                        href={facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 underline flex items-center gap-2 text-sm"
                      >
                        <Facebook className="h-4 w-4" />
                        Facebook
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </motion.div>
                  )}
                  {tabelogUrl && (
                    <motion.div
                      initial={isRecentlyEnriched ? { scale: 1.02 } : {}}
                      animate={isRecentlyEnriched ? { 
                        boxShadow: [
                          "0 0 0px rgba(99, 102, 241, 0)",
                          "0 0 20px rgba(99, 102, 241, 0.5)",
                          "0 0 0px rgba(99, 102, 241, 0)",
                        ],
                      } : {}}
                      transition={isRecentlyEnriched ? { 
                        duration: 2, 
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: 0.8
                      } : {}}
                      className={`p-2 rounded-lg border ${isRecentlyEnriched ? "border-indigo-500/50 bg-indigo-500/5" : "border-gray-200"}`}
                    >
                      <a
                        href={tabelogUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700 underline flex items-center gap-2 text-sm"
                      >
                        <MapPinIcon className="h-4 w-4" />
                        食べログ
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </motion.div>
                  )}
                  {googleMapsUrl && (
                    <motion.div
                      initial={isRecentlyEnriched ? { scale: 1.02 } : {}}
                      animate={isRecentlyEnriched ? { 
                        boxShadow: [
                          "0 0 0px rgba(99, 102, 241, 0)",
                          "0 0 20px rgba(99, 102, 241, 0.5)",
                          "0 0 0px rgba(99, 102, 241, 0)",
                        ],
                      } : {}}
                      transition={isRecentlyEnriched ? { 
                        duration: 2, 
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: 1.0
                      } : {}}
                      className={`p-2 rounded-lg border ${isRecentlyEnriched ? "border-indigo-500/50 bg-indigo-500/5" : "border-gray-200"}`}
                    >
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700 underline flex items-center gap-2 text-sm"
                      >
                        <MapPinIcon className="h-4 w-4" />
                        Google Maps
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>インポート元</Label>
              <div className="text-sm text-gray-700">
                {lead.source || "不明"}
              </div>
            </div>
          </div>

          {/* ステータス変更 */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">ステータス</h3>
            <div className="space-y-2">
              <Label>ステータスを変更</Label>
              <Select
                value={status}
                onValueChange={handleStatusChange}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="ステータスを選択" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* メモ/コメント */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">メモ</h3>
            <div className="space-y-2">
              <Label>架電メモ・コメント</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="架電時のメモやコメントを入力してください..."
                rows={6}
                disabled={isSaving}
              />
              <Button
                onClick={handleNotesSave}
                disabled={isSaving || notes === (lead.notes || "")}
                size="sm"
              >
                {isSaving ? "保存中..." : "メモを保存"}
              </Button>
            </div>
          </div>

          {/* アクティビティログ */}
          <ActivityLogSection
            leadId={lead.id}
            currentStatus={status}
            onStatusChange={(newStatus) => {
              setStatus(newStatus);
              // リードデータも更新するため、親コンポーネントに通知
              router.refresh();
            }}
          />

          {/* エラーメッセージ */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

