import Link from "next/link";
import type { Metadata } from "next";
import { getAllApartmentArticles } from "@/lib/articles";

export const metadata: Metadata = {
  title: "アパート経営ラボ(仮) | エリア別 賃貸経営データ",
  description:
    "郊外エリアのアパート経営・賃貸経営に役立つ相場データを、国土交通省の公式データと宅建士の実務目線で解説します。",
};

export default function ApartmentManagementIndex() {
  const homes = getAllApartmentArticles();

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-indigo-950 text-white py-14 px-4 text-center">
        <p className="text-indigo-300 text-sm font-bold mb-2">空室リスクを抑えて安定収益を目指す賃貸経営視点</p>
        <h1 className="text-3xl font-bold mb-3">アパート経営ラボ(仮)</h1>
        <p className="text-indigo-100 max-w-xl mx-auto">
          郊外エリアのアパート経営・賃貸経営にテーマを絞り、国土交通省「不動産情報ライブラリ」の公式データと現役宅地建物取引士の実務目線で、賃貸需要や空室リスクの観点から相場を数字ベースに解説します。
        </p>
      </header>

      <section className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold mb-6">エリア別 賃貸経営データ</h2>

        {homes.length === 0 ? (
          <p className="text-slate-500 bg-white rounded-lg p-6 border border-slate-200">
            まだ記事がありません。
            <code className="bg-slate-100 px-2 py-1 rounded mx-1">
              node scripts/generate-apartment-article.mjs
            </code>
            を実行して記事を生成してください。
          </p>
        ) : (
          <div className="space-y-4">
            {homes.map((a) => (
              <Link
                key={a.slug}
                href={`/apartment-management/${a.slug}`}
                className="flex gap-4 bg-white rounded-lg p-5 border border-slate-200 hover:border-indigo-400 transition-colors"
              >
                {a.heroImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.heroImage.url}
                    alt={a.heroImage.alt}
                    className="w-28 h-20 sm:w-40 sm:h-28 object-cover rounded-md flex-shrink-0"
                  />
                )}
                <div>
                  <h3 className="font-bold text-lg mb-1">{a.title}</h3>
                  <p className="text-sm text-slate-500">
                    {a.prefecture}
                    {a.city} / {a.year}年{a.quarter ? `第${a.quarter}四半期` : ""} / 取引件数{" "}
                    {a.stats.count}件
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <footer className="text-center text-sm text-slate-400 py-8 space-x-4">
        <Link href="/" className="underline">
          郊外不動産投資ラボに戻る
        </Link>
        <Link href="/vacation-homes" className="underline">
          別荘・空き家リノベラボ
        </Link>
        <Link href="/about" className="underline">
          運営者情報・免責事項
        </Link>
      </footer>
    </main>
  );
}
