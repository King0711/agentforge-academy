import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Circle, ChevronDown } from 'lucide-react';
import { getBuilderPagePath } from '../data/agents';
import ProgressBar from './ProgressBar';

function LessonList({ tierAgents, currentSlug, progress, onNavigate }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {tierAgents.map((agent, i) => {
        const isCurrent = agent.slug === currentSlug;
        const isDone = progress.isCompleted(agent.id);
        return (
          <li key={agent.id}>
            <Link
              to={getBuilderPagePath(agent)}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                isCurrent
                  ? 'bg-[#F3EBFF] dark:bg-brand/15 text-brand font-bold'
                  : 'text-body hover:bg-[#FAF8FF] dark:hover:bg-white/5 hover:text-ink'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green" />
              ) : (
                <Circle className="w-4 h-4 flex-shrink-0 text-gray-300 dark:text-gray-600" />
              )}
              <span className="text-[11px] font-mono text-gray-400 flex-shrink-0 w-4 text-right">{i + 1}</span>
              <span className="truncate">{agent.title}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default function CourseSidebar({ tier, tierAgents, currentSlug, progress }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const completedCount = tierAgents.filter((a) => progress.isCompleted(a.id)).length;

  return (
    <>
      {/* Desktop — persistent sticky sidebar */}
      <aside className="hidden lg:block sticky top-24 self-start w-full rounded-xl border border-border-soft bg-[#FAF8FF] dark:bg-white/5 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-body mb-2">{tier} Sessions</p>
        <div className="mb-4">
          <ProgressBar value={completedCount} max={tierAgents.length} showLabel={false} height="h-1.5" />
          <p className="text-xs text-body mt-1.5">{completedCount} / {tierAgents.length} complete</p>
        </div>
        <LessonList tierAgents={tierAgents} currentSlug={currentSlug} progress={progress} />
      </aside>

      {/* Mobile — collapsible toggle above the content */}
      <div className="lg:hidden rounded-xl border border-border-soft bg-[#FAF8FF] dark:bg-white/5 overflow-hidden">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-ink">
            {tier} Course Menu
            <span className="text-xs font-medium text-body">({completedCount}/{tierAgents.length})</span>
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${mobileOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3">
                <LessonList
                  tierAgents={tierAgents}
                  currentSlug={currentSlug}
                  progress={progress}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
