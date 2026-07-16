import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

export function usePro() {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [proLoading, setProLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !user) {
      setIsPro(false);
      setIsAdmin(false);
      setProLoading(false);
      return;
    }

    setProLoading(true);
    supabase
      .from('profiles')
      .select('is_pro, pro_expires_at, is_admin')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setIsPro(false);
          setIsAdmin(false);
          setProLoading(false);
          return;
        }
        const admin = Boolean(data.is_admin);
        const expired = data.pro_expires_at && new Date(data.pro_expires_at) < new Date();
        const pro = admin || (Boolean(data.is_pro) && !expired);
        setIsAdmin(admin);
        setIsPro(pro);
        setProLoading(false);
      });
  }, [user]);

  return { isPro, isAdmin, proLoading };
}
