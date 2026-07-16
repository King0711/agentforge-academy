import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CheckCircle2, Circle, BookOpen, Target, Wrench, ListChecks,
  ArrowRight, ExternalLink, Clock, Sparkles, AlertTriangle, FlaskConical, PlayCircle, FileText,
} from 'lucide-react';
import { getDifficulty } from '../data/departments';
import { getTechColor } from '../data/techStack';
import { getNextRecommended } from '../data/agents';
import XPBadge from './XPBadge';
import StepGuide from './StepGuide';
import CodeBlock from './CodeBlock';
import SessionGuide from './SessionGuide';

export default function AgentModal({ agent, completed, onToggleComplete, onClose, onSelectAgent }) {
  const [showXpPop, setShowXpPop] = useState(false);
  const [activeTab, setActiveTab] = useState('guide');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!agent) return null;

  const difficulty = getDifficulty(agent.difficulty);
  const next = getNextRecommended(agent);

  const handleComplete = () => {
    if (!completed) {
      setShowXpPop(true);
      setTimeout(() => setShowXpPop(false), 1400);
    }
    onToggleComplete(agent);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full sm:max-w-4xl h-full sm:h-[90vh] sm:rounded-2xl overflow-hidden bg-[#0A0A1A] border border-white/10 flex flex-col"
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="relative px-6 sm:px-8 pt-8 pb-6 border-b border-white/10"
            style={{ background: `linear-gradient(135deg, ${difficulty.color}33, #0D1B3E)` }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="text-5xl sm:text-6xl">{agent.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-md"
                    style={{ backgroundColor: `${difficulty.color}33`, color: difficulty.color }}
                  >
                    {difficulty.icon} {difficulty.label}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-300">
                    <Clock className="w-3.5 h-3.5" /> {agent.buildTime}
                  </span>
                  <XPBadge xp={agent.xp} size="sm" />
                </div>
                <h2 className="text-xl sm:text-3xl font-extrabold text-white leading-tight">{agent.title}</h2>
                <p className="text-slate-300 text-sm mt-2 max-w-2xl">{agent.description}</p>
              </div>
            </div>
          </div>

          {/* Tab bar — only shown when a video exists */}
          {agent.videoId && (
            <div className="flex border-b border-white/10 px-6 sm:px-8 bg-white/[0.02]">
              <button
                onClick={() => setActiveTab('guide')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'guide'
                    ? 'border-[#0067B8] text-white'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                Session Guide
              </button>
              <button
                onClick={() => setActiveTab('video')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'video'
                    ? 'border-[#0067B8] text-white'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <PlayCircle className="w-4 h-4" />
                Watch the Build
              </button>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-6 sm:px-8 py-6 space-y-8">

            {/* Video tab */}
            {agent.videoId && activeTab === 'video' && (
              <div className="space-y-4">
                <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingTop: '56.25%' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${agent.videoId}?rel=0&modestbranding=1`}
                    title={`How to build: ${agent.title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <p className="text-sm text-slate-400 text-center">
                  Watch the full build, then follow the Session Guide tab to build it yourself.
                </p>
              </div>
            )}

            {/* Guide tab (or default when no video) */}
            {(!agent.videoId || activeTab === 'guide') && agent.session && (
              <SessionGuide session={agent.session} />
            )}
            {(!agent.videoId || activeTab === 'guide') && !agent.session && (
              <>
                <section>
                  <SectionTitle icon={Target} title="What You'll Build" />
                  <p className="text-slate-300 text-sm leading-relaxed">{agent.whatYouBuild}</p>
                </section>
                <section>
                  <SectionTitle icon={BookOpen} title="What You'll Learn" />
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {agent.whatYouLearn.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <SectionTitle icon={Wrench} title="Tech Stack" />
                    <div className="flex flex-wrap gap-2">
                      {agent.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="text-xs font-medium px-2.5 py-1 rounded-full border"
                          style={{ borderColor: `${getTechColor(tech)}55`, color: getTechColor(tech) }}
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <SectionTitle icon={ListChecks} title="Prerequisites" />
                    <ul className="space-y-1.5">
                      {agent.prerequisites.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-sm text-slate-300">
                          <Circle className="w-2 h-2 mt-1.5 fill-slate-500 text-slate-500 flex-shrink-0" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
                <section>
                  <SectionTitle icon={ListChecks} title="Step-by-Step Build Guide" />
                  <StepGuide steps={agent.steps} />
                </section>
                <section>
                  <SectionTitle icon={Sparkles} title="Starter Code" />
                  <CodeBlock code={agent.starterCode} title={`starter — ${agent.title}`} />
                </section>
                {agent.testItOut && (
                  <section>
                    <SectionTitle icon={FlaskConical} title="Test It Out" />
                    <div className="text-sm text-slate-300 leading-relaxed bg-white/5 border border-white/10 rounded-xl p-4">
                      {agent.testItOut}
                    </div>
                  </section>
                )}
                {agent.troubleshooting && agent.troubleshooting.length > 0 && (
                  <section>
                    <SectionTitle icon={AlertTriangle} title="Troubleshooting & Common Pitfalls" />
                    <div className="space-y-2">
                      {agent.troubleshooting.map((item) => (
                        <div key={item.issue} className="bg-red-400/5 border border-red-400/20 rounded-lg px-3.5 py-2.5">
                          <p className="text-sm font-bold text-red-300">{item.issue}</p>
                          <p className="text-sm text-slate-300 mt-1">{item.fix}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {/* Resources */}
            <section>
              <SectionTitle icon={BookOpen} title="Resources" />
              <div className="flex flex-col gap-2">
                {agent.resources.map((r) => (
                  <a
                    key={r.url}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3.5 py-2.5 transition-colors"
                  >
                    {r.title}
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  </a>
                ))}
              </div>
            </section>

            {/* Next recommended */}
            {next && (
              <section>
                <SectionTitle icon={ArrowRight} title="Next Recommended Agent" />
                <button
                  onClick={() => onSelectAgent(next)}
                  className="w-full flex items-center gap-4 text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 transition-colors"
                >
                  <div className="text-3xl">{next.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white">{next.title}</p>
                    <p className="text-xs text-slate-400 line-clamp-1">{next.description}</p>
                  </div>
                  <XPBadge xp={next.xp} size="sm" />
                  <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                </button>
              </section>
            )}
          </div>

          {/* Footer / mark complete */}
          <div className="relative border-t border-white/10 px-6 sm:px-8 py-4 bg-white/[0.03] flex items-center justify-between gap-4">
            <AnimatePresence>
              {showXpPop && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.8 }}
                  animate={{ opacity: 1, y: -40, scale: 1.1 }}
                  exit={{ opacity: 0, y: -60 }}
                  transition={{ duration: 1.2 }}
                  className="absolute left-6 sm:left-8 -top-2 text-amber-400 font-extrabold text-lg pointer-events-none flex items-center gap-1"
                >
                  <Sparkles className="w-5 h-5" /> +{agent.xp} XP!
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-sm text-slate-400 hidden sm:block">
              {completed ? 'Marked as completed — great work!' : 'Mark this agent complete to earn XP.'}
            </p>
            <button
              onClick={handleComplete}
              className={`flex items-center gap-2 font-bold rounded-lg px-5 py-3 transition-all w-full sm:w-auto justify-center ${
                completed
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/25'
                  : 'bg-[#10B981] text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              {completed ? 'Completed' : 'Mark Complete'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-[#0067B8]" />
      <h3 className="font-bold text-white text-sm uppercase tracking-wide">{title}</h3>
    </div>
  );
}
