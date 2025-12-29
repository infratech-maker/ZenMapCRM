import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          統合CRMプラットフォーム
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          高度なBI機能を持つ統合CRMプラットフォームへようこそ
        </p>
        
        <div className="space-y-4">
          <Link href="/dashboard">
            <Button size="lg" className="w-full sm:w-auto">
              ダッシュボードを開く
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}


