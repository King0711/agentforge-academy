// Checks that every news article URL actually serves crawlable, article-
// specific HTML — no JS execution, exactly what Googlebot and the
// WhatsApp/Slack/Twitter link-preview fetchers see.
//
// This exists because /news/:slug silently regressed once already: the
// routes were listed in news-sitemap.xml and returned HTTP 200, but the SSR
// function wasn't being reached, so every article served the generic
// homepage shell instead. Status codes and sitemap presence both looked
// fine — only the rendered <title> gave it away.
//
// Usage:
//   node scripts/check-crawlability.mjs [baseUrl]
// Defaults to production; pass a Vercel preview URL to check a branch
// before merging.

const baseUrl = (process.argv[2] || 'https://socialdevtechnologies.com').replace(/\/$/, '');

// If a page's <title> is this, the SSR function didn't run and the SPA
// shell was served instead — the exact signature of the regression above.
const SHELL_TITLE_FRAGMENT = 'Learn AI & Digital Skills in Africa';

function extract(html, pattern) {
  const match = html.match(pattern);
  return match ? match[1].trim() : null;
}

async function checkUrl(url) {
  const problems = [];
  let res;
  try {
    res = await fetch(url, { redirect: 'follow' });
  } catch (err) {
    return { url, problems: [`request failed: ${err.message}`] };
  }

  if (!res.ok) problems.push(`HTTP ${res.status}`);

  const html = await res.text();
  const title = extract(html, /<title>([^<]*)<\/title>/);
  const description = extract(html, /<meta name="description" content="([^"]*)"/);
  const canonical = extract(html, /<link rel="canonical" href="([^"]*)"/);
  const hasJsonLd = /"@type":\s*"NewsArticle"/.test(html);
  const hasH1 = /<h1[^>]*>/.test(html);

  if (!title) problems.push('no <title>');
  else if (title.includes(SHELL_TITLE_FRAGMENT)) problems.push(`served the SPA shell, not the article (title: "${title}")`);

  if (!description) problems.push('no meta description');
  if (!canonical) problems.push('no canonical link');
  if (!hasJsonLd) problems.push('no NewsArticle JSON-LD');
  if (!hasH1) problems.push('no <h1> in raw HTML');

  return { url, title, problems };
}

const sitemapUrl = `${baseUrl}/news-sitemap.xml`;
console.log(`Reading ${sitemapUrl}\n`);

const sitemapRes = await fetch(sitemapUrl);
if (!sitemapRes.ok) {
  console.error(`Could not fetch sitemap: HTTP ${sitemapRes.status}`);
  process.exit(1);
}
const sitemapXml = await sitemapRes.text();

// Only article pages carry NewsArticle markup — the /news listing itself is
// a different template and would fail these checks for the wrong reason.
const urls = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map((m) => m[1])
  .filter((u) => /\/news\/.+/.test(u))
  .map((u) => u.replace('https://socialdevtechnologies.com', baseUrl));

if (urls.length === 0) {
  console.error('No article URLs found in the sitemap.');
  process.exit(1);
}

const results = [];
for (const url of urls) {
  const result = await checkUrl(url);
  results.push(result);
  const slug = url.split('/news/')[1];
  if (result.problems.length === 0) {
    console.log(`  PASS  ${slug}`);
  } else {
    console.log(`  FAIL  ${slug}`);
    for (const p of result.problems) console.log(`          ${p}`);
  }
}

const failed = results.filter((r) => r.problems.length > 0);
console.log(`\n${results.length - failed.length}/${results.length} crawlable`);
process.exit(failed.length > 0 ? 1 : 0);
