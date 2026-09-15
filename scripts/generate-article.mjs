#!/usr/bin/env node
// 郊外不動産投資メディア: 国交省「不動産情報ライブラリ」の実データを取得し、
// ローカルLLM(Ollama)で記事を自動生成して content/articles/ に保存するスクリプト。
//
// 使い方:
//   node scripts/generate-article.mjs --pref 13 --city 13211 --cityName 小平市 --pref-name 東京都 --year 2024
//
// 事前に .env.local に REINFOLIB_API_KEY を設定しておくこと
// (https://www.reinfolib.mlit.go.jp/api/request/ で個人申請可能・無料)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ---- .env.local を手動で読み込む(dotenvパッケージを使わないための簡易実装) ----
function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvLocal();

// ---- コマンドライン引数のパース ----
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      args[key] = value;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const PREF_CODE = args.pref || "13"; // 東京都
const PREF_NAME = args["pref-name"] || "東京都";
const CITY_CODE = args.city; // 例: 13211(小平市)
const CITY_NAME = args.cityName;
const YEAR = args.year || String(new Date().getFullYear() - 1); // デフォルトは前年
const QUARTER = args.quarter; // 省略可(1-4)

if (!CITY_CODE || !CITY_NAME) {
  console.error(
    "エラー: --city (市区町村コード) と --cityName (市区町村名) は必須です。\n" +
      "例: node scripts/generate-article.mjs --pref 13 --pref-name 東京都 --city 13211 --cityName 小平市 --year 2024"
  );
  process.exit(1);
}

const REINFOLIB_API_KEY = process.env.REINFOLIB_API_KEY;
if (!REINFOLIB_API_KEY) {
  console.error(
    "エラー: REINFOLIB_API_KEY が設定されていません。.env.local に追加してください。\n" +
      "(申請: https://www.reinfolib.mlit.go.jp/api/request/)"
  );
  process.exit(1);
}

// Gemini API(無料枠)を使用。https://aistudio.google.com/apikey でキー取得(無料・カード登録不要)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
if (!GEMINI_API_KEY) {
  console.error(
    "エラー: GEMINI_API_KEY が設定されていません。.env.local に追加してください。\n" +
      "(取得: https://aistudio.google.com/apikey で無料発行)"
  );
  process.exit(1);
}

// 記事のイメージ写真用(任意設定)。Pexels(無料・審査不要・カード登録不要)
// https://www.pexels.com/api/ でキー取得。未設定の場合は画像なしで記事を生成する。
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

// 実在の特定物件を写した写真ではなく、あくまで街並みの一般的なイメージ写真を使う
// (特定物件を推奨しているという誤解を避けるため)。
async function fetchHeroImage(cityName) {
  if (!PEXELS_API_KEY) return null;

  const queries = [
    "japan suburban residential street",
    "tokyo residential neighborhood houses",
    "japan town street houses",
    "japan apartment building street",
  ];
  // エリアごとに少し違う写真になるよう、市区町村名からクエリを決定的に選ぶ
  let hash = 0;
  for (const ch of cityName) hash = (hash * 31 + ch.charCodeAt(0)) % queries.length;
  const query = queries[hash];

  try {
    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", "1");
    url.searchParams.set("orientation", "landscape");

    const res = await fetch(url, {
      headers: { Authorization: PEXELS_API_KEY },
    });
    if (!res.ok) {
      console.warn(`  (画像取得をスキップ: Pexels APIエラー ${res.status})`);
      return null;
    }
    const json = await res.json();
    const photo = json?.photos?.[0];
    if (!photo) return null;

    return {
      url: photo.src?.large2x || photo.src?.large || photo.src?.original,
      alt: `${cityName}のイメージ写真(実際の物件ではありません)`,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      pageUrl: photo.url,
    };
  } catch (err) {
    console.warn(`  (画像取得をスキップ: ${err.message})`);
    return null;
  }
}

// ---- 1. 不動産情報ライブラリAPIから取引価格データを取得 ----
async function fetchTransactionData() {
  const url = new URL("https://www.reinfolib.mlit.go.jp/ex-api/external/XIT001");
  url.searchParams.set("year", YEAR);
  url.searchParams.set("area", PREF_CODE);
  url.searchParams.set("city", CITY_CODE);
  if (QUARTER) url.searchParams.set("quarter", QUARTER);

  const res = await fetch(url, {
    headers: { "Ocp-Apim-Subscription-Key": REINFOLIB_API_KEY },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`不動産情報ライブラリAPIエラー (${res.status}): ${text}`);
  }

  const json = await res.json();
  const records = json?.data ?? json ?? [];
  if (!Array.isArray(records) || records.length === 0) {
    throw new Error(
      "取引データが0件でした。年・エリアの指定を変えて再実行してください(四半期を絞りすぎている可能性があります)。"
    );
  }
  return records;
}

// ---- 2. 統計値を計算(数値の書式化はAIに任せず、必ずプログラム側で行う) ----
function toManYen(yen) {
  return Math.round(yen / 10000).toLocaleString() + "万円";
}

function summarize(records) {
  const prices = records
    .map((r) => Number(r.TradePrice))
    .filter((n) => Number.isFinite(n) && n > 0);
  const unitPrices = records
    .map((r) => Number(r.UnitPrice))
    .filter((n) => Number.isFinite(n) && n > 0);

  const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);

  return {
    count: records.length,
    avgTradePrice: avg(prices),
    minTradePrice: prices.length ? Math.min(...prices) : 0,
    maxTradePrice: prices.length ? Math.max(...prices) : 0,
    // ㎡単価は土地取引にしか入っていないことが多いデータ仕様のため、
    // 該当データが無い場合は 0円 ではなく null(データなし)にする
    avgUnitPrice: unitPrices.length ? avg(unitPrices) : null,
    sampleDistricts: [...new Set(records.map((r) => r.DistrictName).filter(Boolean))].slice(0, 8),
  };
}

// 物件種別(中古マンション等・中古戸建・土地など)ごとに分けて集計する。
// 種類を分けずに全部まとめると、大型の土地取引などに平均が引っ張られて実態と違う数字になるため。
function summarizeByType(records) {
  const groups = {};
  for (const r of records) {
    const type = r.Type || "不明";
    (groups[type] ??= []).push(r);
  }
  const result = {};
  for (const [type, recs] of Object.entries(groups)) {
    result[type] = summarize(recs);
  }
  return result;
}

// 表面利回りの試算はAIに計算させず、ここで確定計算する(小規模LLMは桁数の多い計算を誤りやすいため)。
function computeYieldSimulation(byType) {
  // 賃貸経営の実感に近い種別を優先して選ぶ(無ければ件数最多の種別)
  const preferred = ["中古マンション等", "中古戸建", "宅地(土地と建物)"];
  let targetType = preferred.find((t) => byType[t] && byType[t].count > 0);
  if (!targetType) {
    targetType = Object.entries(byType).sort((a, b) => b[1].count - a[1].count)[0]?.[0];
  }
  if (!targetType) return null;

  const stats = byType[targetType];
  const assumedMonthlyRent = Math.round((stats.avgTradePrice * 0.005) / 1000) * 1000; // 千円単位に丸める
  const annualRent = assumedMonthlyRent * 12;
  const yieldPct = ((annualRent / stats.avgTradePrice) * 100).toFixed(1);

  return {
    targetType,
    avgTradePrice: stats.avgTradePrice,
    assumedMonthlyRent,
    annualRent,
    yieldPct,
  };
}

// 「どんな物件が動いているか」を示すため、地区(DistrictName)ごとの取引件数・相場をランキング化する。
// (このAPI(不動産取引価格情報)には最寄駅のフィールドが存在しないため、地区名で代替する)
function summarizeByDistrict(records) {
  const groups = {};
  for (const r of records) {
    const district = (r.DistrictName || "").toString().trim();
    if (!district) continue;
    (groups[district] ??= []).push(r);
  }
  const entries = Object.entries(groups);
  if (entries.length === 0) return null;

  const ranking = entries
    .map(([district, recs]) => {
      const s = summarize(recs);
      return { district, count: s.count, avgTradePrice: s.avgTradePrice };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return ranking;
}

// 建築年(和暦・西暦どちらの表記にも対応)を西暦の数値に変換する。
function parseBuildingYear(raw) {
  if (!raw) return null;
  const text = String(raw);
  const western = text.match(/(19|20)\d{2}/);
  if (western) return Number(western[0]);
  const eraBase = { 令和: 2018, 平成: 1988, 昭和: 1925, 大正: 1911, 明治: 1867 };
  for (const [era, base] of Object.entries(eraBase)) {
    if (text.includes(`${era}元年`)) return base + 1;
    const m = text.match(new RegExp(`${era}(\\d+)年`));
    if (m) return base + Number(m[1]);
  }
  return null;
}

// 築年数帯(築5年以内・6〜15年・16〜25年・26年以上)ごとの相場を集計する。
// 建築年データが十分に取れない年・エリアもあるため、有効データが少なすぎる場合はnullを返す。
function summarizeByAgeBand(records, tradeYear) {
  const bands = [
    { label: "築5年以内", min: 0, max: 5, records: [] },
    { label: "築6〜15年", min: 6, max: 15, records: [] },
    { label: "築16〜25年", min: 16, max: 25, records: [] },
    { label: "築26年以上", min: 26, max: Infinity, records: [] },
  ];
  let matched = 0;
  for (const r of records) {
    const builtYear = parseBuildingYear(r.BuildingYear);
    if (!builtYear) continue;
    const age = Number(tradeYear) - builtYear;
    if (age < 0) continue;
    const band = bands.find((b) => age >= b.min && age <= b.max);
    if (band) {
      band.records.push(r);
      matched++;
    }
  }
  if (matched < records.length * 0.2) return null;

  const result = {};
  for (const b of bands) {
    if (b.records.length > 0) result[b.label] = summarize(b.records);
  }
  return Object.keys(result).length > 0 ? result : null;
}

// 面積帯(ワンルーム〜広めのファミリー向けまで)ごとの相場を集計する。
function summarizeByAreaBand(records) {
  const bands = [
    { label: "〜30㎡(ワンルーム)", min: 0, max: 30, records: [] },
    { label: "30〜50㎡(コンパクト)", min: 30, max: 50, records: [] },
    { label: "50〜80㎡(ファミリー)", min: 50, max: 80, records: [] },
    { label: "80㎡〜(広め)", min: 80, max: Infinity, records: [] },
  ];
  let matched = 0;
  for (const r of records) {
    const area = Number(r.Area);
    if (!Number.isFinite(area) || area <= 0) continue;
    const band = bands.find((b) => area > b.min && area <= b.max);
    if (band) {
      band.records.push(r);
      matched++;
    }
  }
  if (matched < records.length * 0.2) return null;

  const result = {};
  for (const b of bands) {
    if (b.records.length > 0) result[b.label] = summarize(b.records);
  }
  return Object.keys(result).length > 0 ? result : null;
}

// 過去数年分のデータを取得し、価格が上昇/下落しているかのトレンドを見る。
async function fetchTransactionDataForYear(year) {
  const url = new URL("https://www.reinfolib.mlit.go.jp/ex-api/external/XIT001");
  url.searchParams.set("year", String(year));
  url.searchParams.set("area", PREF_CODE);
  url.searchParams.set("city", CITY_CODE);
  try {
    const res = await fetch(url, {
      headers: { "Ocp-Apim-Subscription-Key": REINFOLIB_API_KEY },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const records = json?.data ?? json ?? [];
    return Array.isArray(records) ? records : [];
  } catch {
    return [];
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 直近数年分(現在の年を含む)の平均取引価格を年ごとに算出する。
// 対象種別(targetType)が指定されていればその種別、無ければ全体平均で見る。
async function computePriceTrend(currentRecords, targetType, years = 4) {
  const baseYear = Number(YEAR);
  const trend = [];
  for (let i = years - 1; i >= 0; i--) {
    const y = baseYear - i;
    const recs = y === baseYear ? currentRecords : await fetchTransactionDataForYear(y);
    if (y !== baseYear) await sleep(300); // APIへの負荷を抑えるための小休止

    if (recs.length === 0) {
      trend.push({ year: y, count: 0, avgTradePrice: null });
      continue;
    }
    const byType = summarizeByType(recs);
    const stats = (targetType && byType[targetType]) || summarize(recs);
    trend.push({ year: y, count: stats.count, avgTradePrice: stats.avgTradePrice || null });
  }
  return trend;
}

// 「総額を抑えて始めやすい区分」を実データから探す(利回り%を水増しするのではなく、
// 実際の平均価格が低い区分を示すことで高利回り志向・初期費用を抑えたい読者に訴求する)。
function findLowEntryOption(ageBand, areaBand) {
  const candidates = [];
  if (ageBand) {
    for (const [label, s] of Object.entries(ageBand)) {
      candidates.push({ source: "築年数帯", label, count: s.count, avgTradePrice: s.avgTradePrice });
    }
  }
  if (areaBand) {
    for (const [label, s] of Object.entries(areaBand)) {
      candidates.push({ source: "面積帯", label, count: s.count, avgTradePrice: s.avgTradePrice });
    }
  }
  // 極端に少ない件数(参考にならない)は除外
  const viable = candidates.filter((c) => c.count >= 10);
  if (viable.length === 0) return null;
  return viable.sort((a, b) => a.avgTradePrice - b.avgTradePrice)[0];
}

function describeTrend(trend) {
  const valid = trend.filter((t) => t.avgTradePrice);
  if (valid.length < 2) return null;
  const first = valid[0];
  const last = valid[valid.length - 1];
  const changePct = (((last.avgTradePrice - first.avgTradePrice) / first.avgTradePrice) * 100).toFixed(1);
  return { trend, firstYear: first.year, lastYear: last.year, changePct };
}

// ---- 3. Gemini APIで記事本文を生成(数値はすべて事前計算済みの文字列を渡し、AIには「執筆」だけさせる) ----
async function generateSections(stats, byType, yieldSim, districtRanking, ageBand, areaBand, priceTrend, lowEntry) {
  const typeBreakdownText = Object.entries(byType)
    .sort((a, b) => b[1].count - a[1].count)
    .map(
      ([type, s]) =>
        `- ${type}: ${s.count}件, 平均${toManYen(s.avgTradePrice)}, ㎡単価平均${
          s.avgUnitPrice != null ? s.avgUnitPrice.toLocaleString() + "円" : "データなし(この種別では㎡単価が記録されていません)"
        }`
    )
    .join("\n");

  const yieldText = yieldSim
    ? `対象種別「${yieldSim.targetType}」の平均取引価格${toManYen(
        yieldSim.avgTradePrice
      )}を基に、仮に月額家賃を価格の0.5%(${yieldSim.assumedMonthlyRent.toLocaleString()}円)と仮定すると、年間家賃収入は${yieldSim.annualRent.toLocaleString()}円となり、表面利回りは約${
        yieldSim.yieldPct
      }%になる(${yieldSim.annualRent.toLocaleString()} ÷ ${yieldSim.avgTradePrice.toLocaleString()} × 100 ≒ ${yieldSim.yieldPct}%)。`
    : "この年のデータでは利回り試算に十分な件数がありませんでした。";

  const districtText = districtRanking
    ? districtRanking
        .map((s, i) => `${i + 1}位 ${s.district}: ${s.count}件, 平均${toManYen(s.avgTradePrice)}`)
        .join("\n")
    : "この年のデータでは地区の情報が十分に取得できませんでした。";

  const ageBandText = ageBand
    ? Object.entries(ageBand)
        .map(([label, s]) => `- ${label}: ${s.count}件, 平均${toManYen(s.avgTradePrice)}`)
        .join("\n")
    : "この年のデータでは築年数の情報が十分に取得できませんでした。";

  const areaBandText = areaBand
    ? Object.entries(areaBand)
        .map(([label, s]) => `- ${label}: ${s.count}件, 平均${toManYen(s.avgTradePrice)}`)
        .join("\n")
    : "この年のデータでは面積の情報が十分に取得できませんでした。";

  const trendText = priceTrend
    ? `${priceTrend.firstYear}年から${priceTrend.lastYear}年にかけて、平均取引価格は${
        priceTrend.changePct >= 0 ? "+" : ""
      }${priceTrend.changePct}%${priceTrend.changePct >= 0 ? "上昇" : "下落"}している(年別推移: ${priceTrend.trend
        .map((t) => `${t.year}年=${t.avgTradePrice != null ? toManYen(t.avgTradePrice) : "データなし"}`)
        .join("、")})。`
    : "複数年の価格推移を判断できるだけのデータが揃いませんでした。";

  const lowEntryText = lowEntry
    ? `${lowEntry.source}「${lowEntry.label}」は${lowEntry.count}件の取引があり、平均取引価格は${toManYen(
        lowEntry.avgTradePrice
      )}と、他の区分より総投資額を抑えやすい水準になっている(利回り%が他区分より高いという意味ではなく、あくまで総額が低いという事実)。`
    : "総額を抑えられる区分を判断できるだけのデータが揃いませんでした。";

  const prompt = `あなたは宅地建物取引士監修のもとで記事を書く、不動産投資メディアの専門ライターです。読者は「中古ワンルームや築古物件など、総額を抑えて始めやすい高利回り志向の郊外不動産投資」に関心がある投資家です。
以下は国土交通省「不動産情報ライブラリ」の公式データを集計した統計と、既に確定計算済みの数値です。
【重要】数値の計算や桁数の変換は絶対に自分で行わないでください。以下に示す数値・文章を、変更せずそのまま本文に使ってください。あなたの役割は「文章を整えて説明を加えること」だけです。
【重要】利回り(%)は物件種別や築年数によって実際に差があるというデータはありません(このシミュレーションは一律の家賃想定に基づく一例のため)。「築古の方が利回りが高い」のような表現は絶対に使わないでください。総投資額(価格)が低いという事実のみを根拠にしてください。

【対象エリア】${PREF_NAME}${CITY_NAME}
【対象年】${YEAR}年${QUARTER ? `第${QUARTER}四半期` : ""}
【全体集計】
- 取引件数: ${stats.count}件
- 平均取引価格: ${toManYen(stats.avgTradePrice)}
- 価格帯: ${toManYen(stats.minTradePrice)} 〜 ${toManYen(stats.maxTradePrice)}
- 平均㎡単価: ${stats.avgUnitPrice != null ? stats.avgUnitPrice.toLocaleString() + "円" : "データなし"}
- 主な地区: ${stats.sampleDistricts.join("、") || "データなし"}

【物件種別ごとの内訳(この数字をそのまま使うこと)】
${typeBreakdownText}

【人気地区ランキング(取引件数が多い順、この数字をそのまま使うこと)】
${districtText}

【築年数帯ごとの相場(この数字をそのまま使うこと)】
${ageBandText}

【面積帯ごとの相場(この数字をそのまま使うこと)】
${areaBandText}

【複数年の価格推移(この数字・文章をそのまま使うこと、自分で再計算しない)】
${trendText}

【利回り試算(この文章をそのまま使うこと、自分で再計算しない)】
${yieldText}

【総額を抑えて始めやすい区分(この数字・文章をそのまま使うこと、自分で再計算しない)】
${lowEntryText}

以下のJSON形式のみを出力してください。JSON以外の文字は出力しないでください。

{
  "title": "記事タイトル(このエリアの不動産投資相場がわかる、40文字程度)",
  "overview": "上記の物件種別ごとの内訳を踏まえた相場の客観的な解説(300文字程度。種類を混同せず、種別ごとの違いに触れる。断定的な将来予測は避け、あくまで公式データの事実として記述する)",
  "propertyTrend": "人気地区ランキング・築年数帯・面積帯のデータを踏まえて「今このエリアではどんな物件が多く取引されているか」を具体的に解説(350文字程度。地区名や築年数帯・面積帯に必ず言及すること。複数年の価格推移にも触れ、上昇/下落の事実を淡々と述べる。将来予測や断定的な投資判断は避ける)",
  "yieldSimulation": "上記の利回り試算の文章を使い、前後に解説を加えたもの(数字は書き換えないこと。あくまで一例であることを明記する。250文字程度)",
  "lowEntryPitch": "総額を抑えて始めやすい区分のデータを使い、「中古ワンルーム・築古物件など総投資額を抑えて始めたい層」に向けた解説(200文字程度。利回りが高いとは書かず、あくまで総額が低い点を根拠にすること)",
  "agentComment": "宅地建物取引士としての一人称の実務コメント(150文字程度。データを踏まえた現場感のある所感。特定物件の推奨や断定的な投資助言はしない。文末は「〜と感じています」「〜を確認しています」など専門家の所感の形にする)",
  "beginnerTips": "このエリアで不動産投資を検討する初心者向けの一般的な注意点(具体的な断定助言ではなく、確認すべき観点を提示する形。250文字程度)"
}`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const MAX_RETRIES = 4;
  const RETRYABLE_STATUS = new Set([429, 500, 503, 504]);
  let res;
  let lastErrorText = "";
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    if (res.ok) break;

    lastErrorText = await res.text();
    const shouldRetry = RETRYABLE_STATUS.has(res.status) && attempt < MAX_RETRIES;
    if (!shouldRetry) {
      throw new Error(`Gemini APIエラー (${res.status}): ${lastErrorText}`);
    }
    const waitMs = 5000 * attempt; // 5秒, 10秒, 15秒...と待ち時間を延ばす
    console.log(
      `  ⚠ Gemini APIが混雑しています(${res.status})。${waitMs / 1000}秒待って再試行します (${attempt}/${MAX_RETRIES})...`
    );
    await sleep(waitMs);
  }

  if (!res.ok) {
    throw new Error(`Gemini APIエラー (${res.status}): ${lastErrorText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Geminiの応答からJSONを抽出できませんでした: " + text.slice(0, 300));
  }
  return JSON.parse(text.slice(start, end + 1));
}

// ---- 4. 記事をファイルに保存 ----
function saveArticle(article) {
  const dir = path.join(ROOT, "content", "articles");
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${article.slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(article, null, 2), "utf-8");
  return filePath;
}

// ---- メイン処理 ----
async function main() {
  console.log(`[1/4] ${PREF_NAME}${CITY_NAME} の取引データを取得中...`);
  const records = await fetchTransactionData();
  const stats = summarize(records);
  const byType = summarizeByType(records);
  const yieldSim = computeYieldSimulation(byType);
  const districtRanking = summarizeByDistrict(records);
  const ageBand = summarizeByAgeBand(records, YEAR);
  const areaBand = summarizeByAreaBand(records);
  const lowEntry = findLowEntryOption(ageBand, areaBand);
  console.log(`  → ${stats.count}件のデータを取得しました(種別: ${Object.keys(byType).join("、")})`);

  console.log("[2/4] 過去数年分の価格推移を取得中(複数回APIを呼ぶため少し時間がかかります)...");
  const trend = await computePriceTrend(records, yieldSim?.targetType, 4);
  const priceTrend = describeTrend(trend);

  console.log("[3/4] AIが記事を生成中(数分かかる場合があります)...");
  const sections = await generateSections(
    stats,
    byType,
    yieldSim,
    districtRanking,
    ageBand,
    areaBand,
    priceTrend,
    lowEntry
  );

  const heroImage = await fetchHeroImage(CITY_NAME);

  const slug = `${CITY_CODE}-${YEAR}${QUARTER ? `-q${QUARTER}` : ""}`;
  const article = {
    slug,
    title: sections.title,
    prefecture: PREF_NAME,
    city: CITY_NAME,
    cityCode: CITY_CODE,
    year: YEAR,
    quarter: QUARTER || null,
    stats,
    byType,
    yieldSim,
    districtRanking,
    ageBand,
    areaBand,
    priceTrend,
    lowEntry,
    heroImage,
    sections: {
      overview: sections.overview,
      propertyTrend: sections.propertyTrend,
      yieldSimulation: sections.yieldSimulation,
      lowEntryPitch: sections.lowEntryPitch,
      agentComment: sections.agentComment,
      beginnerTips: sections.beginnerTips,
    },
    generatedAt: new Date().toISOString(),
  };

  console.log("[4/4] 記事を保存中...");
  const filePath = saveArticle(article);
  console.log(`\n完了しました: ${filePath}`);
  console.log(`\nタイトル: ${article.title}`);
}

main().catch((err) => {
  console.error("\nエラーが発生しました:", err.message);
  process.exit(1);
});
