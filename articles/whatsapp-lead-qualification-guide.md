# Ready to paste into /admin/guides

Copy each field below into the matching admin form field. Body and FAQs use the
site's own plain-text block syntax (documented at the top of `AdminGuides.jsx`) —
paste as-is, no reformatting needed. Saved as a draft by default; hit Publish
yourself once you've read it through.

---

## Title
How to Build an Automated WhatsApp Lead Qualification Funnel (No Code Required)

## Slug
whatsapp-lead-qualification-funnel

## Dek (one-line description)
Turn incoming WhatsApp messages into scored, CRM-ready leads automatically — the exact architecture, the free tools, and the errors you'll actually hit.

## Emoji
🎯

## Category
how-to

## Reading time
9 min

## Related agent (optional field, links a live agent card into the page)
Slug: lead-capture-qualifier-bot
Tier: builder1

---

## Body (paste into the block editor)

intro: Every WhatsApp message from a prospect is either worth an hour of your time or thirty seconds. Right now you can't tell which until you've already spent the hour. This guide builds the thing that tells you first — a small automation that receives a WhatsApp message, asks an AI to score it against your ideal customer profile, and drops a ranked, reasoned lead straight into your CRM. No code experience required, and the tools it runs on are free.

# What you're building | The shape of it

This is three pieces wired together, and none of them are complicated on their own:

- A messaging endpoint that receives incoming WhatsApp messages
- An AI call that scores the message and pulls out the actual pain point, not just a guess
- A CRM push that creates a contact and a follow-up task, tiered by urgency

The reason this works as a funnel instead of a chatbot is the middle step. A chatbot replies. This scores, explains its reasoning, and routes — so a HOT lead gets a task due tomorrow and a COLD one gets a task due in two weeks, without you touching either.

## Why "free tools" isn't a compromise here

The AI step in this funnel is classification — is this lead a fit, and why. That's the easiest task you can hand a language model, and it doesn't need a frontier model to do it well. We built and tested this exact architecture on Google's free Gemini tier: no credit card, generous enough limits for real lead volume, and a five-minute signup at aistudio.google.com.

!tip One habit that pays for itself | Never ask an AI for just a label. Ask for the label **and** a one-sentence reason. "HOT" tells you nothing you can act on. "HOT — mentioned a live outage and a budget already approved" tells you exactly what to say when you call.

# The architecture | What actually talks to what

### 1. Receive the message
A webhook — a URL that WhatsApp calls the moment a message arrives — receives the sender's number and text. This is the one piece that costs money past a sandbox if you use Meta's official WhatsApp Business API directly, which is why most builds in this space start on Telegram's Bot API instead: functionally identical mechanism, genuinely free forever, no business verification step.

### 2. Score the lead
The message text goes to an AI with a schema, not a free-text prompt — you ask for a score, a tier, a reason, and a list of pain points, and the API is constrained to return exactly that shape. This matters more than it sounds: a free-text prompt occasionally returns something that doesn't parse, and a scoring pipeline that occasionally throws an error on real leads is worse than no pipeline.

### 3. Route by tier
HOT leads get a CRM task due tomorrow. WARM gets three days. COLD gets two weeks. The point isn't the exact numbers — it's that the routing is a rule your team agreed on once, applied every single time, with no fatigue and no Friday-afternoon leniency creeping in.

!tip The one design decision worth copying | Have the AI draft, never send. A misrouted CRM task costs you nothing — you just re-tier it. A wrong auto-reply sent to a real prospect can cost you the relationship. Keep a human in the loop on anything that talks back to the customer.

# What it needs

- A Telegram bot token (free, from @BotFather, takes about two minutes) — or Meta's WhatsApp Business API if you specifically need WhatsApp and can absorb the setup cost
- A free Gemini API key from Google AI Studio
- A free-tier CRM — HubSpot's free plan is genuinely sufficient for this
- Basic Python, or an AI coding assistant to write it for you from a clear spec
- Python 3.10 or newer installed locally
- No credit card for the core build — the CRM and messaging platform both have workable free tiers

# The errors you will actually hit

This is the part most guides skip, and it's the part that actually saves you time.

**"Rate limited" messages during testing.** Free AI tiers cap requests per minute. If you're testing by firing messages one after another, you'll see this. It isn't a bug — build a short wait-and-retry into the AI call from the start, and you'll never notice it in real use, where messages arrive one at a time.

**The model wraps its answer in a code fence anyway.** You ask for raw JSON, and some models return it wrapped in a \`\`\`json block regardless. Strip the fence before parsing rather than fighting the model into never doing it — it's a two-line fix and far more reliable than prompt engineering your way around it.

**A bot that "connects" but never sees message content.** On Telegram specifically, this is almost always one setting: Message Content Intent, off by default in the Bot API dashboard. Five seconds to fix, an hour to diagnose if you don't know to look for it.

**Different AI providers name the same role differently.** If you ever add conversation memory to this funnel, note that Gemini's API calls the AI's own turn "model," not "assistant" — a detail that silently breaks multi-turn context if you assume every provider uses the same vocabulary.

!warn The mistake that costs you the most | Wiring the AI step directly to one company's SDK. When that company changes pricing or retires a model — and every AI company has done this — you're rewriting the funnel instead of changing one line. Put the AI call behind a small function your own code calls, and the provider becomes a config setting, not an architecture decision.

# Ship it

- Get a Telegram bot token from @BotFather
- Get a free Gemini API key from aistudio.google.com
- Write the scoring schema — score, tier, reason, pain points — before you write a line of code
- Build the webhook receiver
- Wire the AI scoring step behind its own function, not inline
- Push scored leads into your CRM with a tiered follow-up task
- Test with three deliberately different messages — a strong fit, a poor fit, an ambiguous one — and read the reasons, not just the scores

[cta:/builder-1|See the full build, step by step|Builder 1|Build this for real]
This exact funnel — WhatsApp-style messaging in, AI scoring, CRM push — is two of the twelve guided builds inside Builder 1: the Lead Capture & Qualifier Agent and the WhatsApp Auto-Reply Agent. Full code, live sessions, and a certificate when you ship it.

---

## FAQs (paste into the FAQ field)

Q: Do I need to pay for the WhatsApp Business API to build this?
A: No. The mechanism — receive a message, score it, route it — works identically on Telegram's Bot API, which is free permanently and takes about two minutes to set up. Meta's official WhatsApp Business API is the production option once you specifically need the WhatsApp badge, but it's not required to build or test the funnel.

Q: Will the free AI tier handle real lead volume?
A: For most small businesses, yes. Free tiers are rate-limited per minute, not per day in any way that matters for typical lead flow — a real prospect messaging you isn't going to trigger a limit built to stop automated testing loops. If you do scale past it, moving to a paid tier costs cents per thousand messages, not a subscription.

Q: What happens if the AI misjudges a lead?
A: The system is designed to fail safely: it drafts a CRM task, it doesn't take an irreversible action. A misjudged lead costs you a re-tier, not a lost deal. That's why every scoring schema should include a one-sentence reason — it's what lets a human catch a bad call in five seconds.

Q: Can I use this for something other than WhatsApp or Telegram?
A: Yes — the scoring and routing logic doesn't know or care what messaging platform delivered the message. The same architecture works behind a web form, an email inbox, or a Slack channel with only the receiving step changed.
