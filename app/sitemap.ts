import { MetadataRoute } from "next";
import { getAllArticles, getAllVacationHomes, getAllApartmentArticles } from "@/lib/articles";

const BASE_URL = "https://ten-pi-77.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const articles = getAllArticles();
  const vacationHomes = getAllVacationHomes();
  const apartmentArticles = getAllApartmentArticles();

  const articleUrls: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE_URL}/articles/${a.slug}`,
    lastModified: new Date(),
  }));

  const vacationHomeUrls: MetadataRoute.Sitemap = vacationHomes.map((a) => ({
    url: `${BASE_URL}/vacation-homes/${a.slug}`,
    lastModified: new Date(),
  }));

  const apartmentUrls: MetadataRoute.Sitemap = apartmentArticles.map((a) => ({
    url: `${BASE_URL}/apartment-management/${a.slug}`,
    lastModified: new Date(),
  }));

  return [
    { url: BASE_URL, lastModified: new Date() },
    { url: `${BASE_URL}/about`, lastModified: new Date() },
    { url: `${BASE_URL}/vacation-homes`, lastModified: new Date() },
    { url: `${BASE_URL}/apartment-management`, lastModified: new Date() },
    ...articleUrls,
    ...vacationHomeUrls,
    ...apartmentUrls,
  ];
}
