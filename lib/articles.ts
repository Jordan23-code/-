import fs from "node:fs";
import path from "node:path";

export type ArticleStats = {
  count: number;
  avgTradePrice: number;
  minTradePrice: number;
  maxTradePrice: number;
  avgUnitPrice: number | null;
  sampleDistricts: string[];
};

export type YieldSim = {
  targetType: string;
  avgTradePrice: number;
  assumedMonthlyRent: number;
  annualRent: number;
  yieldPct: string;
} | null;

export type DistrictRankingEntry = {
  district: string;
  count: number;
  avgTradePrice: number;
};

export type PriceTrend = {
  trend: { year: number; count: number; avgTradePrice: number | null }[];
  firstYear: number;
  lastYear: number;
  changePct: string;
} | null;

export type HeroImage = {
  url: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  pageUrl: string;
} | null;

export type LowEntryOption = {
  source: string;
  label: string;
  count: number;
  avgTradePrice: number;
} | null;

export type Article = {
  slug: string;
  title: string;
  prefecture: string;
  city: string;
  cityCode: string;
  year: string;
  quarter: string | null;
  stats: ArticleStats;
  byType?: Record<string, ArticleStats>;
  yieldSim?: YieldSim;
  districtRanking?: DistrictRankingEntry[] | null;
  ageBand?: Record<string, ArticleStats> | null;
  areaBand?: Record<string, ArticleStats> | null;
  priceTrend?: PriceTrend;
  lowEntry?: LowEntryOption;
  heroImage?: HeroImage;
  sections: {
    overview: string;
    propertyTrend?: string;
    yieldSimulation: string;
    lowEntryPitch?: string;
    agentComment?: string;
    beginnerTips: string;
  };
  generatedAt: string;
};

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles");

export function getAllArticles(): Article[] {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  const files = fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".json"));
  const articles = files.map((f) => {
    const raw = fs.readFileSync(path.join(ARTICLES_DIR, f), "utf-8");
    return JSON.parse(raw) as Article;
  });
  return articles.sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1));
}

export function getArticleBySlug(slug: string): Article | null {
  const filePath = path.join(ARTICLES_DIR, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as Article;
}
