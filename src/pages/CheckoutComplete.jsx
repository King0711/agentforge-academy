import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Loader2, AlertCircle, MailCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { setRememberMe } from '../lib/supabaseClient';
import { invokeWithRetry } from '../lib/invokeFunction';
import { trackPurchase } from '../lib/pixel';
import { GUEST_EMAIL_KEY } from '../hooks/usePaystackCheckout';

// Where Paystack sends a guest buyer back to (create-paystack-checkout sets
// callback_url to /checkout/complete when the buyer wasn't signed in). They've
// paid without an account, so this page (1) waits for the payment to be
// confirmed (paystack-webhook, usually a few seconds), which also creates their
// account, (2) sends the Meta Purchase event, and (3) gets them logged in with
// an emailed one-time code — which is also how they confirm their email.
const REFERENCE_RE = /^sdt_[a-z0-9]+_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_\d{10,16}$/i;
const POLL_MS = 3000;
const POLL_TRIES = 20; // ~60 seconds
const RESEND_WAIT_S = 60;

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-border text-sm text-ink bg-transparent focus:outline-none focus:ring-2 focus:ring-brand/40';
const buttonClass =
  'flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep disabled:opacity-60 text-white font-extrabold px-5 py-3 rounded-xl transition-colors';

function readGuestEmail() {
  try {
    return sessionStorage.getItem(GUEST_EMAIL_KEY) || '';
  } catch {
    return '';
  }
}

export default function CheckoutComplete() {
  const { sendLoginCode, verifyLoginCode, user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reference = params.get('reference') || params.get('trxref') || '';
  const validReference = REFERENCE_RE.test(reference);

  const [phase, setPhase] = useState(validReference ? 'checking' : 'invalid'); // checking | granted | slow | invalid
  const [email, setEmail] = useState(readGuestEmail);
  const [step, setStep] = useState('email'); // email | code
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resendWait, setResendWait] = useState(0);
  const startedRef = useRef(false);

  // Nothing on this page should be indexed or shared.
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    const prevTitle = document.title;
    document.title = 'Payment received | Social Dev Technologies';
    return () => {
      meta.remove();
      document.title = prevTitle;
    };
  }, []);

  // Poll until the webhook has processed the payment.
  useEffect(() => {
    if (!validReference || startedRef.current) return undefined;
    startedRef.current = true;
    let cancelled = false;
    let timer;
    let tries = 0;
    const check = async () => {
      tries += 1;
      const { data } = await invokeWithRetry('guest-checkout-status', { body: { reference } });
      if (cancelled) return;
      if (data?.status === 'granted') {
        trackPurchase(reference, data);
        setPhase('granted');
        return;
      }
      if (tries >= POLL_TRIES) {
        setPhase('slow');
        return;
      }
      timer = setTimeout(check, POLL_MS);
    };
    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      // React StrictMode runs effects twice in development; let the second run restart.
      startedRef.current = false;
    };
  }, [validReference, reference]);

  useEffect(() => {
    if (resendWait <= 0) return undefined;
    const id = setTimeout(() => setResendWait((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [resendWait]);

  const handleSendCode = async (e) => {
    e?.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Enter the email address you paid with.');
      return;
    }
    setBusy(true);
    try {
      setRememberMe(true);
      const { error: err } = await sendLoginCode(email.trim());
      if (err) throw err;
      setStep('code');
      setResendWait(RESEND_WAIT_S);
    } catch {
      setError('We could not send a code to that address. Check it is the email you paid with, then try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    if (!code.trim()) {
      setError('Enter the code we emailed you.');
      return;
    }
    setBusy(true);
    try {
      const { error: err } = await verifyLoginCode(email.trim(), code.trim());
      if (err) throw err;
      try {
        sessionStorage.removeItem(GUEST_EMAIL_KEY);
      } catch {
        // nothing to clean up
      }
      navigate('/dashboard', { replace: true });
    } catch {
      setError("That code didn't work. If you asked for more than one code, use the newest email.");
      setBusy(false);
    }
  };

  // Signed in already (e.g. they logged in on another tab): nothing more to do.
  const alreadySignedIn = !!user && phase === 'granted';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-bg flex items-start justify-center px-4 py-14">
      <div className="w-full max-w-md bg-white dark:bg-[#131E2F] rounded-[22px] p-6 sm:p-8 shadow-[0_30px_70px_-20px_rgba(15,26,42,.25)]">
        {phase === 'invalid' && (
          <>
            <h1 className="font-display font-extrabold text-2xl text-ink mb-2">We couldn't find that payment</h1>
            <p className="text-sm text-body mb-5">
              This page is where Paystack sends you after paying. If you've just paid, open the link from your payment
              receipt or contact us and we'll sort it out.
            </p>
            <Link to="/pricing" className="text-link font-bold text-sm hover:underline">Back to pricing</Link>
          </>
        )}

        {phase === 'checking' && (
          <div className="text-center py-6">
            <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-4" />
            <h1 className="font-display font-extrabold text-xl text-ink mb-1.5">Confirming your payment…</h1>
            <p className="text-sm text-body">This usually takes a few seconds. Please don't close this page.</p>
          </div>
        )}

        {phase === 'slow' && (
          <>
            <div className="flex items-start gap-2 text-sm text-ink bg-[#FFF6E5] dark:bg-white/5 border border-amber-300/50 rounded-lg px-3 py-3 mb-4">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
              <span>We haven't received the confirmation from Paystack yet.</span>
            </div>
            <h1 className="font-display font-extrabold text-xl text-ink mb-2">Don't pay again</h1>
            <p className="text-sm text-body mb-4">
              If your card was charged, your access will be set up automatically as soon as the confirmation arrives, and
              we'll email you. You can also refresh this page in a minute, or message us on WhatsApp with your payment
              reference <span className="font-mono text-xs">{reference}</span> and we'll check it for you.
            </p>
            <a
              href="https://wa.me/2349066006963"
              target="_blank"
              rel="noreferrer"
              className="text-link font-bold text-sm hover:underline"
            >
              Message us on WhatsApp
            </a>
          </>
        )}

        {phase === 'granted' && (
          <>
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <CheckCircle2 className="w-6 h-6" />
              <span className="font-bold text-sm">Payment received</span>
            </div>
            <h1 className="font-display font-extrabold text-2xl text-ink mb-2">You're in!</h1>

            {alreadySignedIn ? (
              <>
                <p className="text-sm text-body mb-5">Your access is live.</p>
                <Link to="/dashboard" className={buttonClass}>Go to my dashboard</Link>
              </>
            ) : (
              <>
                <p className="text-sm text-body mb-5">
                  Your account is ready. One last step: confirm your email with a one-time code and we'll take you to your
                  dashboard. There's no password to set.
                </p>

                {error && (
                  <div className="flex items-start gap-2 text-sm text-rose bg-[#FBEAE9] dark:bg-rose/10 border border-rose/20 rounded-lg px-3 py-2.5 mb-4 text-left">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
                  </div>
                )}

                {step === 'email' ? (
                  <form onSubmit={handleSendCode} className="space-y-3">
                    <label htmlFor="cc-email" className="block text-xs font-semibold text-body-strong">
                      The email you paid with
                    </label>
                    <input
                      id="cc-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputClass}
                    />
                    <button type="submit" disabled={busy} className={buttonClass}>
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <MailCheck className="w-4 h-4" />}
                      {busy ? 'Sending code…' : 'Email me my code'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerify} className="space-y-3">
                    <p className="text-[13.5px] text-body">
                      We sent a code to <strong className="text-ink">{email}</strong>. Wait for that email (check spam too) —
                      asking for another code cancels the first.
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Enter your code"
                      className={`${inputClass} tracking-[0.4em] text-center font-mono`}
                    />
                    <button type="submit" disabled={busy} className={buttonClass}>
                      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {busy ? 'Verifying…' : 'Verify and open my dashboard'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={busy || resendWait > 0}
                      className="text-xs font-semibold text-link hover:underline disabled:opacity-50 disabled:no-underline w-full text-center"
                    >
                      {resendWait > 0 ? `Resend code in ${resendWait}s` : 'Resend code'}
                    </button>
                  </form>
                )}

                <p className="text-[12px] text-body mt-5 leading-relaxed">
                  Closing this page is fine. Later, go to socialdevtechnologies.com/welcome, choose “Log in with an emailed
                  code instead”, and use the same email.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
