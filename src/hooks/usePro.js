import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

function isActive(expiresAt) {
  return Boolean(expiresAt) && new Date(expiresAt) > new Date();
}

export function usePro() {
  const { user } = useAuth();
  const [hasBuilder1, setHasBuilder1] = useState(false);
  const [hasBuilder2, setHasBuilder2] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [proLoading, setProLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !user) {
      setHasBuilder1(false);
      setHasBuilder2(false);
      setIsAdmin(false);
      setProLoading(false);
      return;
    }

    setProLoading(true);
    supabase
      .from('entitlements')
      .select('builder1_expires_at, builder2_expires_at, is_admin')
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setHasBuilder1(false);
          setHasBuilder2(false);
          setIsAdmin(false);
          setProLoading(false);
          return;
        }
        const admin = Boolean(data.is_admin);
        setIsAdmin(admin);
        setHasBuilder1(admin || isActive(data.builder1_expires_at));
        setHasBuilder2(admin || isActive(data.builder2_expires_at));
        setProLoading(false);
      });
  }, [user]);

  // isPro is a convenience alias meaning "has full access" (both tiers, or
  // admin) — kept for the handful of places that just need a yes/no badge
  // rather than per-tier detail.
  const isPro = isAdmin || (hasBuilder1 && hasBuilder2);

  return { hasBuilder1, hasBuilder2, isPro, isAdmin, proLoading };
}
