import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { usePageSeo } from '../../hooks/usePageSeo';
import { getGuideBySlug } from '../../data/guides';
import { Section, Prose, Callout, Practice, DoesList, FaqList, RelatedGuides, BuildItCta } from '../../components/guides/GuideUI';

const SLUG = 'gmail-ai-triage-agent';
const guide = getGuideBySlug(SLUG);
const CANONICAL_PATH = `/guides/${SLUG}`;

const FAQS = [
  {
    q: 'Can AI sort my Gmail inbox automatically?',
    a: 'Yes. An agent can read incoming mail, judge what each message is and how urgent it is, and apply Gmail labels accordingly — so the inbox is already ordered by importance before you open it.',
  },
  {
    q: 'Is this different from Gmail filters?',
    a: 'Filters follow rules you wrote in advance: if the sender is X, do Y. They handle only the cases you anticipated. A triage agent reads the actual content and forms a view, so it can categorise an email from a sender it has never seen before.',
  },
  {
    q: 'Can it reply to emails for me?',
    a: 'It can draft replies and leave them in your drafts for approval. Letting it send without review is possible and almost always a mistake — approving a good draft takes two seconds and removes the entire category of risk.',
  },
  {
    q: 'Is it safe to give an AI agent access to my email?',
    a: 'It depends on the permissions you grant. Read-and-label access is low risk and fully reversible. Send or delete access is not. Start with the former, and be deliberate about your mail being sent to an AI model for classification — particularly for confidential or client material.',
  },
  {
    q: 'What happens if it marks an important email as low priority?',
    a: 'It will occasionally, which is why nothing should ever be auto-archived or deleted. Everything stays in the inbox; only the labels change. Reviewing what it deprioritised once a week is how you catch and correct the pattern.',
  },
];

// Evergreen explainer — deliberately contains no build instructions. The
// how-to is the paid Builder 1 session this links out to; this page exists to
// be found by people searching "what is an email triage agent" / "AI to sort
// my inbox" who don't yet know the course exists.
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
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': `https://socialdevtechnologies.com${CANONICAL_PATH}`,
  },
};

export default function GmailTriageAgent() {
  usePageSeo({
    title: 'What is a Gmail AI Triage Agent? | Social Dev Technologies',
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
          <Mail className="w-3.5 h-3.5" /> Agent guide
        </span>
        <span className="text-[12.5px] text-gray-400 font-semibold">{guide.readingTime}</span>
      </div>

      <h1 className="font-display font-extrabold text-[34px] sm:text-[42px] leading-[1.08] text-ink tracking-[-0.8px]">
        What is a Gmail AI triage agent?
      </h1>
      <p className="text-[17px] text-body leading-relaxed mt-4">{guide.dek}</p>

      <div className="mt-2">
        <Section eyebrow="The problem" title="Your inbox sorts by arrival time, not importance">
          <Prose>
            <p>
              If you run a business, your inbox is where several different jobs collide. A customer asking for a
              quote, a supplier chasing an invoice, a bank notification, a newsletter you forgot you signed up for
              — they all land in the same list, in the order they happened to arrive. Nothing about that order
              reflects what actually matters to you.
            </p>
            <p>
              So you end up doing the sorting yourself, several times a day, mostly by reading subject lines and
              guessing. It's not difficult work. It's just constant, and it happens at exactly the moments you were
              trying to concentrate on something else.
            </p>
            <p>
              Triage is the part a machine can genuinely help with — not writing your replies for you, but deciding
              what deserves your attention first.
            </p>
          </Prose>
        </Section>

        <Section eyebrow="What it is" title="An assistant that reads the inbox before you do">
          <Prose>
            <p>
              A Gmail triage agent is a program that connects to your mailbox, reads incoming mail, and makes a
              judgement about each message: what kind of email is this, and how urgent is it? It then acts on that
              judgement in small, reversible ways — usually by labelling the message and, where you allow it,
              preparing a draft reply you can review.
            </p>
            <p>The word <em>agent</em> matters here. It's doing something on your behalf, on a schedule, without
              being asked each time — as opposed to a chatbot you have to open and prompt. But it's still working
              inside limits you set.
            </p>
          </Prose>

          <p className="text-[15px] font-bold text-ink mt-6 mb-1">A typical one will:</p>
          <DoesList
            items={[
              'Read messages that arrived since it last ran',
              'Classify each one — customer enquiry, invoice, supplier, internal, newsletter, spam-adjacent',
              'Judge urgency, and label the message accordingly in Gmail',
              'Draft a reply for the routine, predictable ones and leave it sitting in your drafts',
              'Leave everything else exactly where it was, for you to handle',
            ]}
          />

          <Callout title="The important word is triage.">
            It decides what deserves attention first. It does not decide what happens to your customers. Those are
            very different jobs, and the agents that stay useful are the ones that only do the first.
          </Callout>
        </Section>

        <Section eyebrow="Relevance" title="Where it actually earns its place">
          <Prose>
            <p>
              This is one of the few automations whose value is obvious within a day, because the problem it
              addresses is one you feel constantly. A few situations where it makes a real difference:
            </p>
            <p>
              <strong className="text-ink">A business where enquiries arrive by email.</strong> Quote requests get
              labelled and surfaced immediately rather than sitting unread behind twenty newsletters. For anyone
              selling something, response time is often the whole difference between winning and losing the job.
            </p>
            <p>
              <strong className="text-ink">A shared or team inbox.</strong> When several people share
              <span> </span>info@, the common failure is everyone assuming someone else replied. Consistent
              labelling makes ownership visible.
            </p>
            <p>
              <strong className="text-ink">Anyone who returns to a large backlog.</strong> After travel or time
              off, the agent's labels give you an ordered way in, instead of scrolling from the top and hoping.
            </p>
            <p>
              What it doesn't do is reduce the number of emails you receive. It changes the order you meet them in,
              and removes the repeated low-level decision of "does this matter?" That sounds modest. In practice
              it's most of the cost of email.
            </p>
          </Prose>
        </Section>

        <Section eyebrow="Best practices" title="What separates one that works from one you switch off">
          <Prose>
            <p>
              Most triage agents fail for the same handful of reasons, and none of them are technical. These are
              the habits that decide whether you're still using it in a month.
            </p>
          </Prose>

          <div className="mt-5">
            <Practice n={1} title="Start read-only, and earn trust before granting more">
              Run it for its first week doing nothing but labelling. You get to see every judgement it makes with
              no consequences. If it's wrong about what's urgent, you'll find out during the week when it costs
              nothing — not after it has replied to a customer.
            </Practice>
            <Practice n={2} title="Draft, never send">
              A drafted reply you approve in two seconds captures almost all the time saving. A sent reply you
              didn't read captures the rest and hands you a category of risk that isn't worth it. Keep a person
              between the agent and anyone outside your business.
            </Practice>
            <Practice n={3} title="Use categories that map to something you actually do">
              "Important" and "Not important" are useless labels, because they don't tell you what to do next.
              "Needs a reply today", "Quote request", "Invoice", "No action needed" are useful, because each one
              implies an action. Design the categories around your actual workflow, not around abstract priority.
            </Practice>
            <Practice n={4} title="Give it your context — this is the biggest quality lever">
              An agent that knows nothing about your business can only guess from the words in the email. An agent
              that knows what you sell, who your important clients are, and what a typical enquiry looks like will
              be dramatically better at the same task. Most people underinvest here and blame the model.
            </Practice>
            <Practice n={5} title="Audit the misses, not the hits">
              It's tempting to judge it by whether the labels look right. The failure that matters is the important
              email it filed as low priority. Once a week, look specifically at what it deprioritised. That's where
              you'll find the pattern worth correcting.
            </Practice>
            <Practice n={6} title="Never give it anything irreversible">
              No auto-delete, no auto-archive, no auto-send early on. Every action it takes should be one you can
              undo by hand in a few seconds. This single rule prevents nearly every way this goes badly.
            </Practice>
            <Practice n={7} title="Know what your mail is being sent to, and decide if you're comfortable">
              A triage agent reads your email and sends the contents to an AI model to be classified. For most
              business mail that's fine, but it's a real decision, not a technicality — especially if your inbox
              carries client confidential material, health information, or anything covered by an agreement you've
              signed. Decide deliberately, and consider excluding the mailboxes where the answer is no.
            </Practice>
          </div>

          <Callout variant="warning" title="The most common mistake:">
            Giving it too much authority on day one because the first few results looked impressive. Early accuracy
            on easy emails tells you very little about how it handles the ambiguous ones — and the ambiguous ones
            are where the damage happens.
          </Callout>
        </Section>

        <Section eyebrow="Limits" title="What it won't do for you">
          <Prose>
            <p>
              It has no knowledge of anything that wasn't written down. Context that lives in your head — that this
              particular client is difficult, that this small invoice matters because of who sent it — is invisible
              to it unless you say so.
            </p>
            <p>
              It will misjudge things, occasionally and unpredictably. Well-run triage assumes a small error rate
              and keeps a person in the loop rather than pretending accuracy will reach 100%.
            </p>
            <p>
              And it needs maintenance. When your business changes — new product, new type of customer — the
              categories you set up six months ago start drifting out of date. It's a tool you keep sharp, not one
              you install and forget.
            </p>
          </Prose>
        </Section>

        <Section eyebrow="Common questions" title="Frequently asked questions">
          <FaqList items={FAQS} />
        </Section>

        <BuildItCta
          to="/builder-1/gmail-ai-triage-agent"
          sessionTitle="Gmail AI Triage Agent"
          tier="Builder 1"
        >
          This guide covers what the agent is and how to run one well. If you want to build it yourself —
          connecting it to a real Gmail account, writing the classification logic, and getting it running on a
          schedule — that's a guided session inside Builder 1.
        </BuildItCta>

        <RelatedGuides currentSlug={SLUG} />
      </div>
    </div>
  );
}
