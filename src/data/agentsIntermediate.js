// Intermediate Agents (13-25)
export const agentsIntermediate = [
  {
    id: 13,
    title: 'Web Research Agent',
    emoji: '🔍',
    department: ['Marketing', 'Executive / Strategy'],
    departmentIds: ['marketing', 'strategy'],
    difficulty: 'Intermediate',
    description:
      'Give it a research topic and it searches the web, reads full source content, and synthesizes a structured brief with citations.',
    whatYouBuild:
      'A LangChain-powered research agent that takes any topic, runs multiple Tavily searches, scrapes the resulting pages, and asks Claude to produce a structured brief — Background, Key Findings, Data Points, Conflicting Views, and Conclusion — with every claim linked back to its source URL.',
    whatYouLearn: [
      'Use the Tavily search API designed for AI agents',
      'Chain tools together with LangChain',
      'Scrape and clean full-page web content',
      'Design multi-section synthesis prompts',
      'Track and attach source citations to generated text',
      'Build iterative, follow-up research loops',
    ],
    techStack: ['Python', 'Tavily API', 'Claude API', 'LangChain'],
    buildTime: '4 hrs',
    xp: 480,
    popularity: 88,
    prerequisites: ['Basic Python', 'Completed at least one Beginner agent', 'Tavily API key (free tier)'],
    tags: ['research', 'web search', 'synthesis', 'rag'],
    session: {
      totalTime: '110 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Run AI-optimized web searches with Tavily for any research topic',
        'Pull full page content for sources that need more depth',
        'Have Claude synthesize everything into a structured brief with citations',
        'Automatically run a follow-up search round to fill gaps in the first draft',
      ],
      whatYouNeed: [
        'Claude Code, Cowork, or Claude Desktop open with a project folder set as your working directory',
        'A free Tavily API key (tavily.com — 1,000 searches/month free)',
        'A research topic you actually want a brief on',
      ],
      builds: [
        {
          number: 1,
          title: 'Set up search and run your first query',
          time: '25 min',
          description: 'Get raw search results flowing before worrying about synthesis.',
          steps: [
            {
              instruction: 'Sign up at tavily.com and copy your API key. Add it to a .env file along with your Anthropic key: TAVILY_API_KEY=... and ANTHROPIC_API_KEY=...',
            },
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'I\'m building a research agent. Please create:\n1. requirements.txt with langchain, langchain-anthropic, langchain-community, tavily-python, python-dotenv, beautifulsoup4, requests\n2. search.py with a web_search(query, max_results=10) function that uses the Tavily client (search_depth="advanced") and returns a list of {"title": ..., "url": ..., "snippet": ...} dicts\n\nAdd a small main block that runs web_search() on a test topic and prints the titles and URLs.',
              verify: 'Run search.py with a real topic — you should see 10 titles and URLs printed. If you get an auth error, double-check TAVILY_API_KEY is loaded via python-dotenv.',
            },
          ],
          goFurther: 'Try a few different topics and compare result quality — note which kinds of topics return rich snippets vs. thin ones (you\'ll want the scraper for the latter).',
        },
        {
          number: 2,
          title: 'Add a content scraper for thin sources',
          time: '20 min',
          description: 'Some search snippets are too short to cite meaningfully — fetch the full page when needed.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Create scraper.py with a fetch_full_text(url, max_chars=6000) function that fetches a URL with requests (10s timeout, a realistic User-Agent), parses it with BeautifulSoup, strips out script/style/nav/footer tags, collapses whitespace, and returns up to max_chars of clean text. Wrap it in a try/except that returns an empty string on any error.',
              verify: 'Run fetch_full_text() on a URL from your search results — you should get back a chunk of readable text with no HTML tags or navigation junk. Try it on a URL that\'s likely to block bots and confirm it returns "" instead of crashing.',
            },
          ],
          goFurther: 'Ask Claude to make fetch_full_text only get called for sources whose Tavily snippet is under ~200 characters, to save time on sources that are already rich.',
        },
        {
          number: 3,
          title: 'Build the Claude synthesizer and citations',
          time: '35 min',
          description: 'This is the heart of the agent — turning a pile of sources into a structured, cited brief.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Now build the synthesis layer for my research agent:\n\n1. synthesize.py using langchain_anthropic\'s ChatAnthropic (model "claude-sonnet-4-5", max_tokens 2000) with a synthesize(topic, sources) function. Number each source as [Source N] in the context, and prompt Claude to write a brief with these exact sections: ## Background, ## Key Findings (cite sources like [Source 2]), ## Data Points, ## Conflicting Views, ## Conclusion.\n2. citations.py with build_reference_list(sources) that returns a "## References" section mapping [Source N] to its title and URL\n3. report.py with save_report(topic, brief, references) that writes everything to a Markdown file named report_<date>_<topic-slug>.md',
              verify: 'Run the full pipeline on your test topic: search -> synthesize -> save_report. Open the resulting Markdown file and confirm it has all 5 sections plus a References list, with [Source N] citations matching real URLs.',
            },
          ],
          goFurther: '🛠️ Read through the "Conflicting Views" section critically — does it actually surface disagreement between sources, or just restate the same point twice? Tweak the prompt if it\'s too shallow.',
        },
        {
          number: 4,
          title: 'Add a follow-up research round',
          time: '30 min',
          description: 'The first brief always has gaps — let Claude identify them and search again.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Add a follow-up loop to my research agent:\n\n1. followup.py with get_followup_queries(llm, topic, brief) that asks Claude to read the brief and return up to 3 follow-up search queries (as a JSON array of strings) that would fill the most important gaps\n2. main.py that ties it all together: run the initial search + synthesis + report, then call get_followup_queries(), run web_search() on each follow-up query, merge the new sources with the originals, re-run synthesize() with the combined source list, and save the final report\n\nCap follow-up rounds at 1 round only.',
              verify: 'Run main.py end-to-end on a real topic. The final report should reference more sources than the first draft and should address at least one gap that the follow-up queries targeted — compare the before/after Key Findings sections.',
            },
          ],
          goFurther: '🛠️🛠️ Ask Claude to add a --depth flag that lets you choose 0, 1, or 2 follow-up rounds, and print how many Tavily credits each run used.',
        },
      ],
      portfolio: 'You just built a research agent that can produce a cited brief on almost any topic in minutes. Save one of your generated reports (redact anything sensitive) and add "Web Research Agent" to your build portfolio with the topic you researched.',
      portfolioPrompt: 'I just built a web research agent: it runs Tavily searches on a topic, scrapes full page content for thin sources, and uses Claude to synthesize everything into a structured, cited brief (Background, Key Findings, Data Points, Conflicting Views, Conclusion) — then runs a follow-up search round to fill gaps before producing the final report.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows',
    },
    steps: [
      {
        number: 1,
        title: 'Get a Tavily API key',
        description: 'Sign up at tavily.com — the free tier includes 1,000 searches per month, optimized for LLM agents.',
        code: `# .env
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx`,
        tip: 'Tavily results already include cleaned snippets, so you often do not need a separate scraper for short briefs.',
      },
      {
        number: 2,
        title: 'Install LangChain and Tavily client',
        description: 'Install the LangChain core packages along with the Anthropic and Tavily integrations.',
        code: `pip install langchain langchain-anthropic langchain-community tavily-python python-dotenv`,
        tip: 'Pin langchain and langchain-anthropic to compatible minor versions — the LangChain API changes quickly.',
      },
      {
        number: 3,
        title: 'Build the search tool',
        description: 'Wrap the Tavily client to return the top 10 relevant URLs, titles, and content snippets for a query.',
        code: `# search.py
import os
from tavily import TavilyClient

tavily = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])

def web_search(query, max_results=10):
    response = tavily.search(query=query, max_results=max_results, search_depth="advanced")
    return [
        {"title": r["title"], "url": r["url"], "snippet": r["content"]}
        for r in response["results"]
    ]`,
        tip: '"advanced" search_depth costs more credits but returns much richer snippets — worth it for research briefs.',
      },
      {
        number: 4,
        title: 'Build the content scraper',
        description: 'For sources where the snippet is too short, fetch and clean the full page text.',
        code: `# scraper.py
import requests
from bs4 import BeautifulSoup

def fetch_full_text(url, max_chars=6000):
    try:
        resp = requests.get(url, timeout=10, headers={"User-Agent": "AgentForgeBot/1.0"})
        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer"]):
            tag.decompose()
        text = " ".join(soup.get_text(separator=" ").split())
        return text[:max_chars]
    except Exception:
        return ""`,
        tip: 'Wrap scraping in try/except — some sites block bots and you do not want one failure to crash the whole run.',
      },
      {
        number: 5,
        title: 'Build the Claude synthesizer',
        description: 'Send all collected sources to Claude and request a structured research brief with named sections.',
        code: `# synthesize.py
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(model="claude-sonnet-4-5", max_tokens=2000)

def synthesize(topic, sources):
    context = "\\n\\n".join(
        f"[Source {i+1}] {s['title']} ({s['url']})\\n{s['snippet']}"
        for i, s in enumerate(sources)
    )
    prompt = f"""Research topic: {topic}

Sources:
{context}

Write a structured research brief with these sections:
## Background
## Key Findings (cite sources like [Source 2])
## Data Points
## Conflicting Views
## Conclusion"""
    return llm.invoke(prompt).content`,
        tip: 'Numbering sources [Source N] makes it trivial to map citations back to URLs in the output formatter.',
      },
      {
        number: 6,
        title: 'Add source citation mapping',
        description: 'Build a footer that converts [Source N] markers into a numbered reference list with clickable links.',
        code: `# citations.py
def build_reference_list(sources):
    lines = ["\\n## References"]
    for i, s in enumerate(sources):
        lines.append(f"[Source {i+1}] {s['title']} — {s['url']}")
    return "\\n".join(lines)`,
        tip: 'Keep the source list separate from the prompt output so Claude cannot accidentally hallucinate extra references.',
      },
      {
        number: 7,
        title: 'Build the output formatter',
        description: 'Combine the brief and reference list into a single Markdown report file.',
        code: `# report.py
from datetime import date

def save_report(topic, brief, references):
    filename = f"report_{date.today()}_{topic[:20].replace(' ', '_')}.md"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(f"# Research Brief: {topic}\\n\\n{brief}\\n{references}")
    return filename`,
        tip: 'Markdown reports paste cleanly into Notion, Confluence, or Google Docs for sharing with stakeholders.',
      },
      {
        number: 8,
        title: 'Add a follow-up query loop',
        description: 'After the first brief, ask Claude what it is still uncertain about, then run one more search round to fill gaps.',
        code: `# followup.py
def get_followup_queries(llm, topic, brief):
    prompt = f"""Given this research brief on "{topic}":

{brief}

List up to 3 follow-up search queries that would fill the most important gaps.
Respond as a JSON array of strings only."""
    import json
    return json.loads(llm.invoke(prompt).content)`,
        tip: 'Cap follow-up rounds at 1-2 — diminishing returns set in fast and Tavily credits add up.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Web Research Agent (starter)
Run: pip install tavily-python langchain-anthropic python-dotenv beautifulsoup4 requests
"""
import os, json
from dotenv import load_dotenv
from tavily import TavilyClient
from langchain_anthropic import ChatAnthropic

load_dotenv()
tavily = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])
llm = ChatAnthropic(model="claude-sonnet-4-5", max_tokens=2000)

def research(topic):
    results = tavily.search(query=topic, max_results=8, search_depth="advanced")["results"]
    context = "\\n\\n".join(
        f"[Source {i+1}] {r['title']} ({r['url']})\\n{r['content']}"
        for i, r in enumerate(results)
    )
    prompt = f"""Research topic: {topic}

Sources:
{context}

Write a structured brief with: Background, Key Findings (cite [Source N]), Data Points, Conflicting Views, Conclusion."""
    brief = llm.invoke(prompt).content
    refs = "\\n".join(f"[Source {i+1}] {r['title']} — {r['url']}" for i, r in enumerate(results))
    return f"{brief}\\n\\n## References\\n{refs}"

if __name__ == "__main__":
    print(research("AI agents in enterprise sales operations"))
`,
    resources: [
      { title: 'Tavily API Docs', url: 'https://docs.tavily.com' },
      { title: 'LangChain Anthropic Integration', url: 'https://python.langchain.com/docs/integrations/chat/anthropic' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 14,
    title: 'CRM Lead Follow-Up Agent',
    emoji: '📇',
    department: ['Sales'],
    departmentIds: ['sales'],
    difficulty: 'Intermediate',
    description:
      'Monitors HubSpot for stale deals, writes personalized follow-up emails using full deal context, and saves them as drafts.',
    whatYouBuild:
      'A scheduled Python job that scans your HubSpot pipeline for deals with no activity in 7+ days, pulls the contact, company, and note history for each one, asks Claude to write a personalized follow-up referencing real context, and saves the result as a Gmail draft — then pings Slack so reps know drafts are ready.',
    whatYouLearn: [
      'Query the HubSpot CRM API for deals and engagement history',
      'Enrich records with associated contacts and companies',
      'Engineer prompts that personalize using real CRM data',
      'Save AI drafts safely for human review',
      'Send team notifications via Slack webhooks',
      'Schedule recurring CRM automation jobs',
    ],
    techStack: ['Python', 'HubSpot API', 'Claude API', 'schedule'],
    buildTime: '5 hrs',
    xp: 560,
    popularity: 84,
    prerequisites: ['Basic Python', 'HubSpot account (free tier works)', 'Gmail account'],
    tags: ['sales', 'crm', 'email', 'automation'],
    session: {
      totalTime: '120 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Scan your HubSpot pipeline for deals with no activity in 7+ days',
        'Pull contact, company, and note context for each stale deal',
        'Have Claude write a personalized, on-brand follow-up email for each one',
        'Save every email as a Gmail draft and ping Slack when drafts are ready',
      ],
      whatYouNeed: [
        'Claude Code, Cowork, or Claude Desktop open with a project folder set as your working directory',
        'A HubSpot account (free tier works) with a Private App token',
        'A Gmail account with the Gmail API enabled (reuse credentials.json from Agent #1 if you built it)',
        '(Optional) A Slack Incoming Webhook URL',
      ],
      builds: [
        {
          number: 1,
          title: 'Connect to HubSpot and find stale deals',
          time: '30 min',
          description: 'Before writing any emails, find out which deals actually need attention.',
          steps: [
            {
              instruction: 'In HubSpot, go to Settings > Integrations > Private Apps, create an app with crm.objects.deals.read/write, crm.objects.contacts.read, and crm.objects.companies.read scopes, and copy the token into your .env as HUBSPOT_TOKEN.',
            },
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'I\'m building a CRM follow-up agent. Please create:\n1. requirements.txt with hubspot-api-client, anthropic, python-dotenv, requests\n2. deals.py with get_stale_deals(token, days=7) that uses the HubSpot client to fetch open deals (properties: dealname, dealstage, hs_lastmodifieddate, amount), filters to deals whose hs_lastmodifieddate is older than `days` days AND whose dealstage is not closedwon/closedlost, and returns that list. Paginate using the `after` cursor if there are more than 100 deals.\n\nAdd a small main block that prints the dealname and stage of each stale deal.',
              verify: 'Run the script — it should print a list of your actually-stale open deals. If nothing prints, lower `days` temporarily to confirm the filter logic works, then set it back to 7.',
            },
          ],
          goFurther: 'Check a couple of the listed deals manually in HubSpot — confirm they really haven\'t been touched in 7+ days and aren\'t closed.',
        },
        {
          number: 2,
          title: 'Enrich each deal with contact and note context',
          time: '25 min',
          description: 'A generic follow-up is worse than no follow-up — pull real context for personalization.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Create enrich.py with an enrich_deal(client, deal) function that, for a given HubSpot deal:\n1. Looks up its associated contact (first associated contact only) and fetches firstname, lastname, email, jobtitle\n2. Fetches up to 5 recent notes associated with the deal and extracts their hs_note_body text\n3. Returns {"deal": deal, "contact": contact_or_None, "recent_notes": [list of note text strings]}\n\nHandle the case where a deal has no associated contact or no notes gracefully (use None / empty list).',
              verify: 'Run enrich_deal() on one stale deal from Build 1 and print the result — you should see the contact\'s name/title (or None) and a list of note snippets (or an empty list), without errors.',
            },
          ],
          goFurther: '🛠️ Ask Claude to also pull the associated company name and industry, and include it in the enriched context for even better personalization.',
        },
        {
          number: 3,
          title: 'Generate personalized, on-brand emails',
          time: '30 min',
          description: 'This is where Claude turns deal context into something a rep would actually send.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Create writer.py with a SYSTEM_PROMPT constant containing house rules for sales follow-up emails (never mention pricing/discounts, end with exactly one clear call-to-action like "15-min call this week?", friendly-professional tone, no corporate jargon), and a write_followup(context) function that:\n1. Builds a prompt using the contact\'s name/title, the deal name/stage/amount, and recent notes from the enriched context\n2. If recent_notes is empty, falls back to referencing just the deal stage\n3. Sends it to Claude (model "claude-sonnet-4-5", max_tokens 300, using the system prompt) asking for ONLY the email body (under 100 words, no subject line)\n4. Returns the email text',
              verify: 'Run write_followup() on the enriched deal from Build 2. The email should reference something specific from the deal/notes, stay under ~100 words, end with one clear CTA, and never mention pricing or discounts. Try it on a deal with no notes too — it should still produce a sensible (if more generic) email.',
            },
          ],
          goFurther: 'Adjust the SYSTEM_PROMPT rules to match your own company\'s tone (e.g. more casual, or always sign off with a specific name) and regenerate — confirm the tone actually shifts.',
        },
        {
          number: 4,
          title: 'Save drafts, notify Slack, and schedule it',
          time: '35 min',
          description: 'Wire it all together so reps wake up to ready-to-review drafts.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Finish my CRM follow-up agent:\n\n1. gmail_draft.py with save_gmail_draft(service, to_email, subject, body) that builds a MIMEText message and creates a Gmail draft via the Gmail API (reuse the same OAuth setup pattern as a Gmail agent if I have one — otherwise set up a basic Gmail API service with drafts scope)\n2. notify.py with notify_slack(webhook_url, count) that posts a message to a Slack Incoming Webhook saying "{count} stale deal(s) just got AI-drafted follow-ups — check your Gmail drafts!"\n3. main.py that ties everything together: get_stale_deals() -> enrich_deal() for each -> write_followup() -> save_gmail_draft() (subject: "Following up — {dealname}") -> notify_slack() with the total count\n\nThen tell me the schedule library code or crontab line to run main.py once every weekday morning.',
              verify: 'Run main.py on a small number of stale deals. Check Gmail Drafts — you should see one draft per stale deal, each addressed to the right contact with a personalized body. If Slack is configured, confirm the summary message arrives.',
            },
          ],
          goFurther: '🛠️🛠️ Ask Claude to add a dry-run mode that prints what it would do (which deals, which contacts, draft previews) without actually creating drafts or posting to Slack — useful for safely testing prompt changes.',
        },
      ],
      portfolio: 'You just built an agent that keeps your sales pipeline warm without anyone lifting a finger. Take a screenshot of a generated Gmail draft (redact any real customer info) and add "CRM Lead Follow-Up Agent" to your build portfolio.',
      portfolioPrompt: 'I just built a CRM follow-up agent: it scans HubSpot for deals with no activity in 7+ days, enriches each one with contact and note history, has Claude write a personalized on-brand follow-up email referencing real context, saves it as a Gmail draft for rep review, and posts a Slack summary when drafts are ready.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows',
    },
    steps: [
      {
        number: 1,
        title: 'Set up a HubSpot private app',
        description: 'In HubSpot, go to Settings > Integrations > Private Apps, create an app with CRM read/write scopes, and copy the access token.',
        code: `# .env
HUBSPOT_TOKEN=pat-na1-xxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx`,
        tip: 'Grant crm.objects.deals.read/write, crm.objects.contacts.read, and crm.objects.companies.read scopes only.',
      },
      {
        number: 2,
        title: 'Install dependencies',
        description: 'Install the official HubSpot client, Anthropic SDK, and a scheduler.',
        code: `pip install hubspot-api-client anthropic schedule python-dotenv`,
        tip: 'The hubspot-api-client wraps every CRM endpoint with typed methods — explore its docs before writing raw HTTP calls.',
      },
      {
        number: 3,
        title: 'Build the deal monitor',
        description: 'Fetch open deals and filter to those whose hs_lastmodifieddate is more than 7 days old.',
        code: `# deals.py
from datetime import datetime, timedelta, timezone
from hubspot import HubSpot

def get_stale_deals(token, days=7):
    client = HubSpot(access_token=token)
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    deals = client.crm.deals.basic_api.get_page(
        limit=100, properties=["dealname", "dealstage", "hs_lastmodifieddate", "amount"]
    ).results
    stale = []
    for d in deals:
        modified = datetime.fromisoformat(d.properties["hs_lastmodifieddate"].replace("Z", "+00:00"))
        if modified < cutoff and d.properties["dealstage"] not in ("closedwon", "closedlost"):
            stale.append(d)
    return stale`,
        tip: 'Paginate with the `after` cursor if you have more than 100 open deals.',
      },
      {
        number: 4,
        title: 'Enrich deal context',
        description: 'For each stale deal, pull the associated contact and company records and recent notes.',
        code: `# enrich.py
def enrich_deal(client, deal):
    assoc = client.crm.deals.associations_api.get_all(deal.id, "contacts").results
    contact_id = assoc[0].id if assoc else None
    contact = None
    if contact_id:
        contact = client.crm.contacts.basic_api.get_by_id(
            contact_id, properties=["firstname", "lastname", "email", "jobtitle"]
        )
    notes = client.crm.objects.notes.basic_api.get_page(limit=5).results
    return {"deal": deal, "contact": contact, "recent_notes": [n.properties.get("hs_note_body", "") for n in notes]}`,
        tip: 'Filter notes by association to the specific deal in production — the example above simplifies for clarity.',
      },
      {
        number: 5,
        title: 'Build the Claude email writer',
        description: 'Send the deal stage, contact name, and recent notes to Claude and ask for a personalized follow-up email.',
        code: `# writer.py
from anthropic import Anthropic
client_ai = Anthropic()

def write_followup(context):
    deal = context["deal"].properties
    contact = context["contact"].properties if context["contact"] else {}
    prompt = f"""Write a short, warm follow-up email to a prospect.

Contact: {contact.get('firstname', 'there')} {contact.get('lastname', '')}, {contact.get('jobtitle', '')}
Deal: {deal.get('dealname')} (stage: {deal.get('dealstage')}, amount: {deal.get('amount')})
Recent notes: {context['recent_notes']}

Reference something specific from the notes if possible. Keep it under 100 words.
Output only the email body, no subject line."""
    return client_ai.messages.create(
        model="claude-sonnet-4-5", max_tokens=300, messages=[{"role": "user", "content": prompt}]
    ).content[0].text`,
        tip: 'If recent_notes is empty, the prompt should fall back to referencing the deal stage and product interest only.',
      },
      {
        number: 6,
        title: 'Apply personalization rules',
        description: 'Add a system prompt with house rules: no discounts mentioned, always end with a clear single CTA, match a friendly-professional tone.',
        code: `SYSTEM_PROMPT = """You write sales follow-up emails for AcmeCo.
Rules:
- Never mention pricing or discounts.
- End with exactly one clear call-to-action (e.g. "15-min call this week?").
- Tone: friendly, concise, professional. No corporate jargon."""`,
        tip: 'Keep house rules in a separate constant so sales leadership can review and edit them without touching code.',
      },
      {
        number: 7,
        title: 'Save as a Gmail draft',
        description: 'Reuse the Gmail draft logic from Agent 1 to save each generated email as a draft addressed to the contact.',
        code: `# gmail_draft.py
import base64
from email.mime.text import MIMEText

def save_gmail_draft(service, to_email, subject, body):
    message = MIMEText(body)
    message["to"] = to_email
    message["subject"] = subject
    raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
    service.users().drafts().create(userId="me", body={"message": {"raw": raw}}).execute()`,
        tip: 'Always route through drafts, never `send` — the rep should review tone and accuracy before it goes out.',
      },
      {
        number: 8,
        title: 'Add a Slack notification',
        description: 'Post a summary message to a Slack channel via webhook listing how many drafts are ready.',
        code: `# notify.py
import requests

def notify_slack(webhook_url, count):
    requests.post(webhook_url, json={
        "text": f":envelope: {count} stale deal(s) just got AI-drafted follow-ups — check your Gmail drafts!"
    })`,
        tip: 'Slack incoming webhooks are the simplest way to post — no OAuth scopes required, just a URL.',
      },
    ],
    starterCode: `"""
AgentForge Academy — CRM Lead Follow-Up Agent (starter)
Run: pip install hubspot-api-client anthropic python-dotenv requests
"""
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone
from hubspot import HubSpot
from anthropic import Anthropic

load_dotenv()
hs = HubSpot(access_token=os.environ["HUBSPOT_TOKEN"])
ai = Anthropic()

def stale_deals(days=7):
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    deals = hs.crm.deals.basic_api.get_page(
        limit=100, properties=["dealname", "dealstage", "hs_lastmodifieddate"]
    ).results
    return [
        d for d in deals
        if datetime.fromisoformat(d.properties["hs_lastmodifieddate"].replace("Z", "+00:00")) < cutoff
        and d.properties["dealstage"] not in ("closedwon", "closedlost")
    ]

def write_followup(deal):
    prompt = f"""Write a short follow-up email (under 100 words) for deal "{deal.properties['dealname']}"
currently in stage "{deal.properties['dealstage']}". No subject line, just the body."""
    return ai.messages.create(
        model="claude-sonnet-4-5", max_tokens=300, messages=[{"role": "user", "content": prompt}]
    ).content[0].text

if __name__ == "__main__":
    for deal in stale_deals():
        print("---", deal.properties["dealname"], "---")
        print(write_followup(deal))
`,
    resources: [
      { title: 'HubSpot CRM API Docs', url: 'https://developers.hubspot.com/docs/api/crm/deals' },
      { title: 'hubspot-api-client (Python)', url: 'https://github.com/HubSpot/hubspot-api-python' },
      { title: 'Slack Incoming Webhooks', url: 'https://api.slack.com/messaging/webhooks' },
    ],
  },
  {
    id: 15,
    title: 'LinkedIn Content Creator Agent',
    emoji: '📝',
    department: ['Marketing'],
    departmentIds: ['marketing'],
    difficulty: 'Intermediate',
    description:
      'Feed it your week’s work and ideas — it generates 5 LinkedIn posts in your voice, ready to schedule.',
    whatYouBuild:
      'A content pipeline that takes a weekly input (your wins, ideas, links), combines it with a custom "voice persona" you write once, and asks Claude to generate five distinct post types — insight, story, how-to, opinion, results — then presents them in a Streamlit review UI for editing and scheduling via Buffer or Postiz.',
    whatYouLearn: [
      'Engineer a durable "voice persona" prompt',
      'Generate multiple distinct content formats from one input',
      'Build a lightweight Streamlit review/edit interface',
      'Research and append relevant hashtags with Claude',
      'Integrate with a social scheduling API',
      'Close the loop with engagement-based feedback',
    ],
    techStack: ['Python', 'Claude API', 'Postiz/Buffer API'],
    buildTime: '3.5 hrs',
    xp: 420,
    popularity: 90,
    prerequisites: ['Basic Python', 'Streamlit basics', 'LinkedIn account'],
    tags: ['content', 'linkedin', 'social media', 'personal brand'],
    session: {
      totalTime: '110 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Write a durable "voice persona" file that captures how you actually sound',
        'Turn a few weekly bullet points into 5 distinct LinkedIn post types',
        'Add relevant, non-spammy hashtags to each post',
        'Review, edit, and schedule the week\'s posts from a simple UI',
      ],
      whatYouNeed: [
        'Claude Code, Cowork, or Claude Desktop open with a project folder set as your working directory',
        '3-5 of your best past LinkedIn posts (or posts you admire in your voice) to use as examples',
        'A Buffer or Postiz account (free tier works) for scheduling',
      ],
      builds: [
        {
          number: 1,
          title: 'Write your persona and weekly input',
          time: '25 min',
          description: 'The quality of every post depends on these two files — worth getting right.',
          steps: [
            {
              instruction: 'Create persona.txt — spend ~20 minutes describing your tone, sentence length, audience, themes you write about, and your sign-off style. Then paste in 3-5 of your best past posts as concrete examples.',
            },
            {
              instruction: 'Create input_template.md with this week\'s raw notes: 3-5 bullet points about wins, ideas, or links from the week.',
              verify: 'Read persona.txt back — does it sound like instructions a ghostwriter could follow without ever meeting you? If it\'s too abstract ("be authentic"), add more concrete examples.',
            },
          ],
          goFurther: 'Ask Claude to read your persona.txt and tell you what kind of post it would NOT write based on it — if the answer is vague, your persona file probably needs more specific examples.',
        },
        {
          number: 2,
          title: 'Generate 5 post types from one week of notes',
          time: '30 min',
          description: 'This is the core engine — one input, five distinct outputs.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude (it can read your persona.txt and input_template.md directly):',
              prompt: 'I\'m building a LinkedIn content generator. Read my persona.txt and input_template.md, then create:\n1. requirements.txt with anthropic and streamlit\n2. generate.py with a generate_posts(weekly_input, persona) function that sends both to Claude (model "claude-sonnet-4-5", max_tokens 2000) and asks for 5 distinct LinkedIn posts based on this week\'s notes: (1) an insight post — a lesson learned, (2) a story post — a narrative with a twist, (3) a how-to post — a practical mini-tutorial, (4) an opinion post — a contrarian or strong take, (5) a results post — a number or outcome with context. Return as JSON: {"posts": [{"type": "...", "text": "..."}]}\n3. validate.py with validate_posts(posts) that checks all 5 required types (insight, story, how-to, opinion, results) are present and returns a list of any missing types',
              verify: 'Run generate_posts() on your real weekly notes — you should get back 5 posts, each clearly a different type, and each one should sound like something you\'d actually write (not generic LinkedIn-speak). Run validate_posts() on the result and confirm the missing list is empty.',
            },
          ],
          goFurther: '🛠️ If any post sounds off-voice, find the specific phrase that feels wrong and add a line to persona.txt explicitly avoiding that pattern. Regenerate and compare.',
        },
        {
          number: 3,
          title: 'Add hashtags and a review UI',
          time: '30 min',
          description: 'Get the posts into a shape you can actually edit and approve.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Add to my LinkedIn content generator:\n\n1. hashtags.py with suggest_hashtags(post_text) that asks Claude (max_tokens 100) for 3-5 relevant, non-spammy hashtags for a post (no generic tags like #motivation), returning a JSON array of strings including the # symbol\n2. app.py — a Streamlit app that: generates the 5 posts via generate_posts(), shows each post type as a subheader with an editable text_area (pre-filled with the generated text and a live character count, since LinkedIn truncates over ~3000 chars), shows the suggested hashtags below each, and has an "Approve & Schedule" button per post (the button can just print/log for now)',
              verify: 'Run `streamlit run app.py`. You should see 5 editable post drafts with hashtag suggestions and character counts. Edit one post\'s text and confirm the character count updates live.',
            },
          ],
          goFurther: 'Try editing a post to be much longer than 3000 characters — confirm the character count turns red or warns you before you hit "Approve & Schedule".',
        },
        {
          number: 4,
          title: 'Schedule posts and close the feedback loop',
          time: '25 min',
          description: 'Get posts onto your calendar, and start building a record of what actually works.',
          steps: [
            {
              instruction: 'Get your Buffer (or Postiz) access token and profile ID from your account settings, and add them to .env.',
            },
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Finish my LinkedIn content generator:\n\n1. schedule_post.py with schedule_to_buffer(token, profile_id, text, scheduled_at) that posts to Buffer\'s create-update API (https://api.bufferapp.com/1/updates/create.json) with the text and scheduled time\n2. Add a next_slot(i) helper that returns a scheduled_at timestamp spreading 5 posts across Mon-Fri at 9am of the current/upcoming week\n3. Wire app.py\'s "Approve & Schedule" buttons to call schedule_to_buffer() with the edited text + hashtags appended and next_slot(i)\n4. feedback.py with update_persona_with_results(persona_path, top_post, engagement) that appends a "Performance note" line to persona.txt describing what worked',
              verify: 'Click "Approve & Schedule" on one post and confirm it appears in your Buffer queue at the right time slot. Then manually call update_persona_with_results() with a sample result and confirm a new line is appended to persona.txt.',
            },
          ],
          goFurther: '🛠️🛠️ A few weeks in, pull your top-performing post\'s stats from Buffer/LinkedIn analytics and run update_persona_with_results() for real — then regenerate a week\'s posts and see if the new "performance notes" visibly shift the output.',
        },
      ],
      portfolio: 'You just built a personal content engine that turns a few bullet points into a week of on-brand LinkedIn posts. Take a screenshot of your Streamlit review UI with the 5 generated posts, and add "LinkedIn Content Creator Agent" to your build portfolio.',
      portfolioPrompt: 'I just built a LinkedIn content generator: it takes my weekly notes and a custom "voice persona" file, uses Claude to generate 5 distinct post types (insight, story, how-to, opinion, results) with relevant hashtags, presents them in a Streamlit review UI for editing, and schedules approved posts via the Buffer API.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it (a bit meta, I know)\n3. Three resume-style bullet points describing what I built and the skills it shows',
    },
    steps: [
      {
        number: 1,
        title: 'Build the weekly input system',
        description: 'Create a simple text file or Streamlit text area where you jot down this week’s wins, ideas, and links every Monday.',
        code: `# input_template.md
## This week
- Shipped the new onboarding flow, cut signup time by 40%
- Read a great post about AI agent evals
- Idea: "why most AI demos fail in production"`,
        tip: 'Five minutes of bullet points on Monday is enough raw material for a full week of posts.',
      },
      {
        number: 2,
        title: 'Write your voice persona file',
        description: 'Spend 20 minutes writing ~500 words describing your tone, common phrases, sentence length, and audience.',
        code: `# persona.txt
Voice: Direct, slightly informal, first-person. Short sentences.
Avoid: corporate buzzwords ("synergy", "leverage", "circle back").
Audience: B2B SaaS founders and product leaders.
Recurring themes: building in public, AI in real workflows, lessons from shipping fast.
Sign-off style: end with a question or a one-line takeaway, never "Thoughts?"`,
        tip: 'Paste 3-5 of your best past posts into this file as concrete examples — Claude mimics examples better than abstract rules.',
      },
      {
        number: 3,
        title: 'Build the Claude post generator',
        description: 'Combine the weekly input and persona into one prompt requesting five distinct draft posts.',
        code: `# generate.py
from anthropic import Anthropic
client = Anthropic()

def generate_posts(weekly_input, persona):
    prompt = f"""Persona:
{persona}

This week's raw notes:
{weekly_input}

Write 5 LinkedIn posts based on this week's notes:
1. Insight post (a lesson learned)
2. Story post (a narrative with a twist)
3. How-to post (a practical mini-tutorial)
4. Opinion post (a contrarian or strong take)
5. Results post (a number or outcome with context)

Return as JSON: {{"posts": [{{"type": "...", "text": "..."}}]}}"""
    resp = client.messages.create(model="claude-sonnet-4-5", max_tokens=2000,
        messages=[{"role": "user", "content": prompt}])
    import json
    return json.loads(resp.content[0].text)["posts"]`,
        tip: 'Ask for JSON output so each post type lands in its own card in the review UI.',
      },
      {
        number: 4,
        title: 'Add post variety guardrails',
        description: 'Validate that each of the 5 requested types is present and re-prompt for any missing type.',
        code: `# validate.py
REQUIRED_TYPES = {"insight", "story", "how-to", "opinion", "results"}

def validate_posts(posts):
    found = {p["type"].lower() for p in posts}
    missing = REQUIRED_TYPES - found
    return list(missing)`,
        tip: 'LLMs occasionally merge two types into one post — a quick validation pass catches this before you waste a review cycle.',
      },
      {
        number: 5,
        title: 'Add a hashtag optimizer',
        description: 'For each post, ask Claude for 3-5 relevant, non-spammy hashtags.',
        code: `# hashtags.py
def suggest_hashtags(post_text):
    prompt = f"""Suggest 3-5 relevant LinkedIn hashtags for this post. No generic tags like #motivation.
Post: {post_text}
Return as a JSON array of strings, including the # symbol."""
    resp = client.messages.create(model="claude-sonnet-4-5", max_tokens=100,
        messages=[{"role": "user", "content": prompt}])
    import json
    return json.loads(resp.content[0].text)`,
        tip: 'Cap it at 3-5 hashtags — LinkedIn posts with too many tags read as spammy and get deprioritized.',
      },
      {
        number: 6,
        title: 'Integrate scheduling',
        description: 'Push approved posts to Postiz or Buffer’s API to schedule them across the week.',
        code: `# schedule_post.py
import requests

def schedule_to_buffer(token, profile_id, text, scheduled_at):
    requests.post(
        "https://api.bufferapp.com/1/updates/create.json",
        data={
            "access_token": token,
            "profile_ids[]": profile_id,
            "text": text,
            "scheduled_at": scheduled_at,
        },
    )`,
        tip: 'Spread the 5 posts across the week (e.g. Mon/Tue/Wed/Thu/Fri at 9am) for consistent visibility.',
      },
      {
        number: 7,
        title: 'Build the review UI',
        description: 'Use Streamlit to show all 5 drafts side by side with editable text areas and an "Approve & Schedule" button per post.',
        code: `# app.py
import streamlit as st

st.title("LinkedIn Post Review")
posts = generate_posts(weekly_input, persona)

for i, post in enumerate(posts):
    st.subheader(post["type"].title())
    edited = st.text_area("Post text", post["text"], key=f"post_{i}")
    if st.button("Approve & Schedule", key=f"btn_{i}"):
        schedule_to_buffer(BUFFER_TOKEN, PROFILE_ID, edited, next_slot(i))
        st.success("Scheduled!")`,
        tip: 'Show a live character count under each text area — LinkedIn truncates posts over ~3000 characters.',
      },
      {
        number: 8,
        title: 'Track a performance feedback loop',
        description: 'Weekly, pull impression/engagement stats from LinkedIn or Buffer and append a "what worked" note to your persona file.',
        code: `# feedback.py
def update_persona_with_results(persona_path, top_post, engagement):
    with open(persona_path, "a") as f:
        f.write(f"\\n# Performance note: '{top_post[:60]}...' got {engagement} engagements — more like this.")`,
        tip: 'Over a few months this turns your persona file into a living record of what actually resonates with your audience.',
      },
    ],
    starterCode: `"""
AgentForge Academy — LinkedIn Content Creator Agent (starter)
Run: pip install anthropic streamlit
"""
import json
from anthropic import Anthropic

client = Anthropic()

PERSONA = """Voice: Direct, first-person, short sentences. Avoid buzzwords.
Audience: B2B SaaS founders and product leaders."""

def generate_posts(weekly_notes):
    prompt = f"""Persona:
{PERSONA}

This week's notes:
{weekly_notes}

Write 5 LinkedIn posts: insight, story, how-to, opinion, results.
Return JSON: {{"posts": [{{"type": "...", "text": "..."}}]}}"""
    resp = client.messages.create(model="claude-sonnet-4-5", max_tokens=2000,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)["posts"]

if __name__ == "__main__":
    notes = "Shipped new onboarding flow, cut signup time by 40%. Idea: why AI demos fail in production."
    for post in generate_posts(notes):
        print(f"--- {post['type'].upper()} ---\\n{post['text']}\\n")
`,
    resources: [
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
      { title: 'Buffer API Docs', url: 'https://buffer.com/developers/api' },
      { title: 'Streamlit Docs', url: 'https://docs.streamlit.io' },
    ],
  },
  {
    id: 16,
    title: 'Customer Support RAG Bot',
    emoji: '🤖',
    department: ['Customer Support'],
    departmentIds: ['support'],
    difficulty: 'Intermediate',
    description:
      'Upload your docs, FAQs, and past tickets — the bot answers customer questions accurately using only your real documentation.',
    whatYouBuild:
      'A retrieval-augmented generation (RAG) service: your documentation is chunked, embedded, and stored in Pinecone; a FastAPI endpoint embeds incoming questions, retrieves the most relevant chunks, and asks Claude to answer using only that retrieved context — with source citations attached to every answer.',
    whatYouLearn: [
      'Chunk documents for retrieval with overlap',
      'Generate embeddings with sentence-transformers',
      'Set up and query a Pinecone vector index',
      'Build a RAG prompt that grounds answers in retrieved context',
      'Expose a chat endpoint with FastAPI',
      'Deploy a Python API to Railway',
    ],
    techStack: ['Python', 'Pinecone', 'Claude API', 'FastAPI'],
    buildTime: '5 hrs',
    xp: 600,
    popularity: 93,
    prerequisites: ['Basic Python', 'REST API basics', 'Pinecone account (free tier)'],
    tags: ['rag', 'support', 'vector search', 'chatbot'],
    session: {
      totalTime: '130 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Chunk and embed your real documentation into a Pinecone vector index',
        'Retrieve the most relevant chunks for any customer question',
        'Have Claude answer using ONLY that retrieved context, with source citations',
        'Expose it as a FastAPI /chat endpoint and deploy it to Railway',
      ],
      whatYouNeed: [
        'Claude Code, Cowork, or Claude Desktop open with a project folder set as your working directory',
        'A free Pinecone account and API key',
        '4-6 of your real docs/FAQs/policy pages saved as plain .txt or .md files',
      ],
      builds: [
        {
          number: 1,
          title: 'Prepare your knowledge base and Pinecone index',
          time: '20 min',
          description: 'Clean inputs make or break a RAG bot — start here.',
          steps: [
            {
              instruction: 'Create a docs/ folder and save 4-6 of your real product docs, FAQs, or policy pages as plain .txt or .md files. Strip out navigation menus, headers, and boilerplate — keep just the actual content.',
            },
            {
              instruction: 'In Pinecone, create a free account and a new index with dimension 384 (to match the all-MiniLM-L6-v2 embedding model). Copy your API key and index name into .env as PINECONE_API_KEY and PINECONE_INDEX.',
              verify: 'Open the Pinecone console and confirm your new index shows dimension 384 and 0 vectors so far.',
            },
          ],
          goFurther: 'Skim your docs and note 3-5 questions a real customer might ask that your docs should be able to answer — you\'ll use these to test retrieval in Build 3.',
        },
        {
          number: 2,
          title: 'Chunk, embed, and upload your docs',
          time: '35 min',
          description: 'Turn your documents into searchable vectors.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'I\'m building a RAG support bot. Please create:\n1. requirements.txt with pinecone-client, anthropic, sentence-transformers, fastapi, uvicorn, python-dotenv\n2. chunker.py with chunk_text(text, chunk_size=512, overlap=50) that splits text into word-based chunks of chunk_size words with overlap words of overlap between consecutive chunks\n3. embed.py using sentence-transformers\' "all-MiniLM-L6-v2" model with an embed(texts) function that returns a list of 384-dim vectors for a list of texts (batch the encode call)\n4. ingest.py with ingest_docs(folder="docs") that reads every file in the folder, chunks it, embeds the chunks, and upserts each as a vector to Pinecone with id "{filename}-{chunk_index}" and metadata {"text": chunk, "source": filename}. Print how many chunks were upserted.',
              verify: 'Run ingest.py — it should print "Upserted N chunks" where N is roughly (total words across your docs) / ~460. Check the Pinecone console — your index should now show N vectors.',
            },
          ],
          goFurther: '🛠️ Re-run ingest.py after editing one doc — confirm the vector count doesn\'t double (Pinecone upserts overwrite by ID, so it should stay roughly the same).',
        },
        {
          number: 3,
          title: 'Build the grounded RAG query engine',
          time: '35 min',
          description: 'This is the anti-hallucination core — answers come only from retrieved context.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Create rag.py with an answer_question(question) function that:\n1. Embeds the question using embed()\n2. Queries the Pinecone index for the top 5 most similar chunks (include_metadata=True)\n3. Builds a context string from the retrieved chunks, each prefixed with "[source_filename]:"\n4. Sends Claude (model "claude-sonnet-4-5", max_tokens 400) a prompt that says to answer using ONLY the provided context, and if the answer isn\'t in the context, respond with "I don\'t have that information — let me connect you with a human agent."\n5. Returns {"answer": ..., "sources": [unique list of source filenames used]}',
              verify: 'Run answer_question() with one of the test questions you noted in Build 1 — it should return a correct answer citing the right source file(s). Then ask a question totally unrelated to your docs (e.g. "what\'s the capital of France?") — it should say it doesn\'t have that information, NOT make something up.',
            },
          ],
          goFurther: 'Ask a question that\'s only partially covered by your docs — does Claude answer the covered part and flag the gap, or does it hallucinate the rest? Tighten the prompt if needed.',
        },
        {
          number: 4,
          title: 'Expose it as an API and deploy',
          time: '40 min',
          description: 'Make the bot reachable from anywhere — your website, Slack, or another agent.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Create main.py — a FastAPI app with a POST /chat endpoint that accepts {"question": "..."} (using a Pydantic model) and returns the result of answer_question(). Also create a Procfile with the command to run it via uvicorn on Railway\'s $PORT.',
              verify: 'Run `uvicorn main:app --reload` locally, then POST to http://localhost:8000/chat with a test question using curl or Postman. You should get back {"answer": ..., "sources": [...]}.',
            },
            {
              instruction: 'Push your project to GitHub, connect the repo to Railway, and set PINECONE_API_KEY, PINECONE_INDEX, and ANTHROPIC_API_KEY in Railway\'s Variables tab.',
              verify: 'Once deployed, POST a test question to your Railway URL\'s /chat endpoint and confirm you get the same grounded answer with sources as locally.',
            },
          ],
          goFurther: '🛠️🛠️ Ask Claude to add a /feedback endpoint that logs which questions got the "I don\'t have that information" fallback, so you can spot gaps in your docs over time.',
        },
      ],
      portfolio: 'You just built a production-pattern RAG service — the same architecture behind most "chat with your docs" products. Take a screenshot of a real Q&A exchange with sources, and add "Customer Support RAG Bot" to your build portfolio.',
      portfolioPrompt: 'I just built a RAG-based customer support bot: my documentation is chunked, embedded with sentence-transformers, and stored in Pinecone; a FastAPI endpoint retrieves the most relevant chunks for any question and has Claude answer using ONLY that context, with source citations — deployed live on Railway.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows',
    },
    steps: [
      {
        number: 1,
        title: 'Prepare your knowledge base',
        description: 'Collect product docs, FAQs, and policy pages into plain .txt or .md files in a /docs folder.',
        code: `docs/
  refund_policy.md
  shipping_faq.md
  account_setup.md
  troubleshooting.md`,
        tip: 'Strip navigation menus and boilerplate before saving — clean text chunks retrieve much better than raw HTML dumps.',
      },
      {
        number: 2,
        title: 'Set up Pinecone',
        description: 'Create a free Pinecone account, create an index with dimension 384 (matching the embedding model), and copy your API key.',
        code: `# .env
PINECONE_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PINECONE_INDEX=support-kb
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx`,
        tip: 'Use the "all-MiniLM-L6-v2" sentence-transformers model — it’s fast, free, and outputs 384-dim vectors.',
      },
      {
        number: 3,
        title: 'Install the RAG stack',
        description: 'Install Pinecone client, the Anthropic SDK, sentence-transformers for embeddings, and FastAPI for serving.',
        code: `pip install pinecone-client anthropic sentence-transformers fastapi uvicorn python-dotenv`,
        tip: 'sentence-transformers downloads the model on first run (~80MB) — do this once during setup, not at request time.',
      },
      {
        number: 4,
        title: 'Build the document chunker',
        description: 'Split each document into ~512-token chunks with 50-token overlap so context is not cut off mid-thought.',
        code: `# chunker.py
def chunk_text(text, chunk_size=512, overlap=50):
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunks.append(" ".join(words[start:end]))
        start = end - overlap
    return chunks`,
        tip: 'Word-based chunking is a good approximation for tokens — close enough for retrieval purposes.',
      },
      {
        number: 5,
        title: 'Build the embedder',
        description: 'Convert each chunk to a 384-dimensional vector using sentence-transformers.',
        code: `# embed.py
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

def embed(texts):
    return model.encode(texts).tolist()`,
        tip: 'Batch your embed() calls — encoding 100 chunks at once is far faster than one at a time.',
      },
      {
        number: 6,
        title: 'Build the upsert pipeline',
        description: 'Push every chunk’s vector and metadata (source filename, chunk text) into the Pinecone index.',
        code: `# ingest.py
import os, glob
from pinecone import Pinecone
from chunker import chunk_text
from embed import embed

pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
index = pc.Index(os.environ["PINECONE_INDEX"])

def ingest_docs(folder="docs"):
    vectors = []
    for path in glob.glob(f"{folder}/*"):
        text = open(path, encoding="utf-8").read()
        chunks = chunk_text(text)
        embeddings = embed(chunks)
        for i, (chunk, vec) in enumerate(zip(chunks, embeddings)):
            vectors.append({
                "id": f"{os.path.basename(path)}-{i}",
                "values": vec,
                "metadata": {"text": chunk, "source": os.path.basename(path)},
            })
    index.upsert(vectors=vectors)
    print(f"Upserted {len(vectors)} chunks")`,
        tip: 'Re-run ingest_docs() whenever your docs change — Pinecone upserts overwrite existing IDs cleanly.',
      },
      {
        number: 7,
        title: 'Build the RAG query engine',
        description: 'Embed the user’s question, retrieve the top 5 similar chunks, and ask Claude to answer using only that context.',
        code: `# rag.py
from anthropic import Anthropic
ai = Anthropic()

def answer_question(question):
    q_vector = embed([question])[0]
    results = index.query(vector=q_vector, top_k=5, include_metadata=True)
    context = "\\n\\n".join(
        f"[{m.metadata['source']}]: {m.metadata['text']}" for m in results.matches
    )
    prompt = f"""Answer the question using ONLY the context below. If the answer is not in the
context, say "I don't have that information — let me connect you with a human agent."

Context:
{context}

Question: {question}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=400,
        messages=[{"role": "user", "content": prompt}])
    sources = list({m.metadata["source"] for m in results.matches})
    return {"answer": resp.content[0].text, "sources": sources}`,
        tip: 'The explicit "I don’t have that information" instruction is your most important anti-hallucination guardrail.',
      },
      {
        number: 8,
        title: 'Build the FastAPI endpoint',
        description: 'Expose a POST /chat endpoint that accepts a question and returns the answer with sources.',
        code: `# main.py
from fastapi import FastAPI
from pydantic import BaseModel
from rag import answer_question

app = FastAPI()

class ChatRequest(BaseModel):
    question: str

@app.post("/chat")
def chat(req: ChatRequest):
    return answer_question(req.question)`,
        tip: 'Run locally with `uvicorn main:app --reload` and test with curl or Postman before deploying.',
      },
      {
        number: 9,
        title: 'Deploy on Railway',
        description: 'Push the project to GitHub, connect it to Railway, set your environment variables, and deploy.',
        code: `# Procfile
web: uvicorn main:app --host 0.0.0.0 --port $PORT`,
        tip: 'Railway auto-detects the Procfile — make sure PINECONE_API_KEY and ANTHROPIC_API_KEY are set in the project’s Variables tab.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Customer Support RAG Bot (starter)
Run: pip install pinecone-client anthropic sentence-transformers fastapi uvicorn
"""
import os
from fastapi import FastAPI
from pydantic import BaseModel
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer
from anthropic import Anthropic

app = FastAPI()
model = SentenceTransformer("all-MiniLM-L6-v2")
pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
index = pc.Index(os.environ.get("PINECONE_INDEX", "support-kb"))
ai = Anthropic()

class ChatRequest(BaseModel):
    question: str

@app.post("/chat")
def chat(req: ChatRequest):
    q_vector = model.encode([req.question]).tolist()[0]
    results = index.query(vector=q_vector, top_k=5, include_metadata=True)
    context = "\\n\\n".join(m.metadata["text"] for m in results.matches)
    prompt = f"""Answer using ONLY this context. If not present, say you don't know.

Context:
{context}

Question: {req.question}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=400,
        messages=[{"role": "user", "content": prompt}])
    return {"answer": resp.content[0].text}
`,
    resources: [
      { title: 'Pinecone Docs', url: 'https://docs.pinecone.io' },
      { title: 'Sentence Transformers', url: 'https://www.sbert.net' },
      { title: 'FastAPI Docs', url: 'https://fastapi.tiangolo.com' },
    ],
  },
  {
    id: 17,
    title: 'Invoice Processing Agent',
    emoji: '🧾',
    department: ['Finance'],
    departmentIds: ['finance'],
    difficulty: 'Intermediate',
    description:
      'Drop invoice PDFs into a folder — the agent extracts vendor, amount, and line items, populates a Google Sheet, and flags duplicates.',
    whatYouBuild:
      'A folder-watching agent that detects new invoice PDFs, extracts structured fields (vendor, invoice number, dates, totals, line items) using Claude, validates the data, appends it to a Google Sheet, flags duplicate invoice numbers, and sends a Slack alert for anything overdue.',
    whatYouLearn: [
      'Watch a filesystem folder for new files',
      'Extract text from PDF invoices',
      'Design structured-extraction prompts with a fixed schema',
      'Validate extracted JSON and flag low-confidence rows',
      'Write rows to Google Sheets with gspread',
      'Detect duplicates and overdue items automatically',
    ],
    techStack: ['Python', 'Claude API', 'Google Sheets API'],
    buildTime: '4 hrs',
    xp: 500,
    popularity: 81,
    prerequisites: ['Basic Python', 'Google Cloud service account', 'Sample invoice PDFs'],
    tags: ['finance', 'automation', 'extraction', 'invoicing'],
    session: {
      totalTime: '120 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Automatically detect new invoice PDFs dropped into a folder',
        'Have Claude extract vendor, dates, totals, and line items as structured JSON',
        'Log every invoice to a Google Sheet, flagging missing fields for review',
        'Catch duplicate invoice numbers and alert on overdue invoices via Slack',
      ],
      whatYouNeed: [
        'Claude Code, Cowork, or Claude Desktop open with a project folder set as your working directory',
        'A Google Cloud service account JSON key, shared (Editor) with a Google Sheet you create called "Invoice Tracker"',
        '3-5 sample invoice PDFs (your own past invoices work fine)',
        '(Optional) A Slack Incoming Webhook URL for overdue alerts',
      ],
      builds: [
        {
          number: 1,
          title: 'Set up your tracker sheet and extraction schema',
          time: '20 min',
          description: 'Decide what data you want before building the pipeline that produces it.',
          steps: [
            {
              instruction: 'Create a Google Sheet called "Invoice Tracker" with a header row: vendor_name | invoice_number | date | due_date | total | currency | needs_review | missing_fields. Share it (Editor access) with your service account\'s email.',
            },
            {
              instruction: 'Put 3-5 sample invoice PDFs into an invoices/ folder.',
              verify: 'Open your Invoice Tracker sheet and confirm the header row matches exactly — gspread will append rows below it in this column order.',
            },
          ],
          goFurther: 'Open one sample invoice PDF and try to manually find the vendor name, invoice number, date, due date, and total — note how consistent (or not) the formatting is across your samples.',
        },
        {
          number: 2,
          title: 'Extract structured data from PDFs with Claude',
          time: '35 min',
          description: 'Turn raw invoice text into clean, consistent JSON.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'I\'m building an invoice processing agent. Please create:\n1. requirements.txt with anthropic, pypdf2, gspread, google-auth, watchdog\n2. extract.py with a SCHEMA constant describing this JSON shape: {"vendor_name": "...", "invoice_number": "...", "date": "YYYY-MM-DD", "due_date": "YYYY-MM-DD", "total": 0.00, "currency": "USD", "line_items": [{"description": "...", "amount": 0.00}]}, and an extract_invoice(pdf_path) function that reads the PDF text with PyPDF2, sends Claude (model "claude-sonnet-4-5", max_tokens 1000) a prompt to extract data matching the schema exactly (JSON only), and returns the parsed JSON\n3. validate.py with validate(data) that checks for missing required fields (vendor_name, invoice_number, date, total), sets data["needs_review"] = True if any are missing, and sets data["missing_fields"] to a comma-separated list of the missing ones',
              verify: 'Run extract_invoice() on one of your sample PDFs and print the result — you should get back valid JSON matching the schema with realistic values. Run validate() on it and confirm needs_review is False for a complete invoice and True (with the right missing_fields) if you test on a deliberately incomplete one.',
            },
          ],
          goFurther: '🛠️ Try a multi-page invoice with many line items — if text gets truncated at 6000 characters and loses the total, ask Claude to raise the limit or extract the total from the last page specifically.',
        },
        {
          number: 3,
          title: 'Log to Google Sheets with duplicate detection',
          time: '30 min',
          description: 'Get every invoice into one place your finance team can review.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Add Google Sheets logging to my invoice agent:\n\n1. sheets.py that authenticates with gspread using service_account.json, opens the "Invoice Tracker" sheet (sheet1), and has append_invoice(data) that appends a row matching the header order: vendor_name, invoice_number, date, due_date, total, currency, needs_review, missing_fields\n2. duplicates.py with is_duplicate(invoice_number) that checks column B (invoice_number) of the sheet for an existing match before appending\n3. main.py that ties it together for a single file: extract_invoice() -> validate() -> check is_duplicate() (skip + print warning if duplicate) -> append_invoice()',
              verify: 'Run main.py on each of your sample PDFs one at a time — each should appear as a new row in your Google Sheet with the right values, and needs_review correctly flagging any incomplete invoices. Run it again on the same PDF — it should detect the duplicate and skip it.',
            },
          ],
          goFurther: 'Manually edit one row in the sheet to have a due_date in the past — you\'ll use this in Build 4 to test the overdue alert.',
        },
        {
          number: 4,
          title: 'Watch the folder and alert on overdue invoices',
          time: '35 min',
          description: 'The last step — no more manually running the script per file.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Finish my invoice agent:\n\n1. watcher.py using watchdog\'s Observer and FileSystemEventHandler to watch the invoices/ folder for new .pdf files (on_created), with a short delay before processing to avoid reading partially-written files, calling the main.py pipeline on each new file\n2. overdue.py with alert_if_overdue(data, webhook_url) that compares due_date to today\'s date and posts a Slack message via the webhook if the invoice is overdue, including the invoice number, vendor, due date, and total\n3. Update main.py to call alert_if_overdue() after appending each invoice, and add a separate daily check script (overdue_check.py) that reads all rows from the sheet and re-checks every due_date against today',
              verify: 'Start watcher.py, then drop a new PDF into invoices/ — within a few seconds it should appear as a new row in the sheet. Then run overdue_check.py — it should post a Slack alert for the row you manually backdated in Build 3.',
            },
          ],
          goFurther: '🛠️🛠️ Ask Claude to add a daily summary to Slack each morning listing all invoices currently flagged needs_review, so finance can triage them in one batch.',
        },
      ],
      portfolio: 'You just built an agent that turns a messy invoices/ folder into a clean, queryable tracker with built-in duplicate and overdue detection. Take a screenshot of your Invoice Tracker sheet with a few processed rows (redact real vendor/amount info if needed), and add "Invoice Processing Agent" to your build portfolio.',
      portfolioPrompt: 'I just built an invoice processing agent: it watches a folder for new invoice PDFs, uses Claude to extract vendor, dates, totals, and line items as structured JSON, validates the data and flags incomplete invoices for review, logs everything to a Google Sheet with duplicate detection, and sends Slack alerts for overdue invoices.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows',
    },
    steps: [
      {
        number: 1,
        title: 'Set up Google Sheets API access',
        description: 'Enable the Sheets API, create a service account, download its JSON key, and share your tracking sheet with the service account email.',
        code: `# service_account.json (downloaded from Google Cloud Console)
# Share your Google Sheet with: your-service-account@project.iam.gserviceaccount.com (Editor)`,
        tip: 'The service account email looks like an email address but is not a real inbox — just used for sharing permissions.',
      },
      {
        number: 2,
        title: 'Install dependencies',
        description: 'Install the PDF reader, Google Sheets client, Anthropic SDK, and folder watcher.',
        code: `pip install anthropic pypdf2 gspread google-auth watchdog`,
        tip: 'watchdog runs cross-platform (Windows, Mac, Linux) and is much more efficient than polling a folder in a loop.',
      },
      {
        number: 3,
        title: 'Build the folder watcher',
        description: 'Use watchdog to trigger processing whenever a new PDF appears in the /invoices folder.',
        code: `# watcher.py
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class InvoiceHandler(FileSystemEventHandler):
    def on_created(self, event):
        if event.src_path.lower().endswith(".pdf"):
            process_invoice(event.src_path)

def watch_folder(path="invoices"):
    observer = Observer()
    observer.schedule(InvoiceHandler(), path, recursive=False)
    observer.start()
    try:
        while True:
            time.sleep(5)
    except KeyboardInterrupt:
        observer.stop()`,
        tip: 'Add a small delay before reading the file — some apps write PDFs in chunks and a half-written file will fail to parse.',
      },
      {
        number: 4,
        title: 'Build the invoice extractor',
        description: 'Extract raw text from the PDF and send it to Claude with a structured-extraction prompt.',
        code: `# extract.py
from PyPDF2 import PdfReader
from anthropic import Anthropic
import json

ai = Anthropic()

SCHEMA = """{
  "vendor_name": "...", "invoice_number": "...", "date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD", "total": 0.00, "currency": "USD",
  "line_items": [{"description": "...", "amount": 0.00}]
}"""

def extract_invoice(pdf_path):
    reader = PdfReader(pdf_path)
    text = "\\n".join(page.extract_text() for page in reader.pages)
    prompt = f"""Extract invoice data as JSON matching exactly this schema:
{SCHEMA}

Invoice text:
{text[:6000]}

Respond with ONLY the JSON object."""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=1000,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)`,
        tip: 'Most invoices fit comfortably in 6000 characters — only increase the limit for multi-page itemized invoices.',
      },
      {
        number: 5,
        title: 'Validate extracted data',
        description: 'Check for missing required fields and flag the row for human review if confidence is low.',
        code: `# validate.py
REQUIRED = ["vendor_name", "invoice_number", "date", "total"]

def validate(data):
    missing = [f for f in REQUIRED if not data.get(f)]
    data["needs_review"] = bool(missing)
    data["missing_fields"] = ", ".join(missing)
    return data`,
        tip: 'A "needs_review" column in the sheet lets your finance team triage edge cases without digging through PDFs.',
      },
      {
        number: 6,
        title: 'Write to Google Sheets',
        description: 'Append each validated invoice as a new row using gspread.',
        code: `# sheets.py
import gspread

gc = gspread.service_account(filename="service_account.json")
sheet = gc.open("Invoice Tracker").sheet1

def append_invoice(data):
    sheet.append_row([
        data["vendor_name"], data["invoice_number"], data["date"], data["due_date"],
        data["total"], data["currency"], data["needs_review"], data["missing_fields"],
    ])`,
        tip: 'Add a header row to the sheet first — gspread.append_row just appends below the last filled row.',
      },
      {
        number: 7,
        title: 'Add a duplicate detector',
        description: 'Before appending, check whether the invoice_number already exists in the sheet.',
        code: `# duplicates.py
def is_duplicate(invoice_number):
    existing = sheet.col_values(2)  # column B = invoice_number
    return invoice_number in existing`,
        tip: 'Duplicate invoice numbers are one of the most common causes of accidental double-payment — catch them early.',
      },
      {
        number: 8,
        title: 'Add an overdue alerter',
        description: 'After appending, compare due_date to today and post a Slack message if it has already passed.',
        code: `# overdue.py
import requests
from datetime import date

def alert_if_overdue(data, webhook_url):
    due = date.fromisoformat(data["due_date"])
    if due < date.today():
        requests.post(webhook_url, json={
            "text": f":rotating_light: Invoice {data['invoice_number']} from {data['vendor_name']} "
                    f"is OVERDUE (due {data['due_date']}, total {data['total']} {data['currency']})"
        })`,
        tip: 'Run this check on a daily cron too, not just on ingest — invoices become overdue over time, not just at creation.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Invoice Processing Agent (starter)
Run: pip install anthropic pypdf2 gspread google-auth
"""
import json
from PyPDF2 import PdfReader
from anthropic import Anthropic

ai = Anthropic()
SCHEMA = """{"vendor_name": "...", "invoice_number": "...", "date": "YYYY-MM-DD",
"due_date": "YYYY-MM-DD", "total": 0.00, "currency": "USD",
"line_items": [{"description": "...", "amount": 0.00}]}"""

def extract_invoice(pdf_path):
    reader = PdfReader(pdf_path)
    text = "\\n".join(page.extract_text() for page in reader.pages)
    prompt = f"Extract invoice data as JSON matching exactly:\\n{SCHEMA}\\n\\nInvoice:\\n{text[:6000]}\\n\\nJSON only."
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=1000,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)

if __name__ == "__main__":
    data = extract_invoice("sample_invoice.pdf")
    print(json.dumps(data, indent=2))
`,
    resources: [
      { title: 'gspread Documentation', url: 'https://docs.gspread.org' },
      { title: 'Google Sheets API', url: 'https://developers.google.com/sheets/api' },
      { title: 'watchdog (Python)', url: 'https://python-watchdog.readthedocs.io' },
    ],
  },
  {
    id: 18,
    title: 'Competitor Intelligence Monitor',
    emoji: '🕵️',
    department: ['Marketing', 'Executive / Strategy'],
    departmentIds: ['marketing', 'strategy'],
    difficulty: 'Intermediate',
    description:
      'A weekly agent that monitors competitor sites, job postings, and news, then delivers a competitive intelligence briefing.',
    whatYouBuild:
      'A scheduled weekly job that scrapes each competitor’s website, recent news, and job listings, asks Claude to infer strategic moves and rank threat levels, and emails a structured "What’s New / Strategic Signals / Threats / Opportunities / Recommended Actions" briefing to leadership every Monday morning.',
    whatYouLearn: [
      'Maintain a structured competitor watchlist',
      'Scrape multiple data sources per entity',
      'Infer strategy signals from job postings',
      'Design a multi-section intelligence-briefing prompt',
      'Format and send HTML emails',
      'Schedule weekly recurring jobs',
    ],
    techStack: ['Python', 'Tavily', 'Claude', 'SMTP'],
    buildTime: '4 hrs',
    xp: 480,
    popularity: 76,
    prerequisites: ['Completed Web Research Agent', 'SMTP or SendGrid credentials'],
    tags: ['competitive intelligence', 'marketing', 'strategy'],
    session: {
      totalTime: '110 min',
      buildCount: 3,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Maintain a watchlist of 3-5 competitors with their site and careers page',
        'Pull homepage text, recent news, and job postings for each one',
        'Have Claude infer strategic moves, threat levels, and opportunities per competitor',
        'Get a structured weekly briefing emailed to you every Monday morning',
      ],
      whatYouNeed: [
        'Claude Code, Cowork, or Claude Desktop open with a project folder set as your working directory',
        'A Tavily API key (reuse from the Web Research Agent if you built it)',
        'An email account you can send from (e.g. Gmail with an app password)',
      ],
      builds: [
        {
          number: 1,
          title: 'Build your watchlist and gather raw intel',
          time: '35 min',
          description: 'Get raw data on each competitor before asking Claude to make sense of it.',
          steps: [
            {
              instruction: 'Create competitors.json listing 3-5 competitors, each with name, website, and jobs_url (their careers page).',
            },
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'I\'m building a competitive intelligence agent. Please create:\n1. requirements.txt with tavily-python, anthropic, requests, beautifulsoup4, markdown\n2. scrape.py with get_homepage_text(url) (fetches a URL with a realistic User-Agent, strips it to plain text via BeautifulSoup, returns the first 3000 chars) and get_recent_news(name) (uses Tavily to search "{name} news this week", max_results=5, returning a list of {"title": ..., "snippet": ...})\n3. jobs.py with get_job_titles(jobs_url) that fetches the careers page, finds all h2/h3/a tags, and returns the text of those between 5-80 characters as a list of up to 30 job titles',
              verify: 'Run get_homepage_text(), get_recent_news(), and get_job_titles() on one competitor from your watchlist. You should get back readable homepage text, a list of news snippets, and a list of job titles (if the careers page returns mostly empty, note it — that competitor likely uses a JS-rendered career page).',
            },
          ],
          goFurther: 'For any competitor whose job titles list comes back empty, search for "[competitor name] careers" jobs on LinkedIn manually instead — you can paste those titles into jobs.json as a fallback.',
        },
        {
          number: 2,
          title: 'Have Claude analyze each competitor',
          time: '35 min',
          description: 'Turn raw scraped data into actual strategic signals.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Create analyze.py with an analyze_competitor(name, homepage, news, jobs) function that sends all four pieces of context to Claude (model "claude-sonnet-4-5", max_tokens 800) and asks it to identify: 1) What\'s new this week, 2) Strategic signals (e.g. hiring patterns suggesting a new product direction), 3) Threat level (Low/Medium/High) with reasoning, 4) Opportunities for us. Tell Claude to be specific and concise, and to explicitly reason about what the job titles suggest about strategic priorities.',
              verify: 'Run analyze_competitor() for one competitor using the data gathered in Build 1. The output should reference specific job titles or news items, not just generic statements — and should clearly state a threat level with a one-line justification.',
            },
          ],
          goFurther: '🛠️ Compare the analysis for two different competitors — does Claude actually differentiate them, or does it produce similar boilerplate for both? If similar, add more specific data (more job titles, more news items) to sharpen the contrast.',
        },
        {
          number: 3,
          title: 'Assemble the weekly briefing and schedule it',
          time: '40 min',
          description: 'Turn per-competitor analyses into one polished email leadership will actually read.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Finish my competitive intelligence agent:\n\n1. briefing.py with build_briefing(analyses) that takes a dict of {competitor_name: analysis_text} and combines them into one Markdown document titled "# Weekly Competitive Intelligence Briefing" with each competitor as a "## {name}" section. Also add a generate_exec_summary(analyses) function that sends all the analyses to Claude in one call and asks for a 3-4 sentence executive summary across all competitors, to be placed at the top of the briefing.\n2. email_format.py with to_html_email(markdown_text) using the markdown library to convert the briefing to a styled HTML email\n3. main.py that loops over competitors.json, calls get_homepage_text/get_recent_news/get_job_titles/analyze_competitor for each, builds the briefing with the exec summary, converts to HTML, and sends it via smtplib (SMTP_SSL, smtp.gmail.com) using SMTP_USER/SMTP_PASS from .env\n\nThen tell me the schedule library code or crontab line to run this every Monday at 6am.',
              verify: 'Run main.py end-to-end. Check your inbox for "Weekly Competitive Intelligence Briefing" — it should have an executive summary at the top followed by one section per competitor, each with the 4-part analysis from Build 2, rendered as clean HTML.',
            },
          ],
          goFurther: '🛠️🛠️ Ask Claude to cache last week\'s homepage text for each competitor and have analyze_competitor() explicitly call out what changed on the homepage since last week, not just what\'s currently there.',
        },
      ],
      portfolio: 'You just built an agent that gives you a Monday-morning view into what every competitor is actually doing. Save one of your generated briefings (redact competitor names if needed) and add "Competitor Intelligence Monitor" to your build portfolio.',
      portfolioPrompt: 'I just built a competitive intelligence agent: it scrapes each competitor\'s homepage, recent news, and job postings weekly, uses Claude to infer strategic signals, threat levels, and opportunities for each one, and emails a structured briefing with an executive summary every Monday morning.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows',
    },
    steps: [
      {
        number: 1,
        title: 'Define your competitor watchlist',
        description: 'Create a JSON file listing each competitor with their website, job board URL, and key product names to track.',
        code: `# competitors.json
[
  {"name": "Acme AI", "website": "https://acmeai.com", "jobs_url": "https://acmeai.com/careers"},
  {"name": "Rivalsoft", "website": "https://rivalsoft.io", "jobs_url": "https://rivalsoft.io/jobs"}
]`,
        tip: 'Start with 3-5 competitors — the briefing gets noisy and less actionable beyond that.',
      },
      {
        number: 2,
        title: 'Build the multi-source scraper',
        description: 'For each competitor, fetch their homepage and recent news via Tavily search.',
        code: `# scrape.py
from tavily import TavilyClient
import requests
from bs4 import BeautifulSoup

tavily = TavilyClient(api_key="...")

def get_homepage_text(url):
    resp = requests.get(url, timeout=10, headers={"User-Agent": "AgentForgeBot/1.0"})
    soup = BeautifulSoup(resp.text, "html.parser")
    return " ".join(soup.get_text(separator=" ").split())[:3000]

def get_recent_news(name):
    results = tavily.search(query=f"{name} news this week", max_results=5)["results"]
    return [{"title": r["title"], "snippet": r["content"]} for r in results]`,
        tip: 'Cache homepage text from the previous run so you can diff "what changed" week over week.',
      },
      {
        number: 3,
        title: 'Build the job listing scraper',
        description: 'Scrape competitor career pages to extract job titles — hiring patterns reveal strategic priorities.',
        code: `# jobs.py
def get_job_titles(jobs_url):
    resp = requests.get(jobs_url, timeout=10, headers={"User-Agent": "AgentForgeBot/1.0"})
    soup = BeautifulSoup(resp.text, "html.parser")
    candidates = soup.find_all(["h2", "h3", "a"])
    titles = [c.get_text(strip=True) for c in candidates if 5 < len(c.get_text(strip=True)) < 80]
    return titles[:30]`,
        tip: 'Many career pages are JS-rendered — if requests returns an empty page, swap in a headless browser like Playwright.',
      },
      {
        number: 4,
        title: 'Build the Claude intelligence analyst',
        description: 'Send all gathered data per competitor to Claude and ask it to infer strategic moves and rank threat level.',
        code: `# analyze.py
from anthropic import Anthropic
ai = Anthropic()

def analyze_competitor(name, homepage, news, jobs):
    prompt = f"""Analyze this competitor: {name}

Homepage text: {homepage}
Recent news: {news}
Open job titles: {jobs}

Identify: 1) What's new this week, 2) Strategic signals (e.g. hiring patterns suggesting new product direction),
3) Threat level (Low/Medium/High) with reasoning, 4) Opportunities for us.
Be specific and concise."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=800,
        messages=[{"role": "user", "content": prompt}]).content[0].text`,
        tip: 'Job titles like "Senior ML Engineer - Agents" are strong signals — explicitly prompt Claude to reason about hiring patterns.',
      },
      {
        number: 5,
        title: 'Structure the full briefing',
        description: 'Combine each competitor’s analysis into one document with consistent section headers.',
        code: `# briefing.py
def build_briefing(analyses):
    sections = []
    for name, analysis in analyses.items():
        sections.append(f"## {name}\\n{analysis}")
    return "# Weekly Competitive Intelligence Briefing\\n\\n" + "\\n\\n".join(sections)`,
        tip: 'Add a one-paragraph executive summary at the top, generated by a final Claude call over all sections combined.',
      },
      {
        number: 6,
        title: 'Format as an HTML email',
        description: 'Convert the Markdown briefing into clean HTML for email clients.',
        code: `# email_format.py
import markdown

def to_html_email(markdown_text):
    body = markdown.markdown(markdown_text)
    return f"""<html><body style="font-family: Arial, sans-serif; max-width: 700px; margin: auto;">
{body}
</body></html>"""`,
        tip: 'Install with `pip install markdown` — it handles headers, bold, and lists out of the box.',
      },
      {
        number: 7,
        title: 'Schedule weekly delivery',
        description: 'Run the full pipeline every Monday at 6am and email it to the sales and marketing leads.',
        code: `# main.py
import schedule, time, smtplib
from email.mime.text import MIMEText

def send_email(html, to_addrs):
    msg = MIMEText(html, "html")
    msg["Subject"] = "Weekly Competitive Intelligence Briefing"
    msg["From"] = "agent@yourcompany.com"
    msg["To"] = ", ".join(to_addrs)
    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login("agent@yourcompany.com", "app-password")
        server.send_message(msg)

schedule.every().monday.at("06:00").do(run_pipeline)
while True:
    schedule.run_pending()
    time.sleep(60)`,
        tip: 'Use a Gmail App Password (not your real password) for SMTP — generate one in your Google Account security settings.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Competitor Intelligence Monitor (starter)
Run: pip install tavily-python anthropic requests beautifulsoup4 markdown
"""
import json
from tavily import TavilyClient
from anthropic import Anthropic

tavily = TavilyClient(api_key="YOUR_TAVILY_KEY")
ai = Anthropic()

def analyze_competitor(name):
    news = tavily.search(query=f"{name} news this week", max_results=5)["results"]
    snippets = "\\n".join(f"- {r['title']}: {r['content'][:200]}" for r in news)
    prompt = f"""Competitor: {name}
Recent news:
{snippets}

Summarize: What's new, strategic signals, threat level (Low/Medium/High), opportunities for us."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=600,
        messages=[{"role": "user", "content": prompt}]).content[0].text

if __name__ == "__main__":
    competitors = json.load(open("competitors.json"))
    for c in competitors:
        print(f"=== {c['name']} ===")
        print(analyze_competitor(c["name"]))
`,
    resources: [
      { title: 'Tavily API Docs', url: 'https://docs.tavily.com' },
      { title: 'Python markdown library', url: 'https://python-markdown.github.io' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 19,
    title: 'Code Review Agent',
    emoji: '🔬',
    department: ['Engineering'],
    departmentIds: ['engineering'],
    difficulty: 'Intermediate',
    description:
      'Automatically reviews every new GitHub pull request for bugs, security issues, performance, and readability — then posts inline comments.',
    whatYouBuild:
      'A GitHub App that listens for pull_request webhook events, fetches the diff, sends each changed file to Claude for review, parses the response into per-line comments, posts them inline on the PR, and adds a summary comment with an overall quality score and approval recommendation.',
    whatYouLearn: [
      'Register and configure a GitHub App with PR permissions',
      'Receive and verify GitHub webhooks',
      'Fetch and parse PR diffs via the GitHub API',
      'Engineer a code-review prompt that returns structured findings',
      'Post inline review comments on specific lines',
      'Implement basic auto-approval logic',
    ],
    techStack: ['Python', 'GitHub API', 'Claude API'],
    buildTime: '4 hrs',
    xp: 520,
    popularity: 87,
    prerequisites: ['Comfortable with Git/GitHub', 'Basic Flask or FastAPI', 'A test repository'],
    tags: ['engineering', 'code review', 'github', 'ci'],
    session: {
      totalTime: '130 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Register a GitHub App that receives pull_request webhook events',
        'Fetch a PR\'s changed files and diffs via the GitHub API',
        'Have Claude review each file for bugs, security issues, performance, and readability',
        'Post inline comments and a summary with a quality score and approve/request-changes decision',
      ],
      whatYouNeed: [
        'Claude Code, Cowork, or Claude Desktop open with a project folder set as your working directory',
        'A GitHub account and a throwaway test repository for development',
        'ngrok for receiving webhooks locally',
      ],
      builds: [
        {
          number: 1,
          title: 'Register your GitHub App and receive webhooks',
          time: '30 min',
          description: 'Get GitHub talking to your local machine before writing any review logic.',
          steps: [
            {
              instruction: 'In GitHub Settings > Developer Settings > GitHub Apps, create a new app with: Webhook URL pointing to your ngrok URL + /webhook, a webhook secret, and read/write permissions on Pull Requests and Contents. Subscribe to the "Pull request" event. Generate a private key (.pem) and install the app on your test repository. Note the App ID, Installation ID, and Webhook Secret.',
            },
            {
              instruction: 'Run `ngrok http 5000`, set your GitHub App\'s webhook URL to <ngrok-url>/webhook, then paste this prompt into Claude:',
              prompt: 'I\'m building a GitHub code review bot. Please create:\n1. requirements.txt with anthropic, flask, requests, pyjwt\n2. webhook.py — a Flask app with a POST /webhook endpoint that verifies the X-Hub-Signature-256 header using HMAC-SHA256 with WEBHOOK_SECRET (using hmac.compare_digest, not ==), and for payloads where action is "opened" or "synchronize", calls a review_pr(payload) function (stub it with a print for now) and returns 200',
              verify: 'Open a test PR (or push a commit to an existing one) in your test repo. Your Flask server\'s console should print the payload, confirming the webhook is received and the signature check passes.',
            },
          ],
          goFurther: 'Temporarily break the signature check (change one character of WEBHOOK_SECRET) and confirm the endpoint returns 401 — this proves the verification is actually doing something.',
        },
        {
          number: 2,
          title: 'Authenticate and fetch the PR diff',
          time: '25 min',
          description: 'Get the actual code changes Claude will review.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Create github_client.py with:\n1. get_installation_token(app_id, private_key, installation_id) that builds a JWT (RS256, 10-minute expiry) and exchanges it for an installation access token via POST /app/installations/{id}/access_tokens\n2. get_pr_files(token, repo, pr_number) that GETs /repos/{repo}/pulls/{pr_number}/files and returns the list of changed files with their patches\n\nThen update webhook.py\'s review_pr(payload) to extract repo, pr_number, and installation_id from the payload, get a token, fetch the PR files, and print each filename + patch length.',
              verify: 'Open another test PR with a small code change. Your server should print the changed filename(s) and a non-zero patch length for each. If you get a 401 from GitHub, double-check the private key and App ID match your GitHub App.',
            },
          ],
          goFurther: 'Open a PR that changes 3+ files — confirm get_pr_files() returns all of them, not just the first.',
        },
        {
          number: 3,
          title: 'Build the Claude reviewer and parse findings',
          time: '35 min',
          description: 'This is where the actual code review happens.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Add the review logic:\n\n1. reviewer.py with review_file(filename, patch) that sends the diff to Claude (model "claude-sonnet-4-5", max_tokens 1500) asking it to review for bugs, security issues, performance problems, and readability, and return JSON: {"comments": [{"line": <line_number_in_diff>, "severity": "low|medium|high", "comment": "..."}], "summary": "one sentence"}. If no issues, return {"comments": [], "summary": "Looks good"}.\n2. parse.py with collect_comments(files_with_reviews) that takes a list of (filename, review) tuples and flattens them into a list of {"path": filename, "line": ..., "body": "**[SEVERITY]** comment"} dicts, sorted with HIGH severity first',
              verify: 'Test review_file() on a deliberately bad snippet, e.g. a patch containing a hardcoded password and a SQL string built with f-strings. Claude should flag both as medium/high severity with specific comments. Then test on a clean, well-written patch — it should return an empty comments list and "Looks good".',
            },
          ],
          goFurther: '🛠️ Try a patch with a subtle bug (e.g. an off-by-one in a loop) — does Claude catch it? If not, try rephrasing the prompt to explicitly ask it to trace through the logic.',
        },
        {
          number: 4,
          title: 'Post the review to GitHub and decide approve/request-changes',
          time: '40 min',
          description: 'Close the loop — the bot actually leaves a review on the PR.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Finish my code review bot:\n\n1. post_review.py with submit_review(token, repo, pr_number, commit_id, comments, event="COMMENT") that POSTs to /repos/{repo}/pulls/{pr_number}/reviews with the commit_id, a body of "AI Code Review", the event type, and the inline comments\n2. summary.py with build_summary(all_findings) that counts HIGH and MEDIUM severity comments, computes score = max(0, 100 - high*25 - medium*10), and returns a Markdown summary string with the score and counts\n3. decide.py with review_event(all_findings) that returns "REQUEST_CHANGES" if any HIGH findings exist, "COMMENT" if any MEDIUM findings exist (but no HIGH), otherwise "APPROVE"\n4. Update webhook.py\'s review_pr() to call review_file() on every changed file, collect_comments(), build_summary(), review_event(), and submit_review() with the summary appended to the comments\n\nFor now, force review_event() to always return "COMMENT" regardless of findings, so the bot never auto-approves or auto-blocks while you build trust in it.',
              verify: 'Open a test PR with at least one obvious issue (e.g. a hardcoded secret). Within seconds, the bot should post a review on the PR with inline comments on the relevant lines and a summary comment showing a quality score below 100.',
            },
          ],
          goFurther: '🛠️🛠️ After running it in COMMENT-only mode on a few real PRs and confirming the findings are useful (not noisy), ask Claude to remove the override so review_event() can return REQUEST_CHANGES/APPROVE for real.',
        },
      ],
      portfolio: 'You just built a bot that gives every PR an AI-powered first pass review. Take a screenshot of a real review it posted (redact any sensitive code), and add "Code Review Agent" to your build portfolio.',
      portfolioPrompt: 'I just built a GitHub code review bot: it\'s a GitHub App that receives pull_request webhooks, fetches the diff for each changed file, has Claude review it for bugs, security issues, performance, and readability, and posts inline comments plus a summary with a quality score and an approve/comment/request-changes recommendation.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows',
    },
    steps: [
      {
        number: 1,
        title: 'Create a GitHub App',
        description: 'Register a new GitHub App under Settings > Developer Settings with read/write access to Pull Requests and Contents, subscribed to the pull_request event.',
        code: `# After creating the app:
# 1. Generate a private key (.pem file)
# 2. Note the App ID and Webhook Secret
# 3. Install the app on your test repository`,
        tip: 'Use a dedicated test repo with throwaway PRs while developing — you do not want to spam real reviewers.',
      },
      {
        number: 2,
        title: 'Set up the webhook receiver',
        description: 'Build a Flask endpoint that receives pull_request events and verifies the GitHub signature.',
        code: `# webhook.py
import hmac, hashlib, os
from flask import Flask, request, abort

app = Flask(__name__)
SECRET = os.environ["WEBHOOK_SECRET"].encode()

@app.post("/webhook")
def webhook():
    sig = request.headers.get("X-Hub-Signature-256", "")
    expected = "sha256=" + hmac.new(SECRET, request.data, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        abort(401)
    payload = request.json
    if payload.get("action") in ("opened", "synchronize"):
        review_pr(payload)
    return "", 200`,
        tip: 'hmac.compare_digest prevents timing attacks — never use a plain == comparison for signature checks.',
      },
      {
        number: 3,
        title: 'Build the PR diff fetcher',
        description: 'Authenticate as the GitHub App and fetch the list of changed files with their patches.',
        code: `# github_client.py
import requests, jwt, time

def get_installation_token(app_id, private_key, installation_id):
    payload = {"iat": int(time.time()), "exp": int(time.time()) + 600, "iss": app_id}
    encoded_jwt = jwt.encode(payload, private_key, algorithm="RS256")
    resp = requests.post(
        f"https://api.github.com/app/installations/{installation_id}/access_tokens",
        headers={"Authorization": f"Bearer {encoded_jwt}", "Accept": "application/vnd.github+json"},
    )
    return resp.json()["token"]

def get_pr_files(token, repo, pr_number):
    resp = requests.get(
        f"https://api.github.com/repos/{repo}/pulls/{pr_number}/files",
        headers={"Authorization": f"token {token}", "Accept": "application/vnd.github+json"},
    )
    return resp.json()`,
        tip: 'Installation tokens expire after 1 hour — generate a fresh one per webhook event rather than caching long-term.',
      },
      {
        number: 4,
        title: 'Build the Claude code reviewer',
        description: 'For each changed file, send the diff to Claude and request structured findings as JSON.',
        code: `# reviewer.py
from anthropic import Anthropic
import json

ai = Anthropic()

def review_file(filename, patch):
    prompt = f"""Review this code diff for bugs, security issues, performance problems, and readability.

File: {filename}
Diff:
{patch}

Return JSON: {{"comments": [{{"line": <line_number_in_diff>, "severity": "low|medium|high",
"comment": "..."}}], "summary": "one sentence"}}
If no issues, return {{"comments": [], "summary": "Looks good"}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=1500,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)`,
        tip: 'The "line" Claude returns refers to the diff’s line numbering — map it to the file’s actual line using the patch header.',
      },
      {
        number: 5,
        title: 'Parse the review response',
        description: 'Collect comments from every file into one list, tagged with filename and severity.',
        code: `# parse.py
def collect_comments(files_with_reviews):
    all_comments = []
    for filename, review in files_with_reviews:
        for c in review["comments"]:
            all_comments.append({"path": filename, "line": c["line"],
                                  "body": f"**[{c['severity'].upper()}]** {c['comment']}"})
    return all_comments`,
        tip: 'Sort comments by severity so the most critical issues appear first in the PR conversation.',
      },
      {
        number: 6,
        title: 'Post inline PR comments',
        description: 'Use the GitHub Reviews API to submit all comments as a single review.',
        code: `# post_review.py
def submit_review(token, repo, pr_number, commit_id, comments, event="COMMENT"):
    requests.post(
        f"https://api.github.com/repos/{repo}/pulls/{pr_number}/reviews",
        headers={"Authorization": f"token {token}", "Accept": "application/vnd.github+json"},
        json={"commit_id": commit_id, "body": "AI Code Review", "event": event, "comments": comments},
    )`,
        tip: 'Submitting one review with multiple comments is far less noisy than posting individual comments one-by-one.',
      },
      {
        number: 7,
        title: 'Add a PR summary comment',
        description: 'Compute an overall score from the severities found and post a top-level summary.',
        code: `# summary.py
def build_summary(all_findings):
    high = sum(1 for c in all_findings if "[HIGH]" in c["body"])
    medium = sum(1 for c in all_findings if "[MEDIUM]" in c["body"])
    score = max(0, 100 - high * 25 - medium * 10)
    return f"### AI Review Summary\\nQuality score: {score}/100\\nHigh: {high} | Medium: {medium} | Total: {len(all_findings)}"`,
        tip: 'Tune the scoring weights based on your team’s tolerance — some teams want HIGH issues to block merges entirely.',
      },
      {
        number: 8,
        title: 'Add approval logic',
        description: 'If only cosmetic (low-severity) issues were found, submit the review as APPROVE; otherwise REQUEST_CHANGES.',
        code: `# decide.py
def review_event(all_findings):
    if any("[HIGH]" in c["body"] for c in all_findings):
        return "REQUEST_CHANGES"
    if any("[MEDIUM]" in c["body"] for c in all_findings):
        return "COMMENT"
    return "APPROVE"`,
        tip: 'Start in COMMENT-only mode for a few weeks to build trust before letting the bot REQUEST_CHANGES on real PRs.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Code Review Agent (starter)
Run: pip install anthropic flask requests pyjwt
"""
import json
from anthropic import Anthropic

ai = Anthropic()

def review_diff(filename, patch):
    prompt = f"""Review this diff for bugs, security issues, and readability.
File: {filename}
Diff:
{patch}

Return JSON: {{"comments": [{{"line": 1, "severity": "low|medium|high", "comment": "..."}}], "summary": "..."}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=1000,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)

if __name__ == "__main__":
    sample_patch = "+    password = 'hardcoded123'\\n+    db.execute(f\\"SELECT * FROM users WHERE id={user_id}\\")"
    print(json.dumps(review_diff("auth.py", sample_patch), indent=2))
`,
    resources: [
      { title: 'GitHub Apps Documentation', url: 'https://docs.github.com/en/apps' },
      { title: 'GitHub Pulls API', url: 'https://docs.github.com/en/rest/pulls' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 20,
    title: 'HR Recruitment Screening Agent',
    emoji: '🧑‍💼',
    department: ['HR & People'],
    departmentIds: ['hr'],
    difficulty: 'Intermediate',
    description:
      'Upload CVs — the agent scores each candidate against the job description, ranks them, and populates an Airtable recruitment tracker.',
    whatYouBuild:
      'A batch processor that reads a folder of CV PDFs, sends each one alongside your job description to Claude for scoring on skills match, experience, culture fit, and growth trajectory, then writes structured results — score, strengths, gaps, recommendation — into an Airtable base sorted by score.',
    whatYouLearn: [
      'Extract text from CV PDFs in bulk',
      'Design rubric-based scoring prompts',
      'Parse structured scoring output reliably',
      'Write records to Airtable via API',
      'Build an overnight batch-processing script',
      'Implement an optional bias-reduction "blind review" mode',
    ],
    techStack: ['Python', 'Claude API', 'Airtable API'],
    buildTime: '4 hrs',
    xp: 500,
    popularity: 79,
    prerequisites: ['Basic Python', 'Airtable account (free tier)', 'Sample CVs (PDF)'],
    tags: ['hr', 'recruiting', 'screening', 'automation'],
    session: {
      totalTime: '120 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Write a rubric-based job description that gives Claude clear scoring criteria',
        'Extract text from a folder of CV PDFs in bulk',
        'Have Claude score each candidate 1-10 across 4 dimensions with strengths, gaps, and a recommendation',
        'Push ranked results into an Airtable recruitment tracker, with an optional bias-reduction mode',
      ],
      whatYouNeed: [
        'Claude Code, Cowork, or Claude Desktop open with a project folder set as your working directory',
        'A free Airtable account',
        '3-5 sample CV PDFs (anonymized or your own past resumes work fine for testing)',
      ],
      builds: [
        {
          number: 1,
          title: 'Write your JD rubric and set up Airtable',
          time: '25 min',
          description: 'The scoring is only as good as the rubric you give Claude.',
          steps: [
            {
              instruction: 'Create jd.txt with: Role title, Required skills/experience, Nice-to-haves, and an explicit "Red flags" section (e.g. "no evidence of production ownership", "frequent <1yr job hops without explanation"). Red flags matter — without them, scores tend to cluster too high.',
            },
            {
              instruction: 'In Airtable, create a base with a "Candidates" table containing fields: Name (text), Email (text), Score (number), Strengths (long text), Gaps (long text), Recommendation (single select: Strong Yes/Yes/Maybe/No). Create a view sorted by Score descending. Get your Base ID and API key from Airtable\'s developer docs.',
              verify: 'Confirm your Candidates table has all 6 fields with the right types — Score must be a number field for sorting to work correctly later.',
            },
          ],
          goFurther: 'Show your jd.txt to a colleague and ask if they\'d score a hypothetical candidate the same way — if your red flags are too vague, sharpen them now.',
        },
        {
          number: 2,
          title: 'Extract CVs and build the scorer',
          time: '35 min',
          description: 'This is the core: turning a CV + JD into a structured score.',
          steps: [
            {
              instruction: 'Put 3-5 sample CV PDFs into a cvs/ folder. Paste this prompt into Claude:',
              prompt: 'I\'m building an HR screening agent. Please create:\n1. requirements.txt with anthropic, pypdf2, requests\n2. cv_reader.py with read_cvs(folder="cvs") that extracts text from every PDF in the folder using PyPDF2 and returns a dict of {path: text}\n3. score.py with score_candidate(cv_text, jd_text) that sends both to Claude (model "claude-sonnet-4-5", max_tokens 600) asking it to score the candidate 1-10 on skills_match, experience_level, culture_fit, and growth_trajectory, then give an overall_score (1-10), top 3 strengths, top 2 gaps, and a recommendation (Strong Yes/Yes/Maybe/No). Return as JSON with exactly those keys.',
              verify: 'Run score_candidate() on one CV against your jd.txt. You should get back a JSON object with all the scoring fields filled in with sensible values, and the strengths/gaps should reference things actually in that CV (not generic statements).',
            },
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Add extract_contact.py with extract_contact(cv_text) that sends just the first 1000 characters of the CV to Claude (max_tokens 100) asking it to extract the candidate\'s full name and email address as JSON: {"name": "...", "email": "..."}',
              verify: 'Run extract_contact() on the same CV — it should correctly pull the name and email even though it only sees the top of the document.',
            },
          ],
          goFurther: '🛠️ Run score_candidate() on a CV that\'s a poor fit for your jd.txt (or write a quick fake one) — confirm the overall_score is meaningfully lower and the gaps section calls out the actual mismatch.',
        },
        {
          number: 3,
          title: 'Batch process into Airtable',
          time: '30 min',
          description: 'Go from "score one CV" to "rank everyone automatically."',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Add to my HR screening agent:\n\n1. airtable_write.py with push_to_airtable(base_id, table, api_key, record) that POSTs a record to the Airtable REST API (https://api.airtable.com/v0/{base_id}/{table}) with the record dict as "fields"\n2. batch.py with process_all(folder="cvs") that reads jd.txt, loops over read_cvs(folder), calls extract_contact() and score_candidate() for each, and pushes a record to Airtable with Name, Email, Score (=overall_score), Strengths (joined with newlines), Gaps (joined with newlines), and Recommendation. Add a small sleep(0.25) between Airtable calls to stay under the rate limit, and print "Processed {name}: {score}/10" for each.',
              verify: 'Run process_all() on your cvs/ folder. Check Airtable — you should see one row per CV, with the Score-sorted view showing your best-fit candidates at the top, and Strengths/Gaps filled in with real text.',
            },
          ],
          goFurther: 'Sort the Airtable view by Score and read through the top vs. bottom candidate\'s Gaps — does the difference in score match your own intuition about who\'s a stronger fit?',
        },
        {
          number: 4,
          title: 'Add a bias-reduction blind review mode',
          time: '30 min',
          description: 'Optionally screen out factors that shouldn\'t affect the score.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Add blind_review.py with redact_pii(cv_text) that uses regex to replace gendered pronouns and titles (He/She/His/Her/Mr./Ms./Mrs.) with "[REDACTED]", and replaces graduation years near the word "graduat" with "[YEAR]" (case-insensitive). Then add a --blind flag to batch.py: when set, run redact_pii() on each CV\'s text before passing it to score_candidate() and extract_contact() (note: extract_contact will need the unredacted text for name/email, so only redact what goes into score_candidate).',
              verify: 'Run process_all(blind=True) on the same CVs from Build 3 and push to a separate Airtable view (or just compare scores in the console). Compare overall_score between blind and non-blind runs for the same candidates — large unexplained gaps are worth investigating.',
            },
          ],
          goFurther: '🛠️🛠️ Ask Claude to add an overnight cron job that watches the cvs/ folder for new PDFs and runs process_all() automatically, so candidates get scored as resumes come in.',
        },
      ],
      portfolio: 'You just built a recruiting agent that turns a stack of resumes into a ranked, scored shortlist. Take a screenshot of your Airtable Candidates view sorted by score (redact real candidate info), and add "HR Recruitment Screening Agent" to your build portfolio.',
      portfolioPrompt: 'I just built an HR screening agent: it extracts text from a folder of CV PDFs, uses Claude to score each candidate 1-10 across skills match, experience, culture fit, and growth trajectory against a job description rubric, and pushes ranked results — strengths, gaps, and a hire recommendation — into an Airtable tracker, with an optional bias-reduction blind review mode.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows',
    },
    steps: [
      {
        number: 1,
        title: 'Define the job description template',
        description: 'Write a clear JD covering required skills, nice-to-haves, and explicit red flags to screen against.',
        code: `# jd.txt
Role: Senior Backend Engineer
Required: 5+ years Python, distributed systems, AWS
Nice-to-have: Go, Kubernetes, fintech experience
Red flags: No evidence of production ownership, frequent <1yr job hops without explanation`,
        tip: 'Explicit "red flags" give Claude clear negative signals — without them, scores tend to cluster too high.',
      },
      {
        number: 2,
        title: 'Set up the Airtable base',
        description: 'Create a base with a Candidates table containing fields: Name, Email, Score, Strengths, Gaps, Recommendation.',
        code: `# Airtable fields:
# Name (text), Email (text), Score (number), Strengths (long text),
# Gaps (long text), Recommendation (single select: Strong Yes/Yes/Maybe/No)`,
        tip: 'Create a view sorted by Score descending so your hiring manager always sees top candidates first.',
      },
      {
        number: 3,
        title: 'Build the CV reader',
        description: 'Extract plain text from each PDF CV in the /cvs folder.',
        code: `# cv_reader.py
import glob
from PyPDF2 import PdfReader

def read_cvs(folder="cvs"):
    cvs = {}
    for path in glob.glob(f"{folder}/*.pdf"):
        reader = PdfReader(path)
        text = "\\n".join(page.extract_text() for page in reader.pages)
        cvs[path] = text
    return cvs`,
        tip: 'Some PDFs are scanned images with no text layer — run those through an OCR tool like pytesseract first.',
      },
      {
        number: 4,
        title: 'Build the Claude scorer',
        description: 'Send the CV and JD to Claude, scoring 1-10 across four dimensions with reasoning.',
        code: `# score.py
from anthropic import Anthropic
import json

ai = Anthropic()

def score_candidate(cv_text, jd_text):
    prompt = f"""Job description:
{jd_text}

Candidate CV:
{cv_text[:6000]}

Score this candidate 1-10 on: skills_match, experience_level, culture_fit, growth_trajectory.
Then give an overall_score (1-10), top 3 strengths, top 2 gaps, and a recommendation
(Strong Yes / Yes / Maybe / No).

Return JSON: {{"skills_match": 0, "experience_level": 0, "culture_fit": 0, "growth_trajectory": 0,
"overall_score": 0, "strengths": ["...","...","..."], "gaps": ["...",".."], "recommendation": "..."}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=600,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)`,
        tip: 'culture_fit is the noisiest dimension — weight overall_score toward skills_match and experience_level if you need consistency.',
      },
      {
        number: 5,
        title: 'Build the structured output parser',
        description: 'Extract candidate name and email from the CV text separately so Airtable rows are properly identified.',
        code: `# extract_contact.py
def extract_contact(cv_text):
    prompt = f"""Extract the candidate's full name and email address from this CV.
CV: {cv_text[:1000]}
Return JSON: {{"name": "...", "email": "..."}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=100,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)`,
        tip: 'Run this on just the first 1000 characters — contact info is almost always at the top of a CV.',
      },
      {
        number: 6,
        title: 'Write to Airtable',
        description: 'Push each candidate’s scores and notes into the Airtable Candidates table.',
        code: `# airtable_write.py
import requests

def push_to_airtable(base_id, table, api_key, record):
    requests.post(
        f"https://api.airtable.com/v0/{base_id}/{table}",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={"fields": record},
    )`,
        tip: 'Airtable rate-limits to 5 requests/second — add a small sleep(0.25) between calls when batch processing.',
      },
      {
        number: 7,
        title: 'Build the batch processor',
        description: 'Loop through every CV, score it, extract contact info, and push the combined record to Airtable.',
        code: `# batch.py
def process_all(folder="cvs"):
    jd_text = open("jd.txt").read()
    cvs = read_cvs(folder)
    for path, text in cvs.items():
        contact = extract_contact(text)
        scores = score_candidate(text, jd_text)
        push_to_airtable(BASE_ID, "Candidates", API_KEY, {
            "Name": contact["name"], "Email": contact["email"],
            "Score": scores["overall_score"],
            "Strengths": "\\n".join(scores["strengths"]),
            "Gaps": "\\n".join(scores["gaps"]),
            "Recommendation": scores["recommendation"],
        })
        print(f"Processed {contact['name']}: {scores['overall_score']}/10")`,
        tip: 'Run this overnight via cron for a batch of 50+ CVs — it avoids tying up your terminal during the day.',
      },
      {
        number: 8,
        title: 'Add a diversity blind-review mode',
        description: 'Optionally redact name, gender pronouns, and age-related details before scoring to reduce bias.',
        code: `# blind_review.py
import re

def redact_pii(cv_text):
    text = re.sub(r"\\b(He|She|His|Her|Mr\\.|Ms\\.|Mrs\\.)\\b", "[REDACTED]", cv_text)
    text = re.sub(r"\\b(19|20)\\d{2}\\b(?=.*graduat)", "[YEAR]", text, flags=re.IGNORECASE)
    return text`,
        tip: 'Run scoring on both the redacted and original text occasionally and compare scores — large gaps signal bias to investigate.',
      },
    ],
    starterCode: `"""
AgentForge Academy — HR Recruitment Screening Agent (starter)
Run: pip install anthropic pypdf2 requests
"""
import json
from PyPDF2 import PdfReader
from anthropic import Anthropic

ai = Anthropic()

def score_candidate(cv_path, jd_text):
    reader = PdfReader(cv_path)
    cv_text = "\\n".join(page.extract_text() for page in reader.pages)
    prompt = f"""Job description:
{jd_text}

Candidate CV:
{cv_text[:6000]}

Score 1-10 on skills_match, experience_level, culture_fit, growth_trajectory, overall_score.
Give top 3 strengths, top 2 gaps, recommendation (Strong Yes/Yes/Maybe/No).
Return JSON only."""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=600,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)

if __name__ == "__main__":
    jd = open("jd.txt").read()
    print(json.dumps(score_candidate("cvs/candidate1.pdf", jd), indent=2))
`,
    resources: [
      { title: 'Airtable API Docs', url: 'https://airtable.com/developers/web/api/introduction' },
      { title: 'PyPDF2 Documentation', url: 'https://pypdf2.readthedocs.io' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 21,
    title: 'SEO Content Writer Agent',
    emoji: '📈',
    department: ['Marketing'],
    departmentIds: ['marketing'],
    difficulty: 'Intermediate',
    description:
      'Input a keyword — the agent researches top-ranking articles, finds content gaps, and writes a fully SEO-optimized long-form article.',
    whatYouBuild:
      'A content pipeline that pulls keyword data and the top 10 ranking pages for a target keyword, asks Claude to identify what those pages are missing, generates an H1/H2/H3 outline that fills those gaps, writes the article section by section, and finishes with SEO meta title, description, and slug — exported as ready-to-publish Markdown or HTML.',
    whatYouLearn: [
      'Pull keyword volume and difficulty data from an SEO API',
      'Scrape and compare top-ranking SERP content',
      'Run a content-gap analysis with Claude',
      'Generate a heading-structured outline programmatically',
      'Write long-form content section by section for quality control',
      'Generate SEO metadata (title, description, slug)',
    ],
    techStack: ['Python', 'DataForSEO API', 'Claude API'],
    buildTime: '4.5 hrs',
    xp: 540,
    popularity: 85,
    prerequisites: ['Basic Python', 'DataForSEO account', 'Completed Web Research Agent recommended'],
    tags: ['seo', 'content', 'marketing', 'writing'],
    session: {
      totalTime: '140 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Pull keyword data and the top 10 ranking pages for any target keyword',
        'Have Claude identify content gaps those pages consistently miss',
        'Generate a gap-aware outline and write the article section by section',
        'Generate SEO meta title/description/slug and export a publish-ready Markdown file',
      ],
      whatYouNeed: [
        'Claude Code, Cowork, or Claude Desktop open with a project folder set as your working directory',
        'A DataForSEO account (pay-as-you-go — keep an eye on usage during development)',
        'One target keyword you actually want to rank for',
      ],
      builds: [
        {
          number: 1,
          title: 'Pull keyword data and the top-ranking pages',
          time: '30 min',
          description: 'Know what you\'re up against before writing anything.',
          steps: [
            {
              instruction: 'Sign up at dataforseo.com and add DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD to your .env.',
            },
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'I\'m building an SEO content writer agent. Please create:\n1. requirements.txt with anthropic, requests, beautifulsoup4, python-dotenv\n2. keywords.py with get_keyword_data(keyword, login, password) that POSTs to DataForSEO\'s /v3/keywords_data/google_ads/search_volume/live endpoint (location_code 2840 for US, language_code "en") using HTTP Basic Auth, and returns the result for the keyword\n3. serp.py with get_top_results(keyword, login, password) that POSTs to /v3/serp/google/organic/live/advanced (same auth/location), and returns the top 10 organic results as [{"title": ..., "url": ...}]\n\nAdd a small main block that prints the search volume and the 10 result titles+URLs for a test keyword.',
              verify: 'Run it with your target keyword — you should see a search volume number and a list of 10 competing article titles/URLs. Note DataForSEO charges per call, so avoid running this in a loop during development.',
            },
          ],
          goFurther: 'Cache the keyword and SERP results to a local JSON file so you can re-run later builds without re-calling (and re-paying for) the DataForSEO API.',
        },
        {
          number: 2,
          title: 'Scrape competitors and find content gaps',
          time: '35 min',
          description: 'This is the strategic core — figuring out what to write that others didn\'t.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Add to my SEO agent:\n\n1. A scraper function (reuse the pattern from a research agent if I have one, otherwise create scraper.py) with fetch_full_text(url, max_chars=1500) that fetches a URL and returns cleaned plain text via BeautifulSoup\n2. gap_analysis.py with find_gaps(keyword, articles) where articles is a list of {"title": ..., "text": ...}. It should combine all the article texts (truncated to 1500 chars each) into one prompt, send it to Claude (model "claude-sonnet-4-5", max_tokens 800) asking what subtopics, questions, or angles these top-ranking articles consistently MISS or cover poorly, and return a list of 5-8 specific content gaps.',
              verify: 'Run fetch_full_text() on each of your top-10 URLs (some may fail — that\'s normal, just skip them), then run find_gaps() on the successfully-scraped ones. You should get 5-8 specific, actionable gaps — not generic advice like "add more detail".',
            },
          ],
          goFurther: '🛠️ Read the identified gaps critically — would filling them actually help a reader, or are they SEO-only padding? Cut any gap that doesn\'t pass that test before moving to Build 3.',
        },
        {
          number: 3,
          title: 'Generate an outline and write the article',
          time: '40 min',
          description: 'Write section-by-section to avoid the "wall of generic text" problem.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Add to my SEO agent:\n\n1. outline.py with generate_outline(keyword, gaps) that asks Claude (max_tokens 600) for a JSON outline: {"h1": "...", "sections": [{"h2": "...", "subsections": ["h3 ...", "h3 ..."]}]} with 6-8 H2 sections, at least 2 of which directly address the content gaps\n2. write_sections.py with write_article(keyword, outline) that loops through each section, and for each one sends Claude (max_tokens 600) the article-so-far (last 1000 chars, for continuity, with an instruction not to repeat it), the current section\'s h2 and subsections, and asks for ~200-300 words of clear, engaging prose. Concatenates everything into one Markdown article with "# h1" and "## h2" headers.',
              verify: 'Run the full outline -> write_article pipeline. Read the resulting article: does it flow without obviously repeating itself between sections? Do at least 2 sections clearly address the gaps from Build 2?',
            },
          ],
          goFurther: 'Pick the section that addresses your strongest content gap and read it side-by-side with the top-ranking competitor article on that topic — does yours actually go deeper?',
        },
        {
          number: 4,
          title: 'Add SEO metadata and export',
          time: '35 min',
          description: 'Get it ready to actually publish.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Finish my SEO content writer:\n\n1. meta.py with generate_meta(keyword, article_intro) that asks Claude (max_tokens 200) for meta_title (max 60 chars, includes the keyword), meta_description (max 155 chars, includes the keyword, compelling), and slug (lowercase-hyphenated) as JSON. Validate the character counts in code and truncate if Claude goes over.\n2. export.py with export_article(meta, article_md, filename) that writes a Markdown file with YAML front-matter (title, description, slug) followed by the article body — compatible with static site generators like Hugo/Gatsby/Next.js MDX\n3. main.py that runs the full pipeline end to end: keyword data + SERP -> scrape + gap analysis -> outline -> write_article -> generate_meta -> export_article',
              verify: 'Run main.py on your target keyword end to end. Open the exported .md file — it should have valid YAML front-matter with title/description/slug under the character limits, followed by a complete, readable, gap-aware article.',
            },
          ],
          goFurther: '🛠️🛠️ Ask Claude to add a --competitor-word-count flag that reports the average word count of the top 10 ranking articles, and compares it to your generated article\'s word count — useful context for whether you\'re competitively thorough.',
        },
      ],
      portfolio: 'You just built an agent that researches, outlines, and writes SEO content informed by real competitive data. Save your exported article (or a screenshot of the front-matter + intro) and add "SEO Content Writer Agent" to your build portfolio.',
      portfolioPrompt: 'I just built an SEO content writer agent: it pulls keyword data and the top 10 ranking pages for a target keyword, has Claude identify content gaps those pages consistently miss, generates a gap-aware outline, writes the article section by section for continuity, and exports a publish-ready Markdown file with SEO meta title/description/slug.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows',
    },
    steps: [
      {
        number: 1,
        title: 'Get a DataForSEO API key',
        description: 'Sign up at dataforseo.com — pay-as-you-go pricing makes it affordable for keyword and SERP lookups.',
        code: `# .env
DATAFORSEO_LOGIN=your_login
DATAFORSEO_PASSWORD=your_password
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxx`,
        tip: 'DataForSEO bills per call — cache results locally during development to avoid repeated charges.',
      },
      {
        number: 2,
        title: 'Build the keyword analyzer',
        description: 'Pull search volume, difficulty, and related keywords for your target term.',
        code: `# keywords.py
import requests
from requests.auth import HTTPBasicAuth

def get_keyword_data(keyword, login, password):
    resp = requests.post(
        "https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live",
        auth=HTTPBasicAuth(login, password),
        json=[{"keywords": [keyword], "location_code": 2840, "language_code": "en"}],
    )
    return resp.json()["tasks"][0]["result"][0]`,
        tip: 'location_code 2840 is the United States — change it to target other regions.',
      },
      {
        number: 3,
        title: 'Build the SERP scraper',
        description: 'Fetch the top 10 ranking pages for the keyword and grab their visible text.',
        code: `# serp.py
def get_top_results(keyword, login, password):
    resp = requests.post(
        "https://api.dataforseo.com/v3/serp/google/organic/live/advanced",
        auth=HTTPBasicAuth(login, password),
        json=[{"keyword": keyword, "location_code": 2840, "language_code": "en", "depth": 10}],
    )
    items = resp.json()["tasks"][0]["result"][0]["items"]
    return [{"title": i.get("title"), "url": i.get("url")} for i in items if i.get("type") == "organic"][:10]`,
        tip: 'Fetch full text for each URL with the same scraper from Agent 13 — SERP APIs only return titles and snippets.',
      },
      {
        number: 4,
        title: 'Build the content gap analyzer',
        description: 'Send the scraped content from all 10 articles to Claude and ask what topics they consistently miss.',
        code: `# gap_analysis.py
def find_gaps(keyword, articles):
    combined = "\\n\\n".join(f"--- {a['title']} ---\\n{a['text'][:1500]}" for a in articles)
    prompt = f"""Keyword: {keyword}

Here are the top 10 ranking articles for this keyword:
{combined}

What subtopics, questions, or angles do these articles consistently MISS or cover poorly?
List 5-8 specific content gaps an article could fill to outrank them."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=800,
        messages=[{"role": "user", "content": prompt}]).content[0].text`,
        tip: 'Gap analysis quality scales directly with how much real text you feed in — do not skip the scraping step.',
      },
      {
        number: 5,
        title: 'Generate the content outline',
        description: 'Ask Claude to produce an H1/H2/H3 structure that addresses both standard coverage and the identified gaps.',
        code: `# outline.py
import json

def generate_outline(keyword, gaps):
    prompt = f"""Keyword: {keyword}
Content gaps to address: {gaps}

Create a long-form article outline as JSON:
{{"h1": "...", "sections": [{{"h2": "...", "subsections": ["h3 ...", "h3 ..."]}}]}}
Include 6-8 H2 sections, at least 2 of which directly address the gaps above."""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=600,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)`,
        tip: 'A clear outline up front means each section can be written independently — critical for the next step.',
      },
      {
        number: 6,
        title: 'Write the article section by section',
        description: 'Loop through each H2/H3 in the outline and ask Claude to write that section, passing prior sections as context for continuity.',
        code: `# write_sections.py
def write_article(keyword, outline):
    article = [f"# {outline['h1']}"]
    context_so_far = ""
    for section in outline["sections"]:
        prompt = f"""Article so far (for continuity, do not repeat):
{context_so_far[-1000:]}

Write the section "{section['h2']}" for an SEO article targeting "{keyword}".
Cover subsections: {section['subsections']}. Use clear, engaging prose, ~200-300 words."""
        text = ai.messages.create(model="claude-sonnet-4-5", max_tokens=600,
            messages=[{"role": "user", "content": prompt}]).content[0].text
        article.append(f"## {section['h2']}\\n{text}")
        context_so_far += text
    return "\\n\\n".join(article)`,
        tip: 'Writing section-by-section avoids the "wall of generic text" problem common with single-shot long-form prompts.',
      },
      {
        number: 7,
        title: 'Add SEO meta generation',
        description: 'Generate a meta title (≤60 chars), meta description (≤155 chars), and URL slug.',
        code: `# meta.py
def generate_meta(keyword, article_intro):
    prompt = f"""Keyword: {keyword}
Article intro: {article_intro[:500]}

Generate: meta_title (max 60 chars, include keyword), meta_description (max 155 chars,
include keyword, compelling), slug (lowercase-hyphenated).
Return JSON: {{"meta_title": "...", "meta_description": "...", "slug": "..."}}"""
    import json
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=200,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)`,
        tip: 'Always validate character counts in code — Claude occasionally goes a few characters over the limit.',
      },
      {
        number: 8,
        title: 'Export as Markdown/HTML',
        description: 'Combine the article, meta tags, and front-matter into a publish-ready file.',
        code: `# export.py
def export_article(meta, article_md, filename):
    front_matter = f"""---
title: "{meta['meta_title']}"
description: "{meta['meta_description']}"
slug: "{meta['slug']}"
---

"""
    with open(filename, "w", encoding="utf-8") as f:
        f.write(front_matter + article_md)`,
        tip: 'This front-matter format drops directly into most static site generators (Hugo, Gatsby, Next.js MDX).',
      },
    ],
    starterCode: `"""
AgentForge Academy — SEO Content Writer Agent (starter)
Run: pip install anthropic requests
"""
import json
from anthropic import Anthropic

ai = Anthropic()

def generate_outline(keyword):
    prompt = f"""Keyword: "{keyword}"
Create a long-form SEO article outline as JSON:
{{"h1": "...", "sections": [{{"h2": "...", "subsections": ["..."]}}]}}
Include 6 H2 sections."""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=500,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)

def write_section(keyword, h2, subsections):
    prompt = f"""Write the "{h2}" section (~250 words) for an SEO article on "{keyword}".
Cover: {subsections}."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=500,
        messages=[{"role": "user", "content": prompt}]).content[0].text

if __name__ == "__main__":
    outline = generate_outline("AI agents for small business")
    print("# " + outline["h1"])
    for s in outline["sections"]:
        print(write_section("AI agents for small business", s["h2"], s["subsections"]))
`,
    resources: [
      { title: 'DataForSEO API Docs', url: 'https://docs.dataforseo.com' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
      { title: 'Markdown front-matter spec', url: 'https://jekyllrb.com/docs/front-matter/' },
    ],
  },
  {
    id: 22,
    title: 'Financial Reporting Agent',
    emoji: '📊',
    department: ['Finance'],
    departmentIds: ['finance'],
    difficulty: 'Intermediate',
    description:
      'Input a CSV of transactions — the agent generates a complete financial report with revenue analysis, expense breakdown, and plain-English insights.',
    whatYouBuild:
      'A monthly reporting pipeline that ingests a transactions CSV (QuickBooks/Xero export), cleans and categorizes it, computes core metrics (revenue, expenses, margin, MoM growth, runway), generates charts with matplotlib, asks Claude to write plain-English commentary, flags anomalies, and assembles everything into a polished PDF emailed to the finance team.',
    whatYouLearn: [
      'Clean and standardize financial CSV exports with pandas',
      'Compute core SaaS/finance metrics programmatically',
      'Generate charts with matplotlib for reports',
      'Write a Claude prompt that turns metrics into narrative commentary',
      'Detect anomalies in transaction data',
      'Assemble a multi-section PDF report with reportlab',
    ],
    techStack: ['Python', 'pandas', 'matplotlib', 'Claude API'],
    buildTime: '4 hrs',
    xp: 500,
    popularity: 80,
    prerequisites: ['Basic Python', 'pandas basics', 'Sample transactions CSV'],
    tags: ['finance', 'reporting', 'analytics', 'pandas'],
    session: {
      totalTime: '120 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Ingest and clean a QuickBooks/Xero-style transactions CSV with pandas',
        'Compute revenue, expenses, margin, MoM growth, and cash runway',
        'Generate revenue and expense charts plus a flagged list of anomalous transactions',
        'Have Claude write plain-English commentary and assemble a polished PDF report',
      ],
      whatYouNeed: [
        'Claude Code, Cowork, or Claude Desktop open with a project folder set as your working directory',
        'A sample transactions CSV (export one from QuickBooks/Xero, or use your own bank export)',
        'Your current cash balance (for the runway calculation)',
      ],
      builds: [
        {
          number: 1,
          title: 'Ingest and clean your transactions',
          time: '25 min',
          description: 'Get a clean, standardized DataFrame before computing anything.',
          steps: [
            {
              instruction: 'Open your transactions CSV and note the actual column names — they vary by export tool (e.g. "Transaction Date" vs "Date", "Amount" vs "Net Amount").',
            },
            {
              instruction: 'Paste this prompt into Claude, including your actual column names:',
              prompt: 'I\'m building a financial reporting agent. My transactions CSV has these columns: [list your actual column names, e.g. "Transaction Date, Amount, Category, Description"]. Please create:\n1. requirements.txt with pandas, matplotlib, anthropic, reportlab\n2. ingest.py with a COLUMN_MAP dict mapping my actual column names to standard names (date, amount, category, description), and load_transactions(path) that reads the CSV, renames columns via COLUMN_MAP, converts date to datetime and amount to numeric (coercing errors), and drops rows where amount couldn\'t be parsed\n3. clean.py with clean_transactions(df) that fills missing categories with "Uncategorized", title-cases and strips category names, drops duplicate transactions (same date+amount+description), and adds a "month" column (period M)',
              verify: 'Run load_transactions() then clean_transactions() on your CSV and print df.head() and df["category"].unique() — categories should look consistent (no duplicates differing only by case/whitespace), and the row count should be lower if your CSV had duplicates.',
            },
          ],
          goFurther: 'Check df["month"].unique() — confirm you have at least 2 months of data, since MoM growth needs a previous month to compare against.',
        },
        {
          number: 2,
          title: 'Compute core financial metrics',
          time: '25 min',
          description: 'Turn raw transactions into the numbers a CFO actually cares about.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude, substituting your actual cash balance:',
              prompt: 'Create metrics.py with compute_metrics(df, cash_balance) that:\n1. Groups by month to get monthly revenue (sum of positive amounts) and expenses (sum of absolute negative amounts)\n2. Computes MoM revenue growth as a percentage between the latest and previous month (guard the denominator with max(value, 1) to avoid divide-by-zero)\n3. Computes gross margin for the latest month as (revenue - expenses) / max(revenue, 1) * 100\n4. Computes monthly burn (expenses - revenue for the latest month) and runway_months = cash_balance / burn if burn > 0 else infinity\n5. Returns a dict with revenue, expenses, margin, mom_growth, and runway_months',
              verify: 'Run compute_metrics(df, <your cash balance>) and print the result. Sanity-check: if your latest month had more revenue than the previous, mom_growth should be positive; if expenses exceed revenue, runway_months should be a finite positive number.',
            },
          ],
          goFurther: '🛠️ Test compute_metrics() on a DataFrame with a $0-revenue month (filter your data to simulate this) — confirm it doesn\'t crash with a divide-by-zero error.',
        },
        {
          number: 3,
          title: 'Generate charts and Claude commentary',
          time: '30 min',
          description: 'Turn numbers into visuals and plain-English explanation.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Add to my financial reporting agent:\n\n1. charts.py with make_revenue_chart(revenue, path="revenue.png") that plots monthly revenue as a line chart with markers, and make_expense_pie(df, path="expenses.png") that plots a pie chart of expenses grouped by category. Make sure to call plt.close() after each savefig.\n2. commentary.py with write_commentary(metrics) that sends the MoM growth, gross margin, and runway figures to Claude (model "claude-sonnet-4-5", max_tokens 500) with a prompt framing it as "You are a CFO writing a monthly update for the leadership team" and asking for 3 short plain-English paragraphs: overall health, what\'s driving the numbers, and one recommended action — no jargon.',
              verify: 'Run make_revenue_chart() and make_expense_pie() — confirm revenue.png and expenses.png are created and look correct when opened. Run write_commentary() on your computed metrics — the 3 paragraphs should reference your actual numbers (growth rate, margin, runway) in plain language a non-finance person could understand.',
            },
          ],
          goFurther: 'Read the "recommended action" paragraph — does it make sense given your actual numbers? If your runway is healthy but the commentary still sounds alarmed (or vice versa), tune the prompt\'s framing.',
        },
        {
          number: 4,
          title: 'Detect anomalies and assemble the PDF',
          time: '40 min',
          description: 'Catch weird transactions and ship a report someone can actually read.',
          steps: [
            {
              instruction: 'Paste this prompt into Claude:',
              prompt: 'Finish my financial reporting agent:\n\n1. anomalies.py with find_anomalies(df) that groups by category, and for categories with at least 5 transactions, flags any transaction whose amount is more than 3 standard deviations from that category\'s mean. Return a list of the flagged transaction records.\n2. pdf_report.py with build_pdf(commentary, chart_paths, anomalies, output="report.pdf") using reportlab\'s SimpleDocTemplate — a title "Monthly Financial Report", the commentary as paragraphs, the chart images, and (if anomalies exist) a section listing each flagged transaction\'s date, amount, category, and description.\n3. main.py that runs the full pipeline: load_transactions -> clean_transactions -> compute_metrics -> charts -> write_commentary -> find_anomalies -> build_pdf',
              verify: 'Run main.py end to end — it should produce report.pdf. Open it and confirm it has the title, 3 commentary paragraphs, both charts, and (if your data has any 3-sigma outliers) an anomalies section listing them.',
            },
          ],
          goFurther: '🛠️🛠️ Ask Claude to add an email_report() function (reusing SMTP patterns from earlier agents) and a check for "is today the 1st of the month" so the whole pipeline can run on a daily cron and only actually send on the 1st.',
        },
      ],
      portfolio: 'You just built an agent that turns a raw transactions export into a CFO-ready report with commentary. Take a screenshot of a page from your generated report.pdf (redact real financial figures if needed), and add "Financial Reporting Agent" to your build portfolio.',
      portfolioPrompt: 'I just built a financial reporting agent: it ingests and cleans a QuickBooks/Xero-style transactions CSV with pandas, computes revenue, expenses, margin, MoM growth, and runway, generates charts, flags anomalous transactions (3-sigma outliers), has Claude write plain-English CFO-style commentary, and assembles everything into a PDF report.\n\nHelp me write:\n1. A 2-3 sentence project description for my portfolio site\n2. A short LinkedIn post announcing it\n3. Three resume-style bullet points describing what I built and the skills it shows',
    },
    steps: [
      {
        number: 1,
        title: 'Build the data ingester',
        description: 'Read the transactions CSV with pandas, handling common QuickBooks/Xero column naming.',
        code: `# ingest.py
import pandas as pd

COLUMN_MAP = {"Transaction Date": "date", "Amount": "amount", "Category": "category", "Description": "description"}

def load_transactions(path):
    df = pd.read_csv(path)
    df = df.rename(columns={k: v for k, v in COLUMN_MAP.items() if k in df.columns})
    df["date"] = pd.to_datetime(df["date"])
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce")
    return df.dropna(subset=["amount"])`,
        tip: 'Export a small sample CSV from QuickBooks/Xero first and inspect the actual column names — they vary by region and plan.',
      },
      {
        number: 2,
        title: 'Build the data cleaner',
        description: 'Standardize categories and remove duplicate transactions.',
        code: `# clean.py
def clean_transactions(df):
    df["category"] = df["category"].fillna("Uncategorized").str.strip().str.title()
    df = df.drop_duplicates(subset=["date", "amount", "description"])
    df["month"] = df["date"].dt.to_period("M")
    return df`,
        tip: 'Duplicate transactions from re-imported exports are a common source of inflated expense totals — always dedupe first.',
      },
      {
        number: 3,
        title: 'Build the metric calculator',
        description: 'Compute revenue, expenses, profit margin, month-over-month growth, and runway.',
        code: `# metrics.py
def compute_metrics(df, cash_balance):
    monthly = df.groupby("month")["amount"].sum()
    revenue = df[df["amount"] > 0].groupby("month")["amount"].sum()
    expenses = df[df["amount"] < 0].groupby("month")["amount"].sum().abs()
    latest, prev = monthly.index[-1], monthly.index[-2]
    mom_growth = (revenue.get(latest, 0) - revenue.get(prev, 0)) / max(revenue.get(prev, 1), 1) * 100
    burn = expenses.get(latest, 0) - revenue.get(latest, 0)
    runway_months = cash_balance / burn if burn > 0 else float("inf")
    return {
        "revenue": revenue, "expenses": expenses,
        "margin": (revenue.get(latest, 0) - expenses.get(latest, 0)) / max(revenue.get(latest, 1), 1) * 100,
        "mom_growth": mom_growth, "runway_months": runway_months,
    }`,
        tip: 'Guard every division with max(denominator, 1) — early-stage companies frequently have $0 revenue months.',
      },
      {
        number: 4,
        title: 'Build the visualization engine',
        description: 'Generate a revenue trend line chart and an expense category pie chart.',
        code: `# charts.py
import matplotlib.pyplot as plt

def make_revenue_chart(revenue, path="revenue.png"):
    revenue.plot(kind="line", marker="o", title="Monthly Revenue")
    plt.ylabel("USD"); plt.tight_layout(); plt.savefig(path); plt.close()

def make_expense_pie(df, path="expenses.png"):
    by_category = df[df["amount"] < 0].groupby("category")["amount"].sum().abs()
    by_category.plot(kind="pie", autopct="%1.1f%%", title="Expenses by Category")
    plt.ylabel(""); plt.tight_layout(); plt.savefig(path); plt.close()`,
        tip: 'Always plt.close() after savefig — matplotlib keeps figures in memory and leaks across many report runs.',
      },
      {
        number: 5,
        title: 'Build the Claude analyst',
        description: 'Send the computed metrics to Claude and request plain-English commentary for non-finance stakeholders.',
        code: `# commentary.py
from anthropic import Anthropic
ai = Anthropic()

def write_commentary(metrics):
    prompt = f"""You are a CFO writing a monthly update for the leadership team.

Metrics: revenue MoM growth = {metrics['mom_growth']:.1f}%, gross margin = {metrics['margin']:.1f}%,
runway = {metrics['runway_months']:.1f} months.

Write 3 short paragraphs in plain English: 1) overall health, 2) what's driving the numbers,
3) one recommended action. No jargon."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=500,
        messages=[{"role": "user", "content": prompt}]).content[0].text`,
        tip: 'Feed raw numbers, not pre-written sentences — Claude writes more naturally when reasoning from data directly.',
      },
      {
        number: 6,
        title: 'Build the PDF report generator',
        description: 'Combine charts and commentary into a single PDF using reportlab.',
        code: `# pdf_report.py
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Image, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

def build_pdf(commentary, chart_paths, output="report.pdf"):
    doc = SimpleDocTemplate(output, pagesize=letter)
    styles = getSampleStyleSheet()
    story = [Paragraph("Monthly Financial Report", styles["Title"]), Spacer(1, 12)]
    for para in commentary.split("\\n\\n"):
        story.append(Paragraph(para, styles["BodyText"]))
        story.append(Spacer(1, 8))
    for path in chart_paths:
        story.append(Image(path, width=400, height=250))
        story.append(Spacer(1, 12))
    doc.build(story)`,
        tip: 'pip install reportlab — it has zero external dependencies and produces clean, print-ready PDFs.',
      },
      {
        number: 7,
        title: 'Add an anomaly detector',
        description: 'Flag transactions more than 3 standard deviations from their category’s mean.',
        code: `# anomalies.py
def find_anomalies(df):
    anomalies = []
    for category, group in df.groupby("category"):
        mean, std = group["amount"].mean(), group["amount"].std()
        if std == 0 or pd.isna(std):
            continue
        outliers = group[(group["amount"] - mean).abs() > 3 * std]
        anomalies.extend(outliers.to_dict("records"))
    return anomalies`,
        tip: 'Categories with very few transactions will have unstable standard deviations — require at least 5 data points before flagging.',
      },
      {
        number: 8,
        title: 'Schedule monthly delivery',
        description: 'Run the full pipeline on the 1st of each month and email the PDF to the finance team.',
        code: `# main.py
import schedule, time, smtplib
from email.message import EmailMessage

def email_report(pdf_path, recipients):
    msg = EmailMessage()
    msg["Subject"] = "Monthly Financial Report"
    msg["From"] = "agent@yourcompany.com"
    msg["To"] = ", ".join(recipients)
    msg.set_content("Attached is this month's automated financial report.")
    with open(pdf_path, "rb") as f:
        msg.add_attachment(f.read(), maintype="application", subtype="pdf", filename="report.pdf")
    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login("agent@yourcompany.com", "app-password")
        server.send_message(msg)

schedule.every().day.at("07:00").do(lambda: run_if_first_of_month())`,
        tip: 'Check `datetime.now().day == 1` inside run_if_first_of_month() — schedule has no native "monthly" trigger.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Financial Reporting Agent (starter)
Run: pip install pandas matplotlib anthropic reportlab
"""
import pandas as pd
from anthropic import Anthropic

ai = Anthropic()

def load_and_summarize(csv_path):
    df = pd.read_csv(csv_path)
    df["date"] = pd.to_datetime(df["date"])
    df["month"] = df["date"].dt.to_period("M")
    revenue = df[df["amount"] > 0].groupby("month")["amount"].sum()
    expenses = df[df["amount"] < 0].groupby("month")["amount"].sum().abs()
    return revenue, expenses

def write_commentary(revenue, expenses):
    latest = revenue.index[-1]
    prompt = f"""Revenue this month: {revenue.get(latest, 0):.2f}, Expenses: {expenses.get(latest, 0):.2f}.
Write 2 short plain-English paragraphs on financial health and one recommendation."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=400,
        messages=[{"role": "user", "content": prompt}]).content[0].text

if __name__ == "__main__":
    revenue, expenses = load_and_summarize("transactions.csv")
    print(write_commentary(revenue, expenses))
`,
    resources: [
      { title: 'pandas Documentation', url: 'https://pandas.pydata.org/docs/' },
      { title: 'ReportLab User Guide', url: 'https://www.reportlab.com/docs/reportlab-userguide.pdf' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 23,
    title: 'Contract Clause Extractor',
    emoji: '📜',
    department: ['Legal'],
    departmentIds: ['legal'],
    difficulty: 'Intermediate',
    description:
      'Upload any contract — the agent extracts all key clauses (payment, termination, liability, IP, governing law) into a structured summary.',
    whatYouBuild:
      'A contract analysis tool that reads a PDF or DOCX contract, sends the text to Claude with a 15-clause taxonomy, extracts the exact text and a plain-English summary plus a red/yellow/green risk rating for each clause type, and can compare two contracts side by side to highlight differences.',
    whatYouLearn: [
      'Extract text from PDF and DOCX contracts',
      'Define a structured clause taxonomy',
      'Build extraction prompts that return exact quotes plus summaries',
      'Implement a simple red/yellow/green risk scoring system',
      'Compare two structured extractions for differences',
      'Export results to JSON, Word, and HTML',
    ],
    techStack: ['Python', 'Claude API', 'python-docx'],
    buildTime: '3.5 hrs',
    xp: 440,
    popularity: 77,
    prerequisites: ['Basic Python', 'Sample contract PDFs/DOCX'],
    tags: ['legal', 'contracts', 'extraction', 'risk'],
    session: {
      totalTime: '110 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'A tool that reads PDF or DOCX contracts and pulls out 15 key clause types automatically',
        'Each clause comes with a plain-English summary and a red/yellow/green risk rating',
        'A comparison mode that flags material differences between two contract versions',
        'Word and JSON exports ready to hand to your legal team',
      ],
      whatYouNeed: [
        'Python installed locally',
        'An Anthropic API key (console.anthropic.com)',
        'pip install anthropic pypdf2 python-docx',
        'A few sample contracts (PDF or DOCX) — NDAs, vendor agreements, etc.',
      ],
      builds: [
        {
          number: 1,
          title: 'Build the contract reader and clause taxonomy',
          time: '20 min',
          description: 'Get plain text out of any contract file and define the 15 clause types you want extracted every time.',
          steps: [
            {
              instruction: 'Ask Claude to build reader.py that extracts text from PDF or DOCX files based on extension, and taxonomy.py with a CLAUSE_TYPES list covering the 15 standard clause categories.',
              prompt: 'Write two Python files for a contract analysis tool.\n\n1) reader.py with a function read_contract(path) that:\n- If the file ends in .pdf, uses PyPDF2 to extract text from every page and joins it with newlines\n- If the file ends in .docx, uses python-docx to extract text from every paragraph and joins it with newlines\n- Raises ValueError for any other extension\n- Keeps newlines intact since contracts use them as structural cues\n\n2) taxonomy.py with a CLAUSE_TYPES list containing these 15 clause categories: Payment Terms, Termination, Limitation of Liability, Indemnification, Intellectual Property Ownership, Confidentiality, Governing Law, Dispute Resolution, Auto-Renewal, Assignment, Warranties, Force Majeure, Non-Compete, Data Protection, Insurance Requirements.\n\nAdd a comment noting this taxonomy should be adjusted per contract type (an NDA needs different clauses than a vendor services agreement).',
              verify: 'Run read_contract() on a sample PDF and a sample DOCX — both should print readable text with section breaks visible as newlines.',
            },
          ],
          goFurther: 'Add a third file type — plain .txt — for contracts you\'ve already converted. 🛠️',
        },
        {
          number: 2,
          title: 'Build the Claude clause extractor',
          time: '30 min',
          description: 'Send the contract text to Claude and get back structured data for every clause type: exact quote, plain-English summary, and risk rating.',
          steps: [
            {
              instruction: 'Ask Claude to build extract.py with an extract_clauses function that sends the contract text plus the clause taxonomy to Claude and parses the JSON response.',
              prompt: 'Write extract.py for a contract analysis tool using the anthropic Python SDK.\n\nCreate a function extract_clauses(contract_text, clause_types) that:\n- Builds a prompt containing the first 12000 characters of contract_text (note in a comment that longer contracts should be split in half and the JSON results merged)\n- For each clause type in clause_types, asks Claude to find: exact_text (verbatim quote, or "Not found"), summary (one plain-English sentence), and risk (one of "red", "yellow", "green" based on how favorable/standard the clause is)\n- Calls claude-sonnet-4-5 with max_tokens=4000\n- Asks for a JSON response in the form {"clauses": {"Payment Terms": {"exact_text": "...", "summary": "...", "risk": "..."}, ...}}\n- Parses and returns the JSON\n\nMake the risk rating instructions specific: red = unusual/unfavorable to our side, yellow = present but worth a second look, green = standard/favorable language.',
              verify: 'Run extract_clauses on a sample contract — you should get back a dict with all 15 clause types, each with exact_text, summary, and a risk color.',
            },
          ],
          goFurther: 'For 50+ page contracts, split the text into halves, run extraction on each, and merge the two JSON results by clause type. 🛠️🛠️',
        },
        {
          number: 3,
          title: 'Score overall risk and check against your standards',
          time: '25 min',
          description: 'Roll up clause-level risk into one overall rating, and flag clauses that deviate from your organization\'s standard language.',
          steps: [
            {
              instruction: 'Ask Claude to build risk.py with an overall_risk function, and standard_library.py with a STANDARD_CLAUSES dict and a flag_deviations function.',
              prompt: 'Write two Python files for a contract risk tool.\n\n1) risk.py with overall_risk(clauses) that:\n- Counts how many clauses are rated red, yellow, and green\n- Returns "High Risk" if there are 2+ red clauses\n- Returns "Medium Risk" if there is exactly 1 red clause OR 4+ yellow clauses\n- Otherwise returns "Low Risk"\n\n2) standard_library.py with:\n- A STANDARD_CLAUSES dict mapping clause type names to your organization\'s preferred language, e.g. {"Limitation of Liability": "Liability shall not exceed fees paid in the preceding 12 months.", "Governing Law": "This agreement shall be governed by the laws of Delaware."}\n- A flag_deviations(clauses) function that compares the first 3 words of each standard clause against the first 3 words of the actual extracted clause, and returns a dict of deviations with both the standard and actual text for any mismatch\n\nAdd a comment that the word-prefix check is a starting heuristic and that production use should ask Claude to assess semantic similarity instead.',
              verify: 'Run overall_risk() on your extracted clauses and confirm it returns one of the three risk levels. Run flag_deviations() and confirm it flags clauses where your contract language differs from STANDARD_CLAUSES.',
            },
          ],
          goFurther: 'Replace the word-prefix deviation check with a Claude call that rates semantic similarity 0-100 between the standard clause and the actual clause. 🛠️🛠️',
        },
        {
          number: 4,
          title: 'Add contract comparison and export to Word',
          time: '35 min',
          description: 'Compare two contracts side by side and produce a formatted Word document for lawyers to review.',
          steps: [
            {
              instruction: 'Ask Claude to build compare.py with a compare_contracts function, and export.py with an export_word function that writes a formatted .docx report.',
              prompt: 'Write two Python files for a contract analysis tool.\n\n1) compare.py with compare_contracts(clauses_a, clauses_b) that:\n- Sends both extracted clause dicts to Claude (claude-sonnet-4-5, max_tokens=1500)\n- Asks Claude to summarize material differences clause by clause, and for each meaningful difference explain what changed and which version is more favorable to the receiving party\n- Returns the response text\n\n2) export.py with export_word(clauses, output="contract_review.docx") using python-docx that:\n- Creates a document with a title heading "Contract Clause Review"\n- For each clause type, adds a level-1 heading with the clause name\n- Adds a paragraph showing "Risk: " followed by the risk level in uppercase, formatted in red/yellow/green text color using run formatting\n- Adds a paragraph with the plain-English summary\n- Adds a paragraph with the exact extracted text\n- Saves the document to the output path\n\nThen write a small main.py that ties it together: read a contract, extract clauses, compute overall risk, check standard library deviations, and export to Word.',
              verify: 'Run main.py on a sample contract — it should produce contract_review.docx with color-coded risk levels per clause. Run compare_contracts() on two versions of a contract and confirm it produces a readable summary of what changed.',
            },
          ],
          goFurther: 'Build a simple Streamlit UI where someone can drag-and-drop a contract and get the Word review back as a download. 🛠️🛠️',
        },
      ],
      portfolio: 'Add this to your portfolio as "Contract Clause Extractor & Risk Scorer" — a great example for legal-tech or B2B SaaS roles. Show a before/after: a messy contract PDF in, a clean color-coded clause review out, with the comparison mode demonstrating how it catches differences between contract versions.',
      portfolioPrompt: 'Help me write a portfolio entry and a LinkedIn post for a project I just built: a Contract Clause Extractor. It reads PDF or DOCX contracts, uses Claude to extract 15 standard clause types (payment terms, termination, liability, IP, governing law, etc.) with exact quotes and plain-English summaries, assigns each a red/yellow/green risk rating, rolls those up into an overall contract risk score, flags deviations from a standard clause library, and can compare two contract versions to highlight material differences. Output exports to a formatted Word document. Write:\n1. A 3-4 sentence portfolio project description focused on the business impact (faster contract review, consistent risk flagging)\n2. A LinkedIn post (under 150 words) announcing the project, written for a legal-tech or B2B SaaS audience\n3. Two resume bullet points quantifying the time-saving potential',
    },
    steps: [
      {
        number: 1,
        title: 'Build the contract reader',
        description: 'Extract plain text from PDF or DOCX contracts depending on file extension.',
        code: `# reader.py
from PyPDF2 import PdfReader
from docx import Document

def read_contract(path):
    if path.lower().endswith(".pdf"):
        reader = PdfReader(path)
        return "\\n".join(page.extract_text() for page in reader.pages)
    elif path.lower().endswith(".docx"):
        doc = Document(path)
        return "\\n".join(p.text for p in doc.paragraphs)
    raise ValueError("Unsupported file type")`,
        tip: 'Contracts often have numbered sections — keep newlines intact so Claude can use them as structural cues.',
      },
      {
        number: 2,
        title: 'Define the clause taxonomy',
        description: 'List the 15 clause types you want extracted from every contract.',
        code: `# taxonomy.py
CLAUSE_TYPES = [
    "Payment Terms", "Termination", "Limitation of Liability", "Indemnification",
    "Intellectual Property Ownership", "Confidentiality", "Governing Law",
    "Dispute Resolution", "Auto-Renewal", "Assignment", "Warranties",
    "Force Majeure", "Non-Compete", "Data Protection", "Insurance Requirements",
]`,
        tip: 'Adjust this taxonomy per contract type — an NDA needs different clauses than a vendor services agreement.',
      },
      {
        number: 3,
        title: 'Build the Claude extractor',
        description: 'Send the full contract text and ask Claude to extract each clause with its exact text, a plain-English summary, and a risk rating.',
        code: `# extract.py
from anthropic import Anthropic
import json

ai = Anthropic()

def extract_clauses(contract_text, clause_types):
    prompt = f"""Contract text:
{contract_text[:12000]}

For each of these clause types, find the relevant text (or note "Not found"):
{clause_types}

For each, return: exact_text (verbatim quote or "Not found"), summary (plain English, 1 sentence),
risk (red/yellow/green based on how favorable/standard it is).

Return JSON: {{"clauses": {{"Payment Terms": {{"exact_text": "...", "summary": "...", "risk": "..."}}, ...}}}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=4000,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)`,
        tip: 'For very long contracts (50+ pages), split into halves and merge the JSON results — 12000 chars covers most SMB contracts.',
      },
      {
        number: 4,
        title: 'Build the risk scorer',
        description: 'Aggregate clause-level risk ratings into an overall contract risk score.',
        code: `# risk.py
def overall_risk(clauses):
    counts = {"red": 0, "yellow": 0, "green": 0}
    for c in clauses.values():
        counts[c["risk"]] = counts.get(c["risk"], 0) + 1
    if counts["red"] >= 2:
        return "High Risk"
    if counts["red"] == 1 or counts["yellow"] >= 4:
        return "Medium Risk"
    return "Low Risk"`,
        tip: 'Tune thresholds based on a sample of contracts your legal team has already reviewed manually.',
      },
      {
        number: 5,
        title: 'Build comparison mode',
        description: 'Extract clauses from two contracts and ask Claude to summarize the material differences.',
        code: `# compare.py
def compare_contracts(clauses_a, clauses_b):
    prompt = f"""Compare these two contracts' clauses and summarize material differences:

Contract A: {json.dumps(clauses_a)}
Contract B: {json.dumps(clauses_b)}

For each clause type with a meaningful difference, explain what changed and which is more favorable to the receiving party."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=1500,
        messages=[{"role": "user", "content": prompt}]).content[0].text`,
        tip: 'Comparison mode is great for redlines — run it on "our standard template" vs. "counterparty’s version".',
      },
      {
        number: 6,
        title: 'Build output formats',
        description: 'Export the extraction as JSON for APIs, and as a formatted Word document for lawyers.',
        code: `# export.py
from docx import Document as DocxDocument

def export_word(clauses, output="contract_review.docx"):
    doc = DocxDocument()
    doc.add_heading("Contract Clause Review", 0)
    for clause_type, data in clauses.items():
        doc.add_heading(clause_type, level=1)
        doc.add_paragraph(f"Risk: {data['risk'].upper()}")
        doc.add_paragraph(f"Summary: {data['summary']}")
        doc.add_paragraph(f"Text: {data['exact_text']}")
    doc.save(output)`,
        tip: 'Color-code the "Risk:" line text red/yellow/green using python-docx run formatting for quick visual scanning.',
      },
      {
        number: 7,
        title: 'Add a standard clause library',
        description: 'Store your organization’s preferred clause language and compare extracted clauses against it.',
        code: `# standard_library.py
STANDARD_CLAUSES = {
    "Limitation of Liability": "Liability shall not exceed fees paid in the preceding 12 months.",
    "Governing Law": "This agreement shall be governed by the laws of Delaware.",
}

def flag_deviations(clauses):
    deviations = {}
    for clause_type, standard in STANDARD_CLAUSES.items():
        actual = clauses.get(clause_type, {}).get("exact_text", "")
        if standard.split()[0:3] != actual.split()[0:3]:
            deviations[clause_type] = {"standard": standard, "actual": actual}
    return deviations`,
        tip: 'This simple word-prefix check is a starting heuristic — for production, ask Claude to assess semantic similarity instead.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Contract Clause Extractor (starter)
Run: pip install anthropic pypdf2 python-docx
"""
import json
from PyPDF2 import PdfReader
from anthropic import Anthropic

ai = Anthropic()
CLAUSE_TYPES = ["Payment Terms", "Termination", "Limitation of Liability",
                "Intellectual Property Ownership", "Governing Law"]

def extract_clauses(pdf_path):
    reader = PdfReader(pdf_path)
    text = "\\n".join(page.extract_text() for page in reader.pages)
    prompt = f"""Contract text:
{text[:12000]}

For each clause type, find the text, summarize in 1 sentence, and rate risk (red/yellow/green):
{CLAUSE_TYPES}

Return JSON: {{"clauses": {{"<type>": {{"exact_text": "...", "summary": "...", "risk": "..."}}}}}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=3000,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)

if __name__ == "__main__":
    print(json.dumps(extract_clauses("sample_contract.pdf"), indent=2))
`,
    resources: [
      { title: 'python-docx Documentation', url: 'https://python-docx.readthedocs.io' },
      { title: 'PyPDF2 Documentation', url: 'https://pypdf2.readthedocs.io' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 24,
    title: 'Product Recommendation Engine',
    emoji: '🎯',
    department: ['Sales', 'Marketing'],
    departmentIds: ['sales', 'marketing'],
    difficulty: 'Intermediate',
    description:
      'Give it customer purchase history — the agent generates personalized product recommendations with reasoning for each segment.',
    whatYouBuild:
      'A recommendation pipeline that loads customer purchase history, segments customers by behavior using pandas, loads your product catalog, and asks Claude to generate the top 5 personalized recommendations per customer with reasoning and a confidence score — output in a format ready to push into HubSpot or Salesforce as contact notes.',
    whatYouLearn: [
      'Load and explore customer purchase history with pandas',
      'Segment customers using simple clustering heuristics',
      'Build a product catalog data structure',
      'Generate ranked recommendations with confidence scores via Claude',
      'Run overnight batch recommendation jobs',
      'Push recommendations into a CRM as notes',
    ],
    techStack: ['Python', 'Claude API', 'pandas'],
    buildTime: '4 hrs',
    xp: 480,
    popularity: 74,
    prerequisites: ['Basic Python', 'pandas basics', 'Sample customer + product CSVs'],
    tags: ['sales', 'marketing', 'recommendations', 'personalization'],
    session: {
      totalTime: '110 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'A pipeline that loads customer purchase history and segments customers by size and engagement',
        'A Claude-powered recommender that ranks the top 5 products per customer with confidence scores and reasons',
        'A confidence filter and overnight batch processor that writes recommendations.csv for your whole customer base',
        'A CRM push that adds the top recommendation as a note on each contact, plus an A/B tracker for measuring lift',
      ],
      whatYouNeed: [
        'Python installed locally',
        'An Anthropic API key (console.anthropic.com)',
        'pip install anthropic pandas',
        'A customers.csv (customer_id, past_purchases, industry, company_size) and a catalog.json of products',
        'Optional: a HubSpot account with a private app token for the CRM push',
      ],
      builds: [
        {
          number: 1,
          title: 'Load customer data and build segments',
          time: '25 min',
          description: 'Read customer purchase history and group customers into simple, explainable segments.',
          steps: [
            {
              instruction: 'Ask Claude to build load.py to read your customer CSV, and segment.py to bucket customers by company size and engagement level.',
              prompt: 'Write two Python files for a recommendation pipeline using pandas.\n\n1) load.py with load_customers(path="customers.csv") that:\n- Reads the CSV into a DataFrame\n- The past_purchases column is a comma-separated string of SKUs — fill missing values with empty string and split into a list\n- Returns the DataFrame\n\n2) segment.py with segment_customers(df) that:\n- Adds a size_segment column: "SMB" if company_size < 50, "Mid-Market" if < 500, else "Enterprise"\n- Adds an engagement_segment column based on len(past_purchases): "New" if <= 1, "Active" if <= 4, else "Power User"\n- Returns the updated DataFrame\n\nAdd a comment noting that if purchase history lives in a separate orders table, it should be pivoted into a comma-separated SKU list per customer first.',
              verify: 'Run load_customers() then segment_customers() on your CSV — print df[["customer_id", "size_segment", "engagement_segment"]] and confirm every customer has a sensible segment.',
            },
          ],
          goFurther: 'If you have thousands of customers, try k-means clustering on purchase frequency and order value instead of rule-based buckets. 🛠️🛠️',
        },
        {
          number: 2,
          title: 'Build the product catalog and Claude recommender',
          time: '30 min',
          description: 'Load your product catalog and ask Claude to recommend the top 5 products per customer with confidence scores.',
          steps: [
            {
              instruction: 'Ask Claude to build catalog.py to load product data, and recommend.py with a recommend_for_customer function.',
              prompt: 'Write two Python files for a recommendation pipeline.\n\n1) catalog.py with load_catalog(path="catalog.json") that loads a JSON list of products, where each product has sku, name, description, and price_tier. Include a sample catalog.json with 6-8 example products as a comment.\n\n2) recommend.py using the anthropic Python SDK with recommend_for_customer(customer, catalog) that:\n- Builds a prompt describing the customer\'s industry, size_segment, past_purchases, and engagement_segment\n- Includes the full product catalog as JSON in the prompt\n- Asks Claude to recommend the top 5 products this customer is most likely to buy next, EXCLUDING products they already own\n- For each recommendation, asks for a confidence score (1-10) and a one-sentence reason\n- Calls claude-sonnet-4-5 with max_tokens=600\n- Requests JSON: {"recommendations": [{"sku": "...", "confidence": 0, "reason": "..."}]}\n- Parses and returns the recommendations list\n\nMake the "excluding products they already own" instruction explicit — without it Claude sometimes recommends existing purchases.',
              verify: 'Run recommend_for_customer() on one customer row — you should get back 5 recommendations, none matching SKUs already in past_purchases, each with a confidence score and reason.',
            },
          ],
          goFurther: 'Add a second pass that explains, in one paragraph, the overall theme of this customer\'s recommendations (e.g. "upsell toward analytics tier"). 🛠️',
        },
        {
          number: 3,
          title: 'Filter by confidence and run an overnight batch',
          time: '25 min',
          description: 'Drop low-confidence suggestions and process your entire customer list into a single CSV.',
          steps: [
            {
              instruction: 'Ask Claude to build filter.py and batch.py to process all customers and write recommendations.csv.',
              prompt: 'Write two Python files for a recommendation pipeline.\n\n1) filter.py with filter_recommendations(recs, min_confidence=6) that returns only recommendations with confidence >= min_confidence.\n\n2) batch.py with run_batch(customers_df, catalog) that:\n- Loops over every row in customers_df\n- Calls recommend_for_customer() for each customer\n- Filters the results with filter_recommendations()\n- Builds a list of rows, each combining customer_id with the recommendation fields (sku, confidence, reason)\n- Writes the combined rows to recommendations.csv using pandas, without an index\n\nAdd a comment: if a customer ends up with zero recommendations above the threshold, fall back to that segment\'s best-selling products. Also note that for thousands of customers, the Anthropic Message Batches API can cut cost roughly in half.',
              verify: 'Run run_batch() on your full customer DataFrame — recommendations.csv should be created with one row per (customer_id, recommended sku), and every confidence score should be >= 6.',
            },
          ],
          goFurther: 'Implement the best-seller fallback: precompute the top 3 SKUs per size_segment from past_purchases and use them when a customer has zero qualifying recommendations. 🛠️🛠️',
        },
        {
          number: 4,
          title: 'Push to CRM and add an A/B tracker',
          time: '30 min',
          description: 'Write the top recommendation to each customer\'s CRM record, and tag batches so you can measure conversion lift later.',
          steps: [
            {
              instruction: 'Ask Claude to build crm_push.py for HubSpot notes and ab_test.py for campaign tagging.',
              prompt: 'Write two Python files for a recommendation pipeline.\n\n1) crm_push.py using the hubspot-api-client with push_recommendation_note(token, contact_id, recommendation) that:\n- Creates a HubSpot note via the CRM notes API\n- The note body should read like "AI Recommendation: {sku} (confidence {confidence}/10) — {reason}"\n- Associates the note with the given contact_id\n\nAdd a comment that the HubSpot association type ID for "note to contact" should be confirmed in their API docs for your account.\n\n2) ab_test.py with tag_recommendations(rows, campaign_id=None) that:\n- Generates a short random campaign_id if none is given (e.g. first 8 chars of a uuid4)\n- Adds a campaign_id column to every row\n- Returns the tagged rows\n\nAdd a comment explaining that recommendations.csv can later be joined with an orders.csv on customer_id + sku + date to compute conversion rate for recommended vs. non-recommended purchases.',
              verify: 'Run push_recommendation_note() for one test contact and confirm the note appears on their HubSpot timeline. Run tag_recommendations() on your batch rows and confirm every row has the same campaign_id.',
            },
          ],
          goFurther: 'After 30 days, join recommendations.csv against your orders data and compute a simple before/after conversion rate for recommended vs. non-recommended SKUs. 🛠️🛠️',
        },
      ],
      portfolio: 'Add this to your portfolio as "AI Product Recommendation Engine" — a strong piece for sales ops, RevOps, or marketing tech roles. Show the segment breakdown, a sample customer\'s top-5 recommendations with reasoning, and the CRM note it generates.',
      portfolioPrompt: 'Help me write a portfolio entry and a LinkedIn post for a project I just built: an AI Product Recommendation Engine. It loads customer purchase history, segments customers by company size and engagement level, loads a product catalog, and uses Claude to generate the top 5 personalized product recommendations per customer — each with a confidence score and a plain-English reason, excluding products they already own. It filters out low-confidence suggestions, batch-processes the entire customer base into a CSV, pushes the top recommendation as a note into HubSpot contact records, and tags each batch with a campaign ID for A/B conversion tracking. Write:\n1. A 3-4 sentence portfolio project description focused on the revenue/conversion angle\n2. A LinkedIn post (under 150 words) for a sales ops / RevOps audience\n3. Two resume bullet points that quantify potential upsell impact',
    },
    steps: [
      {
        number: 1,
        title: 'Load customer data',
        description: 'Read a CSV containing customer_id, past_purchases (comma-separated SKUs), industry, and company_size.',
        code: `# load.py
import pandas as pd

def load_customers(path="customers.csv"):
    df = pd.read_csv(path)
    df["past_purchases"] = df["past_purchases"].fillna("").apply(lambda s: s.split(","))
    return df`,
        tip: 'If purchase history lives in a separate orders table, pivot it into a comma-separated SKU list per customer first.',
      },
      {
        number: 2,
        title: 'Build the customer segmenter',
        description: 'Group customers into simple segments by company size and number of past purchases.',
        code: `# segment.py
def segment_customers(df):
    def size_bucket(size):
        if size < 50: return "SMB"
        if size < 500: return "Mid-Market"
        return "Enterprise"

    df["size_segment"] = df["company_size"].apply(size_bucket)
    df["engagement_segment"] = df["past_purchases"].apply(
        lambda p: "New" if len(p) <= 1 else "Active" if len(p) <= 4 else "Power User"
    )
    return df`,
        tip: 'Start with simple rule-based segments — clustering algorithms (k-means) are overkill until you have thousands of customers.',
      },
      {
        number: 3,
        title: 'Build the product catalog loader',
        description: 'Load product SKUs with descriptions, key features, and price tiers.',
        code: `# catalog.py
import json

def load_catalog(path="catalog.json"):
    return json.load(open(path))

# catalog.json example
# [{"sku": "PRO-1", "name": "Analytics Pro", "description": "Advanced reporting and dashboards", "price_tier": "mid"}]`,
        tip: 'Keep descriptions concise (1-2 sentences) — you will pass the entire catalog into the prompt for every customer.',
      },
      {
        number: 4,
        title: 'Build the Claude recommender',
        description: 'For each customer, send their profile and the catalog to Claude and request the top 5 recommendations with reasoning.',
        code: `# recommend.py
from anthropic import Anthropic
import json

ai = Anthropic()

def recommend_for_customer(customer, catalog):
    prompt = f"""Customer profile:
Industry: {customer['industry']}, Size segment: {customer['size_segment']},
Past purchases: {customer['past_purchases']}, Engagement: {customer['engagement_segment']}

Product catalog: {json.dumps(catalog)}

Recommend the top 5 products this customer is most likely to buy next, excluding ones they already own.
For each, give a confidence score (1-10) and a one-sentence reason.

Return JSON: {{"recommendations": [{{"sku": "...", "confidence": 0, "reason": "..."}}]}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=600,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)["recommendations"]`,
        tip: 'Explicitly say "excluding ones they already own" — without it Claude will sometimes recommend existing purchases.',
      },
      {
        number: 5,
        title: 'Add confidence-based filtering',
        description: 'Only surface recommendations with confidence ≥ 6 to avoid noisy, low-quality suggestions.',
        code: `# filter.py
def filter_recommendations(recs, min_confidence=6):
    return [r for r in recs if r["confidence"] >= min_confidence]`,
        tip: 'If a customer has zero recommendations above the threshold, fall back to your best-selling products for their segment.',
      },
      {
        number: 6,
        title: 'Build the batch processor',
        description: 'Run recommendations for every customer overnight and save results to a CSV.',
        code: `# batch.py
def run_batch(customers_df, catalog):
    rows = []
    for _, customer in customers_df.iterrows():
        recs = recommend_for_customer(customer.to_dict(), catalog)
        for r in filter_recommendations(recs):
            rows.append({"customer_id": customer["customer_id"], **r})
    pd.DataFrame(rows).to_csv("recommendations.csv", index=False)`,
        tip: 'For thousands of customers, batch with the Anthropic Message Batches API to cut cost roughly in half.',
      },
      {
        number: 7,
        title: 'Export for CRM',
        description: 'Push the top recommendation per customer as a note on their HubSpot contact record.',
        code: `# crm_push.py
from hubspot import HubSpot

def push_recommendation_note(token, contact_id, recommendation):
    client = HubSpot(access_token=token)
    client.crm.objects.notes.basic_api.create(
        simple_public_object_input_for_create={
            "properties": {
                "hs_note_body": f"AI Recommendation: {recommendation['sku']} "
                                 f"(confidence {recommendation['confidence']}/10) — {recommendation['reason']}",
                "hs_timestamp": "now",
            },
            "associations": [{"to": {"id": contact_id}, "types": [{"associationCategory": "HUBSPOT_DEFINED",
                              "associationTypeId": 202}]}],
        }
    )`,
        tip: 'associationTypeId 202 links a note to a contact — confirm the correct ID for your HubSpot account in their API docs.',
      },
      {
        number: 8,
        title: 'Build an A/B test tracker',
        description: 'Tag recommended SKUs with a campaign ID and later join against sales data to measure conversion lift.',
        code: `# ab_test.py
import uuid

def tag_recommendations(rows, campaign_id=None):
    campaign_id = campaign_id or str(uuid.uuid4())[:8]
    for row in rows:
        row["campaign_id"] = campaign_id
    return rows

# Later: join recommendations.csv with orders.csv on customer_id + sku + date
# to compute conversion rate for recommended vs. non-recommended purchases`,
        tip: 'Even a simple before/after conversion comparison over 30 days gives you a strong signal on recommendation quality.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Product Recommendation Engine (starter)
Run: pip install anthropic pandas
"""
import json
import pandas as pd
from anthropic import Anthropic

ai = Anthropic()

def recommend(customer, catalog):
    prompt = f"""Customer: industry={customer['industry']}, past purchases={customer['past_purchases']}.
Catalog: {json.dumps(catalog)}

Recommend top 5 products (excluding owned), with confidence (1-10) and reason.
Return JSON: {{"recommendations": [{{"sku": "...", "confidence": 0, "reason": "..."}}]}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=500,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)["recommendations"]

if __name__ == "__main__":
    catalog = [{"sku": "PRO-1", "name": "Analytics Pro", "description": "Advanced dashboards"}]
    customer = {"industry": "Retail", "past_purchases": ["BASIC-1"]}
    print(recommend(customer, catalog))
`,
    resources: [
      { title: 'pandas Documentation', url: 'https://pandas.pydata.org/docs/' },
      { title: 'HubSpot Notes API', url: 'https://developers.hubspot.com/docs/api/crm/notes' },
      { title: 'Anthropic Message Batches', url: 'https://docs.anthropic.com/en/docs/build-with-claude/batch-processing' },
    ],
  },
  {
    id: 25,
    title: 'Sales Email Personalization Agent',
    emoji: '✉️',
    department: ['Sales'],
    departmentIds: ['sales'],
    difficulty: 'Intermediate',
    description:
      'Input a prospect’s name and company — the agent researches them online, identifies pain points, and writes a highly personalized cold email.',
    whatYouBuild:
      'A prospecting tool that researches a target prospect’s LinkedIn profile and company news, finds a verified email via Hunter.io, asks Claude to map likely pain points to your value propositions, writes a personalized cold email referencing a specific detail, generates 5 ranked subject line options, and drafts a 3-touch follow-up sequence.',
    whatYouLearn: [
      'Enrich prospect data from public web sources',
      'Find and verify email addresses with Hunter.io',
      'Map prospect context to value propositions with Claude',
      'Write personalized openers that reference specific details',
      'Generate and rank subject line variants',
      'Build multi-touch follow-up sequences',
    ],
    techStack: ['Python', 'Hunter.io', 'LinkedIn Scraper', 'Claude API'],
    buildTime: '4 hrs',
    xp: 520,
    popularity: 86,
    prerequisites: ['Completed Web Research Agent', 'Hunter.io API key (free tier)'],
    tags: ['sales', 'outreach', 'personalization', 'cold email'],
    session: {
      totalTime: '120 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'A prospect research tool that gathers LinkedIn and company news context and finds verified emails via Hunter.io',
        'A Claude-powered intelligence extractor that maps prospects to your value props',
        'A cold email writer with a personalized opener and 5 ranked subject line options',
        'A 3-touch follow-up sequence and a CRM export ready for your sequencing tool',
      ],
      whatYouNeed: [
        'Python installed locally',
        'An Anthropic API key (console.anthropic.com)',
        'A Tavily API key (free tier at tavily.com) and a Hunter.io API key (free tier)',
        'pip install anthropic tavily-python requests',
        'A VALUE_PROPS file describing your product\'s key selling points',
      ],
      builds: [
        {
          number: 1,
          title: 'Research the prospect and find a verified email',
          time: '30 min',
          description: 'Gather public context on the prospect and their company, then find a verified email address.',
          steps: [
            {
              instruction: 'Ask Claude to build enrich.py to search for prospect and company context with Tavily, and hunter.py to find and verify an email with Hunter.io.',
              prompt: 'Write two Python files for a sales prospecting tool.\n\n1) enrich.py using tavily-python with enrich_prospect(name, company) that:\n- Searches for "{name} {company} LinkedIn" and returns the top 3 results as the profile\n- Searches for "{company} news 2025" and returns the top 3 results as company_news\n- Returns {"profile": [...], "news": [...]}\n\nAdd a comment that searching for the LinkedIn profile via a general search (rather than scraping LinkedIn directly) avoids LinkedIn\'s anti-scraping measures.\n\n2) hunter.py using requests with find_email(first_name, last_name, domain, api_key) that:\n- Calls Hunter.io\'s Email Finder API (https://api.hunter.io/v2/email-finder) with the domain, first_name, last_name, and api_key\n- Returns {"email": ..., "confidence": ...} from the response data\n\nAdd a comment that prospects with confidence below 50 should be skipped, since sending to unverified addresses hurts sender reputation.',
              verify: 'Run enrich_prospect() on a real name + company — confirm you get back profile and news results. Run find_email() with a known domain and confirm it returns an email and a confidence score.',
            },
          ],
          goFurther: 'Cache enrichment results per company for 7 days so you don\'t re-search the same company for every contact there. 🛠️',
        },
        {
          number: 2,
          title: 'Extract intelligence and map to value props',
          time: '30 min',
          description: 'Have Claude turn raw research into a structured profile, then match their challenges to what you sell.',
          steps: [
            {
              instruction: 'Ask Claude to build intelligence.py with an extract_intelligence function, and mapping.py with a VALUE_PROPS dict and map_value_props function.',
              prompt: 'Write two Python files for a sales prospecting tool.\n\n1) intelligence.py using the anthropic Python SDK with extract_intelligence(name, company, enriched) that:\n- Sends the prospect\'s name, company, profile search results, and company news to Claude\n- Asks Claude to extract: likely role/title, key responsibilities, 2-3 likely current business challenges, and one recent notable event about the company for personalization\n- Calls claude-sonnet-4-5 with max_tokens=500\n- Requests JSON: {"role": "...", "responsibilities": "...", "challenges": ["...", "..."], "recent_event": "..."}\n- Parses and returns the JSON\n\nAdd a comment that the recent_event field is the best raw material for a personalized opening line.\n\n2) mapping.py with:\n- A VALUE_PROPS dict mapping challenge keywords to value propositions, e.g. {"manual reporting": "Our platform auto-generates reports, saving 5+ hours/week", "scaling support": "Our AI agents handle tier-1 tickets so your team focuses on complex cases", "slow onboarding": "Our guided setup gets new customers live in under a day"}\n- A map_value_props(challenges) function that checks each challenge string for any VALUE_PROPS keyword (case-insensitive) and returns matching value props, falling back to the first value prop if nothing matches\n\nAdd a comment that VALUE_PROPS should be a shared file the whole sales team edits to keep messaging consistent.',
              verify: 'Run extract_intelligence() on enriched data — confirm it returns role, responsibilities, 2-3 challenges, and a recent_event. Run map_value_props() with those challenges and confirm it returns at least one matching value prop.',
            },
          ],
          goFurther: 'Add a second VALUE_PROPS tier for different personas (e.g. "for CFOs" vs "for VP Engineering") and pick the tier based on the extracted role. 🛠️🛠️',
        },
        {
          number: 3,
          title: 'Write the cold email and generate subject lines',
          time: '30 min',
          description: 'Draft a short, personalized email with a clear CTA, then generate and rank subject line options.',
          steps: [
            {
              instruction: 'Ask Claude to build write_email.py with a write_cold_email function, and subjects.py with a generate_subject_lines function.',
              prompt: 'Write two Python files for a sales prospecting tool using the anthropic Python SDK.\n\n1) write_email.py with write_cold_email(name, company, intel, value_prop) that:\n- Builds a prompt asking Claude to write a cold email to {name} at {company}\n- The opener should reference the specific recent_event from intel\n- Mention their likely challenge (intel["challenges"][0]) and our value_prop\n- Keep the email under 100 words, end with one low-friction CTA (e.g. "Worth a quick chat?")\n- Explicitly ban generic openers like "I hope this finds you well" and instruct no subject line in the body\n- Calls claude-sonnet-4-5 with max_tokens=300, returns the email text\n\n2) subjects.py with generate_subject_lines(email_body) that:\n- Sends the email body to Claude and asks for 5 subject line options, each under 50 characters\n- Asks Claude to rank them 1-5 by predicted open rate with a one-phrase reason for each ranking\n- Calls claude-sonnet-4-5 with max_tokens=300\n- Requests JSON: {"subjects": [{"text": "...", "rank": 1, "reason": "..."}]}\n- Parses and returns the subjects list\n\nAdd a comment that banning filler phrases like "I hope this finds you well" measurably improves reply rates, and that subject lines referencing the recipient\'s company name by name tend to outperform generic ones.',
              verify: 'Run write_cold_email() and confirm the output is under 100 words, references the recent_event, and ends with a CTA — with no banned filler phrases. Run generate_subject_lines() and confirm you get 5 ranked options under 50 characters each.',
            },
          ],
          goFurther: 'A/B test two different value props for the same prospect type and track which gets more replies over 2 weeks. 🛠️🛠️',
        },
        {
          number: 4,
          title: 'Build the follow-up sequence and CRM export',
          time: '30 min',
          description: 'Generate a 3-touch follow-up sequence for no-reply prospects and push everything into your outreach tool.',
          steps: [
            {
              instruction: 'Ask Claude to build sequence.py with a build_followup_sequence function, and crm_export.py to push the sequence into HubSpot or Outreach.io.',
              prompt: 'Write two Python files for a sales prospecting tool.\n\n1) sequence.py using the anthropic Python SDK with build_followup_sequence(first_email, intel) that:\n- Sends the original email and the prospect\'s challenges to Claude\n- Asks for a 3-email follow-up sequence for days 3, 7, and 14, each under 60 words\n- Touch 1 (day 3) = gentle bump, Touch 2 (day 7) = new angle with a different value prop or case study, Touch 3 (day 14) = breakup email\n- Calls claude-sonnet-4-5 with max_tokens=600\n- Requests JSON: {"followups": [{"day": 3, "text": "..."}, {"day": 7, "text": "..."}, {"day": 14, "text": "..."}]}\n- Parses and returns the followups list\n\nAdd a comment that the breakup email (touch 3) often gets the highest reply rate because it creates a sense of finality.\n\n2) crm_export.py using requests with create_outreach_sequence(api_key, prospect_email, steps) that:\n- Takes the first email plus the 3 follow-ups as a list of steps\n- Sends a request to create a sequence/cadence in your CRM (write it as a clearly-marked adaptable template since the exact API shape depends on whether you use HubSpot sequences or Outreach.io campaigns)\n- Include comments showing where the prospect_email, step text, and send-day offsets go in the request body\n\nThen write a small main.py that chains all builds together: enrich -> find email -> extract intelligence -> map value props -> write email -> generate subjects -> build follow-ups -> export.',
              verify: 'Run build_followup_sequence() and confirm you get 3 follow-ups for days 3, 7, and 14, each under 60 words. Run main.py end-to-end on one test prospect and confirm it produces a complete email + subject lines + sequence.',
            },
          ],
          goFurther: 'Add a "reply detected" webhook that pauses the follow-up sequence automatically if the prospect responds to the first email. 🛠️🛠️',
        },
      ],
      portfolio: 'Add this to your portfolio as "AI Sales Prospecting & Personalization Agent" — a strong demo for SDR, BDR, or growth roles. Show a real (anonymized) example: the raw research, the extracted intelligence, and the final personalized email + sequence it produced.',
      portfolioPrompt: 'Help me write a portfolio entry and a LinkedIn post for a project I just built: an AI Sales Email Personalization Agent. Given just a prospect\'s name and company, it researches their LinkedIn presence and recent company news, finds a verified email via Hunter.io, uses Claude to extract their likely role and business challenges, maps those challenges to relevant value propositions, writes a personalized cold email referencing a specific recent event (with banned generic filler phrases), generates 5 ranked subject line options, and builds a 3-touch follow-up sequence for non-responders. Write:\n1. A 3-4 sentence portfolio project description focused on personalization at scale\n2. A LinkedIn post (under 150 words) for an SDR/BDR or sales leadership audience\n3. Two resume bullet points quantifying time saved per prospect and potential reply-rate improvement',
    },
    steps: [
      {
        number: 1,
        title: 'Build the prospect enricher',
        description: 'Use Tavily or a scraper to gather the prospect’s LinkedIn headline, company website content, and recent company news.',
        code: `# enrich.py
from tavily import TavilyClient
tavily = TavilyClient(api_key="...")

def enrich_prospect(name, company):
    profile = tavily.search(query=f"{name} {company} LinkedIn", max_results=3)["results"]
    company_news = tavily.search(query=f"{company} news 2025", max_results=3)["results"]
    return {"profile": profile, "news": company_news}`,
        tip: 'Search "{name} {company} LinkedIn" rather than scraping LinkedIn directly — LinkedIn aggressively blocks scrapers.',
      },
      {
        number: 2,
        title: 'Get a verified email with Hunter.io',
        description: 'Use Hunter.io’s Email Finder API to get a verified email address for the prospect.',
        code: `# hunter.py
import requests

def find_email(first_name, last_name, domain, api_key):
    resp = requests.get("https://api.hunter.io/v2/email-finder", params={
        "domain": domain, "first_name": first_name, "last_name": last_name, "api_key": api_key,
    })
    data = resp.json()["data"]
    return {"email": data.get("email"), "confidence": data.get("score")}`,
        tip: 'Skip prospects with confidence below 50 — sending to unverified addresses hurts your domain’s sender reputation.',
      },
      {
        number: 3,
        title: 'Build the intelligence extractor',
        description: 'Ask Claude to extract role, responsibilities, and likely company challenges from the enriched data.',
        code: `# intelligence.py
from anthropic import Anthropic
import json

ai = Anthropic()

def extract_intelligence(name, company, enriched):
    prompt = f"""Prospect: {name} at {company}
Profile search results: {enriched['profile']}
Company news: {enriched['news']}

Extract: likely role/title, key responsibilities, 2-3 likely current business challenges,
and one recent notable event about the company (for personalization).

Return JSON: {{"role": "...", "responsibilities": "...", "challenges": ["...","..."], "recent_event": "..."}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=500,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)`,
        tip: 'The "recent_event" field is your best raw material for a personalized opening line — prioritize it.',
      },
      {
        number: 4,
        title: 'Build the pain point mapper',
        description: 'Match the prospect’s likely challenges to your product’s value propositions.',
        code: `# mapping.py
VALUE_PROPS = {
    "manual reporting": "Our platform auto-generates reports, saving 5+ hours/week",
    "scaling support": "Our AI agents handle tier-1 tickets so your team focuses on complex cases",
    "slow onboarding": "Our guided setup gets new customers live in under a day",
}

def map_value_props(challenges):
    matched = []
    for challenge in challenges:
        for key, prop in VALUE_PROPS.items():
            if key in challenge.lower():
                matched.append(prop)
    return matched or list(VALUE_PROPS.values())[:1]`,
        tip: 'Maintain VALUE_PROPS as a shared file your whole sales team edits — it keeps messaging consistent across reps.',
      },
      {
        number: 5,
        title: 'Build the email writer',
        description: 'Write a personalized cold email: opener referencing the recent event, value prop, and a single clear CTA.',
        code: `# write_email.py
def write_cold_email(name, company, intel, value_prop):
    prompt = f"""Write a cold email to {name} at {company}.

Open with a specific reference to: "{intel['recent_event']}"
Their likely challenge: {intel['challenges'][0]}
Our value prop: {value_prop}

Keep it under 100 words. End with a single, low-friction CTA (e.g. "Worth a quick chat?").
No subject line, no generic greetings like "I hope this finds you well"."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=300,
        messages=[{"role": "user", "content": prompt}]).content[0].text`,
        tip: 'Banning "I hope this finds you well" and similar filler phrases in the prompt measurably improves reply rates.',
      },
      {
        number: 6,
        title: 'Add a subject line generator',
        description: 'Generate 5 subject line variants and rank them by predicted open rate.',
        code: `# subjects.py
def generate_subject_lines(email_body):
    prompt = f"""Email body: {email_body}

Write 5 subject line options (under 50 characters each). Rank them 1-5 by predicted open rate
with a one-phrase reason for the ranking.
Return JSON: {{"subjects": [{{"text": "...", "rank": 1, "reason": "..."}}]}}"""
    import json
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=300,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)["subjects"]`,
        tip: 'Subject lines that reference the recipient’s company name by name tend to outperform generic ones.',
      },
      {
        number: 7,
        title: 'Build the follow-up sequence',
        description: 'Generate a 3-touch follow-up sequence for if the first email gets no reply.',
        code: `# sequence.py
def build_followup_sequence(first_email, intel):
    prompt = f"""Original email: {first_email}
Prospect challenges: {intel['challenges']}

Write a 3-email follow-up sequence (days 3, 7, 14) for no reply. Each under 60 words.
Touch 1: gentle bump. Touch 2: new angle (different value prop or case study). Touch 3: breakup email.
Return JSON: {{"followups": [{{"day": 3, "text": "..."}}, ...]}}"""
    import json
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=600,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)["followups"]`,
        tip: 'The "breakup email" (touch 3) often gets the highest reply rate — it creates a sense of finality.',
      },
      {
        number: 8,
        title: 'Export to CRM sequence',
        description: 'Push the email and follow-ups into a HubSpot sequence or Outreach.io campaign.',
        code: `# crm_export.py
import requests

def create_outreach_sequence(api_key, prospect_email, steps):
    # Pseudocode — adapt to your CRM's sequence/cadence API
    requests.post("https://api.outreach.io/api/v2/sequences", headers={"Authorization": f"Bearer {api_key}"},
        json={"data": {"type": "sequence", "attributes": {"name": f"AI Outreach - {prospect_email}", "steps": steps}}})`,
        tip: 'Always insert AI-generated sequences as drafts in your CRM for rep review before they go live.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Sales Email Personalization Agent (starter)
Run: pip install anthropic requests tavily-python
"""
import json
from tavily import TavilyClient
from anthropic import Anthropic

tavily = TavilyClient(api_key="YOUR_TAVILY_KEY")
ai = Anthropic()

def research_and_write(name, company):
    news = tavily.search(query=f"{company} news 2025", max_results=3)["results"]
    snippets = "\\n".join(r["content"][:200] for r in news)
    prompt = f"""Prospect: {name} at {company}
Recent news: {snippets}

Write a personalized cold email under 100 words referencing one specific detail above.
End with one CTA. No generic greetings."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=300,
        messages=[{"role": "user", "content": prompt}]).content[0].text

if __name__ == "__main__":
    print(research_and_write("Jordan Lee", "Acme Robotics"))
`,
    resources: [
      { title: 'Hunter.io API Docs', url: 'https://hunter.io/api-documentation' },
      { title: 'Tavily API Docs', url: 'https://docs.tavily.com' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
];
