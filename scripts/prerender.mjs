// Snapshots every public route (scripts/prerender-routes.mjs) into static
// HTML after `vite build`, so crawlers that don't execute JavaScript (most
// AI crawlers — GPTBot, ClaudeBot, PerplexityBot — and search engines
// before/without a render pass) see real content instead of an empty
// <div id="root"></div>.
//
// Deliberately fail-soft: if anything here breaks, we log it and move on
// rather than failing the whole build. A route that doesn't get prerendered
// just keeps behaving exactly like it does today (client-rendered SPA) — a
// missed SEO improvement, never a site outage. This script must never be
// the reason the live site goes down.
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { routes } from './prerender-routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');
const PORT = 4173;
const BASE_URL = `http://localhost:${PORT}`;

function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const res = await fetch(url);
        if (res.ok || res.status < 500) return resolve();
      } catch {
        // server not up yet
      }
      if (Date.now() - start > timeoutMs) return reject(new Error(`Preview server did not start within ${timeoutMs}ms`));
      setTimeout(attempt, 300);
    };
    attempt();
  });
}

async function getBrowser() {
  // Vercel's Linux build environment can't run full `puppeteer`'s bundled
  // Chromium reliably — use the serverless-optimized @sparticuz/chromium +
  // puppeteer-core pairing there instead. Locally (any OS, including
  // Windows), full `puppeteer` just works out of the box.
  if (process.env.VERCEL) {
    const [{ default: chromium }, { default: puppeteerCore }] = await Promise.all([
      import('@sparticuz/chromium'),
      import('puppeteer-core'),
    ]);
    return puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  }
  const { default: puppeteer } = await import('puppeteer');
  return puppeteer.launch({ headless: true });
}

async function outputPathFor(route) {
  const filePath = route === '/'
    ? path.join(distDir, 'index.html')
    : path.join(distDir, route.slice(1), 'index.html');
  await mkdir(path.dirname(filePath), { recursive: true });
  return filePath;
}

async function main() {
  console.log(`[prerender] starting preview server on port ${PORT}...`);
  const preview = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: path.join(__dirname, '..'),
    shell: true,
    stdio: 'pipe',
  });

  let browser;
  let succeeded = 0;
  let failed = 0;

  try {
    await waitForServer(BASE_URL);
    browser = await getBrowser();

    for (const route of routes) {
      try {
        const page = await browser.newPage();
        // networkidle2 (not networkidle0): the homepage's hero video is a
        // long-lived streaming connection that never truly goes idle —
        // tolerating up to 2 in-flight connections means it can't block
        // this indefinitely, while still waiting for actual data fetches
        // (Supabase testimonials/course content, etc.) to settle.
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle2', timeout: 20000 });
        // Extra settle time for any state that updates just after the last
        // network request resolves (e.g. a setState in a .then() callback).
        await new Promise((r) => setTimeout(r, 300));
        const html = await page.content();
        await page.close();

        const outPath = await outputPathFor(route);
        await writeFile(outPath, html, 'utf-8');
        succeeded += 1;
        console.log(`[prerender] ✓ ${route}`);
      } catch (err) {
        failed += 1;
        console.error(`[prerender] ✗ ${route} — ${err.message}`);
      }
    }
  } catch (err) {
    console.error(`[prerender] fatal setup error — skipping prerendering entirely: ${err.message}`);
  } finally {
    if (browser) await browser.close().catch(() => {});
    preview.kill();
  }

  console.log(`[prerender] done — ${succeeded} succeeded, ${failed} failed out of ${routes.length} routes`);
  // Always exit 0 — see file header. A partially/fully failed prerender pass
  // must never fail the build.
  process.exit(0);
}

main();
