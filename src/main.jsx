import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// index.html loads the Google Fonts stylesheets with media="print" so they
// don't block first paint; flip each to media="all" once it's actually
// loaded. This has to happen here (a same-origin module script) rather than
// an inline onload= attribute — the site's CSP script-src has no
// 'unsafe-inline', which blocks inline event-handler attributes outright.
document.querySelectorAll('link[data-defer-font]').forEach((link) => {
  const activate = () => { link.media = 'all' }
  if (link.sheet) activate()
  else link.addEventListener('load', activate, { once: true })
})

const rootEl = document.getElementById('root')
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// Always a clean createRoot — never hydrateRoot. #root ships real markup on
// two kinds of route, and NEITHER can be hydrated against:
//
//   1. The hand-written crawler stubs from api/news-article.js,
//      api/news-index.js and api/webinar.js (marked data-ssr-stub). Those
//      are plain serverless functions with no React renderer, so the markup
//      never matches what the client renders.
//
//   2. The Puppeteer snapshots from scripts/prerender.mjs. These LOOK
//      hydratable — they're real React output — but they are serialized
//      from a live, animating page, so framer-motion's inline styles are
//      baked in at whatever value they held the instant the DOM was
//      read. public/prerendered-home.html contains, verifiably:
//
//        style="opacity: 0; transform: translateX(0.55724px) translateY(0.222896px);"
//
//      Those sub-pixel numbers are a mid-flight animation frame. React's
//      first client render emits the component's `initial` styles instead,
//      which cannot match — so hydration failed on EVERY visit to the
//      homepage with React #418, and React discarded the entire prerendered
//      tree and rebuilt it. Re-running the prerender does not help; it just
//      bakes a different random frame.
//
// So hydration was never actually working here — it was costing a failed
// pass on top of the client render it fell back to. createRoot does the
// same final work without the wasted attempt. Crawlers are unaffected
// either way: they read the served HTML before any of this runs.
//
// If mount animations are ever dropped from the prerendered routes (making
// first client render deterministic), hydrateRoot becomes viable again and
// would be faster — that's the only reason to revisit this.
createRoot(rootEl).render(app)
