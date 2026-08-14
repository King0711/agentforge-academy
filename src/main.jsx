import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
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

// Prerendered routes (see scripts/prerender.mjs) ship real markup inside
// #root at build time — hydrate that instead of discarding and re-rendering,
// so visitors see real content instantly with no flash. In dev mode (and for
// any route that isn't prerendered) #root starts empty, so this falls back
// to a normal client-only render.
//
// data-ssr-stub opts a route OUT of hydration even though #root is non-
// empty: api/news/[slug].js, api/news-index.js, and api/webinar.js inject
// hand-written HTML stubs for crawlers (not real React output — these are
// plain serverless functions with no React renderer), so the markup never
// matches what the client would actually render. Attempting to hydrate
// against it throws a React #418 mismatch error and forces a disruptive
// full-subtree teardown/rebuild instead of a clean replace — confirmed via
// Lighthouse as the direct cause of a CLS 0.651 layout shift on /news/:slug.
if (rootEl.hasChildNodes() && !rootEl.hasAttribute('data-ssr-stub')) {
  hydrateRoot(rootEl, app)
} else {
  createRoot(rootEl).render(app)
}
