import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "運営者情報・免責事項 | 郊外不動産投資ラボ(仮)",
  description:
    "郊外不動産投資ラボ(仮)の運営者情報、データの出典、免責事項、広告に関する開示情報です。",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow border border-slate-200 p-8">
        <Link href="/" className="text-sm text-slate-500 hover:underline">
          ← トップに戻る
        </Link>

        <h1 className="text-2xl font-bold mt-4 mb-6">運営者情報・免責事項</h1>

        <section className="mb-6">
          <h2 className="font-bold text-lg mb-2">運営者について</h2>
          {/* TODO: 実際の運営者名・宅建登録情報などをここに記載してください */}
          <p className="text-slate-700 leading-relaxed">
            当サイトは、宅地建物取引士資格保有者が運営しています。都心の高額物件ではなく、中古ワンルームや築古物件など総額を抑えて始めやすい郊外エリアの不動産投資にテーマを絞り、実務目線でのコメントを交えながら情報を発信しています。
          </p>
        </section>

        <section className="mb-6">
          <h2 className="font-bold text-lg mb-2">データについて</h2>
          <p className="text-slate-700 leading-relaxed">
            当サイトに掲載する取引価格・相場データは、国土交通省「不動産情報ライブラリ」が公開する情報を基にAIが集計・記事化したものです。個別の物件情報や将来の価格変動を保証するものではありません。
          </p>
        </section>

        <section className="mb-6">
          <h2 className="font-bold text-lg mb-2">免責事項</h2>
          <p className="text-slate-700 leading-relaxed">
            当サイトの情報は一般的な情報提供を目的としており、特定の投資判断を推奨・保証するものではありません。不動産投資には価格変動・空室・災害等のリスクが伴います。実際の投資・契約に関する判断は、必ずご自身の責任において、最新の公的情報の確認及び宅地建物取引士・税理士等の専門家への相談の上で行ってください。当サイトの情報を用いて生じたいかなる損害についても、運営者は責任を負いかねます。
          </p>
        </section>

        <section>
          <h2 className="font-bold text-lg mb-2">広告について</h2>
          <p className="text-slate-700 leading-relaxed">
            当サイトは、アフィリエイトプログラムによる収益を得ています。紹介する企業・サービスは、当サイトの独自の基準で検討していますが、リンク先の内容についてはご自身でもご確認ください。
          </p>
        </section>
      </div>
    </main>
  );
}
