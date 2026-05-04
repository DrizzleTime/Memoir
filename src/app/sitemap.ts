import type { MetadataRoute } from "next";
import {
  getPublicAlbumsForSitemap,
  getPublicSitemapPageTimestamps,
  getPublishedArticlesForSitemap,
} from "@/lib/public-content";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [siteUrl, articles, albums, pageTimestamps] = await Promise.all([
    getSiteUrl(),
    getPublishedArticlesForSitemap(),
    getPublicAlbumsForSitemap(),
    getPublicSitemapPageTimestamps(),
  ]);

  const articleUrls: MetadataRoute.Sitemap = articles.map(
    (article: (typeof articles)[number]) => ({
    url: `${siteUrl}/article/${article.id}`,
    lastModified: article.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
    })
  );

  const albumUrls: MetadataRoute.Sitemap = albums.map((album) => ({
    url: `${siteUrl}/albums/${album.id}`,
    lastModified: album.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/about`,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/links`,
      lastModified: pageTimestamps.linksLastModified,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/albums`,
      lastModified: pageTimestamps.albumsLastModified,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${siteUrl}/now`,
      lastModified: pageTimestamps.nowLastModified,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  return [...staticUrls, ...articleUrls, ...albumUrls];
}
