import { MetadataRoute } from 'next';

// PERHATIKAN: Harus ada kata 'default' setelah 'export'
export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://wallet-bice-beta.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/private/',
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}