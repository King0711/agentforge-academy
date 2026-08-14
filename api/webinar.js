import { escapeHtml } from '../src/lib/newsBlocks.js';

// Server-renders /webinar (routed here via the vercel.json rewrite) — same
// no-SSR problem as /news: this route is otherwise only ever titled via a
// useEffect in src/pages/Webinar.jsx, invisible to crawlers that don't
// execute JS. Deliberately does NOT attempt to expose the slide deck's own
// content (src/data/webinarSlides.js) here — that data is presenter notes
// for a live speaker (talking points, story cues, interaction prompts), not
// audience-facing copy, and isn't meant to be public/indexable. Instead
// this renders the same title/description Webinar.jsx already sets
// client-side, plus a short genuine landing-page summary and a link back
// into the funnel — the appropriate scope for a live-presentation page,
// not a transcript.
export default async function handler(req, res) {
  const siteUrl = 'https://socialdevtechnologies.com';
  const canonicalUrl = `${siteUrl}/webinar`;

  const shellRes = await fetch(`${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/index.html`);
  let html = await shellRes.text();

  const pageTitle = 'The AI Builder Workshop — Become an AI Builder | Social Dev Technologies';
  const description = "Learn how ordinary people are building AI systems that save time, grow businesses, and create new career opportunities — join Social Dev Technologies' live AI Builder Workshop and watch a real AI agent get built from scratch.";

  html = html
    .replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(pageTitle)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${escapeHtml(description)}$2`)
    .replace(/(<meta property="og:type" content=")[^"]*(")/, `$1website$2`)
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${canonicalUrl}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escapeHtml(pageTitle)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escapeHtml(description)}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${escapeHtml(pageTitle)}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${escapeHtml(description)}$2`);

  const headExtra = `
    <link rel="canonical" href="${canonicalUrl}" />
  </head>`;
  html = html.replace('</head>', headExtra);

  const bodyHtml = `
    <main>
      <h1>${escapeHtml(pageTitle)}</h1>
      <p>${escapeHtml(description)}</p>
      <p><a href="${siteUrl}/ai-builder">Learn more about becoming an AI Builder</a></p>
    </main>`;
  // data-ssr-stub tells src/main.jsx to skip hydration and do a clean
  // createRoot render instead — see main.jsx and api/news/[slug].js's own
  // comments for why: this is hand-written HTML for crawlers, not real
  // React output, so hydrating against it throws a React #418 mismatch and
  // forces a disruptive teardown/rebuild. Matches the last </div> in the
  // document rather than a literal empty div, since scripts/inject-
  // home.mjs splices the prerendered homepage into #root in production
  // (see the matching fix/comment in api/news/[slug].js).
  html = html.replace(/<div id="root">[\s\S]*<\/div>/, `<div id="root" data-ssr-stub="1">${bodyHtml}</div>`);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
  res.end(html);
}
