import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { AI_AGENT_MASTERY_PRICE, BUILDER1_PRICE, VIBECODING_PRICE } from '../../data/pricing';

// One comparison instead of three equal cards. Every cell repeats a fact from
// that program's own page: prices from pricing.js, "3 live evenings, 7 PM WAT"
// and "6 months" from AI Agent Mastery, "4 weeks, 8 live classes" and "6 months"
// from Vibe Coding, "Permanent" from AI Agent Guides. "Best for" is condensed
// from each page's own audience list.
function programs({ buildCount, totalHours }) {
  return [
    {
      to: '/ai-agent-mastery',
      name: 'AI Agent Mastery',
      tag: 'Live cohort',
      price: `₦${AI_AGENT_MASTERY_PRICE.toLocaleString()}`,
      format: 'Live cohort on Zoom',
      bestFor: 'Founders, operators, consultants and freelancers',
      length: '3 live evenings, 7 PM WAT',
      access: '6 months, with replays and resources',
      build: 'A chief of staff plus a squad of specialist agents (research, design, images, coding, video) that you run from your phone, with guardrails built in',
      includes: ['Live instructor-led classes', 'A team that works while you sleep', 'Certificate of completion'],
    },
    {
      to: '/vibe-coding',
      name: 'Vibe Coding Bootcamp',
      tag: 'Live cohort',
      price: `₦${VIBECODING_PRICE.toLocaleString()}`,
      format: 'Live cohort on Zoom',
      bestFor: 'Beginners, entrepreneurs, business owners, students and creators',
      length: '4 weeks, 8 live classes',
      access: '6 months, with recordings and your projects',
      build: 'A deployed website, web app and AI-powered product. No coding experience required',
      includes: ['Live instructor-led classes', 'Portfolio site, to-do app, Supabase CRUD app and more', 'Certificate of completion'],
    },
    {
      to: '/ai-builder',
      name: 'AI Agent Guides',
      tag: 'Self-paced',
      price: `From ₦${BUILDER1_PRICE.toLocaleString()}`,
      format: 'Self-paced guides',
      bestFor: 'Self-paced learners who want to build, not just watch videos',
      length: `${buildCount} builds, about ${totalHours} hours in total`,
      access: 'Permanent',
      build: 'A portfolio of working agents: Gmail triage, WhatsApp bots, invoice processing and more',
      includes: ['Runs on your own free Gemini key', 'Portfolio write-up every session'],
    },
  ];
}

function Includes({ items }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <Check className="w-4 h-4 mt-1 flex-shrink-0 text-link" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Fact({ label, children }) {
  return (
    <div className="border-t border-border py-3.5 min-w-0">
      <div className="text-[13px] font-bold uppercase tracking-[0.06em] text-body leading-snug mb-1">{label}</div>
      <div className="text-[15px] leading-[1.55] text-ink">{children}</div>
    </div>
  );
}

// The first program is the flagship (founder-confirmed): it gets a full-width
// block with the price at poster size. The other two sit below it, smaller.
// Every cell still repeats a fact from that program's own page.
export default function ProgramsTable({ buildCount, totalHours }) {
  const [flagship, ...others] = programs({ buildCount, totalHours });

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <article className="card-flat grid overflow-hidden lg:grid-cols-[.8fr_1.2fr]">
        <div className="section-dark flex flex-col p-8 lg:p-12">
          <span className="mb-5 inline-flex w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-extrabold text-white">{flagship.tag}</span>
          <h3 className="font-display font-extrabold text-3xl lg:text-4xl leading-tight tracking-[-0.03em] text-white">
            <Link to={flagship.to} className="hover:underline underline-offset-4">{flagship.name}</Link>
          </h3>
          <div className="t-num text-6xl lg:text-[88px] text-yellow mt-6">{flagship.price}</div>
          <div className="text-sm font-semibold text-body mt-2">one-time</div>
          <p className="text-base leading-relaxed text-body mt-6 mb-8 max-w-[26em]">{flagship.build}</p>
          <Link to={flagship.to} className="btn btn-primary mt-auto w-full sm:w-fit">
            See details <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-10 p-8 lg:p-12 content-start">
          <Fact label="Best for">{flagship.bestFor}</Fact>
          <Fact label="Length">{flagship.length}</Fact>
          <Fact label="Access">{flagship.access}</Fact>
          <Fact label="Format">{flagship.format}</Fact>
          <div className="sm:col-span-2">
            <Fact label="Includes"><Includes items={flagship.includes} /></Fact>
          </div>
        </div>
      </article>

      <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
        {others.map((p) => (
          <article key={p.name} className="card-flat flex flex-col p-7 lg:p-9">
            <span
              className={`mb-4 inline-flex w-fit rounded-full px-3 py-1 text-xs font-extrabold ${
                p.tag === 'Self-paced' ? 'bg-yellow/30 text-ink' : 'bg-link/10 text-link'
              }`}
            >
              {p.tag}
            </span>
            <h3 className="font-display font-extrabold text-2xl leading-tight tracking-[-0.02em] text-ink">
              <Link to={p.to} className="hover:underline underline-offset-4">{p.name}</Link>
            </h3>
            <div className="t-num whitespace-nowrap text-5xl text-link mt-4">{p.price}</div>
            <div className="text-sm font-semibold text-body mt-2 mb-5">one-time</div>
            <Fact label="Best for">{p.bestFor}</Fact>
            <Fact label="Length">{p.length}</Fact>
            <Fact label="Access">{p.access}</Fact>
            <Fact label="You build">{p.build}</Fact>
            <Fact label="Includes"><Includes items={p.includes} /></Fact>
            <div className="mt-auto pt-6">
              <Link to={p.to} className="btn btn-primary w-full">
                See details <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
