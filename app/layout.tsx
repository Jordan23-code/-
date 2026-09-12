import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "郊外不動産投資ラボ(仮)",
  description:
    "中古ワンルーム・築古物件など、総額を抑えて始めやすい郊外の高利回り不動産投資を、国土交通省の公式データと宅建士の実務目線で解説するメディア",
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
