// Single source of truth for the certificates a student can earn: Builder 1
// alone, Builder 2 alone, "Full Proficiency" once both tracks are complete,
// and one per Builder 1 week — earned the moment that week's single main
// project (not the whole week) is complete. Week tiers use requiredAgentIds
// instead of difficulties (a specific agent id, not "every agent in a
// difficulty") — useCertificateClaims checks whichever is present.
// difficulties: [] on week tiers keeps them out of Certificates.jsx's
// difficulties.length === 1 filter, since they're surfaced inline on the
// BuilderSession page for that week's main project instead.
export const CERTIFICATE_TIERS = [
  {
    key: 'builder1',
    label: 'Builder 1',
    icon: '🌱',
    difficulties: ['Builder 1'],
    body: 'has successfully completed every session in the Builder 1 track, building real, working AI agents with Claude.',
  },
  {
    key: 'builder2',
    label: 'Builder 2',
    icon: '⚡',
    difficulties: ['Builder 2'],
    body: 'has successfully completed every session in the Builder 2 track, building real, working AI agents with Claude.',
  },
  {
    key: 'proficiency',
    label: 'Full Proficiency',
    icon: '🏆',
    difficulties: ['Builder 1', 'Builder 2'],
    body: 'has demonstrated full proficiency by completing every session across both the Builder 1 and Builder 2 tracks.',
  },
  {
    key: 'week1',
    label: 'Week 1',
    icon: '📅',
    difficulties: [],
    requiredAgentIds: [4],
    body: 'has completed Week 1 of Builder 1 — building a scheduled digest agent that reads a source, summarizes it with AI, and delivers automatically.',
  },
  {
    key: 'week2',
    label: 'Week 2',
    icon: '📅',
    difficulties: [],
    requiredAgentIds: [5],
    body: 'has completed Week 2 of Builder 1 — building an agent that turns messy input into clean, structured output.',
  },
  {
    key: 'week3',
    label: 'Week 3',
    icon: '📅',
    difficulties: [],
    requiredAgentIds: [1],
    body: 'has completed Week 3 of Builder 1 — building an agent that triages incoming items and takes action on them.',
  },
  {
    key: 'week4',
    label: 'Week 4',
    icon: '📅',
    difficulties: [],
    requiredAgentIds: [2],
    body: 'has completed Week 4 of Builder 1 — building an outward-facing agent that talks directly with people.',
  },
];

export function getCertificateTier(key) {
  return CERTIFICATE_TIERS.find((t) => t.key === key);
}
