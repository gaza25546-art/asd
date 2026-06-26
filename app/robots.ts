import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/login', '/register', '/profile', '/notifications'],
    },
    sitemap: 'https://dvsc-fan-portal.example.com/sitemap.xml',
  };
}
