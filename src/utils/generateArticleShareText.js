// Share copy for a news article — the article-side twin of
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
