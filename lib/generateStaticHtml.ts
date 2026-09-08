import type { SiteBrief, SiteContent } from "./types";

// 生成結果を、納品用の単一HTMLファイルとして書き出す
export function generateStaticHtml(brief: SiteBrief, content: SiteContent): string {
  const servicesHtml = content.services
    .map(
      (s) => `
        <div style="flex:1;min-width:220px;padding:24px;border-radius:12px;background:#f8fafc;">
          <h3 style="margin:0 0 8px;font-size:18px;color:${content.primaryColor};">${escapeHtml(s.title)}</h3>
          <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">${escapeHtml(s.description)}</p>
        </div>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(brief.businessName)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin:0; font-family: -apple-system, "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif; color:#0f172a; }
  .wrap { max-width: 960px; margin: 0 auto; padding: 0 24px; }
  header.hero { background: linear-gradient(135deg, ${content.primaryColor}, ${content.accentColor}); color: #fff; padding: 96px 0 72px; text-align: center; }
  header.hero h1 { margin:0 0 16px; font-size: 36px; }
  header.hero p { margin:0; font-size: 18px; opacity:.92; }
  section { padding: 64px 0; }
  section h2 { font-size: 24px; margin: 0 0 24px; color: ${content.primaryColor}; }
  .services { display:flex; gap:20px; flex-wrap:wrap; }
  footer { background:#0f172a; color:#cbd5e1; text-align:center; padding:40px 0; font-size:14px; }
  footer a { color:#fff; }
  .cta { text-align:center; padding: 56px 0; background:#f1f5f9; }
  .cta h2 { color:${content.primaryColor}; }
  .cta a.button { display:inline-block; margin-top:16px; background:${content.primaryColor}; color:#fff; padding:14px 32px; border-radius:8px; text-decoration:none; font-weight:bold; }
</style>
</head>
<body>
  <header class="hero">
    <div class="wrap">
      <h1>${escapeHtml(content.heroTitle)}</h1>
      <p>${escapeHtml(content.heroSubtitle)}</p>
    </div>
  </header>

  <section>
    <div class="wrap">
      <h2>${escapeHtml(brief.businessName)}について</h2>
      <p style="line-height:1.8;color:#334155;">${escapeHtml(content.aboutText)}</p>
    </div>
  </section>

  <section style="background:#fff;">
    <div class="wrap">
      <h2>サービス</h2>
      <div class="services">
        ${servicesHtml}
      </div>
    </div>
  </section>

  <div class="cta">
    <div class="wrap">
      <h2>${escapeHtml(content.ctaText)}</h2>
      <a class="button" href="tel:${escapeHtml(brief.phone)}">${escapeHtml(brief.phone)} に電話する</a>
    </div>
  </div>

  <footer>
    <div class="wrap">
      <p>${escapeHtml(brief.businessName)} / ${escapeHtml(brief.address)} / ${escapeHtml(brief.phone)}</p>
    </div>
  </footer>
</body>
</html>`;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
