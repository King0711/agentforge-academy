import { Link } from 'react-router-dom';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import { usePageSeo } from '../../hooks/usePageSeo';
import { getGuideBySlug } from '../../data/guides';
import { Section, Prose, Callout, Practice, DoesList, FaqList, RelatedGuides, BuildItCta } from '../../components/guides/GuideUI';
import PromptGenerator from '../../components/guides/PromptGenerator';

const SLUG = 'brainstorming-with-ai';
const guide = getGuideBySlug(SLUG);
const CANONICAL_PATH = `/guides/${SLUG}`;

// The one guide in the set that isn't about a specific bot — a technique
// guide instead, which is why BuildItCta points broadly at the catalog
// rather than one Builder session (see guides.js's note on this entry).
const FAQS = [
  {
    q: 'Is brainstorming with AI actually better than brainstorming alone?',
    a: 'Better at different things. AI never runs out of ideas, never gets embarrassed suggesting something silly, and pushes back if you ask it to. It has no lived experience, no taste, and no stake in the outcome, so the judgment still has to be yours — it widens the raw material, it doesn\'t replace deciding what\'s good.',
  },
  {
    q: 'What is the best AI for brainstorming — ChatGPT or Claude?',
    a: 'Either works well for this; the technique matters far more than the tool. The prompts on this page work in any AI chat. The main practical difference is context window and memory — a longer conversation holds together better in tools built for extended back-and-forth.',
  },
  {
    q: 'Why do AI brainstorms feel generic sometimes?',
    a: 'Almost always the prompt, not the model. "Give me some ideas for X" produces the most statistically average response to that exact phrasing. Adding a technique, a constraint, or an explicit instruction to avoid the obvious answers changes the output dramatically — that\'s the entire reason the five techniques on this page exist.',
  },
  {
    q: 'Can AI brainstorming help with studying, not just business?',
    a: 'Yes — used to generate practice questions, explain a concept five different ways until one clicks, or argue the opposite side of an essay position so you can find the holes in your own argument before a marker does.',
  },
  {
    q: 'How many ideas should I ask for at once?',
    a: 'Somewhere around 8 to 12 for a first pass. Fewer than 5 and you\'re still in the obvious zone; past 15 the quality drops and you\'re mostly getting rephrased duplicates. Ask for a second, narrower round once you know which direction is interesting.',
  },
];

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: guide.title,
  description: guide.dek,
  author: { '@type': 'Organization', name: 'Social Dev Technologies' },
  publisher: {
    '@type': 'Organization',
    name: 'Social Dev Technologies',
    logo: { '@type': 'ImageObject', url: 'https://socialdevtechnologies.com/logo-icon.webp' },
  },
  mainEntityOfPage: { '@type': 'WebPage', '@id': `https://socialdevtechnologies.com${CANONICAL_PATH}` },
};

export default function BrainstormingWithAi() {
  usePageSeo({
    title: 'How to Brainstorm with AI — Practical Techniques for Study, Business & Work',
    description: guide.dek,
    canonicalPath: CANONICAL_PATH,
    jsonLd: JSON_LD,
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        to="/guides"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-body hover:text-brand transition-colors mb-7"
      >
        <ArrowLeft className="w-4 h-4" /> All guides
      </Link>

      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-brand bg-[#F3EBFF] dark:bg-brand/15 rounded-full px-3 py-1">
          <Lightbulb className="w-3.5 h-3.5" /> Skill guide
        </span>
        <span className="text-[12.5px] text-gray-400 font-semibold">{guide.readingTime}</span>
      </div>

      <h1 className="font-display font-extrabold text-[34px] sm:text-[42px] leading-[1.08] text-ink tracking-[-0.8px]">
        How to brainstorm with AI
      </h1>
      <p className="text-[17px] text-body leading-relaxed mt-4">{guide.dek}</p>

      <div className="mt-2">
        <Section eyebrow="The problem" title="Solo brainstorming runs out of steam fast">
          <Prose>
            <p>
              Sit alone with a blank page and a real problem, and you'll usually get four or five ideas before you
              run dry — and most of those first few are the obvious ones, the same ones anyone in your position
              would think of first. That's not a lack of creativity. It's how brainstorming actually works: your
              first ideas anchor you, and it takes real effort to think past them.
            </p>
            <p>
              Group brainstorming has its own failure mode. The loudest person's idea shapes the room, quieter
              people hold back a genuinely odd idea because it sounds silly out loud, and everyone converges toward
              whatever felt safe to say first. Meetings called specifically to "brainstorm" are notorious for
              producing less variety than people working the problem alone would.
            </p>
            <p>
              An AI chat doesn't get tired, doesn't anchor on its own first answer the way a person does, and has
              zero social cost to suggesting something strange. Used well, that's a genuine advantage — not because
              it's smarter than you, but because it doesn't share the specific limits that make human brainstorming
              stall.
            </p>
          </Prose>
        </Section>

        <Section eyebrow="What it actually is" title="Structured back-and-forth, not 'give me some ideas'">
          <Prose>
            <p>
              Type "give me some ideas for a business" into any AI chat and you'll get a competent, forgettable
              list — because that prompt has no shape to it, so the response has no shape either. The model reaches
              for the statistical middle of everything it's seen about "business ideas," which is exactly the
              generic territory you were trying to escape.
            </p>
            <p>
              Brainstorming with AI that actually produces something useful looks different: you give it a
              technique, not just a topic. A technique is a set of rules that forces the output away from the
              average response — generate fast without judging, argue backward from failure, defend an idea and
              then attack it, invent an artificial constraint. The topic barely changes; the technique is what
              changes the quality of what comes back.
            </p>
          </Prose>
          <Callout title="The one habit that matters most:">
            Treat the first response as raw material, not the answer. The real value shows up in the second and
            third exchange — "push further on idea 4" or "combine 2 and 6" — not in the initial list.
          </Callout>
        </Section>

        <Section eyebrow="Try it" title="Generate a real brainstorming prompt right now">
          <Prose>
            <p>
              Pick what you're working on, choose a technique, and this builds a complete, ready-to-paste prompt —
              not a generic one-liner. Try the same topic with two different techniques and compare what comes
              back; the difference is usually bigger than people expect from just changing the prompt.
            </p>
          </Prose>
          <PromptGenerator />
        </Section>

        <Section eyebrow="The techniques" title="Five ways to brainstorm that actually work">
          <Prose>
            <p>Each of these is built into the generator above. Here's what each one is actually doing and when to reach for it.</p>
          </Prose>

          <div className="mt-5">
            <Practice n={1} title="Rapid Idea List — for when you have nothing yet">
              Ask for a wide range fast, from safe to uncomfortable, with no explanation attached to each one.
              Explaining kills momentum and biases the list toward ideas that are easy to justify rather than
              genuinely different. Judge afterward, not while the list is being generated.
            </Practice>
            <Practice n={2} title="Reverse Brainstorm — when you're stuck on a specific problem">
              List every way the situation could get worse, then flip each one into a real action. Working
              backward from failure surfaces ideas that direct "how do I fix this" framing tends to miss, because
              naming a failure mode is often easier than naming its solution directly.
            </Practice>
            <Practice n={3} title="Multiple Perspectives — when you need the full picture, not just optimism">
              Force the model through distinct lenses — facts, upside, the strongest case against, a wild card —
              one at a time instead of blended together. Blended answers quietly average out the criticism; kept
              separate, the tension between the optimistic case and the critical case is exactly what you want to
              see.
            </Practice>
            <Practice n={4} title="Steelman vs. Devil's Advocate — when you already have an idea and need to know if it holds up">
              Get the strongest possible case for the idea, then the strongest possible case against it, from the
              same conversation. Asking only "is this a good idea?" tends to produce a hedge. Forcing both extremes
              and comparing them tells you far more than a single balanced-sounding answer would.
            </Practice>
            <Practice n={5} title="Constraint-Forced Ideation — when every answer sounds like everyone else's">
              Add a fake limit — no budget, 48 hours, no internet — and ask for ideas that would genuinely work
              inside it. Removing the default, well-resourced path is one of the most reliable ways to force a
              genuinely different answer instead of a rephrased obvious one.
            </Practice>
          </div>
        </Section>

        <Section eyebrow="Where this applies" title="Study, business, and everyday work">
          <Prose>
            <p>
              The techniques don't change much across these — the prompt generator's "who's this for" setting
              mainly changes tone and what counts as a good answer. What changes is what you'd actually use each
              one for.
            </p>
          </Prose>

          <p className="text-[15px] font-bold text-ink mt-6 mb-1">For study</p>
          <DoesList
            items={[
              'Generate practice questions on a topic before an exam, then ask it to grade your answers honestly',
              'Have it argue the opposite side of your essay thesis, so you find the holes before a marker does',
              'Ask for the same concept explained five different ways until one actually clicks',
              'Brainstorm project topics using Rapid Idea List, then Reverse Brainstorm the one you pick to find weak points early',
            ]}
          />

          <p className="text-[15px] font-bold text-ink mt-6 mb-1">For business and innovation</p>
          <DoesList
            items={[
              'Generate new product or service angles with Constraint-Forced Ideation when the obvious ones are already taken',
              'Steelman a pricing change or a new offer before committing budget to it',
              'Reverse Brainstorm a launch — list every way it could flop, then build the plan around avoiding those',
              'Use Multiple Perspectives before a big decision, so the optimistic case and the real risk both get heard',
            ]}
          />

          <p className="text-[15px] font-bold text-ink mt-6 mb-1">For everyday work</p>
          <DoesList
            items={[
              'Break a vague task ("improve our onboarding") into a concrete first list of options',
              'Draft talking points for a difficult conversation, then have it argue the other person\'s likely position',
              'Get unstuck on a piece of writing by generating five different opening angles',
              'Prepare for a meeting by brainstorming the objections you\'re likely to face, before you\'re in the room',
            ]}
          />
        </Section>

        <Section eyebrow="Best practices" title="How to get real value instead of a generic list">
          <div className="mt-1">
            <Practice n={1} title="Never accept the first list as final">
              The first response is a starting point almost every time. "Push further on #4," "combine 2 and 6,"
              or "give me the version of this that would embarrass me to suggest out loud" routinely produces the
              actually useful idea — one that never would have shown up in the first pass.
            </Practice>
            <Practice n={2} title="Give it real context, not a one-line topic">
              "Ideas to grow my business" and "ideas to get more replies from customers who message us on WhatsApp
              after 6pm and go quiet" produce completely different quality of output. The second one can't fall
              back on generic advice — specificity is most of what separates a useful brainstorm from a forgettable
              one.
            </Practice>
            <Practice n={3} title="Ask it to argue with you, not just agree">
              Left alone, most models lean toward being agreeable. Explicitly asking it to find the weakest part of
              an idea, or to argue the opposite position, produces a much more useful answer than "what do you
              think?" — which tends to get a polite version of "sounds good."
            </Practice>
            <Practice n={4} title="Treat confident output as a hypothesis, not a fact">
              A brainstormed idea that sounds well-reasoned can still be built on a wrong assumption about your
              market, your students, or your audience — stated with exactly the same confidence as an idea built on
              a correct one. Brainstorming produces candidates. Deciding which ones are actually true still takes
              real verification.
            </Practice>
            <Practice n={5} title="Mix it with people, don't replace them">
              The strongest use isn't solo brainstorming with AI instead of people — it's using AI to generate a
              wider, sharper starting list before a real conversation, so the humans spend their time deciding and
              refining instead of stuck on a blank page.
            </Practice>
          </div>

          <Callout variant="warning" title="The failure mode worth watching for:">
            Mistaking a long, well-formatted list for a good one. Volume and polish are the easiest things for a
            model to produce — the real signal is whether any single idea in the list is genuinely specific to your
            situation, not something that could have been pasted into any similar brainstorm.
          </Callout>
        </Section>

        <Section eyebrow="Limits" title="What it can't do for you">
          <Prose>
            <p>
              It has no taste. It can't tell you an idea is good the way someone with ten years in your industry
              can — it can only tell you an idea sounds plausible, which is a different and much weaker thing.
            </p>
            <p>
              It has no stake in the outcome. Every idea costs it nothing to suggest, which is exactly why it's
              useful for volume — and exactly why the judgment about what's actually worth doing has to stay
              yours.
            </p>
            <p>
              And it doesn't know what you haven't told it. The context living in your head — that this specific
              customer is difficult, that this idea was already tried and failed two years ago — is invisible to
              it unless you say so in the prompt.
            </p>
          </Prose>
        </Section>

        <Section eyebrow="Common questions" title="Frequently asked questions">
          <FaqList items={FAQS} />
        </Section>

        <BuildItCta to="/catalog" sessionTitle="Browse the agent catalog" eyebrow="Go further">
          Brainstorming is a skill you use with any AI chat — no course needed. If the idea you land on is worth
          building into something real (a bot, an automation, a tool), the catalog lists every agent taught across
          Builder 1 and Builder 2.
        </BuildItCta>

        <RelatedGuides currentSlug={SLUG} />
      </div>
    </div>
  );
}
