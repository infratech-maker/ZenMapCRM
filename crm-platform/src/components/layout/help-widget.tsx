"use client";

import { useState } from "react";
import { HelpCircle, X, BookOpen, FileText, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReleaseNote } from "@/lib/changelog";

interface HelpWidgetProps {
  releaseNotes: ReleaseNote[];
}

export function HelpWidget({ releaseNotes }: HelpWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Markdownの簡易的な表示処理
  const formatMarkdown = (content: string): string => {
    // 見出しを太字に変換
    let formatted = content
      .replace(/^### (.+)$/gm, '**$1**')
      .replace(/^#### (.+)$/gm, '**$1**')
      // リストアイテムの処理
      .replace(/^\- (.+)$/gm, '• $1')
      .replace(/^\* (.+)$/gm, '• $1')
      // 太字の処理
      .replace(/\*\*(.+?)\*\*/g, '**$1**')
      // コードブロックの処理（簡易版）
      .replace(/```[\s\S]*?```/g, (match) => {
        return match.replace(/```/g, '').trim();
      })
      // インラインコードの処理
      .replace(/`([^`]+)`/g, '`$1`');

    return formatted;
  };

  // 改行を<br>に変換（簡易版）
  const renderContent = (content: string) => {
    const formatted = formatMarkdown(content);
    const lines = formatted.split('\n');
    
    return lines.map((line, index) => {
      // 空行の処理
      if (line.trim() === '') {
        return <br key={index} />;
      }

      // 太字の処理
      if (line.includes('**')) {
        const parts = line.split(/(\*\*.+?\*\*)/g);
        return (
          <p key={index} className="mb-2">
            {parts.map((part, partIndex) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={partIndex} className="font-semibold">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return <span key={partIndex}>{part}</span>;
            })}
          </p>
        );
      }

      // リストアイテムの処理
      if (line.trim().startsWith('•')) {
        return (
          <li key={index} className="ml-4 mb-1 list-disc">
            {line.trim().substring(1).trim()}
          </li>
        );
      }

      // 通常のテキスト
      return (
        <p key={index} className="mb-2 text-sm">
          {line}
        </p>
      );
    });
  };

  return (
    <>
      {/* ヘルプボタン（固定位置） */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-50 bg-indigo-600 hover:bg-indigo-700 text-white"
        size="icon"
        aria-label="ヘルプを開く"
      >
        <HelpCircle className="h-6 w-6" />
      </Button>

      {/* ヘルプダイアログ */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ヘルプ & サポート</DialogTitle>
            <DialogDescription>
              使い方や最新の更新情報を確認できます
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="updates" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="updates" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                更新履歴
              </TabsTrigger>
              <TabsTrigger value="help" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                使い方
              </TabsTrigger>
              <TabsTrigger value="support" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                サポート
              </TabsTrigger>
            </TabsList>

            {/* Updates タブ */}
            <TabsContent value="updates" className="space-y-4 mt-4">
              <div className="space-y-6">
                {releaseNotes.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    更新履歴がありません
                  </p>
                ) : (
                  releaseNotes.map((release, index) => (
                    <div
                      key={`${release.version}-${release.date}`}
                      className="border-b border-gray-200 pb-4 last:border-b-0"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Version {release.version}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {release.date}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 space-y-2">
                        {renderContent(release.content)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Help タブ */}
            <TabsContent value="help" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    基本的な使い方
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">•</span>
                      <span>
                        <strong>リード管理:</strong> サイドバーの「Action Inbox」からリードを確認・管理できます
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">•</span>
                      <span>
                        <strong>プロジェクト作成:</strong> AI検索結果からプロジェクトを作成し、営業リストを管理できます
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">•</span>
                      <span>
                        <strong>データ収集:</strong> Google MapsやUberEatsから店舗情報を自動収集できます
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">•</span>
                      <span>
                        <strong>組織切り替え:</strong> 複数の組織に所属している場合、ヘッダーから組織を切り替えられます
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            {/* Support タブ */}
            <TabsContent value="support" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    サポート情報
                  </h3>
                  <p className="text-sm text-gray-700 mb-4">
                    問題が発生した場合や質問がある場合は、以下の方法でお問い合わせください。
                  </p>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">•</span>
                      <span>
                        <strong>システム管理者:</strong> 組織のシステム管理者に連絡してください
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-indigo-600">•</span>
                      <span>
                        <strong>バグ報告:</strong> 問題が発生した場合は、スクリーンショットとエラーメッセージを添えて報告してください
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
