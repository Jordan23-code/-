import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIサイト自動生成エンジン",
  description: "ヒアリング内容からAIが1ページサイトを自動生成するMVP",
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
