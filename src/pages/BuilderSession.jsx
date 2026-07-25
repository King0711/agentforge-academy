import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Lock, Clock, CheckCircle2, Sparkles,
  ListChecks, BookOpen, ExternalLink, Loader2, ArrowLeft, Circle, Wrench,
} from 'lucide-react';
import { getAgentsByDifficulty, getBuilderPagePath } from '../data/agents';
import { getDifficulty } from '../data/departments';
import { getTechColor } from '../data/techStack';
import { useCourseContent } from '../hooks/useCourseContent';
import XPBadge from '../components/XPBadge';
import SessionGuide from '../components/SessionGuide';
import NotFound from './NotFound';

export default function BuilderSession({ progress, tier }) {
  const { slug } = useParams();
  const [showXpPop, setShowXpPop] = useState(false);

  const tierAgents = getAgentsByDifficulty(tier);
  const index = tierAgents.findIndex((a) => a.slug === slug);
  const agent = index !== -1 ? tierAgents[index] : null;
  const prevAgent = index > 0 ? tierAgents[index - 1] : null;
  const nextAgent = index !== -1 && index < tierAgents.length - 1 ? tierAgents[index + 1] : null;
  const difficulty = getDifficulty(tier);

  const { content, loading, locked } = useCourseContent(agent?.id);

  // SEO — each session gets its own title + description, restored on unmount
  // so navigating away doesn't leave stale tags on the next page.
  useEffect(() => {
    if (!agent) return;
    const prevTitle = document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute('content');

    document.title = `${agent.title} — ${tier} Session Guide | Social Dev Technologies`;
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        `${agent.description} Step-by-step ${tier} session guide — ${agent.buildTime}, ${agent.xp} XP.`
      );
    }

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc) metaDesc.setAttribute('content', prevDesc);
    };
  }, [agent, tier]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!agent) return <NotFound />;

  const completed = progress.isCompleted(agent.id);

  const handleComplete = () => {
    if (!completed) {
      setShowXpPop(true);
      setTimeout(() => setShowXpPop(false), 1400);
    }
    progress.toggleComplete(agent);
  };

  return (
    <div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Link
          to={`/catalog?difficulty=${encodeURIComponent(tier)}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-body hover:text-brand transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to {tier} catalog
        </Link>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border-[1.5px] border-border-soft p-6 sm:p-8 mb-8"
          style={{ background: 'linear-gradient(135deg, #F3EBFF, #FBFAFF)' }}
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand bg-white border border-brand/25 rounded-full px-3 py-1.5 mb-4">
            {difficulty.icon} {tier} · Session {index + 1} of {tierAgents.length}
          </span>
          <div className="flex items-start gap-4">
            <div className="text-5xl sm:text-6xl">{agent.emoji}</div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink leading-tight">{agent.title}</h1>
              <p className="text-body text-sm sm:text-base mt-2 max-w-2xl">{agent.description}</p>
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <span className="flex items-center gap-1 text-xs font-semibold text-body">
                  <Clock className="w-3.5 h-3.5" /> {agent.buildTime}
                </span>
                <XPBadge xp={agent.xp} size="sm" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mark complete */}
        <div className="relative flex items-center justify-between gap-4 rounded-xl border border-border-soft bg-[#FAF8FF] px-5 py-4 mb-8">
          <AnimatePresence>
            {showXpPop && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: -36, scale: 1.1 }}
                exit={{ opacity: 0, y: -56 }}
                transition={{ duration: 1.2 }}
                className="absolute left-5 -top-2 text-amber-600 font-extrabold text-lg pointer-events-none flex items-center gap-1"
              >
                <Sparkles className="w-5 h-5" /> +{agent.xp} XP!
              </motion.div>
            )}
          </AnimatePresence>
          <p className="text-sm text-body">
            {completed ? 'Marked as completed — great work!' : 'Mark this session complete to earn XP.'}
          </p>
          <button
            onClick={handleComplete}
            className={`flex items-center gap-2 font-bold rounded-lg px-5 py-2.5 transition-all flex-shrink-0 ${
              completed
                ? 'bg-[#EAFAF1] text-green border border-green/30 hover:bg-green/10'
                : 'bg-green text-white hover:brightness-95 shadow-lg shadow-green/20'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {completed ? 'Completed' : 'Mark Complete'}
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 text-body gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading session guide…
          </div>
        )}

        {!loading && locked && (
          <div className="flex flex-col items-center text-center gap-3 py-16 border-2 border-dashed border-border rounded-2xl mb-8">
            <Lock className="w-8 h-8 text-brand" />
            <p className="font-bold text-ink">This session's guide is {tier} content</p>
            <p className="text-sm text-body max-w-sm">
              Get {tier} (or the Pro bundle) to unlock the full step-by-step build, prompts, and resources.
            </p>
            <Link
              to="/pricing"
              className="mt-2 inline-flex items-center gap-2 bg-brand hover:bg-brand-deep text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
            >
              See plans
            </Link>
          </div>
        )}

        {!loading && (!locked) && content?.session && (
          <div className="mb-8">
            <SessionGuide session={content.session} troubleshooting={content.troubleshooting} />
          </div>
        )}

        {/* Tech stack + prerequisites — public metadata, always shown */}
        <section className="grid sm:grid-cols-2 gap-6 mb-8">
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
                <li key={p} className="flex items-start gap-2 text-sm text-body">
                  <Circle className="w-2 h-2 mt-1.5 fill-gray-400 text-gray-400 flex-shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Resources — gated, from fetched content */}
        {!loading && (!locked) && content?.resources?.length > 0 && (
          <section id="resources" className="mb-8">
            <SectionTitle icon={BookOpen} title="Resources" />
            <div className="flex flex-col gap-2">
              {content.resources.map((r) => (
                <a
                  key={r.url}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-sm text-body-strong hover:text-ink bg-[#FAF8FF] hover:bg-[#F3EBFF] border border-border-soft rounded-lg px-3.5 py-2.5 transition-colors"
                >
                  {r.title}
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Previous / Next — cycle through this tier's sequence */}
        {(prevAgent || nextAgent) && (
          <div className="flex items-stretch justify-between gap-3 pt-6 border-t border-border-soft">
            {prevAgent ? (
              <Link
                to={getBuilderPagePath(prevAgent)}
                className="flex items-center gap-2 bg-white border-[1.5px] border-border-soft hover:border-brand/40 rounded-xl pl-2.5 pr-4 py-2.5 transition-colors min-w-0"
              >
                <ChevronLeft className="w-4 h-4 text-brand flex-shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-gray-400">Previous</span>
                  <span className="block text-xs sm:text-sm font-bold text-ink truncate">{prevAgent.title}</span>
                </span>
              </Link>
            ) : <span />}
            {nextAgent && (
              <Link
                to={getBuilderPagePath(nextAgent)}
                className="flex items-center gap-2 bg-brand hover:bg-brand-deep text-white rounded-xl pl-4 pr-2.5 py-2.5 transition-colors min-w-0"
              >
                <span className="min-w-0 text-right">
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-white/70">Next</span>
                  <span className="block text-xs sm:text-sm font-bold truncate">{nextAgent.title}</span>
                </span>
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-brand" />
      <h3 className="font-bold text-ink text-sm uppercase tracking-wide">{title}</h3>
    </div>
  );
}
