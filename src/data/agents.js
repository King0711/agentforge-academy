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

// Returns the next agent in the same difficulty tier (by id), or the first
// agent of the next difficulty tier if this is the last in its tier.
export const getNextRecommended = (agent) => {
  if (!agent) return null;
  const sameTier = agents.filter((a) => a.difficulty === agent.difficulty);
  const idx = sameTier.findIndex((a) => a.id === agent.id);

  if (idx !== -1 && idx < sameTier.length - 1) {
    return sameTier[idx + 1];
  }

  const tiers = ['Beginner', 'Intermediate', 'Advanced', 'World Class'];
  const tierIdx = tiers.indexOf(agent.difficulty);
  for (let i = tierIdx + 1; i < tiers.length; i++) {
    const nextTier = agents.filter((a) => a.difficulty === tiers[i]);
    if (nextTier.length) return nextTier[0];
  }

  return agents.find((a) => a.id !== agent.id) || null;
};
