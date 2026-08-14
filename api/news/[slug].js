import { escapeHtml, renderBlocksToHtml } from '../../src/lib/newsBlocks.js';

// Server-renders a real HTML document for /news/:slug (routed here via the
// vercel.json rewrite) — this is the fix for the fact that this whole app
// is otherwise a client-rendered SPA with no SSR (see the notes in
// src/pages/BuilderSession.jsx: title/meta are only ever set from a
// useEffect, invisible to WhatsApp/Slack/Twitter link-preview crawlers,
// which never execute JS). Every visitor — human or bot — hits this same
// function for this one route; there's no user-agent branching/cloaking.
//
// Rather than hand-duplicating fonts/GA4/CSP-safe script loading/etc, this
// fetches the real built index.html from the same deployment and does
// targeted string replacement — so it automatically inherits whatever that
// shell already does correctly, and can't drift from it over time.
export default async function handler(req, res) {
  const { slug } = req.query;
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  const siteUrl = `https://socialdevtechnologies.com`;

  const [shellRes, articleRes] = await Promise.all([
    fetch(`${proto}://${host}/index.html`),
    fetch(
      `${SUPABASE_URL}/rest/v1/news_articles?slug=eq.${encodeURIComponent(slug)}&is_full_article=eq.true&select=*`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } },
    ),
  ]);

  let html = await shellRes.text();
  const rows = articleRes.ok ? await articleRes.json() : [];
  const article = rows[0];

  if (!article) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html); // real 404 status, but the normal SPA shell still loads and renders its own NotFound page client-side
    return;
  }

  const pageTitle = `${article.title} | Social Dev Technologies News`;
  const description = article.dek;
  const canonicalUrl = `${siteUrl}/news/${article.slug}`;
  const imageUrl = article.image_url || `${siteUrl}/logo.jpeg`;

  html = html
    .replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(pageTitle)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${escapeHtml(description)}$2`)
    .replace(/(<meta property="og:type" content=")[^"]*(")/, `$1article$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${canonicalUrl}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escapeHtml(article.title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escapeHtml(description)}$2`)
    .replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${imageUrl}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${escapeHtml(article.title)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${escapeHtml(description)}$2`)
    .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${imageUrl}$2`);

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description,
    image: article.image_url ? [article.image_url] : undefined,
    datePublished: article.published_at,
    author: { '@type': 'Organization', name: article.author },
    publisher: {
      '@type': 'Organization',
      name: 'Social Dev Technologies',
      logo: { '@type': 'ImageObject', url: `${siteUrl}/logo-icon.webp` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
  });

  const headExtra = `
    <link rel="canonical" href="${canonicalUrl}" />
    <script type="application/ld+json">${jsonLd}</script>
  </head>`;
  html = html.replace('</head>', headExtra);

  const bodyHtml = renderBlocksToHtml(article.body_blocks);
  const imageBlock = article.image_url ? `<img src="${article.image_url}" alt="" style="width:100%;max-width:720px;" />` : '';
  const articleHtml = `
    <article>
      <h1>${escapeHtml(article.title)}</h1>
      <p>${escapeHtml(description)}</p>
      ${imageBlock}
      ${bodyHtml}
      <p><a href="${article.source_url}">Original source: ${escapeHtml(article.source_name)}</a></p>
    </article>`;
  // data-ssr-stub tells src/main.jsx to skip hydration for this markup and
  // do a clean createRoot render instead — this HTML is a hand-written
  // stub for crawlers, not real React output, so attempting to hydrate
  // against it throws a React #418 mismatch and forces a disruptive
  // teardown/rebuild (confirmed via Lighthouse: CLS 0.651 on this route
  // before this fix). See main.jsx's own comment for the full mechanism.
  //
  // NOT a literal '<div id="root"></div>' match: scripts/inject-home.mjs
  // splices the prerendered homepage into dist/index.html's #root (so "/"
  // is crawlable — see that script's own comment), so the shell fetched
  // above is never actually empty in production. A literal-string replace
  // here silently no-ops against that non-empty div, leaving the homepage
  // in the response and only swapping to the real article once client JS
  // mounts — a real flash-of-wrong-content bug, not just cosmetic; non-JS
  // crawlers would see homepage markup instead of the article body. The
  // greedy match runs to the LAST `</div>` in the document, which is
  // reliably the root div's own closing tag (everything after it in body
  // is script data islands, not more divs) regardless of what's inside.
  html = html.replace(/<div id="root">[\s\S]*<\/div>/, `<div id="root" data-ssr-stub="1">${articleHtml}</div>`);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate');
  res.end(html);
}
