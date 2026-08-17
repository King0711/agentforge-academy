import { Link } from 'react-router-dom';
import { ArrowLeft, Brain } from 'lucide-react';
import { usePageSeo } from '../../hooks/usePageSeo';
import { getGuideBySlug } from '../../data/guides';
import { Section, Prose, Callout, Practice, DoesList, FaqList, RelatedGuides, BuildItCta } from '../../components/guides/GuideUI';

const SLUG = 'what-is-an-ai-agent';
const guide = getGuideBySlug(SLUG);
const CANONICAL_PATH = `/guides/${SLUG}`;

// Hub page for the /guides cluster — the broad, top-of-funnel explainer that
// links out to every specific agent guide. Written for someone who runs a
// business and has heard "AI agent" a hundred times without ever getting a
// straight answer, not for someone who already knows they want to build one.
const FAQS = [
  {
    q: 'What is the difference between an AI agent and a chatbot?',
    a: 'A chatbot waits for you to open it and type something. An agent runs on its own — on a schedule, or whenever something arrives — and does a job without being prompted each time. A chatbot answers questions; an agent finishes tasks.',
  },
  {
    q: 'Do I need to know how to code to use an AI agent?',
    a: 'To use one, no. To build one, it depends on the agent. Some are assembled in no-code tools like Make.com by connecting boxes together; others need a little Python or JavaScript. Plenty of people with no programming background build working agents by following a structured guide.',
  },
  {
    q: 'How much does it cost to run an AI agent?',
    a: 'For a small business agent handling a normal daily workload, the AI usage itself typically costs a few dollars a month, sometimes less. Several models have free tiers generous enough for a single agent. The larger cost is usually your time building and maintaining it, not the running cost.',
  },
  {
    q: 'Are AI agents safe to connect to my email or customer messages?',
    a: 'It depends entirely on what you let them do. An agent that reads and labels is low risk and easy to undo. An agent that sends messages to customers or deletes things carries real risk and should always have a person approving actions. The safe pattern is to start read-only and expand slowly.',
  },
  {
    q: 'Will an AI agent replace my staff?',
    a: 'Realistically, no — and businesses that buy them for that reason are usually disappointed. What agents remove is repetitive judgement work: sorting, classifying, summarising, drafting. That frees people for the work that actually needs a person, rather than replacing them.',
  },
  {
    q: 'What is the easiest AI agent to start with?',
    a: 'Something that only reads and reports, and touches nothing you cannot undo — a daily summary of industry news, or an inbox that sorts itself. You get the benefit immediately, and mistakes cost you nothing while you learn.',
  },
];

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'What is an AI agent? A plain-English guide for business owners',
  description: guide.dek,
  author: { '@type': 'Organization', name: 'Social Dev Technologies' },
  publisher: {
    '@type': 'Organization',
    name: 'Social Dev Technologies',
    logo: { '@type': 'ImageObject', url: 'https://socialdevtechnologies.com/logo-icon.webp' },
  },
  mainEntityOfPage: { '@type': 'WebPage', '@id': `https://socialdevtechnologies.com${CANONICAL_PATH}` },
};

export default function WhatIsAnAiAgent() {
  usePageSeo({
    title: 'What is an AI Agent? A Plain-English Guide for Business Owners',
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
          <Brain className="w-3.5 h-3.5" /> Start here
        </span>
        <span className="text-[12.5px] text-gray-400 font-semibold">{guide.readingTime}</span>
      </div>

      <h1 className="font-display font-extrabold text-[34px] sm:text-[42px] leading-[1.08] text-ink tracking-[-0.8px]">
        What is an AI agent?
      </h1>
      <p className="text-[17px] text-body leading-relaxed mt-4">
        You have probably heard the phrase a hundred times without anyone giving you a straight answer. This is the
        straight answer — what an AI agent is, how it differs from the chatbots you have already tried, and the
        specific jobs businesses are genuinely using them for.
      </p>

      <div className="mt-2">
        <Section eyebrow="The short answer" title="A program that does a job for you, without being asked each time">
          <Prose>
            <p>
              An AI agent is a small program that does three things in a loop: it <strong className="text-ink">looks
              at something</strong>, it <strong className="text-ink">makes a judgement</strong> using an AI model,
              and it <strong className="text-ink">takes an action</strong> based on that judgement.
            </p>
            <p>
              That is genuinely the whole idea. An agent that watches your inbox looks at new email, judges how
              urgent each one is, and labels it. An agent that writes your daily briefing looks at the news, judges
              what is worth your attention, and emails you a summary. Same three steps, different job.
            </p>
            <p>
              The part that is new is the middle step. Software has been able to look at things and take actions for
              decades — what it could never do was <em>judge</em>. Sorting your email by sender is easy to program.
              Deciding which emails actually matter today required a person. That is the part an AI model now does
              well enough to hand over.
            </p>
          </Prose>

          <Callout title="Why the word 'agent'?">
            It acts on your behalf — on a schedule, or whenever something happens — rather than waiting for you to
            open it and ask. That is the difference between an assistant who checks the post each morning and one
            who only responds when spoken to.
          </Callout>
        </Section>

        <Section eyebrow="The distinction" title="Agent vs chatbot vs plain automation">
          <Prose>
            <p>
              These three get used interchangeably and they are not the same thing. The difference matters, because
              it determines what you can actually hand over.
            </p>
            <p>
              <strong className="text-ink">A chatbot</strong> is reactive. You open it, you type, it answers, and
              nothing happens until you come back. ChatGPT and Claude in a browser tab are chatbots. Enormously
              useful, but every single result requires you to show up and ask.
            </p>
            <p>
              <strong className="text-ink">Plain automation</strong> — a Zapier zap, an email filter — is proactive
              but cannot judge. It follows rules you wrote in advance: <em>if the sender is this, do that.</em> It
              never surprises you, and it never handles anything you did not anticipate. The moment reality
              contains a case you did not write a rule for, it does the wrong thing or nothing at all.
            </p>
            <p>
              <strong className="text-ink">An agent</strong> is both proactive and capable of judgement. It runs on
              its own like automation, but when it meets something you never described, it can still form a
              sensible view of what to do. That is the whole reason to build one.
            </p>
            <p>
              A useful test: if you can write down every rule the task needs, use plain automation — it is cheaper,
              faster, and never wrong in surprising ways. If the task requires reading something and forming a
              view, that is agent territory.
            </p>
          </Prose>
        </Section>

        <Section eyebrow="In practice" title="The jobs businesses actually hand to agents">
          <Prose>
            <p>
              Ignore the demos where an agent books a holiday from scratch. The agents that survive contact with a
              real business are much less dramatic, and fall into four groups.
            </p>
          </Prose>

          <p className="text-[15px] font-bold text-ink mt-6 mb-1">Summarising — turning volume into something readable</p>
          <DoesList
            items={[
              'A daily briefing of what happened in your industry, in your inbox before you start work',
              'Meeting recordings turned into decisions, owners and deadlines',
              'A long contract or report reduced to what actually affects you',
            ]}
          />

          <p className="text-[15px] font-bold text-ink mt-6 mb-1">Sorting — deciding what deserves attention first</p>
          <DoesList
            items={[
              'An inbox that labels itself by urgency before you open it',
              'New enquiries scored so the serious ones get called back first',
              'Support messages routed to whoever should actually handle them',
            ]}
          />

          <p className="text-[15px] font-bold text-ink mt-6 mb-1">Answering — handling the questions you answer constantly</p>
          <DoesList
            items={[
              'A WhatsApp bot replying to price and availability questions at 11pm',
              'A website chat widget that answers from your own documents rather than making things up',
            ]}
          />

          <p className="text-[15px] font-bold text-ink mt-6 mb-1">Watching — noticing things you would otherwise miss</p>
          <DoesList
            items={[
              'An alert when a competitor changes their pricing',
              'A flag when a customer who normally orders monthly has gone quiet',
            ]}
          />

          <Prose>
            <p className="mt-6">
              Notice what these have in common: each one is a specific, repetitive judgement a person is currently
              making several times a day. That is the shape of a task worth handing to an agent. Anything vaguer
              than that tends to produce an impressive demo and no lasting change to how the business runs.
            </p>
          </Prose>
        </Section>

        <Section eyebrow="Judging one" title="How to tell a useful agent from an expensive toy">
          <Prose>
            <p>
              Most agents that get abandoned were doomed at the design stage, not the build stage. These are the
              questions worth asking before you invest time in one.
            </p>
          </Prose>

          <div className="mt-5">
            <Practice n={1} title="Is the job actually repetitive?">
              An agent earns its keep through repetition. A judgement you make forty times a day is worth
              automating even if the agent is imperfect. A judgement you make twice a month is not, no matter how
              tedious it feels.
            </Practice>
            <Practice n={2} title="Can you tell within seconds whether it got it right?">
              Good agent tasks have cheap, obvious verification. A labelled email is instantly checkable. A drafted
              reply is instantly checkable. If checking the agent's work takes as long as doing the work, you have
              built yourself a second job.
            </Practice>
            <Practice n={3} title="Is being wrong survivable?">
              The best first agents fail harmlessly. A mislabelled email costs you a few seconds. A wrongly sent
              message to a client costs you considerably more. Match the agent's authority to the cost of it being
              wrong — and remember that it will be wrong sometimes.
            </Practice>
            <Practice n={4} title="Does it know enough about your business to be useful?">
              An agent that knows nothing about what you sell or who matters to you can only work from the words in
              front of it. The single biggest quality difference between a mediocre agent and a good one is usually
              how much context it was given about the business it works for.
            </Practice>
            <Practice n={5} title="Would you still want it if it were only 90% accurate?">
              It will be, roughly. Agents built on the assumption of perfection get switched off at the first
              visible mistake. Agents built to be useful at 90%, with a person catching the rest, stay in service
              for years.
            </Practice>
          </div>

          <Callout variant="warning" title="The most common failure:">
            Building the agent that is most impressive to demo rather than the one that removes the most tedium.
            The boring agent that quietly saves you twenty minutes every morning will outlast the clever one every
            time.
          </Callout>
        </Section>

        <Section eyebrow="Practicalities" title="What it actually takes to run one">
          <Prose>
            <p>
              <strong className="text-ink">Cost.</strong> Less than people expect. A single agent handling a normal
              small-business workload typically costs a few dollars a month in AI usage, and several models have
              free tiers that comfortably cover one agent. The real investment is the time to build it and the
              attention to keep it current.
            </p>
            <p>
              <strong className="text-ink">Technical skill.</strong> It varies by agent. Some are assembled in
              no-code tools by connecting boxes; others want a little Python or JavaScript. Neither requires a
              computer science background — but both require willingness to follow instructions carefully and debug
              when something does not work the first time.
            </p>
            <p>
              <strong className="text-ink">Maintenance.</strong> This is the part nobody mentions. An agent is not
              a machine you install and forget. When your business changes — new products, new kinds of customers,
              a different tone — the assumptions built into your agent quietly go stale. Budget a little attention
              every few months rather than none.
            </p>
            <p>
              <strong className="text-ink">Privacy.</strong> Agents read real data — your mail, your customer
              messages, your documents — and send it to an AI model for judgement. For most routine business
              information that is unremarkable, but it is a decision to make deliberately rather than by accident,
              particularly for anything confidential, medical, or covered by an agreement you have signed.
            </p>
          </Prose>
        </Section>

        <Section eyebrow="Common questions" title="Frequently asked questions">
          <FaqList items={FAQS} />
        </Section>

        <BuildItCta to="/catalog" sessionTitle="Browse the agent catalog" eyebrow="Where to start">
          The fastest way to understand agents is to build a small one and watch it work. The catalog lists every
          agent taught across Builder 1 and Builder 2 — including what each one does, what it is built with, and
          roughly how long it takes.
        </BuildItCta>

        <RelatedGuides currentSlug={SLUG} />
      </div>
    </div>
  );
}
