import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// The building blocks the public marketing pages share, so they keep the same
// rhythm as the homepage: a dark hero, bands that alternate between light,
// white and solid dark, left-aligned headings, and a solid yellow closing band.
// Nothing here knows about a specific product.

const INNER = 'px-4 sm:px-6 lg:px-[5vw] max-w-7xl mx-auto';

const TONES = {
  light: '',
  white: 'section-white',
  dark: 'section-dark',
};

const SIZES = {
  sm: 'py-12 md:py-16',
  md: 'py-16 md:py-24',
  lg: 'py-20 md:py-32',
};

// One page-wide band. `narrow` keeps a reading-width column for forms and offers.
export function Band({ tone = 'light', size = 'md', narrow = false, id, className = '', children }) {
  return (
    <section id={id} className={`${TONES[tone]} ${SIZES[size]} scroll-mt-20 ${className}`}>
      <div className={`${INNER} ${narrow ? 'max-w-4xl' : ''}`}>{children}</div>
    </section>
  );
}

export function SectionHeading({ children, lead, className = '' }) {
  return (
    <div className={`mb-10 md:mb-14 ${className}`}>
      <h2 className="t-section text-ink max-w-[18em]">{children}</h2>
      {lead && <p className="t-lead text-body mt-5 max-w-[36em]">{lead}</p>}
    </div>
  );
}

// The page's opening: the one place besides the footer that uses the gradient.
// `facts` is a short row of plain statements under the buttons.
export function PageHero({ title, lead, actions, facts = [] }) {
  return (
    <section className="section-dark section-grad pt-14 pb-14 md:pt-24 md:pb-20">
      <div className={INNER}>
        <h1 className="t-title text-white max-w-[16em]">{title}</h1>
        {lead && <p className="text-lg md:text-xl leading-relaxed text-body mt-6 max-w-[34em]">{lead}</p>}
        {actions && <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 mt-8 md:mt-10">{actions}</div>}
        {facts.length > 0 && (
          <ul className="list-none m-0 mt-10 md:mt-14 p-0 pt-6 border-t border-white/20 flex flex-wrap gap-x-10 gap-y-2 text-base font-bold text-white">
            {facts.map((f) => <li key={f}>{f}</li>)}
          </ul>
        )}
      </div>
    </section>
  );
}

// The closing call to action: a solid accent band that sits directly above the
// footer's dark gradient.
export function ClosingBand({ title, text, to, href, label }) {
  const cls = 'btn btn-lg w-full lg:w-auto flex-shrink-0 bg-[#0F1A2A] text-white hover:bg-[#1F2C3D]';
  return (
    <section className="bg-yellow">
      <div className={`${INNER} py-14 md:py-20 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-14`}>
        <div className="min-w-0 lg:flex-1">
          <h2 className="t-section text-[#0F1A2A]">{title}</h2>
          {text && <p className="t-lead mt-4 max-w-[30em] text-[#0F1A2A]/80">{text}</p>}
        </div>
        {to ? (
          <Link to={to} className={cls}>{label} <ArrowRight className="w-5 h-5" /></Link>
        ) : (
          <a href={href} className={cls}>{label} <ArrowRight className="w-5 h-5" /></a>
        )}
      </div>
    </section>
  );
}
