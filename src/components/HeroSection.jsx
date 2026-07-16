import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Rocket, Compass } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#050510] min-h-[90vh] flex items-center">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#0067B8]/20 rounded-full blur-[120px] -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#7C3AED]/20 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-[#0067B8]/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left: text */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full bg-[#0067B8]/10 border border-[#0067B8]/30 text-[#3FA9F5] mb-6"
          >
            <Rocket className="w-3.5 h-3.5" />
            #1 AI Skills Platform in Africa
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.08] mb-6"
          >
            Learn the{' '}
            <span className="bg-gradient-to-r from-[#0067B8] via-[#7C3AED] to-[#F59E0B] bg-clip-text text-transparent">
              Digital & AI
            </span>{' '}
            skills shaping tomorrow.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-300 mb-4 max-w-xl leading-relaxed"
          >
            Explore our hands-on AI agent sessions, join live instructor-led cohorts, or get
            our catalogue tailored to your needs.{' '}
            <span className="text-white font-semibold">Build real projects. Land better jobs.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-wrap gap-4 text-sm text-slate-400 mb-8"
          >
            {['✓ No prior experience needed', '✓ Learn with Claude AI', '✓ Build portfolio projects'].map((t) => (
              <span key={t} className="text-slate-300">{t}</span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Link
              to="/welcome"
              className="flex items-center justify-center gap-2 bg-[#0067B8] hover:bg-[#0078D4] text-white font-bold px-8 py-4 rounded-xl transition-colors text-base shadow-lg shadow-[#0067B8]/30"
            >
              <Rocket className="w-5 h-5" />
              Start Learning Free
            </Link>
            <Link
              to="/catalog"
              className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-bold px-8 py-4 rounded-xl transition-colors text-base"
            >
              <Compass className="w-5 h-5" />
              Browse Courses
            </Link>
          </motion.div>
        </div>

        {/* Right: stats card cluster */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="hidden lg:grid grid-cols-2 gap-4"
        >
          {[
            { value: '44', label: 'AI Agent Sessions', color: '#0067B8', bg: '#0067B820' },
            { value: '4', label: 'Skill Levels', color: '#7C3AED', bg: '#7C3AED20' },
            { value: '320+', label: 'Hours of Content', color: '#F59E0B', bg: '#F59E0B20' },
            { value: '10', label: 'Departments Covered', color: '#10B981', bg: '#10B98120' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="rounded-2xl border p-6 flex flex-col"
              style={{ borderColor: `${s.color}40`, background: s.bg }}
            >
              <span className="text-4xl font-extrabold text-white mb-1">{s.value}</span>
              <span className="text-sm font-medium" style={{ color: s.color }}>{s.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Mobile stats strip */}
      <div className="lg:hidden absolute bottom-0 left-0 right-0 border-t border-white/10 bg-white/[0.02] px-4 py-4 grid grid-cols-4 gap-2 text-center">
        {[
          { value: '44', label: 'Sessions' },
          { value: '4', label: 'Levels' },
          { value: '320+', label: 'Hours' },
          { value: '10', label: 'Depts' },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-xl font-extrabold text-white">{s.value}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
