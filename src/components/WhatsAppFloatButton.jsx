import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { saveCheckoutPrefill } from '../lib/checkoutPrefill';
import { OPEN_ADVISOR_EVENT as OPEN_EVENT } from '../lib/advisor';
import { AI_AGENT_MASTERY_PRICE, VIBECODING_PRICE, BUILDER1_PRICE, BUILDER2_PRICE, PRO_PRICE } from '../data/pricing';

const WA_NUMBER = '2349066006963';
const naira = (n) => `₦${n.toLocaleString('en-NG')}`;

const COURSES = [
  { id: 'aimastery', label: 'AI Agent Mastery', desc: `3 live evenings · ${naira(AI_AGENT_MASTERY_PRICE)}` },
  { id: 'vibecoding', label: 'Vibe Coding Bootcamp', desc: `Build a full product · ${naira(VIBECODING_PRICE)}` },
];

const GUIDES = [
  { id: 'builder1', label: 'Builder 1 guides', option: `Builder 1 — 12 guides · ${naira(BUILDER1_PRICE)}` },
  { id: 'builder2', label: 'Builder 2 guides', option: `Builder 2 — 13 guides · ${naira(BUILDER2_PRICE)}` },
  { id: 'pro', label: 'Pro guides (Builder 1 + 2)', option: `Pro (both) — 25 guides · ${naira(PRO_PRICE)}` },
];

const LABELS = Object.fromEntries([...COURSES, ...GUIDES].map((c) => [c.id, c.label]));

const inputClass =
  'w-full px-4 py-3 rounded-xl border border-border text-sm text-ink bg-transparent placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40';

// A single live cohort goes to its own page; guides (or a mix) go to /pricing.
function payNowPath(ids) {
  if (ids.length === 1) {
    if (ids[0] === 'aimastery') return '/ai-agent-mastery#pricing';
    if (ids[0] === 'vibecoding') return '/vibe-coding#pricing';
  }
  return '/pricing';
}

function buildWaMessage(name, email, ids) {
  const names = ids.map((id) => LABELS[id]).filter(Boolean);
  const courseText =
    names.length <= 1 ? names[0] || '' : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];

  let msg = `Hello, my name is ${name.trim()}.`;
  if (courseText) msg += ` I am interested in the ${courseText}.`;
  if (email.trim()) msg += ` My email is ${email.trim()}.`;
  return msg;
}

// Real WhatsApp glyph (not a lucide icon — lucide has no brand icons) so the
// button reads instantly as "chat on WhatsApp" rather than a generic
// message bubble.
function WhatsAppGlyph({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.47 14.38c-.29-.15-1.73-.85-2-.95-.27-.1-.46-.15-.66.15-.2.29-.76.95-.93 1.15-.17.2-.34.22-.63.07-.29-.15-1.22-.45-2.33-1.44-.86-.77-1.44-1.71-1.61-2-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.07-.15-.66-1.59-.91-2.18-.24-.57-.48-.5-.66-.51-.17-.01-.37-.01-.56-.01-.2 0-.51.07-.78.37-.27.29-1.02 1-1.02 2.44s1.05 2.83 1.19 3.03c.15.2 2.06 3.15 5 4.41.7.3 1.24.48 1.67.61.7.22 1.34.19 1.84.12.56-.08 1.73-.71 1.97-1.39.24-.68.24-1.27.17-1.39-.07-.12-.27-.2-.56-.34z" />
      <path d="M12.04 2.5c-5.26 0-9.54 4.28-9.54 9.54 0 1.68.44 3.32 1.28 4.76L2.5 21.5l4.85-1.27a9.5 9.5 0 0 0 4.69 1.24h.01c5.26 0 9.54-4.28 9.54-9.54 0-2.55-.99-4.94-2.79-6.74a9.47 9.47 0 0 0-6.76-2.69zm0 17.46h-.01a7.9 7.9 0 0 1-4.03-1.1l-.29-.17-3 .79.8-2.92-.19-.3a7.9 7.9 0 0 1-1.21-4.22c0-4.37 3.56-7.92 7.94-7.92a7.88 7.88 0 0 1 5.61 2.33 7.87 7.87 0 0 1 2.32 5.6c0 4.37-3.56 7.91-7.94 7.91z" />
    </svg>
  );
}

// Global floating "chat with an advisor" launcher, mounted once in App.jsx.
// Flat on purpose (no glow, pulse, entrance pop or hover scale), and in
// WhatsApp's darker teal green: white on the bright #25D366 is only ~2:1.
// A pre-sale contact channel — distinct from the (post-purchase) student
// WhatsApp community removed from the homepage's community section, which
// is only shared once someone actually signs up.
//
// It opens a short form first so the advisor starts with context: name, an
// optional email and what the person is interested in. From there they either
// send that as the WhatsApp message or go and pay — in which case the name and
// email are handed to the checkout form (src/lib/checkoutPrefill.js).
export default function WhatsAppFloatButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [courses, setCourses] = useState([]);
  const [guide, setGuide] = useState('');

  // Other buttons on the page ("Talk to an advisor") open this same form by
  // dispatching a window event, so there is one form and one set of copy.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const selected = guide ? [...courses, guide] : courses;
  const canSend = name.trim().length > 0 && selected.length > 0;

  const toggleCourse = (id) =>
    setCourses((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handlePayNow = () => {
    if (!canSend) return;
    saveCheckoutPrefill({ name, email });
    window.location.assign(payNowPath(selected));
  };

  const handleWhatsApp = () => {
    if (!canSend) return;
    const text = encodeURIComponent(buildWaMessage(name, email, selected));
    window.open(`https://wa.me/${WA_NUMBER}?text=${text}`, '_blank', 'noreferrer');
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Chat with an advisor on WhatsApp"
        title="Chat with an advisor on WhatsApp"
        className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] z-30 h-[60px] min-w-[60px] rounded-full bg-[#128C7E] hover:bg-[#075E54] text-white flex items-center justify-center gap-3 lg:pl-5 lg:pr-6 shadow-[0_14px_32px_-8px_rgba(7,94,84,.65)] transition-colors"
      >
        <WhatsAppGlyph className="w-8 h-8 flex-shrink-0" />
        {/* The label only shows where there is room; phones get just the circle. */}
        <span className="hidden lg:inline text-[15px] font-extrabold leading-none whitespace-nowrap">Chat with an advisor</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto" onClick={() => setOpen(false)}>
          <div
            className="relative w-full max-w-sm bg-white dark:bg-[#131E2F] rounded-[22px] p-6 sm:p-7 shadow-[0_30px_70px_-20px_rgba(15,26,42,.5)] my-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="wa-form-title"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-ink transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 id="wa-form-title" className="font-display font-extrabold text-xl text-ink mb-1.5 pr-6">
              Chat with an advisor
            </h2>
            <p className="text-[13.5px] text-body mb-5">
              Tell us a little about you and what you're after, then message us on WhatsApp or pay right away.
              We reply 10am–5pm WAT, Monday to Saturday.
            </p>

            <div className="space-y-3">
              <div>
                <label htmlFor="wa-name" className="block text-xs font-semibold text-body-strong mb-1">Your name</label>
                <input
                  id="wa-name"
                  type="text"
                  autoComplete="name"
                  autoFocus
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="wa-email" className="block text-xs font-semibold text-body-strong mb-1">
                  Email <span className="font-normal text-body">(optional)</span>
                </label>
                <input
                  id="wa-email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-body-strong mb-1.5">What are you interested in?</p>
                <div className="flex flex-col gap-2">
                  {COURSES.map((c) => {
                    const checked = courses.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        onClick={() => toggleCourse(c.id)}
                        className={`flex items-start gap-3 w-full text-left px-3.5 py-3 rounded-xl border transition-colors ${
                          checked ? 'border-brand bg-brand/10' : 'border-border hover:border-brand/50'
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center ${
                            checked ? 'bg-brand border-brand' : 'border-border-strong'
                          }`}
                        >
                          {checked && (
                            <svg viewBox="0 0 10 8" className="w-2.5 h-2.5 text-white fill-none stroke-current stroke-2">
                              <polyline points="1 4 3.5 6.5 9 1" />
                            </svg>
                          )}
                        </span>
                        <span>
                          <span className="block text-[13.5px] font-semibold text-ink leading-snug">{c.label}</span>
                          <span className="block text-xs text-body mt-0.5">{c.desc}</span>
                        </span>
                      </button>
                    );
                  })}

                  <div className={`px-3.5 py-3 rounded-xl border transition-colors ${guide ? 'border-brand bg-brand/10' : 'border-border'}`}>
                    <label htmlFor="wa-guide" className="block text-[13.5px] font-semibold text-ink leading-snug">Guides</label>
                    <span className="block text-xs text-body mt-0.5 mb-2">Self-paced, one-time payment · pick a track</span>
                    <select
                      id="wa-guide"
                      value={guide}
                      onChange={(e) => setGuide(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#131E2F] focus:outline-none focus:ring-2 focus:ring-brand/40"
                    >
                      <option value="">Not interested in guides</option>
                      {GUIDES.map((g) => (
                        <option key={g.id} value={g.id}>{g.option}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleWhatsApp}
                disabled={!canSend}
                className="flex items-center justify-center gap-2 w-full bg-[#128C7E] hover:bg-[#075E54] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold px-5 py-3 rounded-xl transition-colors"
              >
                <WhatsAppGlyph className="w-4 h-4" /> Send to WhatsApp
              </button>
              <button
                type="button"
                onClick={handlePayNow}
                disabled={!canSend}
                className="flex items-center justify-center gap-2 w-full bg-brand hover:bg-brand-deep disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold px-5 py-3 rounded-xl transition-colors"
              >
                Pay now →
              </button>
              {!canSend && (
                <p className="text-xs text-body text-center">Add your name and pick at least one option to continue.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
