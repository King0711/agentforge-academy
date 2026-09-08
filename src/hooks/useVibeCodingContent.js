import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Fetches the gated content (topics, session sections, assignment, challenge
 * features) for a single Vibe Coding class from Supabase. RLS on
 * `vibecoding_content` enforces the paywall server-side — a request without
 * an active vibecoding_expires_at entitlement returns zero rows, surfaced
 * here as `locked: true`. Mirrors useCourseContent.js, but there is no
 * draft/staging table for this content — it's inserted straight into the
 * live table (see supabase/course-content-drafts/vibecoding-class-*.sql).
 */
export function useVibeCodingContent(classNumber) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(Boolean(classNumber));
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (!classNumber || !isSupabaseConfigured) {
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
      .from('vibecoding_content')
      .select('title, topics, session, assignment, challenge_features, resources')
      .eq('class_number', classNumber)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setLocked(true);
        } else {
          setContent({
            title: data.title,
            topics: data.topics,
            session: data.session,
            assignment: data.assignment,
            challengeFeatures: data.challenge_features,
            resources: data.resources,
          });
        }
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [classNumber]);

  return { content, loading, locked };
}

/**
 * Fetches the whole Vibe Coding prompt library (8 reusable prompts, not
 * tied to any one class). Same RLS gating as class content.
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
