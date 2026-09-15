import { MetadataRoute } from "next";
import { getAllArticles, getAllVacationHomes } from "@/lib/articles";

const BASE_URL = "https://ten-pi-77.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getAllArticles();
  const vacationHomes = getAllVacationHomes();

  const articleUrls: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE_URL}/articles/${a.slug}`,
    lastModified: new Date(),
  }));

  const vacationHomeUrls: MetadataRoute.Sitemap = vacationHomes.map((a) => ({
    url: `${BASE_URL}/vacation-homes/${a.slug}`,
    lastModified: new Date(),
  }));

  return [
    { url: BASE_URL, lastModified: new Date() },
    { url: `${BASE_URL}/about`, lastModified: new Date() },
    { url: `${BASE_URL}/vacation-homes`, lastModified: new Date() },
    ...articleUrls,
    ...vacationHomeUrls,
  ];
}
