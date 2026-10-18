import { useSyncExternalStore } from 'react';
import { Timer } from 'lucide-react';
import { nextAiMasteryCohortStart } from '../data/aiMasteryCohort';

// Live countdown to the next AI Agent Mastery cohort (Thursday 7 PM WAT).
// nextAiMasteryCohortStart() always returns the first Thursday start still in
// the future, so the moment a cohort begins the timer rolls over to the
// following Thursday on its own.
//
// useSyncExternalStore with a null server snapshot (not useState+useEffect):
// this page is prerendered, and a frozen countdown baked into the static HTML
// would be stale and mismatch on hydration. data-client-only makes the
// prerender strip it.
function subscribe(onChange) {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
}
const getSecondsLeft = () =>
  Math.max(0, Math.floor((nextAiMasteryCohortStart().getTime() - Date.now()) / 1000));

export default function CohortCountdown() {
  const secondsLeft = useSyncExternalStore(subscribe, getSecondsLeft, () => null);
  if (secondsLeft === null) return null;

  const days = Math.floor(secondsLeft / 86400);
  const units = [
    { value: days, label: days === 1 ? 'day' : 'days' },
    { value: Math.floor(secondsLeft / 3600) % 24, label: 'hrs' },
    { value: Math.floor(secondsLeft / 60) % 60, label: 'min' },
    { value: secondsLeft % 60, label: 'sec' },
  ];

  return (
    <div data-client-only className="flex flex-col items-center gap-2.5">
      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-wide text-body">
        <Timer className="w-3.5 h-3.5 text-link" /> Next cohort starts in
      </span>
      <div className="flex items-center gap-2 sm:gap-2.5" role="timer" aria-live="off">
        {units.map((unit) => (
          <div
            key={unit.label}
            className="bg-white dark:bg-[#131E2F] border-[1.5px] border-border-soft rounded-xl px-3 sm:px-3.5 py-2 min-w-[58px] sm:min-w-[64px] text-center"
          >
            <div className="font-display font-extrabold text-xl sm:text-2xl text-ink tabular-nums leading-none">
              {String(unit.value).padStart(2, '0')}
            </div>
            <div className="text-[10.5px] font-bold uppercase tracking-wide text-gray-400 mt-1">{unit.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
