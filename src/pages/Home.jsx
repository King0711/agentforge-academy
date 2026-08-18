import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code2, Bot, KeyRound, MessageCircle, Video, CalendarDays, PlayCircle, Send, CheckCheck } from 'lucide-react';
import AgentCard from '../components/AgentCard';
import YouTubeFacade from '../components/YouTubeFacade';
import TestimonialsSection from '../components/TestimonialsSection';
import { agents, getBuilder1Agents, groupAgentsByWeek, getAgentBySlug, getBuilderPagePath } from '../data/agents';
import { departments, isVisibleToPublic } from '../data/departments';
import { usePro } from '../hooks/usePro';
import { useTheme } from '../context/ThemeContext';
import { useCohortSchedule } from '../hooks/useCohortSchedule';
import { ANCHOR_PRICE, BUILDER_PRICE } from '../data/pricing';

// Returns a display string for a cohort start date, or null if it's unset or
// already in the past — same rule Pricing.jsx uses, duplicated rather than
// shared since the two pages' surrounding date logic differs slightly.
function formatCohortDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(`${dateStr}T00:00:00`);
  if (date < new Date(new Date().toDateString())) return null;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}

// Stylized recreation of the real live-session card (see
// src/pages/dashboard/LiveSessions.jsx), not a screenshot — avoids both the
// consent issue of a real Zoom capture and the staleness of a screenshot
// going out of date the next time that page's design changes.
function LiveClassMockup() {
  return (
    <div className="relative bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-[22px] p-5 shadow-[0_20px_44px_-24px_rgba(80,40,160,.5)]">
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose bg-[#FDEEF4] dark:bg-rose/10 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-rose animate-pulse" /> LIVE THIS WEEK
        </span>
        <CalendarDays className="w-4 h-4 text-gray-300" />
      </div>
      {[
        { title: 'Builder 1 — Week 1 walkthrough', tier: 'Builder 1' },
        { title: 'Builder 2 — Office hours', tier: 'Builder 2' },
      ].map((s) => (
        <div key={s.title} className="flex items-center gap-3 rounded-xl border border-border-soft px-3.5 py-3 mb-2.5 last:mb-0">
          <div className="w-9 h-9 rounded-lg bg-[#F3EBFF] dark:bg-brand/15 flex items-center justify-center flex-shrink-0">
            <Video className="w-4 h-4 text-brand" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-ink truncate">{s.title}</p>
            <p className="text-[11px] text-gray-500">{s.tier}</p>
          </div>
          <span className="flex-shrink-0 bg-brand text-white text-[11px] font-bold px-3 py-1.5 rounded-lg">Join</span>
        </div>
      ))}
      <div className="flex items-center gap-2 mt-3.5 pt-3.5 border-t border-border-soft text-xs text-body">
        <PlayCircle className="w-3.5 h-3.5 text-gray-400" /> Can't make it live? Every session is recorded.
      </div>
    </div>
  );
}

// Stylized WhatsApp-style chat mockup — generic initials in place of avatars
// and made-up (but realistic) support exchange, not real members' names,
// photos, or messages.
const CHAT_MESSAGES = [
  { who: 'A', color: '#7C3AED', text: 'Anyone else stuck on the Gmail agent OAuth step? 😩', mine: false },
  { who: 'D', color: '#16A34A', text: 'yep — check the scope you granted, easy to miss one', mine: false },
  { who: 'Me', color: '#F5D90A', text: 'that was it, thank you!! 🙏', mine: true },
];

function CommunityMockup() {
  return (
    <div className="relative bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-[22px] overflow-hidden shadow-[0_20px_44px_-24px_rgba(22,163,74,.35)]">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-[#075E54]">
        <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white">
          <MessageCircle className="w-4 h-4" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">Social Dev Builders</p>
          <p className="text-white/80 text-[11px] leading-tight">128 members</p>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2.5" style={{ background: '#E5DDD5' }}>
        {CHAT_MESSAGES.map((m, i) => (
          <div key={i} className={`flex items-end gap-2 ${m.mine ? 'flex-row-reverse' : ''}`}>
            {!m.mine && (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                style={{ background: m.color }}
              >
                {m.who}
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-xl px-3 py-2 text-[12.5px] leading-snug text-[#1F1F1F] ${
                m.mine ? 'bg-[#DCF8C6] rounded-br-sm' : 'bg-white rounded-bl-sm'
              }`}
            >
              {m.text}
              {m.mine && (
                <span className="inline-flex items-center gap-0.5 float-right mt-0.5 ml-1.5">
                  <CheckCheck className="w-3 h-3 text-[#4FC3F7]" />
                </span>
              )}
            </div>
          </div>
        ))}
        <div className="flex items-center gap-2 bg-white rounded-full px-3 py-2 mt-1">
          <span className="text-[12px] text-gray-500 flex-1">Message</span>
          <Send className="w-3.5 h-3.5 text-[#075E54]" />
        </div>
      </div>
    </div>
  );
}

const TECH_MARQUEE = ['PYTHON', 'CLAUDE API', 'GMAIL API', 'SLACK', 'SUPABASE', 'NOTION'];
const YOUTUBE_VIDEO_ID = 'MYcREKgdAV4';

// Advanced/World Class are admin-only — every public-facing count and grid
// on this marketing page is based on the public catalog only.
const publicAgents = agents.filter((a) => isVisibleToPublic(a.difficulty));

const HOW_IT_WORKS = [
  { num: 1, bg: '#7C3AED', fg: '#fff', title: 'Pick a session', text: `${publicAgents.length} guided builds across Builder 1 and Builder 2. Each has a time estimate and clear outcomes.` },
  { num: 2, bg: '#F5D90A', fg: '#1A1333', title: 'Paste into Claude', text: 'Every build ships ready-to-use prompts. No blank page — open Claude, paste, iterate. You\'ll need a paid Claude account (Claude Pro or higher) to complete the builds.' },
  { num: 3, bg: '#16A34A', fg: '#fff', title: 'Ship to portfolio', text: 'Each session ends with a write-up prompt: LinkedIn post, resume bullets, project blurb.' },
];

// Set expectations before checkout, not after — the Claude Pro line already
// existed buried in step 2's fine print; this puts it (and the two other
// things students actually get surprised by) somewhere a visitor deciding
// whether to buy will actually see it.
const BEFORE_YOU_START = [
  {
    icon: Code2,
    title: 'No prior coding experience required',
    text: 'Every build ships copy-paste-ready prompts — you\'re directing Claude, not writing code from scratch. Basic comfort with a browser and copy-paste is all you need to start.',
  },
  {
    icon: Bot,
    title: 'A paid Claude account',
    text: 'You\'ll need Claude Pro or higher to complete the builds — Claude\'s free tier runs out of usage mid-session. That\'s billed separately by Anthropic, on top of your one-time course payment.',
  },
  {
    icon: KeyRound,
    title: 'A few Builder 2 sessions need their own API key',
    text: 'A handful of advanced builds connect to a third-party service — Pinecone, HubSpot, DataForSEO — to do their job. Most have a free tier that\'s enough to complete the session; each build tells you exactly what it needs before you start.',
  },
];

// Short theme labels for each Builder 1 week — the underlying data
// (src/data/agentsBeginner.js) only stores week number + isMainProject, not
// a display label, so the label lives here alongside the one place it's
// rendered.
const WEEK_THEMES = {
  1: 'Info & briefing agents',
  2: 'Document processing',
  3: 'Inbound triage & lead handling',
  4: 'Customer-facing messaging',
};
const builder1Weeks = groupAgentsByWeek(getBuilder1Agents());

// Outcome-framed showcase: "what you'll actually walk away having built"
// rather than a topic list — each entry names one or two real catalog
// agents (by slug, so titles/emoji always stay in sync with the data) under
// a punchier umbrella. Spans both tracks, unlike the week-by-week preview
// above which is Builder 1 only.
const FLAGSHIP_BUILDS = [
  {
    label: 'A personal inbox agent',
    text: 'Triages your inbox and drafts replies before you even open it — start the day at zero, not 200 unread.',
    slugs: ['gmail-ai-triage-agent'],
  },
  {
    label: 'A daily briefing agent',
    text: 'Turns raw meeting notes and industry noise into a clean summary waiting for you every morning.',
    slugs: ['daily-news-industry-summary-agent', 'meeting-notes-formatter-agent'],
  },
  {
    label: 'A customer-facing bot',
    text: "A real bot your customers message directly on WhatsApp — live and answering, not a demo.",
    slugs: ['whatsapp-auto-reply-bot'],
  },
  {
    label: 'A RAG-powered support agent',
    text: 'Feed it your own docs and past tickets — it answers customer questions accurately, not generically.',
    slugs: ['customer-support-rag-bot'],
  },
  {
    label: 'Business automation agents',
    text: 'Agents that chase stale deals and write personalized outreach, so nothing falls through the cracks.',
    slugs: ['crm-lead-follow-up-agent', 'sales-email-personalization-agent'],
  },
];

const totalXP = publicAgents.reduce((sum, a) => sum + a.xp, 0);
const totalHours = Math.round(publicAgents.reduce((sum, a) => sum + parseFloat(a.buildTime), 0));
const realDepartments = departments.filter((d) => d.id !== 'all');

export default function Home({ progress, onSelectAgent }) {
  const { hasBuilder1, hasBuilder2, isAdmin } = usePro();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { builder1: builder1CohortDate, builder2: builder2CohortDate } = useCohortSchedule();

  const popularAgents = [...publicAgents].sort((a, b) => b.xp - a.xp).slice(0, 4);
  const nextCohort = formatCohortDate(builder1CohortDate) || formatCohortDate(builder2CohortDate);

  return (
    <div>
      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden pt-14 pb-14 px-4 sm:px-6 lg:px-[5vw]"
        style={{
          background: theme === 'dark'
            ? 'radial-gradient(120% 100% at 85% 0%, #181022 0%, #0A090F 55%)'
            : 'radial-gradient(120% 100% at 85% 0%, #F3EBFF 0%, #FBFAFF 55%)',
        }}
      >
        <div
          className="absolute top-10 right-[15%] w-[150px] h-[150px] bg-yellow opacity-50 animate-floaty pointer-events-none hidden sm:block"
          style={{ borderRadius: '38% 62% 63% 37% / 41% 44% 56% 59%' }}
        />
        <div
          className="absolute bottom-5 left-[20%] w-[90px] h-[90px] bg-emerald-400 opacity-35 animate-floaty pointer-events-none hidden sm:block"
          style={{ borderRadius: '50%', animationDelay: '.5s' }}
        />

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-[1.05fr_.95fr] gap-11 items-center">
          <div>
            <span className="inline-flex items-center gap-2 bg-white dark:bg-[#181818] border-[1.5px] border-border text-brand font-bold text-[12.5px] px-4 py-2 rounded-full shadow-[0_3px_10px_rgba(124,58,237,.1)]">
              🚀 Learn by building real agents
            </span>
            <h1 className="font-display font-extrabold text-[40px] sm:text-[54px] leading-[1.04] text-ink tracking-[-1px] sm:tracking-[-1.5px] mt-5">
              Build real AI agents.<br />
              <span className="text-brand">Earn XP.</span>{' '}
              <span className="inline-block bg-yellow px-2.5 rounded-lg -rotate-[1.5deg]">Level up.</span>
            </h1>
            <p className="text-[17px] leading-relaxed text-body mt-5 mb-5 max-w-[480px]">
              {/* Dynamic count kept in its own element rather than a bare
                  text sibling: two adjacent JSX text children serialize as
                  one merged text node in prerendered static HTML, which
                  then mismatches React's two-node hydration expectation
                  (React #418) on every visit. */}
              <span>{publicAgents.length}</span> guided Artificial Intelligence (AI) agent build sessions across every department. Copy-paste prompts, step-by-step builds, and a portfolio write-up — so you ship something real every session.
            </p>
            <div className="flex items-baseline gap-2.5 mb-6">
              <span className="text-base text-gray-400 line-through">₦<span>{ANCHOR_PRICE.toLocaleString()}</span></span>
              <span className="font-display font-extrabold text-2xl text-ink">₦<span>{BUILDER_PRICE.toLocaleString()}</span></span>
              <span className="text-sm text-body">one-time · 6 months access</span>
            </div>
            <div className="flex gap-3.5 items-center flex-wrap">
              <Link
                to="/pricing"
                className="bg-brand text-white font-bold text-base px-7 py-[15px] rounded-2xl shadow-[0_10px_22px_rgba(124,58,237,.4)] hover:bg-brand-deep transition-colors"
              >
                Get started →
              </Link>
              <Link
                to="/catalog"
                className="bg-white dark:bg-[#181818] border-[1.5px] border-[#E0D6F5] dark:border-[#353539] text-body-strong font-bold text-base px-6.5 py-[15px] rounded-2xl hover:bg-[#FAF8FF] dark:hover:bg-white/5 transition-colors"
              >
                Browse catalog
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="relative h-[220px] sm:h-[280px] lg:h-[320px] rounded-[22px] overflow-hidden shadow-[0_24px_50px_-18px_rgba(80,40,160,.4)] bg-[#1A1333]">
              <YouTubeFacade
                className="w-full h-full"
                videoId={YOUTUBE_VIDEO_ID}
                title="Don't Get Left Behind: Learn AI Automation with Claude"
                thumbnailSrc="/video-thumbnail.jpg"
                priority
              />
            </div>
            <motion.div
              className="absolute -top-4.5 -left-6"
              initial={{ opacity: 0, x: -50, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.7, delay: 0.9, ease: 'easeOut' }}
            >
              <div className="bg-white rounded-2xl px-4 py-3 shadow-[0_12px_26px_rgba(80,40,160,.22)] animate-floaty2 flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-[10px] bg-[#ECFDF5] flex items-center justify-center text-lg">✅</div>
                <div>
                  <div className="font-display font-extrabold text-sm text-ink">Agent shipped!</div>
                  <div className="text-[11.5px] text-green font-bold">+300 XP earned</div>
                </div>
              </div>
            </motion.div>
            <motion.div
              className="absolute -bottom-4 -right-4.5"
              initial={{ opacity: 0, x: 50, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.7, delay: 1.3, ease: 'easeOut' }}
            >
              <div className="bg-brand text-white rounded-2xl px-4 py-3 shadow-[0_12px_26px_rgba(124,58,237,.4)] animate-floaty" style={{ animationDelay: '.8s' }}>
                <div className="text-[11px] opacity-85 font-semibold">Your level</div>
                <div className="font-display font-extrabold text-base">🔨 Builder</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Tech marquee ── */}
      <div className="bg-[#1A1333] py-4 overflow-hidden whitespace-nowrap">
        <div className="inline-flex gap-[52px] animate-marquee font-bold text-sm text-white/55">
          {[...TECH_MARQUEE, ...TECH_MARQUEE].map((t, i) => (
            <span key={i} className="flex gap-[52px]">
              {t}{i < TECH_MARQUEE.length * 2 - 1 && <span>·</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-4 sm:px-6 lg:px-[5vw] py-10 max-w-6xl mx-auto">
        <div className="bg-[#F3EBFF] dark:bg-[#181818] rounded-[18px] px-5 py-5.5 text-center">
          <div className="font-display font-extrabold text-[34px] text-brand">{publicAgents.length}</div>
          <div className="text-[13px] text-body font-semibold mt-0.5">AI Agents</div>
        </div>
        <div className="bg-[#FEF9E7] dark:bg-[#181818] rounded-[18px] px-5 py-5.5 text-center">
          <div className="font-display font-extrabold text-[34px] text-[#B45309]">{realDepartments.length}</div>
          <div className="text-[13px] text-body font-semibold mt-0.5">Departments</div>
        </div>
        <div className="bg-[#EAFAF1] dark:bg-[#181818] rounded-[18px] px-5 py-5.5 text-center">
          <div className="font-display font-extrabold text-[34px] text-green"><span>{Math.round(totalXP / 1000)}</span>k+</div>
          <div className="text-[13px] text-body font-semibold mt-0.5">XP Available</div>
        </div>
        <div className="bg-[#FDEEF4] dark:bg-[#181818] rounded-[18px] px-5 py-5.5 text-center">
          <div className="font-display font-extrabold text-[34px] text-rose"><span>{totalHours}</span>+</div>
          <div className="text-[13px] text-body font-semibold mt-0.5">Hours of content</div>
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pt-5 pb-11 max-w-6xl mx-auto">
        <h2 className="font-display font-extrabold text-[30px] text-ink tracking-[-.8px] text-center m-0">How it works</h2>
        <p className="text-center text-body mt-2 mb-7">Three steps from zero to portfolio-ready agent</p>
        <div className="grid sm:grid-cols-3 gap-5">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.num} className="bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-[20px] p-6.5">
              <div
                className="w-12 h-12 rounded-[14px] font-display font-extrabold text-xl flex items-center justify-center shadow-[0_8px_18px_rgba(124,58,237,.35)]"
                style={{ background: step.bg, color: step.fg }}
              >
                {step.num}
              </div>
              <h3 className="font-display font-bold text-lg text-ink mt-4 mb-2">{step.title}</h3>
              <p className="text-sm leading-relaxed text-body m-0">{step.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Before you start ── */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pt-2 pb-14 max-w-6xl mx-auto">
        <h2 className="font-display font-extrabold text-[30px] text-ink tracking-[-.8px] text-center m-0">Before you start</h2>
        <p className="text-center text-body mt-2 mb-7">What you actually need — no surprises after checkout</p>
        <div className="grid sm:grid-cols-3 gap-5">
          {BEFORE_YOU_START.map((item) => (
            <div key={item.title} className="bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-[20px] p-6.5">
              <div className="w-11 h-11 rounded-xl bg-[#F3EBFF] dark:bg-brand/15 text-brand flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-lg text-ink mb-2">{item.title}</h3>
              <p className="text-sm leading-relaxed text-body m-0">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Flagship builds ── */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pt-2 pb-14 max-w-6xl mx-auto">
        <h2 className="font-display font-extrabold text-[30px] text-ink tracking-[-.8px] text-center m-0">What you'll actually walk away having built</h2>
        <p className="text-center text-body mt-2 mb-7">Real agents from the catalog — not a topic list, a portfolio</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FLAGSHIP_BUILDS.map((item) => {
            const buildAgents = item.slugs.map(getAgentBySlug).filter(Boolean);
            const primary = buildAgents[0];
            return (
              <Link
                key={item.label}
                to={primary ? getBuilderPagePath(primary) : '/catalog'}
                className="bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-[20px] p-6 hover:border-brand/40 transition-colors"
              >
                <div className="flex gap-1.5 mb-4">
                  {buildAgents.map((a) => (
                    <span key={a.id} className="w-11 h-11 rounded-xl bg-[#F3EBFF] dark:bg-brand/15 flex items-center justify-center text-xl flex-shrink-0">
                      {a.emoji}
                    </span>
                  ))}
                </div>
                <h3 className="font-display font-bold text-lg text-ink mb-2">{item.label}</h3>
                <p className="text-sm leading-relaxed text-body m-0">{item.text}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Curriculum preview ── */}
      {builder1Weeks.length > 0 && (
        <div className="px-4 sm:px-6 lg:px-[5vw] pt-2 pb-14 max-w-6xl mx-auto">
          <h2 className="font-display font-extrabold text-[30px] text-ink tracking-[-.8px] text-center m-0">What you'll build, week by week</h2>
          <p className="text-center text-body mt-2 mb-7">Builder 1's first month, mapped out — each week has one main project and two optional ones</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {builder1Weeks.map(({ week, agents: weekAgents, mainAgent }) => (
              <div key={week} className="bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-[20px] p-6">
                <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-brand bg-[#F3EBFF] dark:bg-brand/15 px-2.5 py-1 rounded-full mb-3">
                  Week <span>{week}</span>
                </span>
                <h3 className="font-display font-bold text-lg text-ink mb-1">{WEEK_THEMES[week] || `Week ${week}`}</h3>
                {mainAgent && (
                  <p className="text-sm text-body leading-relaxed mb-3">
                    <span className="font-semibold text-ink">Main build:</span> <span>{mainAgent.title}</span>
                  </p>
                )}
                <p className="text-xs text-gray-500"><span>{weekAgents.length}</span> sessions this week</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Browse by department ── */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pt-2 pb-14 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4.5">
          <h2 className="font-display font-extrabold text-2xl text-ink m-0">Browse by department</h2>
          <Link to="/catalog" className="font-bold text-sm text-brand">View all →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {realDepartments.map((d) => (
            <button
              key={d.id}
              onClick={() => navigate(`/catalog?department=${d.id}`)}
              className="rounded-2xl p-4.5 text-center hover:opacity-90 transition-opacity"
              style={{ background: `${d.color}14` }}
            >
              <div className="text-[26px]">{d.icon}</div>
              <div className="font-bold text-[13.5px] text-ink mt-1.5">{d.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Most popular sessions ── */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pt-2 pb-14 max-w-6xl mx-auto">
        <h2 className="font-display font-extrabold text-2xl text-ink mb-4.5">Most popular sessions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {popularAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              completed={progress.isCompleted(agent.id)}
              onClick={() => onSelectAgent(agent)}
              hasBuilder1={hasBuilder1}
              hasBuilder2={hasBuilder2}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      </div>

      {/* ── Live classes ── */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pt-2 pb-14 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 items-center">
          <div className="order-2 lg:order-1">
            <span className="inline-flex items-center gap-2 bg-[#FDEEF4] dark:bg-rose/10 text-rose font-bold text-[12.5px] px-4 py-2 rounded-full">
              <Video className="w-3.5 h-3.5" /> Live classes
            </span>
            <h2 className="font-display font-extrabold text-[28px] sm:text-[32px] text-ink tracking-[-.7px] mt-4 mb-3">
              It's not just a self-paced library
            </h2>
            <p className="text-body leading-relaxed mb-5 max-w-[440px]">
              Every cohort gets scheduled live sessions — walkthroughs, office hours, and Q&A on Zoom — on top of the
              self-paced builds. Can't make it live? Every session is recorded and added to your replays.
            </p>
            {nextCohort && (
              <p className="inline-flex items-center gap-2 text-sm font-bold text-ink bg-[#F3EBFF] dark:bg-brand/15 px-4 py-2 rounded-full mb-5">
                <CalendarDays className="w-4 h-4 text-brand" /> Next cohort starts <span>{nextCohort}</span>
              </p>
            )}
            <div>
              <Link
                to="/pricing"
                className="inline-flex bg-brand text-white font-bold text-base px-7 py-[15px] rounded-2xl shadow-[0_10px_22px_rgba(124,58,237,.4)] hover:bg-brand-deep transition-colors"
              >
                Join the next cohort →
              </Link>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <LiveClassMockup />
          </div>
        </div>
      </div>

      {/* ── Community support ── */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pt-2 pb-14 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
          <div>
            <CommunityMockup />
          </div>
          <div>
            <span className="inline-flex items-center gap-2 bg-[#EAFAF1] dark:bg-green/10 text-green font-bold text-[12.5px] px-4 py-2 rounded-full">
              <MessageCircle className="w-3.5 h-3.5" /> Community support
            </span>
            <h2 className="font-display font-extrabold text-[28px] sm:text-[32px] text-ink tracking-[-.7px] mt-4 mb-3">
              Stuck on a build? You're not on your own
            </h2>
            <p className="text-body leading-relaxed mb-5 max-w-[440px]">
              Every student gets added to our WhatsApp community — ask questions, share what you've shipped, and get
              unstuck from other builders (and us) the same day, not a forum post that sits unanswered for a week.
            </p>
            <Link
              to="/pricing"
              className="inline-flex bg-brand text-white font-bold text-base px-7 py-[15px] rounded-2xl shadow-[0_10px_22px_rgba(124,58,237,.4)] hover:bg-brand-deep transition-colors"
            >
              Get started →
            </Link>
          </div>
        </div>
      </div>

      <TestimonialsSection />

      {/* ── Pricing CTA band ── */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pb-14 max-w-6xl mx-auto">
        <div
          className="rounded-[24px] px-8 sm:px-10 py-9 flex items-center justify-between flex-wrap gap-5 shadow-[0_20px_44px_-16px_rgba(124,58,237,.6)]"
          style={{ background: 'linear-gradient(120deg, #7C3AED, #9D5CFF)' }}
        >
          <div>
            <h2 className="font-display font-extrabold text-2xl sm:text-[26px] text-white m-0">Unlock all <span>{publicAgents.length}</span> sessions</h2>
            <p className="text-[#EDE4FF] mt-2 mb-0 text-[15px]">Get Builder 1, Builder 2, or both bundled as Pro — every plan is a one-time payment for 6 months of access.</p>
          </div>
          <Link
            to="/pricing"
            className="bg-yellow text-ink font-extrabold text-base px-7 py-[15px] rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,.18)] hover:brightness-95 transition-all flex-shrink-0"
          >
            See pricing →
          </Link>
        </div>
      </div>
    </div>
  );
}
