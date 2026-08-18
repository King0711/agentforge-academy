import { escapeHtml, renderGuideBlocksToHtml, renderFaqsToHtml } from '../src/lib/guideBlocks.js';

// Server-renders /guides/:slug (routed here via the vercel.json rewrite,
// which passes the slug as ?slug=). Same reasoning and shape as
// api/news-article.js — flat file taking a query param, deliberately NOT the
// nested api/guides/[slug].js form, which silently failed to route in
// production and served the SPA shell to every crawler.
export default async function handler(req, res) {
  const slug = req.query.slug;
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  const siteUrl = 'https://socialdevtechnologies.com';

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;

  const [shellRes, guideRes] = await Promise.all([
    fetch(`${proto}://${host}/index.html`),
    fetch(
      `${SUPABASE_URL}/rest/v1/guides?slug=eq.${encodeURIComponent(slug || '')}&status=eq.published&select=*`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } },
    ),
  ]);

  let html = await shellRes.text();
  const rows = guideRes.ok ? await guideRes.json() : [];
  const guide = rows[0];

  if (!guide) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html); // real 404 status; the SPA renders its own NotFound client-side
    return;
  }

  const pageTitle = `${guide.title} | Social Dev Technologies`;
  const description = guide.dek;
  const canonicalUrl = `${siteUrl}/guides/${guide.slug}`;
  const imageUrl = guide.image_url || `${siteUrl}/logo.jpeg`;

  html = html
    .replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(pageTitle)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${escapeHtml(description)}$2`)
    .replace(/(<meta property="og:type" content=")[^"]*(")/, `$1article$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${canonicalUrl}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escapeHtml(guide.title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escapeHtml(description)}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${imageUrl}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${escapeHtml(guide.title)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${escapeHtml(description)}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${imageUrl}$2`);

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description,
    image: guide.image_url ? [guide.image_url] : undefined,
    datePublished: guide.published_at,
    dateModified: guide.updated_at,
    author: { '@type': 'Organization', name: 'Social Dev Technologies' },
    publisher: {
      '@type': 'Organization',
      name: 'Social Dev Technologies',
      logo: { '@type': 'ImageObject', url: `${siteUrl}/logo-icon.webp` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
  });

  html = html.replace('</head>', `
    <link rel="canonical" href="${canonicalUrl}" />
    <script type="application/ld+json">${jsonLd}</script>
  </head>`);

  const imageBlock = guide.image_url
    ? `<img src="${escapeHtml(guide.image_url)}" alt="" style="width:100%;max-width:720px;" />`
    : '';
  const articleHtml = `
    <article>
      <h1>${escapeHtml(guide.title)}</h1>
      <p>${escapeHtml(description)}</p>
      ${imageBlock}
      ${renderGuideBlocksToHtml(guide.body_blocks)}
      ${renderFaqsToHtml(guide.faqs)}
    </article>`;

  // data-ssr-stub tells src/main.jsx to skip hydration and do a clean
  // createRoot render — this is hand-written crawler markup, not real React
  // output. Greedy match to the last </div> because scripts/inject-home.mjs
  // pre-fills #root with the prerendered homepage; see api/news-article.js
  // for the full explanation of that bug.
  html = html.replace(/<div id="root">[\s\S]*<\/div>/, `<div id="root" data-ssr-stub="1">${articleHtml}</div>`);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
  res.end(html);
}
