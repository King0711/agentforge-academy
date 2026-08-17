import { escapeHtml } from '../src/lib/newsBlocks.js';

// RSS 2.0 feed of published articles. Two reasons this exists alongside
// api/news-sitemap.xml.js rather than being redundant with it:
//   1. Google accepts an RSS/Atom feed as a sitemap, and polls feeds more
//      frequently than plain XML sitemaps for regularly-updated content —
//      it's the cheapest lever on how fast new articles get crawled.
//   2. It's a real feed for readers/aggregators, which the sitemap isn't.
//
// Flat file taking no params, matching the shape of the other api routes
// that deploy reliably (see the note in api/news-article.js about the
// nested bracket form silently failing to route).
export default async function handler(req, res) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  const siteUrl = 'https://socialdevtechnologies.com';

  const apiRes = await fetch(
    `${SUPABASE_URL}/rest/v1/news_articles?is_full_article=eq.true&select=slug,title,dek,published_at&order=published_at.desc&limit=50`,
    { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } },
  );
  const articles = apiRes.ok ? await apiRes.json() : [];

  // RSS requires RFC-822 dates, not the ISO-8601 the sitemap uses.
  const rfc822 = (value) => new Date(value).toUTCString();
  const lastBuildDate = rfc822(articles[0]?.published_at || Date.now());

  const items = articles
    .map((a) => {
      const url = `${siteUrl}/news/${escapeHtml(a.slug)}`;
      return `
    <item>
      <title>${escapeHtml(a.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${rfc822(a.published_at)}</pubDate>
      <description>${escapeHtml(a.dek)}</description>
    </item>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>AI News — Social Dev Technologies</title>
    <link>${siteUrl}/news</link>
    <description>The AI news that actually matters for people building real agents — picked daily, explained plainly, no hype.</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${siteUrl}/news-rss.xml" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=1800, must-revalidate');
  res.end(xml);
}
