import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { invokeWithRetry } from '../lib/invokeFunction';
import { getStoredReferralCode } from '../lib/referral';
import { pixelTrack, trackInitiateCheckout } from '../lib/pixel';

// Where CheckoutComplete.jsx finds the email to send the first-login code to.
// sessionStorage, so it lives only in this tab and goes when the tab closes.
export const GUEST_EMAIL_KEY = 'sdt_guest_email';

/**
 * Starts a Paystack checkout via create-paystack-checkout and redirects to
 * the returned authorization_url. Shared by every purchase surface (guide
 * tiers on Pricing.jsx, Vibe Coding, AI Agent Mastery) so this logic — and
 * the guest form below — only lives in one place.
 *
 * Signed-in buyers go straight through. A visitor who isn't signed in gets
 * CheckoutAuthModal — a name / email / phone form (2026-10-13; it used to be an
 * email-code login) — and pays as a guest: the details are saved as a lead, the
 * account is created after the payment is verified, and they confirm their
 * email with an emailed code the first time they log in. The caller just needs
 * to render `<CheckoutAuthModal open={authModalOpen} onClose={closeAuthModal}
 * onSubmit={submitLead} loading={leadLoading} error={leadError} />` alongside
 * its checkout button(s).
 */
export function usePaystackCheckout() {
  const { user } = useAuth();
  const [loadingKey, setLoadingKey] = useState(null);
  const [error, setError] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadError, setLeadError] = useState('');
  // The plan/extra a checkout() call was made with, replayed when the guest form
  // is submitted — a ref rather than state since it's write-then-read-once,
  // never rendered.
  const pendingRef = useRef(null);

  const openGuestForm = (plan, extra) => {
    pendingRef.current = { plan, extra };
    setLeadError('');
    setLoadingKey(null);
    setAuthModalOpen(true);
  };

  // The real reason is in the response body on error.context — supabase-js's
  // own message is a generic "non-2xx status" string.
  const readFunctionError = async (fnError, fnName) => {
    if (!fnError.context) return null;
    try {
      const body = await fnError.context.clone().json();
      console.error(`${fnName} error response:`, fnError.context.status, body);
      return { status: fnError.context.status, message: body?.error };
    } catch {
      const text = await fnError.context.clone().text();
      console.error(`${fnName} error response (non-JSON):`, fnError.context.status, text);
      return null;
    }
  };

  const runCheckout = async (plan, extra) => {
    setError('');
    setLoadingKey(plan);
    try {
      // A cached-but-expired session (e.g. it lived in sessionStorage only
      // and the tab was closed/reopened) can look authenticated from React
      // state alone — confirm a real session exists right before spending a
      // network round-trip on it. If it's actually gone, treat the buyer as a
      // guest rather than a dead end.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        openGuestForm(plan, extra);
        return;
      }

      trackInitiateCheckout(plan);
      const { data, error: fnError } = await invokeWithRetry('create-paystack-checkout', {
        body: { plan, redirectOrigin: window.location.origin, ...extra },
      });
      if (fnError) {
        await readFunctionError(fnError, 'create-paystack-checkout');
        throw fnError;
      }
      if (!data?.authorization_url) throw new Error(data?.error || 'Could not start checkout.');
      window.location.href = data.authorization_url;
    } catch (err) {
      setError(err.message || 'Something went wrong starting checkout. Please try again.');
      setLoadingKey(null);
    }
  };

  const checkout = async (plan, extra = {}) => {
    if (!user) {
      openGuestForm(plan, extra);
      return;
    }
    await runCheckout(plan, extra);
  };

  // Passed to CheckoutAuthModal as onSubmit: save the lead and go to payment.
  const submitLead = async (lead) => {
    const pending = pendingRef.current;
    if (!pending) return;
    setLeadError('');
    setLeadLoading(true);
    try {
      const { data, error: fnError } = await invokeWithRetry('create-paystack-checkout', {
        body: {
          plan: pending.plan,
          redirectOrigin: window.location.origin,
          lead: { ...lead, referral_code: getStoredReferralCode() || undefined },
        },
      });
      if (fnError) {
        const info = await readFunctionError(fnError, 'create-paystack-checkout');
        // 4xx answers carry a message written for the buyer (bad phone, too many
        // attempts...); anything else gets the generic line.
        throw new Error(info && info.status < 500 && info.message ? info.message : fnError.message);
      }
      if (!data?.authorization_url) throw new Error(data?.error || 'Could not start checkout.');
      try {
        sessionStorage.setItem(GUEST_EMAIL_KEY, lead.email.trim().toLowerCase());
      } catch {
        // Private mode: the complete page just asks for the email instead.
      }
      pixelTrack('Lead', { content_name: pending.plan });
      trackInitiateCheckout(pending.plan);
      window.location.href = data.authorization_url;
    } catch (err) {
      setLeadError(err.message || 'Something went wrong starting checkout. Please try again.');
      setLeadLoading(false);
    }
  };

  const closeAuthModal = () => {
    pendingRef.current = null;
    setAuthModalOpen(false);
    setLeadError('');
  };

  return {
    checkout,
    loadingKey,
    error,
    setError,
    authModalOpen,
    closeAuthModal,
    submitLead,
    leadLoading,
    leadError,
  };
}
