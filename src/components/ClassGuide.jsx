import { Clock, Target, Lightbulb, MessageSquareText, Code, CheckCircle2, LifeBuoy, Rocket, ClipboardList } from 'lucide-react';
import PromptBox from './PromptBox';

// One Vibe Coding class's student guide, from vibecoding_class_guides
// (supabase/vibecoding-class-guides.sql, generated from
// scripts/vibe-class-guides/guides.py). Every section is optional so a
// partly-filled guide still renders.

function SectionTitle({ icon: Icon, children }) {
  return (
    <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-link mb-2.5">
      <Icon className="w-3.5 h-3.5" /> {children}
    </p>
  );
}

export default function ClassGuide({ guide }) {
  if (!guide) return null;
  const { focus, agenda, ideas, prompts, steps, checks, ifStuck, stretch, assignment } = guide;

  return (
    <div className="mt-8 pt-6 border-t border-border-soft flex flex-col gap-7">
      {focus && (
        <div>
          <SectionTitle icon={Target}>Today's focus</SectionTitle>
          <p className="text-sm text-body-strong leading-relaxed">{focus}</p>
        </div>
      )}

      {agenda?.length > 0 && (
        <div>
          <SectionTitle icon={Clock}>How the class runs</SectionTitle>
          <ol className="list-none m-0 p-0 flex flex-col gap-2.5">
            {agenda.map((a) => (
              <li key={a.title} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-14 text-xs font-bold text-body-strong bg-[#F6F8FB] dark:bg-white/5 rounded-lg px-2 py-1 text-center">
                  {a.min} min
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink">{a.title}</p>
                  {a.detail && <p className="text-[13px] text-body mt-0.5">{a.detail}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {ideas?.length > 0 && (
        <div>
          <SectionTitle icon={Lightbulb}>Key ideas</SectionTitle>
          <dl className="m-0 flex flex-col gap-3">
            {ideas.map((i) => (
              <div key={i.term}>
                <dt className="text-[13px] font-semibold text-ink">{i.term}</dt>
                <dd className="m-0 text-[13px] text-body leading-relaxed mt-0.5">{i.text}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {prompts?.length > 0 && (
        <div>
          <SectionTitle icon={MessageSquareText}>Prompts for this class</SectionTitle>
          <div className="flex flex-col gap-4">
            {prompts.map((p) => (
              <div key={p.title}>
                <p className="text-[13px] font-semibold text-ink mb-1.5">{p.title}</p>
                <PromptBox text={p.text} variant="prompt" />
              </div>
            ))}
          </div>
        </div>
      )}

      {steps?.length > 0 && (
        <div>
          <SectionTitle icon={Code}>Build it step by step</SectionTitle>
          <div className="flex flex-col gap-5">
            {steps.map((s) => (
              <div key={s.title}>
                <p className="text-[13px] font-semibold text-ink">{s.title}</p>
                {s.note && <p className="text-[13px] text-body mt-0.5 mb-1.5">{s.note}</p>}
                <PromptBox text={s.code} variant={s.file === 'Checklist' ? 'example' : 'code'} />
                {s.file && s.file !== 'Checklist' && <p className="text-[11px] text-gray-400 mt-1">{s.file}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {checks?.length > 0 && (
        <div>
          <SectionTitle icon={CheckCircle2}>What a working result looks like</SectionTitle>
          <ul className="list-none m-0 p-0 flex flex-col gap-1.5">
            {checks.map((c) => (
              <li key={c} className="flex items-start gap-2 text-[13px] text-body-strong">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green flex-shrink-0" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {ifStuck && (
        <div className="rounded-xl bg-[#F6F8FB] dark:bg-white/5 border border-border-soft px-4 py-3.5">
          <SectionTitle icon={LifeBuoy}>If it doesn't work</SectionTitle>
          <p className="text-[13px] text-body-strong leading-relaxed">{ifStuck}</p>
        </div>
      )}

      {stretch?.length > 0 && (
        <div>
          <SectionTitle icon={Rocket}>Stretch goals</SectionTitle>
          <ul className="m-0 pl-5 flex flex-col gap-1">
            {stretch.map((s) => (
              <li key={s} className="text-[13px] text-body-strong">{s}</li>
            ))}
          </ul>
        </div>
      )}

      {assignment?.length > 0 && (
        <div>
          <SectionTitle icon={ClipboardList}>Before next class</SectionTitle>
          <ul className="m-0 pl-5 flex flex-col gap-1.5">
            {assignment.map((a) => (
              <li key={a} className="text-[13px] text-body-strong leading-relaxed">{a}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
