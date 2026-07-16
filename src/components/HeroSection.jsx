import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Rocket, Compass } from 'lucide-react';

function useCountUp(target, duration = 1500) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
}

const stats = [
  { label: 'AI Agents', value: 44, suffix: '' },
  { label: 'Departments', value: 10, suffix: '' },
  { label: 'XP Available', value: 38000, suffix: '+' },
  { label: 'Hours of Content', value: 320, suffix: '+' },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0A0A1A] via-[#0D1B3E] to-[#0A0A1A]">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0067B8]/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#7C3AED]/30 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-28 sm:pb-24 text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[#0067B8] mb-6"
        >
          <Rocket className="w-3.5 h-3.5" />
          The hands-on AI agent learning platform
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight max-w-4xl mx-auto"
        >
          Build Real AI Agents.{' '}
          <span className="bg-gradient-to-r from-[#0067B8] via-[#7C3AED] to-[#F59E0B] bg-clip-text text-transparent">
            Earn XP. Level Up.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto"
        >
          44 guided build sessions across every department. Each one gives you copy-paste
          prompts for Claude, step-by-step builds, and a portfolio write-up — so you ship
          something real every time you sit down.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            to="/catalog"
            className="flex items-center gap-2 bg-[#0067B8] hover:bg-[#0078D4] text-white font-bold px-6 py-3 rounded-lg transition-colors w-full sm:w-auto justify-center"
          >
            <Rocket className="w-4 h-4" />
            Start Building
          </Link>
          <Link
            to="/paths"
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-6 py-3 rounded-lg transition-colors w-full sm:w-auto justify-center"
          >
            <Compass className="w-4 h-4" />
            Explore Learning Paths
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto"
        >
          {stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function StatCard({ stat }) {
  const value = useCountUp(stat.value);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm px-4 py-5">
      <p className="text-2xl sm:text-3xl font-extrabold text-white">
        {value.toLocaleString()}
        {stat.suffix}
      </p>
      <p className="text-xs sm:text-sm text-slate-400 mt-1">{stat.label}</p>
    </div>
  );
}
