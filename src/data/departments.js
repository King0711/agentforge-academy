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

// Beginner/Intermediate were renamed to Builder 1/Builder 2 when the
// platform moved to an all-paid tiered model. Advanced/World Class are no
// longer purchasable by anyone — they're admin-only content now.
export const difficultyLevels = [
  { id: 'Builder 1', label: 'Builder 1', icon: '🌱', color: '#16A34A', tint: '#EAFAF1', tier: 'builder1' },
  { id: 'Builder 2', label: 'Builder 2', icon: '⚡', color: '#7C3AED', tint: '#F3EBFF', tier: 'builder2' },
  { id: 'Advanced', label: 'Advanced', icon: '🚀', color: '#F59E0B', tint: '#FEF9E7', tier: 'admin_only', adminOnly: true },
  { id: 'World Class', label: 'World Class', icon: '🏆', color: '#E11D48', tint: '#FDEEF4', tier: 'admin_only', adminOnly: true },
];

// The two tiers every regular visitor can browse/buy. Advanced/World Class
// are deliberately excluded — they should never appear in a non-admin's
// catalog, filters, or progress views.
export const publicDifficultyLevels = difficultyLevels.filter((d) => !d.adminOnly);

export const getDifficulty = (id) => difficultyLevels.find((d) => d.id === id) || difficultyLevels[0];

// Centralizes the "does this user have access to this difficulty tier"
// check so Catalog/Home/AgentCard/PathDetail/Dashboard all agree on the
// same rule. Admins always have access to everything, including the
// admin-only Advanced/World Class tiers that no purchase can unlock.
export function hasAccessToDifficulty(difficulty, { hasBuilder1, hasBuilder2, isAdmin } = {}) {
  if (isAdmin) return true;
  const level = getDifficulty(difficulty);
  if (level.adminOnly) return false;
  if (level.tier === 'builder1') return Boolean(hasBuilder1);
  if (level.tier === 'builder2') return Boolean(hasBuilder2);
  return false;
}

// Whether a non-admin should even see this difficulty tier exist at all
// (Advanced/World Class are hidden entirely, not just locked).
export function isVisibleToPublic(difficulty) {
  return !getDifficulty(difficulty).adminOnly;
}

export const levels = [
  { name: 'Apprentice', min: 0, max: 999, icon: '🌱' },
  { name: 'Builder', min: 1000, max: 2999, icon: '🔨' },
  { name: 'Engineer', min: 3000, max: 5999, icon: '⚙️' },
  { name: 'Architect', min: 6000, max: 9999, icon: '🏛️' },
  { name: 'Master', min: 10000, max: Infinity, icon: '🏆' },
];

export const getLevel = (xp) => levels.find((l) => xp >= l.min && xp <= l.max) || levels[levels.length - 1];
