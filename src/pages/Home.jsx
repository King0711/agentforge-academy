import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Flame, Trophy, Sparkles, MousePointerClick, MessageSquareCode, Award } from 'lucide-react';
import HeroSection from '../components/HeroSection';
import AgentCard from '../components/AgentCard';
import XPBadge from '../components/XPBadge';
import { agents } from '../data/agents';
import { departments } from '../data/departments';
import { usePro } from '../hooks/usePro';

const howItWorksSteps = [
  {
    icon: MousePointerClick,
    step: '01',
    title: 'Pick a session',
    description: '44 guided build sessions across 4 levels — Beginner to World Class. Each one has a time estimate and clear outcomes before you start.',
  },
  {
    icon: MessageSquareCode,
    step: '02',
    title: 'Paste the prompts into Claude',
    description: 'Every build includes ready-to-use prompts for Claude. No blank-page paralysis — just open Claude, paste, and iterate.',
  },
  {
    icon: Award,
    step: '03',
    title: 'Ship it to your portfolio',
    description: 'Each session ends with a portfolio write-up prompt. One click generates LinkedIn posts, resume bullets, and a project description.',
  },
];

const recentBuilds = [
  { id: 1, name: 'Priya N.', agent: 'Customer Support Email Triage Agent', xp: 280, time: '2 min ago' },
  { id: 2, name: 'Marcus T.', agent: 'AI Sales Forecasting Agent', xp: 780, time: '8 min ago' },
  { id: 3, name: 'Aiko S.', agent: 'Smart Meeting Notes Agent', xp: 220, time: '15 min ago' },
  { id: 4, name: 'Daniel K.', agent: 'Autonomous QA Testing Agent', xp: 950, time: '24 min ago' },
  { id: 5, name: 'Fatima R.', agent: 'Personal Finance Tracker Agent', xp: 240, time: '41 min ago' },
];

const weeklyChallenge = {
  title: 'Build the Sales Email Personalization Agent',
  description:
    'This week, build a cold-email agent that researches each prospect and writes a personalized outreach email. Share your output for a chance to be featured.',
  reward: '+520 XP + Featured Builder Badge',
  agentId: 25,
};

export default function Home({ progress, onSelectAgent }) {
  const { isPro } = usePro();
  const featured = [...agents].sort((a, b) => b.popularity - a.popularity).slice(0, 8);
  const challengeAgent = agents.find((a) => a.id === weeklyChallenge.agentId);

  return (
    <div>
      <HeroSection />

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">How it works</h2>
          <p className="mt-2 text-slate-400 text-sm sm:text-base">Three steps from zero to portfolio-ready agent</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {howItWorksSteps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-6"
            >
              <span className="text-5xl font-extrabold text-white/5 absolute top-4 right-5 select-none">{s.step}</span>
              <div className="w-10 h-10 rounded-xl bg-[#0067B8]/20 border border-[#0067B8]/30 flex items-center justify-center mb-4">
                <s.icon className="w-5 h-5 text-[#3FA9F5]" />
              </div>
              <h3 className="font-bold text-white mb-2">{s.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{s.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Department showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Browse by Department</h2>
          <Link to="/catalog" className="text-sm font-semibold text-[#0067B8] flex items-center gap-1 hover:gap-2 transition-all">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {departments.filter((d) => d.id !== 'all').map((dept) => (
            <Link
              key={dept.id}
              to={`/catalog?department=${dept.id}`}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-colors px-4 py-6 text-center"
              style={{ borderColor: `${dept.color}33` }}
            >
              <span className="text-3xl">{dept.icon}</span>
              <span className="text-sm font-semibold text-white">{dept.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured agents */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Most Popular Agents</h2>
          <Link to="/catalog" className="text-sm font-semibold text-[#0067B8] flex items-center gap-1 hover:gap-2 transition-all">
            View full catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featured.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              completed={progress.isCompleted(agent.id)}
              onClick={() => onSelectAgent(agent)}
              isPro={isPro}
            />
          ))}
        </div>
      </section>

      {/* Community section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-orange-400" />
            <h2 className="text-xl font-extrabold text-white">Recently Built</h2>
          </div>
          <div className="divide-y divide-white/5">
            {recentBuilds.map((b) => (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0067B8] to-[#7C3AED] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {b.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      <span className="font-bold">{b.name}</span> built{' '}
                      <span className="text-slate-300">{b.agent}</span>
                    </p>
                    <p className="text-xs text-slate-500">{b.time}</p>
                  </div>
                </div>
                <XPBadge xp={b.xp} size="sm" />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-400/10 to-transparent p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-extrabold text-white">Weekly Challenge</h2>
          </div>
          <h3 className="font-bold text-white mb-2">{weeklyChallenge.title}</h3>
          <p className="text-sm text-slate-300 mb-4 flex-1">{weeklyChallenge.description}</p>
          <div className="flex items-center gap-2 text-sm text-amber-300 font-semibold mb-4">
            <Sparkles className="w-4 h-4" />
            {weeklyChallenge.reward}
          </div>
          {challengeAgent && (
            <button
              onClick={() => onSelectAgent(challengeAgent)}
              className="bg-amber-400 hover:bg-amber-300 text-[#0A0A1A] font-bold rounded-lg px-4 py-2.5 transition-colors"
            >
              Accept Challenge
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
