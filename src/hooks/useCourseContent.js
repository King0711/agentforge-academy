import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Fetches the gated guide content (session, starter code, resources, etc.)
 * for a single course from Supabase. RLS on `course_content` enforces the
 * paywall server-side — a free/unauthenticated request for a paid course's
 * content returns zero rows, which this hook surfaces as `locked: true`.
 * Never trust `agent.difficulty` alone to decide what to render here.
 */
export function useCourseContent(courseId) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(Boolean(courseId));
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!courseId || !isSupabaseConfigured) {
      setContent(null);
      setLocked(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLocked(false);
    setContent(null);

    supabase
      .from('course_content')
      .select('what_you_build, what_you_learn, session, starter_code, test_it_out, troubleshooting, resources')
      .eq('course_id', courseId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setLocked(true);
        } else {
          setContent({
            whatYouBuild: data.what_you_build,
            whatYouLearn: data.what_you_learn,
            session: data.session,
            starterCode: data.starter_code,
            testItOut: data.test_it_out,
            troubleshooting: data.troubleshooting,
            resources: data.resources,
          });
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  return { content, loading, locked };
}
