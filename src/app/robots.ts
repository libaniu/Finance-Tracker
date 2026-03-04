import { MetadataRoute } from "next";

// PERHATIKAN: Harus ada kata 'default' setelah 'export'
export default function robots(): MetadataRoute.Robots {
  // Gunakan environment variable, dengan fallback ke URL produksi
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://wallet-bice-beta.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/private/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
