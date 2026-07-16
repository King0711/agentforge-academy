import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, Globe, Lock, Users, AlertCircle, Tag, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePro } from '../hooks/usePro';

const FREE_FEATURES = [
  '12 Beginner agent sessions',
  'XP tracking & progress',
  'Learning paths overview',
  'Community leaderboard',
];

const PRO_FEATURES = [
  'All 44 agent sessions (Beginner → World Class)',
  'Intermediate, Advanced & World Class unlocked',
  'Portfolio write-up prompts for every agent',
  'Full learning paths with guided order',
  'XP tracking & progress',
  'Priority support',
];

const LIVE_FEATURES = [
  'Everything in Pro',
  '4 weeks of live instructor-led classes',
  'Daily hands-on AI agent builds with Claude',
  'Real-time feedback & code reviews',
  'Private cohort community (Discord)',
  'Certificate of completion',
  'Career coaching & portfolio review',
];

const FLUTTERWAVE_LINK = 'https://flutterwave.com/pay/agentforge-pro';
const LEMONSQUEEZY_LINK = 'https://agentforge.lemonsqueezy.com/buy/pro-monthly';
const FLUTTERWAVE_LIVE_LINK = 'https://flutterwave.com/pay/socialdev-live';
const LEMONSQUEEZY_LIVE_LINK = 'https://agentforge.lemonsqueezy.com/buy/live-class';

const BYU_DOMAIN = 'byupathway.edu';
const DISCOUNT_RATE = 0.05;

function DiscountBadge({ discount }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-400/10 border border-emerald-400/30 px-2 py-0.5 rounded-full">
      <Tag className="w-3 h-3" /> {discount}% student discount applied!
    </span>
  );
}

export default function Pricing() {
  const { user } = useAuth();
  const { isPro } = usePro();

  const [studentEmail, setStudentEmail] = useState('');
  const [studentEmailTouched, setStudentEmailTouched] = useState(false);

  const isBYU = studentEmail.trim().toLowerCase().endsWith(`@${BYU_DOMAIN}`);
  const discountPercent = isBYU ? 5 : 0;
  const originalLive = 40000;
  const discountedLive = Math.round(originalLive * (1 - DISCOUNT_RATE));

  const studentEmailValid = studentEmail.includes('@') && studentEmail.includes('.');

  return (
    <div className="min-h-screen bg-[#0A0A1A]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#0067B8] mb-4">
            <Zap className="w-3.5 h-3.5" />
            Simple pricing
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mt-3 mb-4">
            Build AI Skills.{' '}
            <span className="bg-gradient-to-r from-[#0067B8] to-[#7C3AED] bg-clip-text text-transparent">Level Up Your Career.</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
            Start free. Upgrade when you're ready. Or join a live cohort for the full guided experience.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 flex flex-col"
          >
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Free</h2>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-extrabold text-white">₦0</span>
                <span className="text-slate-400 mb-1">/month</span>
              </div>
              <p className="text-sm text-slate-400 mt-2">Perfect for getting started. No credit card required.</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
              <li className="flex items-start gap-2.5 text-sm text-slate-500">
                <Lock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Intermediate, Advanced & World Class locked
              </li>
            </ul>
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-slate-400">
              {isPro ? 'Included in your plan' : 'Your current plan'}
            </div>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-[#0067B8]/40 bg-gradient-to-br from-[#0067B8]/10 to-[#7C3AED]/10 p-8 flex flex-col relative overflow-hidden"
          >
            <div className="absolute top-4 right-4 text-xs font-bold bg-[#0067B8] text-white px-2.5 py-1 rounded-full">
              Most Popular
            </div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1">Pro</h2>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-extrabold text-white">₦15,000</span>
                <span className="text-slate-400 mb-1">/month</span>
              </div>
              <p className="text-sm text-slate-400 mt-1">or $10/mo internationally</p>
              <p className="text-sm text-slate-400 mt-1">Unlock everything. Cancel anytime.</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            {isPro ? (
              <div className="rounded-lg bg-emerald-500/20 border border-emerald-400/30 px-4 py-3 text-center text-sm font-bold text-emerald-300">
                You're on Pro — enjoy full access!
              </div>
            ) : (
              <div className="space-y-3">
                <a
                  href={user ? FLUTTERWAVE_LINK : '/welcome'}
                  target={user ? '_blank' : '_self'}
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#0067B8] hover:bg-[#0078D4] text-white font-bold px-6 py-3 rounded-lg transition-colors"
                >
                  Pay ₦15,000/mo — Nigeria & Africa
                </a>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-slate-500">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <a
                  href={user ? LEMONSQUEEZY_LINK : '/welcome'}
                  target={user ? '_blank' : '_self'}
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 border border-white/20 text-white font-bold px-6 py-3 rounded-lg transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  Pay $10/mo — International
                </a>
                {!user && <p className="text-center text-xs text-slate-500 mt-1">Sign up first — then come back to subscribe.</p>}
              </div>
            )}
          </motion.div>

          {/* Live Classes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-400/10 to-[#7C3AED]/10 p-8 flex flex-col relative overflow-hidden"
          >
            <div className="absolute top-4 right-4 text-xs font-bold bg-amber-500 text-[#0A0A1A] px-2.5 py-1 rounded-full flex items-center gap-1">
              <Video className="w-3 h-3" /> Live
            </div>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white mb-1">Live Classes</h2>
              <div className="flex items-end gap-2 flex-wrap">
                {isBYU && (
                  <span className="text-2xl font-bold text-slate-500 line-through">₦{originalLive.toLocaleString()}</span>
                )}
                <span className="text-4xl font-extrabold text-white">
                  ₦{(isBYU ? discountedLive : originalLive).toLocaleString()}
                </span>
                <span className="text-slate-400 mb-1">one-time</span>
              </div>
              {isBYU && (
                <div className="mt-1">
                  <DiscountBadge discount={5} />
                </div>
              )}
              <p className="text-sm text-slate-300 mt-2">1-month intensive cohort. Next cohort starts soon.</p>
            </div>

            {/* Claude cost note */}
            <div className="flex items-start gap-2 text-xs text-amber-200 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-2.5 mb-4">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Note:</strong> Students will need an active Claude subscription (~$20/month) for the duration of the class. This covers your AI usage during the course.
              </span>
            </div>

            <ul className="space-y-3 mb-6 flex-1">
              {LIVE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            {/* Student email discount input */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Student at BYU Pathway? Enter your .edu email for 5% off
              </label>
              <input
                type="email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                onBlur={() => setStudentEmailTouched(true)}
                placeholder="yourname@byupathway.edu"
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
              {studentEmailTouched && studentEmail && !isBYU && studentEmailValid && (
                <p className="text-xs text-slate-500 mt-1">
                  Student discount is available for <strong>@{BYU_DOMAIN}</strong> addresses only.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <a
                href={user ? FLUTTERWAVE_LIVE_LINK : '/welcome'}
                target={user ? '_blank' : '_self'}
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 text-[#0A0A1A] font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Enroll — Nigeria & Africa
              </a>
              <a
                href={user ? LEMONSQUEEZY_LIVE_LINK : '/welcome'}
                target={user ? '_blank' : '_self'}
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 border border-white/20 text-white font-bold px-6 py-3 rounded-lg transition-colors"
              >
                <Globe className="w-4 h-4" />
                Enroll — International ($25)
              </a>
              {!user && <p className="text-center text-xs text-slate-500 mt-1">Sign up first — then enroll in the live cohort.</p>}
            </div>
          </motion.div>
        </div>

        {/* Payment methods */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-10 text-center">
          <p className="text-sm text-slate-500 mb-3">Nigeria & Africa payment options (via Flutterwave)</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Bank Transfer', 'USSD', 'Mobile Money', 'Visa / Mastercard', 'PayPal'].map((m) => (
              <span key={m} className="text-xs font-medium text-slate-400 border border-white/10 rounded-full px-3 py-1 bg-white/[0.03]">
                {m}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-6">
            Subscriptions renew monthly. Cancel anytime. For billing questions email support@socialdevtech.com
          </p>
        </motion.div>
      </div>
    </div>
  );
}
