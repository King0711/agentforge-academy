import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Copy, Check, ChevronDown } from 'lucide-react';
import { getAgentsByDifficulty, getBuilderPagePath } from '../data/agents';
import { useProgress } from '../hooks/useProgress';
import { useAuth } from '../context/AuthContext';
import CourseSidebar from '../components/CourseSidebar';

// Single scrollable page (not a wizard) — this lives as item 0 in the same
// Builder 1 sequence CourseSidebar/BuilderSession already use, so it needs
// to feel like one course with one Previous/Next, not a separate app glued
// on the front. See CourseSidebar.jsx for how it's slotted into the list,
// and BuilderSession.jsx for the Previous link back to this page from
// Session 1. The in-page nav below (sticky, anchor-based) is the same
// pattern WhatsAppBotGuide.jsx uses for a long single-page guide.
const COHORT_WHATSAPP_LINK = 'https://chat.whatsapp.com/JoZQehOdBmGISFs77HKVSk';

const NAV_SECTIONS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'setup', label: 'Setup' },
  { id: 'curriculum', label: 'Curriculum' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'community', label: 'Community' },
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

function Section({ id, eyebrow, title, subtitle, children }) {
  return (
    <section id={id} className="py-10 border-b border-border-soft last:border-none scroll-mt-24">
      <div className="text-[10px] font-bold uppercase tracking-widest text-brand mb-2">{eyebrow}</div>
      <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink mb-2" style={{ textWrap: 'balance' }}>{title}</h2>
      {subtitle && <p className="text-body text-sm mb-6 leading-relaxed max-w-xl">{subtitle}</p>}
      {children}
    </section>
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

export default function Builder1Guide() {
  const { user } = useAuth();
  const progress = useProgress(user);
  const tierAgents = getAgentsByDifficulty('Builder 1');
  const firstAgent = tierAgents[0];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="grid lg:grid-cols-[260px_1fr] gap-8 items-start">
        <CourseSidebar tier="Builder 1" tierAgents={tierAgents} currentSlug={null} progress={progress} />

        <div className="min-w-0">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-body hover:text-brand transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </Link>

          <Callout type="success" icon="🚀">
            <strong>Builder 1 starts Saturday, August 15, 2026 at 5pm WAT.</strong> Use this guide to get fully set up so Day 1 is pure building, not setup.
            <a
              href={COHORT_WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="mt-2.5 flex w-fit items-center gap-1.5 text-sm font-bold text-green hover:underline"
            >
              💬 Join the Builder 1 WhatsApp group →
            </a>
          </Callout>

          {/* Sticky in-page nav — same pattern as WhatsAppBotGuide.jsx */}
          <div className="sticky top-20 z-20 -mx-1 px-1 bg-bg/95 backdrop-blur border-b border-border-soft mb-2">
            <div className="flex gap-4 overflow-x-auto py-2.5">
              {NAV_SECTIONS.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="text-[12.5px] font-semibold text-body hover:text-brand whitespace-nowrap transition-colors">
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          <Section id="welcome" eyebrow="Welcome" title="Welcome to Builder 1 — you're in.">
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
              Anyone who wants to build AI agents — not just talk about them. You don't need a coding background. You need curiosity, a willingness to try things, and the tools listed below.
            </Faq>
            <Faq q="What if I miss a session?">
              Each session is recorded and added to your dashboard after it airs. You can also work through the self-paced session guides at any time with your Builder 1 access.
            </Faq>
          </Section>

          <Section id="requirements" eyebrow="Requirements" title="What you need before Saturday" subtitle="These are the only things required to participate fully in Builder 1. Get them sorted this week.">
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
                desc="Session reminders and community discussion happen on WhatsApp. Join the cohort group now so you don't miss anything."
                link={COHORT_WHATSAPP_LINK} linkLabel="→ Join the Builder 1 WhatsApp group" />
            </Card>
            <Callout type="info" icon="💡">
              <strong>First month tip:</strong> Start your Claude Pro subscription this week so it's fully active on Saturday — new accounts can have rate limits on their first day.
            </Callout>
          </Section>

          <Section id="setup" eyebrow="Setup" title="Get Claude ready before Saturday" subtitle="Follow these steps to set up your Claude account so you can build from Day 1 without interruption.">
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
              The sessions are built around Claude, so Claude works best. That said, you can use ChatGPT Plus/Pro, Gemini Pro, or Microsoft Copilot as alternatives — the core concepts still apply, but some prompts and techniques are Claude-specific and may need adapting.
            </Faq>
            <Faq q="Is $20/month in dollars or naira?">
              US dollars — approximately ₦27,800/month at current rates. Use a dollar-capable card (GTB, Zenith, Access) or a virtual dollar card (Chipper, Grey, Barter). Virtual dollar cards take about 10 minutes to set up.
            </Faq>
          </Section>

          <Section id="curriculum" eyebrow="Curriculum" title="What you'll build in Builder 1" subtitle="13 sessions, all hands-on. Each one produces something you can actually use or show — not just notes.">
            {MODULE_SESSIONS.map((mod) => (
              <Card key={mod.title} title={mod.title}>
                <ul className="list-none">
                  {mod.items.map((item) => <CheckItem key={item}>{item}</CheckItem>)}
                </ul>
              </Card>
            ))}
          </Section>

          <Section id="schedule" eyebrow="Schedule" title="Session schedule & how it works" subtitle="Builder 1 runs as a live cohort with sessions every week. Here's the rhythm so you can plan your time.">
            <Callout type="success" icon="📅">
              <strong>First live session: Saturday, August 15, 2026 at 5pm WAT.</strong> Join link shared on WhatsApp. Block 2 hours in your calendar now.
            </Callout>
            <Card title="Weekly Rhythm">
              <div className="space-y-2.5">
                <SchedRow n="1" title="Saturday — Live Session, 5pm WAT" badge="Live"
                  desc="1.5–2 hrs with Samuel and the cohort. Hands-on building, Q&A, and peer review." />
                <SchedRow n="2" title="Sun–Fri — Self-Paced Guides" badge="Self-paced"
                  desc="Written session guides unlock after each live class. Go deeper, experiment, apply what you built." />
                <SchedRow n="3" title="Ongoing — Community Feedback" badge="Community"
                  desc="Share your agents in the WhatsApp group. Get feedback from the cohort and the team." />
              </div>
            </Card>
            <Faq q="What time do live sessions run?">
              Every Saturday at 5pm WAT. The join link is shared in the WhatsApp group before each class.
            </Faq>
            <Faq q="How long does my Builder 1 access last?">
              6 months from your enrollment date — enough time to complete the cohort and revisit any session you want to go deeper on.
            </Faq>
          </Section>

          <Section id="community" eyebrow="Community" title="Support, community & next steps" subtitle="You're not building alone. Here's how to stay connected and get help when you need it.">
            <Card title="How to get help">
              <ReqRow icon="💬" title="WhatsApp Community"
                desc="Primary space for questions, updates, and sharing what you build."
                link={COHORT_WHATSAPP_LINK} linkLabel="→ Join the Builder 1 WhatsApp group" />
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
                <CheckItem>Tested Claude with the prompt from the Setup section — it responded well</CheckItem>
                <CheckItem>Can log in to the Social Dev Technologies dashboard</CheckItem>
                <CheckItem>
                  Joined the{' '}
                  <a
                    href={COHORT_WHATSAPP_LINK}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-brand font-bold hover:underline"
                  >
                    WhatsApp community group
                  </a>
                </CheckItem>
                <CheckItem>Saturday, August 15 at 5pm WAT blocked in my calendar</CheckItem>
              </ul>
            </Card>
            <div className="flex items-center gap-3 bg-green/10 border border-green/30 rounded-2xl px-5 py-4 mt-2 font-bold text-green text-base">
              🎉 You're all set — see you Saturday, August 15 at 5pm WAT!
            </div>

            <div className="mt-5 bg-[#F8F6FF] dark:bg-[#181818] border border-brand/25 rounded-2xl p-5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-brand mb-2">Session 1 Guide</div>
              <div className="font-display font-bold text-base text-ink mb-1.5">Ready to start building?</div>
              <p className="text-sm text-body leading-relaxed mb-4">
                Work through Session 1 at your own pace — build your portfolio, extract design DNA, create a reusable design skill, and publish live.
              </p>
              <Link
                to="/session/build-real-product"
                className="inline-flex items-center gap-2 bg-brand hover:bg-brand-deep text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors shadow-[0_6px_16px_rgba(124,58,237,.35)]"
              >
                Build a real product, extract design DNA, build a reusable design skill and publish live →
              </Link>
            </div>
          </Section>

          {/* Next — straight into the real first session, same mechanism
              BuilderSession.jsx uses for every other Previous/Next hop. */}
          {firstAgent && (
            <div className="flex justify-end pt-6">
              <Link
                to={getBuilderPagePath(firstAgent)}
                className="flex items-center gap-2 bg-brand hover:bg-brand-deep text-white rounded-xl pl-4 pr-2.5 py-2.5 transition-colors"
              >
                <span className="text-right">
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-white/70">Start</span>
                  <span className="block text-sm font-bold">{firstAgent.title}</span>
                </span>
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
