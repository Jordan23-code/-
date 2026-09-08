"use client";

import { useState } from "react";
import type { SiteBrief, SiteContent } from "@/lib/types";
import { generateStaticHtml } from "@/lib/generateStaticHtml";

const initialBrief: SiteBrief = {
  businessName: "",
  industry: "",
  description: "",
  tone: "誠実で親しみやすい",
  colorPreference: "青系",
  phone: "",
  address: "",
};

export default function Home() {
  const [brief, setBrief] = useState<SiteBrief>(initialBrief);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<SiteContent | null>(null);

  const update = (key: keyof SiteBrief, value: string) => {
    setBrief((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setContent(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(brief),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error);
      } else {
        setContent(data.content);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!content) return;
    const html = generateStaticHtml(brief, content);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${brief.businessName || "site"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">AIサイト自動生成エンジン(MVP)</h1>
        <p className="text-slate-600 mb-8">
          ヒアリング内容を入力すると、AIが1ページサイトの構成・文章を自動生成します。
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
          <Field label="事業者名">
            <input
              required
              className="input"
              value={brief.businessName}
              onChange={(e) => update("businessName", e.target.value)}
              placeholder="例: カフェ・ソレイユ"
            />
          </Field>
          <Field label="業種">
            <input
              required
              className="input"
              value={brief.industry}
              onChange={(e) => update("industry", e.target.value)}
              placeholder="例: カフェ、工務店、整体院..."
            />
          </Field>
          <Field label="事業内容の説明">
            <textarea
              required
              className="input min-h-[96px]"
              value={brief.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="どんな商品・サービスを、誰に向けて提供しているか"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="希望する雰囲気">
              <input
                className="input"
                value={brief.tone}
                onChange={(e) => update("tone", e.target.value)}
              />
            </Field>
            <Field label="希望する配色イメージ">
              <input
                className="input"
                value={brief.colorPreference}
                onChange={(e) => update("colorPreference", e.target.value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="電話番号">
              <input
                className="input"
                value={brief.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="03-xxxx-xxxx"
              />
            </Field>
            <Field label="住所">
              <input
                className="input"
                value={brief.address}
                onChange={(e) => update("address", e.target.value)}
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white rounded-lg py-3 font-semibold disabled:opacity-50"
          >
            {loading ? "生成中..." : "サイトを自動生成する"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
            {error}
          </p>
        )}

        {content && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">プレビュー</h2>
              <button
                onClick={handleDownload}
                className="text-sm bg-white border border-slate-300 rounded-lg px-4 py-2 font-semibold hover:bg-slate-100"
              >
                納品用HTMLをダウンロード
              </button>
            </div>
            <Preview brief={brief} content={content} />
          </div>
        )}
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1">{label}</span>
      {children}
    </label>
  );
}

function Preview({ brief, content }: { brief: SiteBrief; content: SiteContent }) {
  return (
    <div className="rounded-xl overflow-hidden shadow border border-slate-200 bg-white">
      <div
        className="px-8 py-16 text-center text-white"
        style={{
          background: `linear-gradient(135deg, ${content.primaryColor}, ${content.accentColor})`,
        }}
      >
        <h1 className="text-3xl font-bold mb-3">{content.heroTitle}</h1>
        <p className="opacity-90">{content.heroSubtitle}</p>
      </div>

      <div className="px-8 py-10">
        <h2 className="text-xl font-bold mb-3" style={{ color: content.primaryColor }}>
          {brief.businessName}について
        </h2>
        <p className="text-slate-700 leading-relaxed">{content.aboutText}</p>
      </div>

      <div className="px-8 py-10 bg-slate-50">
        <h2 className="text-xl font-bold mb-4" style={{ color: content.primaryColor }}>
          サービス
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {content.services.map((s, i) => (
            <div key={i} className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-slate-600">{s.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-8 py-10 text-center bg-white">
        <h2 className="text-lg font-bold mb-4" style={{ color: content.primaryColor }}>
          {content.ctaText}
        </h2>
        <span
          className="inline-block text-white rounded-lg px-6 py-3 font-semibold"
          style={{ backgroundColor: content.primaryColor }}
        >
          {brief.phone || "電話番号未入力"}
        </span>
      </div>
    </div>
  );
}
