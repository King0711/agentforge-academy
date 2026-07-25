import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Fetches publicly-approved testimonials for display (homepage, etc).
 * RLS on `testimonials` only returns rows where approved = true to anon/
 * authenticated callers — this hook never sees pending submissions.
 */
export function useTestimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

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
        if (!error && data) setTestimonials(data);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { testimonials, loading };
}
