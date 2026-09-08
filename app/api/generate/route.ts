import { NextRequest, NextResponse } from "next/server";
import type { SiteBrief, SiteContent, GenerateResponse } from "@/lib/types";

// 使用するモデル。エラーが出る場合は https://docs.claude.com/en/docs/about-claude/models
// で現在利用可能なモデルIDを確認し、.env.local の ANTHROPIC_MODEL で上書きしてください。
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";

function buildPrompt(brief: SiteBrief): string {
  return `あなたはプロのWEBサイトコピーライター兼デザイナーです。
以下の顧客ヒアリング内容から、1ページ構成のビジネスサイトの内容を作成してください。

【ヒアリング内容】
- 事業者名: ${brief.businessName}
- 業種: ${brief.industry}
- 事業内容の説明: ${brief.description}
- 希望する雰囲気/トーン: ${brief.tone}
- 希望する配色イメージ: ${brief.colorPreference}
- 電話番号: ${brief.phone}
- 住所: ${brief.address}

以下のJSON形式のみを出力してください。説明文やマークダウンのコードブロックは不要です。JSON以外の文字は出力しないでください。

{
  "heroTitle": "サイト冒頭の見出し(20文字程度)",
  "heroSubtitle": "見出しを補足する1文",
  "aboutText": "事業紹介文(150文字程度)",
  "services": [
    { "title": "サービス名1", "description": "説明(50文字程度)" },
    { "title": "サービス名2", "description": "説明(50文字程度)" },
    { "title": "サービス名3", "description": "説明(50文字程度)" }
  ],
  "ctaText": "問い合わせを促す一言",
  "primaryColor": "希望配色に合う16進数カラーコード(例: #2563eb)",
  "accentColor": "primaryColorと相性の良いアクセントカラーの16進数コード"
}`;
}

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("AIの応答からJSONを抽出できませんでした");
  }
  return JSON.parse(text.slice(start, end + 1));
}

function isValidSiteContent(value: unknown): value is SiteContent {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.heroTitle === "string" &&
    typeof v.heroSubtitle === "string" &&
    typeof v.aboutText === "string" &&
    Array.isArray(v.services) &&
    typeof v.ctaText === "string" &&
    typeof v.primaryColor === "string" &&
    typeof v.accentColor === "string"
  );
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json<GenerateResponse>(
      { ok: false, error: "ANTHROPIC_API_KEY が設定されていません(.env.local を確認してください)" },
      { status: 500 }
    );
  }

  let brief: SiteBrief;
  try {
    brief = await req.json();
  } catch {
    return NextResponse.json<GenerateResponse>(
      { ok: false, error: "リクエストの形式が不正です" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [{ role: "user", content: buildPrompt(brief) }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json<GenerateResponse>(
        { ok: false, error: `Anthropic API エラー (${res.status}): ${errText}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const textBlock = data?.content?.[0]?.text ?? "";
    const parsed = extractJson(textBlock);

    if (!isValidSiteContent(parsed)) {
      return NextResponse.json<GenerateResponse>(
        { ok: false, error: "AIの応答が期待した形式ではありませんでした" },
        { status: 502 }
      );
    }

    return NextResponse.json<GenerateResponse>({ ok: true, content: parsed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "不明なエラー";
    return NextResponse.json<GenerateResponse>({ ok: false, error: message }, { status: 500 });
  }
}
