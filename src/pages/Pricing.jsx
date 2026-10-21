import { Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Infinity as InfinityIcon, Loader2, Zap, Info } from 'lucide-react';
import { usePro } from '../hooks/usePro';
import { usePaystackCheckout } from '../hooks/usePaystackCheckout';
import { useUpgradeOffer } from '../hooks/useUpgradeOffer';
import CheckoutAuthModal from '../components/CheckoutAuthModal';
import { agents } from '../data/agents';
import { BUILDER1_PRICE, BUILDER2_PRICE, PRO_PRICE, VIBECODING_PRICE, AI_AGENT_MASTERY_PRICE } from '../data/pricing';
import { usePageSeo } from '../hooks/usePageSeo';
import { Band, PageHero, SectionHeading } from '../components/page/MarketingParts';

import { EmojiText } from '../components/EmojiIcon';
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

// Vibe Coding and AI Agent Mastery are both live cohorts with their own
// full marketing pages (VibeCoding.jsx / AIAgentMastery.jsx) — including
// their own checkout, curriculum detail, and FAQ. This page shows just
// enough to compare all three programs at a glance and send someone to
// the right page, rather than duplicating a second checkout flow for each.
// AI Agent Mastery listed first — it's the priority/flagship program
// (founder-confirmed 2026-09-23), not a reflection of price or launch order.
const LIVE_COHORTS = [
  {
    to: '/ai-agent-mastery',
    name: 'AI Agent Mastery',
    text: 'Live cohort. Build a chief of staff plus a squad of specialist agents (research, design, images, coding, video) that you run from your phone, with guardrails built in.',
    bullets: ['Live instructor-led classes', 'A team that works while you sleep', 'Certificate of completion'],
    price: AI_AGENT_MASTERY_PRICE,
    hasKey: 'hasAiMastery',
    coursePath: '/ai-agent-mastery/course',
  },
  {
    to: '/vibe-coding',
    name: 'Vibe Coding Bootcamp',
    text: '4 weeks, 8 live classes. Go from an idea to a deployed website, web app, and AI-powered product — no coding experience required.',
    bullets: ['Live instructor-led classes', 'Portfolio site, to-do app, Supabase CRUD app + more', 'Certificate of completion'],
    price: VIBECODING_PRICE,
    hasKey: 'hasVibeCoding',
    coursePath: '/vibe-coding/course',
  },
];

// Shown instead of a full-price button when the visitor owns exactly one guide
// tier: the upgrade-by-difference price (see useUpgradeOffer). `target` is the
// tier/bundle this card sells, so the offer only replaces the button on the
// cards it actually applies to.
function UpgradeButton({ offer, loading, onClick, target }) {
  const label = target === 'pro' ? 'Upgrade to Pro' : `Unlock ${offer.missingLabel}`;
  return (
    <div>
      <button
        onClick={onClick}
        disabled={loading}
        className="btn btn-primary w-full disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {loading ? 'Starting checkout…' : `${label} — pay ₦${offer.price.toLocaleString()}`}
      </button>
      <p className="text-center text-sm text-body mt-2">
        You own {offer.ownedLabel}, so you only pay the difference to Pro — not ₦{offer.listPrice.toLocaleString()}.
      </p>
    </div>
  );
}

export default function Pricing() {
  const { hasBuilder1, hasBuilder2, isPro, hasVibeCoding, hasAiMastery } = usePro();
  const { offer: upgradeOffer } = useUpgradeOffer();
  const cohortAccess = { hasVibeCoding, hasAiMastery };

  usePageSeo({
    title: 'Pricing — AI Agent Mastery, Vibe Coding & AI Agent Guides | Social Dev Technologies',
    description: 'Every program and price in one place — a live cohort with AI Agent Mastery or Vibe Coding, or permanent AI Agent Guides from ₦5,000.',
    canonicalPath: '/pricing',
  });

  const {
    checkout: handleCheckout, loadingKey: checkoutLoading, error: checkoutError,
    authModalOpen, closeAuthModal, submitLead, leadLoading, leadError,
  } = usePaystackCheckout();

  const guideBtn = 'btn btn-primary w-full disabled:opacity-60';
  const owned = 'rounded-xl bg-[#EAFAF1] dark:bg-green/10 border border-green/30 px-4 py-3 text-center text-sm font-bold text-green';

  return (
    <div>
      <PageHero
        title="Every program, every price."
        lead="Pick the path that fits: a live cohort with real classes, or self-paced AI Agent Guides you keep forever."
        facts={['One-time payments', 'No subscription, no auto-renewal', 'Pay by card, bank transfer or USSD']}
      />

      {/* Live cohorts — Vibe Coding & AI Agent Mastery, each with their own
          full page (marketing detail + checkout). Summarized here just
          enough to compare against the guides below and send people to
          the right page. */}
      <Band>
        <SectionHeading lead="Instructor-led, real classes, a fixed cohort of students.">Live cohorts</SectionHeading>
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {LIVE_COHORTS.map((program) => {
            const enrolled = cohortAccess[program.hasKey];
            return (
              <article key={program.to} className="card-flat flex flex-col p-7 lg:p-9">
                <h3 className="font-display font-extrabold text-2xl lg:text-3xl leading-tight tracking-[-0.03em] text-ink">{program.name}</h3>
                <div className="t-num text-5xl lg:text-6xl text-link mt-5">₦{program.price.toLocaleString()}</div>
                <div className="t-mono text-body mt-2 mb-5">one-time</div>
                <p className="t-card text-body mb-5">{program.text}</p>
                <ul className="list-none m-0 p-0 flex flex-col gap-2.5 mb-7 flex-1">
                  {program.bullets.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[15px] text-ink">
                      <CheckCircle2 className="w-4 h-4 text-green mt-1 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={enrolled ? program.coursePath : program.to}
                  className={enrolled ? owned : 'btn btn-primary w-full'}
                >
                  {enrolled ? "You're enrolled — go to your classes →" : `Explore ${program.name} →`}
                </Link>
              </article>
            );
          })}
        </div>
      </Band>

      {/* AI Agent Guides */}
      <Band tone="white">
        <SectionHeading lead="Self-paced. Builder 1, Builder 2, or both as Pro.">AI Agent Guides</SectionHeading>

        <p className="flex items-start gap-2 text-[15px] font-semibold text-ink -mt-6 mb-8 max-w-[44em]">
          <Info className="w-4 h-4 mt-1 flex-shrink-0 text-link" />
          All you need is a free Gemini API key from Google AI Studio. No paid AI subscription required.
        </p>

        {checkoutError && (
          <div className="mb-6 flex items-start gap-2 text-sm text-rose bg-[#FBEAE9] dark:bg-rose/10 border border-rose/20 rounded-lg px-3 py-2.5 text-left">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {checkoutError}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {/* Builder 1 */}
          <article className="card-flat flex flex-col p-7 lg:p-8">
            <div className="t-eyebrow h-3 mb-4" />
            <h3 className="font-display font-extrabold text-2xl tracking-[-0.02em] text-ink"><EmojiText>🌱 Builder 1</EmojiText></h3>
            <div className="t-num text-5xl text-ink mt-4">₦<span>{BUILDER1_PRICE.toLocaleString()}</span></div>
            <p className="inline-flex items-center gap-1.5 text-sm font-bold text-green mt-3 mb-4">
              <InfinityIcon className="w-4 h-4" /> Yours forever, no expiry
            </p>
            <p className="t-card text-body mb-5">One-time payment, permanent access. Start here: the foundation track.</p>
            <ul className="list-none m-0 p-0 flex flex-col gap-2.5 mb-7 flex-1">
              {BUILDER1_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[15px] text-ink">
                  <CheckCircle2 className="w-4 h-4 text-green mt-1 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {hasBuilder1 ? (
              <div className={owned}>You already have Builder 1</div>
            ) : upgradeOffer?.missingLabel === 'Builder 1' ? (
              <UpgradeButton offer={upgradeOffer} target="builder1" loading={checkoutLoading === 'proupgrade'} onClick={() => handleCheckout('proupgrade')} />
            ) : (
              <button onClick={() => handleCheckout('builder1')} disabled={checkoutLoading === 'builder1'} className={guideBtn}>
                {checkoutLoading === 'builder1' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {checkoutLoading === 'builder1' ? 'Starting checkout…' : `Pay ₦${BUILDER1_PRICE.toLocaleString()} with Paystack`}
              </button>
            )}
          </article>

          {/* Builder 2 */}
          <article className="card-flat flex flex-col p-7 lg:p-8">
            <div className="t-eyebrow h-3 mb-4" />
            <h3 className="font-display font-extrabold text-2xl tracking-[-0.02em] text-ink"><EmojiText>⚡ Builder 2</EmojiText></h3>
            <div className="t-num text-5xl text-ink mt-4">₦<span>{BUILDER2_PRICE.toLocaleString()}</span></div>
            <p className="inline-flex items-center gap-1.5 text-sm font-bold text-green mt-3 mb-4">
              <InfinityIcon className="w-4 h-4" /> Yours forever, no expiry
            </p>
            <p className="t-card text-body mb-5">One-time payment, permanent access. Best after finishing Builder 1, but nothing stops you from jumping in early.</p>
            <ul className="list-none m-0 p-0 flex flex-col gap-2.5 mb-7 flex-1">
              {BUILDER2_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[15px] text-ink">
                  <CheckCircle2 className="w-4 h-4 text-green mt-1 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {hasBuilder2 ? (
              <div className={owned}>You already have Builder 2</div>
            ) : upgradeOffer?.missingLabel === 'Builder 2' ? (
              <UpgradeButton offer={upgradeOffer} target="builder2" loading={checkoutLoading === 'proupgrade'} onClick={() => handleCheckout('proupgrade')} />
            ) : (
              <button onClick={() => handleCheckout('builder2')} disabled={checkoutLoading === 'builder2'} className={guideBtn}>
                {checkoutLoading === 'builder2' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {checkoutLoading === 'builder2' ? 'Starting checkout…' : `Pay ₦${BUILDER2_PRICE.toLocaleString()} with Paystack`}
              </button>
            )}
          </article>

          {/* Pro (bundle) */}
          <article className="card-flat flex flex-col p-7 lg:p-8 border-2 !border-brand">
            <div className="t-eyebrow h-3 mb-4 text-link">Best value</div>
            <h3 className="font-display font-extrabold text-2xl tracking-[-0.02em] text-ink flex items-center gap-2">
              <Zap className="w-5 h-5 text-link" /> Pro
            </h3>
            <div className="t-num text-5xl text-ink mt-4">₦<span>{PRO_PRICE.toLocaleString()}</span></div>
            <p className="inline-flex items-center gap-1.5 text-sm font-bold text-green mt-3 mb-4">
              <InfinityIcon className="w-4 h-4" /> Yours forever, no expiry
            </p>
            <p className="t-card text-body mb-5">One-time payment for Builder 1 + Builder 2 together. No prerequisite, both unlock immediately.</p>
            <ul className="list-none m-0 p-0 flex flex-col gap-2.5 mb-7 flex-1">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[15px] text-ink">
                  <CheckCircle2 className="w-4 h-4 text-green mt-1 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {isPro ? (
              <div className={owned}>You're on Pro. Enjoy full access!</div>
            ) : upgradeOffer ? (
              <UpgradeButton offer={upgradeOffer} target="pro" loading={checkoutLoading === 'proupgrade'} onClick={() => handleCheckout('proupgrade')} />
            ) : (
              <button onClick={() => handleCheckout('pro')} disabled={checkoutLoading === 'pro'} className={guideBtn}>
                {checkoutLoading === 'pro' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {checkoutLoading === 'pro' ? 'Starting checkout…' : `Pay ₦${PRO_PRICE.toLocaleString()} with Paystack`}
              </button>
            )}
          </article>
        </div>
      </Band>

      {/* Payment methods */}
      <Band size="sm">
        <p className="text-base font-semibold text-ink mb-4">Payments processed securely by Paystack. Cards accepted worldwide.</p>
        <ul className="list-none m-0 p-0 flex flex-wrap gap-x-8 gap-y-2 text-[15px] text-body">
          {['Bank Transfer', 'USSD', 'Mobile Money', 'Visa / Mastercard'].map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <p className="text-sm text-body mt-6 max-w-[44em]">
          Every plan is a one-time payment, with no subscription and no auto-renewal. For billing questions, message us on{' '}
          <a href="https://wa.me/2349066006963" target="_blank" rel="noreferrer" className="font-bold text-link underline underline-offset-4">WhatsApp</a>.
        </p>
      </Band>

      <CheckoutAuthModal open={authModalOpen} onClose={closeAuthModal} onSubmit={submitLead} loading={leadLoading} error={leadError} />
    </div>
  );
}
