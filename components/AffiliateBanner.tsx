// アフィリエイトリンク設置用のプレースホルダー。
// ASP(A8.net等)の提携審査が通ったら、CTA文言・見出しはそのまま活かし、
// 中の [ここに...] 部分だけ実際のリンク・バナーコードに差し替える。
export default function AffiliateBanner() {
  return (
    <div className="my-8 p-6 border border-dashed border-emerald-300 rounded-lg bg-emerald-50 text-center">
      <p className="text-sm font-bold text-emerald-800 mb-1">
        総額を抑えて始められる高利回り物件、今の条件で探してみませんか?
      </p>
      <p className="text-xs text-emerald-600 mb-3">
        中古ワンルーム・築古物件を中心に、無料で条件検索・資料請求ができます
      </p>
      <div className="text-xs text-slate-400 border border-dashed border-slate-300 rounded p-3 bg-white">
        [ここにアフィリエイトバナー/リンクが入ります(ASP提携後に設置)]
      </div>
    </div>
  );
}
