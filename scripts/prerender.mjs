// Generates static HTML snapshots of every public route (scripts/prerender-
// routes.mjs) so crawlers that don't execute JavaScript (most AI crawlers —
// GPTBot, ClaudeBot, PerplexityBot — plus search engines before/without a
// render pass) see real content instead of an empty <div id="root"></div>.
//
// This is a MANUAL, LOCAL step — NOT run as part of Vercel's build. Vercel's
// build container can't reliably launch headless Chrome (that's specifically
// what @sparticuz/chromium solves, but only inside a serverless FUNCTION at
// request time, not the build step — confirmed the hard way). Instead:
//   1. Run `npm run build` locally (vite.config.js uses fixed, non-hashed
//      asset filenames specifically so these committed snapshots never go
//      stale against a future Vercel build's own separate `vite build`).
//   2. Run this script — it snapshots dist/ into public/<route>/index.html
//      (and public/prerendered-home.html for "/", since the source root
//      index.html must stay Vite's build *template*, not built output).
//   3. Commit the generated public/ files and push.
// Re-run whenever session/marketing content changes.
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { routes } from './prerender-routes.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
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

async function outputPathFor(route) {
  const filePath = route === '/'
    ? path.join(publicDir, 'prerendered-home.html')
    : path.join(publicDir, route.slice(1), 'index.html');
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
    browser = await puppeteer.launch({ headless: true });

    for (const route of routes) {
      try {
        const page = await browser.newPage();
        // networkidle2 (not networkidle0): the homepage's hero video is a
        // long-lived streaming connection that never truly idles —
        // tolerating up to 2 in-flight connections means it can't block
        // this indefinitely, while still waiting for actual data fetches
        // (Supabase testimonials/course content, etc.) to settle.
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle2', timeout: 20000 });
        await new Promise((r) => setTimeout(r, 300));

        // Drop nodes that runtime code injected into the DOM (currently the
        // deferred gtag.js loader — see public/gtag-init.js). page.content()
        // serializes the live DOM, so anything a script appended would
        // otherwise be committed into the snapshot as if it had been in the
        // source HTML all along — re-introducing on page load exactly the
        // request the runtime injection exists to defer.
        await page.evaluate(() => {
          document.querySelectorAll('[data-runtime-injected]').forEach((el) => el.remove());
        });

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
  } finally {
    if (browser) await browser.close().catch(() => {});
    preview.kill();
  }

  console.log(`[prerender] done — ${succeeded} succeeded, ${failed} failed out of ${routes.length} routes`);
  if (failed > 0) process.exitCode = 1;
}

main();
