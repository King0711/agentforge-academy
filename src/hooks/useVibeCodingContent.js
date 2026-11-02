import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Fetches the whole Vibe Coding concept guide (9 plain-English cards on how an
 * app fits together: database, backend, GitHub, security; not copy-paste
 * prompts, though the table and route keep the old "prompts" name). Not tied to any one class, since
 * class content itself isn't pre-published on the site; students get it
 * live and via replays under /dashboard/live-sessions and /dashboard/replays,
 * gated the same way as the automation tiers' live sessions). RLS on
 * `vibecoding_prompts` enforces the paywall server-side.
 */
export function useVibeCodingPrompts() {
  const [prompts, setPrompts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    supabase
      .from('vibecoding_prompts')
      .select('id, title, prompt_text, order_index')
      .order('order_index', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data || data.length === 0) {
          setLocked(true);
        } else {
          setPrompts(data);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { prompts, loading, locked };
}

/**
 * The student-facing guide for each of the 8 classes, keyed by class number
 * (1-8). Lives in `vibecoding_class_guides`, behind the same RLS as the prompt
 * library, and is keyed by class rather than by live_sessions row so every
 * cohort gets it. Resolves to an empty object if the table is unreadable.
 */
export function useVibeCodingClassGuides() {
  const [guides, setGuides] = useState({});

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let cancelled = false;
    supabase
      .from('vibecoding_class_guides')
      .select('class_number, guide')
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setGuides(Object.fromEntries(data.map((r) => [r.class_number, r.guide])));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return guides;
}
