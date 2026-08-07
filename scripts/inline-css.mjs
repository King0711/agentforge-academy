// Inlines dist/assets/index.css directly into dist/index.html's <head> as a
// <style> tag, replacing the external <link rel="stylesheet">. Lighthouse
// flags that link as a render-blocking request (~40ms on a cold mobile
// load) — for a single ~10KB stylesheet, eliminating the extra network
// round-trip outweighs losing separate browser caching for it. That
// caching loss barely matters here anyway: within a session React Router
// handles navigation client-side (no new HTML fetch, so no re-download
// regardless), and cross-page hard-navigation is rare on this kind of
// marketing site. Deferring it instead (like the Google Fonts links) was
// ruled out — index.css carries the entire Tailwind-generated layout, so
// deferring it would flash fully unstyled content on every load, a much
// worse regression than the 40ms this saves.
//
// Runs as part of `vite build` (before inject-home.mjs), so both the base
// dist/index.html AND every route Puppeteer later snapshots (scripts/
// prerender.mjs serves this same dist/) end up with the CSS inlined.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const distIndexPath = path.join(root, 'dist', 'index.html');
const cssPath = path.join(root, 'dist', 'assets', 'index.css');

async function main() {
  const [html, css] = await Promise.all([
    readFile(distIndexPath, 'utf-8'),
    readFile(cssPath, 'utf-8').catch(() => null),
  ]);

  if (!css) {
    console.warn('[inline-css] dist/assets/index.css not found — leaving dist/index.html untouched.');
    return;
  }

  const linkPattern = /<link rel="stylesheet"[^>]*href="\/assets\/index\.css"[^>]*>/i;
  if (!linkPattern.test(html)) {
    console.warn('[inline-css] Could not find the index.css <link> tag — leaving dist/index.html untouched.');
    return;
  }

  const injected = html.replace(linkPattern, `<style>${css}</style>`);
  await writeFile(distIndexPath, injected, 'utf-8');
  console.log('[inline-css] ✓ dist/index.html now has index.css inlined.');
}

main();
