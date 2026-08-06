import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { industries } from '../data/industries';

const ProfileInfoContext = createContext(null);

/**
 * Fetches whether the current user has an industry on file and drives the
 * "ask on login" popup — lifted here (rather than living inside a single
 * component tied to one page) so the popup can open regardless of which
 * page the user lands on first, while the dashboard's slim summary/
 * reminder row can share the same state and reopen the same modal.
 */
export function ProfileInfoProvider({ children }) {
  const { user } = useAuth();
  const [status, setStatus] = useState('loading'); // loading | eligible | dismissed | set | ineligible
  const [modalOpen, setModalOpen] = useState(false);
  const [savedIndustry, setSavedIndustry] = useState('');
  const [name, setName] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [customIndustry, setCustomIndustry] = useState('');

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
          // First authenticated page load this session with no industry on
          // file, anywhere in the app — open the popup automatically.
          setStatus('eligible');
          setModalOpen(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Easy to close by design — a user forced into filling this in just to
  // escape a modal tends to type junk to get past it, defeating the point.
  const closeModal = ({ skip } = {}) => {
    setModalOpen(false);
    if (skip && status !== 'set') {
      if (user) localStorage.setItem(`sdt_profile_prompt_dismissed_${user.id}`, 'true');
      setStatus('dismissed');
    }
  };

  const markSet = (industry) => {
    setSavedIndustry(industry);
    setStatus('set');
    setModalOpen(false);
  };

  return (
    <ProfileInfoContext.Provider
      value={{
        user,
        status,
        modalOpen,
        setModalOpen,
        closeModal,
        markSet,
        savedIndustry,
        name,
        setName,
        selectedIndustry,
        setSelectedIndustry,
        customIndustry,
        setCustomIndustry,
      }}
    >
      {children}
    </ProfileInfoContext.Provider>
  );
}

export function useProfileInfo() {
  return useContext(ProfileInfoContext);
}
