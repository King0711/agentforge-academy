import { useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { getAgentsByDifficulty } from '../data/agents';
import { CERTIFICATE_TIERS } from '../data/certificateTiers';

/**
 * Watches completed-session state and auto-claims a certificate the moment
 * a tier is fully complete — including "Full Proficiency", which requires
 * every session across both Builder 1 and Builder 2. Mounted once, globally
 * (App.jsx), since completion can happen from the Catalog, a BuilderSession
 * page, the Dashboard, or the modal — not from one single place.
 *
 * claim_certificate() re-validates completion server-side and is safe to
 * call repeatedly (it's a no-op if already claimed), so this only needs a
 * lightweight per-session guard to avoid redundant network calls, not
 * correctness-critical deduping.
 */
export function useCertificateClaims(userId, completed) {
  const attemptedRef = useRef(new Set());

  useEffect(() => {
    if (!userId || !isSupabaseConfigured || !completed) return;

    for (const tier of CERTIFICATE_TIERS) {
      if (attemptedRef.current.has(tier.key)) continue;
      // Week tiers name a specific agent id directly (their single main
      // project) rather than "every agent in a difficulty".
      const requiredIds = tier.requiredAgentIds
        ?? tier.difficulties.flatMap((d) => getAgentsByDifficulty(d).map((a) => a.id));
      const isComplete = requiredIds.length > 0 && requiredIds.every((id) => completed.includes(id));
      if (!isComplete) continue;

      attemptedRef.current.add(tier.key);
      supabase.rpc('claim_certificate', { p_tier: tier.key }).then(({ error }) => {
        if (error && !error.message?.includes('Not yet eligible')) {
          console.error('Failed to claim certificate:', error.message);
        }
      });
    }
  }, [userId, completed]);
}
