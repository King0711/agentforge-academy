import { Link, useNavigate } from 'react-router-dom';
import AgentCard from '../components/AgentCard';
import TestimonialsSection from '../components/TestimonialsSection';
import { agents } from '../data/agents';
import { departments, isVisibleToPublic } from '../data/departments';
import { usePro } from '../hooks/usePro';

const TECH_MARQUEE = ['PYTHON', 'CLAUDE API', 'GMAIL API', 'SLACK', 'SUPABASE', 'NOTION'];

// Advanced/World Class are admin-only — every public-facing count and grid
// on this marketing page is based on the public catalog only.
const publicAgents = agents.filter((a) => isVisibleToPublic(a.difficulty));

const HOW_IT_WORKS = [
  { num: 1, bg: '#7C3AED', fg: '#fff', title: 'Pick a session', text: `${publicAgents.length} guided builds across Builder 1 and Builder 2. Each has a time estimate and clear outcomes.` },
  { num: 2, bg: '#F5D90A', fg: '#1A1333', title: 'Paste into Claude', text: 'Every build ships ready-to-use prompts. No blank page — open Claude, paste, iterate.' },
  { num: 3, bg: '#16A34A', fg: '#fff', title: 'Ship to portfolio', text: 'Each session ends with a write-up prompt: LinkedIn post, resume bullets, project blurb.' },
];

const totalXP = publicAgents.reduce((sum, a) => sum + a.xp, 0);
const totalHours = Math.round(publicAgents.reduce((sum, a) => sum + parseFloat(a.buildTime), 0));
const realDepartments = departments.filter((d) => d.id !== 'all');

export default function Home({ progress, onSelectAgent }) {
  const { hasBuilder1, hasBuilder2, isAdmin } = usePro();
  const navigate = useNavigate();

  const popularAgents = [...publicAgents].sort((a, b) => b.xp - a.xp).slice(0, 4);

  return (
    <div>
      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden pt-14 pb-14 px-4 sm:px-6 lg:px-[5vw]"
        style={{ background: 'radial-gradient(120% 100% at 85% 0%, #F3EBFF 0%, #FBFAFF 55%)' }}
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
            <span className="inline-flex items-center gap-2 bg-white border-[1.5px] border-border text-brand font-bold text-[12.5px] px-4 py-2 rounded-full shadow-[0_3px_10px_rgba(124,58,237,.1)]">
              🚀 Learn by building real agents
            </span>
            <h1 className="font-display font-extrabold text-[40px] sm:text-[54px] leading-[1.04] text-ink tracking-[-1px] sm:tracking-[-1.5px] mt-5">
              Build real AI agents.<br />
              <span className="text-brand">Earn XP.</span>{' '}
              <span className="inline-block bg-yellow px-2.5 rounded-lg -rotate-[1.5deg]">Level up.</span>
            </h1>
            <p className="text-[17px] leading-relaxed text-body mt-5 mb-7 max-w-[480px]">
              {publicAgents.length} guided build sessions across every department. Copy-paste prompts, step-by-step builds, and a portfolio write-up — so you ship something real every session.
            </p>
            <div className="flex gap-3.5 items-center flex-wrap">
              <Link
                to="/pricing"
                className="bg-brand text-white font-bold text-base px-7 py-[15px] rounded-2xl shadow-[0_10px_22px_rgba(124,58,237,.4)] hover:bg-brand-deep transition-colors"
              >
                Get started →
              </Link>
              <Link
                to="/catalog"
                className="bg-white border-[1.5px] border-[#E0D6F5] text-body-strong font-bold text-base px-6.5 py-[15px] rounded-2xl hover:bg-[#FAF8FF] transition-colors"
              >
                Browse catalog
              </Link>
            </div>
          </div>

          <div className="relative hidden sm:block">
            <div className="ph h-[320px] rounded-[22px] shadow-[0_24px_50px_-18px_rgba(80,40,160,.4)]">
              learner building at laptop<br />(hero photo, 620×700)
            </div>
            <div className="absolute -top-4.5 -left-6 bg-white rounded-2xl px-4 py-3 shadow-[0_12px_26px_rgba(80,40,160,.22)] animate-floaty2 flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[10px] bg-[#ECFDF5] flex items-center justify-center text-lg">✅</div>
              <div>
                <div className="font-display font-extrabold text-sm text-ink">Agent shipped!</div>
                <div className="text-[11.5px] text-green font-bold">+300 XP earned</div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4.5 bg-brand text-white rounded-2xl px-4 py-3 shadow-[0_12px_26px_rgba(124,58,237,.4)] animate-floaty" style={{ animationDelay: '.8s' }}>
              <div className="text-[11px] opacity-85 font-semibold">Your level</div>
              <div className="font-display font-extrabold text-base">🔨 Builder</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tech marquee ── */}
      <div className="bg-ink py-4 overflow-hidden whitespace-nowrap">
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
        <div className="bg-[#F3EBFF] rounded-[18px] px-5 py-5.5 text-center">
          <div className="font-display font-extrabold text-[34px] text-brand">{publicAgents.length}</div>
          <div className="text-[13px] text-body font-semibold mt-0.5">AI Agents</div>
        </div>
        <div className="bg-[#FEF9E7] rounded-[18px] px-5 py-5.5 text-center">
          <div className="font-display font-extrabold text-[34px] text-[#D9A406]">{realDepartments.length}</div>
          <div className="text-[13px] text-body font-semibold mt-0.5">Departments</div>
        </div>
        <div className="bg-[#EAFAF1] rounded-[18px] px-5 py-5.5 text-center">
          <div className="font-display font-extrabold text-[34px] text-green">{Math.round(totalXP / 1000)}k+</div>
          <div className="text-[13px] text-body font-semibold mt-0.5">XP Available</div>
        </div>
        <div className="bg-[#FDEEF4] rounded-[18px] px-5 py-5.5 text-center">
          <div className="font-display font-extrabold text-[34px] text-rose">{totalHours}+</div>
          <div className="text-[13px] text-body font-semibold mt-0.5">Hours of content</div>
        </div>
      </div>

      {/* ── How it works ── */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pt-5 pb-11 max-w-6xl mx-auto">
        <h2 className="font-display font-extrabold text-[30px] text-ink tracking-[-.8px] text-center m-0">How it works</h2>
        <p className="text-center text-body mt-2 mb-7">Three steps from zero to portfolio-ready agent</p>
        <div className="grid sm:grid-cols-3 gap-5">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.num} className="bg-white border-[1.5px] border-border-soft rounded-[20px] p-6.5">
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

      <TestimonialsSection />

      {/* ── Pricing CTA band ── */}
      <div className="px-4 sm:px-6 lg:px-[5vw] pb-14 max-w-6xl mx-auto">
        <div
          className="rounded-[24px] px-8 sm:px-10 py-9 flex items-center justify-between flex-wrap gap-5 shadow-[0_20px_44px_-16px_rgba(124,58,237,.6)]"
          style={{ background: 'linear-gradient(120deg, #7C3AED, #9D5CFF)' }}
        >
          <div>
            <h2 className="font-display font-extrabold text-2xl sm:text-[26px] text-white m-0">Unlock all {publicAgents.length} sessions</h2>
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
