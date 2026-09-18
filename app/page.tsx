import Link from "next/link";
import { getAllArticles } from "@/lib/articles";

export default function Home() {
  const articles = getAllArticles();

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white py-14 px-4 text-center">
        <p className="text-emerald-400 text-sm font-bold mb-2">中古ワンルーム・築古物件で始める郊外不動産投資</p>
        <h1 className="text-3xl font-bold mb-3">郊外不動産投資ラボ(仮)</h1>
        <p className="text-slate-300 max-w-xl mx-auto">
          都心ではなく郊外・総額を抑えられる中古ワンルームや築古物件に絞り、国土交通省「不動産情報ライブラリ」の公式データと現役宅地建物取引士の実務目線で、今どんな物件が動いているかを数字ベースに解説します。
        </p>
      </header>

      <section className="max-w-3xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold mb-6">エリア別 相場記事</h2>

        {articles.length === 0 ? (
          <p className="text-slate-500 bg-white rounded-lg p-6 border border-slate-200">
            まだ記事がありません。
            <code className="bg-slate-100 px-2 py-1 rounded mx-1">
              node scripts/generate-article.mjs
            </code>
            を実行して記事を生成してください。
          </p>
        ) : (
          <div className="space-y-4">
            {articles.map((a) => (
              <Link
                key={a.slug}
                href={`/articles/${a.slug}`}
                className="flex gap-4 bg-white rounded-lg p-5 border border-slate-200 hover:border-slate-400 transition-colors"
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
        <Link href="/vacation-homes" className="underline">
          別荘・空き家リノベラボはこちら
        </Link>
        <Link href="/apartment-management" className="underline">
          アパート経営ラボはこちら
        </Link>
        <Link href="/about" className="underline">
          運営者情報・免責事項
        </Link>
      </footer>
    </main>
  );
}
