import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

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
if (rootEl.hasChildNodes()) {
  hydrateRoot(rootEl, app)
} else {
  createRoot(rootEl).render(app)
}
