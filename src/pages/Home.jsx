import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Check, MessageCircle, Video } from 'lucide-react';
import AutomationFlowDiagram from '../components/AutomationFlowDiagram';
import YouTubeFacade from '../components/YouTubeFacade';
import EmailCapture from '../components/EmailCapture';
import { useAuth } from '../context/AuthContext';
import { openAdvisor } from '../lib/advisor';
import ScholarshipBar from '../components/home/ScholarshipBar';
import ProgramsTable from '../components/home/ProgramsTable';
import MasterySection from '../components/home/MasterySection';
import TestimonialQueue from '../components/home/TestimonialQueue';
import ClassSlide from '../components/home/ClassSlide';
import BuildsBrowser from '../components/home/BuildsBrowser';
import VibeProjects from '../components/home/VibeProjects';
import HowGuidesWork from '../components/home/HowGuidesWork';
import { agents } from '../data/agents';
import { isVisibleToPublic } from '../data/departments';
import { INSTRUCTOR } from '../data/instructor';
import { useCohortSchedule } from '../hooks/useCohortSchedule';
import { BUILDER1_PRICE } from '../data/pricing';

// Returns a display string for a cohort start date, or null if it's unset or
// already in the past — same rule Pricing.jsx uses, duplicated rather than
// shared since the two pages' surrounding date logic differs slightly.
function formatCohortDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(`${dateStr}T00:00:00`);
  if (date < new Date(new Date().toDateString())) return null;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}

const YOUTUBE_VIDEO_ID = 'MYcREKgdAV4';
const YOUTUBE_VIDEO_TITLE = "Don't Get Left Behind: Learn AI Automation with Claude";

// Advanced/World Class are admin-only — every public-facing count on this
// marketing page is based on the public catalog only.
const publicAgents = agents.filter((a) => isVisibleToPublic(a.difficulty));
const totalHours = Math.round(publicAgents.reduce((sum, a) => sum + parseFloat(a.buildTime), 0));

// 500+ and 350+ are the founder's figures; the build count comes from the data.
const STATS = [
  { value: '500+', label: 'students taught' },
  { value: '350+', label: 'certificates awarded' },
  { value: String(publicAgents.length), label: 'guided agent builds' },
];

// Set expectations before checkout, not after — these are the things
// students actually get surprised by.
const BEFORE_YOU_START = [
  {
    title: 'No prior coding experience required',
    text: "Every build ships copy-paste-ready prompts. You're directing the AI, not writing code from scratch. Basic comfort with a browser and copy-paste is all you need to start.",
  },
  {
    title: 'No paid AI subscription needed',
    text: 'All you need is a free Gemini API key from Google AI Studio. The free tier is enough to complete every build. Nothing extra to pay for beyond your one-time course payment.',
  },
  {
    title: 'A few Builder 2 sessions need their own API key',
    text: "A handful of advanced builds connect to a third-party service (Pinecone, HubSpot, DataForSEO) to do their job. Most have a free tier that's enough to complete the session. Each build tells you exactly what it needs before you start.",
  },
];

// The page alternates dark gradient bands (section-dark) with light ones, and
// floats white cards (card-float) over the seams. Sections share one content
// width: 1280px max, with the padding inside the box.
const INNER = 'px-4 sm:px-6 lg:px-[5vw] max-w-7xl mx-auto';
// Section padding varies on purpose: a page where every band has the same
// height reads as stamped out.
const PAD = 'py-16 md:py-24';
const PAD_S = 'py-12 md:py-16';
const PAD_L = 'py-20 md:py-32';

function Hero() {
  return (
    <section className="section-dark section-grad pt-14 pb-16 md:pt-20 md:pb-24">
      {/* Headline across the full width, then the pitch and one real result side
          by side, then the class screenshot at full content width: it is a wide
          image, so in half a column its slide text was unreadable. */}
      <div className={INNER}>
        <h1 className="t-hero text-white max-w-[15em]">Build an AI assistant, a web app or working AI agents.</h1>
        <div className="mt-8 md:mt-10 grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-16 lg:items-end">
          <div className="min-w-0">
            <p className="text-lg md:text-xl leading-relaxed text-body mb-8 md:mb-10 max-w-[30em]">
              Live instructor-led classes on Zoom, or self-paced guides you keep for good. 500+ students taught.
              Programs from ₦{BUILDER1_PRICE.toLocaleString()}.
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
              <Link to="/pricing" className="btn btn-primary btn-lg w-full sm:w-auto">
                See programs and prices <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#mastery" className="btn btn-secondary btn-lg w-full sm:w-auto">
                See what you'll build
              </a>
            </div>
          </div>
          {/* One real result, word for word from a student's WhatsApp message
              (the same screenshot TestimonialQueue shows lower down; first name
              only, approved by the founder). */}
          <figure className="m-0 border-l-4 border-yellow pl-5 max-w-[32em]">
            <blockquote className="m-0 font-display font-bold text-lg md:text-xl leading-snug tracking-[-0.01em] text-white">
              “I have successfully built my AI team on Thursday. My telegram and WhatsApp agents closed 7 deals for me.”
            </blockquote>
            <figcaption className="mt-2.5 text-sm font-semibold text-body">Ibrahim, a student in an earlier live class</figcaption>
          </figure>
        </div>
        <div className="mt-12 md:mt-16">
          <ClassSlide />
        </div>
      </div>

      {/* The numbers sit directly on the band as large type, not in a widget. */}
      <div className={`${INNER} mt-14 md:mt-20 pt-10 md:pt-14 border-t border-white/20 grid lg:grid-cols-[1fr_1.6fr] gap-9 lg:gap-14 lg:items-end`}>
        <div className="min-w-0">
          <h2 className="font-display font-extrabold text-3xl md:text-[40px] leading-[1.05] tracking-[-0.03em] text-white mb-3">
            Bring AI into your actual work
          </h2>
          <p className="t-card text-body max-w-[26em]">
            Students walk into work already using AI skills their teams and managers are only just starting to ask for.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 lg:gap-8">
          {STATS.map((st) => (
            <div key={st.label} className="min-w-0">
              <div className="t-num text-5xl sm:text-6xl lg:text-[60px] xl:text-[80px] text-white">{st.value}</div>
              <div className="text-[13px] lg:text-base font-semibold leading-snug text-body mt-2.5 lg:mt-3">{st.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// The phone board leaves the diagram out: it needs about 600px to read.
function FlowShowcase() {
  return (
    <section className="hidden md:block pt-24 pb-4">
      <div className={INNER}>
        <div className="max-w-[760px] mb-11">
          <h2 className="t-section text-ink">What one agent does with one email</h2>
          <p className="t-lead text-body mt-5">
            A new email arrives. The agent reads it, decides if it's urgent, replies in Slack and logs a task in Notion.
            You build agents like this in AI Agent Mastery and AI Agent Guides.
          </p>
          <p className="mt-2.5 text-[13px] text-body">Illustration of one agent.</p>
        </div>
        <div className="card-flat p-5 lg:p-9">
          <AutomationFlowDiagram />
        </div>
      </div>
    </section>
  );
}

// The same "talk to someone" action the floating chat button has: it opens
// that button's form, so there is one form and one set of copy.
function AdvisorButton({ className = '' }) {
  return (
    <button type="button" onClick={openAdvisor} className={`btn btn-secondary ${className}`}>
      <MessageCircle className="w-5 h-5" /> Talk to an advisor
    </button>
  );
}

// Every tick repeats something the programs table below already says.
const FORMAT_FACTS = ['Live cohorts on Zoom', 'Self-paced guides, yours for good', 'One-time payment, no subscription'];

function Programs() {
  return (
    <section className="pt-16 pb-16 md:pt-24 md:pb-28">
      <div className={INNER}>
        <h2 className="t-section text-ink max-w-[14em]">Live with an instructor, or at your own pace</h2>
        <ul className="list-none m-0 mt-6 mb-10 md:mb-12 p-0 flex flex-wrap gap-x-9 gap-y-3">
          {FORMAT_FACTS.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-base font-bold text-ink">
              <Check className="w-5 h-5 flex-shrink-0 text-green" /> {f}
            </li>
          ))}
        </ul>
        <ProgramsTable buildCount={publicAgents.length} totalHours={totalHours} />
        <div className="mt-10 md:mt-12 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <p className="text-lg font-bold text-ink">Not sure which one fits?</p>
          <AdvisorButton />
        </div>
      </div>
    </section>
  );
}

// "3-person" would otherwise break after its hyphen.
function keepHyphenatedWords(text) {
  return text.split(/(\S+-\S+)/).map((part, i) =>
    i % 2 ? <span key={i} className="whitespace-nowrap">{part}</span> : part,
  );
}

function Instructor() {
  return (
    <section className={`section-white ${PAD_S}`}>
      <div className={`${INNER} flex flex-col md:flex-row md:items-center gap-8 md:gap-16`}>
        <div className="relative flex-shrink-0 self-start">
          {/* A solid offset block behind the photo. */}
          <div aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 md:translate-x-4 md:translate-y-4 rounded-[22px] md:rounded-[28px] bg-brand" />
          <img
            src={INSTRUCTOR.photo}
            alt={`${INSTRUCTOR.name}, instructor`}
            width={200}
            height={200}
            loading="lazy"
            decoding="async"
            className="relative w-[140px] h-[140px] md:w-60 md:h-60 rounded-[22px] md:rounded-[28px] object-cover"
          />
        </div>
        <div className="min-w-0">
          <h2 className="t-section text-ink">{INSTRUCTOR.name}</h2>
          <p className="mt-2.5 mb-5 md:mb-6 text-lg font-bold text-link">{INSTRUCTOR.title}</p>
          <div className="flex flex-col gap-3.5 max-w-[42em]">
            {INSTRUCTOR.bio.map((p) => (
              <p key={p} className="t-body text-body">{keepHyphenatedWords(p)}</p>
            ))}
          </div>
          <div className="mt-7">
            <AdvisorButton />
          </div>
        </div>
      </div>
    </section>
  );
}

// The introduction video used to sit in the hero. It is a talk, not proof of the
// classroom, so it now has its own place for people who want to watch first.
function WatchVideo() {
  return (
    <section className={PAD_S}>
      <div className={`${INNER} max-w-5xl`}>
        <h2 className="t-section text-ink text-center mb-10 md:mb-14">Rather watch first?</h2>
        <div className="rounded-xl overflow-hidden border border-border">
          <div className="aspect-video bg-[#0F1A2A]">
            <YouTubeFacade
              className="w-full h-full"
              videoId={YOUTUBE_VIDEO_ID}
              title={YOUTUBE_VIDEO_TITLE}
              thumbnailSrc="/video-thumbnail-hd.jpg"
            />
          </div>
        </div>
        <p className="mt-3.5 text-center text-sm leading-normal text-body">{YOUTUBE_VIDEO_TITLE}</p>
      </div>
    </section>
  );
}

function BeforeYouStart() {
  return (
    <section className={PAD_S}>
      <div className={INNER}>
        <div className="max-w-[720px] mb-10 md:mb-14">
          <h2 className="t-section text-ink">Before you start</h2>
          <p className="t-lead text-body mt-5">What you actually need, with no surprises after checkout</p>
        </div>
        <ul className="list-none m-0 p-0 grid md:grid-cols-3 gap-x-12 gap-y-9">
          {BEFORE_YOU_START.map((item) => (
            <li key={item.title} className="border-t-4 border-ink pt-6">
              <h3 className="font-display font-extrabold text-[22px] lg:text-2xl leading-tight tracking-[-0.02em] text-ink mb-4">{item.title}</h3>
              <p className="t-card text-body">{item.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// The Vibe Coding date an admin set; nothing when there isn't one (it used to
// fall back to the AI Agent Mastery weekday, removed 2026-10-15 with the other
// public start days). The admin `aimastery` row is skipped on purpose: it no
// longer drives the Mastery page (CLAUDE.md). Client-only because the date is.
function NextCohortPill() {
  const { vibecoding } = useCohortSchedule();
  const date = formatCohortDate(vibecoding);
  if (!date) return null;
  return (
    <p
      data-client-only
      className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 mb-5 md:mb-6 text-sm font-bold text-white"
    >
      <CalendarDays className="w-4 h-4 text-yellow" />
      <span>Next cohort starts {date}</span>
    </p>
  );
}

function LiveClasses() {
  return (
    <section className={`section-dark ${PAD}`}>
      <div className={`${INNER} grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-16 items-center`}>
        <div className="min-w-0">
          <h2 className="t-section text-ink mb-5">Prefer real classes over a self-paced library?</h2>
          <p className="t-lead text-body mb-6 md:mb-8 max-w-[32em]">
            AI Agent Mastery and Vibe Coding Bootcamp are live cohorts on Zoom: walkthroughs, office hours and Q&amp;A. Miss a
            class and the recording is added to your replays.
          </p>
          <div>
            <NextCohortPill />
          </div>
          <Link to="/pricing" className="btn btn-primary btn-lg w-full sm:w-auto">
            See the live cohorts <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
        <div className="min-w-0">
          <div className="overflow-hidden rounded-xl border border-border">
            <img
              src="/images/live-class-zoom.webp"
              alt="Zoom gallery view of a live session: students' video tiles with their names"
              width={1599}
              height={857}
              loading="lazy"
              decoding="async"
              className="block w-full h-auto bg-[#0F1A2A]"
            />
          </div>
          <p className="mt-3 text-[13px] leading-normal text-body">A live session on Zoom</p>
          {/* A drawing of the dashboard's live-session card, not a working button. */}
          <div aria-hidden="true" className="card-flat hidden md:block mt-4 px-5 py-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center flex-shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm leading-snug text-ink">AI Agent Mastery office hours</p>
                <p className="text-xs leading-snug text-body">AI Agent Mastery</p>
              </div>
              <span className="flex-shrink-0 rounded-lg bg-brand px-4 py-2 text-[13px] font-bold leading-none text-white">Join</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Community() {
  return (
    <section className={PAD}>
      <div className={`${INNER} grid lg:grid-cols-[1.45fr_1fr] gap-10 lg:gap-16 items-center`}>
        <div className="min-w-0 order-2 lg:order-1">
          {/* A real screenshot of a room in the student community chat (the AI Agent
              Mastery room: a greeting and the Social Dev Assistant's welcome reply). */}
          <div className="overflow-hidden rounded-xl border border-border">
            <img
              src="/images/community-chat.webp"
              alt="Screenshot of the Community chat in the student dashboard, in the AI Agent Mastery room. A student says hello, and the Social Dev Assistant replies with a welcome and an invitation to ask questions and share progress."
              width={976}
              height={408}
              loading="lazy"
              decoding="async"
              className="block w-full h-auto"
            />
          </div>
          <p className="mt-3 text-[13px] text-body">A room in the student community chat</p>
        </div>
        <div className="min-w-0 order-1 lg:order-2">
          <h2 className="t-section text-ink mb-5">Stuck on a build? Ask in the community chat.</h2>
          <p className="t-lead text-body mb-7 md:mb-9 max-w-[32em]">
            Every student joins our community. Ask a question, share what you've built, and get an answer from
            other students or from us the same day.
          </p>
          <Link to="/pricing" className="btn btn-primary btn-lg w-full sm:w-auto">
            Get started <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function BuildsSection() {
  return (
    <section className={`section-white ${PAD}`}>
      <div className={INNER}>
        <BuildsBrowser builds={publicAgents} />
      </div>
    </section>
  );
}

// For people not ready to pay: a free walkthrough and starter emails (the
// EmailCapture component; signed-in people already have accounts, so it hides
// itself and this section with it).
function FreeBuild() {
  const { user } = useAuth();
  if (user) return null;
  return (
    <section className="pt-16 md:pt-24">
      <div className={`${INNER} max-w-4xl`}>
        <EmailCapture source="home" />
      </div>
    </section>
  );
}

// A solid accent band, full width. It sits directly above the footer's dark
// gradient, so the two never blur together.
function CtaBand() {
  return (
    <section className="bg-yellow mt-16 md:mt-24">
      <div className={`${INNER} py-14 md:py-20 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-14`}>
        <div className="min-w-0 lg:flex-1">
          <h2 className="t-section text-[#0F1A2A]">Ready to start building?</h2>
          <p className="t-lead mt-4 max-w-[30em] text-[#0F1A2A]/80">
            AI Agent Mastery, Vibe Coding, or AI Agent Guides. Every program and price in one place.
          </p>
        </div>
        <Link to="/pricing" className="btn btn-lg w-full lg:w-auto flex-shrink-0 bg-[#0F1A2A] text-white hover:bg-[#1F2C3D]">
          See pricing <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div>
      {/* Under the sticky Navbar (it lives in App.jsx), only while applications are open. */}
      <ScholarshipBar />
      <Hero />
      <FlowShowcase />
      <Programs />

      <section id="mastery" className={`section-white ${PAD_L} scroll-mt-[70px]`}>
        <div className={INNER}>
          <MasterySection />
        </div>
      </section>

      <section className={`section-dark ${PAD_L}`}>
        <div className={INNER}>
          <h2 className="t-section text-ink max-w-[16em]">In their own words</h2>
          <p className="text-base font-semibold text-body mt-4 mb-10 md:mb-14">From an earlier live class on the same kind of build</p>
          <TestimonialQueue />
        </div>
      </section>

      <section className={PAD}>
        <div className={INNER}>
          <VibeProjects />
        </div>
      </section>

      <Instructor />
      <WatchVideo />

      <section className={`section-dark ${PAD}`}>
        <div className={INNER}>
          <HowGuidesWork buildCount={publicAgents.length} />
        </div>
      </section>

      <BeforeYouStart />
      <LiveClasses />
      <Community />
      <BuildsSection />
      <FreeBuild />
      <CtaBand />
    </div>
  );
}
