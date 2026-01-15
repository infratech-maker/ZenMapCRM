import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 sm:px-8 sm:py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-8 w-8 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-purple-600 blur opacity-40 animate-pulse" />
            <div className="relative h-6 w-6 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 shadow-inner" />
          </div>
          <span className="font-bold text-xl sm:text-2xl tracking-widest text-white">
            Zen-Map
          </span>
        </div>
        <Link href="/login">
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 hover:border-white/30"
          >
            Sign In
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background with radial gradient - creates a "map emerging" effect */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at center, rgb(15 23 42) 0%, rgb(2 6 23) 50%, rgb(2 6 23) 100%)',
          }}
        />
        
        {/* Background image overlay (if exists) */}
        <div className="absolute inset-0 opacity-20">
          {/* 画像が存在する場合は表示、存在しない場合はグラデーション */}
          <div className="relative w-full h-full">
            {/* 背景画像: 画像が存在する場合は表示 */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: 'url(/images/japan-network-map.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            {/* フォールバック: 画像が存在しない場合のグラデーション */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(circle at center, rgba(88, 28, 135, 0.2) 0%, transparent 70%)',
              }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Catch Copy */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-wide mb-6 leading-tight">
            47都道府県を、
            <br />
            あなたの市場に変える
          </h1>

          {/* Sub Copy */}
          <p className="text-base sm:text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Zen-Mapは、全国展開を目指す御社の市場拡大を加速させる、
            <br className="hidden sm:block" />
            デリバリーデータ起点の営業リスト自動生成ツールです。
          </p>

          {/* CTA Button */}
          <Link href="/dashboard">
            <Button
              size="lg"
              className="h-12 px-8 text-base sm:text-lg bg-white text-slate-950 hover:bg-slate-100 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300 font-semibold"
            >
              ダッシュボードを開く
            </Button>
          </Link>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-4 sm:px-8 text-center text-sm text-slate-500 border-t border-slate-900/50">
        <p>© 2026 Zen-Map. All rights reserved.</p>
      </footer>
    </div>
  );
}
