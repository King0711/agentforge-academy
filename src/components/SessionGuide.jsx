import { useState } from 'react';
import { Clock, Layers, Bot, Sparkles, ListChecks, CheckCircle2, Compass, Award, ChevronDown, AlertTriangle, Wrench } from 'lucide-react';
import PromptBox from './PromptBox';

export default function SessionGuide({ session, troubleshooting }) {
  return (
    <div className="space-y-8">
      {/* Session header */}
      <div className="rounded-xl border border-brand/25 bg-[#F3EBFF] p-4 flex flex-wrap gap-3">
        <Badge icon={Clock} label={`${session.totalTime} total`} />
        <Badge icon={Layers} label={`${session.buildCount} builds`} />
        <Badge icon={Bot} label={session.model} />
      </div>

      {/* By the end of this session — highlighted deliverables box */}
      <section className="rounded-xl border-[1.5px] border-green/25 bg-[#EAFAF1] p-5">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-green mb-3">
          <Sparkles className="w-4 h-4" /> By the end of this session
        </p>
        <ul className="space-y-2">
          {session.outcomes.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-body-strong">
              <CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" />
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
            <li key={item} className="flex items-start gap-2 text-sm text-body">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
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

      {/* Troubleshooting — common issues + fixes, grounded in this build's actual tech */}
      {troubleshooting?.length > 0 && (
        <section id="troubleshooting">
          <SectionTitle icon={Wrench} title="Troubleshooting" />
          <div className="space-y-2.5">
            {troubleshooting.map((t) => (
              <div key={t.issue} className="flex gap-2.5 items-start text-sm bg-[#FEF9E7] border border-amber/25 rounded-lg px-3.5 py-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-bold text-ink">{t.issue}</p>
                  <p className="text-body mt-0.5">{t.fix}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Portfolio tie-in */}
      {session.portfolio && (
        <section id="portfolio" className="rounded-xl border border-amber/25 bg-[#FEF9E7] p-4">
          <SectionTitle icon={Award} title="Add this to your portfolio" />
          <p className="text-sm text-body leading-relaxed">{session.portfolio}</p>
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
        className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-600 transition-colors"
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
    <div id={`build-${build.number}`} className="rounded-xl border border-border-soft bg-white overflow-hidden scroll-mt-24">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-border-soft bg-[#FAF8FF]">
        <h4 className="font-bold text-ink text-sm sm:text-base">
          Build {build.number} · {build.title}
        </h4>
        <span className="flex items-center gap-1 text-xs font-semibold text-body flex-shrink-0">
          <Clock className="w-3.5 h-3.5" /> {build.time}
        </span>
      </div>

      <div className="px-4 sm:px-5 py-4 space-y-5">
        {build.description && (
          <p className="text-sm text-body">{build.description}</p>
        )}

        {build.steps.map((step, i) => (
          <div key={i} className="space-y-2">
            <p className="text-sm text-body-strong leading-relaxed">
              <span className="font-bold text-brand">{i + 1}.</span> {step.instruction}
            </p>
            {step.prompt && <PromptBox text={step.prompt} />}
            {step.verify && (
              <div className="flex gap-2 items-start text-sm text-green bg-[#EAFAF1] border border-green/20 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span><span className="font-bold">Check your work: </span>{step.verify}</span>
              </div>
            )}
          </div>
        ))}

        {build.goFurther && (
          <div className="flex gap-2 items-start text-sm text-brand bg-[#F3EBFF] border border-brand/20 rounded-lg px-3 py-2">
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
    <span className="flex items-center gap-1.5 text-xs font-bold text-brand bg-white border border-brand/25 rounded-full px-3 py-1.5">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-brand" />
      <h3 className="font-bold text-ink text-sm uppercase tracking-wide">{title}</h3>
    </div>
  );
}
