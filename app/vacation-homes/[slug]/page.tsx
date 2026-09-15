import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVacationHomeBySlug } from "@/lib/articles";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = getVacationHomeBySlug(params.slug);
  if (!article) return {};

  const avgMan = Math.round(article.stats.avgTradePrice / 10000).toLocaleString();
  const title = `${article.title} | 別荘・空き家リノベラボ(仮)`;
  const description = `${article.prefecture}${article.city}の空き家・別荘の相場データを解説。${article.year}年の取引件数${article.stats.count}件・平均価格${avgMan}万円を、国土交通省の公式データと宅建士の実務目線で分析。`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: article.heroImage ? [{ url: article.heroImage.url }] : undefined,
    },
  };
}

export default function VacationHomePage({ params }: { params: { slug: string } }) {
  const article = getVacationHomeBySlug(params.slug);
  if (!article) return notFound();

  const { stats } = article;

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow border border-slate-200 p-8">
        <Link href="/vacation-homes" className="text-sm text-slate-500 hover:underline">
          ← 別荘・空き家一覧に戻る
        </Link>

        <h1 className="text-2xl font-bold mt-4 mb-2">{article.title}</h1>
        <p className="text-sm text-slate-500 mb-4">
          {article.prefecture}
          {article.city} / {article.year}年{article.quarter ? `第${article.quarter}四半期` : ""}
        </p>

        {article.heroImage && (
          <figure className="mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.heroImage.url}
              alt={article.heroImage.alt}
              className="w-full h-56 object-cover rounded-lg"
            />
            <figcaption className="text-xs text-slate-400 mt-1">
              ※イメージ写真(特定の物件ではありません)。Photo by{" "}
              <a href={article.heroImage.photographerUrl} className="underline" target="_blank" rel="noopener noreferrer">
                {article.heroImage.photographer}
              </a>{" "}
              on{" "}
              <a href={article.heroImage.pageUrl} className="underline" target="_blank" rel="noopener noreferrer">
                Pexels
              </a>
            </figcaption>
          </figure>
        )}

        {article.sections.agentComment && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs font-bold text-amber-700 mb-1">🏡 宅建士コメント</p>
            <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-line">
              {article.sections.agentComment}
            </p>
          </div>
        )}

        <section className="mb-6">
          <h2 className="font-bold text-lg mb-2">空き家・別荘相場データ(国土交通省 不動産情報ライブラリより)</h2>
          <table className="w-full text-sm border-collapse">
            <tbody>
              <Row label="取引件数" value={`${stats.count}件`} />
              <Row label="平均取引価格" value={`${stats.avgTradePrice.toLocaleString()}円`} />
              <Row
                label="価格帯"
                value={`${stats.minTradePrice.toLocaleString()}円 〜 ${stats.maxTradePrice.toLocaleString()}円`}
              />
              <Row
                label="平均㎡単価"
                value={stats.avgUnitPrice != null ? `${stats.avgUnitPrice.toLocaleString()}円` : "データなし"}
              />
              {stats.sampleDistricts.length > 0 && (
                <Row label="主な地区" value={stats.sampleDistricts.join("、")} />
              )}
            </tbody>
          </table>
        </section>

        {article.byType && Object.keys(article.byType).length > 0 && (
          <section className="mb-6">
            <h2 className="font-bold text-lg mb-2">物件種別ごとの内訳</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-2">種別</th>
                  <th className="py-2 pr-2">件数</th>
                  <th className="py-2 pr-2">平均取引価格</th>
                  <th className="py-2">平均㎡単価</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(article.byType)
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([type, s]) => (
                    <tr key={type} className="border-b border-slate-100">
                      <td className="py-2 pr-2">{type}</td>
                      <td className="py-2 pr-2">{s.count}件</td>
                      <td className="py-2 pr-2">{Math.round(s.avgTradePrice / 10000).toLocaleString()}万円</td>
                      <td className="py-2">{s.avgUnitPrice != null ? `${s.avgUnitPrice.toLocaleString()}円` : "データなし"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>
        )}

        <Section title="相場の傾向">{article.sections.overview}</Section>

        {article.districtRanking && article.districtRanking.length > 0 && (
          <section className="mb-6">
            <h2 className="font-bold text-lg mb-2">人気地区ランキング(取引件数順)</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-2">順位</th>
                  <th className="py-2 pr-2">地区</th>
                  <th className="py-2 pr-2">取引件数</th>
                  <th className="py-2">平均取引価格</th>
                </tr>
              </thead>
              <tbody>
                {article.districtRanking.map((s, i) => (
                  <tr key={s.district} className="border-b border-slate-100">
                    <td className="py-2 pr-2">{i + 1}</td>
                    <td className="py-2 pr-2">{s.district}</td>
                    <td className="py-2 pr-2">{s.count}件</td>
                    <td className="py-2">{Math.round(s.avgTradePrice / 10000).toLocaleString()}万円</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {(article.ageBand || article.areaBand) && (
          <section className="mb-6 grid gap-6 sm:grid-cols-2">
            {article.ageBand && (
              <div>
                <h2 className="font-bold text-lg mb-2">築年数帯別の相場</h2>
                <table className="w-full text-sm border-collapse">
                  <tbody>
                    {Object.entries(article.ageBand).map(([label, s]) => (
                      <tr key={label} className="border-b border-slate-100">
                        <td className="py-2 pr-2 text-slate-500 whitespace-nowrap">{label}</td>
                        <td className="py-2 pr-2">{s.count}件</td>
                        <td className="py-2 font-medium">{Math.round(s.avgTradePrice / 10000).toLocaleString()}万円</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {article.areaBand && (
              <div>
                <h2 className="font-bold text-lg mb-2">面積帯別の相場</h2>
                <table className="w-full text-sm border-collapse">
                  <tbody>
                    {Object.entries(article.areaBand).map(([label, s]) => (
                      <tr key={label} className="border-b border-slate-100">
                        <td className="py-2 pr-2 text-slate-500 whitespace-nowrap">{label}</td>
                        <td className="py-2 pr-2">{s.count}件</td>
                        <td className="py-2 font-medium">{Math.round(s.avgTradePrice / 10000).toLocaleString()}万円</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {article.sections.propertyTrend && (
          <Section title="今、どんな空き家・別荘が動いているか">{article.sections.propertyTrend}</Section>
        )}

        {article.priceTrend && (
          <section className="mb-6">
            <h2 className="font-bold text-lg mb-2">
              価格推移({article.priceTrend.firstYear}〜{article.priceTrend.lastYear}年)
            </h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="py-2 pr-2">年</th>
                  <th className="py-2 pr-2">取引件数</th>
                  <th className="py-2">平均取引価格</th>
                </tr>
              </thead>
              <tbody>
                {article.priceTrend.trend.map((t) => (
                  <tr key={t.year} className="border-b border-slate-100">
                    <td className="py-2 pr-2">{t.year}年</td>
                    <td className="py-2 pr-2">{t.count}件</td>
                    <td className="py-2">
                      {t.avgTradePrice != null
                        ? `${Math.round(t.avgTradePrice / 10000).toLocaleString()}万円`
                        : "データなし"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-slate-500 mt-2">
              {article.priceTrend.firstYear}年→{article.priceTrend.lastYear}年で
              {Number(article.priceTrend.changePct) >= 0 ? "+" : ""}
              {article.priceTrend.changePct}%
            </p>
          </section>
        )}

        <Section title="賃貸に出す場合の表面利回り試算例">{article.sections.yieldSimulation}</Section>

        {article.sections.lowEntryPitch && (
          <section className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h2 className="font-bold text-lg mb-2 text-amber-800">セカンドハウス・DIYリノベを検討したい方へ</h2>
            <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-line">
              {article.sections.lowEntryPitch}
            </p>
          </section>
        )}

        <div className="my-8 p-6 border border-dashed border-amber-300 rounded-lg bg-amber-50 text-center">
          <p className="text-sm font-bold text-amber-800 mb-1">
            気になるエリアの空き家・別荘バンク情報をチェックしてみませんか?
          </p>
          <p className="text-xs text-amber-600 mb-3">
            自治体の空き家バンクや古民家専門の仲介サイトで、実際の物件を探せます
          </p>
          <div className="text-xs text-slate-400 border border-dashed border-slate-300 rounded p-3 bg-white">
            [ここにアフィリエイトバナー/リンクが入ります(ASP提携後に設置)]
          </div>
        </div>

        <Section title="初心者が確認しておきたいポイント">{article.sections.beginnerTips}</Section>

        <p className="text-xs text-slate-400 mt-8">
          出典: 国土交通省「不動産情報ライブラリ」公開データ({article.year}年
          {article.quarter ? `第${article.quarter}四半期` : ""}分)
        </p>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
          本記事は公開データに基づく一般的な情報提供を目的としており、特定の物件・購入判断を推奨するものではありません。リノベーションの可否・費用は物件ごとに大きく異なるため、実際の購入・改修に関する判断は、必ず現地確認及び宅地建物取引士・建築士等の専門家にご相談ください。
        </div>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-2 pr-4 text-slate-500 whitespace-nowrap">{label}</td>
      <td className="py-2 font-medium">{value}</td>
    </tr>
  );
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <section className="mb-6">
      <h2 className="font-bold text-lg mb-2">{title}</h2>
      <p className="text-slate-700 leading-relaxed whitespace-pre-line">{children}</p>
    </section>
  );
}
