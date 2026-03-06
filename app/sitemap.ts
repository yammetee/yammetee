import type { MetadataRoute } from "next";
import { loadAllReleasesServer } from "./lib/releases-server";
import { getSiteUrl } from "./lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const releases = await loadAllReleasesServer();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/tracks`,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${siteUrl}/all-tracks`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/videos`,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${siteUrl}/about`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/wall`,
      changeFrequency: "daily",
      priority: 0.6,
    },
  ];

  const releasePages: MetadataRoute.Sitemap = releases.map((release) => ({
    url: `${siteUrl}/tracks/${release.id}`,
    lastModified: release.releaseDate,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticPages, ...releasePages];
}
