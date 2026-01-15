"use client";

/**
 * アニメーション付き背景コンポーネント
 * 
 * Topページとログインページで共通使用する、リッチなアニメーション背景
 * - ベース背景: 濃紺
 * - ゆらめくオーロラ: 20秒周期のアニメーション
 * - 浮かび上がる日本地図: 3秒かけてフェードイン
 */
export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0B1120]">
      {/* ベース背景 */}
      <div className="absolute inset-0 bg-[#0B1120]" />

      {/* ゆらめくオーロラ (複数レイヤー) */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: "radial-gradient(circle at 30% 40%, rgba(88, 28, 135, 0.4) 0%, transparent 50%)",
          animation: "aurora-move 20s ease-in-out infinite",
        }}
      />
      <div
        className="absolute inset-0 opacity-25"
        style={{
          background: "radial-gradient(circle at 70% 60%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)",
          animation: "aurora-move 20s ease-in-out infinite",
          animationDelay: "5s",
        }}
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: "radial-gradient(circle at 50% 80%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)",
          animation: "aurora-move 20s ease-in-out infinite",
          animationDelay: "10s",
        }}
      />
      <div
        className="absolute inset-0 opacity-15"
        style={{
          background: "radial-gradient(circle at 20% 70%, rgba(99, 102, 241, 0.25) 0%, transparent 50%)",
          animation: "aurora-move 20s ease-in-out infinite",
          animationDelay: "15s",
        }}
      />

      {/* 浮かび上がる日本地図 */}
      <div
        className="absolute inset-0 opacity-0 animate-map-fade-in"
        style={{
          backgroundImage: "url(/images/japan-network-map.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* フォールバック: 画像が存在しない場合のグラデーション */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: "radial-gradient(circle at center, rgba(88, 28, 135, 0.2) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}
