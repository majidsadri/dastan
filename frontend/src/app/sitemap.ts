import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

type CatalogEntry = { id: string };

function readCatalog(file: string, key: string): CatalogEntry[] {
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), "public", file),
      "utf-8"
    );
    const parsed = JSON.parse(raw);
    const list = (parsed?.[key] ?? []) as CatalogEntry[];
    return list.filter((e) => e && typeof e.id === "string");
  } catch {
    return [];
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.mydastan.com";
  const now = new Date();

  const artists = readCatalog("artists/catalog.json", "artists");
  const philosophers = readCatalog("philosophers/catalog.json", "philosophers");
  const littlePrinceScenes = readCatalog("little-prince/catalog.json", "scenes");
  const siddharthaScenes = readCatalog("siddhartha/catalog.json", "scenes");

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/artists`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/philosophers`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/little-prince`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/siddhartha`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/tao`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/proust`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/archive`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/favorites`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const artistRoutes: MetadataRoute.Sitemap = artists.map((a) => ({
    url: `${baseUrl}/artists/${a.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const philosopherRoutes: MetadataRoute.Sitemap = philosophers.map((p) => ({
    url: `${baseUrl}/philosophers/${p.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const littlePrinceRoutes: MetadataRoute.Sitemap = littlePrinceScenes.map((s) => ({
    url: `${baseUrl}/little-prince/${s.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const siddharthaRoutes: MetadataRoute.Sitemap = siddharthaScenes.map((s) => ({
    url: `${baseUrl}/siddhartha/${s.id}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    ...staticRoutes,
    ...artistRoutes,
    ...philosopherRoutes,
    ...littlePrinceRoutes,
    ...siddharthaRoutes,
  ];
}
