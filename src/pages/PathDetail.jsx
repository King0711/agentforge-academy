import { Link } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';
import { agents } from '../data/agents';
import { departments, difficultyLevels } from '../data/departments';
import ProgressBar from '../components/ProgressBar';

const tierDescriptions = {
  Beginner: 'Start here. Learn core agent concepts — prompting, simple automations, and your first working tools.',
  Intermediate: 'Combine APIs, memory, and multi-step reasoning to build agents that handle real workflows.',
  Advanced: 'Multi-agent systems, self-healing pipelines, and production-grade integrations.',
  'World Class': 'Autonomous, end-to-end systems used by real teams — the top of the curriculum.',
};

export default function PathDetail({ progress }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
          <Compass className="w-8 h-8 text-[#7C3AED]" />
          Learning Paths
        </h1>
        <p className="text-slate-400 mt-2 max-w-2xl">
          Follow a structured path through the catalog — by skill level or by department — and
          track your progress as you go.
        </p>
      </div>

      {/* Difficulty paths */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">By Skill Level</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {difficultyLevels.map((level) => {
            const tierAgents = agents.filter((a) => a.difficulty === level.id);
            const completedCount = tierAgents.filter((a) => progress.completed.includes(a.id)).length;
            return (
              <Link
                key={level.id}
                to={`/catalog?difficulty=${encodeURIComponent(level.id)}`}
                className="rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition-colors p-5 flex flex-col gap-4"
                style={{ borderColor: `${level.color}33` }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-md"
                    style={{ backgroundColor: `${level.color}26`, color: level.color }}
                  >
                    {level.icon} {level.label}
                  </span>
                  <span className="text-sm text-slate-400">{tierAgents.length} agents</span>
                </div>
                <p className="text-sm text-slate-300">{tierDescriptions[level.id]}</p>
                <ProgressBar value={completedCount} max={tierAgents.length} color={level.color} showLabel={false} />
                <span className="flex items-center gap-1 text-sm font-semibold text-white self-start">
                  Start path <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Department paths */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">By Department</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.filter((d) => d.id !== 'all').map((dept) => {
            const deptAgents = agents.filter((a) => a.departmentIds.includes(dept.id));
            const completedCount = deptAgents.filter((a) => progress.completed.includes(a.id)).length;
            if (deptAgents.length === 0) return null;
            return (
              <Link
                key={dept.id}
                to={`/catalog?department=${dept.id}`}
                className="rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition-colors p-5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold text-white">
                    <span className="text-2xl">{dept.icon}</span>
                    {dept.name}
                  </span>
                  <span className="text-sm text-slate-400">{deptAgents.length} agents</span>
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
