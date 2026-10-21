import { useCallback, useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2, CalendarDays, Info, Loader2, AlertCircle, Timer,
  Code2, Database, Rocket, Wrench,
} from 'lucide-react';
import { usePro } from '../hooks/usePro';
import { useCohortSchedule } from '../hooks/useCohortSchedule';
import { usePaystackCheckout } from '../hooks/usePaystackCheckout';
import CheckoutAuthModal from '../components/CheckoutAuthModal';
import { usePageSeo } from '../hooks/usePageSeo';
import { VIBECODING_PRICE } from '../data/pricing';

import { Band, ClosingBand, PageHero, SectionHeading } from '../components/page/MarketingParts';
// This page sells ONE product: the Vibe Coding bootcamp. Unlike Pricing.jsx
// / AIBuilder.jsx (which sell builder1/builder2/pro), checkout here is
// hardcoded to plan: 'vibecoding' — this page never offers the automation
// tracks, by design (confirmed with the project owner 2026-09-08).

const VIBE_STEPS = [
  { letter: 'V', word: 'Vision', text: 'Clearly define what you want to build and why.' },
  { letter: 'I', word: 'Instructions', text: 'Give AI clear, structured instructions and requirements.' },
  { letter: 'B', word: 'Build', text: 'Work with AI to build the application step by step.' },
  { letter: 'E', word: 'Evaluate', text: 'Test, inspect, debug, improve, and verify what AI creates.' },
];

const PROJECTS = [
  { icon: '🌐', name: 'Personal Portfolio Website', text: 'A professional responsive website showcasing your skills, projects, and experience.' },
  { icon: '✅', name: 'Interactive To-Do App', text: 'Tasks, editing, deletion, completion, and real user interaction.' },
  { icon: '💰', name: 'Expense Tracker', text: 'Recording expenses, categories, dates, and spending totals.' },
  { icon: '🎓', name: 'Student Management System', text: 'A real database-connected application using Supabase.' },
  { icon: '🤖', name: 'AI-Powered Application', text: 'An AI assistant, content tool, study assistant, or support prototype.' },
  { icon: '🚀', name: 'Your Own Product', text: 'Take an idea of your own and turn it into a working application.' },
];

const LEARN = [
  'Use AI as a development partner', 'Write better prompts for software development', 'Plan applications before coding',
  'Build responsive websites', 'Understand HTML, CSS, and JavaScript fundamentals', 'Build interactive web applications',
  'Work with forms and user input', 'Store and manage application data', 'Understand databases', 'Use Supabase',
  'Perform CRUD operations', 'Understand APIs', 'Build AI-powered applications', 'Debug AI-generated code',
  'Review and improve AI-generated code', 'Protect API keys and sensitive information', 'Deploy applications online',
];

const WHO_FOR = [
  { title: 'Beginners', text: "You've never coded before but want to learn how modern AI-assisted development works." },
  { title: 'Entrepreneurs', text: 'You have product ideas and want to understand how to turn them into working prototypes.' },
  { title: 'Business owners', text: 'You want to experiment with internal tools without depending on developers for every small idea.' },
  { title: 'Students', text: 'You want practical experience building real applications with modern AI tools.' },
  { title: 'Creators', text: 'You want to turn your ideas into websites, tools, and digital products.' },
  { title: 'Aspiring developers', text: 'You want to learn a modern development workflow alongside fundamental web dev concepts.' },
];

const TOOLKIT = [
  { icon: Code2, name: 'Visual Studio Code', text: 'Your development environment for creating and editing projects.' },
  { icon: Wrench, name: 'GitHub', text: 'Learn the basics of saving and managing your project code.' },
  { icon: Database, name: 'Supabase', text: 'Learn how to add a real database to your applications.' },
  { icon: Rocket, name: 'Netlify / Vercel', text: 'Learn how to put your applications online.' },
];

const WEEKS = [
  { week: 1, title: 'Understand AI Vibe Coding', text: 'Learn the VIBE Method, set up your tools, learn how to communicate with AI, and build your first website.', project: 'Personal Portfolio' },
  { week: 2, title: 'Build Interactive Applications', text: 'Learn how websites become interactive applications and build apps that work with user input and stored data.', project: 'To-Do App + Expense Tracker' },
  { week: 3, title: 'Build With Real Data', text: 'Understand databases, backends, APIs, CRUD, and Supabase.', project: 'Student Management System' },
  { week: 4, title: 'Build With AI + Your Own Product', text: 'Learn AI-powered applications, debugging, security, deployment, and complete your capstone project.', project: 'AI Application + Your Own Product' },
];

const FAQS = [
  { q: 'Is this course suitable for complete beginners?', a: 'Yes. The bootcamp is designed for beginners and explains the fundamentals before moving into more advanced projects.' },
  { q: 'Do I need to know how to code?', a: 'No professional coding experience is required — just willingness to learn basic concepts like HTML, CSS, JavaScript, and databases.' },
  { q: 'Do I need to pay for tools?', a: 'The course minimizes additional costs — GitHub, Supabase, and deployment platforms all have free options suitable for learning.' },
  { q: 'What if I miss a live class?', a: 'Class recordings are available so you can catch up, though attending live is strongly recommended.' },
  { q: 'How long will I have access?', a: "You'll have access for 6 months — live classes, recordings, resources, and your projects." },
  { q: 'Do I get a certificate?', a: 'Yes. Students who complete the bootcamp requirements receive a certificate of completion.' },
];

function formatCohortDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(`${dateStr}T00:00:00`);
  if (date < new Date(new Date().toDateString())) return null;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function subscribeToTick(onChange) {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
}

// Same pattern as AIBuilder.jsx's CohortCountdown — see that file's comment
// for why useSyncExternalStore (not useState+useEffect) matters here: this
// page is prerendered, and a frozen countdown baked into the static HTML
// would mismatch on hydration (React #418).
function CohortCountdown({ dateStr }) {
  const getSnapshot = useCallback(() => {
    if (!dateStr) return 0;
    return Math.max(0, Math.floor((new Date(`${dateStr}T00:00:00`).getTime() - Date.now()) / 1000));
  }, [dateStr]);

  const secondsLeft = useSyncExternalStore(subscribeToTick, getSnapshot, () => null);
  if (secondsLeft === null || secondsLeft <= 0) return null;

  const days = Math.floor(secondsLeft / 86400);
  const units = [
    { value: days, label: days === 1 ? 'day' : 'days' },
    { value: Math.floor(secondsLeft / 3600) % 24, label: 'hrs' },
    { value: Math.floor(secondsLeft / 60) % 60, label: 'min' },
    { value: secondsLeft % 60, label: 'sec' },
  ];

  return (
    <div data-client-only className="flex flex-col items-start gap-2.5">
      <span className="inline-flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-wide text-body">
        <Timer className="w-3.5 h-3.5 text-link" /> Next launch cohort starts in
      </span>
      <div className="flex items-center gap-2 sm:gap-2.5">
        {units.map((unit) => (
          <div key={unit.label} className="card-flat px-3 sm:px-3.5 py-2 min-w-[58px] sm:min-w-[64px] text-center">
            <div className="font-display font-extrabold text-xl sm:text-2xl text-ink tabular-nums leading-none">{String(unit.value).padStart(2, '0')}</div>
            <div className="text-[10.5px] font-bold uppercase tracking-wide text-gray-400 mt-1">{unit.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VibeCoding() {
  const { hasVibeCoding } = usePro();
  const { vibecoding: vibecodingCohortDate } = useCohortSchedule();
  const cohortDate = formatCohortDate(vibecodingCohortDate);

  const {
    checkout, loadingKey: checkoutLoading, error: checkoutError,
    authModalOpen, closeAuthModal, submitLead, leadLoading, leadError,
  } = usePaystackCheckout();

  usePageSeo({
    title: 'AI Vibe Coding Bootcamp | Social Dev Technologies',
    description: `Turn your ideas into real websites and web applications with AI. 4 weeks, 8 live classes, ₦${VIBECODING_PRICE.toLocaleString()} one-time, 6 months access.`,
    canonicalPath: '/vibe-coding',
  });

  const handleCheckout = () => checkout('vibecoding');

  return (
    <div>
      <PageHero
        title={<>Stop just using AI. <span className="text-yellow">Start building with it.</span></>}
        lead="Turn your ideas into real websites, web applications, and AI-powered products, even if you've never been a professional programmer. Learn to use AI as your development partner."
        actions={
          <>
            <a href="#pricing" className="btn btn-primary btn-lg w-full sm:w-auto">
              Join the launch cohort — ₦{VIBECODING_PRICE.toLocaleString()} →
            </a>
            <a href="#what-youll-build" className="btn btn-secondary btn-lg w-full sm:w-auto">
              See what you'll build ↓
            </a>
          </>
        }
        facts={['Launch cohort, enrollment open', '4 weeks', '8 live classes', '6 months access']}
      />

      {/* You have ideas */}
      <Band tone="white">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 lg:gap-20 items-start">
          <div>
            <h2 className="t-section text-ink">You have ideas. Now learn how to build them.</h2>
          </div>
          <div>
            <p className="t-lead text-body">
              You may think you need to become a professional programmer before you can build a website, a business
              tool, an online platform, or an AI assistant. <strong className="text-ink">You don't.</strong> With the right
              workflow, you can describe an idea, work with AI to plan it, generate and understand code, test what you
              build, fix problems, and turn your idea into a working product.
            </p>
            <p className="font-display font-extrabold text-2xl md:text-3xl leading-tight tracking-[-0.02em] text-ink mt-8 border-l-4 border-yellow pl-5">
              Africa shouldn't just use AI. Africa should build with AI.
            </p>
          </div>
        </div>
      </Band>

      {/* VIBE Method */}
      <Band>
        <SectionHeading lead="The Social Dev VIBE Method: four steps you repeat on every project.">The framework behind every project</SectionHeading>
        <ol className="list-none m-0 p-0 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
          {VIBE_STEPS.map((step) => (
            <li key={step.letter} className="rule-node pt-6">
              <div aria-hidden="true" className="font-display font-extrabold text-[88px] lg:text-[112px] leading-[0.9] tracking-[-0.05em] text-link">{step.letter}</div>
              <h3 className="font-display font-extrabold text-2xl tracking-[-0.02em] text-ink mt-4 mb-2">{step.word}</h3>
              <p className="t-card text-body">{step.text}</p>
            </li>
          ))}
        </ol>
      </Band>

      {/* What you'll build */}
      <Band id="what-youll-build" tone="white">
        <SectionHeading lead="Six real projects, from a first website to a product of your own.">What you'll build</SectionHeading>
        <ol className="list-none m-0 p-0 grid md:grid-cols-2 gap-x-14 border-b border-border md:border-b-0">
          {PROJECTS.map((p, i) => (
            <li key={p.name} className="flex gap-5 border-t border-border py-6 lg:py-7 min-w-0">
              <span aria-hidden="true" className="t-num w-10 flex-shrink-0 pt-0.5 text-3xl text-link">{String(i + 1).padStart(2, '0')}</span>
              <div className="min-w-0">
                <h3 className="font-display font-extrabold text-xl lg:text-2xl leading-tight tracking-[-0.02em] text-ink mb-2">{p.name}</h3>
                <p className="t-card text-body">{p.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </Band>

      {/* 4-week timeline */}
      <Band id="curriculum" tone="dark" size="lg">
        <SectionHeading lead="4 weeks, 8 live classes.">Your bootcamp, week by week</SectionHeading>
        <ol className="list-none m-0 p-0 border-b border-border">
          {WEEKS.map((w) => (
            <li key={w.week} className="grid lg:grid-cols-[220px_1.4fr_1fr] gap-3 lg:gap-12 border-t border-border py-7 lg:py-9 items-baseline">
              <div className="font-display font-extrabold text-4xl lg:text-5xl leading-none tracking-[-0.04em] text-yellow">Week {w.week}</div>
              <div className="min-w-0">
                <h3 className="font-display font-extrabold text-xl lg:text-2xl leading-tight tracking-[-0.02em] text-ink mb-2">{w.title}</h3>
                <p className="t-card text-body max-w-[36em]">{w.text}</p>
              </div>
              <p className="text-base font-bold text-ink">Project: <span className="font-semibold text-body">{w.project}</span></p>
            </li>
          ))}
        </ol>
      </Band>

      {/* What you'll learn */}
      <Band>
        <SectionHeading>What you'll learn</SectionHeading>
        <ul className="list-none m-0 p-0 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-3.5">
          {LEARN.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-base font-semibold text-ink">
              <CheckCircle2 className="w-5 h-5 text-green mt-0.5 flex-shrink-0" /> <span>{item}</span>
            </li>
          ))}
        </ul>
      </Band>

      {/* Who is this for */}
      <Band tone="white">
        <SectionHeading>You don't need to be a programmer</SectionHeading>
        <ul className="list-none m-0 p-0 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-9">
          {WHO_FOR.map((w) => (
            <li key={w.title} className="rule-node pt-6">
              <h3 className="font-display font-extrabold text-2xl tracking-[-0.02em] text-ink mb-2.5">{w.title}</h3>
              <p className="t-card text-body">{w.text}</p>
            </li>
          ))}
        </ul>
      </Band>

      {/* Toolkit */}
      <Band size="sm">
        <SectionHeading className="!mb-8">The tools you'll use</SectionHeading>
        <ul className="list-none m-0 p-0 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-8">
          {TOOLKIT.map((t) => (
            <li key={t.name} className="border-t border-border pt-4">
              <h3 className="font-display font-extrabold text-lg text-ink mb-1.5">{t.name}</h3>
              <p className="t-card text-body">{t.text}</p>
            </li>
          ))}
        </ul>
      </Band>

      {/* FAQ */}
      <Band tone="white">
        <SectionHeading>Your questions, answered</SectionHeading>
        <dl className="m-0 grid md:grid-cols-2 gap-x-14">
          {FAQS.map((item) => (
            <div key={item.q} className="border-t border-border py-6">
              <dt className="font-display font-extrabold text-lg text-ink mb-2">{item.q}</dt>
              <dd className="m-0 t-card text-body">{item.a}</dd>
            </div>
          ))}
        </dl>
      </Band>

      {/* Pricing / offer — the ONLY plan sold on this page */}
      <Band id="pricing" narrow>
        <SectionHeading>Join the launch cohort</SectionHeading>

        {cohortDate && (
          <div className="mb-9">
            <CohortCountdown dateStr={vibecodingCohortDate} />
          </div>
        )}

        {checkoutError && (
          <div className="mb-6 flex items-start gap-2 text-sm text-rose bg-[#FBEAE9] dark:bg-rose/10 border border-rose/20 rounded-lg px-3 py-2.5 text-left">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {checkoutError}
          </div>
        )}

        <div className="card-flat border-2 !border-brand p-7 sm:p-10">
          <div className="t-eyebrow text-link mb-4">Launch cohort</div>
          <div className="t-num text-6xl sm:text-7xl text-ink">
            ₦{VIBECODING_PRICE.toLocaleString()} <span className="font-sans text-base font-bold text-body">one-time</span>
          </div>
          {cohortDate && (
            <p className="inline-flex items-center gap-1.5 mt-4 text-sm font-bold text-link">
              <CalendarDays className="w-4 h-4" /> Cohort starts {cohortDate}
            </p>
          )}
          <ul className="list-none m-0 mt-7 mb-8 p-0 grid sm:grid-cols-2 gap-x-8 gap-y-3">
            {[
              '8 live instructor-led classes',
              '4 weeks of training',
              '6 months access',
              'Class recordings',
              'Practical projects',
              'AI development prompt library',
              'Course resources',
              'Community/support',
              'Final capstone project',
              'Certificate of completion',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-[15px] font-semibold text-ink"><CheckCircle2 className="w-4 h-4 text-green mt-1 flex-shrink-0" /> <span>{f}</span></li>
            ))}
          </ul>

          {hasVibeCoding ? (
            <Link
              to="/vibe-coding/course"
              className="flex items-center justify-center gap-2 w-full bg-green text-white font-extrabold px-5 py-4 rounded-xl transition-colors"
            >
              You're enrolled — go to your classes →
            </Link>
          ) : (
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading === 'vibecoding'}
              className="btn btn-primary btn-lg w-full disabled:opacity-60"
            >
              {checkoutLoading === 'vibecoding' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {checkoutLoading === 'vibecoding' ? 'Starting checkout…' : `Join the launch cohort — ₦${VIBECODING_PRICE.toLocaleString()} →`}
            </button>
          )}

          <p className="flex items-start gap-1.5 text-[13px] text-body mt-4">
            <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            One-time payment, not a subscription. Access starts the moment you pay.
          </p>
        </div>
      </Band>

      <ClosingBand
        title="Ready to build with AI?"
        text="4 weeks. 8 live classes. Your own product, shipped."
        href="#pricing"
        label="Join the cohort"
      />

      <CheckoutAuthModal open={authModalOpen} onClose={closeAuthModal} onSubmit={submitLead} loading={leadLoading} error={leadError} />
    </div>
  );
}
