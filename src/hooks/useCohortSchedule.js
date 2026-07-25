import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Public "next cohort starts" dates for Builder 1 / Builder 2, managed by
 * admins on /admin. Purely informational — it doesn't gate content access,
 * which stays self-paced/instant on purchase.
 */
export function useCohortSchedule() {
  const [dates, setDates] = useState({ builder1: null, builder2: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    supabase
      .from('cohort_schedule')
      .select('tier, start_date')
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          const next = { builder1: null, builder2: null };
          for (const row of data) next[row.tier] = row.start_date;
          setDates(next);
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { ...dates, loading };
}
