import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export function useCertificates(userId) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    if (!userId || !isSupabaseConfigured) {
      setCertificates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('certificates')
      .select('id, tier, student_name, issued_at, revoked')
      .eq('user_id', userId)
      .order('issued_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setCertificates(data);
        setLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { certificates, loading, refetch };
}
