import { m } from 'framer-motion';
import { CheckCircle2, AlertCircle, Infinity as InfinityIcon, Loader2, Zap, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePro } from '../hooks/usePro';
import { usePaystackCheckout } from '../hooks/usePaystackCheckout';
import { agents } from '../data/agents';
import { BUILDER1_PRICE, BUILDER2_PRICE, PRO_PRICE } from '../data/pricing';
import { usePageSeo } from '../hooks/usePageSeo';

const builder1Count = agents.filter((a) => a.difficulty === 'Builder 1').length;
const builder2Count = agents.filter((a) => a.difficulty === 'Builder 2').length;

const BUILDER1_FEATURES = [
  `${builder1Count} Builder 1 agent guides`,
  'Copy-paste prompts for every build',
  'XP tracking & progress',
  'Portfolio write-up prompts',
  'Permanent access — yours to keep',
];

const BUILDER2_FEATURES = [
  `${builder2Count} Builder 2 agent guides`,
  'Multi-step, API-integrated agent builds',
  'XP tracking & progress',
  'Portfolio write-up prompts',
  'Permanent access — yours to keep',
];

const PRO_FEATURES = [
  `All ${builder1Count + builder2Count} guides — Builder 1 + Builder 2`,
  'No prerequisite — both tracks unlock immediately',
  'XP tracking & progress across both tracks',
  'Portfolio write-up prompts for every agent',
  'Permanent access — yours to keep',
];

export default function Pricing() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { hasBuilder1, hasBuilder2, isPro } = usePro();

  usePageSeo({
    title: 'Pricing — Builder 1, Builder 2 & Pro | Social Dev Technologies',
    description: 'Simple, one-time pricing for Builder 1, Builder 2, or the combined Pro plan — permanent access to the guides, no subscription, no expiry.',
    canonicalPath: '/pricing',
  });

  const { checkout: handleCheckout, loadingKey: checkoutLoading, error: checkoutError } = usePaystackCheckout();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">

      {/* Header */}
      <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <span className="inline-flex items-center gap-2 text-[13px] font-bold px-4 py-1.5 rounded-full bg-[#F3EBFF] dark:bg-brand/15 text-brand">
          Simple, one-time pricing
        </span>
        <h1 className="font-display font-extrabold text-[32px] sm:text-[42px] leading-[1.1] text-ink tracking-[-1px] mt-4 mb-2.5">
          Build agents. Level up your career.
        </h1>
        <p className="text-body text-base max-w-xl mx-auto">
          Pay once, keep the guides forever. Start with Builder 1, move on to Builder 2, or get both as Pro.
        </p>
        <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-brand bg-[#F3EBFF] dark:bg-brand/15 rounded-full px-4 py-2 mt-4">
          <Info className="w-4 h-4 flex-shrink-0" />
          All you need is a free Gemini API key from Google AI Studio — no paid AI subscription required.
        </div>
      </m.div>

      {checkoutError && (
        <div className="max-w-md mx-auto mb-6 flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-3 py-2.5 text-left">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {checkoutError}
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">

        {/* Builder 1 */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-[22px] border-[1.5px] border-border-soft bg-white dark:bg-[#181818] p-7.5 flex flex-col"
        >
          <div className="font-extrabold text-ink text-lg">🌱 Builder 1</div>
          <div className="flex items-baseline gap-2.5 mt-2.5 mb-0.5">
            <span className="font-display font-extrabold text-[34px] text-ink">₦<span>{BUILDER1_PRICE.toLocaleString()}</span></span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            <span className="inline-flex items-center gap-1 bg-[#EAFAF1] dark:bg-green/10 text-green font-extrabold text-[11.5px] px-2.5 py-1 rounded-full w-fit">
              <InfinityIcon className="w-3 h-3" /> Yours forever — no expiry
            </span>
          </div>
          <p className="text-[13.5px] text-body mb-4.5">One-time payment, permanent access. Start here — the foundation track.</p>
          <ul className="flex flex-col gap-2.5 mb-5.5 flex-1">
            {BUILDER1_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-body-strong">
                <CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {hasBuilder1 ? (
            <div className="rounded-xl bg-[#EAFAF1] dark:bg-green/10 border border-green/30 px-4 py-3 text-center text-sm font-bold text-green">
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
                {user ? `Pay ₦${BUILDER1_PRICE.toLocaleString()} with Paystack` : 'Sign up to get started'}
              </button>
              {!user && <p className="text-center text-xs text-gray-400 mt-1">Sign up first — then come back to pay.</p>}
            </div>
          )}
        </m.div>

        {/* Builder 2 */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-[22px] border-[1.5px] border-border-soft bg-white dark:bg-[#181818] p-7.5 flex flex-col"
        >
          <div className="font-extrabold text-ink text-lg">⚡ Builder 2</div>
          <div className="flex items-baseline gap-2.5 mt-2.5 mb-0.5">
            <span className="font-display font-extrabold text-[34px] text-ink">₦<span>{BUILDER2_PRICE.toLocaleString()}</span></span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            <span className="inline-flex items-center gap-1 bg-[#EAFAF1] dark:bg-green/10 text-green font-extrabold text-[11.5px] px-2.5 py-1 rounded-full w-fit">
              <InfinityIcon className="w-3 h-3" /> Yours forever — no expiry
            </span>
          </div>
          <p className="text-[13.5px] text-body mb-4.5">One-time payment, permanent access. Best after finishing Builder 1 — but nothing stops you from jumping in early.</p>
          <ul className="flex flex-col gap-2.5 mb-5.5 flex-1">
            {BUILDER2_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-body-strong">
                <CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {hasBuilder2 ? (
            <div className="rounded-xl bg-[#EAFAF1] dark:bg-green/10 border border-green/30 px-4 py-3 text-center text-sm font-bold text-green">
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
                {user ? `Pay ₦${BUILDER2_PRICE.toLocaleString()} with Paystack` : 'Sign up to get started'}
              </button>
              {!user && <p className="text-center text-xs text-gray-400 mt-1">Sign up first — then come back to pay.</p>}
            </div>
          )}
        </m.div>

        {/* Pro (bundle) */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-[22px] border-[2.5px] border-brand p-7.5 flex flex-col relative"
          style={{ background: theme === 'dark' ? 'linear-gradient(180deg, #181022, #181818)' : 'linear-gradient(180deg, #FAF7FF, #FFF)' }}
        >
          <span className="absolute -top-3.5 right-6 bg-brand text-white text-[11px] font-extrabold px-3.5 py-1.5 rounded-full">
            BEST VALUE
          </span>
          <div className="font-extrabold text-ink text-lg flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-brand" /> Pro
          </div>
          <div className="font-display font-extrabold text-[38px] text-ink mt-2.5 mb-0.5">
            ₦<span>{PRO_PRICE.toLocaleString()}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            <span className="inline-flex items-center gap-1 bg-[#EAFAF1] dark:bg-green/10 text-green font-extrabold text-[11.5px] px-2.5 py-1 rounded-full w-fit">
              <InfinityIcon className="w-3 h-3" /> Yours forever — no expiry
            </span>
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
            <div className="rounded-xl bg-[#EAFAF1] dark:bg-green/10 border border-green/30 px-4 py-3 text-center text-sm font-bold text-green">
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
        </m.div>
      </div>

      {/* Payment methods */}
      <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-9 text-center">
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
          Every plan is a one-time payment, yours to keep — no subscription, no auto-renewal. For billing questions email support@socialdevtechnologies.com
        </p>
      </m.div>
    </div>
  );
}
