import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Fetches the whole Vibe Coding prompt library (8 reusable prompts used
 * throughout the live-taught bootcamp — not tied to any one class, since
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
