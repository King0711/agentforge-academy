import { useState } from 'react';
import { Clock, Layers, Bot, Target, ListChecks, CheckCircle2, Compass, Award, ChevronDown } from 'lucide-react';
import PromptBox from './PromptBox';

export default function SessionGuide({ session }) {
  return (
    <div className="space-y-8">
      {/* Session header */}
      <div className="rounded-xl border border-[#0067B8]/30 bg-gradient-to-br from-[#0067B8]/15 to-transparent p-4 flex flex-wrap gap-3">
        <Badge icon={Clock} label={`${session.totalTime} total`} />
        <Badge icon={Layers} label={`${session.buildCount} builds`} />
        <Badge icon={Bot} label={session.model} />
      </div>

      {/* By the end of this session */}
      <section>
        <SectionTitle icon={Target} title="By the end of this session" />
        <ul className="space-y-1.5">
          {session.outcomes.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* What you need */}
      <section>
        <SectionTitle icon={ListChecks} title="What you need" />
        <ul className="space-y-1.5">
          {session.whatYouNeed.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-2 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      {/* Builds */}
      <div className="space-y-6">
        {session.builds.map((build) => (
          <BuildCard key={build.number} build={build} />
        ))}
      </div>

      {/* Portfolio tie-in */}
      {session.portfolio && (
        <section className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
          <SectionTitle icon={Award} title="Add this to your portfolio" />
          <p className="text-sm text-slate-300 leading-relaxed">{session.portfolio}</p>
          {session.portfolioPrompt && <PortfolioPromptDropdown prompt={session.portfolioPrompt} />}
        </section>
      )}
    </div>
  );
}

function PortfolioPromptDropdown({ prompt }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 text-sm font-semibold text-amber-300 hover:text-amber-200 transition-colors"
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        Need help writing it up? Use this prompt
      </button>
      {open && (
        <div className="mt-2">
          <PromptBox text={prompt} />
        </div>
      )}
    </div>
  );
}

function BuildCard({ build }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-white/10 bg-white/[0.02]">
        <h4 className="font-bold text-white text-sm sm:text-base">
          Build {build.number} · {build.title}
        </h4>
        <span className="flex items-center gap-1 text-xs font-semibold text-slate-400 flex-shrink-0">
          <Clock className="w-3.5 h-3.5" /> {build.time}
        </span>
      </div>

      <div className="px-4 sm:px-5 py-4 space-y-5">
        {build.description && (
          <p className="text-sm text-slate-400">{build.description}</p>
        )}

        {build.steps.map((step, i) => (
          <div key={i} className="space-y-2">
            <p className="text-sm text-slate-200 leading-relaxed">
              <span className="font-bold text-[#3FA9F5]">{i + 1}.</span> {step.instruction}
            </p>
            {step.prompt && <PromptBox text={step.prompt} />}
            {step.verify && (
              <div className="flex gap-2 items-start text-sm text-emerald-300/90 bg-emerald-400/10 border border-emerald-400/20 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><span className="font-bold">Check your work: </span>{step.verify}</span>
              </div>
            )}
          </div>
        ))}

        {build.goFurther && (
          <div className="flex gap-2 items-start text-sm text-purple-300/90 bg-purple-400/10 border border-purple-400/20 rounded-lg px-3 py-2">
            <Compass className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span><span className="font-bold">Go further: </span>{build.goFurther}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ icon: Icon, label }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-bold text-[#3FA9F5] bg-[#0067B8]/15 border border-[#0067B8]/30 rounded-full px-3 py-1.5">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-[#0067B8]" />
      <h3 className="font-bold text-white text-sm uppercase tracking-wide">{title}</h3>
    </div>
  );
}
