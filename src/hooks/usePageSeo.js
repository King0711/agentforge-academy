import { useEffect } from 'react';

// Sets title / meta description / canonical / JSON-LD for a page and restores
// everything on unmount, so client-side nav doesn't leak one page's tags onto
// the next. Same hand-rolled approach the older pages use inline (there's no
// react-helmet in this repo) — extracted here because the /guides section is
// meant to grow, and every guide needs exactly this.
//
// Prerender-safe: scripts/prerender.mjs snapshots the DOM after the app has
// settled, so tags injected here land in the committed static HTML.
//
// jsonLd accepts either one schema object or an array of them (a guide page
// wants Article + FAQPage + BreadcrumbList on the same page). Every script
// this hook creates carries data-page-seo="jsonld" and, before adding new
// ones, the effect sweeps that marker clean first — belt-and-braces against
// ending up with two copies of the same block if an effect ever fires twice
// for the same page (e.g. a hot-reload) without its cleanup running first.
export function usePageSeo({ title, description, canonicalPath, jsonLd }) {
  useEffect(() => {
    const prevTitle = document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute('content');

    if (title) document.title = title;
    if (description && metaDesc) metaDesc.setAttribute('content', description);

    // Canonical: reuse an existing tag if the shell already has one, otherwise
    // add our own and take it back out on unmount.
    let canonicalEl = document.querySelector('link[rel="canonical"]');
    const hadCanonical = Boolean(canonicalEl);
    const prevCanonical = canonicalEl?.getAttribute('href');
    if (canonicalPath) {
      if (!canonicalEl) {
        canonicalEl = document.createElement('link');
        canonicalEl.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalEl);
      }
      canonicalEl.setAttribute('href', `https://socialdevtechnologies.com${canonicalPath}`);
    }

    document.querySelectorAll('script[data-page-seo="jsonld"]').forEach((el) => el.remove());
    const scripts = (Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []).map((entry) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-page-seo', 'jsonld');
      script.textContent = JSON.stringify(entry);
      document.head.appendChild(script);
      return script;
    });

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc) metaDesc.setAttribute('content', prevDesc);
      if (canonicalEl) {
        if (hadCanonical && prevCanonical) canonicalEl.setAttribute('href', prevCanonical);
        else canonicalEl.remove();
      }
      scripts.forEach((script) => script.remove());
    };
  }, [title, description, canonicalPath, jsonLd]);
}
