import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 3600;

const staticRoutes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "daily" },
  { path: "/explore", priority: 0.9, changeFrequency: "daily" },
  { path: "/hall-of-fame", priority: 0.9, changeFrequency: "daily" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/pricing", priority: 0.5, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.5, changeFrequency: "monthly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();

  const platinums = await prisma.platinum.findMany({
    select: { id: true, platinumDate: true },
    orderBy: { platinumDate: "desc" },
    take: 5000,
  });

  return [
    ...staticRoutes.map((route) => ({
      url: `${base}${route.path}`,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...platinums.map((platinum) => ({
      url: `${base}/platinum/${platinum.id}`,
      lastModified: platinum.platinumDate,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
