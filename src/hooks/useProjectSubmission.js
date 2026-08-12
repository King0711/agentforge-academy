import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export function useProjectSubmission(userId, agentId) {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId || !agentId || !isSupabaseConfigured) {
      setSubmission(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('project_submissions')
      .select('id, video_url, description')
      .eq('user_id', userId)
      .eq('agent_id', agentId)
      .maybeSingle();
    setSubmission(data || null);
    setLoading(false);
  }, [userId, agentId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // videoUrl/description: pass whichever the student filled in; the other
  // stays null. The has_video_or_description check constraint requires at
  // least one.
  const submit = useCallback(async ({ videoUrl, description }) => {
    if (!userId || !agentId) return { error: { message: 'Not signed in.' } };
    const { data, error } = await supabase
      .from('project_submissions')
      .upsert(
        { user_id: userId, agent_id: agentId, video_url: videoUrl || null, description: description || null },
        { onConflict: 'user_id,agent_id' }
      )
      .select('id, video_url, description')
      .single();
    if (!error) setSubmission(data);
    return { data, error };
  }, [userId, agentId]);

  return { submission, loading, submit, refetch };
}
