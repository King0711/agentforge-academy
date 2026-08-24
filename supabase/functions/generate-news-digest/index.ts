import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Parser from 'https://esm.sh/rss-parser@3';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/socialdevtechnologies\.com$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  /^http:\/\/localhost:\d+$/,
];

function corsHeadersFor(req) {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = ALLOWED_ORIGIN_PATTERNS.some((p) => p.test(origin));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://socialdevtechnologies.com',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

const DEPARTMENT_IDS = ['sales', 'marketing', 'operations', 'finance', 'hr', 'legal', 'support', 'engineering', 'data', 'strategy'];

// Compact copy of the Builder 1/2 catalog (src/data/agentsBeginner.js +
// agentsIntermediate.js) — only the fields the drafting prompt needs for
// "does a genuinely relevant course session exist for this story." Kept
// deliberately small (slug/title/tier/departmentIds/tags only, not full
// descriptions) to keep the prompt cheap. Advanced/World Class are excluded
// since they're admin-only and never purchasable — linking to one from a
// public article would send students to something they can't access.
// NOTE: duplicated from the frontend data files (a Deno function can't
// import Vite-resolved modules) — if agents are added/renamed/removed
// there, update this list too.
const AGENT_CATALOG = [
  { slug: 'daily-news-industry-summary-agent', title: 'Daily News & Industry Summary Agent', tier: 'builder1', departmentIds: ['strategy'], tags: ['automation', 'news', 'briefing', 'no-code'] },
  { slug: 'social-media-post-generator', title: 'Social Media Post Generator', tier: 'builder1', departmentIds: ['marketing'], tags: ['marketing', 'content', 'social-media'] },
  { slug: 'basic-data-extractor-agent', title: 'Basic Data Extractor Agent', tier: 'builder1', departmentIds: ['data'], tags: ['data-extraction', 'automation', 'csv'] },
  { slug: 'meeting-notes-formatter-agent', title: 'Meeting Notes Formatter Agent', tier: 'builder1', departmentIds: ['operations'], tags: ['productivity', 'meetings', 'documentation'] },
  { slug: 'slack-morning-briefing-bot', title: 'Slack Morning Briefing Bot', tier: 'builder1', departmentIds: ['operations'], tags: ['automation', 'slack', 'productivity'] },
  { slug: 'simple-faq-chatbot', title: 'Simple FAQ Chatbot', tier: 'builder1', departmentIds: ['support'], tags: ['chatbot', 'support', 'rag-lite'] },
  { slug: 'calendar-task-prioritizer-agent', title: 'Calendar & Task Prioritizer Agent', tier: 'builder1', departmentIds: ['operations'], tags: ['productivity', 'calendar', 'planning'] },
  { slug: 'gmail-ai-triage-agent', title: 'Gmail AI Triage Agent', tier: 'builder1', departmentIds: ['operations', 'sales'], tags: ['automation', 'email', 'productivity'] },
  { slug: 'document-summarizer-agent', title: 'Document Summarizer Agent', tier: 'builder1', departmentIds: ['legal', 'operations'], tags: ['documents', 'summarization', 'productivity'] },
  { slug: 'price-competitor-monitor-agent', title: 'Price & Competitor Monitor Agent', tier: 'builder1', departmentIds: ['operations', 'marketing'], tags: ['competitive-intel', 'scraping', 'monitoring'] },
  { slug: 'lead-capture-qualifier-bot', title: 'Lead Capture & Qualifier Bot', tier: 'builder1', departmentIds: ['sales'], tags: ['sales', 'crm', 'lead-scoring'] },
  { slug: 'whatsapp-auto-reply-bot', title: 'WhatsApp Auto-Reply Bot', tier: 'builder1', departmentIds: ['sales', 'support'], tags: ['automation', 'messaging', 'whatsapp'] },
  { slug: 'web-research-agent', title: 'Web Research Agent', tier: 'builder2', departmentIds: ['marketing', 'strategy'], tags: ['research', 'web search', 'synthesis', 'rag'] },
  { slug: 'linkedin-content-creator-agent', title: 'LinkedIn Content Creator Agent', tier: 'builder2', departmentIds: ['marketing'], tags: ['content', 'linkedin', 'social media', 'personal brand'] },
  { slug: 'contract-clause-extractor', title: 'Contract Clause Extractor', tier: 'builder2', departmentIds: ['legal'], tags: ['legal', 'contracts', 'extraction', 'risk'] },
  { slug: 'invoice-processing-agent', title: 'Invoice Processing Agent', tier: 'builder2', departmentIds: ['finance'], tags: ['finance', 'automation', 'extraction', 'invoicing'] },
  { slug: 'hr-recruitment-screening-agent', title: 'HR Recruitment Screening Agent', tier: 'builder2', departmentIds: ['hr'], tags: ['hr', 'recruiting', 'screening', 'automation'] },
  { slug: 'competitor-intelligence-monitor', title: 'Competitor Intelligence Monitor', tier: 'builder2', departmentIds: ['marketing', 'strategy'], tags: ['competitive intelligence', 'marketing', 'strategy'] },
  { slug: 'seo-content-writer-agent', title: 'SEO Content Writer Agent', tier: 'builder2', departmentIds: ['marketing'], tags: ['seo', 'content', 'marketing', 'writing'] },
  { slug: 'crm-lead-follow-up-agent', title: 'CRM Lead Follow-Up Agent', tier: 'builder2', departmentIds: ['sales'], tags: ['sales', 'crm', 'email', 'automation'] },
  { slug: 'financial-reporting-agent', title: 'Financial Reporting Agent', tier: 'builder2', departmentIds: ['finance'], tags: ['finance', 'reporting', 'analytics', 'pandas'] },
  { slug: 'code-review-agent', title: 'Code Review Agent', tier: 'builder2', departmentIds: ['engineering'], tags: ['engineering', 'code review', 'github', 'ci'] },
  { slug: 'product-recommendation-engine', title: 'Product Recommendation Engine', tier: 'builder2', departmentIds: ['sales', 'marketing'], tags: ['sales', 'marketing', 'recommendations', 'personalization'] },
  { slug: 'sales-email-personalization-agent', title: 'Sales Email Personalization Agent', tier: 'builder2', departmentIds: ['sales'], tags: ['sales', 'outreach', 'personalization', 'cold email'] },
  { slug: 'customer-support-rag-bot', title: 'Customer Support RAG Bot', tier: 'builder2', departmentIds: ['support'], tags: ['rag', 'support', 'vector search', 'chatbot'] },
];

const rssParser = new Parser();

// Fetches one source's raw items. RSS sources are parsed as feeds; HTML
// sources (no clean feed — e.g. Anthropic's newsroom has none) are fetched
// as plain text and handed to the LLM directly to pull headlines from.
// Per-source failures are swallowed (logged, empty array returned) so one
// broken feed doesn't take down the whole run.
async function fetchSource(source) {
  try {
    const res = await fetch(source.feed_url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SocialDevTechnologiesNewsBot/1.0)' },
    });
    if (!res.ok) {
      console.error(`Source "${source.name}" returned ${res.status}`);
      return [];
    }
    if (source.source_type === 'html') {
      const html = await res.text();
      // Truncated — this is raw HTML handed to the LLM as unstructured
      // context, not parsed; a few thousand characters is plenty to surface
      // recent headline text without blowing up the prompt.
      return [{ source_name: source.name, source_url: source.feed_url, raw_html_excerpt: html.slice(0, 8000) }];
    }
    const xml = await res.text();
    const feed = await rssParser.parseString(xml);
    return (feed.items || []).slice(0, 15).map((item) => ({
      source_name: source.name,
      source_url: item.link || source.feed_url,
      title: item.title || '',
      snippet: (item.contentSnippet || item.summary || '').slice(0, 500),
      published: item.isoDate || item.pubDate || '',
    }));
  } catch (err) {
    console.error(`Failed to fetch source "${source.name}":`, err.message);
    return [];
  }
}

// Must stay in step with the same expression inside
// service_insert_news_draft (supabase/news-dedupe-guard.sql) — the two are
// the same duplicate check at two layers, and they should agree on what
// counts as the same headline.
function normalizeTitle(title) {
  return (title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function slugify(title) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
  // Date suffix keeps re-covered stories (e.g. a follow-up on the same
  // announcement days later) from colliding with an earlier article's slug.
  const dateSuffix = new Date().toISOString().slice(0, 10);
  return `${base}-${dateSuffix}`;
}

const SYSTEM_PROMPT = `You are the editorial bot for Social Dev Technologies, a platform that teaches people to build real AI agents (Builder 1/Builder 2 course tiers). You draft a daily AI-industry news digest for their students.

Voice: casual and conversational, like a knowledgeable friend explaining what happened — short direct sentences, talk to the reader as "you," concrete over vague, no press-release-speak, no hype-filled marketing language. Every full article should include a short "what this means for you as a builder" angle where it genuinely fits.

Plain language: assume the reader has no coding or AI background — many students join with zero technical experience. Whenever you use a term they might not know (inference, fine-tuning, context window, API, agentic, RAG, tokens, latency, parameters, etc.), define it in a short plain-language clause the first time it appears in that article, right where it's used — not a glossary, not a whole paragraph, just enough that a beginner isn't lost.

You will receive raw items (titles/snippets from RSS feeds, or raw HTML excerpts from pages with no feed) pulled from several AI news outlets, plus a list of stories already covered in the last 14 days. Your job:
1. Dedupe near-identical stories covered by multiple outlets — pick the best single version, don't draft the same story twice.
1b. SKIP anything in the "already covered" list — match on the underlying story, not the wording. Feeds keep returning the same item for days, so a story covered yesterday will usually still be in today's raw items, and re-drafting it under a fresh headline publishes the same news twice as two separate articles. That is the single most common failure in this job. Only revisit a covered story if today's items carry a genuinely new development, and then lead with what actually changed.
2. From the deduped set, decide which stories are genuinely notable (worth a full article) versus minor (digest-blurb only). Most days should have a handful of full articles and a longer tail of blurbs, not one or the other exclusively. Skip anything that's not really AI-relevant, pure stock-price/corporate-reshuffling news with no build-relevant substance, or too thin to say anything useful about.
3. For each item, write:
   - "title": punchy, specific, no clickbait
   - "dek": one sentence, plain language, doubles as the meta description and (for blurb-only items) the digest text itself
   - "is_full_article": true/false
   - "body_blocks": for full articles only, an array of {"type":"paragraph","text":...} / {"type":"heading","text":...} / {"type":"quote","text":...} / {"type":"list","items":[...]} objects — 4-8 blocks, roughly 300-500 words total. For blurb-only items, an empty array.
   - "source_name" and "source_url": exactly as given in the source item — never invent a URL, and never reproduce more than a sentence or two of the original — summarize in your own words.
   - "department_ids": 0-3 values from this fixed list, only ones that genuinely fit: ${JSON.stringify(DEPARTMENT_IDS)}
   - "related_agent_slug" and "related_agent_tier": ONLY if there's a genuinely relevant course session from the catalog below — set both to null far more often than not. Forcing a link that's a stretch is worse than no link. Catalog: ${JSON.stringify(AGENT_CATALOG)}
   - "image_prompt": for full articles only, a one-sentence description for an editorial illustration (no text/logos/faces of real people) capturing the story's theme.

Respond with ONLY a JSON array of these objects, no prose before or after, no markdown code fence.`;

const GEMINI_MAX_ATTEMPTS = 3;
const GEMINI_RETRY_DELAY_MS = 2000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// gemini-3.7-flash first: current stable/GA flash model, free-tier
// eligible — this is a repetitive daily curation/drafting job (dedupe, pick
// notable stories, write in a fixed voice), well within its capability.
// gemini-2.5-flash is a fallback, not a downgrade-and-forget: on 2026-08-23
// gemini-3.7-flash returned "high demand" 503s on every attempt for over 30
// hours straight (two consecutive daily cron runs), and there was no other
// path to a digest that day short of a human noticing and re-running it by
// hand. A different model is a different capacity pool, so it's likely to
// still be up during a 3.7-specific outage.
const GEMINI_MODELS = ['gemini-3.7-flash', 'gemini-2.5-flash'];

async function draftWithGeminiModel(model, rawItems, recentlyCovered) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{
      role: 'user',
      parts: [{
        text: `Already covered in the last 14 days — do NOT draft any of these again:\n\n${JSON.stringify(recentlyCovered)}\n\nHere are today's raw items:\n\n${JSON.stringify(rawItems)}`,
      }],
    }],
    // maxOutputTokens was 8000, which a normal day's digest overruns: ~8
    // full articles at 300-500 words each, plus deks, image prompts and
    // JSON scaffolding for the blurb tail, lands past that ceiling. The
    // model then stops mid-string and the response fails to parse — which
    // showed up as "Unterminated string in JSON" at a position that moved
    // around with the day's content (1287, 1313, 1514...) rather than
    // sitting at a fixed offset. 32000 leaves generous headroom and is well
    // inside both flash models' output limits.
    generationConfig: { maxOutputTokens: 32000, responseMimeType: 'application/json' },
  });

  let lastError;
  for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt++) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    if (res.ok) {
      const data = await res.json();
      // Join every part rather than reading parts[0]: Gemini may split one
      // response across several parts, and taking only the first silently
      // truncates it. (This was first suspected as the cause of the
      // "Unterminated string" failures below; it wasn't — those were the
      // output-token ceiling — but concatenating is still the correct way
      // to read the response.)
      const text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('') || '[]';
      try {
        return JSON.parse(text);
      } catch (parseErr) {
        // A 200 with truncated/malformed JSON is retryable, same as a 503 —
        // seen live from gemini-2.5-flash (2026-08-24): request/response
        // both fine, the model just cut the response off mid-string. Same
        // request replayed can easily come back well-formed.
        // finishReason is the tell for *why*: MAX_TOKENS means the output
        // ceiling above is too low for the day's volume rather than the
        // model misbehaving, and that distinction is invisible from the
        // parse error alone.
        const finishReason = data.candidates?.[0]?.finishReason ?? 'unknown';
        lastError = new Error(
          `Gemini returned malformed JSON (finishReason: ${finishReason}): ${parseErr.message}`,
        );
        if (attempt === GEMINI_MAX_ATTEMPTS) throw lastError;
        console.error(`Gemini attempt ${attempt}/${GEMINI_MAX_ATTEMPTS} returned malformed JSON, retrying:`, lastError.message);
        await sleep(GEMINI_RETRY_DELAY_MS * attempt);
        continue;
      }
    }
    lastError = new Error(`Gemini API returned ${res.status}: ${await res.text()}`);
    // Only retry on transient server-side errors (e.g. 503 "high demand") —
    // a 4xx (bad key, bad request) will just fail the same way every time.
    if (res.status < 500 || attempt === GEMINI_MAX_ATTEMPTS) throw lastError;
    console.error(`Gemini attempt ${attempt}/${GEMINI_MAX_ATTEMPTS} failed, retrying:`, lastError.message);
    await sleep(GEMINI_RETRY_DELAY_MS * attempt);
  }
  throw lastError;
}

async function draftWithGemini(rawItems, recentlyCovered) {
  let lastError;
  for (const model of GEMINI_MODELS) {
    try {
      return await draftWithGeminiModel(model, rawItems, recentlyCovered);
    } catch (err) {
      lastError = err;
      console.error(`Model "${model}" failed after ${GEMINI_MAX_ATTEMPTS} attempts, trying next:`, err.message);
    }
  }
  throw lastError;
}

// Best-effort — returns null (no image) rather than throwing, so a missing
// key or a failed generation never blocks the article itself from
// publishing without one.
async function generateImage(prompt, serviceClient, slug) {
  // Logged rather than silent: the news-images bucket sat empty for weeks
  // because this key was never set, and nothing anywhere said so -- every
  // article quietly fell back to a generic share card.
  if (!OPENAI_API_KEY) {
    console.warn(`OPENAI_API_KEY not set — no illustration for "${slug}"; the article falls back to a generated brand card (see src/lib/ogCards.js).`);
    return null;
  }
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      // 1536x1024, NOT the square 1024x1024: this image becomes the
      // article's og:image, and social platforms want a ~1.91:1 landscape
      // card. A square gets letterboxed or cropped in the feed.
      body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1536x1024' }),
    });
    if (!res.ok) {
      console.error(`Image generation failed for "${slug}": ${res.status}`);
      return null;
    }
    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) return null;

    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const path = `${slug}.png`;
    const { error: uploadError } = await serviceClient.storage
      .from('news-images')
      .upload(path, bytes, { contentType: 'image/png', upsert: true });
    if (uploadError) {
      console.error(`Image upload failed for "${slug}":`, uploadError.message);
      return null;
    }
    return serviceClient.storage.from('news-images').getPublicUrl(path).data.publicUrl;
  } catch (err) {
    console.error(`Image generation error for "${slug}":`, err.message);
    return null;
  }
}

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  if (!GEMINI_API_KEY) return jsonResponse({ error: 'GEMINI_API_KEY is not configured' }, 500);

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const cronHeader = req.headers.get('x-cron-secret') ?? '';
  const isAutomatedRun = Boolean(CRON_SECRET) && cronHeader === CRON_SECRET;

  if (!isAutomatedRun) {
    // Manual trigger (e.g. re-running a day's digest by hand) — piggyback
    // the admin check on a real news RPC rather than an unrelated one.
    const authHeader = req.headers.get('Authorization') ?? '';
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { error: authError } = await callerClient.rpc('admin_list_news_drafts', { p_status: 'pending_review' });
    if (authError) return jsonResponse({ error: 'Unauthorized' }, 403);
  }

  const { data: sources, error: sourcesError } = await serviceClient
    .from('news_sources')
    .select('name, feed_url, source_type')
    .eq('enabled', true);
  if (sourcesError) return jsonResponse({ error: 'Could not load news sources' }, 500);

  const fetched = await Promise.all((sources || []).map(fetchSource));
  const rawItems = fetched.flat();
  if (rawItems.length === 0) return jsonResponse({ ok: true, drafted: 0, reason: 'No items fetched from any source' });

  // What the bot already published, so it doesn't re-draft a story that's
  // still sitting near the top of a feed. Without this the run has no
  // memory at all: as of 2026-08-19, 20 of 28 rows were re-drafts of just 8
  // stories, each under a slightly different headline. Best-effort — a
  // failure here costs deduplication, not the run, and
  // service_insert_news_draft still backstops it.
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data: covered } = await serviceClient
    .from('news_articles')
    .select('title, source_url')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(120);
  const recentlyCovered = covered || [];

  // HTML sources have no per-item permalink — fetchSource falls back to the
  // source's own feed_url, so every story from one carries the same
  // source_url. Deduping those on url would block the source after its
  // first story ever, so they're matched on title only.
  const indexUrls = new Set(
    (sources || []).filter((s) => s.source_type === 'html').map((s) => s.feed_url),
  );

  let drafts;
  try {
    drafts = await draftWithGemini(rawItems, recentlyCovered);
  } catch (err) {
    console.error('Drafting failed:', err.message);
    return jsonResponse({ error: 'Drafting failed', detail: err.message }, 500);
  }

  const today = new Date().toISOString().slice(0, 10);
  let inserted = 0;
  let skippedDuplicates = 0;
  for (const draft of drafts) {
    try {
      const slug = slugify(draft.title || 'untitled');

      // Cheap duplicate check BEFORE generating an image: the guard inside
      // service_insert_news_draft would reject this draft anyway, and image
      // generation is the one genuinely expensive step in the loop.
      // Mirrors that guard's logic, including the index-url exception.
      const isDuplicate = recentlyCovered.some(
        (c) => (!indexUrls.has(draft.source_url) && c.source_url === draft.source_url)
          || normalizeTitle(c.title) === normalizeTitle(draft.title || ''),
      );
      if (isDuplicate) {
        skippedDuplicates += 1;
        continue;
      }

      let imageUrl = null;
      if (draft.is_full_article && draft.image_prompt) {
        imageUrl = await generateImage(draft.image_prompt, serviceClient, slug);
      }

      const { data: insertedId, error: insertError } = await serviceClient.rpc('service_insert_news_draft', {
        p_slug: slug,
        p_title: draft.title,
        p_dek: draft.dek,
        p_body_blocks: draft.body_blocks || [],
        p_is_full_article: Boolean(draft.is_full_article),
        p_source_name: draft.source_name,
        p_source_url: draft.source_url,
        p_department_ids: draft.department_ids || [],
        p_related_agent_slug: draft.related_agent_slug || null,
        p_related_agent_tier: draft.related_agent_tier || null,
        p_image_url: imageUrl,
        p_digest_date: today,
      });
      if (insertError) {
        console.error(`Insert failed for "${draft.title}":`, insertError.message);
        continue;
      }
      // A null id is the guard in service_insert_news_draft rejecting a
      // duplicate the checks above missed — an expected outcome, not an
      // error. Counted so a run that drafts nothing new is legible in the
      // response rather than looking like a broken fetch.
      if (insertedId === null) {
        skippedDuplicates += 1;
        continue;
      }
      inserted += 1;
    } catch (err) {
      console.error(`Failed to process draft "${draft?.title}":`, err.message);
    }
  }

  return jsonResponse({
    ok: true,
    fetched: rawItems.length,
    drafted: inserted,
    skippedDuplicates,
  });
});
