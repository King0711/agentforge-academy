import { Link } from 'react-router-dom';
import { Flame, Trophy, Sparkles, ArrowRight, FolderGit2 } from 'lucide-react';
import { agents, getNextRecommended } from '../data/agents';
import { difficultyLevels, getDifficulty, getLevel, levels } from '../data/departments';
import ProgressBar from './ProgressBar';
import XPBadge from './XPBadge';
import AgentCard from './AgentCard';
import { usePro } from '../hooks/usePro';

export default function Dashboard({ progress, onSelectAgent }) {
  const { isPro } = usePro();
  const { completed, xp, streak, history, isCompleted, toggleComplete } = progress;

  const level = getLevel(xp);
  const levelIdx = levels.findIndex((l) => l.name === level.name);
  const nextLevel = levels[levelIdx + 1];
  const levelProgress = nextLevel ? xp - level.min : level.max - level.min;
  const levelTarget = nextLevel ? nextLevel.min - level.min : 1;

  const completedAgents = agents.filter((a) => completed.includes(a.id));

  const recommendations = [];
  for (const agent of completedAgents) {
    const next = getNextRecommended(agent);
    if (next && !completed.includes(next.id) && !recommendations.find((r) => r.id === next.id)) {
      recommendations.push(next);
    }
    if (recommendations.length >= 3) break;
  }
  if (recommendations.length === 0) {
    for (const agent of agents) {
      if (!completed.includes(agent.id)) {
        recommendations.push(agent);
        if (recommendations.length >= 3) break;
      }
    }
  }

  return (
    <div className="space-y-10">
      {/* Top stats */}
      <section className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">Total XP</span>
          </div>
          <p className="text-3xl font-extrabold text-white">{xp.toLocaleString()}</p>
          <p className="text-sm text-slate-400 mt-1">
            {level.icon} {level.name}
            {nextLevel && ` — ${(levelTarget - levelProgress).toLocaleString()} XP to ${nextLevel.name}`}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-2 text-orange-400 mb-2">
            <Flame className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">Day Streak</span>
          </div>
          <p className="text-3xl font-extrabold text-white">{streak}</p>
          <p className="text-sm text-slate-400 mt-1">Keep building daily to grow your streak</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Trophy className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">Agents Built</span>
          </div>
          <p className="text-3xl font-extrabold text-white">
            {completed.length} <span className="text-lg text-slate-500">/ {agents.length}</span>
          </p>
          <p className="text-sm text-slate-400 mt-1">
            {Math.round((completed.length / agents.length) * 100)}% of the catalog complete
          </p>
        </div>
      </section>

      {/* Level progress */}
      {nextLevel && (
        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <ProgressBar
            value={levelProgress}
            max={levelTarget}
            color="#F59E0B"
            label={`${level.icon} ${level.name} → ${nextLevel.icon} ${nextLevel.name}`}
          />
        </section>
      )}

      {/* Progress by difficulty */}
      <section>
        <h2 className="text-lg font-bold text-white mb-4">Progress by Difficulty</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {difficultyLevels.map((level) => {
            const tierAgents = agents.filter((a) => a.difficulty === level.id);
            const tierCompleted = tierAgents.filter((a) => completed.includes(a.id));
            return (
              <div key={level.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <ProgressBar
                  value={tierCompleted.length}
                  max={tierAgents.length}
                  color={level.color}
                  label={`${level.icon} ${level.label}`}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Completed agents grid / portfolio */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-[#0067B8]" />
            My Portfolio
          </h2>
          <span className="text-sm text-slate-400">{completedAgents.length} completed</span>
        </div>

        {completedAgents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
            <p className="text-slate-300 font-medium">You haven't completed any agents yet.</p>
            <p className="text-sm text-slate-500 mt-1">Browse the catalog and mark your first build complete to start earning XP.</p>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 mt-4 bg-[#0067B8] hover:bg-[#0078D4] text-white font-bold px-5 py-2.5 rounded-lg transition-colors"
            >
              Browse Catalog <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {completedAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                completed={isCompleted(agent.id)}
                onClick={() => onSelectAgent(agent)}
                isPro={isPro}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-white mb-4">Recommended Next</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((agent) => {
              const difficulty = getDifficulty(agent.difficulty);
              return (
                <button
                  key={agent.id}
                  onClick={() => onSelectAgent(agent)}
                  className="flex items-center gap-3 text-left bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 rounded-xl p-4 transition-colors"
                >
                  <div className="text-3xl">{agent.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <span
                      className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md mb-1"
                      style={{ backgroundColor: `${difficulty.color}26`, color: difficulty.color }}
                    >
                      {difficulty.icon} {difficulty.label}
                    </span>
                    <p className="font-bold text-white text-sm leading-snug truncate">{agent.title}</p>
                  </div>
                  <XPBadge xp={agent.xp} size="sm" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent activity */}
      {history.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-white mb-4">Recent Activity</h2>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] divide-y divide-white/5">
            {history.slice(0, 8).map((h) => (
              <div key={`${h.id}-${h.date}`} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{h.title}</p>
                  <p className="text-xs text-slate-500">{new Date(h.date).toLocaleString()}</p>
                </div>
                <XPBadge xp={h.xp} size="sm" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
