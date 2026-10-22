import { useState } from 'react';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { readMfaClaims } from '../lib/sessionPolicy';

// Shown by AppShell in place of the whole site while the signed-in account has an
// authenticator app and this session hasn't entered a code recently enough
// (AuthContext: mfaStatus === 'required'). It covers both cases the same way:
//   * just signed in with a password or an emailed code, and the code step is next;
//   * mid-visit, the allowed window ran out and a fresh code is needed.
// Too many wrong codes in a row ends the session, so a stolen password or inbox can't
// be used to guess through the second step.

const MAX_WRONG_CODES = 5;

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-border text-center text-lg tracking-[0.4em] font-mono text-ink bg-transparent focus:outline-none focus:ring-2 focus:ring-brand/40';
const buttonClass =
  'flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep disabled:opacity-60 text-white font-extrabold px-5 py-3 rounded-xl transition-colors';

export default function MfaChallenge() {
  const { session, user, verifyMfa, signOut, authPolicy } = useAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [wrong, setWrong] = useState(0);

  // A session that has entered a code before is "expired"; one that never has is "new".
  const expired = readMfaClaims(session?.access_token).lastTotpAt > 0;
  const hours = Math.round((authPolicy.mfaMaxAgeMinutes / 60) * 10) / 10;

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setBusy(true);
    setError('');
    const { error: err } = await verifyMfa(code.trim());
    if (!err) return; // AuthContext flips to 'ok' and AppShell renders the site
    setCode('');
    const next = wrong + 1;
    setWrong(next);
    if (next >= MAX_WRONG_CODES) {
      await signOut();
      return;
    }
    setError(
      err.message?.startsWith('Please sign in')
        ? err.message
        : `That code didn't work. Codes change every 30 seconds; enter the current one. (${MAX_WRONG_CODES - next} tries left)`,
    );
    setBusy(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-bg">
      <div className="w-full max-w-md bg-white dark:bg-[#131E2F] rounded-[22px] p-6 sm:p-8 shadow-[0_30px_70px_-20px_rgba(15,26,42,.25)]">
        <div className="flex items-center gap-2 text-brand mb-2">
          <ShieldCheck className="w-6 h-6" />
          <span className="font-bold text-sm">Two-step verification</span>
        </div>
        <h1 className="font-display font-extrabold text-2xl text-ink mb-2">Enter your code</h1>
        <p className="text-sm text-body mb-5">
          {expired
            ? `For your security we ask for a new code every ${hours} hours. Open your authenticator app and enter the current 6-digit code to carry on.`
            : `Open your authenticator app and enter the current 6-digit code to finish signing in${user?.email ? ` as ${user.email}` : ''}.`}
        </p>

        {error && (
          <div className="flex items-start gap-2 text-sm text-rose bg-[#FBEAE9] dark:bg-rose/10 border border-rose/20 rounded-lg px-3 py-2.5 mb-4 text-left" role="alert">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            aria-label="6-digit code"
            className={inputClass}
          />
          <button type="submit" disabled={busy} className={buttonClass}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Verify
          </button>
        </form>

        <button
          type="button"
          onClick={() => signOut()}
          className="block mx-auto mt-5 text-[13px] font-bold text-link hover:underline"
        >
          Sign out
        </button>
        <p className="text-[12px] text-body mt-4 text-center leading-relaxed">
          Lost your phone? Message us on WhatsApp and we&apos;ll help you back in.
        </p>
      </div>
    </div>
  );
}
