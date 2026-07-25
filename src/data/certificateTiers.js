// Single source of truth for the 3 certificates a student can earn:
// Builder 1 alone, Builder 2 alone, and — once both tracks are fully
// complete — an additional "Full Proficiency" certificate.
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
];

export function getCertificateTier(key) {
  return CERTIFICATE_TIERS.find((t) => t.key === key);
}
