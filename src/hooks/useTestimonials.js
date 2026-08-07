import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

// scripts/prerender.mjs snapshots the fully-loaded DOM (it waits for this
// fetch to settle), so a prerendered page's static HTML always contains the
// real testimonial cards. Without this, the client's first hydration pass
// would start from `loading = true` / `testimonials = []` — a React #418
// hydration mismatch against that already-populated markup, which React
// resolves by discarding the prerendered section and re-rendering it
// client-side (a console error plus a visible pop-in for every visitor).
// Embedding the fetched result in the DOM lets the *next* prerendered
// snapshot carry it forward, so a later hydration pass can read it back
// synchronously below and match on the very first render.
const EMBED_ID = '__testimonials_data__';

function readEmbedded() {
  if (typeof document === 'undefined') return null;
  const el = document.getElementById(EMBED_ID);
  if (!el) return null;
  try {
    return JSON.parse(el.textContent);
  } catch {
    return null;
  }
}

/**
 * Fetches publicly-approved testimonials for display (homepage, etc).
 * RLS on `testimonials` only returns rows where approved = true to anon/
 * authenticated callers — this hook never sees pending submissions.
 */
export function useTestimonials() {
  const [testimonials, setTestimonials] = useState(() => readEmbedded() ?? []);
  const [loading, setLoading] = useState(() => readEmbedded() === null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    supabase
      .from('testimonials')
      .select('id, display_name, body, rating, source, featured, created_at')
      .eq('approved', true)
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          setTestimonials(data);
          let script = document.getElementById(EMBED_ID);
          if (!script) {
            script = document.createElement('script');
            script.id = EMBED_ID;
            script.type = 'application/json';
            document.body.appendChild(script);
          }
          script.textContent = JSON.stringify(data);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { testimonials, loading };
}
