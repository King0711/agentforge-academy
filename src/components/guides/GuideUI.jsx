import { Link } from 'react-router-dom';
import { ArrowRight, Lightbulb, AlertTriangle, Check } from 'lucide-react';

// Shared building blocks for the /guides section. These are evergreen
// explainer pages (what a given agent is, where it helps, how to run one
// well) — deliberately NOT build instructions; the actual how-to lives in
// the paid Builder session each guide links out to.

export function Section({ id, eyebrow, title, children }) {
  return (
    <section id={id} className="py-9 border-b border-border-soft last:border-none scroll-mt-24">
      {eyebrow && (
        <div className="text-[10px] font-bold uppercase tracking-widest text-brand mb-2">{eyebrow}</div>
      )}
      <h2 className="font-display text-2xl sm:text-[28px] font-extrabold text-ink mb-4" style={{ textWrap: 'balance' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Prose({ children }) {
  return <div className="space-y-4 text-[15.5px] leading-relaxed text-body">{children}</div>;
}

export function Callout({ variant = 'tip', title, children }) {
  const isWarning = variant === 'warning';
  return (
    <div
      className={`flex items-start gap-3 rounded-xl px-4 py-3.5 my-5 ${
        isWarning
          ? 'bg-[#FEF9E7] dark:bg-amber-500/10 border border-amber/30'
          : 'bg-[#F3EBFF] dark:bg-brand/10 border border-brand/20'
      }`}
    >
      {isWarning ? (
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
      ) : (
        <Lightbulb className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
      )}
      <p className="text-[14px] text-body-strong leading-relaxed m-0">
        {title && <strong className="text-ink">{title} </strong>}
        {children}
      </p>
    </div>
  );
}

// A numbered practice with its own explanation — the core unit of the
// "how to run one well" sections.
export function Practice({ n, title, children }) {
  return (
    <div className="flex gap-3.5 py-4 border-b border-border-soft last:border-none">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#F3EBFF] dark:bg-brand/15 text-brand flex items-center justify-center font-display font-extrabold text-[13px] mt-0.5">
        {n}
      </div>
      <div>
        <h3 className="font-display font-bold text-[15.5px] text-ink mb-1">{title}</h3>
        <p className="text-[14.5px] text-body leading-relaxed m-0">{children}</p>
      </div>
    </div>
  );
}

export function DoesList({ items }) {
  return (
    <ul className="flex flex-col gap-2.5 my-4">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5 text-[15px] text-body-strong leading-relaxed">
          <Check className="w-4 h-4 text-green mt-1 flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

// The one commercial element on a guide page: a link through to the paid
// Builder session that actually teaches the build.
export function BuildItCta({ to, sessionTitle, tier, children }) {
  return (
    <div className="mt-8 rounded-2xl border-[1.5px] border-brand/30 bg-[#F8F6FF] dark:bg-brand/10 p-6">
      <div className="text-[10px] font-bold uppercase tracking-widest text-brand mb-2">Build this one</div>
      <p className="text-[15px] text-body leading-relaxed mb-5">{children}</p>
      <Link
        to={to}
        className="inline-flex items-center gap-2 bg-brand hover:bg-brand-deep text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors shadow-[0_6px_16px_rgba(124,58,237,.3)]"
      >
        <span>{sessionTitle} — {tier} session</span>
        <ArrowRight className="w-4 h-4 flex-shrink-0" />
      </Link>
    </div>
  );
}
