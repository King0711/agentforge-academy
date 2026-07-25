import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Tag, Loader2, Zap, CalendarDays } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePro } from '../hooks/usePro';
import { useCohortSchedule } from '../hooks/useCohortSchedule';
import { supabase } from '../lib/supabaseClient';
import { agents } from '../data/agents';

const builder1Count = agents.filter((a) => a.difficulty === 'Builder 1').length;
const builder2Count = agents.filter((a) => a.difficulty === 'Builder 2').length;

const BUILDER1_FEATURES = [
  `${builder1Count} Builder 1 agent sessions`,
  'Copy-paste prompts for every build',
  'XP tracking & progress',
  'Portfolio write-up prompts',
  '6 months of access',
];

const BUILDER2_FEATURES = [
  `${builder2Count} Builder 2 agent sessions`,
  'Multi-step, API-integrated agent builds',
  'XP tracking & progress',
  'Portfolio write-up prompts',
  '6 months of access',
];

const PRO_FEATURES = [
  `All ${builder1Count + builder2Count} sessions — Builder 1 + Builder 2`,
  'No prerequisite — both tracks unlock immediately',
  'XP tracking & progress across both tracks',
  'Portfolio write-up prompts for every agent',
  'Priority support',
  '6 months of access',
];

const ANCHOR_PRICE = 100000;
const BUILDER_PRICE = 50000;
const BUILDER_SAVINGS = ANCHOR_PRICE - BUILDER_PRICE;
const PRO_PRICE = 90000;

// Returns a display string for a cohort start date, or null if it's unset
// or already in the past (an admin who forgets to clear a stale date
// shouldn't leave "cohort starts" showing for a date that's already gone).
function formatCohortDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(`${dateStr}T00:00:00`);
  if (date < new Date(new Date().toDateString())) return null;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Pricing() {
  const { user } = useAuth();
  const { hasBuilder1, hasBuilder2, isPro } = usePro();
  const { builder1: builder1CohortDate, builder2: builder2CohortDate } = useCohortSchedule();
  const navigate = useNavigate();

  const builder1Cohort = formatCohortDate(builder1CohortDate);
  const builder2Cohort = formatCohortDate(builder2CohortDate);

  const [checkoutLoading, setCheckoutLoading] = useState(null); // 'builder1' | 'builder2' | 'pro' | null
  const [checkoutError, setCheckoutError] = useState('');

  const handleCheckout = async (plan) => {
    if (!user) {
      navigate('/welcome');
      return;
    }
    setCheckoutError('');
    setCheckoutLoading(plan);
    try {
      // `user` above can look truthy from cached auth state even when the
      // underlying session token is gone (e.g. it lived in sessionStorage
      // only and the tab was closed/reopened) — that combination is what
      // caused checkout to fire with no Authorization header and fail with
      // a cryptic "non-2xx status" error. Confirm a real session exists
      // right before spending a network round-trip on it.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setCheckoutError('Your session has expired. Please log in again to continue.');
        setCheckoutLoading(null);
        navigate('/welcome');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-paystack-checkout', {
        body: { plan, redirectOrigin: window.location.origin },
      });
      if (error) {
        // supabase-js's error.message is a generic "non-2xx status" string —
        // the real reason is in the response body on error.context.
        if (error.context) {
          try {
            const body = await error.context.clone().json();
            console.error('create-paystack-checkout error response:', error.context.status, body);
          } catch {
            const text = await error.context.clone().text();
            console.error('create-paystack-checkout error response (non-JSON):', error.context.status, text);
          }
        }
        throw error;
      }
      if (!data?.authorization_url) throw new Error(data?.error || 'Could not start checkout.');
      window.location.href = data.authorization_url;
    } catch (err) {
      setCheckoutError(err.message || 'Something went wrong starting checkout. Please try again.');
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <span className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-1.5 rounded-full bg-[#F3EBFF] text-brand">
          Simple, one-time pricing
        </span>
        <h1 className="font-display font-extrabold text-[32px] sm:text-[42px] leading-[1.1] text-ink tracking-[-1px] mt-4 mb-2.5">
          Build agents. Level up your career.
        </h1>
        <p className="text-body text-base max-w-xl mx-auto">
          Pay once, build for 6 months. Start with Builder 1, move on to Builder 2, or get both bundled as Pro.
        </p>
      </motion.div>

      {checkoutError && (
        <div className="max-w-md mx-auto mb-6 flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] border border-rose/20 rounded-lg px-3 py-2.5 text-left">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {checkoutError}
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">

        {/* Builder 1 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[22px] border-[1.5px] border-border-soft bg-white p-7.5 flex flex-col"
        >
          <div className="font-extrabold text-ink text-lg">🌱 Builder 1</div>
          <div className="flex items-baseline gap-2.5 mt-2.5 mb-0.5">
            <span className="text-base text-gray-400 line-through">₦{ANCHOR_PRICE.toLocaleString()}</span>
            <span className="font-display font-extrabold text-[34px] text-ink">₦{BUILDER_PRICE.toLocaleString()}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            <span className="inline-flex items-center gap-1 bg-[#EAFAF1] text-green font-extrabold text-[11.5px] px-2.5 py-1 rounded-full w-fit">
              <Tag className="w-3 h-3" /> Save ₦{BUILDER_SAVINGS.toLocaleString()} · 50% off
            </span>
            {builder1Cohort && (
              <span className="inline-flex items-center gap-1 bg-[#F3EBFF] text-brand font-bold text-[11.5px] px-2.5 py-1 rounded-full w-fit">
                <CalendarDays className="w-3 h-3" /> Cohort starts {builder1Cohort}
              </span>
            )}
          </div>
          <p className="text-[13.5px] text-body mb-4.5">One-time payment. Start here — the foundation track.</p>
          <ul className="flex flex-col gap-2.5 mb-5.5 flex-1">
            {BUILDER1_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-body-strong">
                <CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {hasBuilder1 ? (
            <div className="rounded-xl bg-[#EAFAF1] border border-green/30 px-4 py-3 text-center text-sm font-bold text-green">
              You already have Builder 1
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => handleCheckout('builder1')}
                disabled={checkoutLoading === 'builder1'}
                className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep disabled:opacity-60 text-white font-extrabold px-6 py-3.5 rounded-xl shadow-[0_10px_22px_rgba(124,58,237,.35)] transition-colors"
              >
                {checkoutLoading === 'builder1' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {user ? `Pay ₦${BUILDER_PRICE.toLocaleString()} with Paystack` : 'Sign up to get started'}
              </button>
              {!user && <p className="text-center text-xs text-gray-400 mt-1">Sign up first — then come back to pay.</p>}
            </div>
          )}
        </motion.div>

        {/* Builder 2 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-[22px] border-[1.5px] border-border-soft bg-white p-7.5 flex flex-col"
        >
          <div className="font-extrabold text-ink text-lg">⚡ Builder 2</div>
          <div className="flex items-baseline gap-2.5 mt-2.5 mb-0.5">
            <span className="text-base text-gray-400 line-through">₦{ANCHOR_PRICE.toLocaleString()}</span>
            <span className="font-display font-extrabold text-[34px] text-ink">₦{BUILDER_PRICE.toLocaleString()}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            <span className="inline-flex items-center gap-1 bg-[#EAFAF1] text-green font-extrabold text-[11.5px] px-2.5 py-1 rounded-full w-fit">
              <Tag className="w-3 h-3" /> Save ₦{BUILDER_SAVINGS.toLocaleString()} · 50% off
            </span>
            {builder2Cohort && (
              <span className="inline-flex items-center gap-1 bg-[#F3EBFF] text-brand font-bold text-[11.5px] px-2.5 py-1 rounded-full w-fit">
                <CalendarDays className="w-3 h-3" /> Cohort starts {builder2Cohort}
              </span>
            )}
          </div>
          <p className="text-[13.5px] text-body mb-4.5">One-time payment. Best after finishing Builder 1 — but nothing stops you from jumping in early.</p>
          <ul className="flex flex-col gap-2.5 mb-5.5 flex-1">
            {BUILDER2_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-body-strong">
                <CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {hasBuilder2 ? (
            <div className="rounded-xl bg-[#EAFAF1] border border-green/30 px-4 py-3 text-center text-sm font-bold text-green">
              You already have Builder 2
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => handleCheckout('builder2')}
                disabled={checkoutLoading === 'builder2'}
                className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep disabled:opacity-60 text-white font-extrabold px-6 py-3.5 rounded-xl shadow-[0_10px_22px_rgba(124,58,237,.35)] transition-colors"
              >
                {checkoutLoading === 'builder2' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {user ? `Pay ₦${BUILDER_PRICE.toLocaleString()} with Paystack` : 'Sign up to get started'}
              </button>
              {!user && <p className="text-center text-xs text-gray-400 mt-1">Sign up first — then come back to pay.</p>}
            </div>
          )}
        </motion.div>

        {/* Pro (bundle) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-[22px] border-[2.5px] border-brand p-7.5 flex flex-col relative"
          style={{ background: 'linear-gradient(180deg, #FAF7FF, #FFF)' }}
        >
          <span className="absolute -top-3.5 right-6 bg-brand text-white text-[11px] font-extrabold px-3.5 py-1.5 rounded-full">
            BEST VALUE
          </span>
          <div className="font-extrabold text-ink text-lg flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-brand" /> Pro
          </div>
          <div className="font-display font-extrabold text-[38px] text-ink mt-2.5 mb-0.5">
            ₦{PRO_PRICE.toLocaleString()}
          </div>
          <p className="text-[13.5px] text-body mb-4.5">
            One-time payment for Builder 1 + Builder 2 together — no prerequisite, both unlock immediately.
          </p>
          <ul className="flex flex-col gap-2.5 mb-5.5 flex-1">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-body-strong">
                <CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {isPro ? (
            <div className="rounded-xl bg-[#EAFAF1] border border-green/30 px-4 py-3 text-center text-sm font-bold text-green">
              You're on Pro — enjoy full access!
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => handleCheckout('pro')}
                disabled={checkoutLoading === 'pro'}
                className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep disabled:opacity-60 text-white font-extrabold px-6 py-3.5 rounded-xl shadow-[0_10px_22px_rgba(124,58,237,.35)] transition-colors"
              >
                {checkoutLoading === 'pro' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {user ? `Pay ₦${PRO_PRICE.toLocaleString()} with Paystack` : 'Sign up to get started'}
              </button>
              {!user && <p className="text-center text-xs text-gray-400 mt-1">Sign up first — then come back to pay.</p>}
            </div>
          )}
        </motion.div>
      </div>

      {/* Payment methods */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-9 text-center">
        <p className="text-[13.5px] text-gray-400 mb-3">
          Payments processed securely by Paystack — cards accepted worldwide
        </p>
        <div className="flex flex-wrap justify-center gap-2.5">
          {['Bank Transfer', 'USSD', 'Mobile Money', 'Visa / Mastercard'].map((m) => (
            <span key={m} className="text-xs font-semibold text-body border border-border-soft rounded-full px-3.5 py-1.5">
              {m}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-6">
          Every plan is a one-time payment for 6 months of access — no auto-renewal. For billing questions email support@socialdevtech.com
        </p>
      </motion.div>
    </div>
  );
}
