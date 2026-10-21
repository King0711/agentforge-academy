import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import EmojiIcon from '../EmojiIcon';
import { getBuilderPagePath } from '../../data/agents';
import { departments } from '../../data/departments';

const PER_TAB = 6;

// Browse the real builds by department: tabs on top, then a grid of cards, the
// way a course catalogue works. Every card is a build from the public catalog
// (Builder 1 and Builder 2); nothing here is made up. `builds` is the public
// list Home already computes.
export default function BuildsBrowser({ builds }) {
  const [active, setActive] = useState('all');

  // Only departments that have at least one public build get a tab.
  const tabs = [
    { id: 'all', name: 'All builds', icon: '🌐' },
    ...departments.filter((d) => d.id !== 'all' && builds.some((b) => b.departmentIds?.includes(d.id))),
  ];
  const shown = builds.filter((b) => active === 'all' || b.departmentIds?.includes(active));
  const visible = shown.slice(0, PER_TAB);
  const activeTab = tabs.find((t) => t.id === active);

  return (
    <div>
      <div className="max-w-[760px] mb-9 md:mb-12">
        <h2 className="t-section text-ink">{builds.length} agent builds, sorted by the work you do</h2>
        <p className="t-lead text-body mt-5">Pick your department and see what you could automate first.</p>
      </div>

      <div
        role="tablist"
        aria-label="Filter builds by department"
        className="flex gap-2.5 overflow-x-auto scrollbar-thin pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap"
      >
        {tabs.map((t) => {
          const on = t.id === active;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(t.id)}
              className={`inline-flex flex-shrink-0 items-center gap-2 rounded-full border px-5 py-3 text-[15px] font-bold leading-none whitespace-nowrap transition-colors ${
                on ? 'border-brand bg-brand text-white' : 'border-border bg-surface text-ink hover:border-link'
              }`}
            >
              <EmojiIcon emoji={t.icon} className="w-4 h-4" /> {t.name}
            </button>
          );
        })}
      </div>

      <ul role="tabpanel" className="list-none m-0 mt-7 p-0 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
        {visible.map((b) => (
          <li key={b.id} className="card-flat flex flex-col p-6">
            <span className="inline-flex w-fit rounded-full bg-link/10 px-3 py-1 text-xs font-extrabold text-link">{b.difficulty}</span>
            <h3 className="font-display font-extrabold text-xl leading-snug tracking-[-0.02em] text-ink mt-4 mb-2.5">{b.title}</h3>
            <p className="t-card text-body line-clamp-3 mb-5">{b.description}</p>
            <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-4">
              <span className="t-mono inline-flex items-center gap-1.5 text-body">
                <Clock className="w-4 h-4" /> {b.buildTime}
              </span>
              <Link
                to={getBuilderPagePath(b) || '/catalog'}
                className="inline-flex items-center gap-1.5 text-[15px] font-bold text-link hover:underline underline-offset-4"
              >
                See the build <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 md:mt-10">
        <Link
          to={active === 'all' ? '/catalog' : `/catalog?department=${active}`}
          className="btn btn-secondary"
        >
          {active === 'all' ? `View all ${builds.length} builds` : `View all ${activeTab?.name} builds (${shown.length})`}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
