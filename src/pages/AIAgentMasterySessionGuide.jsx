import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { usePro } from '../hooks/usePro';
import { usePageSeo } from '../hooks/usePageSeo';

// Class walkthrough for AI Agent Mastery students (build an AI chief of staff).
// Same stepper/copy-button mechanics as DailyNewsSessionGuide.jsx; the CSS is
// scoped under #cos-guide so the two guides can't bleed into each other.

// Wired from the effect below as a plain function — NOT injected as an inline
// <script>: production's CSP (vercel.json) has script-src 'self' with no
// 'unsafe-inline', so an injected inline script is blocked and the stepper dies.
function initGuide() {
  const ROOT = document.getElementById('cos-guide');
  if (!ROOT) return () => {};
  const ORDER = ['intro', 'install', 'brain', 'hands', 'telegram', 'board', 'squad', 'apps', 'autopilot', 'finish'];
  const STORAGE_KEY = 'ai-chief-of-staff-guide-v1';
  const state = { current: 0, completed: {} };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (p && p.completed) state.completed = p.completed;
      }
    } catch { /* storage unavailable (private mode) — progress just isn't remembered */ }
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: state.completed })); } catch { /* see loadState */ }
  }

  function render() {
    ORDER.forEach((id, i) => {
      const sec = ROOT.querySelector('.step[data-step="' + id + '"]');
      if (sec) sec.hidden = i !== state.current;
      const navItem = ROOT.querySelector('.step-nav-item[data-target="' + id + '"]');
      if (navItem) {
        navItem.classList.toggle('active', i === state.current);
        navItem.classList.toggle('done', !!state.completed[id] && i !== state.current);
        const dot = navItem.querySelector('.nav-dot');
        if (dot) dot.textContent = state.completed[id] && i !== state.current ? '✓' : String(i + 1);
      }
    });
    const pct = Math.round((state.current / (ORDER.length - 1)) * 100);
    const fill = document.getElementById('cos-progressFill');
    if (fill) fill.style.width = pct + '%';
    const isLast = state.current === ORDER.length - 1;
    const counter = document.getElementById('cos-stepCounter');
    if (counter) counter.textContent = isLast ? 'Done · ' + ORDER.length + '/' + ORDER.length : state.current + 1 + '/' + ORDER.length;
    ROOT.querySelectorAll('[data-nav="next"]').forEach((b) => { b.textContent = isLast ? 'Complete ✓' : 'Next →'; });
    ROOT.querySelectorAll('[data-nav="prev"]').forEach((b) => { b.disabled = state.current === 0; });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function goTo(i) {
    if (i < 0 || i >= ORDER.length) return;
    if (i > state.current) {
      state.completed[ORDER[state.current]] = true;
      saveState();
    }
    state.current = i;
    render();
  }

  function legacyCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function copyFrom(btn) {
    const block = btn.closest('.prompt-block');
    const codeEl = block ? block.querySelector('code') : null;
    const text = codeEl ? codeEl.textContent : '';
    const original = btn.textContent;
    const flash = (msg, ok) => {
      btn.textContent = msg;
      btn.classList.toggle('copied', !!ok);
      setTimeout(() => { btn.textContent = original; btn.classList.remove('copied'); }, 1600);
    };
    if (legacyCopy(text)) flash('Copied!', true);
    else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => flash('Copied!', true), () => flash('Select & Ctrl+C', false));
    } else flash('Select & Ctrl+C', false);
  }

  // One delegated listener instead of one per element: the markup is static,
  // so this covers every button, nav item, accordion and copy button.
  function onClick(e) {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const nav = t.closest('[data-nav]');
    if (nav && ROOT.contains(nav)) {
      if (!nav.disabled) goTo(state.current + (nav.getAttribute('data-nav') === 'next' ? 1 : -1));
      return;
    }
    const item = t.closest('.step-nav-item');
    if (item && ROOT.contains(item)) {
      goTo(ORDER.indexOf(item.getAttribute('data-target')));
      return;
    }
    const trig = t.closest('.accordion-trigger');
    if (trig && ROOT.contains(trig)) {
      trig.closest('.accordion').classList.toggle('open');
      return;
    }
    const copy = t.closest('.copy-btn');
    if (copy && ROOT.contains(copy)) copyFrom(copy);
  }

  function onChange(e) {
    const cb = e.target;
    if (!(cb instanceof HTMLInputElement) || cb.type !== 'checkbox' || !cb.dataset.key) return;
    try { localStorage.setItem(STORAGE_KEY + ':chk:' + cb.dataset.key, cb.checked ? '1' : '0'); } catch { /* see loadState */ }
  }

  ROOT.querySelectorAll('.checklist input[type="checkbox"][data-key]').forEach((cb) => {
    try { cb.checked = localStorage.getItem(STORAGE_KEY + ':chk:' + cb.dataset.key) === '1'; } catch { /* see loadState */ }
  });

  ROOT.addEventListener('click', onClick);
  ROOT.addEventListener('change', onChange);
  loadState();
  render();
  return () => {
    ROOT.removeEventListener('click', onClick);
    ROOT.removeEventListener('change', onChange);
  };
}


// The guide's text is not in this bundle. It lives in public.aimastery_guide
// (supabase/aimastery-guide-gate.sql) and comes back from get_aimastery_guide()
// only for admins and for students whose Day 2 recording is in — so a person
// who opens this URL without being unlocked gets the lock screen and nothing
// else, however they got the link.
function GuideContent({ css, html }) {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Lexend:wght@500;600;700&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const disposeGuide = initGuide();

    return () => {
      disposeGuide();
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, [css]);

  return (
    <div id="cos-guide">
      <Link to="/ai-agent-mastery/course" className="back-link">← Your classes</Link>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

function GateMessage({ icon: Icon, title, children, action }) {
  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
      <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
        <Icon className="w-8 h-8 text-link mx-auto mb-3" />
        <p className="text-ink font-bold">{title}</p>
        <p className="text-sm text-body mt-1 mb-4">{children}</p>
        {action}
      </div>
    </div>
  );
}

const gateButtonClass = 'inline-flex items-center gap-2 bg-brand hover:bg-brand-deep text-white font-bold px-5 py-2.5 rounded-xl transition-colors';

export default function AIAgentMasterySessionGuide() {
  const { user, loading: authLoading } = useAuth();
  const { hasAiMastery, isAdmin, proLoading } = usePro();
  // Tagged with the user it was fetched for, so signing in as someone else
  // without a remount can't show the previous person's result.
  const [result, setResult] = useState({ uid: null, status: 'loading', guide: null });

  // Class material for enrolled students: keep it out of search results and
  // off the sitemap/prerender list (the AI Agent Mastery sales page doesn't
  // name the underlying framework either — this page does, so it isn't
  // something to rank for).
  usePageSeo({
    title: 'Build Your AI Chief of Staff | AI Agent Mastery Walkthrough | Social Dev Technologies',
    description: 'The step-by-step class walkthrough for AI Agent Mastery students.',
  });

  useEffect(() => {
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
    return () => {
      document.head.removeChild(robots);
    };
  }, []);

  useEffect(() => {
    if (authLoading || !user) return undefined;
    let cancelled = false;
    supabase.rpc('get_aimastery_guide').then(({ data, error }) => {
      if (cancelled) return;
      if (error) setResult({ uid: user.id, status: 'error', guide: null });
      else if (data && data.length > 0) setResult({ uid: user.id, status: 'ready', guide: data[0] });
      else setResult({ uid: user.id, status: 'locked', guide: null });
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  if (authLoading) return <GateLoading />;

  if (!user) {
    return (
      <GateMessage
        icon={Lock}
        title="Sign in to open your class guide"
        action={<Link to="/welcome" className={gateButtonClass}>Sign in</Link>}
      >
        This walkthrough is for AI Agent Mastery students.
      </GateMessage>
    );
  }

  const current = result.uid === user.id ? result : null;
  if (!current || proLoading) return <GateLoading />;

  if (current.status === 'ready') return <GuideContent css={current.guide.css} html={current.guide.html} />;

  if (current.status === 'error') {
    return (
      <GateMessage icon={Lock} title="Couldn't load the guide">
        Check your connection and refresh the page.
      </GateMessage>
    );
  }

  if (hasAiMastery || isAdmin) {
    return (
      <GateMessage
        icon={Lock}
        title="Your class guide isn't open yet"
        action={<Link to="/ai-agent-mastery/course" className={gateButtonClass}>Back to your classes</Link>}
      >
        It opens as soon as the Day 2 class recording is posted.
      </GateMessage>
    );
  }

  return (
    <GateMessage
      icon={Lock}
      title="This guide is for AI Agent Mastery students"
      action={<Link to="/ai-agent-mastery#pricing" className={gateButtonClass}>See the offer</Link>}
    >
      Join the cohort to get the class walkthrough.
    </GateMessage>
  );
}

function GateLoading() {
  return (
    <div className="flex justify-center py-24">
      <Loader2 className="w-6 h-6 animate-spin text-link" />
    </div>
  );
}
