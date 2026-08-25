// Content spine for the "AI Builder" webinar (/webinar) — a LIVE Zoom
// session presented by a host, with a second presenter (Samuel) doing a
// live build of the WhatsApp Auto-Reply Agent partway through. This deck
// supports that delivery; it doesn't replace it. Slide visual content lives
// in each component under src/components/webinar/slides — this file is
// navigation metadata (id/label for the progress dots) plus presenter
// notes, kept separate so notes can be edited without touching component
// code and vice versa.
//
// Structured around the questions the audience is actually asking, not a
// product walkthrough: connection first, then what's actually changed
// (people, not technology), then the mission, then the using-vs-building
// distinction, then the universal builder pattern, then live proof, then
// the offer — arriving at Builder 1 only once the belief "I can become an
// AI Builder" is already in place. The deck should answer "why should I
// become an AI Builder," not "what is Social Dev Technologies" — every
// section should put the audience's own future self on screen, not the
// product.
//
// One line repeats at exactly three emotionally load-bearing moments —
// Mission, Who You Become, and Q&A — via the shared SignatureLine
// component: "The future won't belong to the people who use AI. It will
// belong to the people who build with it." Deliberately capped at three
// (not four or more) so it reads as a signature, not a slogan.
//
// Presenter notes are guidance, not a script: objective (why this slide
// exists), talkingPoints (what to hit, not word-for-word), story (a
// suggestion for where a personal story could go — left for the presenter
// to tell in their own words), interactionPrompt (a live chat touchpoint),
// transition (the bridge line into the next slide/section).
//
// Audience-rotation rule (applies throughout, not just where noted): the
// room mixes students, graduates, professionals, business owners, teachers,
// church leaders, entrepreneurs, and support reps — deliberately not seven
// separate presentations, but the examples/stories you personally choose
// slide to slide should rotate across these groups rather than always
// reaching for the same one or two. As a rule of thumb: time-savings →
// teacher or support rep; growth → business owner or entrepreneur;
// employability → graduate; service → church leader.

export const webinarSlides = [
  {
    id: 'welcome',
    label: 'Welcome',
    notes: {
      objective: 'Make every attendee feel personally addressed before anything is sold. Nobody should feel like they wandered into the wrong room.',
      talkingPoints: [
        'Welcome the room warmly — thank people for showing up live, on a real call, at a real time',
        'Ask everyone to type who they are in chat: student, graduate, business owner, professional, teacher, customer support, entrepreneur, church leader — whatever actually fits',
        'Read a few out loud as they land — make it feel seen, not performative',
        "Don't mention Builder 1, pricing, or the company pitch yet — this section is only about connection",
        'Land the closing line on screen as a clear promise for what the next hour actually delivers',
        'Mentally note who\'s in the room from these intros — you\'ll want to rotate examples across these groups for the rest of the session rather than leaning on one or two',
        'Deliver "Thank you for investing your time in yourself today" like you mean it — it\'s doing the warmth work here, not a generic greeting',
      ],
      story: 'Optional — if it feels natural, say in one sentence who you were before you started building with AI. Save the full version of your story for later, around the live demo.',
      interactionPrompt: 'Chat: "Type who you are — student, business owner, teacher, whatever fits — so I know who\'s actually in the room."',
      transition: "Before we dive in — a quick introduction. I'm the one walking you through today.",
    },
  },
  {
    id: 'meet-host',
    label: 'Meet your host',
    notes: {
      objective: "Establish who's actually talking to the room and why they should listen — brief and confident, not a resume recitation.",
      talkingPoints: [
        'Keep this under a minute — name, role, and 2-3 credentials, not a full CV',
        'The Swish Sports and Ed-Tech credentials establish real technical and education credibility fast',
        "Land the personal closing line about education, coaching, and community briefly — it's the \"why\" behind building this platform in one sentence",
      ],
      story: "If there's a short, specific moment that explains why you built this platform, this is the place for it — one sentence, not the full origin story.",
      interactionPrompt: "None — keep this moving, it's a fast credibility beat, not a discussion.",
      transition: "Now that you know who I am — let's talk about what's actually changed.",
    },
  },
  {
    id: 'world-changed',
    label: 'The opportunity has changed',
    notes: {
      objective: "Lead with emotion, not information. This section should feel like a shift in the room, not a fact. The three scenes are the point — the headline just frames them.",
      talkingPoints: [
        'Say the headline slowly: "The opportunity has changed. The people getting ahead aren\'t necessarily the smartest — they\'re the ones learning how to work differently."',
        'Walk the three scenes as tiny stories, not bullet points — pause after each one',
        'Only at the very end, name the vehicle: "the tools got cheap and simple enough that any one of these people can do it themselves — that\'s AI"',
        'The three scenes already span a graduate, a business owner, and a teacher — if you add your own examples live, reach for a church leader, entrepreneur, or support rep to keep the spread wide',
      ],
      story: "Good spot for a short version of your own story if you want one here — or hold the full story for right after the live demo, whichever lands better on the day.",
      interactionPrompt: 'Chat: "Which of these sounds like you — or which one do you wish sounded like you?"',
      transition: "Let's make this less abstract — a quick, honest gut check.",
    },
  },
  {
    id: 'honest-check',
    label: 'The honest check',
    notes: {
      objective: "Personalize the problem onto the attendee's own week before asking them to believe anything about AI. This is a mirror, not a pitch.",
      talkingPoints: [
        'Read the categories, not every single bullet — let people scan and self-identify rather than narrating all six lines',
        'Say it as an actual instruction: "Count how many of these sound like your normal week."',
        'Land the closing line slowly: "If two or more sound like your week, you don\'t need more hours — you need a system that runs without you."',
      ],
      story: 'None needed — let the checklist do the work.',
      interactionPrompt: 'Chat: "How many did you count? Drop the number."',
      transition: "So why does any of this exist? Let me tell you why we're here.",
    },
  },
  {
    id: 'mission',
    label: 'Our mission',
    notes: {
      objective: 'Give the audience the "why" behind the platform before asking them to trust it with anything. This is purpose, not a pitch — resist the urge to mention Builder 1 here.',
      talkingPoints: [
        'Say the mission plainly and slowly — this is one of the only slides in the whole deck that isn\'t building toward the ask',
        'Notice out loud if you want: "This isn\'t about Builder 1. It\'s about why any of this exists in the first place."',
        'The sector row (education, business, healthcare, agriculture, government, church, small business) is there to show breadth visually — no need to read it out, just let it register',
        'This is the first appearance of the session\'s signature line — deliver it like a statement, not a tagline',
      ],
      story: 'If your own reason for building this platform is short and genuine, this is the natural place for it.',
      interactionPrompt: 'None — let this slide sit quietly for a moment rather than immediately prompting for chat.',
      transition: "So what does that mission actually look like in practice?",
    },
  },
  {
    id: 'about-social-dev',
    label: 'About Social Dev Technologies',
    notes: {
      objective: 'Give a fast, concrete answer to "what does this company actually do" without turning it into the focus of the talk.',
      talkingPoints: [
        "Don't dwell — this is a beat, not a section. Point at each card for a few seconds and move on",
        'The "Custom AI Solutions" card is what produced John\'s story later in the deck — you can foreshadow that briefly if it flows naturally',
      ],
      story: 'None needed.',
      interactionPrompt: 'None.',
      transition: "So what's the actual skill that turns all of that into something real for you?",
    },
  },
  {
    id: 'using-vs-building',
    label: 'Using vs. Building',
    notes: {
      objective: 'This is the core distinction of the whole session: using AI is a habit, building with AI is a skill — and that skill has a name. Make sure it lands before anything else.',
      talkingPoints: [
        'Using AI: opens ChatGPT when they remember to, asks the same question every time, nothing happens unless they\'re there typing',
        "Building with AI: builds a system that runs the task automatically, solves a problem once — permanently, keeps working even when they're not there",
        "Say it plainly: everyone in this room already uses AI. Today is about the skill of building with it.",
        "Then land it on the room specifically — don't read every role on screen, pick 2-3 that match who actually introduced themselves in chat and speak to them directly:",
        "· Business owner — automate the busywork eating your week, without hiring for it",
        "· Professional — do the parts of your job that need you; let an agent handle the rest",
        "· Graduate — walk in with shipped agents in your portfolio, not \"entry-level, no experience\"",
        "· Teacher — get your evenings back from grading and planning",
        "· Entrepreneur — launch what used to need a dev team, alone, this weekend",
        "· Customer support — answer what repeats, so you handle what doesn't",
        "· Church leader — automate the admin so your time goes to people",
        'Close by naming the identity: "People who build with AI become AI Builders."',
      ],
      story: 'None needed for the contrast itself — but this is a natural spot to briefly name someone (or yourself) who made this exact shift, if it\'s short.',
      interactionPrompt: 'Chat: "Which one of these roles is you? Drop the word that fits."',
      transition: "So how does a Builder actually think? There's a pattern — and it's simpler than you'd expect.",
    },
  },
  {
    id: 'how-builders-think',
    label: 'How Builders think',
    notes: {
      objective: 'Teach the universal pattern behind every single build, before Samuel demonstrates it live — so the audience is watching FOR something, not just watching.',
      talkingPoints: [
        'Let the loop reveal one step at a time on screen and narrate each as it lands: Find a problem → Describe it → Give AI instructions → Connect it to a tool → Test → Improve → Deploy',
        'Say explicitly: "This loop never changes. Only the problem changes, session to session."',
        'Land the closing line before moving on: "Every AI system you\'ve ever admired follows this same pattern." — that\'s the "oh, it\'s not magic" moment',
        "This is 3-4 minutes, not a deep dive — you're planting the pattern, not teaching it in full",
      ],
      story: 'None needed — this is a framework slide, keep it brisk.',
      interactionPrompt: 'None — move straight into the live demo while the pattern is fresh.',
      transition: "Before we watch that loop happen live, let me introduce the person about to prove it.",
    },
  },
  {
    id: 'meet-samuel-king',
    label: 'Meet Samuel King',
    notes: {
      objective: "Build credibility for the co-presenter right before he demonstrates live — the audience should trust the build because they trust the builder.",
      talkingPoints: [
        'Keep this fast too — a few credentials, then straight into the demo',
        'The "80% less manual data entry" and TEDx coordination land as concrete, verifiable-sounding proof, not vague hype',
        'Certifications (Claude, Microsoft AI) reassure a skeptical audience that he\'s credentialed on the actual tools being taught',
      ],
      story: 'None needed — save the story for after the demo, per the existing note there.',
      interactionPrompt: 'None.',
      transition: "Let's watch that loop happen live. Samuel, take it away.",
    },
  },
  {
    id: 'live-demo',
    label: 'Live demo',
    notes: {
      objective: 'Reframe the demo as an experiment the audience is running, not a performance they\'re watching — that shift in framing is what makes it feel like proof instead of a show. You\'re demonstrating thinking, not coding.',
      talkingPoints: [
        'Open with the headline framing: "Watch an AI Builder think" — not "watch Samuel build." Say it that way out loud too.',
        'Then say it explicitly before Samuel starts: "For the next few minutes, don\'t watch Samuel — answer one question for yourself: could I learn to build this?"',
        'Narrate the business thinking, not the syntax: why this problem, why this prompt, what changes once it\'s automated',
        'Call back to the loop by name as Samuel moves through it: "That\'s step 3 — giving AI instructions" and so on',
        'Reinforce: this is the same loop as every Builder 1 session, just with a different problem',
      ],
      story: 'This is likely the best spot for your own build story, if you\'re telling one live — right after the demo, while it\'s freshest.',
      interactionPrompt: 'Chat: "So — could you learn to build this? Yes or no, be honest."',
      transition: "That's what it looks like built. Here's what you'd actually be able to build yourself.",
    },
  },
  {
    id: 'what-you-can-build',
    label: 'Your first 12 AI agents',
    notes: {
      objective: 'Let breadth do the selling. This is a "wall of builders," not a syllabus — the visual of 12 real, named sessions is the point, not any single one of them.',
      talkingPoints: [
        'Open with the connecting line before the wall appears: "Everything you just saw came from exactly the same thinking process Samuel used." — that\'s what turns ONE demo into TWELVE possibilities in people\'s heads',
        "Don't read the wall out loud — it now reveals row by row, so let each row land as its own beat rather than talking over it",
        "Point to 2-3 cards that map to what people said in chat during intros, name them specifically",
        'The WhatsApp card is what Samuel just built live — point back to it explicitly',
        'Land the closing line slowly: "By the end of Builder 1, you won\'t just understand AI — you\'ll have built 12 real AI agents solving real business problems."',
      ],
      story: 'Optional — if one of these maps directly to something you or a past student actually built, mention it briefly here.',
      interactionPrompt: 'Chat: "Which one of these would change something at YOUR job or business?"',
      transition: 'So where does Builder 1 actually lead?',
    },
  },
  {
    id: 'your-track',
    label: 'Your AI Builder journey',
    notes: {
      objective: 'Show the full path so Builder 1 feels like a first step, not a dead end — and bridge "12 projects" into an actual new capability before the emotional payoff on the next slide.',
      talkingPoints: [
        'Builder 1 is the only decision anyone needs to make today — Builder 2 and Pro are just showing the path exists',
        "If someone's ready to commit to both tracks right away, Pro is one payment, no prerequisite — mention it once, don't dwell",
        'Keep the track cards fast — context, not the emotional core',
        'The capability list underneath is the answer to "what will I actually be able to DO after this" — walk it briefly, it\'s what turns "I watched 12 projects" into "I have a new skill"',
      ],
      story: 'None needed.',
      interactionPrompt: 'None — keep this moving into who they become.',
      transition: "But this isn't really about which track. It's about who you become along the way.",
    },
  },
  {
    id: 'who-you-become',
    label: 'Who you become',
    notes: {
      objective: 'Land the core belief of the entire session: I can become an AI Builder. Give this slide its own uninterrupted moment — it\'s the emotional peak, not a footnote to the track slide.',
      talkingPoints: [
        'Walk the ladder out loud: Apprentice → Builder → Engineer → Architect → Master',
        "This is tracked, real XP — not a metaphor, not marketing language",
        'The signature line lands here for a second time, right before the closing identity line — let both sit for a beat',
        'Say the closing line slowly and mean it: "You don\'t need permission to call yourself a builder. You need one shipped agent." — it\'s sized as a hero statement on screen for a reason, this is arguably the single best line in the deck, give it room',
      ],
      story: 'If you know a specific person who leveled up and it changed something real for them — confidence, a job, a side income — this is the moment to tell it, briefly.',
      interactionPrompt: 'Chat: "Which level do you want to hit by the end of this month?"',
      transition: "And this isn't just useful for your own work — it can pay you too.",
    },
  },
  {
    id: 'make-money',
    label: 'You can get paid for this',
    notes: {
      objective: "Answer the question a lot of the room is quietly asking: not just \"can I use this myself,\" but \"can I earn from it.\" John's story is real client proof that businesses already pay for exactly this.",
      talkingPoints: [
        "Be precise about John: he didn't build the agent himself — we built it, he uses it every day at work. He's proof businesses pay for this, not a Builder success story",
        'Walk the three paths briefly — freelance, retainers, in-house — pick whichever matches the room from chat intros',
        "For a Nigerian audience specifically, this can be the single most motivating slide in the deck — say plainly that this is a real, sellable skill, not just a personal productivity trick",
      ],
      story: "If you know a real freelance/agency example (beyond John), this is the place for it.",
      interactionPrompt: 'Chat: "Would you rather use this for your own work, or offer it to others — or both?"',
      transition: "Before we get to Builder 1 itself — let's answer the questions you're probably already asking.",
    },
  },
  {
    id: 'faq',
    label: 'FAQ',
    notes: {
      objective: 'Clear objections before presenting the offer, so the offer lands on a "yes" instead of a "but what about..."',
      talkingPoints: [
        'Answer these honestly, not defensively — if something is a real limitation (e.g. needing a paid Claude account), say so plainly',
        '"What if I don\'t know what to build?", "What if I get stuck?", and "What if AI changes?" are all real, common objections — answer them the same way: honestly, and without hedging',
        "Watch chat for objections that aren't on this slide and address them live if they come up",
      ],
      story: 'None needed.',
      interactionPrompt: 'Chat: "Type your biggest hesitation right now — I want to answer the real ones, not just these five."',
      transition: "With that out of the way — one honest question before the offer.",
    },
  },
  {
    id: 'who-this-is-for',
    label: 'Is this for you?',
    notes: {
      objective: 'Qualify rather than just sell — being selective builds more trust than implying everyone should buy. Keep this brief, it\'s a bridge, not a new section.',
      talkingPoints: [
        "Read the left column with conviction — this is who Builder 1 is actually built for",
        "Read the right column honestly too — it's not a trick, some people genuinely aren't ready for hands-on building yet",
        'Don\'t linger — this sets up the offer, it isn\'t the offer',
      ],
      story: 'None needed.',
      interactionPrompt: 'None — move straight into the offer.',
      transition: "If that's you on the left — here's exactly what's included.",
    },
  },
  {
    id: 'the-offer',
    label: 'Builder 1',
    notes: {
      objective: 'Present the Builder 1 offer with zero ambiguity — price, inclusions, what happens next. Keep this under 5 minutes: you\'ve already sold them, now you\'re just explaining how to buy.',
      talkingPoints: [
        "Don't rush straight into the number. Say what's included first — walk the list — THEN pause, a real 5 seconds, no talking, then say: \"If that's the future you want... Builder 1 is where we start.\" Only then reveal ₦50,000. Inclusions → pause → price, never price → inclusions.",
        'Once you reveal it: state the price out loud, then the anchor: ₦100,000 value, ₦50,000 today, one-time, not a subscription',
        'Say plainly what happens after payment: sign up, pay, Session 1 unlocks immediately — no waiting for a cohort',
        "Mention once: Builder 2 is there when you're ready for it",
      ],
      story: 'None needed — this is a clarity moment, not a story moment.',
      interactionPrompt: 'Chat: "Type BUILD if you\'re leaning toward starting this week."',
      transition: 'Before you go — I want to leave you with one thing to think about.',
    },
  },
  {
    id: 'final-invitation',
    label: 'Final invitation',
    notes: {
      objective: 'Close on a vivid picture of the future, not a pitch — then give a clean, unhurried path to act.',
      talkingPoints: [
        'Deliver the "six months from now" lines slowly, with real pauses — this only works if you don\'t rush it',
        'Let the payoff line land before moving to the CTA: "Instead of saying \'I don\'t know...\' — you say \'I can build that.\'"',
        'Walk through the QR code / link and the steps on screen',
        "Actually go quiet for 60 seconds and let people act — don't fill the silence",
      ],
      story: 'None needed — the slide carries its own narrative.',
      interactionPrompt: '"Scan now if you\'re ready — I\'ll wait 60 seconds before we open it up for questions."',
      transition: "Now let's open it up for questions.",
    },
  },
  {
    id: 'qa',
    label: 'Q&A',
    notes: {
      objective: 'A clean, low-distraction backdrop for open discussion — the pitch is already made, this is just a calm place to land questions.',
      talkingPoints: [
        'Field questions naturally — a real QR code and button stay visible so anyone ready can act mid-conversation without you having to stop and re-show the previous slide',
        "If a question is really a disguised objection, answer it the same honest way as the FAQ section",
        'The signature line closes the deck for the third and final time here — let it be the last thing people read before the session ends',
      ],
      story: 'None needed.',
      interactionPrompt: 'Chat: "Drop your questions — I\'ll work through as many as we have time for."',
      transition: '— end of session —',
    },
  },
];
