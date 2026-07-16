import { ChevronDown } from 'lucide-react';
import { difficultyLevels } from '../data/departments';

export default function DifficultyFilter({ difficulty, onDifficultyChange, sort, onSortChange, sortOptions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onDifficultyChange('All')}
          className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition-all ${
            difficulty === 'All'
              ? 'bg-white/15 border-white/30 text-white'
              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          All Levels
        </button>
        {difficultyLevels.map((level) => {
          const active = difficulty === level.id;
          return (
            <button
              key={level.id}
              onClick={() => onDifficultyChange(level.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium border transition-all ${
                active ? 'text-white shadow-lg' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
              style={active ? { backgroundColor: `${level.color}26`, borderColor: level.color, color: level.color } : undefined}
            >
              <span>{level.icon}</span>
              {level.label}
            </button>
          );
        })}
      </div>

      <div className="relative">
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="appearance-none pl-3.5 pr-9 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0067B8] cursor-pointer"
        >
          {sortOptions.map((opt) => (
            <option key={opt} value={opt} className="bg-[#0D1B3E] text-white">
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}
