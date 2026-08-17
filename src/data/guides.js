// Registry for the /guides section — evergreen explainer pages about the
// agents the course teaches ("what is it, where does it help, how do you run
// one well"), as opposed to /news (timely, dated) or the Builder session
// pages (the paid how-to).
//
// Each entry needs a matching route + page component in src/pages/guides/ and
// an entry in scripts/prerender-routes.mjs and public/sitemap.xml — this list
// only drives the /guides index page.
export const guides = [
  {
    slug: 'gmail-ai-triage-agent',
    title: 'What is a Gmail AI triage agent?',
    dek: 'An agent that sorts your inbox before you open it — what it does, where it earns its place in a business, and what separates one that works from one you switch off after a week.',
    emoji: '📧',
    readingTime: '6 min read',
    relatedAgentSlug: 'gmail-ai-triage-agent',
  },
];

export const getGuideBySlug = (slug) => guides.find((g) => g.slug === slug);
