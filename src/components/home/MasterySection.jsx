import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, LayoutGrid } from 'lucide-react';
import { useAutoplayInView } from '../../hooks/useAutoplayInView';
import { AI_AGENT_MASTERY_PRICE } from '../../data/pricing';
import { DEMO_LOOP } from '../../data/demoMedia';

// Every line here is copied from the AI Agent Mastery page (its program card,
// CAPABILITIES and CURRICULUM_DAYS); only the punctuation changed, since the
// homepage has no em dashes. Keep the two in step if the page changes.
const POINTS = [
  '3 live evenings at 7 PM WAT, with day 3 on monetizing your new skill',
  '6 months access to classes, replays, and resources',
  'Certificate of completion',
];

const CAPABILITIES = [
  { name: 'Inbox', text: 'Reads, triages, and drafts replies to your email before you even open it.' },
  { name: 'Calendar', text: 'Finds time, schedules meetings, and untangles conflicts on your behalf.' },
  { name: 'Research', text: 'Pulls together answers, summaries, and briefings from across the web.' },
  { name: 'Messaging', text: 'Drafts and sends messages in your voice, on the channels you already use.' },
];

const DAYS = [
  {
    day: 'Day 1',
    title: 'Agent Architecture & Your First Connections',
    text: 'Design an agent that holds context across tasks, then wire it into your real inbox and calendar so it starts triaging and scheduling for you.',
  },
  {
    day: 'Day 2',
    title: 'Memory, Multi-Step Tasks & Guardrails',
    text: "Give your agent memory so it improves with use, teach it to handle research and messaging tasks it can't finish in one shot, and add the guardrails that keep it asking before it acts.",
  },
  {
    day: 'Day 3',
    title: 'Monetizing Your New Skill',
    text: 'Turn what you just built into an income stream: how to package and offer this same kind of build as a paid service to other businesses.',
  },
];

function DemoVideo() {
  const ref = useRef(null);
  useAutoplayInView(ref, { respectReducedMotion: true });
  return (
    <video
      ref={ref}
      src="/videos/dashboard-demo-web.mp4"
      poster="/videos/dashboard-demo-poster.jpg"
      width={1280}
      height={576}
      muted
      loop
      playsInline
      controls
      preload="metadata"
      aria-label="Screen recording of the multi-agent dashboard: several agents moving tasks across a shared board"
      className="block w-full h-auto aspect-[20/9] object-cover bg-[#0F1A2A]"
    />
  );
}

export default function MasterySection() {
  return (
    <>
      <div className="grid lg:grid-cols-[1fr_1.15fr] gap-9 lg:gap-14 items-center mb-11 lg:mb-16">
        <div className="min-w-0">
          <h2 className="t-section text-ink">Build an AI team that does the work of a whole team</h2>
          <p className="t-lead text-body mt-5 mb-6 lg:mb-7 max-w-[30em]">
            Live cohort. Build a chief of staff plus a squad of specialist agents (research, design, images, coding, video)
            that you run from your phone, with guardrails built in.
          </p>
          <ul className="flex flex-col gap-2.5 mb-6 lg:mb-7">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-[15px] leading-normal text-ink">
                <Check className="w-4 h-4 mt-[3px] flex-shrink-0 text-link" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-3.5">
            <Link to="/ai-agent-mastery" className="btn btn-primary btn-lg w-full sm:w-auto">
              See AI Agent Mastery <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-[15px] font-semibold text-body text-center sm:text-left">
              <span>₦{AI_AGENT_MASTERY_PRICE.toLocaleString()} one-time.</span>
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <div className="rounded-xl overflow-hidden border border-border bg-[#0F1A2A]">
            <DemoVideo />
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-2.5 mb-1.5">
              <LayoutGrid className="w-5 h-5 text-link hidden lg:block" />
              <h3 className="t-h3 text-ink text-lg">{DEMO_LOOP.title}</h3>
            </div>
            <p className="t-card text-body">{DEMO_LOOP.text}</p>
          </div>
        </div>
      </div>

      <h3 className="font-display font-extrabold text-[28px] lg:text-4xl leading-tight tracking-[-0.03em] text-ink mb-6 lg:mb-8">What your assistant does</h3>
      <dl className="m-0 mb-16 lg:mb-24 border-b border-border">
        {CAPABILITIES.map((c) => (
          <div key={c.name} className="grid md:grid-cols-[1fr_1.1fr] gap-2 md:gap-12 items-baseline border-t border-border py-6 lg:py-9">
            <dt className="font-display font-extrabold text-4xl lg:text-[64px] leading-none tracking-[-0.04em] text-ink">{c.name}</dt>
            <dd className="m-0 max-w-[28em] text-base lg:text-lg leading-relaxed text-body">{c.text}</dd>
          </div>
        ))}
      </dl>

      <h3 className="font-display font-extrabold text-[28px] lg:text-4xl leading-tight tracking-[-0.03em] text-ink mb-8 lg:mb-10">The three live evenings</h3>
      <ol className="list-none m-0 p-0 grid lg:grid-cols-3 gap-9 lg:gap-12">
        {DAYS.map((d) => (
          <li key={d.day} className="border-t-4 border-brand pt-5">
            <div className="font-display font-extrabold text-5xl leading-none tracking-[-0.04em] text-link mb-5">{d.day}</div>
            <h4 className="t-h3 text-ink text-[21px] mb-2.5">{d.title}</h4>
            <p className="t-card text-body">{d.text}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
