import { useSyncExternalStore } from 'react';
import { aiMasteryCohortDays, nextAiMasteryCohortStart } from '../data/aiMasteryCohort';

// "Thursday, October 22 - Saturday, October 24" for the next AI Agent Mastery
// cohort. nextAiMasteryCohortStart() rolls to the following week the moment a
// cohort begins (Thursday 7 PM WAT), so this never needs editing. Same
// prerender rules as CohortCountdown: a null server snapshot plus
// data-client-only keep a baked-in date out of the static HTML.
const fmt = (d) =>
  d.toLocaleDateString('en-US', { timeZone: 'Africa/Lagos', weekday: 'long', month: 'long', day: 'numeric' });

// Changes only when a cohort starts, so there is nothing to subscribe to.
const subscribe = () => () => {};
const getLabel = () => {
  const days = aiMasteryCohortDays(nextAiMasteryCohortStart());
  return `${fmt(days[0])} – ${fmt(days[days.length - 1])}`;
};

export default function CohortDates() {
  const label = useSyncExternalStore(subscribe, getLabel, () => null);
  if (label === null) return null;
  return (
    <p
      data-client-only
      className="inline-flex items-center gap-2.5 mb-0 px-4 py-2 rounded-xl border-2 border-red-500 bg-red-500/5 text-red-600 dark:text-red-400 font-extrabold uppercase tracking-wide text-[11.5px] sm:text-[13.5px] leading-snug"
    >
      <span className="relative flex w-2.5 h-2.5 flex-shrink-0" aria-hidden="true">
        <span className="absolute inset-0 rounded-full bg-red-500 opacity-60 animate-ping" />
        <span className="relative w-2.5 h-2.5 rounded-full bg-red-500" />
      </span>
      Live · {label} · 3-day masterclass
    </p>
  );
}
