"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  ScanSearch, 
  BrainCircuit, 
  CheckCircle2, 
  Instagram, 
  Twitter, 
  Facebook, 
  Globe, 
  MapPin,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { enrichLeadWithIntelligence } from "@/lib/actions/enrich-lead-ai";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AIEnrichButtonProps {
  leadId: string;
  onComplete?: () => void;
}

type ProcessingStep = "idle" | "searching" | "analyzing" | "saving" | "completed" | "error";

const STEP_MESSAGES: Record<ProcessingStep, string> = {
  idle: "",
  searching: "🔍 Googleで検索中...",
  analyzing: "🧠 AIがWebサイトを解析中...",
  saving: "📝 データをクレンジング中...",
  completed: "✅ 完了",
  error: "❌ エラーが発生しました",
};

const STEP_ICONS: Record<ProcessingStep, typeof Sparkles> = {
  idle: Sparkles,
  searching: ScanSearch,
  analyzing: BrainCircuit,
  saving: BrainCircuit,
  completed: CheckCircle2,
  error: AlertCircle,
};

export function AIEnrichButton({ leadId, onComplete }: AIEnrichButtonProps) {
  const router = useRouter();
  const [step, setStep] = useState<ProcessingStep>("idle");
  const [enrichment, setEnrichment] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleEnrich = async (force: boolean = false) => {
    if (step !== "idle" && step !== "error") return;

    // エラー状態をリセット
    setError(null);
    setIsRetrying(force);

    try {
      setStep("searching");
      
      // 検索ステップのアニメーション（2秒）
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      setStep("analyzing");
      
      // 解析ステップのアニメーション（3秒）
      await new Promise((resolve) => setTimeout(resolve, 3000));
      
      setStep("saving");

      // 実際のAPI呼び出し
      const result = await enrichLeadWithIntelligence(leadId, force);

      if (result.success) {
        // キャッシュされたデータの場合
        if (result.cached) {
          toast.info("24時間以内に取得済みのデータです", {
            description: "強制更新する場合は、再度お試しください",
          });
          setStep("idle");
          return;
        }

        setEnrichment(result.enrichment);
        setStep("completed");
        
        toast.success("リード情報を強化しました", {
          description: result.enrichment.summary || "新しい情報を取得しました",
        });

        // 完了後の処理
        setTimeout(() => {
          router.refresh();
          onComplete?.();
          // 3秒後にリセット
          setTimeout(() => {
            setStep("idle");
            setEnrichment(null);
            setIsRetrying(false);
          }, 3000);
        }, 2000);
      } else {
        throw new Error("強化に失敗しました");
      }
    } catch (error) {
      console.error("Enrichment error:", error);
      const errorMessage = error instanceof Error ? error.message : "リード情報の強化に失敗しました";
      setError(errorMessage);
      setStep("error");
      
      toast.error("エラーが発生しました", {
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  const handleRetry = () => {
    handleEnrich(true); // 強制更新で再試行
  };

  const StepIcon = STEP_ICONS[step];

  // 完了状態で取得したSNSアイコンを表示
  const socialLinks = enrichment
    ? [
        enrichment.instagramUrl && { url: enrichment.instagramUrl, icon: Instagram, label: "Instagram" },
        enrichment.twitterUrl && { url: enrichment.twitterUrl, icon: Twitter, label: "Twitter" },
        enrichment.facebookUrl && { url: enrichment.facebookUrl, icon: Facebook, label: "Facebook" },
        enrichment.websiteUrl && { url: enrichment.websiteUrl, icon: Globe, label: "Website" },
        enrichment.googleMapsUrl && { url: enrichment.googleMapsUrl, icon: MapPin, label: "Google Maps" },
      ].filter(Boolean)
    : [];

  return (
    <div className="space-y-4 w-full">
      {/* メインボタン */}
      <AnimatePresence mode="wait">
        {step === "idle" ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full"
          >
            <Button
              onClick={() => handleEnrich(false)}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-6 sm:py-6 text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">AIで情報を補完する</span>
              </span>
              {/* ホバー時の光るエフェクト */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: "-100%" }}
                whileHover={{ x: "100%" }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
              />
            </Button>
          </motion.div>
        ) : step === "error" ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4 w-full"
          >
            {/* エラーメッセージ */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex items-center justify-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
            >
              <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
              <span className="text-red-500 font-semibold text-sm sm:text-base truncate">
                エラーが発生しました
              </span>
            </motion.div>

            {/* エラー詳細 */}
            {error && (
              <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-400 break-words">
                  {error}
                </p>
              </div>
            )}

            {/* 再試行ボタン */}
            <Button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-semibold py-3 sm:py-4 text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
                <span className="truncate">再試行する</span>
              </span>
            </Button>
          </motion.div>
        ) : step === "completed" ? (
          <motion.div
            key="completed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4 w-full"
          >
            {/* 完了メッセージ */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex items-center justify-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-lg"
            >
              <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
              <span className="text-green-500 font-semibold text-sm sm:text-base">
                完了しました！
              </span>
            </motion.div>

            {/* 取得したSNSアイコン */}
            {socialLinks.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                <p className="text-xs sm:text-sm text-gray-400 text-center">取得した情報</p>
                <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                  {socialLinks.map((link, index) => (
                    <motion.a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        delay: index * 0.1,
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 sm:p-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                      aria-label={link.label}
                    >
                      <link.icon className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400" />
                    </motion.a>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4 w-full"
          >
            {/* プログレスバー */}
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                initial={{ width: "0%" }}
                animate={{
                  width:
                    step === "searching"
                      ? "33%"
                      : step === "analyzing"
                      ? "66%"
                      : step === "saving"
                      ? "100%"
                      : "0%",
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>

            {/* ステップ表示 */}
            <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="flex-shrink-0"
              >
                <StepIcon className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-400" />
              </motion.div>
              <motion.span
                key={step}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-white font-medium text-xs sm:text-sm md:text-base truncate flex-1"
              >
                {STEP_MESSAGES[step]}
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
