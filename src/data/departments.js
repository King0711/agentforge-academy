export const departments = [
  { id: 'all', name: 'All Departments', icon: '🌐', color: '#64748B' },
  { id: 'sales', name: 'Sales', icon: '💼', color: '#0EA5E9' },
  { id: 'marketing', name: 'Marketing', icon: '📢', color: '#EC4899' },
  { id: 'operations', name: 'Operations', icon: '⚙️', color: '#14B8A6' },
  { id: 'finance', name: 'Finance', icon: '💰', color: '#22C55E' },
  { id: 'hr', name: 'HR & People', icon: '👥', color: '#A855F7' },
  { id: 'legal', name: 'Legal', icon: '⚖️', color: '#6366F1' },
  { id: 'support', name: 'Customer Support', icon: '🎧', color: '#F97316' },
  { id: 'engineering', name: 'Engineering', icon: '💻', color: '#06B6D4' },
  { id: 'data', name: 'Data & Analytics', icon: '📊', color: '#8B5CF6' },
  { id: 'strategy', name: 'Executive / Strategy', icon: '🧭', color: '#F43F5E' },
];

export const getDepartment = (name) => {
  // Map a free-text department name to a department object
  const normalized = name.toLowerCase();
  return (
    departments.find((d) => normalized.includes(d.name.toLowerCase().split(' ')[0].replace('&', '').trim())) ||
    departments.find((d) => normalized.includes(d.id)) ||
    departments[0]
  );
};

export const difficultyLevels = [
  { id: 'Beginner', label: 'Beginner', icon: '🌱', color: '#10B981' },
  { id: 'Intermediate', label: 'Intermediate', icon: '⚡', color: '#0067B8' },
  { id: 'Advanced', label: 'Advanced', icon: '🚀', color: '#7C3AED' },
  { id: 'World Class', label: 'World Class', icon: '🏆', color: '#F59E0B' },
];

export const getDifficulty = (id) => difficultyLevels.find((d) => d.id === id) || difficultyLevels[0];

export const levels = [
  { name: 'Apprentice', min: 0, max: 999, icon: '🌱' },
  { name: 'Builder', min: 1000, max: 2999, icon: '🔨' },
  { name: 'Engineer', min: 3000, max: 5999, icon: '⚙️' },
  { name: 'Architect', min: 6000, max: 9999, icon: '🏛️' },
  { name: 'Master', min: 10000, max: Infinity, icon: '🏆' },
];

export const getLevel = (xp) => levels.find((l) => xp >= l.min && xp <= l.max) || levels[levels.length - 1];
