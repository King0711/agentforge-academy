// Minimal static server for verifying prerendered output.
//
// `vite preview` falls back to index.html for nested paths, so /ai-builder
// gets served the HOMEPAGE shell — React then hydrates the wrong markup and
// throws a hydration error that has nothing to do with the real page. That
// makes it useless for verifying prerendered routes. This resolves
// /<route> -> <dir>/<route>/index.html the way Vercel actually does, with no
// SPA fallback, so a 404 is a real 404.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const dir = process.argv[2] ?? 'dist';
const port = Number(process.argv[3] ?? 4181);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.map': 'application/json',
};

async function resolve(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  const base = path.join(dir, clean);
  const candidates = clean.endsWith('/')
    ? [path.join(base, 'index.html')]
    : [base, path.join(base, 'index.html')];
  for (const c of candidates) {
    try {
      const s = await stat(c);
      if (s.isFile()) return c;
    } catch { /* try next */ }
  }
  return null;
}

createServer(async (req, res) => {
  const file = await resolve(req.url === '/' ? '/index.html' : req.url);
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('404 — no static file (no SPA fallback, deliberately)');
    return;
  }
  const body = await readFile(file);
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  res.end(body);
}).listen(port, () => {
  console.log(`serving ${dir} on http://localhost:${port} (no SPA fallback)`);
});
