import { Link } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';
import { agents } from '../data/agents';
import { departments, difficultyLevels, publicDifficultyLevels, isVisibleToPublic } from '../data/departments';
import ProgressBar from '../components/ProgressBar';
import { usePro } from '../hooks/usePro';

const tierDescriptions = {
  'Builder 1': 'Start here. Learn core agent concepts — prompting, simple automations, and your first working tools.',
  'Builder 2': 'Combine APIs, memory, and multi-step reasoning to build agents that handle real workflows.',
  Advanced: 'Multi-agent systems, self-healing pipelines, and production-grade integrations.',
  'World Class': 'Autonomous, end-to-end systems used by real teams — the top of the curriculum.',
};

export default function PathDetail({ progress }) {
  const { isAdmin } = usePro();
  const visibleDifficulties = isAdmin ? difficultyLevels : publicDifficultyLevels;
  const visibleAgents = isAdmin ? agents : agents.filter((a) => isVisibleToPublic(a.difficulty));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink flex items-center gap-3">
          <Compass className="w-7 h-7 text-brand" />
          Learning Paths
        </h1>
        <p className="text-body mt-2 max-w-2xl">
          Follow a structured path through the catalog — by skill level or by department — and
          track your progress as you go.
        </p>
      </div>

      {/* Difficulty paths */}
      <section>
        <h2 className="font-display text-xl font-bold text-ink mb-4">By Skill Level</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {visibleDifficulties.map((level) => {
            const tierAgents = agents.filter((a) => a.difficulty === level.id);
            const completedCount = tierAgents.filter((a) => progress.completed.includes(a.id)).length;
            return (
              <Link
                key={level.id}
                to={`/catalog?difficulty=${encodeURIComponent(level.id)}`}
                className="rounded-2xl border-[1.5px] bg-white hover:bg-[#FAF8FF] transition-colors p-5 flex flex-col gap-4"
                style={{ borderColor: `${level.color}40` }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-md"
                    style={{ backgroundColor: level.tint, color: level.color }}
                  >
                    {level.icon} {level.label}
                  </span>
                  <span className="text-sm text-body">{tierAgents.length} agents</span>
                </div>
                <p className="text-sm text-body-strong">{tierDescriptions[level.id]}</p>
                <ProgressBar value={completedCount} max={tierAgents.length} color={level.color} showLabel={false} />
                <span className="flex items-center gap-1 text-sm font-semibold text-ink self-start">
                  Start path <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Department paths */}
      <section>
        <h2 className="font-display text-xl font-bold text-ink mb-4">By Department</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.filter((d) => d.id !== 'all').map((dept) => {
            const deptAgents = visibleAgents.filter((a) => a.departmentIds.includes(dept.id));
            const completedCount = deptAgents.filter((a) => progress.completed.includes(a.id)).length;
            if (deptAgents.length === 0) return null;
            return (
              <Link
                key={dept.id}
                to={`/catalog?department=${dept.id}`}
                className="rounded-2xl border-[1.5px] border-border-soft bg-white hover:bg-[#FAF8FF] transition-colors p-5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold text-ink">
                    <span className="text-2xl">{dept.icon}</span>
                    {dept.name}
                  </span>
                  <span className="text-sm text-body">{deptAgents.length} agents</span>
                </div>
                <ProgressBar value={completedCount} max={deptAgents.length} color={dept.color} showLabel={false} />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
