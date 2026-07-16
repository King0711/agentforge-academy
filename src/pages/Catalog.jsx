import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { agents } from '../data/agents';
import { useFilter } from '../hooks/useFilter';
import DepartmentFilter from '../components/DepartmentFilter';
import DifficultyFilter from '../components/DifficultyFilter';
import SearchBar from '../components/SearchBar';
import AgentCard from '../components/AgentCard';
import { usePro } from '../hooks/usePro';

export default function Catalog({ progress, onSelectAgent }) {
  const { isPro } = usePro();
  const [searchParams] = useSearchParams();
  const {
    department, setDepartment,
    difficulty, setDifficulty,
    search, setSearch,
    sort, setSort,
    filtered, sortOptions,
  } = useFilter(agents);

  useEffect(() => {
    const q = searchParams.get('q');
    const dept = searchParams.get('department');
    const diff = searchParams.get('difficulty');
    if (q !== null) setSearch(q);
    if (dept) setDepartment(dept);
    if (diff) setDifficulty(diff);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
          <LayoutGrid className="w-8 h-8 text-[#0067B8]" />
          Agent Catalog
        </h1>
        <p className="text-slate-400 mt-2">
          {filtered.length} of {agents.length} agents — filter by department, difficulty, or search.
        </p>
      </div>

      <div className="md:hidden">
        <SearchBar value={search} onChange={setSearch} />
      </div>

      <DepartmentFilter value={department} onChange={setDepartment} />
      <DifficultyFilter
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        sort={sort}
        onSortChange={setSort}
        sortOptions={sortOptions}
      />

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-16 text-center">
          <p className="text-slate-300 font-medium">No agents match your filters.</p>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your search, department, or difficulty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              completed={progress.isCompleted(agent.id)}
              onClick={() => onSelectAgent(agent)}
              isPro={isPro}
            />
          ))}
        </div>
      )}
    </div>
  );
}
