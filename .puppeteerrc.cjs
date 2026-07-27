// Full `puppeteer` bundles its own ~300MB Chromium download on install — we
// only want that locally (any OS, for scripts/prerender.mjs during dev).
// On Vercel's Linux build environment, prerender.mjs instead uses
// puppeteer-core + @sparticuz/chromium (a build tailored for serverless),
// so skip puppeteer's own download there entirely — it would otherwise slow
// down or risk breaking the build for a binary we never use.
module.exports = {
  skipDownload: Boolean(process.env.VERCEL || process.env.CI),
};
