import { escapeHtml } from '../src/lib/newsBlocks.js';

// Dynamic sitemap for published articles — the existing public/sitemap.xml
// is hand-written and manually kept in sync with a fixed route list (see
// scripts/prerender-routes.mjs); that model can't work for a bot that
// publishes new article slugs on its own. Referenced as an *additional*
// Sitemap: line in robots.txt rather than replacing the existing file.
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  const apiRes = await fetch(
    `${SUPABASE_URL}/rest/v1/news_articles?is_full_article=eq.true&select=slug,published_at&order=published_at.desc`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } },
  );
  const articles = apiRes.ok ? await apiRes.json() : [];

  const urls = articles
    .map(
      (a) => `
  <url>
    <loc>https://socialdevtechnologies.com/news/${escapeHtml(a.slug)}</loc>
    <lastmod>${new Date(a.published_at).toISOString().slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`,
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://socialdevtechnologies.com/news</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>${urls}
</urlset>`;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=1800, must-revalidate');
  res.end(xml);
}
