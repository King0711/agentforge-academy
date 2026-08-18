// Google tag (gtag.js) bootstrap — kept in its own file rather than inline
// in index.html because this site's CSP has no script-src 'unsafe-inline'.
//
// The measurement library itself (~164KB of third party JS) is NOT requested
// from index.html any more. Commands are queued into dataLayer synchronously
// here, and gtag.js is fetched once the browser is idle; when it arrives it
// drains the queue, so a visitor who stays on the page is still counted
// exactly as before. This keeps a large script that nothing on screen depends
// on out of the initial load, where it was costing CPU during the critical
// window (Lighthouse "Reduce unused JavaScript": 68.6KB of it unused).
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', 'G-42RD6R909Z');

(function loadGtagWhenIdle() {
  var loaded = false;
  function load() {
    if (loaded) return;
    loaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=G-42RD6R909Z';
    // Marked so scripts/prerender.mjs can strip it before serializing.
    // Puppeteer snapshots the DOM *after* scripts run, so without this the
    // injected tag gets baked into every committed snapshot — which would
    // put gtag.js back in the initial HTML and silently undo the deferral.
    s.setAttribute('data-runtime-injected', '1');
    document.head.appendChild(s);
  }

  // Wait for the load event BEFORE going idle-hunting. requestIdleCallback
  // on its own fires as soon as the main thread is quiet, which on a fast
  // connection is well before load — putting this request back in
  // competition with the app bundle for bandwidth, which is what we were
  // trying to avoid. Gating on load first makes the ordering deterministic
  // regardless of connection speed.
  function schedule() {
    if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 4000 });
    else setTimeout(load, 2000);
  }
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (evt) {
    window.addEventListener(evt, load, { once: true, passive: true });
  });
})();
