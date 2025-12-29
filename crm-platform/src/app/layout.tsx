import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "統合CRMプラットフォーム",
  description: "高度なBI機能を持つ統合CRMプラットフォーム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}


