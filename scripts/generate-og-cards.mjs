// Generates the 1200x630 social share cards in public/og/.
//
// Why this exists: every page on this site served `og:image` pointing at
// /logo.jpeg, a 192x192 square. LinkedIn needs 1200x627+ to render a large
// image card and Facebook's floor is 200x200, so every link anyone shared
// from this site rendered as a text-only row or a tiny thumbnail — the
// lowest-performing thing you can put in a feed. public/sdt-main.jpg (224x224)
// clears Facebook's floor but is still square, so it's used as the brand mark
// *inside* these cards rather than as the share image itself.
//
// One card per department plus a default: api/news-article.js picks the card
// matching an article's first department_id, so a run of articles doesn't
// share ten identical previews. This is the floor, not the ceiling —
// generate-news-digest.ts still generates a real per-article illustration
// when OPENAI_API_KEY is set, and a row's own image_url always wins.
//
// MANUAL, LOCAL step, same convention as scripts/prerender.mjs: Vercel's
// build container can't reliably launch headless Chrome. Run `npm run
// og-cards`, commit the generated public/og/*.jpg. Only needs re-running if
// the brand, the logo, or the department list changes.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const outDir = path.join(publicDir, 'og');

const WIDTH = 1200;
const HEIGHT = 630;

// Mirrors src/data/departments.js. Duplicated rather than imported because
// that module is part of the React bundle and pulls in nothing this script
// needs — and the card set is a design artifact, not app state. If a
// department is added there, add it here and re-run.
// `audience` is the heading's subject, kept deliberately short — the full
// `name` reads fine in the small eyebrow pill but pushes the 66px heading to
// three lines, which crowds the footer.
const DEPARTMENTS = [
  { id: 'sales', name: 'Sales', audience: 'sales teams', icon: '💼', color: '#0EA5E9' },
  { id: 'marketing', name: 'Marketing', audience: 'marketers', icon: '📢', color: '#EC4899' },
  { id: 'operations', name: 'Operations', audience: 'ops teams', icon: '⚙️', color: '#14B8A6' },
  { id: 'finance', name: 'Finance', audience: 'finance teams', icon: '💰', color: '#22C55E' },
  { id: 'hr', name: 'HR & People', audience: 'HR teams', icon: '👥', color: '#A855F7' },
  { id: 'legal', name: 'Legal', audience: 'legal teams', icon: '⚖️', color: '#6366F1' },
  { id: 'support', name: 'Customer Support', audience: 'support teams', icon: '🎧', color: '#F97316' },
  { id: 'engineering', name: 'Engineering', audience: 'engineers', icon: '💻', color: '#06B6D4' },
  { id: 'data', name: 'Data & Analytics', audience: 'data teams', icon: '📊', color: '#8B5CF6' },
  { id: 'strategy', name: 'Executive / Strategy', audience: 'founders', icon: '🧭', color: '#F43F5E' },
];

// Cards that aren't tied to a department. `news` is the fallback for an
// article whose department_ids is empty or lists something unrecognized.
const GENERIC_CARDS = [
  {
    file: 'default',
    color: '#7C3AED',
    eyebrow: 'Builder 1 · Builder 2',
    heading: 'Build real AI agents.',
    sub: '25 guided sessions across Builder 1 and Builder 2 — plus portfolio-ready projects.',
  },
  {
    file: 'news',
    color: '#7C3AED',
    eyebrow: 'AI News',
    heading: 'The AI news that actually matters.',
    sub: 'Picked daily, explained plainly, no hype — for people building real agents.',
  },
  {
    file: 'guides',
    color: '#16A34A',
    eyebrow: 'Guides',
    heading: 'Step-by-step AI build guides.',
    sub: 'Practical walkthroughs you can follow end to end, no prior experience needed.',
  },
];

function cardHtml({ color, eyebrow, heading, sub, icon, logoDataUri }) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap" rel="stylesheet" />
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        width: ${WIDTH}px; height: ${HEIGHT}px;
        position: relative; overflow: hidden;
        background: #1A1333;
        font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
        color: #fff;
      }
      /* Two offset radial washes in the accent colour over the deep ink
         base — gives each department card a distinct cast while keeping
         the whole set recognisably one family. */
      .wash-a {
        position: absolute; top: -280px; right: -180px;
        width: 900px; height: 900px; border-radius: 50%;
        background: radial-gradient(circle, ${color}66 0%, ${color}00 68%);
      }
      .wash-b {
        position: absolute; bottom: -420px; left: -240px;
        width: 820px; height: 820px; border-radius: 50%;
        background: radial-gradient(circle, #7C3AED55 0%, #7C3AED00 70%);
      }
      .edge { position: absolute; left: 0; top: 0; bottom: 0; width: 14px; background: ${color}; }
      .inner {
        position: relative; z-index: 2;
        height: 100%; padding: 68px 76px 60px 90px;
        display: flex; flex-direction: column; justify-content: space-between;
      }
      .brandrow { display: flex; align-items: center; gap: 18px; }
      .brandrow img { width: 68px; height: 68px; border-radius: 16px; display: block; }
      .brandname {
        font-weight: 700; font-size: 22px; letter-spacing: 0.14em;
        text-transform: uppercase; color: #E4DBFF;
      }
      .eyebrow {
        display: inline-flex; align-items: center; gap: 12px; align-self: flex-start;
        background: ${color}2E; border: 1.5px solid ${color}80;
        color: #fff; font-weight: 700; font-size: 21px;
        letter-spacing: 0.05em; padding: 11px 22px; border-radius: 999px;
        margin-bottom: 26px;
      }
      h1 {
        font-family: 'Bricolage Grotesque', system-ui, sans-serif;
        font-weight: 800; font-size: 66px; line-height: 1.06;
        letter-spacing: -1.6px; max-width: 20ch;
      }
      .sub {
        margin-top: 22px; font-size: 25px; line-height: 1.45;
        color: #C9BFEA; font-weight: 500; max-width: 30ch;
      }
      .foot {
        display: flex; align-items: center; justify-content: space-between;
        font-size: 21px; font-weight: 600; color: #A99FD0;
      }
      .foot .url { color: #fff; }
    </style>
  </head>
  <body>
    <div class="wash-a"></div>
    <div class="wash-b"></div>
    <div class="edge"></div>
    <div class="inner">
      <div class="brandrow">
        <img src="${logoDataUri}" alt="" />
        <div class="brandname">Social Dev Technologies</div>
      </div>
      <div>
        <div class="eyebrow">${icon ? `<span>${icon}</span>` : ''}<span>${eyebrow}</span></div>
        <h1>${heading}</h1>
        <div class="sub">${sub}</div>
      </div>
      <div class="foot">
        <span class="url">socialdevtechnologies.com</span>
        <span>Learn to build with AI</span>
      </div>
    </div>
  </body>
</html>`;
}

async function main() {
  const logo = await readFile(path.join(publicDir, 'sdt-main.jpg'));
  const logoDataUri = `data:image/jpeg;base64,${logo.toString('base64')}`;

  await mkdir(outDir, { recursive: true });

  const cards = [
    ...GENERIC_CARDS.map((c) => ({ ...c, logoDataUri })),
    ...DEPARTMENTS.map((d) => ({
      file: `dept-${d.id}`,
      color: d.color,
      icon: d.icon,
      eyebrow: `AI News · ${d.name}`,
      heading: `The AI news that matters for ${d.audience}.`,
      sub: 'Picked daily, explained plainly — for people building real agents.',
      logoDataUri,
    })),
  ];

  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });

    for (const card of cards) {
      // 'load', NOT 'networkidle0': the Google Fonts connection is kept
      // alive between setContent calls, so the network never goes idle again
      // after the first card and every subsequent one times out. document
      // .fonts.ready is the real signal we need anyway — without it the
      // headings render in the fallback face, and a wrong-font card is baked
      // in permanently.
      await page.setContent(cardHtml(card), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const buffer = await page.screenshot({ type: 'jpeg', quality: 90 });
      const outPath = path.join(outDir, `${card.file}.jpg`);
      await writeFile(outPath, buffer);
      console.log(`  ✓ og/${card.file}.jpg  (${(buffer.length / 1024).toFixed(0)}KB)`);
    }
  } finally {
    await browser.close();
  }

  console.log(`\nGenerated ${cards.length} cards at ${WIDTH}x${HEIGHT} in public/og/`);
  console.log('Commit them — Vercel does not run this script.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
