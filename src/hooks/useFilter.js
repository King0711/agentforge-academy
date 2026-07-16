import { useMemo, useState } from 'react';

const SORTERS = {
  Newest: (a, b) => b.id - a.id,
  'Most Popular': (a, b) => (b.popularity ?? 0) - (a.popularity ?? 0),
  'Quickest Build': (a, b) => parseFloat(a.buildTime) - parseFloat(b.buildTime),
  'Highest XP': (a, b) => b.xp - a.xp,
};

export function useFilter(agents) {
  const [department, setDepartment] = useState('all');
  const [difficulty, setDifficulty] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('Newest');

  const filtered = useMemo(() => {
    let result = agents;

    if (department !== 'all') {
      result = result.filter((a) => a.departmentIds.includes(department));
    }

    if (difficulty !== 'All') {
      result = result.filter((a) => a.difficulty === difficulty);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((a) => {
        return (
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.techStack.some((t) => t.toLowerCase().includes(q)) ||
          a.tags.some((t) => t.toLowerCase().includes(q)) ||
          a.department.some((d) => d.toLowerCase().includes(q))
        );
      });
    }

    const sorter = SORTERS[sort] || SORTERS.Newest;
    return [...result].sort(sorter);
  }, [agents, department, difficulty, search, sort]);

  return {
    department,
    setDepartment,
    difficulty,
    setDifficulty,
    search,
    setSearch,
    sort,
    setSort,
    filtered,
    sortOptions: Object.keys(SORTERS),
  };
}
