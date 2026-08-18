// Registry for the /guides section — evergreen explainer pages about the
// agents the course teaches ("what is it, where does it help, how do you run
// one well"), as opposed to /news (timely, dated) or the Builder session
// pages (the paid how-to).
//
// Structured as a hub and spokes: 'what-is-an-ai-agent' is the broad
// top-of-funnel explainer that links out to every specific agent guide, and
// each specific guide links back to it. That shape concentrates the section's
// internal links instead of leaving each page isolated.
//
// Each entry needs a matching route + page component in src/pages/guides/ and
// an entry in scripts/prerender-routes.mjs and public/sitemap.xml — this list
// only drives the /guides index and the cross-links between guides.
export const guides = [
  {
    slug: 'what-is-an-ai-agent',
    title: 'What is an AI agent? A plain-English guide for business owners',
    dek: 'No jargon, no hype — what an AI agent actually is, how it differs from a chatbot, the jobs businesses genuinely use them for, and how to tell a useful one from an expensive toy.',
    emoji: '🧠',
    readingTime: '9 min read',
    isHub: true,
    relatedAgentSlug: null,
  },
  {
    slug: 'whatsapp-auto-reply-bot',
    title: 'What is a WhatsApp auto-reply bot?',
    dek: 'A bot that answers customer messages day and night in your business voice. What one actually does, why WhatsApp matters more in Nigeria than almost anywhere else, and the rules that keep it from costing you customers.',
    emoji: '💬',
    readingTime: '8 min read',
    relatedAgentSlug: 'whatsapp-auto-reply-bot',
  },
  {
    slug: 'gmail-ai-triage-agent',
    title: 'What is a Gmail AI triage agent?',
    dek: 'An agent that sorts your inbox before you open it — what it does, where it earns its place in a business, and what separates one that works from one you switch off after a week.',
    emoji: '📧',
    readingTime: '6 min read',
    relatedAgentSlug: 'gmail-ai-triage-agent',
  },
  {
    slug: 'ai-lead-qualification',
    title: 'What is AI lead qualification?',
    dek: 'Most businesses lose deals to slow follow-up, not bad leads. Here is what an AI qualification agent scores, how it decides who to chase first, and how to set one up without letting it bin your best customer.',
    emoji: '🎯',
    readingTime: '8 min read',
    relatedAgentSlug: 'lead-capture-qualifier-bot',
  },
  {
    // Not tied to one bot/session — a technique guide, not an agent guide.
    // Its BuildItCta points broadly at the catalog rather than one session
    // (BuildItCta's `tier` prop is optional for exactly this case — see
    // WhatIsAnAiAgent.jsx for the same pattern).
    slug: 'brainstorming-with-ai',
    title: 'How to Brainstorm with AI: Practical Techniques for Study, Business, and Work',
    dek: 'Five real brainstorming techniques you can run with Claude or ChatGPT — plus an interactive prompt generator — for schoolwork, business ideas, and everyday problem-solving.',
    emoji: '💡',
    readingTime: '10 min read',
    relatedAgentSlug: null,
  },
];

export const getGuideBySlug = (slug) => guides.find((g) => g.slug === slug);
