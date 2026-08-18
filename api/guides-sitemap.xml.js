import { escapeHtml } from '../src/lib/guideBlocks.js';

// Dynamic sitemap for published guides — mirrors api/news-sitemap.xml.js.
// The hand-written public/sitemap.xml can't cover these now that guides are
// admin-authored and can appear at any time without a deploy. Referenced as
// an additional Sitemap: line in robots.txt.
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  const apiRes = await fetch(
    `${SUPABASE_URL}/rest/v1/guides?status=eq.published&select=slug,updated_at,is_hub&order=sort_order.asc`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } },
  );
  const guides = apiRes.ok ? await apiRes.json() : [];

  const urls = guides
    .map(
      (g) => `
  <url>
    <loc>https://socialdevtechnologies.com/guides/${escapeHtml(g.slug)}</loc>
    <lastmod>${new Date(g.updated_at).toISOString().slice(0, 10)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${g.is_hub ? '0.9' : '0.8'}</priority>
  </url>`,
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://socialdevtechnologies.com/guides</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>${urls}
</urlset>`;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=1800, must-revalidate');
  res.end(xml);
}
