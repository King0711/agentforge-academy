import { useSyncExternalStore } from 'react';
import { CalendarDays } from 'lucide-react';
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
  return `${fmt(days[0])} - ${fmt(days[days.length - 1])}`;
};

export default function CohortDates() {
  const label = useSyncExternalStore(subscribe, getLabel, () => null);
  if (label === null) return null;
  return (
    <p
      data-client-only
      className="inline-flex items-center gap-2 mt-4 mb-0 text-[14.5px] sm:text-base font-extrabold text-ink"
    >
      <CalendarDays className="w-4 h-4 text-link flex-shrink-0" /> {label}
    </p>
  );
}
