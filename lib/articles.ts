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
const VACATION_HOMES_DIR = path.join(process.cwd(), "content", "vacation-homes");
const APARTMENT_MANAGEMENT_DIR = path.join(process.cwd(), "content", "apartment-management");

function getAllFrom(dir: string): Article[] {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const articles = files.map((f) => {
    const raw = fs.readFileSync(path.join(dir, f), "utf-8");
    return JSON.parse(raw) as Article;
  });
  return articles.sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1));
}

function getFromBySlug(dir: string, slug: string): Article | null {
  const filePath = path.join(dir, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as Article;
}

export function getAllArticles(): Article[] {
  return getAllFrom(ARTICLES_DIR);
}

export function getArticleBySlug(slug: string): Article | null {
  return getFromBySlug(ARTICLES_DIR, slug);
}

export function getAllVacationHomes(): Article[] {
  return getAllFrom(VACATION_HOMES_DIR);
}

export function getVacationHomeBySlug(slug: string): Article | null {
  return getFromBySlug(VACATION_HOMES_DIR, slug);
}

export function getAllApartmentArticles(): Article[] {
  return getAllFrom(APARTMENT_MANAGEMENT_DIR);
}

export function getApartmentArticleBySlug(slug: string): Article | null {
  return getFromBySlug(APARTMENT_MANAGEMENT_DIR, slug);
}
