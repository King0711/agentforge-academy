import { Link } from 'react-router-dom';
import {
  CheckCircle2, X, Info, ArrowRight, Zap, Infinity as InfinityIcon,
} from 'lucide-react';
import TestimonialCard from '../components/TestimonialCard';
import YouTubeFacade from '../components/YouTubeFacade';
import { agents, getBuilder1Agents, groupAgentsByWeek } from '../data/agents';
import { agentsBeginner } from '../data/agentsBeginner';
import { levels } from '../data/departments';
import { BUILDER1_PRICE, BUILDER2_PRICE, PRO_PRICE } from '../data/pricing';
import { usePageSeo } from '../hooks/usePageSeo';
import { Band, ClosingBand, PageHero, SectionHeading } from '../components/page/MarketingParts';

import EmojiIcon, { EmojiText } from '../components/EmojiIcon';
// Content below is adapted from the /webinar deck's narrative (same offer,
// same honest framing, same real proof points) rebuilt as a scrollable
// sales landing page for cold ad traffic rather than a live presentation —
// no live-demo section (nothing to demo without a presenter), replaced
// with a CTA to the free, self-serve WhatsApp bot guide instead.

// Same video as the homepage hero. Swap this for a purpose-shot agent demo
// (the WhatsApp bot or the inbox-triage build actually running) when one
// exists — a demo of the product beats a talking-head intro on a cold ad
// landing page, but a real generic video beats a placeholder for a fake one.
const DEMO_VIDEO_ID = 'MYcREKgdAV4';

const WANTS = ['More money', 'More time', 'A better job', 'A growing business', 'To stay ahead'];
const SCENES = [
  { icon: '🎓', text: "Everyone in her class has the same degree. She has three AI agents she actually built — that's the interview conversation starter." },
  { icon: '🏪', text: 'He used to close his shop to answer messages. Now a bot replies while he sleeps, and sales never stop for the night.' },
  { icon: '👩‍🏫', text: 'She used to spend Sunday nights grading. Now she walks into Monday already prepared — and already ahead.' },
];

const HONEST_CHECK = [
  { title: 'Your time is draining', items: ['You spend evenings finishing the paperwork part of something you already did', 'You answer the same question over and over, one person at a time'] },
  { title: "You're stuck doing repeatable work", items: ['You do the same multi-step check by hand, every single day', 'Work a computer could do while you sleep is costing you hours'] },
  { title: "You're leaving things on the table", items: ['People message you and move on while they wait for your reply', 'You keep saying "I\'ll get to that" about the thing you never automate'] },
  { title: 'You are the bottleneck', items: ['Nothing moves — at work, in class, in your business — until you personally touch it'] },
];

const USING = ['Opens ChatGPT when they remember to', 'Asks the same question every time', "Nothing happens unless they're there, typing"];
const BUILDING = ['Builds a system that runs the task automatically', 'Solves a problem once — permanently', "Keeps working even when they're not there"];

const WALL_ORDER = [
  'gmail-ai-triage-agent', 'whatsapp-auto-reply-bot', 'slack-morning-briefing-bot', 'daily-news-industry-summary-agent',
  'meeting-notes-formatter-agent', 'simple-faq-chatbot', 'social-media-post-generator', 'document-summarizer-agent',
  'lead-capture-qualifier-bot', 'price-competitor-monitor-agent', 'calendar-task-prioritizer-agent', 'basic-data-extractor-agent',
];
const wall = WALL_ORDER.map((slug) => agentsBeginner.find((a) => a.slug === slug)).filter(Boolean);

const builder1Count = agents.filter((a) => a.difficulty === 'Builder 1').length;
const builder2Count = agents.filter((a) => a.difficulty === 'Builder 2').length;

const TRACKS = [
  { tag: '🌱 Builder 1 · Start here', tagClass: 'bg-[#EAFAF1] dark:bg-green/10 text-green', border: 'border-green border-[2.5px]', title: 'The foundation', text: `${builder1Count} single-tool builds designed for zero-to-one confidence. No prerequisite except curiosity.` },
  { tag: "⚡ Builder 2 · What's next", tagClass: 'bg-[#E8EDF3] dark:bg-brand/15 text-link', border: 'border-border-soft border-[1.5px]', title: 'The next level', text: `${builder2Count} multi-step, API-integrated builds — waiting once you've shipped your first few agents.` },
  { tag: '⚡🌱 Pro · Both, no wait', tagClass: 'bg-[#FEF9E7] dark:bg-amber-500/15 text-amber-700 dark:text-amber-400', border: 'border-border-soft border-[1.5px]', title: 'Everything, now', text: 'One payment, no prerequisite — both tracks unlock immediately if you already know you want it all.' },
];

const CAPABILITIES = ['Spot work worth automating', 'Design an AI solution', 'Build agents with Claude', 'Connect AI to real tools', 'Build a real portfolio', 'Move on to Builder 2'];

const MONEY_PATHS = [
  { label: 'Freelance builds', text: 'One-off automations for local businesses who need exactly one problem solved' },
  { label: 'Ongoing retainers', text: 'Maintain and improve agents for clients over time, not just a one-time project' },
  { label: 'Become the "AI person"', text: 'The one who makes your own workplace faster — without a title change' },
];

// Two real, on-topic reviews pinned here rather than the full live
// testimonials grid — both are about learning to build, which matches this
// page's offer directly; the other approved rows are about unrelated
// web-dev/SEO client work. Copied verbatim from the `testimonials` table
// (approved = true), never paraphrased or written for the page — this sits
// above a payment CTA, so invented quotes would be fabricated reviews.
// John Amadi leads: his is the only review specifically about the AI course.
const FEATURED_TESTIMONIALS = [
  {
    id: '29d84036-0970-4ae7-9ec6-95b0514ef3b4',
    display_name: 'John Amadi',
    body: 'This was the best AI course I have seen. The instructor was super helpful too.',
    rating: 5,
    source: 'student',
  },
  {
    id: 'chiamaka-review',
    display_name: 'Chiamaka M.',
    body: 'When I enrolled in Social Dev Technologies, I had no clue what programming was all about, but now, I can code and my learning experience has been so wonderful... Social Dev Technologies has created a career path for me that will change my life forever.',
    rating: 5,
    source: 'google_business',
  },
];

const FAQS = [
  { q: 'Do I need coding experience?', a: 'No. Every session starts with copy-paste prompts.' },
  { q: "What if I've never programmed at all?", a: "That's exactly who AI Agent Guides is for — start with Builder 1, follow steps, copy-paste, done." },
  { q: "What if I don't know what to build?", a: "Every session is project-based. You're never starting blank." },
  { q: "What if I'm busy?", a: 'Self-paced. 1.5–3 hrs per session. Permanent access, no deadline.' },
  { q: 'Do I need to pay for AI tools?', a: 'No — a free Gemini API key from Google AI Studio is all you need.' },
  { q: 'What support do I get?', a: 'Direct support. Reach out, get an answer. Never alone.' },
  { q: 'What if I get stuck?', a: "Reach out anytime — we'll help you move forward." },
  { q: 'What if AI changes?', a: "You learn principles, not tools. That doesn't expire." },
];

const FOR_YOU = ['You want to build something, not just watch a video', "You've tried AI tools and felt like you weren't getting real results", 'You can commit an hour or two per session, at your own pace', 'You want a skill you can point to, not just a certificate'];
const NOT_FOR_YOU = ["You're looking for a magic button that needs zero effort from you", 'You want theory with no hands-on building', "You're not willing to actually open Claude and follow along"];

// Prices come from src/data/pricing.js — this page used to redeclare them
// locally, which is exactly the drift that file exists to prevent. Builder 1
// and Builder 2 no longer share one price (BUILDER1_PRICE/BUILDER2_PRICE),
// since they're now permanent, guides-only purchases (2026-09-22) rather
// than a 6-month subscription — no anchor/savings framing at this price
// point, see data/pricing.js's own comment for why.
const BUILDER1_FEATURES = [`${builder1Count} Builder 1 agent sessions`, 'Copy-paste prompts for every build', 'XP tracking & progress', 'Portfolio write-up prompts', 'Permanent access — yours to keep'];
const BUILDER2_FEATURES = [`${builder2Count} Builder 2 agent sessions`, 'Multi-step, API-integrated agent builds', 'XP tracking & progress', 'Portfolio write-up prompts', 'Permanent access — yours to keep'];
const PRO_FEATURES = [`All ${builder1Count + builder2Count} sessions — Builder 1 + Builder 2`, 'No prerequisite — both tracks unlock immediately', 'XP tracking & progress across both tracks', 'Portfolio write-up prompts for every agent', 'Permanent access — yours to keep'];

// Short theme labels per Builder 1 week. The data (src/data/agentsBeginner.js)
// stores only week number + isMainProject, not a display label — same split
// as Home.jsx's WEEK_THEMES, kept here alongside the one place it renders.
const WEEK_THEMES = {
  1: 'Info & briefing agents',
  2: 'Document processing',
  3: 'Inbound triage & lead handling',
  4: 'Customer-facing messaging',
};
const builder1Weeks = groupAgentsByWeek(getBuilder1Agents());

export default function AIBuilder() {
  const remaining = agentsBeginner.length - wall.length;

  usePageSeo({
    title: 'Become an AI Agent Builder | Social Dev Technologies',
    description: `Stop using AI. Start building with it. ${builder1Count + builder2Count} real AI agent sessions across AI Agent Guides, one-time payment, permanent access. Get AI Agent Guides today.`,
    canonicalPath: '/ai-builder',
  });

  const total = builder1Count + builder2Count;

  return (
    <div>
      <PageHero
        title={<>Become an <span className="text-yellow">AI Builder.</span></>}
        lead={<>AI Agent Guides: <span>{total}</span> real AI agent sessions, permanent access. Everything you need to stop using AI and start building with it, with no coding experience required.</>}
        actions={
          <>
            <Link to="/pricing" className="btn btn-primary btn-lg w-full sm:w-auto">
              Get AI Agent Guides — from ₦<span>{BUILDER1_PRICE.toLocaleString()}</span> →
            </Link>
            <a href="#what-you-build" className="btn btn-secondary btn-lg w-full sm:w-auto">
              See what you'll build ↓
            </a>
          </>
        }
        facts={[`${total} sessions`, 'Permanent access', 'One-time payment, no subscription']}
      />

      {/* Demo video. YouTubeFacade, not a raw iframe: the embed pulls ~1.5MB of
          third-party JS on sight, and this page is an ad landing page where
          load time is the conversion. */}
      <Band size="sm">
        <div className="max-w-4xl mx-auto">
          <div className="relative aspect-video rounded-xl overflow-hidden border border-border bg-[#0F1A2A]">
            <YouTubeFacade
              className="w-full h-full"
              videoId={DEMO_VIDEO_ID}
              title="Learn to build real AI agents with Claude"
              thumbnailSrc="/video-thumbnail-hd.jpg"
            />
          </div>
          <p className="text-sm text-body mt-3">Watch what you'll actually be building: 2 minutes.</p>
        </div>
      </Band>

      {/* The opportunity */}
      <Band tone="white">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-20 items-start">
          <div>
            <h2 className="t-section text-ink">The opportunity has changed.</h2>
            <p className="t-lead text-body mt-5 max-w-[26em]">
              The people getting ahead aren't necessarily the smartest. They're the ones learning how to work differently.
            </p>
            <ul className="list-none m-0 mt-7 p-0 flex flex-wrap gap-x-5 gap-y-2 text-base font-bold text-link">
              {WANTS.map((w) => <li key={w}>{w}</li>)}
            </ul>
          </div>
          <div>
            <ul className="list-none m-0 p-0 border-b border-border">
              {SCENES.map((scene) => (
                <li key={scene.text} className="flex items-start gap-4 border-t border-border py-5">
                  <EmojiIcon emoji={scene.icon} className="w-6 h-6 text-link flex-shrink-0 mt-0.5" />
                  <span className="text-base leading-relaxed text-ink">{scene.text}</span>
                </li>
              ))}
            </ul>
            <p className="font-display font-extrabold text-xl md:text-2xl leading-snug tracking-[-0.02em] text-ink mt-7">
              The vehicle behind all of it? <span className="text-link">AI</span>, now cheap and simple enough that anyone can pick it up.
            </p>
          </div>
        </div>
      </Band>

      {/* Honest check */}
      <Band>
        <SectionHeading>How many of these sound like you?</SectionHeading>
        <ul className="list-none m-0 p-0 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-9 mb-12">
          {HONEST_CHECK.map((group) => (
            <li key={group.title} className="rule-node pt-6">
              <h3 className="font-display font-extrabold text-xl leading-snug tracking-[-0.02em] text-ink mb-3">{group.title}</h3>
              <ul className="list-none m-0 p-0 flex flex-col gap-2.5">
                {group.items.map((item) => (
                  <li key={item} className="t-card text-body">{item}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <p className="font-display font-extrabold text-2xl md:text-4xl leading-tight tracking-[-0.03em] text-ink max-w-[22em]">
          If two or more sound like your week, you don't need more hours. <span className="text-link">You need a system that runs without you.</span>
        </p>
      </Band>

      {/* Using vs building */}
      <Band tone="white">
        <SectionHeading>Using AI vs. Building with AI</SectionHeading>
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-10 mb-10">
          <div className="rule-node [--rule:var(--color-border)] pt-6">
            <h3 className="font-display font-extrabold text-2xl tracking-[-0.02em] text-body mb-4">Using AI</h3>
            <ul className="list-none m-0 p-0 flex flex-col gap-3">
              {USING.map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-base text-body"><X className="w-4 h-4 text-body mt-1 flex-shrink-0" /> <span>{t}</span></li>
              ))}
            </ul>
          </div>
          <div className="rule-node [--rule:var(--color-brand)] pt-6">
            <h3 className="font-display font-extrabold text-2xl tracking-[-0.02em] text-ink mb-4">Building with AI</h3>
            <ul className="list-none m-0 p-0 flex flex-col gap-3">
              {BUILDING.map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-base font-semibold text-ink"><CheckCircle2 className="w-4 h-4 text-green mt-1 flex-shrink-0" /> <span>{t}</span></li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-lg text-body">
          ChatGPT users consume AI. <strong className="text-ink">AI Builders solve problems with it.</strong>
        </p>
      </Band>

      {/* Free guide CTA — replaces the live-demo section from the webinar */}
      <Band tone="dark">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 lg:gap-20 items-center">
          <div>
            <h2 className="t-section text-ink">Don't just read about it. Build something right now.</h2>
            <p className="t-lead text-body mt-5 max-w-[34em]">
              Follow our free, beginner-friendly guide and have a working WhatsApp auto-reply bot running in about 40
              minutes, with no credit card and no coding experience required.
            </p>
            <div className="mt-8">
              <Link to="/whatsapp-bot-guide" className="btn btn-primary btn-lg">
                Get the free guide <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
          <p className="text-base leading-relaxed text-body border-l-4 border-yellow pl-5">
            Want the version built on Twilio's official WhatsApp Business API, trained on your own voice? That's the
            Advanced WhatsApp Auto-Reply Bot, one of 12 sessions inside Builder 1.
          </p>
        </div>
      </Band>

      {/* Wall of 12 */}
      <Band id="what-you-build">
        <SectionHeading>Your first 12 AI agents</SectionHeading>
        <ul className="list-none m-0 p-0 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10">
          {wall.map((agent) => (
            <li key={agent.slug} className="flex items-center gap-3 border-t border-border py-4">
              <EmojiIcon emoji={agent.emoji} className="w-5 h-5 text-link flex-shrink-0" />
              <span className="text-base font-bold leading-snug text-ink">{agent.title}</span>
              {agent.slug === 'whatsapp-auto-reply-bot' && (
                <span className="ml-auto flex-shrink-0 text-xs font-extrabold uppercase tracking-wide text-rose">Free guide</span>
              )}
            </li>
          ))}
        </ul>
        <p className="font-display font-extrabold text-2xl md:text-4xl leading-tight tracking-[-0.03em] text-ink mt-12 max-w-[22em]">
          By the end of Builder 1, you won't just understand AI. <span className="text-link">You'll have built 12 real AI agents solving real business problems.</span>
        </p>
        {remaining > 0 && <p className="text-base text-body font-semibold mt-4">+ <span>{remaining}</span> more sessions across sales, data, and operations.</p>}
      </Band>

      {/* Journey */}
      <Band tone="white">
        <SectionHeading>Your AI Builder journey</SectionHeading>
        <ol className="list-none m-0 p-0 grid md:grid-cols-3 gap-x-12 gap-y-9 mb-14">
          {TRACKS.map((track) => (
            <li key={track.title} className="rule-node pt-6">
              <div className="text-sm font-extrabold text-link mb-3"><EmojiText>{track.tag}</EmojiText></div>
              <h3 className="font-display font-extrabold text-2xl tracking-[-0.02em] text-ink mb-2">{track.title}</h3>
              <p className="t-card text-body">{track.text}</p>
            </li>
          ))}
        </ol>
        <h3 className="font-display font-extrabold text-xl tracking-[-0.02em] text-ink mb-5">After Builder 1, you'll be able to</h3>
        <ul className="list-none m-0 p-0 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-3.5">
          {CAPABILITIES.map((c) => (
            <li key={c} className="flex items-center gap-2.5 text-base font-semibold text-ink">
              <CheckCircle2 className="w-5 h-5 text-green flex-shrink-0" /> <span>{c}</span>
            </li>
          ))}
        </ul>
      </Band>

      {/* Curriculum — every count here is derived from src/data/agents.js, never
          hardcoded, so the page can't drift out of sync with the catalog the
          way a written-out "25 sessions" would. */}
      <Band id="curriculum">
        <SectionHeading lead="The full path, from your first build to your last."><span>{total}</span> sessions, start to finish.</SectionHeading>
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-20">
          <div>
            <div className="flex items-baseline gap-4 mb-2">
              <span className="t-num text-6xl text-green">{builder1Count}</span>
              <span className="font-display font-extrabold text-xl text-ink">Builder 1 · Start here</span>
            </div>
            <p className="t-card text-body mb-6">Four weeks, each built around one mechanism, not a random topic list.</p>
            <ol className="list-none m-0 p-0 border-b border-border">
              {builder1Weeks.map((week) => {
                const main = week.agents.find((a) => a.isMainProject);
                return (
                  <li key={week.week} className="grid grid-cols-[88px_1fr] gap-4 border-t border-border py-5">
                    <span className="font-display font-extrabold text-2xl tracking-[-0.03em] text-link">Week {week.week}</span>
                    <div>
                      <p className="font-display font-extrabold text-lg leading-tight text-ink">{WEEK_THEMES[week.week]}</p>
                      <p className="text-[15px] text-body mt-1">
                        <span>{week.agents.length}</span> sessions
                        {main && <> · main build: <span className="text-ink font-semibold">{main.title}</span></>}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
            <p className="flex items-start gap-2 text-sm text-body mt-4">
              <CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" />
              Each week's main build earns a certificate on its own. The other two are optional.
            </p>
          </div>

          <div>
            <div className="flex items-baseline gap-4 mb-2">
              <span className="t-num text-6xl text-link">{builder2Count}</span>
              <span className="font-display font-extrabold text-xl text-ink">Builder 2 · What's next</span>
            </div>
            <p className="t-card text-body mb-6">
              Multi-step agents that talk to real APIs: research, CRM, RAG support bots, invoice processing.
            </p>
            <ul className="list-none m-0 p-0 flex flex-col gap-3 mb-5">
              {BUILDER2_FEATURES.slice(0, 3).map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-base font-semibold text-ink">
                  <CheckCircle2 className="w-4 h-4 text-link mt-1 flex-shrink-0" /> <span>{f}</span>
                </li>
              ))}
            </ul>
            <p className="flex items-start gap-2 text-sm text-body pt-4 border-t border-border">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              A few of these connect to a third-party service and need a free API key of your own. Each session says which, up front.
            </p>
          </div>
        </div>

        <p className="font-display font-extrabold text-2xl md:text-4xl leading-tight tracking-[-0.03em] text-ink mt-14 max-w-[22em]">
          Every session ends with a write-up prompt: <span className="text-link">LinkedIn post, resume bullets, project blurb.</span> You
          finish with a portfolio, not a certificate nobody asked for.
        </p>
        <div className="mt-8">
          <Link to="/catalog" className="btn btn-secondary">
            See the full curriculum <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </Band>

      {/* Who you become */}
      <Band tone="white">
        <SectionHeading lead="Every session earns real XP toward a real level, tracked and not a metaphor.">Who you become</SectionHeading>
        <ol className="list-none m-0 p-0 grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-6 mb-12">
          {levels.map((level, i) => (
            <li key={level.name} className={`border-t-4 pt-4 ${i === 1 ? 'border-brand' : 'border-border'}`}>
              <EmojiIcon emoji={level.icon} className="w-8 h-8 text-link" />
              <div className="font-display font-extrabold text-xl text-ink mt-3">{level.name}</div>
              {i === 1 && <div className="text-sm font-bold text-link mt-1">You start here</div>}
            </li>
          ))}
        </ol>
        <p className="font-display font-extrabold text-3xl md:text-5xl leading-[1.05] tracking-[-0.035em] text-ink max-w-[20em]">
          You don't need permission to call yourself a builder. You need <span className="text-link">one shipped agent.</span>
        </p>
      </Band>

      {/* Get paid for this */}
      <Band>
        <SectionHeading lead="Every business has a version of John's problem: real work, nobody has time for it. Once you can build the fix, you can sell it.">You can get paid for this.</SectionHeading>
        <div className="card-flat flex flex-col sm:flex-row items-start gap-6 p-6 lg:p-8 mb-12">
          <img src="/john_uwem.jpg" alt="John Uwem" className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
          <div>
            <span className="font-display font-extrabold text-xl text-ink block">John Uwem</span>
            <span className="block text-sm font-bold text-link mt-0.5 mb-3">Real client work: a US wedding ring brand</span>
            <p className="t-body text-body m-0 max-w-[44em]">
              Part of John's job was checking dozens of jewelry stores for a wedding ring brand: did they stock the
              rings, was pricing right, were the photos correct. We built him an AI agent that does it automatically,
              twice a day. He hasn't opened a browser tab for it in weeks.
            </p>
          </div>
        </div>
        <ul className="list-none m-0 p-0 grid md:grid-cols-3 gap-x-12 gap-y-8 mb-14">
          {MONEY_PATHS.map((p) => (
            <li key={p.label} className="rule-node pt-6">
              <h3 className="font-display font-extrabold text-2xl tracking-[-0.02em] text-ink mb-2">{p.label}</h3>
              <p className="t-card text-body m-0">{p.text}</p>
            </li>
          ))}
        </ul>
        <div className="grid sm:grid-cols-2 gap-5 items-stretch">
          {FEATURED_TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>
      </Band>

      {/* FAQ */}
      <Band tone="white">
        <SectionHeading>Before you go further, your questions</SectionHeading>
        <dl className="m-0 grid md:grid-cols-2 gap-x-14">
          {FAQS.map((item) => (
            <div key={item.q} className="border-t border-border py-6">
              <dt className="font-display font-extrabold text-lg text-ink mb-2">{item.q}</dt>
              <dd className="m-0 t-card text-body">{item.a}</dd>
            </div>
          ))}
        </dl>
      </Band>

      {/* Qualifier */}
      <Band>
        <SectionHeading>Are AI Agent Guides for you?</SectionHeading>
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-10">
          <div className="rule-node [--rule:var(--color-green)] pt-6">
            <h3 className="font-display font-extrabold text-2xl tracking-[-0.02em] text-ink mb-5">This is for you if…</h3>
            <ul className="list-none m-0 p-0 flex flex-col gap-3.5">
              {FOR_YOU.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-base font-semibold text-ink"><CheckCircle2 className="w-5 h-5 text-green mt-0.5 flex-shrink-0" /> <span>{item}</span></li>
              ))}
            </ul>
          </div>
          <div className="rule-node [--rule:var(--color-border)] pt-6">
            <h3 className="font-display font-extrabold text-2xl tracking-[-0.02em] text-body mb-5">This might not be for you if…</h3>
            <ul className="list-none m-0 p-0 flex flex-col gap-3.5">
              {NOT_FOR_YOU.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-base text-body"><X className="w-5 h-5 text-body mt-0.5 flex-shrink-0" /> <span>{item}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </Band>

      {/* Offer — all three real plans, each permanent/guides-only. */}
      <Band id="pricing" tone="white">
        <SectionHeading>Pick where you start.</SectionHeading>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {[
            { key: 'b1', tag: 'Start here', name: 'Builder 1', icon: '🌱', price: BUILDER1_PRICE, text: 'The foundation track. No prerequisite, no coding experience needed.', features: BUILDER1_FEATURES, cta: 'Claim Builder 1 →', primary: true, ring: 'border-2 !border-green' },
            { key: 'b2', name: 'Builder 2', icon: '⚡', price: BUILDER2_PRICE, text: 'Best after Builder 1, but nothing stops you jumping straight in.', features: BUILDER2_FEATURES, cta: 'Get Builder 2 →', primary: false },
            { key: 'pro', tag: 'Best value', name: 'Pro', price: PRO_PRICE, text: 'Both tracks, one payment, no prerequisite. Everything unlocks immediately.', features: PRO_FEATURES, cta: 'Get everything →', primary: true, ring: 'border-2 !border-brand', pro: true },
          ].map((plan) => (
            <article key={plan.key} className={`card-flat flex flex-col p-7 lg:p-8 ${plan.ring || ''}`}>
              <div className="t-eyebrow h-3 text-link mb-4">{plan.tag || ''}</div>
              <h3 className="font-display font-extrabold text-2xl tracking-[-0.02em] text-ink flex items-center gap-2">
                {plan.pro ? <Zap className="w-5 h-5 text-link" /> : <EmojiIcon emoji={plan.icon} className="w-5 h-5" />} {plan.name}
              </h3>
              <div className="t-num text-5xl text-ink mt-4">₦<span>{plan.price.toLocaleString()}</span></div>
              <p className="inline-flex items-center gap-1.5 text-sm font-bold text-green mt-3 mb-4">
                <InfinityIcon className="w-4 h-4" /> Yours forever, no expiry
              </p>
              <p className="t-card text-body mb-5">{plan.text}</p>
              <ul className="list-none m-0 p-0 flex flex-col gap-2.5 mb-7 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[15px] text-ink"><CheckCircle2 className="w-4 h-4 text-green mt-1 flex-shrink-0" /> <span>{f}</span></li>
                ))}
              </ul>
              <Link to="/pricing" className={`btn w-full ${plan.primary ? 'btn-primary' : 'btn-secondary'}`}>{plan.cta}</Link>
            </article>
          ))}
        </div>

        {/* Expectation-setting before checkout, not after: these are the three
            things students actually get surprised by, and the refund policy
            (FAQ.jsx) has no change-your-mind window to fall back on. */}
        <div className="mt-9 flex flex-col gap-2.5 max-w-3xl">
          <p className="flex items-start gap-2 text-sm text-body">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            One-time payment, not a subscription. Access starts the moment you pay and never expires.
          </p>
          <p className="flex items-start gap-2 text-sm text-body">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            All you need is a free Gemini API key from Google AI Studio, with no paid AI subscription required. A few
            Builder 2 sessions also need a free API key from a third-party service. Each one tells you before you start.
          </p>
        </div>
      </Band>

      <ClosingBand
        title="Ready to become an AI Builder?"
        text="One-time payment. Permanent access. Start today."
        to="/pricing"
        label="Get AI Agent Guides"
      />
    </div>
  );
}
