// Retired: this was a one-off send (campaign invite-2026-10-01) and has been switched off.
// It does nothing now and requires a valid JWT to even reach this code.
Deno.serve(() => new Response(JSON.stringify({ error: 'Retired' }), { status: 410, headers: { 'Content-Type': 'application/json' } }));
