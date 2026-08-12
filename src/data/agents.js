import { agentsBeginner } from './agentsBeginner';
import { agentsIntermediate } from './agentsIntermediate';
import { agentsAdvanced } from './agentsAdvanced';
import { agentsWorldClass } from './agentsWorldClass';

export const agents = [
  ...agentsBeginner,
  ...agentsIntermediate,
  ...agentsAdvanced,
  ...agentsWorldClass,
];

export const getAgentById = (id) => agents.find((a) => a.id === Number(id));
export const getAgentBySlug = (slug) => agents.find((a) => a.slug === slug);

// Ordered list of agents in a given difficulty tier — the sequence used for
// the dedicated session pages' Previous/Next navigation.
export const getAgentsByDifficulty = (difficulty) => agents.filter((a) => a.difficulty === difficulty);
export const getBuilder1Agents = () => getAgentsByDifficulty('Builder 1');
export const getBuilder2Agents = () => getAgentsByDifficulty('Builder 2');

// Week grouping — currently only set on Builder 1's agents (see
// agentsBeginner.js). Returns [] for tiers without week data rather than
// throwing, so callers can fall back to a flat list.
export const groupAgentsByWeek = (tierAgents) => {
  if (!tierAgents.every((a) => a.week)) return [];
  const weeks = [...new Set(tierAgents.map((a) => a.week))].sort((a, b) => a - b);
  return weeks.map((week) => ({
    week,
    agents: tierAgents.filter((a) => a.week === week),
    mainAgent: tierAgents.find((a) => a.week === week && a.isMainProject),
  }));
};

// Difficulty tiers that have dedicated SEO pages (as opposed to the modal) —
// maps a tier label to its page's URL base.
const BUILDER_PAGE_BASE = {
  'Builder 1': '/builder-1',
  'Builder 2': '/builder-2',
};

// Returns the dedicated session page URL for an agent, or null if this tier
// doesn't have one yet (still opens in the modal).
export const getBuilderPagePath = (agent) => {
  const base = BUILDER_PAGE_BASE[agent?.difficulty];
  return base && agent.slug ? `${base}/${agent.slug}` : null;
};

// Returns the next agent in the same difficulty tier (by id), or the first
// agent of the next difficulty tier if this is the last in its tier.
export const getNextRecommended = (agent) => {
  if (!agent) return null;
  const sameTier = agents.filter((a) => a.difficulty === agent.difficulty);
  const idx = sameTier.findIndex((a) => a.id === agent.id);

  if (idx !== -1 && idx < sameTier.length - 1) {
    return sameTier[idx + 1];
  }

  const tiers = ['Builder 1', 'Builder 2', 'Advanced', 'World Class'];
  const tierIdx = tiers.indexOf(agent.difficulty);
  for (let i = tierIdx + 1; i < tiers.length; i++) {
    const nextTier = agents.filter((a) => a.difficulty === tiers[i]);
    if (nextTier.length) return nextTier[0];
  }

  return agents.find((a) => a.id !== agent.id) || null;
};
