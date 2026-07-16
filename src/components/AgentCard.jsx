import { motion } from 'framer-motion';
import { Clock, CheckCircle2, Lock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDifficulty } from '../data/departments';
import { getTechColor } from '../data/techStack';
import XPBadge from './XPBadge';

const FREE_DIFFICULTY = ['Beginner'];

export default function AgentCard({ agent, completed, onClick, isPro = false }) {
  const difficulty = getDifficulty(agent.difficulty);
  const locked = !isPro && !FREE_DIFFICULTY.includes(agent.difficulty);

  if (locked) {
    return (
      <Link to="/pricing">
        <motion.div
          whileHover={{ y: -4 }}
          className="group relative flex flex-col text-left rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm overflow-hidden transition-colors hover:border-[#0067B8]/40 cursor-pointer"
        >
          {/* Blur overlay */}
          <div className="absolute inset-0 z-10 backdrop-blur-[2px] bg-[#0A0A1A]/60 flex flex-col items-center justify-center gap-2 rounded-2xl">
            <div className="w-10 h-10 rounded-full bg-[#0067B8]/20 border border-[#0067B8]/40 flex items-center justify-center">
              <Lock className="w-5 h-5 text-[#3FA9F5]" />
            </div>
            <span className="text-xs font-bold text-white">Pro only</span>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#3FA9F5] bg-[#0067B8]/20 border border-[#0067B8]/30 px-2 py-0.5 rounded-full">
              <Zap className="w-2.5 h-2.5" /> Upgrade to unlock
            </span>
          </div>

          {/* Blurred card content (decorative) */}
          <div className="opacity-40 pointer-events-none">
            <div
              className="h-24 flex items-center justify-center text-5xl"
              style={{ background: `linear-gradient(135deg, ${difficulty.color}33, transparent)` }}
            >
              {agent.emoji}
            </div>
            <div className="flex flex-col flex-1 p-4 gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: `${difficulty.color}26`, color: difficulty.color }}>
                  {difficulty.icon} {difficulty.label}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />{agent.buildTime}
                </span>
              </div>
              <h3 className="text-base font-bold text-white leading-snug">{agent.title}</h3>
              <p className="text-sm text-slate-400 line-clamp-2">{agent.description}</p>
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex flex-col text-left rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm overflow-hidden transition-colors hover:border-white/20 hover:bg-white/[0.06]"
    >
      {completed && (
        <div className="absolute top-3 right-3 z-10 bg-emerald-500 rounded-full p-1 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-white" />
        </div>
      )}

      <div
        className="h-24 flex items-center justify-center text-5xl"
        style={{ background: `linear-gradient(135deg, ${difficulty.color}33, transparent)` }}
      >
        {agent.emoji}
      </div>

      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md"
            style={{ backgroundColor: `${difficulty.color}26`, color: difficulty.color }}
          >
            {difficulty.icon} {difficulty.label}
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            {agent.buildTime}
          </span>
        </div>

        <h3 className="text-base font-bold text-white leading-snug">{agent.title}</h3>
        <p className="text-sm text-slate-400 line-clamp-2">{agent.description}</p>

        <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
          {agent.techStack.slice(0, 3).map((tech) => (
            <span
              key={tech}
              className="text-[11px] font-medium px-2 py-0.5 rounded-full border"
              style={{ borderColor: `${getTechColor(tech)}55`, color: getTechColor(tech) }}
            >
              {tech}
            </span>
          ))}
          {agent.techStack.length > 3 && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border border-white/10 text-slate-400">
              +{agent.techStack.length - 3}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <XPBadge xp={agent.xp} size="sm" />
          <span className="text-xs text-slate-500">{agent.department[0]}</span>
        </div>
      </div>
    </motion.button>
  );
}
