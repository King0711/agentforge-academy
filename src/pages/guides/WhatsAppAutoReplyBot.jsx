import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { usePageSeo } from '../../hooks/usePageSeo';
import { getGuideBySlug } from '../../data/guides';
import { Section, Prose, Callout, Practice, DoesList, FaqList, RelatedGuides, BuildItCta } from '../../components/guides/GuideUI';

const SLUG = 'whatsapp-auto-reply-bot';
const guide = getGuideBySlug(SLUG);
const CANONICAL_PATH = `/guides/${SLUG}`;

// The highest commercial-intent guide in the set: WhatsApp is the primary
// business channel across Nigeria and much of Africa in a way it isn't in the
// US/EU, so the searches here are local, specific, and barely contested by
// the big international publishers.
const FAQS = [
  {
    q: 'Can I set up automatic replies on WhatsApp without a bot?',
    a: 'Yes — the WhatsApp Business app has built-in "away" and "greeting" messages. They send the same fixed text to everyone regardless of what was asked. That is genuinely enough for some businesses. A bot is what you graduate to when the same fixed message stops being a useful answer.',
  },
  {
    q: 'Will WhatsApp ban my number for using a bot?',
    a: 'Not for replying to people who messaged you first — that is normal business use. Numbers get banned for sending unsolicited messages in bulk to people who never opted in. The risk lives almost entirely on the outbound side, not the auto-reply side.',
  },
  {
    q: 'Can the bot message customers first, or only reply?',
    a: 'It can message first, but only within rules. WhatsApp lets you send free-form messages within 24 hours of a customer contacting you. Outside that window you may only send a message template that Meta has pre-approved, and only to people who opted in. This is enforced by the platform, not by your code.',
  },
  {
    q: 'Do I need the official WhatsApp Business API?',
    a: 'For a small bot on your own number, no — there are libraries that drive WhatsApp Web from your computer, which is how most people start. For anything serious, the official API through a provider like Twilio is far more stable, is not tied to your phone staying online, and is the only route that supports message templates properly.',
  },
  {
    q: 'Should the bot tell customers it is a bot?',
    a: 'Yes. Beyond being the honest thing to do, it manages expectations — people phrase things more simply and are far more forgiving of a limited answer when they know what they are talking to. The businesses that hide it get caught, and it reads much worse than disclosure would have.',
  },
  {
    q: 'How much does a WhatsApp bot cost to run?',
    a: 'A simple bot on your own number using a free-tier AI model can cost nothing beyond the computer running it. Moving to the official API adds per-conversation fees that vary by country and message type. For most small businesses the AI is the cheap part.',
  },
];

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'What is a WhatsApp auto-reply bot?',
  description: guide.dek,
  author: { '@type': 'Organization', name: 'Social Dev Technologies' },
  publisher: {
    '@type': 'Organization',
    name: 'Social Dev Technologies',
    logo: { '@type': 'ImageObject', url: 'https://socialdevtechnologies.com/logo-icon.webp' },
  },
  mainEntityOfPage: { '@type': 'WebPage', '@id': `https://socialdevtechnologies.com${CANONICAL_PATH}` },
};

export default function WhatsAppAutoReplyBot() {
  usePageSeo({
    title: 'What is a WhatsApp Auto-Reply Bot? A Guide for Business Owners',
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
          <MessageCircle className="w-3.5 h-3.5" /> Agent guide
        </span>
        <span className="text-[12.5px] text-gray-400 font-semibold">{guide.readingTime}</span>
      </div>

      <h1 className="font-display font-extrabold text-[34px] sm:text-[42px] leading-[1.08] text-ink tracking-[-0.8px]">
        What is a WhatsApp auto-reply bot?
      </h1>
      <p className="text-[17px] text-body leading-relaxed mt-4">{guide.dek}</p>

      <div className="mt-2">
        <Section eyebrow="The problem" title="Your customers message at 11pm and expect an answer">
          <Prose>
            <p>
              In Nigeria and across much of Africa, WhatsApp is not a side channel. It is the shopfront. People ask
              for prices there, negotiate there, send payment receipts there, and complain there. For a great many
              businesses it has quietly replaced both the phone line and the website.
            </p>
            <p>
              Which creates a problem that does not exist with email: WhatsApp carries an expectation of speed.
              A message sent at 11pm expects an answer tonight, or at least first thing. A customer who waits four
              hours for a price often has already bought from whoever answered in four minutes.
            </p>
            <p>
              And the messages are relentlessly repetitive. Do you have this in stock. How much. Where are you
              located. Do you deliver to Enugu. Have you seen my transfer. The same handful of questions, hundreds
              of times, each one interrupting whatever you were doing.
            </p>
          </Prose>
        </Section>

        <Section eyebrow="What it is" title="A bot that answers the questions you answer constantly">
          <Prose>
            <p>
              A WhatsApp auto-reply bot connects to a WhatsApp number, reads incoming messages, works out what is
              being asked, and replies in your business's voice — around the clock, without you.
            </p>
            <p>
              It is worth separating this from the built-in feature you may already use. The WhatsApp Business app
              can send a fixed "away message" to everyone who writes to you. That is not a bot; it is an
              answerphone. It says the same thing whether someone asked your opening hours or wanted to place a
              ₦400,000 order.
            </p>
            <p>
              A bot reads the actual question and answers <em>that</em>. Ask about delivery and you get the
              delivery answer. Ask about price and you get the price answer. Ask something it was never briefed on
              and — if it is built properly — it says so and hands you the conversation.
            </p>
          </Prose>

          <p className="text-[15px] font-bold text-ink mt-6 mb-1">A well-built one will:</p>
          <DoesList
            items={[
              'Reply instantly to the routine questions, at any hour',
              'Answer in your voice, using your actual prices, hours and policies',
              'Say plainly that it is an automated assistant when asked',
              'Recognise when a question is beyond it and pass the conversation to a person',
              'Stay quiet in group chats and stay away from anything it should not touch',
            ]}
          />

          <Callout title="The realistic goal:">
            Handle the five questions you answer forty times a week, and get out of the way for everything else.
            A bot that covers the routine 70% and escalates cleanly is worth far more than one that attempts
            everything and mishandles the deals that matter.
          </Callout>
        </Section>

        <Section eyebrow="Relevance" title="Why this pays off faster here than almost anywhere">
          <Prose>
            <p>
              Most international writing about WhatsApp bots treats them as a minor support channel, because in the
              US and Europe that is what WhatsApp is. That framing badly understates the value here.
            </p>
            <p>
              <strong className="text-ink">It is where the sale actually happens.</strong> If enquiries arrive on
              WhatsApp and are answered on WhatsApp, then response time on WhatsApp is your conversion rate. Speed
              is not a nicety in that channel; it is the mechanism by which you win or lose the customer.
            </p>
            <p>
              <strong className="text-ink">The volume is genuinely unmanageable by hand.</strong> A small trader
              can easily field a hundred messages a day, most of them the same five questions. That is not a
              staffing problem you can hire your way out of at small-business margins.
            </p>
            <p>
              <strong className="text-ink">It works outside working hours, which is when a lot of buying
              happens.</strong> Evening and weekend enquiries are real revenue, and they are exactly the ones a
              person cannot reliably catch.
            </p>
            <p>
              <strong className="text-ink">It makes a one-person business look established.</strong> An immediate,
              well-written, consistent reply signals a business that has its act together — which matters
              disproportionately when the customer is deciding whether to trust you with money.
            </p>
          </Prose>
        </Section>

        <Section eyebrow="Best practices" title="The rules that keep a bot from costing you customers">
          <Prose>
            <p>
              A WhatsApp bot talks directly to customers, which makes it higher-stakes than an agent that only
              organises your own inbox. These are the practices that separate one that builds trust from one that
              quietly damages your reputation.
            </p>
          </Prose>

          <div className="mt-5">
            <Practice n={1} title="Say it is a bot, and never pretend otherwise">
              Not just an ethical position — a practical one. People who know they are talking to a bot ask
              simpler questions, forgive limited answers, and ask for a human when they need one. People who think
              they are talking to you feel deceived the moment it slips, and that feeling attaches to your
              business, not to the software.
            </Practice>
            <Practice n={2} title="Brief it on the questions you actually receive, not the ones you imagine">
              Before building anything, scroll back through a few hundred real messages and count what people
              genuinely ask. Almost every business is surprised: the questions you thought mattered are rare, and
              some question you never considered comes up constantly. Build for the real distribution.
            </Practice>
            <Practice n={3} title="Design the handoff before you design the answers">
              The single most important behaviour is what happens when the bot is out of its depth. It should say
              so plainly, tell the customer a person will follow up, and make sure that conversation is actually
              flagged for you. A bot that improvises past the edge of its knowledge does more damage than one that
              never replied at all.
            </Practice>
            <Practice n={4} title="Never let it commit to anything you would not honour">
              Prices, delivery dates, discounts, availability. If the bot quotes ₦18,000 because it half-remembered
              an old price, you will either lose money honouring it or lose the customer refusing it. Give it a
              short, current list of what it may state, and firm instructions to defer on anything outside it.
            </Practice>
            <Practice n={5} title="Keep it inbound-only until you understand the outbound rules">
              Replying to people who messaged you is safe, normal business use. Messaging people first is a
              different activity governed by strict platform rules: a 24-hour window for free-form replies,
              pre-approved templates outside it, and genuine opt-in required. Bulk messaging people who never
              contacted you is the fastest way to lose the number your entire business runs on.
            </Practice>
            <Practice n={6} title="Test on a spare number, never your main business line">
              Your business number is not a test environment. If something misbehaves — a loop, a bad reply sent a
              hundred times — you want that happening on a number nobody depends on. Move to the real line only
              once you have watched it behave for a while.
            </Practice>
            <Practice n={7} title="Read the transcripts every week, especially the bad ones">
              The conversations where a customer repeated themselves, got frustrated, or went silent are the most
              valuable feedback you will get. They show exactly where the bot's understanding runs out. Fix those
              patterns and the bot gets measurably better; ignore them and it silently leaks customers.
            </Practice>
          </div>

          <Callout variant="warning" title="The mistake that costs the most:">
            Letting it send freely to customers before you have watched a few hundred of its replies. Every serious
            WhatsApp bot failure follows the same pattern — it was given permission to speak to customers before
            anyone had checked what it says when confused.
          </Callout>
        </Section>

        <Section eyebrow="Limits" title="What it will not do for you">
          <Prose>
            <p>
              It cannot negotiate. Haggling is a judgement call about a specific customer, your margin and your
              week — not something to delegate to software that does not know any of that.
            </p>
            <p>
              It does not know what you have not told it. Stock that changed this morning, a price you adjusted
              yesterday, a customer you agreed special terms with — all invisible unless it was written down for
              the bot.
            </p>
            <p>
              It will not rescue a business with a genuine service problem. If your real issue is that orders arrive
              late, faster replies simply mean customers learn about the delay sooner.
            </p>
          </Prose>
        </Section>

        <Section eyebrow="Common questions" title="Frequently asked questions">
          <FaqList items={FAQS} />
        </Section>

        <Callout title="Want to try building one for free first?">
          There is a free step-by-step guide on this site that walks through building a basic WhatsApp bot with
          no-cost tools — mostly file explorer and copy-paste, about 40 minutes.{' '}
          <Link to="/whatsapp-bot-guide" className="text-brand font-bold hover:underline">
            Open the free WhatsApp bot guide →
          </Link>
        </Callout>

        <BuildItCta
          to="/builder-1/whatsapp-auto-reply-bot"
          sessionTitle="WhatsApp Auto-Reply Bot"
          tier="Builder 1"
        >
          This guide covers what the bot is and how to run one responsibly. The Builder 1 session is the build
          itself — on Twilio's official WhatsApp Business API rather than a browser session tied to your phone,
          and driven by a persona file so it answers in your voice instead of a generic one.
        </BuildItCta>

        <RelatedGuides currentSlug={SLUG} />
      </div>
    </div>
  );
}
