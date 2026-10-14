import { useState } from 'react';
import { Loader2, TriangleAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';

// Deliberately low-key: a small muted link at the very bottom of Account, no nav
// entry. It is still plain text that says what it is — people have a legal right to
// erasure (NDPA/GDPR) and every app store requires deletion to be findable in-app.
// The friction lives in the confirmation (type your email), not in hiding it.
//
// Not routed through invokeWithRetry: a retry after a deletion that succeeded but
// whose reply was lost would come back 401 and read as a failure.
async function errorMessage(error) {
  try {
    const body = await error.context?.json?.();
    if (body?.error) return body.error;
  } catch { /* fall through */ }
  return 'We couldn’t reach our server. Check your connection and try again.';
}

export default function DeleteAccount() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const matches = !!user?.email && typed.trim().toLowerCase() === user.email.toLowerCase();

  const handleDelete = async () => {
    if (!matches || busy) return;
    setError('');
    setBusy(true);
    const { error: err } = await supabase.functions.invoke('delete-account', {
      body: { confirmEmail: typed.trim() },
    });
    if (err) {
      setError(await errorMessage(err));
      setBusy(false);
      return;
    }
    // The user row is gone, so there is nothing for a global sign-out to revoke.
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
    window.location.assign('/');
  };

  if (!open) {
    return (
      <p className="text-center pt-6 pb-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-gray-400 hover:text-gray-500 underline underline-offset-2"
        >
          Delete account
        </button>
      </p>
    );
  }

  return (
    <div className="rounded-2xl border-[1.5px] border-rose/40 bg-white dark:bg-[#181818] p-5 space-y-3">
      <div className="flex items-start gap-3">
        <TriangleAlert className="w-4 h-4 text-rose flex-shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink">Delete your account</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            This is permanent and can’t be undone. You’ll lose access to everything you bought (guides,
            classes and recordings), your progress, certificates, community messages and referral link.
            Any money you paid is not refunded, and we keep payment records as the law requires,
            without your name or email attached.
          </p>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-body-strong mb-1.5">
          Type your email ({user?.email}) to confirm
        </label>
        <input
          type="email"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0A090F] focus:outline-none focus:ring-2 focus:ring-rose/40"
        />
      </div>
      {error && <p className="text-sm text-rose">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleDelete}
          disabled={!matches || busy}
          className="flex items-center gap-2 bg-rose hover:opacity-90 disabled:opacity-40 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-opacity"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          Permanently delete my account
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setTyped(''); setError(''); }}
          disabled={busy}
          className="text-sm text-gray-500 hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
