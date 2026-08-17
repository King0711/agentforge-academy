import { Link } from 'react-router-dom';
import { ArrowLeft, Target } from 'lucide-react';
import { usePageSeo } from '../../hooks/usePageSeo';
import { getGuideBySlug } from '../../data/guides';
import { Section, Prose, Callout, Practice, DoesList, FaqList, RelatedGuides, BuildItCta } from '../../components/guides/GuideUI';

const SLUG = 'ai-lead-qualification';
const guide = getGuideBySlug(SLUG);
const CANONICAL_PATH = `/guides/${SLUG}`;

const FAQS = [
  {
    q: 'What is lead qualification?',
    a: 'Deciding which of the people who contacted you are worth spending time on, and in what order. Traditionally a salesperson does it by reading each enquiry and forming a view. Qualification is about ordering your attention, not about rejecting people.',
  },
  {
    q: 'What is the difference between lead scoring and lead qualification?',
    a: 'Scoring is the number; qualification is the decision. A score of 84 means nothing until someone has decided that above 70 gets a call today. The score is an input to the judgement, not a replacement for it.',
  },
  {
    q: 'Can AI qualify leads better than a salesperson?',
    a: 'Not better — faster and more consistently. An experienced salesperson reading an enquiry carefully will usually judge it better than a model. But they cannot do it at 2am, within thirty seconds, for every enquiry, without getting tired or distracted. Consistency and speed are what the agent contributes.',
  },
  {
    q: 'What data does an AI qualification agent need?',
    a: 'Whatever the person told you — what they asked for, budget or timeline if mentioned, the business they are from — plus your own definition of a good customer. That second part is what most setups skip, and it is the part that determines whether the scoring means anything.',
  },
  {
    q: 'Will it reject good customers by mistake?',
    a: 'It will misjudge some, which is exactly why a qualification agent should never reject anyone. It should sort into "call now" and "follow up later", never "discard". Deprioritising a good lead costs you a day; deleting one costs you the customer.',
  },
  {
    q: 'Do I need a CRM to use one?',
    a: 'It helps, because a CRM gives the agent somewhere to file its output and a place for follow-up tasks to live. But a shared spreadsheet with a score column and an owner column is a perfectly reasonable starting point.',
  },
];

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'What is AI lead qualification?',
  description: guide.dek,
  author: { '@type': 'Organization', name: 'Social Dev Technologies' },
  publisher: {
    '@type': 'Organization',
    name: 'Social Dev Technologies',
    logo: { '@type': 'ImageObject', url: 'https://socialdevtechnologies.com/logo-icon.webp' },
  },
  mainEntityOfPage: { '@type': 'WebPage', '@id': `https://socialdevtechnologies.com${CANONICAL_PATH}` },
};

export default function AiLeadQualification() {
  usePageSeo({
    title: 'What is AI Lead Qualification? A Guide for Small Sales Teams',
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
          <Target className="w-3.5 h-3.5" /> Agent guide
        </span>
        <span className="text-[12.5px] text-gray-400 font-semibold">{guide.readingTime}</span>
      </div>

      <h1 className="font-display font-extrabold text-[34px] sm:text-[42px] leading-[1.08] text-ink tracking-[-0.8px]">
        What is AI lead qualification?
      </h1>
      <p className="text-[17px] text-body leading-relaxed mt-4">{guide.dek}</p>

      <div className="mt-2">
        <Section eyebrow="The problem" title="Most deals are lost to slow follow-up, not bad leads">
          <Prose>
            <p>
              Enquiries arrive and go into a list. A form submission, a WhatsApp message, an email. In that list
              they all look identical — a name, a phone number, a line of text. Nothing about the list tells you
              which one is a business ready to spend serious money this month and which one is idly curious.
            </p>
            <p>
              So they get worked in the order they arrived, or in whatever order you happen to scroll. The serious
              enquiry that came in on Friday evening gets reached on Tuesday, by which point the buyer has spoken
              to two competitors and made a decision.
            </p>
            <p>
              This is the quiet, expensive failure in most small sales operations. Not a shortage of leads — a
              shortage of <em>ordering</em>. And ordering is a judgement made repeatedly on short pieces of text,
              which is precisely the shape of work an agent handles well.
            </p>
          </Prose>
        </Section>

        <Section eyebrow="What it is" title="An agent that reads each enquiry and tells you who to call first">
          <Prose>
            <p>
              An AI lead qualification agent sits behind wherever your enquiries arrive. As each one comes in, it
              reads what the person actually wrote, judges it against your definition of a good customer, and
              produces a score or category — then files it where your team works and flags the ones worth immediate
              attention.
            </p>
            <p>
              The useful ones assess two separate things, and confusing them is the most common design error:
            </p>
            <p>
              <strong className="text-ink">Fit</strong> — are they the kind of customer you serve well? Right
              industry, right size, right location, needing something you actually sell.
            </p>
            <p>
              <strong className="text-ink">Intent</strong> — how ready are they to act? Someone writing "we need
              this installed before month end, what's your price for twelve units" is in a very different state
              from "do you do this?", even if both are a perfect fit.
            </p>
            <p>
              High fit and high intent is the call you make in the next ten minutes. High fit and low intent is
              worth nurturing patiently. Low fit and high intent is the trap that eats a sales week — urgent,
              enthusiastic, and never going to close.
            </p>
          </Prose>

          <p className="text-[15px] font-bold text-ink mt-6 mb-1">A typical one will:</p>
          <DoesList
            items={[
              'Read the enquiry the moment it arrives, at any hour',
              'Score it for fit and intent against criteria you defined',
              'Write a one-line summary of what the person actually wants',
              'Create the contact record and a follow-up task with an owner',
              'Alert someone immediately when a high-value enquiry lands',
            ]}
          />

          <Callout title="What it is not:">
            It is not a closer, and it should never be the thing that decides someone is not worth talking to. Its
            entire job is deciding what order a human works in. That framing keeps it useful and keeps its mistakes
            cheap.
          </Callout>
        </Section>

        <Section eyebrow="Relevance" title="Where it earns its place">
          <Prose>
            <p>
              <strong className="text-ink">Speed of first response is the metric it moves.</strong> Across sales in
              general, the business that responds first wins a disproportionate share of deals — buyers tend to
              engage seriously with whoever is in front of them when the intent is fresh. An agent that flags the
              serious enquiry within a minute of arrival changes who you are competing against.
            </p>
            <p>
              <strong className="text-ink">Small teams feel it most.</strong> With two or three people selling,
              there is no operations layer to sort the queue. Everyone works from the same undifferentiated list.
              This is the cheapest way to add that layer.
            </p>
            <p>
              <strong className="text-ink">It makes weekends and evenings survivable.</strong> Enquiries do not
              respect office hours. An agent that has already read, scored, summarised and filed everything that
              arrived overnight turns Monday morning from an hour of triage into ten minutes of calling.
            </p>
            <p>
              <strong className="text-ink">It creates a record you can learn from.</strong> Once every enquiry is
              scored and the outcome recorded, you can finally answer questions that were previously guesswork:
              which channel produces real customers, which kinds of enquiry actually close, where the wasted time
              goes.
            </p>
          </Prose>
        </Section>

        <Section eyebrow="Best practices" title="How to set one up without letting it bin your best customer">
          <Prose>
            <p>
              Qualification agents fail in a distinctive way: they look like they are working, because the scores
              are plausible and the list is neatly ordered, while quietly deprioritising exactly the customers you
              most wanted. These practices are what prevent that.
            </p>
          </Prose>

          <div className="mt-5">
            <Practice n={1} title="Write down what a good customer looks like before you build anything">
              Most teams have never actually articulated this. Pull your last twenty closed deals and your last
              twenty wasted pursuits, and write down what separated them. That document is the agent's entire
              basis for judgement — and the exercise is usually worth doing even if you never build the agent.
            </Practice>
            <Practice n={2} title="Score fit and intent separately, never as one number">
              Collapsing them into a single score destroys the information you needed. A perfect-fit customer who
              is six months away and a poor-fit customer who wants to buy today can produce the same combined
              score, and they warrant completely opposite responses.
            </Practice>
            <Practice n={3} title="Deprioritise, never reject">
              There must be no path where the agent's judgement means nobody ever contacts a person. Low scores go
              to a slower queue, not to the bin. This one rule contains the entire downside of the agent being
              wrong, and it costs you nothing.
            </Practice>
            <Practice n={4} title="Make it summarise in one line, not just score">
              A number tells you the order to work in. A sentence — "wants 12 units delivered to Port Harcourt
              before month end, has budget approved" — lets your salesperson open the call already informed. The
              summary is frequently more valuable than the score.
            </Practice>
            <Practice n={5} title="Feed the outcomes back and review the rubric monthly">
              Record what actually closed. Then check the agent's scores against reality: were the deals you won
              scored highly? Were the high scores that went nowhere a pattern? Without this loop the criteria drift
              out of date and nobody notices.
            </Practice>
            <Practice n={6} title="Watch for proxies that quietly misfire">
              Agents pick up signals you did not intend — a free email address reading as unserious, a short
              message reading as low intent, unfamiliar phrasing reading as low fit. Plenty of excellent customers
              write two-line enquiries from a Gmail address. Check specifically whether your low-scored pile
              contains a type of customer you actually want.
            </Practice>
            <Practice n={7} title="Be deliberate about the personal data you are storing and sending">
              This agent handles names, phone numbers and business details, and sends them to an AI model for
              assessment. In Nigeria that engages the NDPR; elsewhere, equivalent rules apply. Know what you are
              storing, how long you keep it, and what you would tell a customer who asked — before you build, not
              after someone asks.
            </Practice>
          </div>

          <Callout variant="warning" title="The failure worth guarding against:">
            Trusting the ordering so completely that nobody ever looks at the bottom of the list. Once a week,
            someone should read a handful of the lowest-scored enquiries. That is where you find out whether the
            agent understands your business or merely appears to.
          </Callout>
        </Section>

        <Section eyebrow="Limits" title="What it will not do for you">
          <Prose>
            <p>
              It cannot tell whether someone will actually pay. Enthusiasm in an enquiry is weak evidence of
              creditworthiness, and no model reads that from a contact form.
            </p>
            <p>
              It does not know your history with anyone. The client who is a nightmare to work with and the one who
              refers you constantly look identical unless that context is written down somewhere it can see.
            </p>
            <p>
              And it will not fix a follow-up problem. If well-scored leads still sit untouched for two days, the
              constraint was never the ordering — it was capacity or discipline, and an agent will simply document
              the loss more precisely.
            </p>
          </Prose>
        </Section>

        <Section eyebrow="Common questions" title="Frequently asked questions">
          <FaqList items={FAQS} />
        </Section>

        <BuildItCta
          to="/builder-1/lead-capture-qualifier-bot"
          sessionTitle="Lead Capture & Qualifier Bot"
          tier="Builder 1"
        >
          This guide covers what qualification is and how to run it well. The Builder 1 session is the build —
          taking form submissions in, scoring them, and creating a qualified contact with a follow-up task in
          HubSpot automatically.
        </BuildItCta>

        <RelatedGuides currentSlug={SLUG} />
      </div>
    </div>
  );
}
