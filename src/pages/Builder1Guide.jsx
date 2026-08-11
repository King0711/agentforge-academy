import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Copy, Check, ChevronDown } from 'lucide-react';

const STEPS = [
  { eyebrow: 'Welcome', label: 'Welcome to Builder 1' },
  { eyebrow: 'Requirements', label: 'What You Need' },
  { eyebrow: 'Setup', label: 'Get Claude Ready' },
  { eyebrow: 'Curriculum', label: "What You'll Build" },
  { eyebrow: 'Schedule', label: 'Session Schedule' },
  { eyebrow: 'Community', label: 'Support & Community' },
];

function Callout({ type = 'info', icon, children }) {
  const styles = {
    info:    'bg-brand/10 border-l-4 border-brand',
    warn:    'bg-amber/10 border-l-4 border-amber',
    success: 'bg-green/10 border-l-4 border-green',
  };
  return (
    <div className={`flex gap-3 rounded-xl p-4 mb-4 ${styles[type]}`}>
      <span className="text-xl leading-snug flex-shrink-0">{icon}</span>
      <div className="text-sm text-ink leading-relaxed">{children}</div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-bg border border-border rounded-2xl p-5 mb-4">
      {title && (
        <div className="text-[10px] font-bold tracking-widest uppercase text-body mb-3">{title}</div>
      )}
      {children}
    </div>
  );
}

function Faq({ q, children }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="border border-border rounded-xl mb-2 overflow-hidden" open={open}>
      <summary
        className="flex items-center justify-between gap-2 px-4 py-3 font-semibold text-sm cursor-pointer text-ink list-none select-none"
        onClick={(e) => { e.preventDefault(); setOpen(!open); }}
      >
        {q}
        <ChevronDown className={`w-4 h-4 text-body flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </summary>
      {open && <div className="px-4 pb-4 text-sm text-body leading-relaxed">{children}</div>}
    </details>
  );
}

function Snippet({ children }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(children.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="relative bg-ink dark:bg-[#0A090F] rounded-xl p-4 my-4 font-mono text-[13px] text-[#E7E5E4] leading-relaxed whitespace-pre-wrap overflow-x-auto">
      <button
        onClick={copy}
        className="absolute top-3 right-3 flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white/80 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors"
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      {children}
    </div>
  );
}

function CheckItem({ children }) {
  const [checked, setChecked] = useState(false);
  return (
    <li
      className={`flex items-start gap-3 py-3 border-b border-border-soft last:border-none cursor-pointer select-none transition-opacity ${checked ? 'opacity-60' : ''}`}
      onClick={() => setChecked(!checked)}
    >
      <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${checked ? 'bg-green border-green' : 'border-border'}`}>
        {checked && <Check className="w-3 h-3 text-white" />}
      </div>
      <span className={`text-sm leading-relaxed ${checked ? 'line-through text-body' : 'text-ink'}`}>{children}</span>
    </li>
  );
}

function StepList({ items }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm text-ink leading-relaxed">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-ink text-bg flex items-center justify-center text-[11px] font-bold mt-0.5">{i + 1}</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function ReqRow({ icon, title, cost, desc, link, linkLabel }) {
  return (
    <div className="flex gap-3 py-4 border-b border-border-soft last:border-none">
      <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center text-lg flex-shrink-0">{icon}</div>
      <div>
        <div className="font-bold text-sm text-ink mb-0.5">
          {title}{cost && <span className="ml-1.5 text-amber font-semibold">{cost}</span>}
        </div>
        <div className="text-xs text-body leading-relaxed mb-1">{desc}</div>
        {link && <a href={link} target="_blank" rel="noreferrer" className="text-xs font-bold text-brand hover:underline">{linkLabel}</a>}
      </div>
    </div>
  );
}

function SchedRow({ n, title, desc, badge }) {
  const badgeStyle = badge === 'Live'
    ? 'bg-amber/15 text-amber'
    : 'bg-brand/10 text-brand';
  return (
    <div className="flex items-start gap-3 bg-bg border border-border rounded-xl p-3.5">
      <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{n}</div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-ink mb-0.5">{title}</div>
        <div className="text-xs text-body leading-relaxed">{desc}</div>
      </div>
      <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-1 rounded-md flex-shrink-0 self-start ${badgeStyle}`}>{badge}</span>
    </div>
  );
}

const MODULE_SESSIONS = [
  {
    title: 'Module 1 — Foundations (Sessions 1–4)',
    items: [
      'Session 1 — What is an AI agent? Build your first one in 20 minutes',
      'Session 2 — Prompting for agents: giving Claude a role and purpose',
      'Session 3 — Memory and context: making your agent remember',
      'Session 4 — Your first real agent: a customer support bot from scratch',
    ],
  },
  {
    title: 'Module 2 — Building with Tools (Sessions 5–9)',
    items: [
      'Session 5 — Giving agents tools: search, calculation, and external data',
      'Session 6 — Building a research agent that reads and summarises',
      'Session 7 — Structured outputs: agents that produce consistent, usable data',
      'Session 8 — Multi-step agents: chaining tasks together',
      'Session 9 — Mid-point project: build a business automation agent',
    ],
  },
  {
    title: 'Module 3 — Portfolio Projects (Sessions 10–13)',
    items: [
      'Session 10 — Agent for content: writing, editing, and repurposing',
      'Session 11 — Agent for operations: scheduling, summaries, reports',
      'Session 12 — Deploy your agent: share it and collect real feedback',
      'Session 13 — Final showcase: present your portfolio agent',
    ],
  },
];

const HEADINGS = [
  "Welcome to Builder 1 — you're in.",
  'What you need before Saturday',
  'Get Claude ready before Saturday',
  "What you'll build in Builder 1",
  'Session schedule & how it works',
  'Support, community & next steps',
];

const SUBTITLES = [
  'This guide walks you through everything you need before Saturday, August 16, and what to expect once we begin building.',
  'These are the only things required to participate fully in Builder 1. Get them sorted this week.',
  'Follow these steps to set up your Claude account so you can build from Day 1 without interruption.',
  '13 sessions, all hands-on. Each one produces something you can actually use or show — not just notes.',
  "Builder 1 runs as a live cohort with sessions every week. Here's the rhythm so you can plan your time.",
  "You're not building alone. Here's how to stay connected and get help when you need it.",
];

export default function Builder1Guide() {
  const [current, setCurrent] = useState(0);
  const [completed, setCompleted] = useState(new Set());

  const goTo = (n) => {
    if (n === current) return;
    setCompleted(prev => {
      const next = new Set(prev);
      if (n > current) next.add(current);
      return next;
    });
    setCurrent(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const next = () => { if (current < STEPS.length - 1) goTo(current + 1); };
  const pct = Math.round(((current + 1) / STEPS.length) * 100);

  const panels = [
    // 0 — Welcome
    <>
      <Callout type="success" icon="🚀">
        <strong>Builder 1 starts Saturday, August 16, 2026.</strong> Use this guide to get fully set up so Day 1 is pure building, not setup.
      </Callout>
      <Card title="What is Builder 1?">
        <p className="text-sm text-body leading-relaxed mb-4">
          Builder 1 is the first tier of Social Dev Technologies' AI agent training. Hands-on from session one — no lengthy theory, no slide decks. You build real agents with Claude, session by session, and ship something portfolio-worthy by the end.
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {[['13','Sessions'],['Live','Instructor-led'],['Real','Agent projects'],['0','Prerequisites']].map(([n, l]) => (
            <div key={l} className="border border-border rounded-xl p-3.5">
              <div className="text-xl font-extrabold text-brand font-display">{n}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-body mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </Card>
      <Faq q="Who is this for?">
        Anyone who wants to build AI agents — not just talk about them. You don't need a coding background. You need curiosity, a willingness to try things, and the tools listed in Step 2.
      </Faq>
      <Faq q="What if I miss a session?">
        Each session is recorded and added to your dashboard after it airs. You can also work through the self-paced session guides at any time with your Builder 1 access.
      </Faq>
    </>,

    // 1 — Requirements
    <>
      <Callout type="warn" icon="⚠️">
        <strong>Claude subscription is mandatory.</strong> You cannot build agents without direct access to Claude. This is not optional and cannot be shared between participants.
      </Callout>
      <Card>
        <ReqRow icon="🤖" title="Claude Pro Subscription" cost="~$20/month"
          desc="An active Claude.ai Pro account. Without it, you can't run prompts, test agents, or follow along in sessions."
          link="https://claude.ai" linkLabel="→ Subscribe at claude.ai" />
        <ReqRow icon="💻" title="A computer with internet access"
          desc="Any modern laptop or desktop — Windows, Mac, or Linux. Fast enough to browse and type in Claude." />
        <ReqRow icon="🔑" title="Your Social Dev Technologies account"
          desc="You already have Builder 1 access. Make sure you can log in and see your sessions before Saturday."
          link="/dashboard" linkLabel="→ Check your dashboard" />
        <ReqRow icon="📱" title="WhatsApp (for class updates)"
          desc="Session reminders and community discussion happen on WhatsApp. Details in Step 6." />
      </Card>
      <Callout type="info" icon="💡">
        <strong>First month tip:</strong> Start your Claude Pro subscription this week so it's fully active on Saturday — new accounts can have rate limits on their first day.
      </Callout>
    </>,

    // 2 — Setup
    <>
      <Card title="Subscribe to Claude Pro">
        <StepList items={[
          <>Go to <a href="https://claude.ai" target="_blank" rel="noreferrer" className="text-brand font-semibold">claude.ai</a> in your browser</>,
          <>Click <strong>"Sign up"</strong> and create a free account (or log in if you already have one)</>,
          <>Click your avatar → <strong>"Upgrade to Pro"</strong></>,
          <>Enter your payment details — <strong>$20/month</strong>, cancel any time</>,
          <>You'll see a <strong>purple "Pro" badge</strong> next to your name when it's active</>,
        ]} />
      </Card>
      <Card title="Test that Claude is working">
        <p className="text-sm text-body mb-2">Open a new conversation and send this prompt — if Claude responds clearly and at length, you're all set:</p>
        <Snippet>{`You are an AI assistant helping me learn to build AI agents. In 3 sentences, explain what an AI agent is and give me one real-world example of how someone in Africa could use one to solve a business problem.`}</Snippet>
      </Card>
      <Faq q="What if I already have Claude but on the free plan?">
        The free plan has usage limits that will interrupt your work mid-session. Upgrade to Pro before Saturday — it takes 2 minutes.
      </Faq>
      <Faq q="Can I use ChatGPT or Gemini instead?">
        Builder 1 is designed around Claude's specific strengths. The prompts, techniques, and exercises are Claude-specific. Other tools won't work as substitutes.
      </Faq>
      <Faq q="Is $20/month in dollars or naira?">
        US dollars — approximately ₦32,000–35,000/month at current rates. Use a dollar-capable card (GTB, Zenith, Access) or a virtual dollar card (Chipper, Grey, Barter). Virtual dollar cards take about 10 minutes to set up.
      </Faq>
    </>,

    // 3 — Curriculum
    <>
      {MODULE_SESSIONS.map((mod) => (
        <Card key={mod.title} title={mod.title}>
          <ul className="list-none">
            {mod.items.map((item) => <CheckItem key={item}>{item}</CheckItem>)}
          </ul>
        </Card>
      ))}
    </>,

    // 4 — Schedule
    <>
      <Callout type="success" icon="📅">
        <strong>First live session: Saturday, August 16, 2026.</strong> Time and link shared on WhatsApp. Block 2 hours in your calendar now.
      </Callout>
      <Card title="Weekly Rhythm">
        <div className="space-y-2.5">
          <SchedRow n="1" title="Saturday — Live Session" badge="Live"
            desc="1.5–2 hrs with Samuel and the cohort. Hands-on building, Q&A, and peer review." />
          <SchedRow n="2" title="Sun–Fri — Self-Paced Guides" badge="Self-paced"
            desc="Written session guides unlock after each live class. Go deeper, experiment, apply what you built." />
          <SchedRow n="3" title="Ongoing — Community Feedback" badge="Community"
            desc="Share your agents in the WhatsApp group. Get feedback from the cohort and the team." />
        </div>
      </Card>
      <Faq q="What time do live sessions run?">
        Session times are shared on WhatsApp 48 hours before each class — typically morning or afternoon WAT.
      </Faq>
      <Faq q="How long does my Builder 1 access last?">
        6 months from your enrollment date — enough time to complete the cohort and revisit any session you want to go deeper on.
      </Faq>
    </>,

    // 5 — Community
    <>
      <Card title="How to get help">
        <ReqRow icon="💬" title="WhatsApp Community"
          desc="Primary space for questions, updates, and sharing what you build."
          link="https://wa.me/2349066006963" linkLabel="→ WhatsApp: +234 906 600 6963" />
        <ReqRow icon="📧" title="Email"
          desc="For account issues, billing, or anything that needs a longer conversation."
          link="mailto:support@socialdevtechnologies.com" linkLabel="→ support@socialdevtechnologies.com" />
        <ReqRow icon="🖥️" title="Your Dashboard"
          desc="Sessions, guides, XP, and certificates all live here. Bookmark it."
          link="/dashboard" linkLabel="→ Go to your dashboard" />
      </Card>
      <Card title="Pre-session checklist — tick these off before Saturday">
        <ul className="list-none">
          <CheckItem>Claude Pro subscription is active at claude.ai</CheckItem>
          <CheckItem>Tested Claude with the prompt from Step 3 — it responded well</CheckItem>
          <CheckItem>Can log in to the Social Dev Technologies dashboard</CheckItem>
          <CheckItem>Joined the WhatsApp community group</CheckItem>
          <CheckItem>Saturday, August 16 blocked in my calendar</CheckItem>
        </ul>
      </Card>
      <div className="flex items-center gap-3 bg-green/10 border border-green/30 rounded-2xl px-5 py-4 mt-2 font-bold text-green text-base">
        🎉 You're all set — see you Saturday, August 16!
      </div>
    </>,
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* Top progress bar */}
      <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur border-b border-border flex items-center gap-3 px-4 sm:px-6 h-12">
        <Link to="/dashboard" className="text-xs text-body hover:text-ink transition-colors flex-shrink-0">← Dashboard</Link>
        <div className="flex-1 h-1.5 bg-border-soft rounded-full overflow-hidden">
          <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-body flex-shrink-0 font-medium tabular-nums">Step {current + 1} of {STEPS.length}</span>
        <button
          onClick={next}
          disabled={current === STEPS.length - 1}
          className="flex-shrink-0 text-xs font-bold bg-brand hover:bg-brand-deep disabled:opacity-40 disabled:cursor-not-allowed text-white px-3.5 py-1.5 rounded-lg transition-colors"
        >
          {current === STEPS.length - 1 ? 'Complete ✓' : 'Next →'}
        </button>
      </div>

      <div className="flex max-w-5xl mx-auto">
        {/* Sidebar */}
        <aside className="hidden md:block w-60 flex-shrink-0 sticky top-12 h-[calc(100vh-3rem)] overflow-y-auto border-r border-border p-5">
          <div className="font-display font-extrabold text-base text-ink mb-0.5">Builder 1</div>
          <div className="text-xs text-body mb-5">Getting Started Guide</div>
          <nav className="space-y-0.5">
            {STEPS.map((step, i) => {
              const isDone = completed.has(i);
              const isActive = current === i;
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${isActive ? 'bg-brand/10' : 'hover:bg-border-soft'}`}
                >
                  <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[11px] font-bold flex-shrink-0 transition-all
                    ${isDone ? 'bg-green border-green text-white' : isActive ? 'border-brand text-brand' : 'border-border text-body'}`}>
                    {isDone ? '✓' : i + 1}
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-body leading-none mb-0.5">{step.eyebrow}</div>
                    <div className={`text-[13px] leading-snug ${isActive ? 'font-bold text-ink' : 'font-medium text-body'}`}>{step.label}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 px-5 sm:px-10 py-8 max-w-2xl">
          <div className="text-[10px] font-bold uppercase tracking-widest text-brand mb-2">
            {STEPS[current].eyebrow} · Step {current + 1} of {STEPS.length}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink mb-2" style={{ textWrap: 'balance' }}>
            {HEADINGS[current]}
          </h1>
          <p className="text-body text-sm mb-6 leading-relaxed">{SUBTITLES[current]}</p>

          {panels[current]}

          {/* Bottom nav */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border-soft">
            <button
              onClick={() => goTo(current - 1)}
              disabled={current === 0}
              className="text-sm font-semibold text-body hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={next}
              disabled={current === STEPS.length - 1}
              className="flex items-center gap-1.5 text-sm font-bold bg-brand hover:bg-brand-deep disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl transition-colors"
            >
              {current === STEPS.length - 1 ? 'Complete ✓' : <>Next step <ChevronRight className="w-4 h-4" /></>}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
