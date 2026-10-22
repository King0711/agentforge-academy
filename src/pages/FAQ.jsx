import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus } from 'lucide-react';
import { Band, PageHero } from '../components/page/MarketingParts';

const FAQS = [
  {
    q: 'Do I need coding experience to start?',
    a: 'No. Builder 1 assumes no prior coding experience — sessions walk through copy-paste prompts and step-by-step setup. Builder 2 builds on that with more advanced, multi-step, API-integrated agents.',
  },
  {
    q: 'What do I need to follow along with the AI Agent Guides?',
    a: 'A free Gemini API key from Google AI Studio — no paid AI subscription required. Beyond that, just the free tools each session connects to (Gmail, Slack, Notion, etc., depending on the build). AI Agent Mastery is different — see the questions below.',
  },
  {
    q: 'Is access instant?',
    a: 'For the AI Agent Guides, yes. Buying a plan unlocks your sessions immediately and it\'s fully self-paced, permanent access — no cohort or start date to wait for. AI Agent Mastery and the Vibe Coding Bootcamp are live cohorts, so they start on the next class date instead.',
  },
  {
    q: 'How long does my access last?',
    a: 'Every AI Agent Guides plan — Builder 1, Builder 2, or Pro — is a one-time payment for permanent access. There\'s no expiry, no auto-renewal, and nothing recurring to remember to cancel. AI Agent Mastery is also a one-time payment, with 6 months of access to its classes, recordings, and resources.',
  },
  {
    q: 'What\'s the refund policy?',
    a: 'Because a purchase unlocks full access to every session in that tier immediately, there generally isn\'t a change-your-mind window once you\'ve bought a plan. If something went wrong with your payment or account, email support@socialdevtechnologies.com and we\'ll sort it out.',
  },
  {
    q: 'Do I have to do Builder 1 before Builder 2?',
    a: 'Builder 2 is designed to build on Builder 1\'s foundations, so that\'s the recommended order — but nothing technically stops you from starting with Builder 2, or getting both at once with Pro.',
  },
  {
    q: 'What is AI Agent Mastery, and how is it different from the guides?',
    a: 'AI Agent Mastery is a live cohort where you build a team of AI agents: a chief of staff you message from your phone, plus specialist agents for research, design, images, and coding and video, all working on a shared board. It runs over 3 live evenings, with the third dedicated to monetizing the skill. The guides are self-paced builds of individual agents with permanent access.',
  },
  {
    q: 'When are the AI Agent Mastery classes?',
    a: 'Classes are three live evenings at 7:00 PM WAT, on Zoom. Message us on WhatsApp for the next start date. Recordings are included if you miss a class.',
  },
  {
    q: 'Do I need to pay for any tools for AI Agent Mastery?',
    a: 'No. Everything we use in class is free, and we tell you exactly what to set up before the first class.',
  },
  {
    q: 'Do I get a certificate?',
    a: 'Yes. Completing sessions earns XP, and at defined proficiency thresholds you get an auto-issued certificate with a public verification link — no extra request needed.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'Payments are processed securely by Paystack. Bank transfer, USSD, mobile money, and Visa/Mastercard are all accepted.',
  },
  {
    q: 'I\'m stuck on a build — what do I do?',
    a: 'Reach us on WhatsApp (wa.me/2349066006963) or email support@socialdevtechnologies.com. Each session also has a troubleshooting section for common issues.',
  },
  {
    q: 'Is this only for people already working in tech?',
    a: 'No — sessions span Sales, Marketing, Operations, Finance, HR, Legal, Customer Support, Engineering, Data, and Strategy. It\'s built for professionals automating their own work, not just developers.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    const prevTitle = document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute('content');

    document.title = 'FAQ — Social Dev Technologies';
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Common questions about Social Dev Technologies — pricing, access, refunds, certificates, live AI Agent Mastery classes, and what you need to get started building AI agents.'
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
    canonicalEl.setAttribute('href', 'https://socialdevtechnologies.com/faq');

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc) metaDesc.setAttribute('content', prevDesc);
      if (hadCanonical && prevCanonical) canonicalEl.setAttribute('href', prevCanonical);
      else canonicalEl.remove();
    };
  }, []);

  // FAQPage structured data — eligible for FAQ rich results in Google Search.
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
    document.head.appendChild(script);
    return () => script.remove();
  }, []);

  return (
    <div>
      <PageHero
        title="Frequently asked questions"
        lead="Straight answers about access, payment and what you need before you start."
      />

      <Band narrow>
        <div className="border-b border-border">
          {FAQS.map((f, i) => {
            const open = openIndex === i;
            return (
              <div key={f.q} className="border-t border-border">
                <button
                  onClick={() => setOpenIndex(open ? -1 : i)}
                  aria-expanded={open}
                  className="w-full flex items-center justify-between gap-6 py-6 text-left"
                >
                  <span className="font-display font-extrabold text-lg lg:text-xl leading-snug tracking-[-0.01em] text-ink">{f.q}</span>
                  {open ? <Minus className="w-5 h-5 text-link flex-shrink-0" /> : <Plus className="w-5 h-5 text-link flex-shrink-0" />}
                </button>
                {open && <p className="t-body text-body pb-7 pr-10 m-0">{f.a}</p>}
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3">
          <p className="text-lg font-bold text-ink m-0">Still have questions?</p>
          <a href="https://wa.me/2349066006963" target="_blank" rel="noreferrer" className="btn btn-secondary">
            Message us on WhatsApp
          </a>
          <Link to="/" className="font-bold text-link hover:underline underline-offset-4">Back to home</Link>
        </div>
      </Band>
    </div>
  );
}
