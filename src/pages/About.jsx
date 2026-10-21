import { useEffect } from 'react';
import { Band, ClosingBand, PageHero, SectionHeading } from '../components/page/MarketingParts';
import { agents } from '../data/agents';
import { departments, isVisibleToPublic } from '../data/departments';

const publicAgents = agents.filter((a) => isVisibleToPublic(a.difficulty));
const realDepartments = departments.filter((d) => d.id !== 'all');
const totalHours = Math.round(publicAgents.reduce((sum, a) => sum + parseFloat(a.buildTime), 0));

const PRINCIPLES = [
  {
    title: 'Build, don\'t just watch',
    text: 'Every session ships a working agent, not a passive video. You paste real prompts into Claude and connect real tools — Gmail, Slack, Notion — not a simulated sandbox.',
  },
  {
    title: 'Portfolio over certificates',
    text: 'Each session ends with a write-up prompt — a LinkedIn post, a resume bullet, a project blurb — so what you build is something you can actually show, not just a badge.',
  },
  {
    title: 'Priced for where we teach',
    text: 'One-time payments, not recurring subscriptions you forget to cancel. Built with African students and career-switchers in mind, not priced like a Silicon Valley bootcamp.',
  },
  {
    title: 'Real support, not a forum you\'ll never check',
    text: 'Stuck on a build? You can reach us directly — this isn\'t a self-serve library you\'re left alone with.',
  },
];

export default function About() {
  useEffect(() => {
    const prevTitle = document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute('content');

    document.title = 'About — Social Dev Technologies';
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Why Social Dev Technologies teaches AI agent building through hands-on sessions instead of passive video courses — our approach, principles, and who it\'s for.'
      );
    }

    let canonicalEl = document.querySelector('link[rel="canonical"]');
    const hadCanonical = Boolean(canonicalEl);
    const prevCanonical = canonicalEl?.getAttribute('href');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', 'https://socialdevtechnologies.com/about');

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc) metaDesc.setAttribute('content', prevDesc);
      if (hadCanonical && prevCanonical) canonicalEl.setAttribute('href', prevCanonical);
      else canonicalEl.remove();
    };
  }, []);

  return (
    <div>
      <PageHero
        title="AI skills you actually ship, not just watch."
        lead="Most &quot;learn AI&quot; content is a video explaining what a prompt is. We built Social Dev Technologies because the gap isn't understanding AI conceptually. It's never having built anything real with it. So every session here is a guided, hands-on build: a real integration, a real output, a real thing you can put in your portfolio."
      />

      <Band tone="white" size="sm">
        <dl className="m-0 grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8">
          <Stat value={publicAgents.length} label="Guided sessions" />
          <Stat value={realDepartments.length} label="Departments covered" />
          <Stat value={`${totalHours}+`} label="Hours of content" />
          <Stat value="Forever" label="Guide access, no expiry" />
        </dl>
      </Band>

      <Band>
        <SectionHeading>What we believe</SectionHeading>
        <ul className="list-none m-0 p-0 grid md:grid-cols-2 gap-x-16 gap-y-10">
          {PRINCIPLES.map((p) => (
            <li key={p.title} className="rule-node pt-6">
              <h3 className="font-display font-extrabold text-2xl leading-tight tracking-[-0.02em] text-ink mb-3">{p.title}</h3>
              <p className="t-body text-body m-0">{p.text}</p>
            </li>
          ))}
        </ul>
      </Band>

      <ClosingBand
        title="Ready to build your first agent?"
        text={<>Browse all <span>{publicAgents.length}</span> sessions and pick where to start.</>}
        to="/catalog"
        label="Browse catalog"
      />
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div className="rule-node pt-5">
      <dd className="t-num m-0 text-5xl lg:text-7xl text-link">{value}</dd>
      <dt className="text-base font-semibold text-body mt-2">{label}</dt>
    </div>
  );
}
