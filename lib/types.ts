// ヒアリング内容(顧客からの入力)
export type SiteBrief = {
  businessName: string;
  industry: string;
  description: string;
  tone: string;
  colorPreference: string;
  phone: string;
  address: string;
};

// AIが生成するサイトの構成内容
export type SiteContent = {
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  services: { title: string; description: string }[];
  ctaText: string;
  primaryColor: string;
  accentColor: string;
};

export type GenerateResponse =
  | { ok: true; content: SiteContent }
  | { ok: false; error: string };
