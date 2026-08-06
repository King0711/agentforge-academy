import { useEffect, useState } from 'react';
import { Briefcase, Pencil, X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { industries } from '../data/industries';

export default function ProfileInfoPrompt() {
  const { user } = useAuth();
  const [status, setStatus] = useState('loading'); // loading | eligible | dismissed | set | ineligible
  const [open, setOpen] = useState(false);
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
          setStatus('eligible');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const dismiss = () => {
    if (user) localStorage.setItem(`sdt_profile_prompt_dismissed_${user.id}`, 'true');
    setStatus('dismissed');
  };

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
    setOpen(false);
  };

  if (status === 'loading' || status === 'ineligible' || status === 'dismissed') return null;

  if (!open) {
    if (status === 'set') {
      return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-[#FAF8FF] dark:bg-white/5 px-5 py-3 mb-8">
          <p className="text-sm text-body">
            You're in <span className="font-semibold text-ink">{savedIndustry}</span>
          </p>
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand-deep"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
      );
    }

    return (
      <div className="rounded-xl border-[1.5px] border-brand/25 bg-[#F3EBFF] dark:bg-brand/10 p-5 mb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Briefcase className="w-5 h-5 text-brand flex-shrink-0" />
            <p className="text-sm font-semibold text-ink">
              Tell us your industry so we can tailor tips and emails to you
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setOpen(true)}
              className="bg-brand hover:bg-brand-deep text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
            >
              Add my info
            </button>
            <button onClick={dismiss} className="text-sm font-semibold text-gray-400 hover:text-body px-2">
              Not now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-[1.5px] border-brand/25 bg-[#F3EBFF] dark:bg-brand/10 p-5 mb-8">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-ink">A little about you</p>
          <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-body">
            <X className="w-4 h-4" />
          </button>
        </div>

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

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 bg-brand hover:bg-brand-deep disabled:opacity-60 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Save
        </button>
      </form>
    </div>
  );
}
