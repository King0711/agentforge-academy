// Share copy for a news article or a guide — the publishing-side twin of
// generateShareText.js (which does the same job for a student's finished
// build). Template-based for the same reasons stated there: no API cost, no
// new secret, instant.
//
// The LinkedIn shape is deliberate and is the whole point of this file.
// LinkedIn demotes posts carrying an outbound link in the body, so the copy
// is split: `linkedin` is a native post with NO url in it, and
// `linkedinComment` is the link, meant to go in the first comment. Posting
// them as one blob undoes the reason this exists.

const SITE_URL = 'https://socialdevtechnologies.com';

/**
 * Shareable URL with UTM tags, so GA4 can attribute catalog/pricing visits
 * back to the platform that drove them instead of lumping it all into
 * "direct". Every share path should use this rather than a bare url.
 *
 * utm_campaign is the section, not a constant: news and guides pull
 * different audiences and convert differently, and one shared campaign name
 * would average the two into a number that describes neither.
 *
 * @param {'news'|'guides'} section
 */
export function shareUrl(section, slug, source) {
  return `${SITE_URL}/${section}/${slug}?utm_source=${source}&utm_medium=social&utm_campaign=${section}`;
}

/** News-specific shorthand — the copy templates below are news-only. */
export function articleUrl(slug, source) {
  return shareUrl('news', slug, source);
}

// Departments are business functions, not audiences — "what this means for
// Executive / Strategy" reads like an org chart. These are how a person
// would actually describe the reader.
const AUDIENCE = {
  sales: 'sales teams',
  marketing: 'marketing teams',
  operations: 'operations teams',
  finance: 'finance teams',
  hr: 'HR teams',
  legal: 'legal and compliance teams',
  support: 'customer support teams',
  engineering: 'engineering teams',
  data: 'data teams',
  strategy: 'founders and business owners',
};

/**
 * @param {object} article  news_articles row (title, dek, slug, department_ids, source_name)
 * @param {object|null} relatedAgent  catalog agent from related_agent_slug, if any
 */
export function generateArticleShareText({ article, relatedAgent }) {
  const { title, dek, slug, source_name: sourceName } = article;
  const deptId = (article.department_ids || []).find((id) => AUDIENCE[id]);
  const audience = deptId ? AUDIENCE[deptId] : 'people building with AI';

  // The hook has to carry the post on its own: LinkedIn clips everything
  // after roughly the first two lines behind "…see more", and that preview
  // is the entire decision the reader makes.
  const hook = `What this means for ${audience}:`;

  const buildLine = relatedAgent
    ? `This is exactly what our ${relatedAgent.title} session teaches you to build — not to use, to build.`
    : "If you'd rather build the tools than just read about them, that's the whole point of what we teach.";

  const linkedin = [
    hook,
    '',
    title,
    '',
    dek,
    '',
    buildLine,
    '',
    'Full breakdown in the comments 👇',
    '',
    '#AI #ArtificialIntelligence #AIAgents #Africa #SocialDevTechnologies',
  ].join('\n');

  const linkedinComment = `Read the full piece here: ${articleUrl(slug, 'linkedin')}\n\n(Source: ${sourceName})`;

  const x = [
    title,
    '',
    dek,
    '',
    articleUrl(slug, 'twitter'),
  ].join('\n');

  const whatsapp = [
    `*${title}*`,
    '',
    dek,
    '',
    articleUrl(slug, 'whatsapp'),
  ].join('\n');

  const facebook = [
    `${hook} ${title}`,
    '',
    dek,
    '',
    buildLine,
    '',
    articleUrl(slug, 'facebook'),
  ].join('\n');

  return { linkedin, linkedinComment, x, whatsapp, facebook };
}

/**
 * Share copy for a guide.
 *
 * Separate from generateArticleShareText because guides are a different
 * kind of post, not a different topic. News is "this happened, here's what
 * it means for you"; a guide is evergreen and answers a question the reader
 * already has ("What is an AI agent?"). Reusing the news template would
 * open every guide post with a news hook for something that isn't news —
 * and guides carry no source_name or department_ids to build one from
 * anyway.
 *
 * @param {object} guide  guides row (title, dek, slug, category)
 * @param {object|null} relatedAgent  catalog agent from related_agent_slug
 */
export function generateGuideShareText({ guide, relatedAgent }) {
  const { title, dek, slug, category } = guide;

  // The two categories are genuinely different promises: an agent-guide
  // explains a thing you could build, a how-to walks you through doing
  // something. Opening both the same way undersells one of them.
  const hook = category === 'how-to'
    ? 'A practical walkthrough, written for people with no technical background:'
    : 'Plain English, no jargon, no hype:';

  const buildLine = relatedAgent
    ? `And if you'd rather build one than read about one — that's exactly what our ${relatedAgent.title} session walks you through, step by step.`
    : 'Everything we publish assumes you have no coding background. That is deliberate.';

  const linkedin = [
    hook,
    '',
    title,
    '',
    dek,
    '',
    buildLine,
    '',
    'Full guide in the comments 👇',
    '',
    '#AI #ArtificialIntelligence #AIAgents #Africa #SocialDevTechnologies',
  ].join('\n');

  const linkedinComment = `Read the full guide here: ${shareUrl('guides', slug, 'linkedin')}`;

  const x = [title, '', dek, '', shareUrl('guides', slug, 'twitter')].join('\n');

  const whatsapp = [`*${title}*`, '', dek, '', shareUrl('guides', slug, 'whatsapp')].join('\n');

  const facebook = [
    title,
    '',
    dek,
    '',
    buildLine,
    '',
    shareUrl('guides', slug, 'facebook'),
  ].join('\n');

  return { linkedin, linkedinComment, x, whatsapp, facebook };
}
