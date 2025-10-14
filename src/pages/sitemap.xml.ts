import type { APIRoute } from 'astro';
import { getAllPostSlugs, getAllToolSlugs, getAllCategorySlugs, getAllAuthorSlugs } from '../lib/sanity';

export const GET: APIRoute = async () => {
  const site = 'https://thebetblog.com';
  const currentDate = new Date().toISOString();
  
  // Static pages
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/posts/', priority: '0.9', changefreq: 'daily' },
    { url: '/tools/', priority: '0.9', changefreq: 'daily' },
    { url: '/about-us/', priority: '0.7', changefreq: 'monthly' },
    { url: '/contact-us/', priority: '0.7', changefreq: 'monthly' },
  ];
  
  // Dynamic pages
  const [postSlugs, toolSlugs, categorySlugs, authorSlugs] = await Promise.all([
    getAllPostSlugs(),
    getAllToolSlugs(),
    getAllCategorySlugs(),
    getAllAuthorSlugs(),
  ]);
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages.map(page => `
  <url>
    <loc>${site}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('')}
  
  ${postSlugs.map(slug => `
  <url>
    <loc>${site}/${slug}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  
  ${toolSlugs.map(slug => `
  <url>
    <loc>${site}/tools/${slug}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  
  ${categorySlugs.map(slug => `
  <url>
    <loc>${site}/category/${slug}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
  
  ${authorSlugs.map(slug => `
  <url>
    <loc>${site}/author/${slug}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
