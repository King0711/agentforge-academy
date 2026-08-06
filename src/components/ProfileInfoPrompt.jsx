import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Pencil, X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { industries } from '../data/industries';

export default function ProfileInfoPrompt() {
  const { user } = useAuth();
  const [status, setStatus] = useState('loading'); // loading | eligible | dismissed | set | ineligible
  const [modalOpen, setModalOpen] = useState(false);
  const [savedIndustry, setSavedIndustry] = useState('');
  const [name, setName] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [customIndustry, setCustomIndustry] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !isSupabaseConfigured) {
      setStatus('ineligible');
      return;
    }

    const dismissKey = `sdt_profile_prompt_dismissed_${user.id}`;

    let cancelled = false;
    supabase
      .from('profiles')
      .select('display_name, industry')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const fallbackName = user.user_metadata?.display_name || user.email?.split('@')[0] || '';
        setName(data?.display_name || fallbackName);

        if (data?.industry) {
          setSavedIndustry(data.industry);
          setSelectedIndustry(industries.includes(data.industry) ? data.industry : 'Other');
          setCustomIndustry(industries.includes(data.industry) ? '' : data.industry);
          setStatus('set');
        } else if (localStorage.getItem(dismissKey) === 'true') {
          setStatus('dismissed');
        } else {
          // First time this user has ever landed on an authenticated page
          // with no industry on file — open the modal automatically rather
          // than waiting for a click, since this is the "ask on login" flow.
          setStatus('eligible');
          setModalOpen(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Easy to close by design (X, backdrop click, Escape, or the Skip link
  // all route here) — a user forced into filling this in just to escape a
  // modal tends to type junk to get past it, which defeats the point.
  const closeModal = ({ skip } = {}) => {
    setModalOpen(false);
    setError('');
    if (skip && status !== 'set') {
      if (user) localStorage.setItem(`sdt_profile_prompt_dismissed_${user.id}`, 'true');
      setStatus('dismissed');
    }
  };

  useEffect(() => {
    if (!modalOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && closeModal({ skip: true });
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, status]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalIndustry = selectedIndustry === 'Other' ? customIndustry.trim() : selectedIndustry;
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!finalIndustry) {
      setError('Please choose or enter an industry.');
      return;
    }

    setSubmitting(true);
    setError('');

    const { error: err } = await supabase
      .from('profiles')
      .update({ display_name: name.trim(), industry: finalIndustry })
      .eq('id', user.id);

    if (err) {
      setSubmitting(false);
      setError('Could not save — please try again.');
      return;
    }

    // Keeps Navbar (which reads user.user_metadata.display_name) in sync
    // immediately, without waiting for the next login.
    await supabase.auth.updateUser({ data: { display_name: name.trim() } });

    setSubmitting(false);
    setSavedIndustry(finalIndustry);
    setStatus('set');
    setModalOpen(false);
  };

  if (status === 'loading' || status === 'ineligible') return null;

  const modal = (
    <AnimatePresence>
      {modalOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-[#1A1333]/55 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => closeModal({ skip: true })}
        >
          <motion.div
            className="relative w-full sm:max-w-md rounded-2xl overflow-hidden bg-white dark:bg-[#181818] border border-border-soft mt-16 sm:mt-0"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => closeModal({ skip: true })}
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-lg bg-[#FAF8FF] dark:bg-[#0A090F] hover:bg-[#F3EBFF] dark:hover:bg-brand/15 text-brand transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-5 h-5 text-brand flex-shrink-0" />
                <p className="font-display text-lg font-extrabold text-ink">A little about you</p>
              </div>
              <p className="text-sm text-body -mt-2">
                Helps us tailor tips and emails to what's actually useful for you.
              </p>

              <div>
                <label className="block text-xs font-semibold text-body-strong mb-1.5">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0A090F] focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-body-strong mb-1.5">
                  Industry — current or one you'd like to move into
                </label>
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0A090F] focus:outline-none focus:ring-2 focus:ring-brand/40"
                >
                  <option value="" disabled>Choose an industry…</option>
                  {industries.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </div>

              {selectedIndustry === 'Other' && (
                <input
                  value={customIndustry}
                  onChange={(e) => setCustomIndustry(e.target.value)}
                  placeholder="Your industry"
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm text-ink bg-white dark:bg-[#0A090F] focus:outline-none focus:ring-2 focus:ring-brand/40"
                />
              )}

              {error && <p className="text-xs text-rose">{error}</p>}

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => closeModal({ skip: true })}
                  className="text-sm font-semibold text-gray-400 hover:text-body"
                >
                  Skip for now
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-brand hover:bg-brand-deep disabled:opacity-60 text-white text-sm font-bold px-5 py-2.5 rounded-lg transition-colors"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (status === 'set') {
    return (
      <>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-[#FAF8FF] dark:bg-white/5 px-5 py-3 mb-8">
          <p className="text-sm text-body">
            You're in <span className="font-semibold text-ink">{savedIndustry}</span>
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-deep"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
        {modal}
      </>
    );
  }

  if (status === 'dismissed') {
    // Not gone forever — a low-key, always-visible way back in, since the
    // user skipped the popup rather than the app deciding for them.
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 text-sm text-body hover:text-brand mb-8 -mt-2"
        >
          <Briefcase className="w-3.5 h-3.5" />
          Want tailored tips? Tell us your industry
        </button>
        {modal}
      </>
    );
  }

  // status === 'eligible' — modal opens itself on mount; nothing rendered
  // inline until the user has an opinion (set or dismissed).
  return modal;
}
