import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Loader2, AlertCircle, Lock } from 'lucide-react';
import { COUNTRIES, DEFAULT_COUNTRY, buildE164, findCountry } from '../data/countryCodes';
import { readCheckoutPrefill } from '../lib/checkoutPrefill';

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-border text-sm text-ink bg-transparent focus:outline-none focus:ring-2 focus:ring-brand/40';

// The checkout form for visitors who aren't signed in (usePaystackCheckout.js).
// Name, email and phone (with a country code the buyer picks) are saved as a
// lead and the buyer goes straight to Paystack — no account or email-code step
// before paying. Their account is created after the payment is verified and
// they confirm their email with an emailed code the first time they log in
// (see CheckoutComplete.jsx). The file keeps its old name because every
// checkout surface already renders it.
export default function CheckoutAuthModal({ open, ...props }) {
  // The form mounts fresh on every open, so its fields start from whatever the
  // WhatsApp pre-chat form saved (src/lib/checkoutPrefill.js).
  return open ? <CheckoutForm {...props} /> : null;
}

function CheckoutForm({ onClose, onSubmit, loading = false, error = '', planLabel }) {
  const [prefill] = useState(readCheckoutPrefill);
  const [name, setName] = useState(prefill.name);
  const [email, setEmail] = useState(prefill.email);
  const [countryIso, setCountryIso] = useState(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState('');
  // Honeypot: real visitors never see or fill this.
  const [website, setWebsite] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');
    const country = findCountry(countryIso);
    const e164 = buildE164(country, phone);
    if (name.trim().length < 2) {
      setLocalError('Enter your full name.');
      return;
    }
    if (!e164) {
      setLocalError(`Enter a valid phone number for ${country.name} (+${country.dial}).`);
      return;
    }
    onSubmit({ name: name.trim(), email: email.trim(), phone: e164, country: country.iso, website });
  };

  const shownError = localError || error;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="relative w-full max-w-sm bg-white dark:bg-[#131E2F] rounded-[22px] p-6 sm:p-7 shadow-[0_30px_70px_-20px_rgba(15,26,42,.5)] my-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-form-title"
      >
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-gray-400 hover:text-ink transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 id="checkout-form-title" className="font-display font-extrabold text-xl text-ink mb-1.5 pr-6">
          Almost there
        </h2>
        <p className="text-[13.5px] text-body mb-5">
          {planLabel ? <>Tell us who's joining <strong className="text-ink">{planLabel}</strong>, then</> : <>Tell us who's joining, then</>}{' '}
          you'll go straight to payment — no account to create first.
        </p>

        {shownError && (
          <div className="flex items-start gap-2 text-sm text-rose bg-[#FBEAE9] dark:bg-rose/10 border border-rose/20 rounded-lg px-3 py-2.5 mb-4 text-left">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {shownError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          <div>
            <label htmlFor="co-name" className="block text-xs font-semibold text-body-strong mb-1">Full name</label>
            <input
              id="co-name"
              type="text"
              autoComplete="name"
              autoFocus
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="co-email" className="block text-xs font-semibold text-body-strong mb-1">Email</label>
            <input
              id="co-email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="co-phone" className="block text-xs font-semibold text-body-strong mb-1">Phone / WhatsApp number</label>
            <div className="flex gap-2">
              <select
                aria-label="Country code"
                value={countryIso}
                onChange={(e) => setCountryIso(e.target.value)}
                className="w-[42%] flex-shrink-0 px-2 py-3 rounded-xl border border-border text-sm text-ink bg-white dark:bg-[#131E2F] focus:outline-none focus:ring-2 focus:ring-brand/40"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.iso} value={c.iso}>+{c.dial} {c.name}</option>
                ))}
              </select>
              <input
                id="co-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                required
                maxLength={20}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="801 234 5678"
                className={`${inputClass} min-w-0`}
              />
            </div>
          </div>

          {/* Honeypot — hidden from people and assistive tech. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
            <label>
              Website
              <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep disabled:opacity-60 text-white font-extrabold px-5 py-3 rounded-xl transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {loading ? 'Taking you to payment…' : 'Continue to payment'}
          </button>
        </form>

        <p className="text-[12px] text-body mt-4 leading-relaxed">
          We use these details for your receipt, class updates and support. After you pay you'll confirm your email with a
          one-time code the first time you log in.
        </p>
        <p className="text-[12.5px] text-body mt-2">
          Already have an account?{' '}
          <Link to="/welcome?mode=login" className="text-link font-bold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
