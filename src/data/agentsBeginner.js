// Beginner Agents (1-12) — metadata only; full guide content lives in Supabase `course_content`
// Array order is the order students see (sidebar numbering, "Session N of 12",
// Previous/Next), not id order. Founder-set 2026-10-15: Daily News, Calendar,
// Meeting Notes, Slack, Social Post, Document Summarizer, then the rest.
//
// week/isMainProject group these into 4 weeks of a live cohort, each week
// sharing a mechanism (not just a topic) rather than a random split:
//   Week 1 — scheduled digests: read a source on a timer, summarize, deliver
//   Week 2 — structuring: messy input in, clean organized output out
//   Week 3 — triage & decisioning: something arrives, classify/score, act
//   Week 4 — outward-facing: talks to or writes for other people
// Each week has exactly one isMainProject:true agent — completing it alone
// earns that week's certificate (see claim_certificate in Supabase); the
// other two agents in the week are optional and don't gate it.
export const agentsBeginner = [
  {
    id: 4,
    week: 1,
    isMainProject: true,
    slug: "daily-news-industry-summary-agent",
    title: "Daily News & Industry Summary Agent",
    emoji: "📰",
    department: [
      "Executive / Strategy",
    ],
    departmentIds: [
      "strategy",
    ],
    difficulty: "Builder 1",
    description: "Build a zero-code automated briefing agent on Make.com — pulls daily headlines via Google News RSS, uses free Gemini AI to write a 5-minute executive summary, and delivers it to your inbox every morning. No Python, no API billing.",
    techStack: [
      "Make.com",
      "Google News RSS",
      "Google AI Studio (Gemini)",
      "Gmail",
    ],
    buildTime: "1 hr",
    xp: 200,
    popularity: 80,
    prerequisites: [
      "Make.com free account",
      "Gmail account",
      "Google AI Studio account (free)",
    ],
    tags: [
      "automation",
      "news",
      "briefing",
      "no-code",
    ],
  },
  {
    id: 11,
    week: 1,
    isMainProject: false,
    slug: "calendar-task-prioritizer-agent",
    title: "Calendar & Task Prioritizer Agent",
    emoji: "🗓️",
    department: [
      "Operations",
    ],
    departmentIds: [
      "operations",
    ],
    difficulty: "Builder 1",
    description: "Every morning, reads your Google Calendar and Google Tasks, uses Gemini (free) to fit your tasks around your meetings, checks the AI's plan in code, and emails you a clean daily plan. Runs on Google's servers with nothing to install.",
    techStack: [
      "Google Apps Script",
      "Google Calendar",
      "Google Tasks",
      "Gemini API",
    ],
    buildTime: "1 hr",
    xp: 250,
    popularity: 76,
    prerequisites: [
      "A Google account",
    ],
    tags: [
      "productivity",
      "calendar",
      "planning",
    ],
  },
  {
    id: 5,
    week: 2,
    isMainProject: true,
    slug: "meeting-notes-formatter-agent",
    title: "Meeting Notes Formatter Agent",
    emoji: "📝",
    department: [
      "Operations",
    ],
    departmentIds: [
      "operations",
    ],
    difficulty: "Builder 1",
    description: "Paste a messy meeting transcript and get clean notes: a summary, decisions and an action item table with owners and deadlines. Claude builds it as one web page and a free Gemini key does the thinking, with no coding.",
    techStack: [
      "Claude",
      "HTML",
      "Gemini API",
    ],
    buildTime: "1 hr",
    xp: 280,
    popularity: 75,
    prerequisites: [
      "A free Claude account",
      "A free Gemini API key",
    ],
    tags: [
      "productivity",
      "meetings",
      "documentation",
    ],
  },
  {
    id: 3,
    week: 1,
    isMainProject: false,
    slug: "slack-morning-briefing-bot",
    title: "Slack Morning Briefing Bot",
    emoji: "☀️",
    department: [
      "Operations",
    ],
    departmentIds: [
      "operations",
    ],
    difficulty: "Builder 1",
    description: "A bot that runs every morning at 8am, reads your top Slack channels for the past 24 hours, and sends a prioritized briefing to your DM.",
    techStack: [
      "Python",
      "Slack API",
      "Claude API",
    ],
    buildTime: "2 hrs",
    xp: 250,
    popularity: 88,
    prerequisites: [
      "Slack workspace admin access",
    ],
    tags: [
      "automation",
      "slack",
      "productivity",
    ],
  },
  {
    id: 7,
    week: 4,
    isMainProject: false,
    slug: "social-media-post-generator",
    title: "Social Media Post Generator",
    emoji: "📱",
    department: [
      "Marketing",
    ],
    departmentIds: [
      "marketing",
    ],
    difficulty: "Builder 1",
    description: "Type your news once and get five checked, ready-to-post versions for LinkedIn, X, Instagram, Facebook and Threads. Plain Python checks length, hashtags and banned words, and the AI fixes only what fails.",
    techStack: [
      "Python",
      "Gemini API",
      "Streamlit",
    ],
    buildTime: "1.5 hrs",
    xp: 200,
    popularity: 92,
    prerequisites: [
      "A free Google account (for the Gemini key)",
      "Python 3.10 or newer",
    ],
    tags: [
      "marketing",
      "content",
      "social-media",
    ],
  },
  {
    id: 8,
    week: 2,
    isMainProject: false,
    slug: "document-summarizer-agent",
    title: "Document Summarizer Agent",
    emoji: "📄",
    department: [
      "Legal",
      "Operations",
    ],
    departmentIds: [
      "legal",
      "operations",
    ],
    difficulty: "Builder 1",
    description: "Drop a PDF, Word file, text file or link and get an executive brief, key points, action items and risks, plus follow-up questions. Claude builds it as one web page and it reads long and scanned documents.",
    techStack: [
      "Claude",
      "HTML",
      "Gemini API",
    ],
    buildTime: "1.5 hrs",
    xp: 270,
    popularity: 85,
    prerequisites: [
      "A free Claude account",
      "A free Gemini API key",
    ],
    tags: [
      "documents",
      "summarization",
      "productivity",
    ],
  },
  {
    id: 12,
    week: 2,
    isMainProject: false,
    slug: "basic-data-extractor-agent",
    title: "Basic Data Extractor Agent",
    emoji: "🧮",
    department: [
      "Data & Analytics",
    ],
    departmentIds: [
      "data",
    ],
    difficulty: "Builder 1",
    description: "Paste unstructured text (emails, PDFs, web pages) and extract structured data — names, dates, numbers, entities — into a clean CSV.",
    techStack: [
      "Python",
      "Claude API",
      "pandas",
    ],
    buildTime: "1.5 hrs",
    xp: 220,
    popularity: 82,
    prerequisites: [
      "Basic pandas familiarity",
    ],
    tags: [
      "data-extraction",
      "automation",
      "csv",
    ],
  },
  {
    id: 6,
    week: 4,
    isMainProject: false,
    slug: "simple-faq-chatbot",
    title: "Simple FAQ Chatbot",
    emoji: "🤖",
    department: [
      "Customer Support",
    ],
    departmentIds: [
      "support",
    ],
    difficulty: "Builder 1",
    description: "Plan your FAQ, have Claude build a chatbot as one web page that answers only from it, then publish it free on Netlify and add it to your website. No coding needed, with an optional free Gemini AI upgrade.",
    techStack: [
      "Claude",
      "HTML",
      "Netlify",
      "Gemini API (optional)",
    ],
    buildTime: "1.5 hrs",
    xp: 250,
    popularity: 90,
    prerequisites: [
      "A free Claude account",
      "A laptop or desktop computer",
    ],
    tags: [
      "chatbot",
      "support",
      "rag-lite",
    ],
  },
  {
    id: 1,
    week: 3,
    isMainProject: true,
    slug: "gmail-ai-triage-agent",
    title: "Gmail AI Triage Agent",
    emoji: "📧",
    videoId: "ScMzIvxBSi4",
    department: [
      "Operations",
      "Sales",
    ],
    departmentIds: [
      "operations",
      "sales",
    ],
    difficulty: "Builder 1",
    description: "Reads your new Gmail every 10 minutes, classifies and labels it, alerts you on Telegram, drafts replies in your own voice and lets you chat with it. Nothing is sent without your tap.",
    techStack: [
      "Google Apps Script",
      "Gemini API",
      "Telegram",
    ],
    buildTime: "5.5 hrs",
    xp: 300,
    popularity: 98,
    prerequisites: [
      "A Gmail account",
      "A Telegram account",
      "A free Gemini API key",
    ],
    tags: [
      "automation",
      "email",
      "productivity",
    ],
  },
  {
    id: 10,
    week: 3,
    isMainProject: false,
    slug: "price-competitor-monitor-agent",
    title: "Price & Competitor Monitor Agent",
    emoji: "🔍",
    department: [
      "Operations",
      "Marketing",
    ],
    departmentIds: [
      "operations",
      "marketing",
    ],
    difficulty: "Builder 1",
    description: "Monitor competitor product pages and pricing — get an email alert when prices change or new products appear.",
    techStack: [
      "Python",
      "requests",
      "Claude API",
    ],
    buildTime: "2.5 hrs",
    xp: 300,
    popularity: 78,
    prerequisites: [
      "Basic HTML/CSS selector knowledge",
    ],
    tags: [
      "competitive-intel",
      "scraping",
      "monitoring",
    ],
  },
  {
    id: 9,
    week: 3,
    isMainProject: false,
    slug: "lead-capture-qualifier-bot",
    title: "Lead Capture & Qualifier Bot",
    emoji: "🎯",
    department: [
      "Sales",
    ],
    departmentIds: [
      "sales",
    ],
    difficulty: "Builder 1",
    description: "Scores every new form submission, sorts it into hot, warm or cold, logs a follow-up deadline and emails you the moment a hot lead arrives. Built free with Google Forms, Sheets, Apps Script and Gemini.",
    techStack: [
      "Google Forms",
      "Google Sheets",
      "Apps Script",
      "Gemini API",
    ],
    buildTime: "1.5 hrs",
    xp: 320,
    popularity: 87,
    prerequisites: [
      "A Google account",
      "A free Gemini API key",
    ],
    tags: [
      "sales",
      "crm",
      "lead-scoring",
    ],
  },
  {
    id: 2,
    week: 4,
    isMainProject: true,
    slug: "whatsapp-auto-reply-bot",
    title: "WhatsApp Auto-Reply Bot",
    emoji: "💬",
    department: [
      "Sales",
      "Customer Support",
    ],
    departmentIds: [
      "sales",
      "support",
    ],
    difficulty: "Builder 1",
    description: "A WhatsApp bot that receives messages, understands intent, and replies in your personal voice 24/7 using a persona file.",
    techStack: [
      "Node.js",
      "Twilio",
      "Claude API",
    ],
    buildTime: "3 hrs",
    xp: 350,
    popularity: 95,
    prerequisites: [
      "Basic JavaScript/Node.js",
      "Twilio account",
      "Personal phone for testing",
    ],
    tags: [
      "automation",
      "messaging",
      "whatsapp",
    ],
  },
];
