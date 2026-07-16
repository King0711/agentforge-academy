import { motion } from 'framer-motion';
import { CheckCircle2, Zap, Globe, Lock } from 'lucide-react';
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

const FLUTTERWAVE_LINK = 'https://flutterwave.com/pay/agentforge-pro'; // replace with your Flutterwave payment link
const LEMONSQUEEZY_LINK = 'https://agentforge.lemonsqueezy.com/buy/pro-monthly'; // replace with your Lemonsqueezy checkout link

export default function Pricing() {
  const { user } = useAuth();
  const { isPro } = usePro();

  return (
    <div className="min-h-screen bg-[#0A0A1A]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#0067B8] mb-4">
            <Zap className="w-3.5 h-3.5" />
            Simple pricing
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mt-3 mb-4">
            Build agents. <span className="bg-gradient-to-r from-[#0067B8] to-[#7C3AED] bg-clip-text text-transparent">Level up your career.</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
            Start free. Upgrade when you're ready to unlock all 44 sessions and build a portfolio that gets you hired.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
              {isPro ? 'Your current plan includes Free features' : 'Your current plan'}
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
              <p className="text-sm text-slate-400 mt-2">Unlock everything. Cancel anytime.</p>
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
                {/* Flutterwave — Nigeria & Africa */}
                <a
                  href={user ? FLUTTERWAVE_LINK : '/welcome'}
                  target={user ? '_blank' : '_self'}
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#0067B8] hover:bg-[#0078D4] text-white font-bold px-6 py-3 rounded-lg transition-colors"
                >
                  Pay ₦15,000/mo — Nigeria & Africa
                </a>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-slate-500">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* Lemonsqueezy — International */}
                <a
                  href={user ? LEMONSQUEEZY_LINK : '/welcome'}
                  target={user ? '_blank' : '_self'}
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 border border-white/20 text-white font-bold px-6 py-3 rounded-lg transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  Pay $10/mo — International
                </a>

                {!user && (
                  <p className="text-center text-xs text-slate-500 mt-1">
                    Sign up first — then come back to subscribe.
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Payment methods note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 text-center"
        >
          <p className="text-sm text-slate-500 mb-3">Nigeria & Africa payment options (via Flutterwave)</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Bank Transfer', 'USSD', 'Mobile Money', 'Visa / Mastercard', 'PayPal'].map((m) => (
              <span key={m} className="text-xs font-medium text-slate-400 border border-white/10 rounded-full px-3 py-1 bg-white/[0.03]">
                {m}
              </span>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-6">
            Subscriptions renew monthly. Cancel anytime. For billing questions email support@agentforge.academy
          </p>
        </motion.div>
      </div>
    </div>
  );
}
