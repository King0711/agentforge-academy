import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

/**
 * Starts a Paystack checkout via create-paystack-checkout and redirects to
 * the returned authorization_url. Shared by every purchase surface (tier
 * plans on Pricing.jsx, a-la-carte guide/bundle buttons) so the session
 * freshness check below — fixing a real bug where cached-but-expired auth
 * state caused checkout to fire with no Authorization header — only lives
 * in one place.
 */
export function usePaystackCheckout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingKey, setLoadingKey] = useState(null);
  const [error, setError] = useState('');

  const checkout = async (plan, extra = {}) => {
    if (!user) {
      navigate('/welcome');
      return;
    }
    setError('');
    setLoadingKey(plan);
    try {
      // `user` above can look truthy from cached auth state even when the
      // underlying session token is gone (e.g. it lived in sessionStorage
      // only and the tab was closed/reopened) — confirm a real session
      // exists right before spending a network round-trip on it.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Your session has expired. Please log in again to continue.');
        setLoadingKey(null);
        navigate('/welcome');
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('create-paystack-checkout', {
        body: { plan, redirectOrigin: window.location.origin, ...extra },
      });
      if (fnError) {
        // supabase-js's error.message is a generic "non-2xx status" string —
        // the real reason is in the response body on error.context.
        if (fnError.context) {
          try {
            const body = await fnError.context.clone().json();
            console.error('create-paystack-checkout error response:', fnError.context.status, body);
          } catch {
            const text = await fnError.context.clone().text();
            console.error('create-paystack-checkout error response (non-JSON):', fnError.context.status, text);
          }
        }
        throw fnError;
      }
      if (!data?.authorization_url) throw new Error(data?.error || 'Could not start checkout.');
      window.location.href = data.authorization_url;
    } catch (err) {
      setError(err.message || 'Something went wrong starting checkout. Please try again.');
      setLoadingKey(null);
    }
  };

  return { checkout, loadingKey, error, setError };
}
