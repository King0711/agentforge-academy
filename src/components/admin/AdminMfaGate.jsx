import { useCallback, useEffect, useState } from 'react';
import { Loader2, ShieldCheck, ShieldAlert, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

// Two-step verification for admins (supabase/admin-mfa.sql).
//
// Wraps the whole admin area. A session that has proved a TOTP code from an
// authenticator app is "aal2". What happens to a session that hasn't depends on
// admin_security_settings.require_mfa, which the database also enforces on every
// admin function:
//   * switch OFF (rollout): the admin area loads, with a banner offering to set
//     up / verify, so nobody is locked out while the admins enroll;
//   * switch ON: the admin area is replaced by the set-up / verify screen until
//     the session is aal2.
// The database is the real lock; this component is how an admin gets through it.

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-border text-center text-lg tracking-[0.4em] font-mono text-ink bg-transparent focus:outline-none focus:ring-2 focus:ring-brand/40';
const buttonClass =
  'flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep disabled:opacity-60 text-white font-extrabold px-5 py-3 rounded-xl transition-colors';

async function loadState() {
  const [aalRes, factorsRes, settingRes] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
    supabase.from('admin_security_settings').select('require_mfa').eq('id', true).maybeSingle(),
  ]);
  const verified = (factorsRes.data?.totp ?? []).find((f) => f.status === 'verified');
  return {
    aal: aalRes.data?.currentLevel ?? 'aal1',
    factorId: verified?.id ?? null,
    required: !!settingRes.data?.require_mfa,
  };
}

// Enroll a new authenticator (no verified factor yet) or verify the existing one.
function MfaPanel({ factorId, onDone, blocking }) {
  const [enroll, setEnroll] = useState(null); // { id, qr, secret } while enrolling
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const startEnroll = useCallback(async () => {
    setError('');
    setBusy(true);
    try {
      // An earlier attempt that was never finished leaves an unverified factor
      // that would block a new enrollment with the same name; clear those.
      const { data: existing } = await supabase.auth.mfa.listFactors();
      const stale = (existing?.all ?? []).filter((f) => f.factor_type === 'totp' && f.status !== 'verified');
      await Promise.all(stale.map((f) => supabase.auth.mfa.unenroll({ factorId: f.id })));

      const { data, error: err } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator app',
      });
      if (err) throw err;
      setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    } catch (err) {
      setError(
        err?.message ||
          'Could not start set-up. Check that two-step verification (TOTP) is switched on in the Supabase dashboard under Authentication.',
      );
    } finally {
      setBusy(false);
    }
  }, []);

  const verify = async (e) => {
    e.preventDefault();
    setError('');
    const id = factorId ?? enroll?.id;
    if (!id) return;
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Enter the 6-digit code from your authenticator app.');
      return;
    }
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.mfa.challengeAndVerify({ factorId: id, code: code.trim() });
      if (err) throw err;
      setCode('');
      await onDone();
    } catch {
      setError("That code didn't work. Codes change every 30 seconds; enter the current one.");
      setBusy(false);
    }
  };

  const enrolling = !factorId;

  return (
    <div className="w-full max-w-md bg-white dark:bg-[#131E2F] rounded-[22px] p-6 sm:p-8 shadow-[0_30px_70px_-20px_rgba(15,26,42,.25)]">
      <div className="flex items-center gap-2 text-brand mb-2">
        <ShieldCheck className="w-6 h-6" />
        <span className="font-bold text-sm">Two-step verification</span>
      </div>
      <h1 className="font-display font-extrabold text-2xl text-ink mb-2">
        {enrolling ? 'Set up your authenticator' : 'Enter your code'}
      </h1>
      <p className="text-sm text-body mb-5">
        {enrolling
          ? 'Admin access needs a second step. Scan the code below with an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, Authy), then type the 6-digit code it shows.'
          : 'Open your authenticator app and enter the current 6-digit code to unlock the admin area.'}
      </p>

      {error && (
        <div className="flex items-start gap-2 text-sm text-rose bg-[#FBEAE9] dark:bg-rose/10 border border-rose/20 rounded-lg px-3 py-2.5 mb-4 text-left">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}

      {enrolling && !enroll && (
        <button type="button" onClick={startEnroll} disabled={busy} className={buttonClass}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {error ? 'Try again' : 'Show my QR code'}
        </button>
      )}

      {enrolling && enroll && (
        <div className="mb-4 text-center">
          <img src={enroll.qr} alt="QR code to add this account to your authenticator app" className="w-44 h-44 mx-auto bg-white rounded-lg p-2 border border-border-soft" />
          <p className="text-[12px] text-body mt-3">Can't scan? Enter this key manually:</p>
          <p className="font-mono text-[13px] text-ink break-all select-all mt-1">{enroll.secret}</p>
        </div>
      )}

      {(!enrolling || enroll) && (
        <form onSubmit={verify} className="space-y-3">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            autoFocus={!enrolling}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            aria-label="6-digit code"
            className={inputClass}
          />
          <button type="submit" disabled={busy} className={buttonClass}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {enrolling ? 'Turn on two-step verification' : 'Verify'}
          </button>
        </form>
      )}

      {enrolling && (
        <p className="text-[12px] text-body mt-4 leading-relaxed">
          There are no backup codes. If you lose the phone, another project owner removes your authenticator in Supabase
          (Authentication → Users → your account → Factors) so you can set it up again.
        </p>
      )}
      {!blocking && (
        <p className="text-[12px] text-body mt-2">You can set this up later; the admin area is still open for now.</p>
      )}
    </div>
  );
}

export default function AdminMfaGate({ children }) {
  const [state, setState] = useState(null); // null while loading
  const [panelOpen, setPanelOpen] = useState(false);

  const refresh = useCallback(async () => {
    setState(await loadState());
    setPanelOpen(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadState().then((s) => {
      if (!cancelled) setState(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-link" />
      </div>
    );
  }

  if (state.aal === 'aal2') return children;

  // Switch ON: nothing from the admin area renders until the session is aal2.
  if (state.required) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <MfaPanel factorId={state.factorId} onDone={refresh} blocking />
      </div>
    );
  }

  // Switch OFF: open, with a nudge.
  return (
    <>
      <div className="bg-[#FEF9E7] dark:bg-amber-500/10 border-b border-amber-300/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3 flex-wrap text-sm">
          <span className="flex items-center gap-2 text-ink">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
            {state.factorId
              ? 'Two-step verification is set up, but this session has not used it.'
              : 'Two-step verification is not set up for this admin account.'}
          </span>
          <button
            onClick={() => setPanelOpen(true)}
            className="font-bold text-link hover:underline"
          >
            {state.factorId ? 'Verify now' : 'Set it up'}
          </button>
        </div>
      </div>
      {panelOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto" onClick={() => setPanelOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="my-auto w-full flex justify-center">
            <MfaPanel factorId={state.factorId} onDone={refresh} blocking={false} />
          </div>
        </div>
      )}
      {children}
    </>
  );
}
