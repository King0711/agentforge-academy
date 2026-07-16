// World Class tier agents (ids 37-44)
export const agentsWorldClass = [
  {
    id: 37,
    title: 'Autonomous Equity Research Agent',
    emoji: '📡',
    department: ['Finance', 'Strategy'],
    departmentIds: ['finance', 'strategy'],
    difficulty: 'World Class',
    description:
      'Pulls SEC filings, earnings call transcripts, and market data for any public company, then produces a full equity research report with a thesis, risks, and a valuation model.',
    whatYouBuild:
      'A research agent that fetches a company’s 10-K/10-Q filings from SEC EDGAR, scrapes recent earnings call transcripts and news, extracts key financials into a structured model, builds a discounted cash flow valuation, and orchestrates a panel of Claude "analyst personas" (bull, bear, and neutral) to debate the investment thesis before producing a final report with a recommendation and confidence level.',
    whatYouLearn: [
      'Pull and parse SEC EDGAR filings programmatically',
      'Extract structured financials from unstructured filing text',
      'Build a basic discounted cash flow (DCF) valuation model',
      'Orchestrate multiple Claude "persona" agents that debate a thesis',
      'Synthesize multi-perspective debate into a single recommendation',
      'Produce institutional-quality research report formatting',
    ],
    techStack: ['Python', 'SEC API', 'Claude API', 'pandas', 'CrewAI'],
    buildTime: '9 hrs',
    xp: 1200,
    popularity: 88,
    prerequisites: ['Completed Financial Reporting Agent', 'Completed AI Sales Forecasting Agent', 'Basic finance/valuation knowledge'],
    tags: ['finance', 'research', 'valuation', 'multi-agent'],
    session: {
      totalTime: '210 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'A pipeline that pulls SEC EDGAR filings and structured XBRL financials for any public company',
        'A DCF valuation model with a sensitivity table across growth/discount rate assumptions',
        'A panel of bull, bear, and neutral Claude analyst personas that debate the same data',
        'A complete, formatted equity research report with recommendation, confidence, and disclaimer',
      ],
      whatYouNeed: [
        'Python installed locally',
        'An Anthropic API key (console.anthropic.com)',
        'pip install requests anthropic pandas tavily-python',
        'A Tavily API key for news/transcript search, basic familiarity with DCF valuation concepts',
      ],
      builds: [
        {
          number: 1,
          title: 'Pull SEC filings and structured financials',
          time: '50 min',
          description: 'Fetch a company\'s recent filings and extract revenue, net income, and cash flow from XBRL data.',
          steps: [
            {
              instruction: 'Ask Claude to write edgar.py with a get_filings function, and financials.py with get_company_facts and extract_latest functions.',
              prompt: 'Write two Python files for an equity research agent using requests.\n\n1) edgar.py with HEADERS = {"User-Agent": "AgentForge Research support@yourcompany.com"} and get_filings(cik, form_type="10-K", count=1) that:\n- Zero-pads the CIK to 10 digits\n- GETs https://data.sec.gov/submissions/CIK{cik_padded}.json with HEADERS\n- Finds the indices of filings["filings"]["recent"]["form"] matching form_type, up to count\n- Returns a list of {"accessionNumber": ..., "filingDate": ...} for those indices\n\nAdd a comment that SEC EDGAR requires a descriptive User-Agent header with a contact email — requests without one are blocked.\n\n2) financials.py with get_company_facts(cik) that GETs https://data.sec.gov/api/xbrl/companyfacts/CIK{cik_padded}.json with HEADERS, and returns a dict with "revenue" (from Revenues or RevenueFromContractWithCustomerExcludingAssessedTax), "net_income" (from NetIncomeLoss), and "operating_cash_flow" (from NetCashProvidedByUsedInOperatingActivities), each computed via extract_latest(fact). Define extract_latest(fact) which returns None if fact is missing, otherwise filters fact["units"]["USD"] to entries where form == "10-K", sorts by "end" date, and returns the most recent "val".\n\nAdd a comment that XBRL tag names vary by company and over time, so missing tags must be handled with .get() and fallbacks.',
              verify: 'Run get_filings(320193) (Apple\'s CIK) and confirm it returns recent 10-K filing metadata. Run get_company_facts(320193) and confirm revenue, net_income, and operating_cash_flow are all populated with reasonable numbers.',
            },
          ],
          goFurther: 'Add a get_filings variant that also pulls 10-Q filings and computes trailing-twelve-month (TTM) revenue by combining the latest 10-K with subsequent quarters. 🛠️🛠️',
        },
        {
          number: 2,
          title: 'Gather qualitative context and build the DCF model',
          time: '50 min',
          description: 'Pull recent news and earnings call context, then build a discounted cash flow valuation with a sensitivity table.',
          steps: [
            {
              instruction: 'Ask Claude to write context.py with get_qualitative_context, dcf.py with simple_dcf, and sensitivity.py with sensitivity_table.',
              prompt: 'Write three Python files for an equity research agent.\n\n1) context.py using tavily-python with get_qualitative_context(ticker, company_name) that runs two Tavily searches: one for "{company_name} {ticker} earnings call transcript latest quarter" (max_results=2) and one for "{company_name} {ticker} news analysis" (max_results=5), and returns {"transcript": ..., "news": ...} with the results lists.\n\nAdd a comment that earnings call transcripts behind paywalls won\'t be fully indexed, but Tavily\'s summaries/excerpts are sufficient for qualitative context.\n\n2) dcf.py with simple_dcf(fcf, growth_rate, discount_rate, terminal_growth, years, shares_outstanding) that projects free cash flow for `years` years at growth_rate, discounts each year to present value at discount_rate, computes a terminal value using the Gordon growth formula, discounts that to present value too, sums everything for enterprise value, and returns enterprise_value / shares_outstanding rounded to 2 decimals.\n\nAdd a comment that DCF outputs are extremely sensitive to growth_rate and discount_rate assumptions, so the model should always be run across a range rather than relying on a single point estimate.\n\n3) sensitivity.py using pandas with sensitivity_table(fcf, shares_outstanding, base_growth=0.05, base_discount=0.09) that runs simple_dcf() across growth rates [base_growth-0.02, base_growth, base_growth+0.02] and discount rates [base_discount-0.01, base_discount, base_discount+0.01] (with terminal_growth=0.025 and years=5), and returns a pandas DataFrame pivoted with growth as rows, discount as columns, and fair_value as values.',
              verify: 'Run get_qualitative_context() for a real ticker and confirm both transcript and news results are non-empty. Run sensitivity_table() and confirm it returns a 3x3 DataFrame of fair values that vary monotonically with growth and discount rate.',
            },
          ],
          goFurther: 'Derive base_growth and base_discount automatically from the company\'s historical revenue CAGR and a CAPM-based cost of equity, instead of hardcoding defaults. 🛠️🛠️🛠️',
        },
        {
          number: 3,
          title: 'Build the bull, bear, and neutral analyst personas',
          time: '45 min',
          description: 'Have three Claude personas debate the investment thesis using the exact same underlying data.',
          steps: [
            {
              instruction: 'Ask Claude to write personas.py with analyst_argument, and synthesize.py with synthesize_recommendation.',
              prompt: 'Write two Python files for an equity research agent using the anthropic Python SDK.\n\n1) personas.py with analyst_argument(stance, financials, context, dcf_value, current_price) where stance is "bull" or "bear". It sends Claude (claude-sonnet-4-5, max_tokens=500) a prompt establishing "You are a {stance} equity analyst" and asking it to build the strongest possible {stance} case using the financials, the first 3 items of context["news"], the DCF intrinsic value estimate, and the current price — citing specific numbers, and writing 3 supporting points. Returns the response text.\n\nAdd a comment that running "bull" and "bear" with the exact same input data is important — forcing both personas to engage with identical facts produces much sharper arguments than letting them cherry-pick different sources.\n\n2) synthesize.py with synthesize_recommendation(bull_case, bear_case, dcf_value, current_price) that sends Claude (max_tokens=400) the bull case, bear case, DCF value, and current price, asking it to act as a neutral portfolio strategist and provide: recommendation (buy/hold/sell), confidence (0-1), and a 3-sentence rationale that explicitly acknowledges the strongest point from the side it is NOT agreeing with. Returns the response text.\n\nAdd a comment that requiring the synthesizer to acknowledge the opposing side\'s strongest point is what separates a useful research report from confirmation bias.',
              verify: 'Run analyst_argument() with stance="bull" and stance="bear" on the same financials/context and confirm both produce specific, numbers-citing arguments. Run synthesize_recommendation() and confirm the rationale explicitly references a point from the side it disagrees with.',
            },
          ],
          goFurther: 'Add a fourth "devil\'s advocate" pass that critiques the synthesizer\'s own recommendation before it\'s finalized, catching any one-sided reasoning that slipped through. 🛠️🛠️🛠️',
        },
        {
          number: 4,
          title: 'Assemble the final research report',
          time: '65 min',
          description: 'Pull everything together into a formatted Markdown report with a required disclaimer.',
          steps: [
            {
              instruction: 'Ask Claude to write report.py with build_research_report, and main.py that orchestrates the entire pipeline end to end.',
              prompt: 'Write report.py and main.py for an equity research agent.\n\n1) report.py with build_research_report(ticker, financials, sensitivity_df, bull_case, bear_case, recommendation, output=None) that writes a Markdown file (default name "{ticker}_research_report.md") with sections: "# Equity Research Report: {ticker}", "## Key Financials" (str of financials dict), "## Valuation Sensitivity (Fair Value per Share)" (sensitivity_df.to_markdown()), "## Bull Case", "## Bear Case", "## Recommendation", and a final "## Disclaimer" section noting the report was AI-generated, may contain errors, is not investment advice, and requires human review before any decision.\n\nAdd a comment reinforcing that this disclaimer is mandatory, not optional boilerplate — this report must never be presented as investment advice.\n\n2) main.py that, given a ticker, cik, company_name, and current_price, runs the full pipeline: get_company_facts(cik) -> get_qualitative_context(ticker, company_name) -> simple_dcf(...) using financials\' operating_cash_flow as a proxy for fcf -> sensitivity_table(...) -> analyst_argument("bull", ...) and analyst_argument("bear", ...) -> synthesize_recommendation(...) -> build_research_report(...). Print the output filename when done.',
              verify: 'Run main.py for a real company (e.g. AAPL, CIK 320193) and confirm it produces a complete Markdown report with all six sections populated, including the disclaimer, and that the sensitivity table renders as a proper Markdown table.',
            },
          ],
          goFurther: 'Add a "report history" mode that re-runs the pipeline weekly for a watchlist of tickers and diffs the new recommendation against the prior one, flagging any rating changes. 🛠️🛠️🛠️',
        },
      ],
      portfolio: 'Add this to your portfolio as "Autonomous Equity Research Agent" — a flagship project for finance, equity research, or quantitative analyst roles. Show a full generated research report for a real company, the sensitivity table, and excerpts from the bull/bear debate.',
      portfolioPrompt: 'Help me write a portfolio entry and a LinkedIn post for a project I just built: an Autonomous Equity Research Agent. It pulls a company\'s SEC filings and structured XBRL financials directly from EDGAR, gathers recent news and earnings call context via search, and builds a discounted cash flow valuation with a full sensitivity table across growth and discount rate assumptions. It then runs a panel of three Claude "analyst personas" — bull, bear, and a neutral synthesizer — that debate the investment thesis using identical underlying data, with the synthesizer required to acknowledge the strongest opposing point before producing a final buy/hold/sell recommendation with a confidence score. Everything is assembled into a formatted, disclaimer-included Markdown research report. Write:\n1. A 3-4 sentence portfolio project description emphasizing data-grounded, multi-perspective financial analysis\n2. A LinkedIn post (under 150 words) for a finance / equity research / fintech audience\n3. Two resume bullet points quantifying research time saved and coverage breadth',
    },
    steps: [
      {
        number: 1,
        title: 'Fetch SEC filings',
        description: 'Use the SEC EDGAR full-text search and submissions API to retrieve a company’s recent 10-K and 10-Q filings.',
        code: `# edgar.py
import requests

HEADERS = {"User-Agent": "AgentForge Research support@yourcompany.com"}

def get_filings(cik, form_type="10-K", count=1):
    cik_padded = str(cik).zfill(10)
    resp = requests.get(f"https://data.sec.gov/submissions/CIK{cik_padded}.json", headers=HEADERS)
    filings = resp.json()["filings"]["recent"]
    indices = [i for i, f in enumerate(filings["form"]) if f == form_type][:count]
    return [{"accessionNumber": filings["accessionNumber"][i], "filingDate": filings["filingDate"][i]} for i in indices]`,
        tip: 'SEC EDGAR requires a descriptive User-Agent header with a contact email — requests without one are blocked.',
      },
      {
        number: 2,
        title: 'Extract financial statements',
        description: 'Fetch the company facts API for structured XBRL financial data (revenue, net income, cash flow).',
        code: `# financials.py
def get_company_facts(cik):
    cik_padded = str(cik).zfill(10)
    resp = requests.get(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik_padded}.json", headers=HEADERS)
    facts = resp.json()["facts"]["us-gaap"]
    return {
        "revenue": extract_latest(facts.get("Revenues", facts.get("RevenueFromContractWithCustomerExcludingAssessedTax"))),
        "net_income": extract_latest(facts.get("NetIncomeLoss")),
        "operating_cash_flow": extract_latest(facts.get("NetCashProvidedByUsedInOperatingActivities")),
    }

def extract_latest(fact):
    if not fact:
        return None
    units = fact["units"]["USD"]
    annual = [u for u in units if u.get("form") == "10-K"]
    return sorted(annual, key=lambda u: u["end"])[-1]["val"] if annual else None`,
        tip: 'XBRL tag names vary by company and over time — always handle the case where a tag is missing with .get() and fallbacks.',
      },
      {
        number: 3,
        title: 'Scrape earnings call transcript and news',
        description: 'Use Tavily to find the most recent earnings call transcript and recent news coverage.',
        code: `# context.py
from tavily import TavilyClient
tavily = TavilyClient(api_key="...")

def get_qualitative_context(ticker, company_name):
    transcript = tavily.search(query=f"{company_name} {ticker} earnings call transcript latest quarter", max_results=2)
    news = tavily.search(query=f"{company_name} {ticker} news analysis", max_results=5)
    return {"transcript": transcript["results"], "news": news["results"]}`,
        tip: 'Earnings call transcripts behind paywalls won’t be fully indexed — Tavily often returns summaries/excerpts, which is sufficient for qualitative context.',
      },
      {
        number: 4,
        title: 'Build a basic DCF model',
        description: 'Project free cash flow growth and discount it to present value to estimate intrinsic value per share.',
        code: `# dcf.py
def simple_dcf(fcf, growth_rate, discount_rate, terminal_growth, years, shares_outstanding):
    pv_sum = 0
    for year in range(1, years + 1):
        projected_fcf = fcf * (1 + growth_rate) ** year
        pv_sum += projected_fcf / (1 + discount_rate) ** year
    terminal_value = (fcf * (1 + growth_rate) ** years * (1 + terminal_growth)) / (discount_rate - terminal_growth)
    pv_terminal = terminal_value / (1 + discount_rate) ** years
    enterprise_value = pv_sum + pv_terminal
    return round(enterprise_value / shares_outstanding, 2)`,
        tip: 'DCF outputs are extremely sensitive to growth_rate and discount_rate assumptions — always run it across a range (e.g. ±2%) rather than a single point estimate.',
      },
      {
        number: 5,
        title: 'Build the bull and bear analyst personas',
        description: 'Create two Claude personas that argue opposing investment theses based on the same data.',
        code: `# personas.py
from anthropic import Anthropic
ai = Anthropic()

def analyst_argument(stance, financials, context, dcf_value, current_price):
    prompt = f"""You are a {stance} equity analyst. Build the strongest possible {stance} case
for this stock based on the data below. Be specific and cite numbers.

Financials: {financials}
Recent news/transcript highlights: {context['news'][:3]}
DCF intrinsic value estimate: \${dcf_value}, Current price: \${current_price}

Write 3 supporting points for your {stance} thesis."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=500,
        messages=[{"role": "user", "content": prompt}]).content[0].text`,
        tip: 'Run "bull" and "bear" with the exact same input data — forcing both personas to engage with identical facts produces much sharper arguments than letting them cherry-pick.',
      },
      {
        number: 6,
        title: 'Build the neutral synthesizer',
        description: 'Have a third Claude persona weigh both arguments and produce a balanced recommendation with a confidence level.',
        code: `# synthesize.py
def synthesize_recommendation(bull_case, bear_case, dcf_value, current_price):
    prompt = f"""Bull case: {bull_case}
Bear case: {bear_case}
DCF intrinsic value: \${dcf_value}, Current price: \${current_price}

As a neutral portfolio strategist, weigh both cases. Provide:
recommendation (buy/hold/sell), confidence (0-1), and a 3-sentence rationale
that acknowledges the strongest point from the side you're NOT agreeing with."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=400,
        messages=[{"role": "user", "content": prompt}]).content[0].text`,
        tip: 'Requiring the synthesizer to acknowledge the opposing side’s strongest point is what separates a useful research report from confirmation bias.',
      },
      {
        number: 7,
        title: 'Compute valuation sensitivity table',
        description: 'Run the DCF across a grid of growth/discount rate assumptions to show a range of fair values.',
        code: `# sensitivity.py
import pandas as pd

def sensitivity_table(fcf, shares_outstanding, base_growth=0.05, base_discount=0.09):
    rows = []
    for g in [base_growth - 0.02, base_growth, base_growth + 0.02]:
        for d in [base_discount - 0.01, base_discount, base_discount + 0.01]:
            value = simple_dcf(fcf, g, d, 0.025, 5, shares_outstanding)
            rows.append({"growth": g, "discount": d, "fair_value": value})
    return pd.DataFrame(rows).pivot(index="growth", columns="discount", values="fair_value")`,
        tip: 'Present the sensitivity table prominently — it communicates uncertainty far better than a single "fair value" number.',
      },
      {
        number: 8,
        title: 'Assemble the research report',
        description: 'Combine financials, the DCF table, both personas’ arguments, and the synthesis into a formatted Markdown report.',
        code: `# report.py
def build_research_report(ticker, financials, sensitivity_df, bull_case, bear_case, recommendation, output=None):
    output = output or f"{ticker}_research_report.md"
    with open(output, "w") as f:
        f.write(f"# Equity Research Report: {ticker}\\n\\n")
        f.write("## Key Financials\\n" + str(financials) + "\\n\\n")
        f.write("## Valuation Sensitivity (Fair Value per Share)\\n")
        f.write(sensitivity_df.to_markdown() + "\\n\\n")
        f.write("## Bull Case\\n" + bull_case + "\\n\\n")
        f.write("## Bear Case\\n" + bear_case + "\\n\\n")
        f.write("## Recommendation\\n" + recommendation + "\\n")`,
        tip: 'This report is a research aid, not investment advice — always include a disclaimer footer noting it was AI-generated and requires human review before any decision.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Autonomous Equity Research Agent (starter)
Run: pip install requests anthropic pandas tavily-python
"""
import requests
from anthropic import Anthropic

ai = Anthropic()
HEADERS = {"User-Agent": "AgentForge Research support@yourcompany.com"}

def get_company_facts(cik):
    cik_padded = str(cik).zfill(10)
    resp = requests.get(f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik_padded}.json", headers=HEADERS)
    facts = resp.json()["facts"]["us-gaap"]
    revenues = facts.get("Revenues", {}).get("units", {}).get("USD", [])
    return revenues[-1]["val"] if revenues else None

def quick_thesis(ticker, revenue):
    prompt = f"Ticker {ticker} has annual revenue of \${revenue}. Give a 3-sentence preliminary investment thesis."
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=200,
        messages=[{"role": "user", "content": prompt}]).content[0].text

if __name__ == "__main__":
    revenue = get_company_facts(320193)  # Apple's CIK
    print(quick_thesis("AAPL", revenue))
`,
    resources: [
      { title: 'SEC EDGAR API', url: 'https://www.sec.gov/edgar/sec-api-documentation' },
      { title: 'Tavily API Docs', url: 'https://docs.tavily.com' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 38,
    title: 'Social Media Command Center',
    emoji: '🛰️',
    department: ['Marketing'],
    departmentIds: ['marketing'],
    difficulty: 'World Class',
    description:
      'Monitors Twitter, Reddit, and LinkedIn in real time for brand mentions and trending topics, drafts on-brand responses, and surfaces a live opportunity feed.',
    whatYouBuild:
      'A real-time social listening system that streams mentions and relevant keywords across Twitter, Reddit, and LinkedIn into Redis, classifies each mention by intent (complaint, question, praise, opportunity) and urgency, drafts on-brand responses for high-priority items, detects emerging trend spikes in your industry, and serves a live dashboard ranking the day’s top engagement opportunities.',
    whatYouLearn: [
      'Stream and deduplicate social mentions across multiple platform APIs',
      'Use Redis as a real-time queue and cache for streaming data',
      'Classify mentions by intent and urgency at scale',
      'Detect trend spikes using rolling-window statistics',
      'Generate on-brand draft responses with persona consistency',
      'Build a real-time priority dashboard',
    ],
    techStack: ['Python', 'Twitter API', 'Reddit API', 'LinkedIn API', 'Redis', 'Claude API'],
    buildTime: '9 hrs',
    xp: 1250,
    popularity: 85,
    prerequisites: ['Completed LinkedIn Content Creator Agent', 'Completed Competitor Intelligence Monitor', 'Redis installed'],
    tags: ['social-media', 'real-time', 'monitoring', 'redis'],
    session: {
      totalTime: '200 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'A Redis-backed streaming pipeline that polls Twitter and Reddit and deduplicates mentions',
        'Claude-based classification of every mention by intent, urgency, and whether it needs a response',
        'Trend spike detection using rolling-window mention volume, and a priority-scored queue',
        'A live Streamlit dashboard plus an orchestration loop with Slack alerts for spikes',
      ],
      whatYouNeed: [
        'Python installed locally',
        'An Anthropic API key (console.anthropic.com)',
        'pip install redis anthropic requests streamlit',
        'Redis installed and running locally, Twitter API and Reddit API credentials, a Slack webhook URL',
      ],
      builds: [
        {
          number: 1,
          title: 'Stream mentions into Redis and deduplicate',
          time: '40 min',
          description: 'Poll Twitter and Reddit for brand mentions, push them into a Redis stream, and avoid processing duplicates.',
          steps: [
            {
              instruction: 'Ask Claude to write ingest.py with poll_twitter and poll_reddit functions, and dedupe.py with an is_new_mention function.',
              prompt: 'Write two Python files for a social media monitoring agent using redis and requests.\n\n1) ingest.py with a module-level r = redis.Redis(), and:\n- poll_twitter(query, bearer_token) that GETs https://api.twitter.com/2/tweets/search/recent with an Authorization Bearer header, params query/max_results=25/tweet.fields="created_at,author_id", and for each tweet in the response data, calls r.xadd("mentions", {"platform": "twitter", "data": json.dumps(tweet)})\n- poll_reddit(subreddit, keyword, headers) that GETs https://oauth.reddit.com/r/{subreddit}/search with the given headers and params q=keyword/sort=new/limit=25, and for each post, calls r.xadd("mentions", {"platform": "reddit", "data": json.dumps(post["data"])})\n\nAdd a comment that Redis Streams (XADD/XREAD) are used instead of lists or pub/sub because they give persistence and consumer groups for free.\n\n2) dedupe.py with is_new_mention(mention_id) that returns True if r.sadd("seen_mentions", mention_id) == 1 (i.e. it was newly added), False if it was already a member.\n\nAdd a comment that SADD returning 0 means the item already existed — this single line is the entire dedup check.',
              verify: 'Run poll_twitter() with a real query and confirm new entries appear via r.xrange("mentions", "-", "+"). Call is_new_mention() twice with the same ID and confirm it returns True then False.',
            },
          ],
          goFurther: 'Add poll_linkedin() using LinkedIn\'s API to round out the three-platform coverage promised in the agent description. 🛠️🛠️',
        },
        {
          number: 2,
          title: 'Classify mentions and detect trend spikes',
          time: '50 min',
          description: 'Use Claude to triage every new mention, and track rolling mention volume to catch sudden spikes.',
          steps: [
            {
              instruction: 'Ask Claude to write classify.py with a classify_mention function, and trends.py with record_mention_volume and detect_spike functions.',
              prompt: 'Write two Python files for a social media monitoring agent.\n\n1) classify.py using the anthropic Python SDK with classify_mention(text, platform) that sends Claude (claude-sonnet-4-5, max_tokens=150) the mention text and platform, asking it to classify: intent (complaint/question/praise/opportunity/spam), urgency (low/medium/high), and requires_response (true/false). Request JSON: {"intent": "...", "urgency": "...", "requires_response": true/false}. Parse and return the JSON.\n\nAdd a comment that classifying "spam" explicitly is important — without it, promotional bot mentions of the brand name will flood the priority queue.\n\n2) trends.py using redis and datetime, sharing the r = redis.Redis() client, with:\n- record_mention_volume(keyword) that increments r a counter key f"volume:{keyword}:{hour_bucket}" (hour_bucket = current UTC time formatted "%Y%m%d%H") and sets a 24-hour expiry on it\n- detect_spike(keyword, threshold_multiplier=3) that gets the current hour\'s count, gets counts for the previous 3 hours, computes their average as baseline, and returns True if current > baseline * threshold_multiplier AND current > 5\n\nAdd a comment that the absolute minimum (current > 5) matters — without it, 1 mention vs. a 0 baseline would register as a 3x+ "spike" that means nothing.',
              verify: 'Run classify_mention() on a complaint and confirm intent="complaint" with requires_response=true. Call record_mention_volume() several times for the same keyword/hour then detect_spike() and confirm it returns False below the threshold and True once volume exceeds baseline*3 and >5.',
            },
          ],
          goFurther: 'Add a classify_mention() variant that batches multiple mentions into a single Claude call to reduce API costs during high-volume periods. 🛠️🛠️',
        },
        {
          number: 3,
          title: 'Draft on-brand responses and build the priority queue',
          time: '40 min',
          description: 'Generate response drafts in a consistent brand voice, and score mentions into a ranked Redis priority queue.',
          steps: [
            {
              instruction: 'Ask Claude to write respond.py with a BRAND_VOICE constant and draft_response function, and priority.py with an enqueue_priority function.',
              prompt: 'Write two Python files for a social media monitoring agent.\n\n1) respond.py using the anthropic Python SDK with a module-level BRAND_VOICE string constant describing a friendly, helpful, slightly informal, never-defensive brand voice that always thanks people for feedback (even criticism) and refers to the company as "AgentForge" rather than "we". Then draft_response(mention_text, classification, platform) that sends Claude (claude-sonnet-4-5, max_tokens=200) the BRAND_VOICE, the mention text, platform, and classification (intent/urgency), asking it to draft a response in that voice, kept under 280 characters for twitter and 500 for other platforms. Returns the response text.\n\nAdd a comment that BRAND_VOICE should be kept as a separate, easily-editable constant since the social team will want to tune it after seeing the first batch of drafts.\n\n2) priority.py sharing the r = redis.Redis() client, with URGENCY_SCORES = {"high": 3, "medium": 2, "low": 1} and INTENT_SCORES = {"complaint": 3, "opportunity": 2, "question": 2, "praise": 1, "spam": 0}, and enqueue_priority(mention_id, classification) that computes score = URGENCY_SCORES.get(classification["urgency"], 1) + INTENT_SCORES.get(classification["intent"], 0), and if score > 0, calls r.zadd("priority_queue", {mention_id: score}).\n\nAdd a comment that Redis sorted sets (ZADD/ZREVRANGE) give an always-sorted priority queue with O(log n) inserts, which is ideal here.',
              verify: 'Run draft_response() on a complaint and confirm the draft thanks the user and stays under the platform character limit. Run enqueue_priority() on mentions with different urgency/intent combos and confirm r.zrevrange("priority_queue", 0, -1, withscores=True) returns them ranked by score, with spam scoring 0 or being excluded.',
            },
          ],
          goFurther: 'Add a per-platform response length check that re-prompts Claude if the draft exceeds the limit, instead of trusting the model to stay under it. 🛠️',
        },
        {
          number: 4,
          title: 'Build the live dashboard and orchestration loop',
          time: '70 min',
          description: 'Surface the priority queue in a live dashboard, and run the full ingestion-to-alert loop continuously.',
          steps: [
            {
              instruction: 'Ask Claude to write dashboard.py as a live Streamlit app, and main.py with a run_loop function that ties everything together with Slack spike alerts.',
              prompt: 'Write two Python files for a social media monitoring agent.\n\n1) dashboard.py using streamlit, sharing the r = redis.Redis() client, that sets the page title to "Social Media Command Center", creates an st.empty() placeholder, and in a loop (every 5 seconds): fetches the top 10 entries from r.zrevrange("priority_queue", 0, 9, withscores=True), and for each, looks up the mention details via r.hget("mention_details", mention_id) (JSON-decoded), displaying the score, mention text (first 200 chars), and the stored draft_response as a caption.\n\nAdd a comment that st.empty() + a loop with time.sleep() is the simplest way to build a "live" Streamlit view, but for production st.fragment with run_every is preferable.\n\n2) main.py with run_loop() that runs forever, every 60 seconds:\n- Calls poll_twitter() and poll_reddit() for brand-relevant queries (e.g. "AgentForge OR @AgentForgeApp", subreddit "artificial" keyword "AgentForge")\n- Iterates r.xrange("mentions") — for each new entry (via is_new_mention), classifies it with classify_mention(), and if requires_response is true, drafts a response with draft_response() and stores it via r.hset("mention_details", mention_id, json.dumps({...mention, "draft_response": draft}))\n- Calls enqueue_priority() for every classified mention\n- For each tracked keyword, calls record_mention_volume() and if detect_spike() is true, POSTs an alert to a Slack webhook URL\n\nAdd a comment that this loop must run as a separate process from the Streamlit dashboard — Streamlit reruns its whole script on each interaction, which would restart the ingestion loop.',
              verify: 'Run main.py for a couple of cycles and confirm new mentions accumulate in the priority queue with draft responses attached. Run `streamlit run dashboard.py` alongside it and confirm the top mentions and draft responses update live every 5 seconds.',
            },
          ],
          goFurther: 'Add a "resolved" action in the dashboard that removes a mention from priority_queue once a human has responded, so the queue only ever shows open items. 🛠️🛠️',
        },
      ],
      portfolio: 'Add this to your portfolio as "Social Media Command Center" — an impressive real-time systems project for social media management, marketing ops, or platform engineering roles. Show the live dashboard, a trend spike alert, and an example of a classified mention with its drafted response.',
      portfolioPrompt: 'Help me write a portfolio entry and a LinkedIn post for a project I just built: a Social Media Command Center. It streams brand mentions from Twitter and Reddit into Redis in real time, deduplicates them, and has Claude classify each one by intent (complaint/question/praise/opportunity/spam) and urgency. High-priority mentions get an on-brand drafted response generated in a consistent brand voice, while a rolling-window volume tracker detects sudden mention spikes and fires Slack alerts. Everything feeds a Redis sorted-set priority queue rendered live in a Streamlit dashboard, so the social team always sees the day\'s top engagement opportunities first. Write:\n1. A 3-4 sentence portfolio project description emphasizing real-time data pipelines and AI-assisted triage\n2. A LinkedIn post (under 150 words) for a marketing / social media / platform engineering audience\n3. Two resume bullet points quantifying response time improvement and mention volume handled',
    },
    steps: [
      {
        number: 1,
        title: 'Set up streaming ingestion',
        description: 'Poll Twitter and Reddit APIs for brand-relevant keywords on a short interval and push raw mentions into a Redis stream.',
        code: `# ingest.py
import redis, requests, json, time

r = redis.Redis()

def poll_twitter(query, bearer_token):
    resp = requests.get("https://api.twitter.com/2/tweets/search/recent",
        headers={"Authorization": f"Bearer {bearer_token}"},
        params={"query": query, "max_results": 25, "tweet.fields": "created_at,author_id"})
    for tweet in resp.json().get("data", []):
        r.xadd("mentions", {"platform": "twitter", "data": json.dumps(tweet)})

def poll_reddit(subreddit, keyword, headers):
    resp = requests.get(f"https://oauth.reddit.com/r/{subreddit}/search",
        headers=headers, params={"q": keyword, "sort": "new", "limit": 25})
    for post in resp.json()["data"]["children"]:
        r.xadd("mentions", {"platform": "reddit", "data": json.dumps(post["data"])})`,
        tip: 'Use Redis Streams (XADD/XREAD) rather than lists or pub/sub — streams give you persistence and consumer groups for free.',
      },
      {
        number: 2,
        title: 'Deduplicate mentions',
        description: 'Use a Redis set of seen IDs to avoid processing the same mention twice across polling cycles.',
        code: `# dedupe.py
def is_new_mention(mention_id):
    return r.sadd("seen_mentions", mention_id) == 1  # returns 0 if already a member`,
        tip: 'SADD returning 0 means the item already existed — this single line is your entire dedup check.',
      },
      {
        number: 3,
        title: 'Classify mentions by intent and urgency',
        description: 'Send each new mention to Claude for classification before deciding how to handle it.',
        code: `# classify.py
from anthropic import Anthropic
import json

ai = Anthropic()

def classify_mention(text, platform):
    prompt = f"""Social media mention from {platform}: "{text}"

Classify: intent (complaint/question/praise/opportunity/spam),
urgency (low/medium/high), and whether it requires a response (true/false).

Return JSON: {{"intent": "...", "urgency": "...", "requires_response": true/false}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=150,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)`,
        tip: 'Classify "spam" explicitly — without it, promotional bot mentions of your brand name will flood your priority queue.',
      },
      {
        number: 4,
        title: 'Detect trend spikes',
        description: 'Track mention volume per keyword in rolling 1-hour windows and flag sudden spikes.',
        code: `# trends.py
from datetime import datetime

def record_mention_volume(keyword):
    hour_bucket = datetime.utcnow().strftime("%Y%m%d%H")
    r.incr(f"volume:{keyword}:{hour_bucket}")
    r.expire(f"volume:{keyword}:{hour_bucket}", 86400)

def detect_spike(keyword, threshold_multiplier=3):
    now = datetime.utcnow()
    current = int(r.get(f"volume:{keyword}:{now.strftime('%Y%m%d%H')}") or 0)
    previous_hours = [int(r.get(f"volume:{keyword}:{(now.replace(hour=(now.hour - i) % 24)).strftime('%Y%m%d%H')}") or 0) for i in range(1, 4)]
    baseline = sum(previous_hours) / max(len(previous_hours), 1)
    return current > baseline * threshold_multiplier and current > 5`,
        tip: 'Require an absolute minimum (current > 5) in addition to the multiplier — 1 mention vs. 0 baseline is a 3x+ "spike" that means nothing.',
      },
      {
        number: 5,
        title: 'Build the brand persona response generator',
        description: 'Maintain a brand voice guide and use it to draft responses to high-priority mentions.',
        code: `# respond.py
BRAND_VOICE = """Friendly, helpful, slightly informal. Never defensive. Always thank
the person for feedback, even criticism. Use the company name 'AgentForge', never 'we' alone."""

def draft_response(mention_text, classification, platform):
    prompt = f"""Brand voice: {BRAND_VOICE}

A user on {platform} posted: "{mention_text}"
Classified as: {classification['intent']}, urgency: {classification['urgency']}

Draft a response in our brand voice. Keep it under {280 if platform == 'twitter' else 500} characters."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=200,
        messages=[{"role": "user", "content": prompt}]).content[0].text`,
        tip: 'Keep BRAND_VOICE as a separate, easily-editable constant — your social team will want to tune it after seeing the first batch of drafts.',
      },
      {
        number: 6,
        title: 'Build the priority queue',
        description: 'Score each classified mention by urgency and intent to produce a ranked priority queue in Redis.',
        code: `# priority.py
URGENCY_SCORES = {"high": 3, "medium": 2, "low": 1}
INTENT_SCORES = {"complaint": 3, "opportunity": 2, "question": 2, "praise": 1, "spam": 0}

def enqueue_priority(mention_id, classification):
    score = URGENCY_SCORES.get(classification["urgency"], 1) + INTENT_SCORES.get(classification["intent"], 0)
    if score > 0:
        r.zadd("priority_queue", {mention_id: score})`,
        tip: 'Redis sorted sets (ZADD/ZREVRANGE) give you an always-sorted priority queue with O(log n) inserts — perfect for this use case.',
      },
      {
        number: 7,
        title: 'Build the live dashboard',
        description: 'A Streamlit dashboard polling Redis every few seconds to show the top priority mentions and trend spikes.',
        code: `# dashboard.py
import streamlit as st
import time

st.title("Social Media Command Center")
placeholder = st.empty()

while True:
    with placeholder.container():
        top_mentions = r.zrevrange("priority_queue", 0, 9, withscores=True)
        st.subheader("Top Priority Mentions")
        for mention_id, score in top_mentions:
            mention = json.loads(r.hget("mention_details", mention_id) or "{}")
            st.write(f"**[{score}]** {mention.get('text', '')[:200]}")
            st.caption(f"Draft response: {mention.get('draft_response', '')}")
    time.sleep(5)`,
        tip: 'st.empty() + a loop with time.sleep() is the simplest way to build a "live" Streamlit view — for production, use st.fragment with run_every instead.',
      },
      {
        number: 8,
        title: 'Schedule and orchestrate the full loop',
        description: 'Run ingestion, classification, and dashboard updates continuously, with trend spike alerts to Slack.',
        code: `# main.py
import time, requests

def run_loop():
    while True:
        poll_twitter("AgentForge OR @AgentForgeApp", TWITTER_TOKEN)
        poll_reddit("artificial", "AgentForge", REDDIT_HEADERS)

        for entry_id, fields in r.xrange("mentions"):
            mention = json.loads(fields[b"data"])
            if is_new_mention(mention["id"]):
                classification = classify_mention(mention["text"], fields[b"platform"].decode())
                if classification["requires_response"]:
                    draft = draft_response(mention["text"], classification, fields[b"platform"].decode())
                    r.hset("mention_details", mention["id"], json.dumps({**mention, "draft_response": draft}))
                enqueue_priority(mention["id"], classification)

        for keyword in ["AgentForge", "AI agents"]:
            record_mention_volume(keyword)
            if detect_spike(keyword):
                requests.post(SLACK_WEBHOOK, json={"text": f"📈 Mention spike detected for '{keyword}'"})
        time.sleep(60)`,
        tip: 'Run this loop as a separate process from the Streamlit dashboard — Streamlit reruns its whole script on each interaction, which would restart your ingestion loop.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Social Media Command Center (starter)
Run: pip install redis anthropic requests
"""
import redis, json
from anthropic import Anthropic

r = redis.Redis()
ai = Anthropic()

def classify_mention(text, platform):
    prompt = f"""Mention from {platform}: "{text}"
Classify intent (complaint/question/praise/opportunity/spam) and urgency (low/medium/high).
Return JSON: {{"intent":"...", "urgency":"..."}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=100,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)

def enqueue(mention_id, text, classification):
    score = {"high": 3, "medium": 2, "low": 1}.get(classification["urgency"], 1)
    r.zadd("priority_queue", {mention_id: score})
    r.hset("mention_text", mention_id, text)

if __name__ == "__main__":
    text = "AgentForge's onboarding flow keeps timing out for me, anyone else seeing this?"
    classification = classify_mention(text, "twitter")
    enqueue("tweet_123", text, classification)
    print(r.zrevrange("priority_queue", 0, 5, withscores=True))
`,
    resources: [
      { title: 'Twitter API v2 Docs', url: 'https://developer.twitter.com/en/docs/twitter-api' },
      { title: 'Reddit API Docs', url: 'https://www.reddit.com/dev/api/' },
      { title: 'Redis Documentation', url: 'https://redis.io/docs/latest/' },
    ],
  },
  {
    id: 39,
    title: 'Autonomous Incident Response Agent',
    emoji: '🚨',
    department: ['Engineering', 'Operations'],
    departmentIds: ['engineering', 'operations'],
    difficulty: 'World Class',
    description:
      'Receives PagerDuty alerts, automatically investigates by querying logs and metrics, proposes a root cause and fix, and can execute safe remediation actions.',
    whatYouBuild:
      'An on-call agent that receives PagerDuty incident webhooks, pulls relevant logs and metrics from your observability stack, correlates the incident with recent deploys, asks Claude to form a root-cause hypothesis and propose remediation steps, automatically executes pre-approved low-risk remediations (e.g. restarting a service, scaling up), and posts a full incident timeline to Slack while paging a human for anything high-risk.',
    whatYouLearn: [
      'Receive and parse PagerDuty incident webhooks',
      'Query logs and metrics programmatically during an active incident',
      'Correlate incidents with deployment history',
      'Build a root-cause hypothesis prompt grounded in observability data',
      'Implement a safe-action allowlist for automated remediation',
      'Generate incident timelines and postmortem drafts',
    ],
    techStack: ['Python', 'PagerDuty', 'Claude API', 'FastAPI', 'requests'],
    buildTime: '9 hrs',
    xp: 1300,
    popularity: 87,
    prerequisites: ['Completed Code Review Agent', 'Completed Autonomous Data Pipeline Agent', 'PagerDuty + observability stack access'],
    tags: ['devops', 'incident-response', 'sre', 'automation'],
    session: {
      totalTime: '210 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'A FastAPI webhook that receives PagerDuty incidents and pulls logs, metrics, and recent deploys',
        'A Claude diagnosis step that produces ranked, evidence-backed root-cause hypotheses with remediation suggestions',
        'A safe-action allowlist that auto-executes low-risk fixes and escalates everything else to a human',
        'A full incident timeline and a blameless postmortem draft generated automatically',
      ],
      whatYouNeed: [
        'Python installed locally',
        'An Anthropic API key (console.anthropic.com)',
        'pip install fastapi uvicorn anthropic requests',
        'PagerDuty account with webhook access, and API access to your logging/metrics backend and deploy history (e.g. GitHub Deployments)',
      ],
      builds: [
        {
          number: 1,
          title: 'Receive incidents and gather observability context',
          time: '50 min',
          description: 'Build the webhook entry point and pull the logs, metrics, and deploy history needed to diagnose the incident.',
          steps: [
            {
              instruction: 'Ask Claude to write webhook.py with a FastAPI /pagerduty-webhook endpoint, observability.py with log/metric query functions, and deploys.py with a recent-deploys function.',
              prompt: 'Write three Python files for an incident response agent.\n\n1) webhook.py using FastAPI with a POST /pagerduty-webhook endpoint that reads the JSON body, iterates payload.get("messages", []), and for each event where event["event"] == "incident.triggered", calls await handle_incident(event["incident"]) (assume handle_incident is defined elsewhere). Returns {"ok": True}.\n\nAdd a comment that this endpoint should be configured as a PagerDuty Generic V3 Webhook subscription scoped to "Incidents", and that the webhook signature should be verified in production.\n\n2) observability.py using requests with:\n- get_recent_logs(service, since_minutes=15) that GETs https://logs.yourapp.com/api/query with params query=f\'service:"{service}" level:error\' and from=f"now-{since_minutes}m", an Authorization Bearer header, returning resp.json()["results"]\n- get_metrics(service, metric="error_rate", since_minutes=30) that GETs https://metrics.yourapp.com/api/query with params query=f\'{{metric}}{{{{service="{{service}}"}}}}\' and start=f"-{{since_minutes}}m", returning resp.json()["data"]\n\nAdd a comment that pulling both logs (what happened) and metrics (how bad/widespread) matters — root-cause hypotheses grounded in only one of these are usually wrong.\n\n3) deploys.py using requests and datetime with get_recent_deploys(service, since_minutes=60) that GETs https://api.github.com/repos/yourorg/{service}/deployments (per_page=5) with a GitHub Authorization Bearer header, then filters to deploys where created_at is within the last since_minutes minutes, returning that filtered list.\n\nAdd a comment that a deploy in the last 30-60 minutes correlated with an incident start time is the single highest-value piece of context for root-causing.',
              verify: 'POST a sample PagerDuty incident.triggered payload to /pagerduty-webhook and confirm handle_incident receives the incident dict. Run get_recent_logs() and get_recent_deploys() against test/staging endpoints and confirm they return filtered, time-bounded results.',
            },
          ],
          goFurther: 'Add a get_related_alerts() function that checks for other concurrent PagerDuty incidents on dependent services, since cascading failures often produce multiple alerts at once. 🛠️🛠️',
        },
        {
          number: 2,
          title: 'Build the root-cause hypothesis generator',
          time: '45 min',
          description: 'Send everything gathered to Claude and get back ranked, evidence-backed hypotheses with remediation suggestions.',
          steps: [
            {
              instruction: 'Ask Claude to write diagnose.py with a diagnose_incident function.',
              prompt: 'Write diagnose.py for an incident response agent using the anthropic Python SDK.\n\nDefine diagnose_incident(incident, logs, metrics, recent_deploys) that sends Claude (claude-sonnet-4-5, max_tokens=1000) a prompt including: the incident title and affected service, a sample of the first 10 log entries, the metrics trend, and recent deploys. Ask Claude to provide 1-3 ranked root-cause hypotheses, each with confidence (0-1), evidence drawn from the data above, a suggested remediation action, and remediation_risk (low/medium/high). Request JSON: {"hypotheses": [{"cause": "...", "confidence": 0.0, "evidence": "...", "remediation": "...", "remediation_risk": "low/medium/high"}]}. Parse and return the hypotheses list.\n\nAdd a comment that requiring "evidence" tied to specific log lines or metric values is essential — it prevents Claude from generating plausible-sounding but ungrounded theories.',
              verify: 'Run diagnose_incident() with a sample incident, a handful of error logs, an error-rate spike in metrics, and one recent deploy. Confirm the top hypothesis cites the deploy as evidence and that confidence/remediation_risk are populated for every hypothesis.',
            },
          ],
          goFurther: 'Add a second Claude pass that cross-checks the top hypothesis against the OTHER hypotheses and flags if they contradict each other — a sign the data is ambiguous and confidence should be lowered. 🛠️🛠️🛠️',
        },
        {
          number: 3,
          title: 'Define the safe-action allowlist and execute remediations',
          time: '45 min',
          description: 'Decide which fixes can run automatically, execute the safe ones, and escalate everything else.',
          steps: [
            {
              instruction: 'Ask Claude to write allowlist.py with SAFE_ACTIONS and is_auto_executable, remediate.py with the remediation functions, and escalate.py with page_human and needs_human.',
              prompt: 'Write three Python files for an incident response agent.\n\n1) allowlist.py defining SAFE_ACTIONS = {\n  "restart_service": {"risk": "low", "function": "restart_service"},\n  "scale_up": {"risk": "low", "function": "scale_service"},\n  "rollback_deploy": {"risk": "medium", "function": "rollback_deploy"},\n  "clear_cache": {"risk": "low", "function": "clear_cache"}\n}\nand is_auto_executable(action_name) that returns True only if the action exists in SAFE_ACTIONS and has risk == "low".\n\nAdd a comment that the allowlist should start extremely small (restart + scale only) and expand only after the diagnosis quality is trusted over many real incidents.\n\n2) remediate.py using requests with:\n- restart_service(service_name) that POSTs to https://api.yourapp.com/services/{service_name}/restart with a Bearer auth header and returns a confirmation string\n- scale_service(service_name, replicas=None) that gets current replicas via get_current_replicas(service_name) (assume it exists), computes target = replicas or current + 2, POSTs to the scale endpoint with {"replicas": target}, and returns a confirmation string describing the change\n- execute_remediation(hypothesis, service_name) that maps hypothesis["remediation"] to an action name via map_remediation_to_action() (assume it exists), checks is_auto_executable(), and if true, looks up and calls the corresponding function from SAFE_ACTIONS via globals(), returning its result; otherwise returns None (meaning human approval is required)\n\nAdd a comment that every remediation call must log the exact API call made, including before/after state — this becomes critical evidence during the postmortem.\n\n3) escalate.py using requests and json with:\n- page_human(incident_id, reason, hypotheses) that POSTs to https://api.pagerduty.com/incidents with a Token auth header, creating a new incident titled f"AI escalation: {reason}" referencing the service and including the hypotheses JSON in the body details\n- needs_human(hypotheses) that returns True if the top hypothesis (hypotheses[0]) has confidence < 0.6 OR remediation_risk != "low"\n\nAdd a comment that the 0.6 confidence threshold is conservative on purpose — false-positive automated remediations during an active incident can make things worse, not better.',
              verify: 'Run execute_remediation() with a hypothesis mapping to "restart_service" and confirm it calls restart_service() and returns a confirmation. Run needs_human() with a low-confidence hypothesis and confirm it returns True; run page_human() against a PagerDuty test service and confirm an escalation incident is created.',
            },
          ],
          goFurther: 'Add a per-service rate limit on auto-remediations (e.g. max 2 auto-restarts per hour) so a flapping service can\'t get stuck in an automated restart loop. 🛠️🛠️',
        },
        {
          number: 4,
          title: 'Generate the incident timeline and postmortem',
          time: '50 min',
          description: 'Tie the whole pipeline together and produce a blameless postmortem once the incident resolves.',
          steps: [
            {
              instruction: 'Ask Claude to write postmortem.py with a draft_postmortem function, and main.py with a handle_incident function chaining the whole pipeline.',
              prompt: 'Write postmortem.py and main.py for an incident response agent.\n\n1) postmortem.py using the anthropic Python SDK with draft_postmortem(incident, timeline, root_cause, remediation_taken) that sends Claude (claude-sonnet-4-5, max_tokens=800) the incident title, timeline of events, diagnosed root cause, and remediation taken, asking it to write a BLAMELESS postmortem with sections: Summary, Timeline, Root Cause, Resolution, and Action Items (3-5 concrete follow-ups to prevent recurrence). Returns the response text.\n\nAdd a comment that "blameless" must be stated explicitly in the prompt — without it, generated postmortems sometimes phrase action items in ways that read as assigning fault to individuals.\n\n2) main.py with async def handle_incident(incident) that:\n- Builds a timeline list starting with the incident.triggered event\n- Calls get_recent_logs(), get_metrics(), and get_recent_deploys() for the affected service\n- Calls diagnose_incident() to get ranked hypotheses, appending a "diagnosis complete" entry to the timeline\n- Takes the top hypothesis: if needs_human(hypotheses), calls page_human() and appends "escalated to human" to the timeline; otherwise calls execute_remediation() and appends the remediation result to the timeline\n- Posts the timeline to a Slack incident channel via a Slack webhook\n- Once the incident is marked resolved (assume a separate trigger), calls draft_postmortem() with the full timeline and posts the draft to Slack for the team to review',
              verify: 'Trigger handle_incident() with a sample incident and confirm the full chain runs: logs/metrics/deploys are fetched, a diagnosis is produced, either a remediation executes or a human is paged, and the timeline is posted to Slack. Once "resolved", confirm draft_postmortem() produces all five required sections with action items phrased without blame.',
            },
          ],
          goFurther: 'Store every incident\'s timeline, diagnosis, and postmortem in a searchable history so future diagnose_incident() calls can reference "similar past incidents" as additional evidence. 🛠️🛠️🛠️',
        },
      ],
      portfolio: 'Add this to your portfolio as "Autonomous Incident Response Agent" — a top-tier project for SRE, DevOps, or platform engineering roles. Show the webhook receiving an incident, a Claude diagnosis with cited evidence, an auto-executed remediation, and a generated postmortem.',
      portfolioPrompt: 'Help me write a portfolio entry and a LinkedIn post for a project I just built: an Autonomous Incident Response Agent. It receives PagerDuty incident webhooks via FastAPI, automatically pulls relevant logs, metrics, and recent deploy history for the affected service, and has Claude generate ranked root-cause hypotheses — each with a confidence score, evidence cited from the actual data, a suggested remediation, and a risk level. Low-risk remediations (like restarting or scaling a service) on a small allowlist execute automatically; anything riskier or low-confidence pages a human via PagerDuty instead. The whole incident timeline is posted to Slack, and once resolved, Claude drafts a blameless postmortem with concrete action items. Write:\n1. A 3-4 sentence portfolio project description emphasizing safe, evidence-grounded automation for on-call response\n2. A LinkedIn post (under 150 words) for an SRE / DevOps / platform engineering audience\n3. Two resume bullet points quantifying mean-time-to-resolution (MTTR) improvement and on-call burden reduction',
    },
    steps: [
      {
        number: 1,
        title: 'Receive PagerDuty webhooks',
        description: 'Build a FastAPI endpoint that receives incident.triggered events from PagerDuty.',
        code: `# webhook.py
from fastapi import FastAPI, Request

app = FastAPI()

@app.post("/pagerduty-webhook")
async def pagerduty_webhook(request: Request):
    payload = await request.json()
    for event in payload.get("messages", []):
        if event["event"] == "incident.triggered":
            incident = event["incident"]
            await handle_incident(incident)
    return {"ok": True}`,
        tip: 'Configure this endpoint as a PagerDuty Generic V3 Webhook subscription scoped to "Incidents" — verify the webhook signature in production.',
      },
      {
        number: 2,
        title: 'Pull recent logs and metrics',
        description: 'Query your logging/metrics backend for the affected service around the incident timestamp.',
        code: `# observability.py
import requests

def get_recent_logs(service, since_minutes=15):
    resp = requests.get("https://logs.yourapp.com/api/query", params={
        "query": f'service:"{service}" level:error', "from": f"now-{since_minutes}m",
    }, headers={"Authorization": "Bearer LOGS_API_KEY"})
    return resp.json()["results"]

def get_metrics(service, metric="error_rate", since_minutes=30):
    resp = requests.get("https://metrics.yourapp.com/api/query", params={
        "query": f'{metric}{{service="{service}"}}', "start": f"-{since_minutes}m",
    }, headers={"Authorization": "Bearer METRICS_API_KEY"})
    return resp.json()["data"]`,
        tip: 'Pull both logs (what happened) and metrics (how bad/widespread) — root-cause hypotheses grounded in only one of these are usually wrong.',
      },
      {
        number: 3,
        title: 'Correlate with recent deploys',
        description: 'Check your deployment history for any deploys to the affected service in the last hour.',
        code: `# deploys.py
def get_recent_deploys(service, since_minutes=60):
    resp = requests.get(f"https://api.github.com/repos/yourorg/{service}/deployments",
        headers={"Authorization": "Bearer GITHUB_TOKEN"}, params={"per_page": 5})
    deploys = resp.json()
    cutoff = datetime.utcnow() - timedelta(minutes=since_minutes)
    return [d for d in deploys if datetime.fromisoformat(d["created_at"].rstrip("Z")) > cutoff]`,
        tip: 'A deploy in the last 30-60 minutes correlated with an incident start time is the single highest-value piece of context for root-causing.',
      },
      {
        number: 4,
        title: 'Build the root-cause hypothesis generator',
        description: 'Send logs, metrics, and deploy history to Claude and ask for a ranked list of root-cause hypotheses.',
        code: `# diagnose.py
from anthropic import Anthropic
import json

ai = Anthropic()

def diagnose_incident(incident, logs, metrics, recent_deploys):
    prompt = f"""Incident: {incident['title']} on service {incident['service']['summary']}

Recent error logs (sample): {logs[:10]}
Metrics trend: {metrics}
Recent deploys: {recent_deploys}

Provide 1-3 ranked root-cause hypotheses with confidence (0-1) and supporting evidence
from the data above. For each, suggest a remediation action.

Return JSON: {{"hypotheses": [{{"cause": "...", "confidence": 0.0, "evidence": "...",
"remediation": "...", "remediation_risk": "low/medium/high"}}]}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=1000,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)["hypotheses"]`,
        tip: 'Always require "evidence" tied to specific log lines or metric values — this prevents Claude from generating plausible-sounding but ungrounded theories.',
      },
      {
        number: 5,
        title: 'Define the safe-action allowlist',
        description: 'Define which remediation actions can be executed automatically vs. require human approval.',
        code: `# allowlist.py
SAFE_ACTIONS = {
    "restart_service": {"risk": "low", "function": "restart_service"},
    "scale_up": {"risk": "low", "function": "scale_service"},
    "rollback_deploy": {"risk": "medium", "function": "rollback_deploy"},  # requires approval
    "clear_cache": {"risk": "low", "function": "clear_cache"},
}

def is_auto_executable(action_name):
    action = SAFE_ACTIONS.get(action_name)
    return action is not None and action["risk"] == "low"`,
        tip: 'Start with an extremely small allowlist (restart + scale only) — expand it only after you trust the diagnosis quality over many real incidents.',
      },
      {
        number: 6,
        title: 'Execute safe remediations',
        description: 'For low-risk recommended actions, execute them automatically and record the action taken.',
        code: `# remediate.py
def restart_service(service_name):
    requests.post(f"https://api.yourapp.com/services/{service_name}/restart",
        headers={"Authorization": "Bearer DEPLOY_API_KEY"})
    return f"Restarted {service_name}"

def scale_service(service_name, replicas=None):
    current = get_current_replicas(service_name)
    target = replicas or current + 2
    requests.post(f"https://api.yourapp.com/services/{service_name}/scale",
        json={"replicas": target}, headers={"Authorization": "Bearer DEPLOY_API_KEY"})
    return f"Scaled {service_name} from {current} to {target} replicas"

def execute_remediation(hypothesis, service_name):
    action_name = map_remediation_to_action(hypothesis["remediation"])
    if is_auto_executable(action_name):
        fn = globals()[SAFE_ACTIONS[action_name]["function"]]
        return fn(service_name)
    return None  # requires human approval`,
        tip: 'Always log the exact API call made for remediation, including before/after state — this becomes critical evidence during the postmortem.',
      },
      {
        number: 7,
        title: 'Page a human for high-risk cases',
        description: 'For medium/high-risk remediations or low-confidence diagnoses, escalate via PagerDuty to a human.',
        code: `# escalate.py
def page_human(incident_id, reason, hypotheses):
    requests.post("https://api.pagerduty.com/incidents",
        headers={"Authorization": "Token token=PAGERDUTY_API_KEY", "Content-Type": "application/json"},
        json={"incident": {"type": "incident", "title": f"AI escalation: {reason}",
              "service": {"id": incident_id, "type": "service_reference"},
              "body": {"type": "incident_body", "details": json.dumps(hypotheses)}}})

def needs_human(hypotheses):
    top = hypotheses[0]
    return top["confidence"] < 0.6 or top["remediation_risk"] != "low"`,
        tip: 'A confidence threshold of 0.6 is conservative on purpose — false-positive automated remediations during an active incident can make things worse, not better.',
      },
      {
        number: 8,
        title: 'Generate incident timeline and postmortem draft',
        description: 'After the incident resolves, compile a timeline of all events and actions, and ask Claude to draft a postmortem.',
        code: `# postmortem.py
def draft_postmortem(incident, timeline, root_cause, remediation_taken):
    prompt = f"""Incident: {incident['title']}
Timeline of events: {timeline}
Diagnosed root cause: {root_cause}
Remediation taken: {remediation_taken}

Write a blameless postmortem with sections: Summary, Timeline, Root Cause,
Resolution, Action Items (3-5 concrete follow-ups to prevent recurrence)."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=800,
        messages=[{"role": "user", "content": prompt}]).content[0].text`,
        tip: '"Blameless" must be explicit in the prompt — without it, generated postmortems sometimes phrase action items in ways that read as assigning fault to individuals.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Autonomous Incident Response Agent (starter)
Run: pip install fastapi uvicorn anthropic requests
"""
from fastapi import FastAPI, Request
from anthropic import Anthropic
import json

app = FastAPI()
ai = Anthropic()

def diagnose(incident_title, service, sample_logs):
    prompt = f"""Incident: {incident_title} on {service}
Sample error logs: {sample_logs}

Provide a top root-cause hypothesis with confidence (0-1) and a suggested remediation.
Return JSON: {{"cause":"...", "confidence":0.0, "remediation":"...", "remediation_risk":"low/medium/high"}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=300,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)

@app.post("/pagerduty-webhook")
async def webhook(request: Request):
    payload = await request.json()
    incident = payload["messages"][0]["incident"]
    diagnosis = diagnose(incident["title"], incident["service"]["summary"], ["ERROR: connection timeout to db"])
    return diagnosis
`,
    resources: [
      { title: 'PagerDuty Events API', url: 'https://developer.pagerduty.com/docs/events-api-v2/overview/' },
      { title: 'PagerDuty Webhooks', url: 'https://developer.pagerduty.com/docs/webhooks/' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 40,
    title: 'AI Product Launch Orchestrator',
    emoji: '🚀',
    department: ['Strategy', 'Marketing'],
    departmentIds: ['strategy', 'marketing'],
    difficulty: 'World Class',
    description:
      'Coordinates an entire product launch — generating positioning, creating visual assets with DALL-E, writing all launch copy, scheduling across channels, and tracking launch-day metrics in real time.',
    whatYouBuild:
      'An end-to-end launch orchestrator that takes a product brief, generates positioning and messaging, creates launch visuals with DALL-E, writes copy for every channel (landing page, email, social, press release), assembles a launch-day timeline with dependencies, schedules all assets, and on launch day pulls real-time metrics (signups, traffic, social engagement) into a live war-room dashboard with Claude-generated hourly summaries.',
    whatYouLearn: [
      'Generate product positioning and messaging frameworks',
      'Create on-brand visual assets programmatically with DALL-E',
      'Write consistent copy across many channels from one core message',
      'Build a launch timeline with task dependencies',
      'Aggregate real-time metrics from multiple sources during a live event',
      'Generate automated hourly status summaries during launch day',
    ],
    techStack: ['Python', 'Claude API', 'DALL-E', 'Mailchimp API', 'Streamlit'],
    buildTime: '10 hrs',
    xp: 1400,
    popularity: 86,
    prerequisites: ['Completed Automated Marketing Campaign Manager', 'Completed Social Media Command Center'],
    tags: ['product-launch', 'multi-channel', 'orchestration', 'dalle'],
    session: {
      totalTime: '220 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Positioning, key messages, and target segments generated from a product brief',
        'On-brand DALL-E hero images and consistent copy across landing page, email, social, and press release',
        'A launch timeline with dependencies, and assets scheduled into Mailchimp and a social scheduler',
        'A live launch-day war-room dashboard pulling real-time metrics with Claude-generated hourly summaries',
      ],
      whatYouNeed: [
        'Python installed locally',
        'An Anthropic API key (console.anthropic.com) and an OpenAI API key (for DALL-E)',
        'pip install anthropic openai streamlit',
        'Mailchimp API access, a social scheduling API (e.g. Buffer), and access to analytics/social engagement APIs',
      ],
      builds: [
        {
          number: 1,
          title: 'Generate positioning, messaging, and launch visuals',
          time: '50 min',
          description: 'Turn a product brief into a positioning framework, then generate on-brand hero images from it.',
          steps: [
            {
              instruction: 'Ask Claude to write positioning.py with a generate_positioning function, and visuals.py with a generate_hero_image function.',
              prompt: 'Write two Python files for a product launch orchestrator.\n\n1) positioning.py using the anthropic Python SDK with generate_positioning(brief) that sends Claude (claude-sonnet-4-5, max_tokens=800) the product brief and asks it to generate: 1) a one-sentence positioning statement, 2) three key messages each with a supporting proof point, and 3) two target audience segments each with a primary pain point. Request JSON: {"positioning": "...", "key_messages": [{"message": "...", "proof": "..."}], "segments": [{"name": "...", "pain_point": "..."}]}. Parse and return the JSON.\n\nAdd a comment that everything generated in later steps should reference these key_messages explicitly — that\'s what keeps dozens of launch assets consistent.\n\n2) visuals.py using the openai Python SDK with generate_hero_image(product_name, style_guide, prompt_extra="") that builds a prompt "A clean, modern hero image for \'{product_name}\'. Style: {style_guide}. {prompt_extra}" and calls openai.images.generate(model="dall-e-3", prompt=prompt, size="1792x1024", n=1), returning resp.data[0].url.\n\nAdd a comment that keeping a written style_guide string (e.g. "minimalist, blue/purple gradient, no text in image") works far better than vague aesthetic requests — DALL-E follows explicit style constraints much more reliably.',
              verify: 'Run generate_positioning() on a sample product brief and confirm positioning, 3 key_messages with proofs, and 2 segments are all populated. Run generate_hero_image() with a style guide and confirm it returns a valid image URL.',
            },
          ],
          goFurther: 'Generate 2-3 hero image variations per request and have a Claude call pick the one that best matches the style guide and positioning. 🛠️🛠️',
        },
        {
          number: 2,
          title: 'Generate channel-specific copy from one core message',
          time: '50 min',
          description: 'Write consistent landing page, email, social, and press release copy — all rooted in the same positioning.',
          steps: [
            {
              instruction: 'Ask Claude to write copy.py with a CHANNELS dict and write_channel_copy function.',
              prompt: 'Write copy.py for a product launch orchestrator using the anthropic Python SDK.\n\nDefine CHANNELS = {\n  "landing_page": "a hero headline, subheadline, and 3 feature bullets",\n  "launch_email": "a subject line, preview text, and 200-word body with CTA",\n  "social_posts": "3 social posts (LinkedIn, Twitter, Instagram caption)",\n  "press_release": "a 300-word press release in AP style with a quote from the CEO"\n}\n\nThen write_channel_copy(channel, positioning, key_messages) that sends Claude (claude-sonnet-4-5, max_tokens=800) the positioning, key_messages, and CHANNELS[channel] description, asking it to write that content for the product launch, using the key messages as the foundation but adapting tone and length for the channel. Returns the response text.\n\nAdd a comment that the press release should be generated LAST, with the landing page copy fed in as additional context — press releases benefit from referencing the same exact feature names and phrasing used elsewhere.',
              verify: 'Run write_channel_copy() for "landing_page", then for "press_release" passing the landing page copy as extra context, and confirm both reference the same key messages and feature names consistently.',
            },
          ],
          goFurther: 'Add a consistency-check pass: send all generated channel copy together to Claude and ask it to flag any contradictions or inconsistent claims across channels. 🛠️🛠️🛠️',
        },
        {
          number: 3,
          title: 'Build the launch timeline and schedule assets',
          time: '45 min',
          description: 'Generate a dependency-aware launch timeline, then push email and social copy into your scheduling tools.',
          steps: [
            {
              instruction: 'Ask Claude to write timeline.py with a generate_launch_timeline function, and schedule.py with a schedule_launch_assets function.',
              prompt: 'Write two Python files for a product launch orchestrator.\n\n1) timeline.py using the anthropic Python SDK with generate_launch_timeline(launch_date, channels_ready) that sends Claude (claude-sonnet-4-5, max_tokens=1000) the launch date and which assets are ready, asking it to generate a launch timeline covering the 5 days before launch through launch day, with tasks, owner_role (a role, not a person\'s name), dependencies (depends_on as a list), and day offsets. Request JSON: {"tasks": [{"day": -5, "task": "...", "owner_role": "...", "depends_on": []}]}. Parse and return the tasks list.\n\nAdd a comment that using day offsets (-5 to 0) rather than absolute dates makes the generated template reusable for future launches.\n\n2) schedule.py with schedule_launch_assets(email_copy, social_posts, launch_datetime) that calls schedule_email(email_copy, send_time=launch_datetime.isoformat()) (assume it exists), then for each post in social_posts, computes a staggered send time (launch_datetime + i*30 minutes using timedelta) and calls schedule_social_post(post, scheduled_at=scheduled_at.timestamp()) (assume it exists).\n\nAdd a comment that staggering social posts by 20-30 minutes matters — posting everything at the exact same second looks automated and the posts compete with each other for engagement.',
              verify: 'Run generate_launch_timeline() and confirm tasks span day -5 through day 0 with owner_role and depends_on populated for each. Run schedule_launch_assets() with 3 social posts and confirm each is scheduled 30 minutes apart from launch_datetime.',
            },
          ],
          goFurther: 'Add a validate_timeline() function that checks for dependency cycles or tasks whose depends_on references a task scheduled later in the timeline. 🛠️🛠️',
        },
        {
          number: 4,
          title: 'Build the metrics aggregator and live war-room dashboard',
          time: '55 min',
          description: 'Pull launch-day metrics from multiple sources, summarize them hourly with Claude, and surface everything live.',
          steps: [
            {
              instruction: 'Ask Claude to write metrics.py with collect_launch_metrics, status.py with generate_hourly_summary, and dashboard.py as a Streamlit war-room view.',
              prompt: 'Write three Python files for a product launch orchestrator.\n\n1) metrics.py with collect_launch_metrics() that returns a dict: {"signups_last_hour": get_signups_count(window_minutes=60), "traffic_last_hour": get_analytics_pageviews(window_minutes=60), "social_engagement": {"twitter": get_twitter_engagement(), "linkedin": get_linkedin_engagement()}} (assume all the get_* functions exist).\n\nAdd a comment that this should be called on a fixed cadence (e.g. every 15 minutes) with snapshots stored over time — this gives a time series for the postmortem, not just point-in-time numbers.\n\n2) status.py using the anthropic Python SDK with generate_hourly_summary(metrics_history, expectations) that sends Claude (claude-sonnet-4-5, max_tokens=200) the metrics history over time and pre-launch expectations, asking for a 3-sentence hourly status update covering: how performance tracks vs. expectations, any notable spike/drop, and one recommended action if off-track. Returns the response text.\n\nAdd a comment that explicit pre-launch "expectations" (e.g. "200 signups in first 4 hours") must be set before launch day — without a baseline, Claude can\'t meaningfully assess "on track".\n\n3) dashboard.py using streamlit, titled "🚀 Launch Day War Room", that: calls collect_launch_metrics() and displays signups_last_hour and traffic_last_hour as st.metric, displays generate_hourly_summary(load_metrics_history(), LAUNCH_EXPECTATIONS) (assume these exist) under an "Hourly Summary" subheader, and under "Remaining Tasks" lists each incomplete task from load_timeline() (assume it exists) as an st.checkbox.',
              verify: 'Run collect_launch_metrics() and confirm all metric fields are populated. Run generate_hourly_summary() with a sample history and expectations and confirm it returns exactly 3 sentences including a recommendation. Run `streamlit run dashboard.py` and confirm metrics, summary, and remaining tasks all render.',
            },
          ],
          goFurther: 'Add a Slack integration that posts the hourly summary automatically to a #launch-day channel, so the team doesn\'t need to keep the dashboard open. 🛠️',
        },
      ],
      portfolio: 'Add this to your portfolio as "AI Product Launch Orchestrator" — a flagship project for product marketing, growth, or marketing operations roles. Show the positioning output, a generated hero image, channel copy for 2-3 channels, and the live war-room dashboard.',
      portfolioPrompt: 'Help me write a portfolio entry and a LinkedIn post for a project I just built: an AI Product Launch Orchestrator. From a single product brief, it generates a positioning statement, key messages with proof points, and target audience segments, then creates on-brand DALL-E hero images and writes consistent copy across the landing page, launch email, social posts, and press release — all rooted in the same key messages. It builds a 5-day launch timeline with task dependencies and owner roles, schedules email and social assets with staggered send times, and on launch day aggregates signups, traffic, and social engagement into a live Streamlit war-room dashboard with Claude-generated hourly status summaries. Write:\n1. A 3-4 sentence portfolio project description emphasizing end-to-end launch consistency and automation\n2. A LinkedIn post (under 150 words) for a product marketing / growth audience\n3. Two resume bullet points quantifying launch prep time saved and cross-channel consistency',
    },
    steps: [
      {
        number: 1,
        title: 'Generate positioning and messaging',
        description: 'From a product brief, generate a positioning statement, key messages, and target audience segments.',
        code: `# positioning.py
from anthropic import Anthropic
import json

ai = Anthropic()

def generate_positioning(brief):
    prompt = f"""Product brief: {brief}

Generate: 1) a one-sentence positioning statement, 2) three key messages (each with
a supporting proof point), 3) two target audience segments with their primary pain point.

Return JSON: {{"positioning": "...", "key_messages": [{{"message":"...", "proof":"..."}}],
"segments": [{{"name":"...", "pain_point":"..."}}]}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=800,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)`,
        tip: 'Everything generated in later steps should reference these key_messages explicitly — it’s what keeps dozens of launch assets consistent.',
      },
      {
        number: 2,
        title: 'Generate launch visuals with DALL-E',
        description: 'Generate hero images and social graphics based on the product’s positioning and visual style guide.',
        code: `# visuals.py
import openai

def generate_hero_image(product_name, style_guide, prompt_extra=""):
    prompt = f"A clean, modern hero image for '{product_name}'. Style: {style_guide}. {prompt_extra}"
    resp = openai.images.generate(model="dall-e-3", prompt=prompt, size="1792x1024", n=1)
    return resp.data[0].url`,
        tip: 'Keep a written style_guide string ("minimalist, blue/purple gradient, no text in image") — DALL-E follows explicit style constraints far better than vague aesthetic requests.',
      },
      {
        number: 3,
        title: 'Generate channel-specific copy',
        description: 'Write landing page copy, launch email, social posts, and a press release — all derived from the same positioning.',
        code: `# copy.py
CHANNELS = {
    "landing_page": "a hero headline, subheadline, and 3 feature bullets",
    "launch_email": "a subject line, preview text, and 200-word body with CTA",
    "social_posts": "3 social posts (LinkedIn, Twitter, Instagram caption)",
    "press_release": "a 300-word press release in AP style with a quote from the CEO",
}

def write_channel_copy(channel, positioning, key_messages):
    prompt = f"""Positioning: {positioning}
Key messages: {key_messages}

Write {CHANNELS[channel]} for our product launch. Use the key messages as the
foundation but adapt tone and length for this channel."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=800,
        messages=[{"role": "user", "content": prompt}]).content[0].text`,
        tip: 'Generate the press release last and feed it the landing page copy as additional context — press releases benefit from referencing the same exact feature names/phrasing.',
      },
      {
        number: 4,
        title: 'Build the launch timeline',
        description: 'Generate a task list with dependencies and timing for the week leading up to and including launch day.',
        code: `# timeline.py
def generate_launch_timeline(launch_date, channels_ready):
    prompt = f"""Launch date: {launch_date}. Assets ready: {channels_ready}.

Generate a launch timeline for the 5 days before launch through launch day,
with tasks, owners (role, not name), dependencies, and due times.

Return JSON: {{"tasks": [{{"day": -5, "task": "...", "owner_role": "...", "depends_on": []}}]}}"""
    import json
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=1000,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)["tasks"]`,
        tip: 'Use day offsets (-5 to 0) rather than absolute dates in the generated plan — it makes the template reusable for future launches.',
      },
      {
        number: 5,
        title: 'Schedule assets across channels',
        description: 'Push the generated email and social copy into Mailchimp and your social scheduler for launch-day delivery.',
        code: `# schedule.py
def schedule_launch_assets(email_copy, social_posts, launch_datetime):
    schedule_email(email_copy, send_time=launch_datetime.isoformat())
    for i, post in enumerate(social_posts):
        scheduled_at = launch_datetime + timedelta(minutes=i * 30)  # stagger posts
        schedule_social_post(post, scheduled_at=scheduled_at.timestamp())`,
        tip: 'Stagger social posts by 20-30 minutes — posting everything at the exact same second looks automated and competes with itself for engagement.',
      },
      {
        number: 6,
        title: 'Build the metrics aggregator',
        description: 'On launch day, pull signups, website traffic, and social engagement from multiple sources into one place.',
        code: `# metrics.py
def collect_launch_metrics():
    return {
        "signups_last_hour": get_signups_count(window_minutes=60),
        "traffic_last_hour": get_analytics_pageviews(window_minutes=60),
        "social_engagement": {
            "twitter": get_twitter_engagement(),
            "linkedin": get_linkedin_engagement(),
        },
    }`,
        tip: 'Pull on a fixed cadence (e.g. every 15 minutes) and store snapshots — this gives you a time series for the postmortem, not just point-in-time numbers.',
      },
      {
        number: 7,
        title: 'Generate hourly status summaries',
        description: 'Every hour, ask Claude to summarize launch performance vs. expectations and flag anything needing attention.',
        code: `# status.py
def generate_hourly_summary(metrics_history, expectations):
    prompt = f"""Launch metrics over time: {metrics_history}
Pre-launch expectations: {expectations}

Write a 3-sentence hourly status update: how we're tracking vs. expectations,
any notable spike/drop, and one recommended action if performance is off-track."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=200,
        messages=[{"role": "user", "content": prompt}]).content[0].text`,
        tip: 'Set explicit "expectations" before launch day (e.g. "200 signups in first 4 hours") — without a baseline, Claude can’t meaningfully assess "on track".',
      },
      {
        number: 8,
        title: 'Build the live war-room dashboard',
        description: 'A Streamlit dashboard showing the metrics time series, hourly summaries, and remaining timeline tasks.',
        code: `# dashboard.py
import streamlit as st

st.title("🚀 Launch Day War Room")

metrics = collect_launch_metrics()
st.metric("Signups (last hour)", metrics["signups_last_hour"])
st.metric("Traffic (last hour)", metrics["traffic_last_hour"])

st.subheader("Hourly Summary")
st.write(generate_hourly_summary(load_metrics_history(), LAUNCH_EXPECTATIONS))

st.subheader("Remaining Tasks")
for task in [t for t in load_timeline() if not t["done"]]:
    st.checkbox(task["task"], key=task["task"])`,
        tip: 'Pin this dashboard on a shared screen during launch day — it becomes the team’s single source of truth and reduces "how are we doing?" Slack messages.',
      },
    ],
    starterCode: `"""
AgentForge Academy — AI Product Launch Orchestrator (starter)
Run: pip install anthropic openai
"""
import json
from anthropic import Anthropic

ai = Anthropic()

def generate_positioning(brief):
    prompt = f"""Product brief: {brief}
Generate a positioning statement and 3 key messages with proof points.
Return JSON: {{"positioning":"...", "key_messages":[{{"message":"...","proof":"..."}}]}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=500,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)

def write_landing_page_copy(positioning, key_messages):
    prompt = f"""Positioning: {positioning}\\nKey messages: {key_messages}
Write a hero headline, subheadline, and 3 feature bullets for the landing page."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=400,
        messages=[{"role": "user", "content": prompt}]).content[0].text

if __name__ == "__main__":
    pos = generate_positioning("AgentForge Academy: an interactive platform teaching developers to build AI agents.")
    print(write_landing_page_copy(pos["positioning"], pos["key_messages"]))
`,
    resources: [
      { title: 'OpenAI Images API (DALL-E)', url: 'https://platform.openai.com/docs/guides/images' },
      { title: 'Mailchimp Marketing API', url: 'https://mailchimp.com/developer/marketing/api/' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 41,
    title: 'Smart Factory IoT Operations Agent',
    emoji: '🏭',
    department: ['Operations'],
    departmentIds: ['operations'],
    difficulty: 'World Class',
    description:
      'Monitors a network of IoT sensors across factory equipment, predicts maintenance needs before failures occur, and coordinates technician scheduling automatically.',
    whatYouBuild:
      'A predictive maintenance agent that ingests real-time sensor streams (temperature, vibration, pressure) from factory equipment via Redis, applies anomaly detection to spot early failure signatures, asks Claude to interpret sensor patterns alongside equipment maintenance history to estimate remaining useful life, automatically creates work orders for at-risk equipment, and schedules technicians based on skill match and urgency.',
    whatYouLearn: [
      'Ingest and buffer real-time IoT sensor streams',
      'Apply rolling anomaly detection to time-series sensor data',
      'Combine sensor patterns with maintenance history for failure prediction',
      'Generate work orders automatically from predictions',
      'Build a constraint-based technician scheduling algorithm',
      'Design alerting thresholds that minimize false alarms',
    ],
    techStack: ['Python', 'IoT APIs', 'Redis', 'Claude API', 'pandas'],
    buildTime: '9.5 hrs',
    xp: 1350,
    popularity: 74,
    prerequisites: ['Completed Inventory & Supply Chain Optimization Agent', 'Completed Fraud Detection Agent', 'Redis installed'],
    tags: ['iot', 'manufacturing', 'predictive-maintenance', 'operations'],
    session: {
      totalTime: '220 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'A Redis-backed pipeline ingesting real-time MQTT sensor streams with bounded rolling windows',
        'Rolling anomaly detection per equipment/metric, and a Claude interpreter estimating remaining useful life and urgency',
        'Automatic work order creation and skill/workload-based technician matching and scheduling',
        'A false-alarm feedback loop that tunes alert thresholds, plus a live operations dashboard',
      ],
      whatYouNeed: [
        'Python installed locally',
        'An Anthropic API key (console.anthropic.com)',
        'pip install redis numpy anthropic streamlit paho-mqtt pandas',
        'Redis installed and running, access to an MQTT broker carrying factory sensor data, and a maintenance work-order API',
      ],
      builds: [
        {
          number: 1,
          title: 'Ingest sensor streams and detect anomalies',
          time: '50 min',
          description: 'Buffer real-time sensor readings in Redis and flag readings that deviate from the rolling baseline.',
          steps: [
            {
              instruction: 'Ask Claude to write ingest.py with an MQTT-to-Redis ingestion loop, and anomaly.py with a detect_anomaly function.',
              prompt: 'Write two Python files for an IoT predictive maintenance agent.\n\n1) ingest.py using paho.mqtt.client and redis, with r = redis.Redis() and an on_message(client, userdata, msg) callback that:\n- Parses msg.payload as JSON into a reading dict with equipment_id, metric, value, and timestamp\n- Builds key = f"sensor:{reading[\'equipment_id\']}:{reading[\'metric\']}"\n- Calls r.zadd(key, {json.dumps(reading): reading["timestamp"]})\n- Calls r.zremrangebyrank(key, 0, -1001) to keep only the last 1000 readings\nThen creates an mqtt.Client(), sets on_message, connects to "mqtt.factory.local" port 1883, subscribes to "sensors/+/+", and calls loop_forever().\n\nAdd a comment that Redis sorted sets keyed by timestamp give an efficient rolling window, and ZREMRANGEBYRANK keeps memory bounded automatically.\n\n2) anomaly.py using numpy with detect_anomaly(equipment_id, metric, window=100, std_threshold=3) that:\n- Reads the last `window` readings from r.zrange(f"sensor:{equipment_id}:{metric}", -window, -1), parsing each JSON entry\'s "value"\n- Returns None if fewer than window // 2 readings exist\n- Computes mean and std from all readings EXCEPT the latest one\n- Returns an anomaly dict {"equipment_id", "metric", "value", "mean", "std"} if the latest reading deviates from the mean by more than std_threshold * std (and std > 0), else None\n\nAdd a comment that excluding the latest reading from its own baseline matters — including it would dampen the very anomaly being detected.',
              verify: 'Simulate a sensor stream by publishing a few normal readings then one extreme value via MQTT, and confirm detect_anomaly() returns None for the normal readings and a populated anomaly dict for the extreme one.',
            },
          ],
          goFurther: 'Add a multi-metric anomaly check — e.g. temperature AND vibration both trending up together is a stronger failure signal than either alone. 🛠️🛠️',
        },
        {
          number: 2,
          title: 'Interpret anomalies and generate work orders',
          time: '50 min',
          description: 'Have Claude estimate remaining useful life from sensor and maintenance history, and auto-create work orders for at-risk equipment.',
          steps: [
            {
              instruction: 'Ask Claude to write interpret.py with an interpret_anomaly function, and work_orders.py with a create_work_order function.',
              prompt: 'Write two Python files for an IoT predictive maintenance agent.\n\n1) interpret.py using the anthropic Python SDK with interpret_anomaly(anomaly, recent_history, maintenance_history) that sends Claude (claude-sonnet-4-5, max_tokens=400) the anomaly details (equipment_id, metric, value, mean, std), recent sensor history, and maintenance history, asking whether this pattern suggests impending failure, and to estimate: remaining useful life (RUL) in days, the likely failure mode, and urgency (low/medium/high/critical). Request JSON: {"likely_failure_mode": "...", "estimated_rul_days": 0, "urgency": "...", "reasoning": "..."}. Parse and return the JSON.\n\nAdd a comment that maintenance history matters as much as sensor data — equipment serviced last week behaves very differently from equipment overdue for service.\n\n2) work_orders.py using requests with create_work_order(equipment_id, interpretation) that, if interpretation["urgency"] is "medium", "high", or "critical", POSTs to https://maintenance.factory.local/api/work-orders with JSON containing equipment_id, a title like f"Predicted issue: {interpretation[\'likely_failure_mode\']}", description=interpretation["reasoning"], priority=interpretation["urgency"], and estimated_rul_days=interpretation["estimated_rul_days"].\n\nAdd a comment that including estimated_rul_days in the work order tells the maintenance team how much slack they have to schedule around production needs.',
              verify: 'Run interpret_anomaly() on a sample anomaly with maintenance history showing the equipment is overdue for service, and confirm urgency is elevated and reasoning references the overdue maintenance. Run create_work_order() with a "high" urgency interpretation and confirm a work order POST is made; confirm "low" urgency does not create one.',
            },
          ],
          goFurther: 'Have interpret_anomaly() also suggest whether production should be slowed/stopped for this equipment before the work order is completed, for critical urgency cases. 🛠️🛠️',
        },
        {
          number: 3,
          title: 'Match technicians and schedule work orders',
          time: '40 min',
          description: 'Find the right technician for each work order based on skills and workload, and schedule the work within urgency-based deadlines.',
          steps: [
            {
              instruction: 'Ask Claude to write match.py with a match_technician function, and schedule.py with a schedule_work_order function.',
              prompt: 'Write two Python files for an IoT predictive maintenance agent.\n\n1) match.py with match_technician(work_order, technicians) that:\n- Looks up required_skill via map_failure_mode_to_skill(work_order["likely_failure_mode"]) (assume this is a small lookup-table function defined elsewhere)\n- Filters technicians to those who have required_skill in t["skills"] AND t["current_load"] < t["max_load"]\n- Returns None if no candidates, otherwise returns the candidate with the lowest current_load\n\nAdd a comment that map_failure_mode_to_skill should be a small, maintenance-lead-editable lookup table — failure modes map to skills more reliably via a curated table than via LLM guessing.\n\n2) schedule.py using datetime with schedule_work_order(work_order, technician, equipment_downtime_windows) that:\n- Defines urgency_to_max_delay = {"critical": 0, "high": 1, "medium": 3, "low": 7} (days)\n- Looks up max_delay for work_order["priority"]\n- Iterates equipment_downtime_windows, and for the first window where (window["start"] - datetime.utcnow()).days <= max_delay, calls book_technician(technician["id"], window["start"], work_order["id"]) (assume it exists) and returns its result\n- If no window qualifies, calls and returns escalate_scheduling_conflict(work_order, technician) (assume it exists)\n\nAdd a comment that critical urgency (max_delay=0) often means scheduling unplanned downtime, so escalate_scheduling_conflict must notify a production manager, not just the maintenance team.',
              verify: 'Run match_technician() with a work order whose required skill matches only one of several technicians, and confirm that technician (with lowest current_load among matches) is returned. Run schedule_work_order() with a "critical" work order and downtime windows all beyond max_delay=0, and confirm it calls escalate_scheduling_conflict().',
            },
          ],
          goFurther: 'Add a technician-side view that lets them accept/decline a scheduled work order, re-running match_technician() with that technician excluded on decline. 🛠️🛠️',
        },
        {
          number: 4,
          title: 'Tune alert thresholds and build the operations dashboard',
          time: '40 min',
          description: 'Reduce false alarms over time, and give plant managers one view of equipment health, work orders, and schedules.',
          steps: [
            {
              instruction: 'Ask Claude to write tune.py with record_alert_outcome and adjust_threshold functions, and dashboard.py as a Streamlit operations view.',
              prompt: 'Write two Python files for an IoT predictive maintenance agent.\n\n1) tune.py using redis, json, and time, sharing r = redis.Redis(), with:\n- record_alert_outcome(equipment_id, metric, was_real_issue) that appends {"was_real": was_real_issue, "timestamp": time.time()} (JSON-encoded) to a Redis list key f"alert_outcomes:{equipment_id}:{metric}" via r.rpush\n- adjust_threshold(equipment_id, metric, current_threshold) that reads the last 20 outcomes via r.lrange(..., -20, -1), returns current_threshold unchanged if fewer than 10 outcomes exist, otherwise computes false_alarm_rate = 1 - (sum of was_real / count), and returns current_threshold + 0.5 if false_alarm_rate > 0.5, else current_threshold unchanged\n\nAdd a comment that a false alarm rate above 50% causes "alert fatigue" — technicians start ignoring alerts entirely, which is far worse than missing one early warning.\n\n2) dashboard.py using streamlit, titled "Smart Factory Operations", with:\n- An "Equipment Health" subheader that iterates get_all_equipment() (assume it exists) and for each, shows a 🔴/🟡/🟢 status icon based on urgency (critical=red, high/medium=yellow, else green) along with the equipment name and estimated_rul_days\n- An "Active Work Orders" subheader that iterates get_active_work_orders() (assume it exists) and shows each work order\'s title, priority, and assigned technician (or "unassigned")\n\nAdd a comment that color-coding equipment status lets a plant manager scan dozens of machines in seconds — this should not be buried in a table.',
              verify: 'Call record_alert_outcome() 15 times with mostly was_real_issue=False, then adjust_threshold() and confirm it returns current_threshold + 0.5. Run `streamlit run dashboard.py` and confirm equipment health icons and active work orders render correctly.',
            },
          ],
          goFurther: 'Add a weekly report summarizing threshold adjustments per equipment/metric, so the maintenance lead can spot sensors that are chronically noisy and may need recalibration. 🛠️🛠️',
        },
      ],
      portfolio: 'Add this to your portfolio as "Smart Factory IoT Operations Agent" — an impressive project for manufacturing operations, industrial IoT, or applied ML roles. Show the anomaly detection in action, a Claude RUL interpretation, a generated work order, and the operations dashboard.',
      portfolioPrompt: 'Help me write a portfolio entry and a LinkedIn post for a project I just built: a Smart Factory IoT Operations Agent. It ingests real-time sensor streams (temperature, vibration, pressure) from factory equipment via MQTT into Redis, runs rolling anomaly detection per equipment/metric, and when an anomaly is found, has Claude combine sensor history with maintenance records to estimate remaining useful life, likely failure mode, and urgency. Medium-and-above urgency predictions automatically create work orders, which get matched to technicians by skill and workload and scheduled within urgency-based deadlines. A feedback loop tracks false-alarm rates and widens alert thresholds for chronically noisy sensors, and everything is visualized in a live operations dashboard. Write:\n1. A 3-4 sentence portfolio project description emphasizing predictive maintenance and reduced downtime\n2. A LinkedIn post (under 150 words) for a manufacturing operations / industrial IoT audience\n3. Two resume bullet points quantifying unplanned downtime reduction and technician utilization improvement',
    },
    steps: [
      {
        number: 1,
        title: 'Ingest sensor streams',
        description: 'Subscribe to MQTT topics from factory IoT sensors and buffer recent readings in Redis time-series structures.',
        code: `# ingest.py
import paho.mqtt.client as mqtt
import redis, json

r = redis.Redis()

def on_message(client, userdata, msg):
    reading = json.loads(msg.payload)
    key = f"sensor:{reading['equipment_id']}:{reading['metric']}"
    r.zadd(key, {json.dumps(reading): reading["timestamp"]})
    r.zremrangebyrank(key, 0, -1001)  # keep last 1000 readings

client = mqtt.Client()
client.on_message = on_message
client.connect("mqtt.factory.local", 1883)
client.subscribe("sensors/+/+")
client.loop_forever()`,
        tip: 'Redis sorted sets keyed by timestamp give you an efficient rolling window — ZREMRANGEBYRANK keeps memory bounded automatically.',
      },
      {
        number: 2,
        title: 'Build rolling anomaly detection',
        description: 'For each equipment/metric pair, detect readings outside a rolling mean ± N standard deviations.',
        code: `# anomaly.py
import numpy as np

def detect_anomaly(equipment_id, metric, window=100, std_threshold=3):
    key = f"sensor:{equipment_id}:{metric}"
    readings = [json.loads(x)["value"] for x in r.zrange(key, -window, -1)]
    if len(readings) < window // 2:
        return None
    mean, std = np.mean(readings[:-1]), np.std(readings[:-1])
    latest = readings[-1]
    if std > 0 and abs(latest - mean) > std_threshold * std:
        return {"equipment_id": equipment_id, "metric": metric, "value": latest, "mean": mean, "std": std}
    return None`,
        tip: 'Compute mean/std excluding the latest reading (readings[:-1]) — including it in its own baseline dampens the very anomaly you’re trying to detect.',
      },
      {
        number: 3,
        title: 'Build the failure pattern interpreter',
        description: 'When an anomaly is detected, send recent sensor history and equipment maintenance records to Claude for interpretation.',
        code: `# interpret.py
from anthropic import Anthropic
import json

ai = Anthropic()

def interpret_anomaly(anomaly, recent_history, maintenance_history):
    prompt = f"""Equipment {anomaly['equipment_id']} showed an anomalous {anomaly['metric']} reading:
{anomaly['value']} (normal range: {anomaly['mean']:.1f} ± {anomaly['std']:.1f})

Recent sensor history: {recent_history}
Maintenance history: {maintenance_history}

Does this pattern suggest impending failure? Estimate remaining useful life (RUL) in days,
likely failure mode, and urgency (low/medium/high/critical).

Return JSON: {{"likely_failure_mode": "...", "estimated_rul_days": 0, "urgency": "...", "reasoning": "..."}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=400,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)`,
        tip: 'Maintenance history matters as much as sensor data — equipment that was serviced last week behaves very differently from equipment overdue for service.',
      },
      {
        number: 4,
        title: 'Generate work orders',
        description: 'For medium+ urgency predictions, automatically create a work order with the diagnosis attached.',
        code: `# work_orders.py
import requests

def create_work_order(equipment_id, interpretation):
    if interpretation["urgency"] in ("medium", "high", "critical"):
        requests.post("https://maintenance.factory.local/api/work-orders", json={
            "equipment_id": equipment_id,
            "title": f"Predicted issue: {interpretation['likely_failure_mode']}",
            "description": interpretation["reasoning"],
            "priority": interpretation["urgency"],
            "estimated_rul_days": interpretation["estimated_rul_days"],
        })`,
        tip: 'Include estimated_rul_days in the work order title/description — it tells the maintenance team how much slack they have to schedule around production needs.',
      },
      {
        number: 5,
        title: 'Build the technician skill matcher',
        description: 'Match each work order to available technicians based on required skills and current workload.',
        code: `# match.py
def match_technician(work_order, technicians):
    required_skill = map_failure_mode_to_skill(work_order["likely_failure_mode"])
    candidates = [t for t in technicians if required_skill in t["skills"] and t["current_load"] < t["max_load"]]
    if not candidates:
        return None
    return min(candidates, key=lambda t: t["current_load"])`,
        tip: 'Maintain map_failure_mode_to_skill as a small lookup table your maintenance lead can edit — failure modes map to skills more reliably via a curated table than via LLM guessing.',
      },
      {
        number: 6,
        title: 'Build the scheduling optimizer',
        description: 'Schedule matched work orders into technician calendars, respecting urgency and equipment downtime windows.',
        code: `# schedule.py
def schedule_work_order(work_order, technician, equipment_downtime_windows):
    urgency_to_max_delay = {"critical": 0, "high": 1, "medium": 3, "low": 7}  # days
    max_delay = urgency_to_max_delay[work_order["priority"]]

    for window in equipment_downtime_windows:
        if (window["start"] - datetime.utcnow()).days <= max_delay:
            return book_technician(technician["id"], window["start"], work_order["id"])
    # No suitable downtime window within deadline — escalate
    return escalate_scheduling_conflict(work_order, technician)`,
        tip: 'Critical urgency (max_delay=0) often means scheduling unplanned downtime — make sure escalate_scheduling_conflict notifies a production manager, not just maintenance.',
      },
      {
        number: 7,
        title: 'Tune alert thresholds to reduce false alarms',
        description: 'Track the outcome of each anomaly alert (real issue vs. false alarm) and adjust per-equipment thresholds.',
        code: `# tune.py
def record_alert_outcome(equipment_id, metric, was_real_issue):
    key = f"alert_outcomes:{equipment_id}:{metric}"
    r.rpush(key, json.dumps({"was_real": was_real_issue, "timestamp": time.time()}))

def adjust_threshold(equipment_id, metric, current_threshold):
    outcomes = [json.loads(x) for x in r.lrange(f"alert_outcomes:{equipment_id}:{metric}", -20, -1)]
    if len(outcomes) < 10:
        return current_threshold
    false_alarm_rate = 1 - sum(o["was_real"] for o in outcomes) / len(outcomes)
    if false_alarm_rate > 0.5:
        return current_threshold + 0.5  # widen the band, fewer alerts
    return current_threshold`,
        tip: 'A false alarm rate above 50% causes "alert fatigue" — technicians start ignoring alerts entirely, which is far worse than missing one early warning.',
      },
      {
        number: 8,
        title: 'Build the operations dashboard',
        description: 'Show equipment health status, active work orders, and technician schedules in one view.',
        code: `# dashboard.py
import streamlit as st

st.title("Smart Factory Operations")

st.subheader("Equipment Health")
for eq in get_all_equipment():
    status = "🔴" if eq["urgency"] == "critical" else "🟡" if eq["urgency"] in ("high", "medium") else "🟢"
    st.write(f"{status} {eq['name']} — RUL: {eq.get('estimated_rul_days', 'N/A')} days")

st.subheader("Active Work Orders")
for wo in get_active_work_orders():
    st.write(f"**{wo['title']}** — {wo['priority']} — assigned to {wo.get('technician', 'unassigned')}")`,
        tip: 'Color-coding equipment status (red/yellow/green) lets a plant manager scan dozens of machines in seconds — don’t bury this in a table.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Smart Factory IoT Operations Agent (starter)
Run: pip install redis numpy anthropic
"""
import redis, json, numpy as np
from anthropic import Anthropic

r = redis.Redis()
ai = Anthropic()

def detect_anomaly(equipment_id, metric, readings, std_threshold=3):
    if len(readings) < 10:
        return None
    mean, std = np.mean(readings[:-1]), np.std(readings[:-1])
    latest = readings[-1]
    if std > 0 and abs(latest - mean) > std_threshold * std:
        return {"equipment_id": equipment_id, "metric": metric, "value": latest, "mean": mean, "std": std}
    return None

def interpret(anomaly):
    prompt = f"""Equipment {anomaly['equipment_id']}: {anomaly['metric']} = {anomaly['value']}
(normal: {anomaly['mean']:.1f} ± {anomaly['std']:.1f}).
Estimate urgency (low/medium/high/critical) and likely failure mode.
Return JSON: {{"likely_failure_mode":"...", "urgency":"..."}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=150,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)

if __name__ == "__main__":
    readings = [70, 71, 70, 72, 71, 70, 73, 71, 70, 95]  # spike at the end
    anomaly = detect_anomaly("press_01", "temperature", readings)
    if anomaly:
        print(interpret(anomaly))
`,
    resources: [
      { title: 'Eclipse Paho MQTT Python Client', url: 'https://eclipse.dev/paho/index.php?page=clients/python/index.php' },
      { title: 'Redis Documentation', url: 'https://redis.io/docs/latest/' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 42,
    title: 'Algorithmic Portfolio Rebalancing Agent',
    emoji: '⚖️',
    department: ['Finance'],
    departmentIds: ['finance'],
    difficulty: 'World Class',
    description:
      'Monitors a multi-asset portfolio against target allocations, calculates tax-aware rebalancing trades, and produces a Claude-written rationale for every recommended trade.',
    whatYouBuild:
      'A portfolio management agent that pulls current holdings and prices, compares actual vs. target allocations, computes the minimal set of trades needed to rebalance within a tolerance band while minimizing taxable events (tax-loss harvesting aware), checks each proposed trade against compliance rules, and asks Claude to write a plain-English rationale for the rebalancing recommendation that can be sent to the client for approval before any trade executes.',
    whatYouLearn: [
      'Compute portfolio drift from target allocations',
      'Generate a minimal rebalancing trade list within tolerance bands',
      'Implement basic tax-loss harvesting logic',
      'Apply compliance rule checks to proposed trades',
      'Generate client-facing rationale documents for financial recommendations',
      'Build an approval workflow before any trade execution',
    ],
    techStack: ['Python', 'pandas', 'Claude API', 'Stripe', 'SEC API'],
    buildTime: '9 hrs',
    xp: 1300,
    popularity: 71,
    prerequisites: ['Completed Autonomous Equity Research Agent', 'Basic portfolio theory knowledge'],
    tags: ['finance', 'portfolio', 'rebalancing', 'compliance'],
    session: {
      totalTime: '210 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Allocation drift computed from holdings and target allocations within a tolerance band',
        'Tax-loss harvesting candidates identified and prioritized in a minimal rebalancing trade list',
        'Compliance checks (restricted list, wash-sale, concentration) applied to every proposed trade',
        'A Claude-written client rationale and an approval workflow before any trade executes',
      ],
      whatYouNeed: [
        'Python installed locally',
        'An Anthropic API key (console.anthropic.com)',
        'pip install pandas anthropic schedule',
        'A holdings CSV (symbol, shares, price, asset_class, cost_basis) and a targets CSV (asset_class, target_pct), plus a custodian API for trade submission',
      ],
      builds: [
        {
          number: 1,
          title: 'Load the portfolio and compute allocation drift',
          time: '35 min',
          description: 'Load holdings and targets, then calculate how far the current allocation has drifted from target.',
          steps: [
            {
              instruction: 'Ask Claude to write load.py with a load_portfolio function, and drift.py with a compute_drift function.',
              prompt: 'Write two Python files for a portfolio rebalancing agent using pandas.\n\n1) load.py with load_portfolio(holdings_path, targets_path) that reads holdings from a CSV with columns symbol, shares, price, asset_class, cost_basis, adds a market_value = shares * price column, reads targets from a CSV with columns asset_class, target_pct, and returns (holdings, targets).\n\nAdd a comment that cost_basis should ideally be tracked per LOT, not just per symbol, because lot-level data is essential for accurate tax-loss harvesting — fetch lot-level data from the custodian API if it\'s available.\n\n2) drift.py with compute_drift(holdings, targets, tolerance=0.05) that computes total_value = holdings["market_value"].sum(), groups holdings by asset_class to get current allocation percentages, sets targets as the index by asset_class, adds current_pct and drift = current_pct - target_pct columns, adds needs_rebalance = drift.abs() > tolerance, and returns the result with reset_index().\n\nAdd a comment that a 5% tolerance band avoids constant small rebalancing trades that generate fees and taxes for negligible benefit.',
              verify: 'Run load_portfolio() with sample CSVs and confirm market_value is computed correctly. Run compute_drift() and confirm needs_rebalance is True only for asset classes whose drift exceeds the tolerance.',
            },
          ],
          goFurther: 'Add support for sub-asset-class targets (e.g. "US Large Cap" within "Equities") with a hierarchical drift calculation. 🛠️🛠️',
        },
        {
          number: 2,
          title: 'Find tax-loss harvesting candidates and compute the trade list',
          time: '50 min',
          description: 'Identify positions trading below cost basis, then build a minimal trade list that rebalances while prioritizing harvest opportunities.',
          steps: [
            {
              instruction: 'Ask Claude to write tax_loss.py with a find_harvest_candidates function, and trades.py with a compute_trades function.',
              prompt: 'Write two Python files for a portfolio rebalancing agent using pandas.\n\n1) tax_loss.py with find_harvest_candidates(holdings, min_loss=500) that computes unrealized_gain_loss = market_value - (shares * cost_basis) for each holding, filters to positions where unrealized_gain_loss < -min_loss, and returns the symbol, unrealized_gain_loss, and market_value columns for those candidates.\n\nAdd a comment that after harvesting a loss, the agent must avoid repurchasing the same security within 30 days (the IRS wash-sale rule) — this should be checked before generating buy orders.\n\n2) trades.py with compute_trades(drift_df, holdings, total_value, harvest_candidates) that iterates over rows of drift_df where needs_rebalance is True, computing target_value = target_pct * total_value, current_value = current_pct * total_value, and delta = target_value - current_value. If delta < 0 (need to sell from this asset class): find holdings in that asset_class, check if any are also in harvest_candidates, and if so sell that symbol (reason includes "tax-loss harvest"), otherwise sell the first holding in the asset class (reason "rebalance"). If delta >= 0, append a "buy" trade for that asset_class with amount=delta and reason="rebalance". Returns the list of trade dicts.\n\nAdd a comment that when selling to rebalance, preferring positions that are also tax-loss harvest candidates accomplishes two goals with one trade.',
              verify: 'Run find_harvest_candidates() on holdings with a known underwater position and confirm it appears with a negative unrealized_gain_loss. Run compute_trades() on a drift_df with one over-allocated and one under-allocated asset class, and confirm it produces a sell trade (preferring the harvest candidate if one exists) and a buy trade.',
            },
          ],
          goFurther: 'Add a constraint that no single trade exceeds X% of average daily trading volume for that symbol, to avoid moving illiquid securities\' prices. 🛠️🛠️🛠️',
        },
        {
          number: 3,
          title: 'Run compliance checks and generate the client rationale',
          time: '50 min',
          description: 'Screen every trade against compliance rules, then have Claude explain the recommendation in plain English.',
          steps: [
            {
              instruction: 'Ask Claude to write compliance.py with a check_compliance function, and rationale.py with a write_rationale function.',
              prompt: 'Write two Python files for a portfolio rebalancing agent.\n\n1) compliance.py with RESTRICTED_SYMBOLS = {"XYZ"} (placeholder for employee-restricted securities) and check_compliance(trade, holdings, recent_sales, max_concentration=0.25) that returns a list of issue strings:\n- Appends "Symbol is on restricted list" if trade.get("symbol") is in RESTRICTED_SYMBOLS\n- Appends "Potential wash sale: recently sold for a loss" if trade["action"] == "buy" and trade.get("symbol") is in the symbols of recent_sales where s["loss"] is true\nReturns issues (empty list means no problems).\n\nAdd a comment that RESTRICTED_SYMBOLS should be maintained as a PER-CLIENT list, not a global one — restrictions often come from the client\'s own employer\'s insider trading policies.\n\n2) rationale.py using the anthropic Python SDK with write_rationale(drift_df, trades, harvest_candidates) that sends Claude (claude-sonnet-4-5, max_tokens=600) the drift analysis (drift_df.to_dict(\'records\')), the recommended trades, and the tax-loss harvesting opportunities (harvest_candidates.to_dict(\'records\')), asking it to write a 3-paragraph client letter covering: 1) why rebalancing is recommended now, 2) what trades are proposed and why, 3) any tax benefits — in plain English with a reassuring tone, and explicitly noting that no trades will execute without the client\'s approval. Returns the response text.\n\nAdd a comment that including "no trades will execute without their approval" is both a compliance requirement and a trust-building statement for clients.',
              verify: 'Run check_compliance() with a trade for a restricted symbol and confirm the restriction issue is flagged; run it with a buy for a symbol recently sold at a loss and confirm the wash-sale issue is flagged. Run write_rationale() and confirm the letter has 3 paragraphs and explicitly states no trades execute without approval.',
            },
          ],
          goFurther: 'Have write_rationale() also estimate the expected tax impact in dollars (using harvest_candidates\' unrealized losses) so clients see a concrete number, not just "tax benefits". 🛠️🛠️',
        },
        {
          number: 4,
          title: 'Build the approval workflow and scheduled reviews',
          time: '45 min',
          description: 'Send recommendations to clients for explicit approval, and run drift analysis automatically across all portfolios.',
          steps: [
            {
              instruction: 'Ask Claude to write approval.py with request_approval and execute_on_approval functions, and main.py with a scheduled review_all_portfolios function.',
              prompt: 'Write two Python files for a portfolio rebalancing agent.\n\n1) approval.py with:\n- request_approval(client_id, rationale, trades) that calls create_approval_record(client_id, trades, status="pending") (assume it exists) to get an approval_id, sends an email via send_email(client_email_for(client_id), subject="Portfolio Rebalancing Recommendation", body=f"{rationale}\\n\\nApprove here: https://app.yourfirm.com/approve/{approval_id}") (assume send_email and client_email_for exist), and returns approval_id\n- execute_on_approval(approval_id) that loads the record via get_approval_record(approval_id) (assume it exists), and if record["status"] == "approved", iterates record["trades"] calling submit_trade_order(trade) (assume it exists, via the custodian API) for each\n\nAdd a comment that submit_trade_order must NEVER be called automatically outside this function, and execute_on_approval should only ever be triggered by an explicit, logged client approval action.\n\n2) main.py using the schedule library with review_all_portfolios() that iterates get_all_client_ids() (assume it exists), and for each client: loads their portfolio via load_portfolio_for_client(client_id) (assume it exists), computes drift, and if any asset class needs rebalancing, finds harvest candidates, computes trades, filters out trades with compliance issues via check_compliance() and get_recent_sales(client_id) (assume it exists), generates a rationale, and calls request_approval(). Schedule this to run with schedule.every().monday.at("06:00").do(review_all_portfolios).',
              verify: 'Run request_approval() with a sample rationale and trades, and confirm an approval record is created and an email is sent with the approval link. Run execute_on_approval() on a record with status "pending" and confirm NO trades are submitted; set status to "approved" and confirm trades ARE submitted.',
            },
          ],
          goFurther: 'Add a dashboard showing all pending approvals across clients, with days-pending highlighted so advisors can follow up on stale recommendations. 🛠️🛠️',
        },
      ],
      portfolio: 'Add this to your portfolio as "Algorithmic Portfolio Rebalancing Agent" — a strong project for wealth management, fintech, or quantitative finance roles. Show a drift analysis, a tax-loss harvest candidate list, a compliance check result, and a generated client rationale letter.',
      portfolioPrompt: 'Help me write a portfolio entry and a LinkedIn post for a project I just built: an Algorithmic Portfolio Rebalancing Agent. It loads a client\'s current holdings and target asset allocations, computes drift beyond a tolerance band, and identifies tax-loss harvesting candidates among underwater positions. It generates a minimal set of buy/sell trades that brings the portfolio back within tolerance while prioritizing tax-loss harvest opportunities, screens every trade against compliance rules (restricted securities, wash-sale risk), and has Claude write a plain-English client letter explaining the recommendation and its tax benefits. No trade ever executes without explicit client approval through a tracked approval workflow, and the whole process runs on a weekly schedule across all client portfolios. Write:\n1. A 3-4 sentence portfolio project description emphasizing tax-aware, compliance-checked, approval-gated automation\n2. A LinkedIn post (under 150 words) for a wealth management / fintech audience\n3. Two resume bullet points quantifying advisor time saved and tax savings identified per client',
    },
    steps: [
      {
        number: 1,
        title: 'Load holdings and target allocations',
        description: 'Load current portfolio holdings with market values and the client’s target asset allocation.',
        code: `# load.py
import pandas as pd

def load_portfolio(holdings_path, targets_path):
    holdings = pd.read_csv(holdings_path)  # symbol, shares, price, asset_class, cost_basis
    holdings["market_value"] = holdings["shares"] * holdings["price"]
    targets = pd.read_csv(targets_path)  # asset_class, target_pct
    return holdings, targets`,
        tip: 'cost_basis per lot (not just per symbol) is essential for accurate tax-loss harvesting in step 3 — fetch lot-level data if your custodian API supports it.',
      },
      {
        number: 2,
        title: 'Compute allocation drift',
        description: 'Calculate current allocation by asset class and compare against targets to find drift beyond tolerance.',
        code: `# drift.py
def compute_drift(holdings, targets, tolerance=0.05):
    total_value = holdings["market_value"].sum()
    current = holdings.groupby("asset_class")["market_value"].sum() / total_value
    df = targets.set_index("asset_class")
    df["current_pct"] = current
    df["drift"] = df["current_pct"] - df["target_pct"]
    df["needs_rebalance"] = df["drift"].abs() > tolerance
    return df.reset_index()`,
        tip: 'A 5% tolerance band avoids constant small rebalancing trades that generate fees and taxes for negligible benefit.',
      },
      {
        number: 3,
        title: 'Identify tax-loss harvesting candidates',
        description: 'Find positions trading below cost basis that could be sold to realize losses and offset gains elsewhere.',
        code: `# tax_loss.py
def find_harvest_candidates(holdings, min_loss=500):
    holdings["unrealized_gain_loss"] = holdings["market_value"] - (holdings["shares"] * holdings["cost_basis"])
    candidates = holdings[holdings["unrealized_gain_loss"] < -min_loss]
    return candidates[["symbol", "unrealized_gain_loss", "market_value"]]`,
        tip: 'After harvesting a loss, the agent must avoid repurchasing the same security within 30 days — check your wash-sale rule logic before generating buy orders.',
      },
      {
        number: 4,
        title: 'Compute the minimal trade list',
        description: 'Generate buy/sell orders that bring allocations back within tolerance, prioritizing harvest candidates for sells.',
        code: `# trades.py
def compute_trades(drift_df, holdings, total_value, harvest_candidates):
    trades = []
    for _, row in drift_df[drift_df["needs_rebalance"]].iterrows():
        target_value = row["target_pct"] * total_value
        current_value = row["current_pct"] * total_value
        delta = target_value - current_value

        if delta < 0:  # need to sell from this asset class
            asset_holdings = holdings[holdings["asset_class"] == row["asset_class"]]
            harvest_in_class = harvest_candidates[harvest_candidates["symbol"].isin(asset_holdings["symbol"])]
            sell_target = harvest_in_class.iloc[0]["symbol"] if not harvest_in_class.empty else asset_holdings.iloc[0]["symbol"]
            trades.append({"action": "sell", "symbol": sell_target, "amount": abs(delta), "reason": "rebalance" + (" + tax-loss harvest" if not harvest_in_class.empty else "")})
        else:
            trades.append({"action": "buy", "asset_class": row["asset_class"], "amount": delta, "reason": "rebalance"})
    return trades`,
        tip: 'When selling to rebalance, prefer positions that are also tax-loss harvest candidates — it accomplishes two goals with one trade.',
      },
      {
        number: 5,
        title: 'Run compliance checks',
        description: 'Check each proposed trade against basic compliance rules (concentration limits, restricted list, wash sale).',
        code: `# compliance.py
RESTRICTED_SYMBOLS = {"XYZ"}  # e.g. employee-restricted securities

def check_compliance(trade, holdings, recent_sales, max_concentration=0.25):
    issues = []
    if trade.get("symbol") in RESTRICTED_SYMBOLS:
        issues.append("Symbol is on restricted list")
    if trade["action"] == "buy" and trade.get("symbol") in [s["symbol"] for s in recent_sales if s["loss"]]:
        issues.append("Potential wash sale: recently sold for a loss")
    return issues`,
        tip: 'Maintain RESTRICTED_SYMBOLS as a per-client list, not a global one — restrictions often come from the client’s own employer (insider trading policies).',
      },
      {
        number: 6,
        title: 'Generate the client rationale',
        description: 'Ask Claude to write a plain-English explanation of the rebalancing recommendation for the client.',
        code: `# rationale.py
from anthropic import Anthropic
ai = Anthropic()

def write_rationale(drift_df, trades, harvest_candidates):
    prompt = f"""Portfolio drift analysis: {drift_df.to_dict('records')}
Recommended trades: {trades}
Tax-loss harvesting opportunities included: {harvest_candidates.to_dict('records')}

Write a 3-paragraph client letter explaining: 1) why rebalancing is recommended now,
2) what trades are proposed and why, 3) any tax benefits. Plain English, reassuring tone,
and note that no trades will execute without their approval."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=600,
        messages=[{"role": "user", "content": prompt}]).content[0].text`,
        tip: 'Always include "no trades will execute without their approval" — this is both a compliance requirement and a trust-building statement for clients.',
      },
      {
        number: 7,
        title: 'Build the approval workflow',
        description: 'Send the rationale and trade list to the client for approval before any trade is submitted.',
        code: `# approval.py
def request_approval(client_id, rationale, trades):
    approval_id = create_approval_record(client_id, trades, status="pending")
    send_email(client_email_for(client_id), subject="Portfolio Rebalancing Recommendation",
        body=f"{rationale}\\n\\nApprove here: https://app.yourfirm.com/approve/{approval_id}")
    return approval_id

def execute_on_approval(approval_id):
    record = get_approval_record(approval_id)
    if record["status"] == "approved":
        for trade in record["trades"]:
            submit_trade_order(trade)  # via custodian API`,
        tip: 'Never call submit_trade_order automatically — this function should only ever be triggered by an explicit, logged client approval action.',
      },
      {
        number: 8,
        title: 'Schedule periodic reviews',
        description: 'Run the drift analysis quarterly (or when drift exceeds tolerance) for every client portfolio.',
        code: `# main.py
import schedule

def review_all_portfolios():
    for client_id in get_all_client_ids():
        holdings, targets = load_portfolio_for_client(client_id)
        drift_df = compute_drift(holdings, targets)
        if drift_df["needs_rebalance"].any():
            harvest = find_harvest_candidates(holdings)
            trades = compute_trades(drift_df, holdings, holdings["market_value"].sum(), harvest)
            trades = [t for t in trades if not check_compliance(t, holdings, get_recent_sales(client_id))]
            rationale = write_rationale(drift_df, trades, harvest)
            request_approval(client_id, rationale, trades)

schedule.every().monday.at("06:00").do(review_all_portfolios)`,
        tip: 'Run this weekly even if your formal review cadence is quarterly — catching large drift early (e.g. after a market crash) prevents a much bigger rebalance later.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Algorithmic Portfolio Rebalancing Agent (starter)
Run: pip install pandas anthropic
"""
import pandas as pd
from anthropic import Anthropic

ai = Anthropic()

def compute_drift(holdings_csv, targets_csv, tolerance=0.05):
    holdings = pd.read_csv(holdings_csv)
    holdings["market_value"] = holdings["shares"] * holdings["price"]
    targets = pd.read_csv(targets_csv).set_index("asset_class")

    total = holdings["market_value"].sum()
    current = holdings.groupby("asset_class")["market_value"].sum() / total
    targets["current_pct"] = current
    targets["drift"] = targets["current_pct"] - targets["target_pct"]
    targets["needs_rebalance"] = targets["drift"].abs() > tolerance
    return targets.reset_index()

def write_rationale(drift_df):
    prompt = f"Portfolio drift: {drift_df.to_dict('records')}. Write a 2-paragraph client explanation of why rebalancing may be needed."
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=300,
        messages=[{"role": "user", "content": prompt}]).content[0].text

if __name__ == "__main__":
    drift = compute_drift("holdings.csv", "targets.csv")
    if drift["needs_rebalance"].any():
        print(write_rationale(drift))
`,
    resources: [
      { title: 'pandas Documentation', url: 'https://pandas.pydata.org/docs/' },
      { title: 'IRS Wash Sale Rule (Pub. 550)', url: 'https://www.irs.gov/publications/p550' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 43,
    title: 'AI Chief of Staff Agent',
    emoji: '🧠',
    department: ['Strategy'],
    departmentIds: ['strategy'],
    difficulty: 'World Class',
    description:
      'A personal executive assistant agent that triages your inbox and calendar, prepares meeting briefs, tracks commitments across conversations, and gives you a daily priority briefing.',
    whatYouBuild:
      'A multi-source orchestration agent that reads your email and calendar each morning, identifies your top priorities for the day, prepares a one-page brief for every meeting (attendee context, related emails, open action items), tracks commitments you’ve made in emails/Slack and reminds you before they’re due, drafts responses to routine emails for your review, and delivers a daily executive briefing every morning.',
    whatYouLearn: [
      'Aggregate and prioritize information across email, calendar, and chat',
      'Generate meeting briefs by cross-referencing multiple data sources',
      'Extract and track commitments/action items from unstructured communication',
      'Build a daily briefing generation pipeline',
      'Implement draft-for-review patterns for routine communications',
      'Design a system that respects user attention as the scarcest resource',
    ],
    techStack: ['Python', 'Gmail API', 'Google Calendar', 'Slack API', 'Claude API'],
    buildTime: '10 hrs',
    xp: 1450,
    popularity: 89,
    prerequisites: ['Completed Gmail AI Triage Agent', 'Completed CRM Lead Follow-Up Agent', 'Completed Multi-Agent Customer Onboarding Orchestrator'],
    tags: ['executive-assistant', 'productivity', 'multi-source', 'orchestration'],
    session: {
      totalTime: '220 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'A morning aggregation pipeline pulling calendar events, important emails, and Slack mentions',
        'A Claude-powered priority ranker personalized to the user\'s role, plus one-page meeting briefs',
        'A commitment extractor and tracker that surfaces what the user promised and when it\'s due',
        'Draft replies for routine emails in the user\'s own voice, assembled into a daily briefing delivered via Slack',
      ],
      whatYouNeed: [
        'Python installed locally',
        'An Anthropic API key (console.anthropic.com)',
        'pip install anthropic google-api-python-client slack_sdk schedule',
        'Gmail API and Google Calendar API access, a Slack bot token, and (optionally) CRM API access',
      ],
      builds: [
        {
          number: 1,
          title: 'Aggregate daily context and rank priorities',
          time: '50 min',
          description: 'Pull together everything happening today, then have Claude decide what actually deserves attention.',
          steps: [
            {
              instruction: 'Ask Claude to write aggregate.py with a gather_daily_context function, and prioritize.py with a rank_priorities function.',
              prompt: 'Write two Python files for an AI chief-of-staff agent.\n\n1) aggregate.py with gather_daily_context(gmail_service, calendar_service, slack_client) that calls get_todays_events(calendar_service), get_important_unread(gmail_service, max_results=20), and get_unread_mentions(slack_client) (assume all three exist), and returns {"events": today_events, "emails": important_emails, "slack": slack_mentions}.\n\nAdd a comment that filtering to "important" emails using Gmail\'s own importance markers plus a sender allowlist (direct reports, key clients) matters — the agent should never process the full inbox every morning.\n\n2) prioritize.py using the anthropic Python SDK with rank_priorities(context, user_role_context) that sends Claude (claude-sonnet-4-5, max_tokens=600) the user_role_context, today\'s calendar events, a trimmed view of important emails (from + subject only), and Slack mentions, asking it to rank the top 5 things this person should focus on today with a one-sentence reason each. Request JSON: {"priorities": [{"item": "...", "reason": "...", "type": "meeting/email/slack"}]}. Parse and return the priorities list.\n\nAdd a comment that user_role_context should be a living document the user updates monthly (e.g. "VP of Sales, focused on enterprise renewals this quarter") — that\'s what makes prioritization feel personalized rather than generic.',
              verify: 'Run gather_daily_context() with test credentials and confirm it returns populated events/emails/slack lists. Run rank_priorities() and confirm it returns exactly 5 prioritized items, each with item, reason, and type.',
            },
          ],
          goFurther: 'Add a feedback loop where the user can mark a priority as "not actually important" — feed recent feedback into future rank_priorities() calls to improve personalization over time. 🛠️🛠️🛠️',
        },
        {
          number: 2,
          title: 'Build meeting briefs and extract commitments',
          time: '55 min',
          description: 'Prepare a one-page brief for every meeting, and scan sent messages for promises the user has made.',
          steps: [
            {
              instruction: 'Ask Claude to write briefs.py with a build_meeting_brief function, and commitments.py with an extract_commitments function.',
              prompt: 'Write two Python files for an AI chief-of-staff agent using the anthropic Python SDK.\n\n1) briefs.py with build_meeting_brief(event, gmail_service, crm_client) that:\n- Gets event.get("attendees", [])\n- For each attendee, searches recent emails via search_emails(gmail_service, f"from:{attendee[\'email\']}", max_results=3) (assume it exists) and collects them into related_emails\n- Gets CRM context for each attendee via get_crm_record(crm_client, a["email"]) (assume it exists)\n- Sends Claude (claude-sonnet-4-5, max_tokens=600) the meeting summary/time, attendee emails, snippets from related_emails, and crm_context, asking it to write a one-page brief covering: who\'s attending and their context, what was discussed recently, likely topics for this meeting, and any open follow-up items\n- Returns the response text\n\nAdd a comment that briefs should be generated the NIGHT BEFORE, not the morning of — it gives the user time to actually read them before back-to-back meetings start.\n\n2) commitments.py with extract_commitments(message_text, sender, sent_date) that sends Claude (max_tokens=200) the message text and sent_date, asking whether it contains a commitment the user made to do something (with or without an explicit deadline), and if so to extract it. Request JSON: {"has_commitment": true/false, "commitment": "...", "deadline": "..." or null}. Parse and return the JSON.\n\nAdd a comment that this should run on the user\'s SENT folder, not received — the agent is tracking what THEY promised, not what others promised them.',
              verify: 'Run build_meeting_brief() on a sample meeting event with a couple of attendees and confirm the brief references attendee context and recent emails. Run extract_commitments() on a sent message containing "I\'ll send this over by Friday" and confirm has_commitment=true with a populated deadline.',
            },
          ],
          goFurther: 'Have build_meeting_brief() flag meetings with no clear agenda or recent context as "consider declining or requesting an agenda". 🛠️🛠️',
        },
        {
          number: 3,
          title: 'Track commitments and draft routine email replies',
          time: '45 min',
          description: 'Persist commitments and surface what\'s due soon, and draft replies to routine emails in the user\'s own voice.',
          steps: [
            {
              instruction: 'Ask Claude to write tracker.py with save_commitment and get_due_soon functions, and drafts.py with a draft_routine_response function.',
              prompt: 'Write two Python files for an AI chief-of-staff agent.\n\n1) tracker.py using json and datetime with:\n- save_commitment(commitment) that appends a JSON line to commitments.jsonl containing all fields from the commitment dict plus "status": "open" and "created": datetime.utcnow().isoformat()\n- get_due_soon(days=2) that reads all lines from commitments.jsonl (as JSON), computes cutoff = datetime.utcnow() + timedelta(days=days), and returns commitments where status == "open" and deadline is set and datetime.fromisoformat(deadline) <= cutoff\n\nAdd a comment that commitments should be marked "open" by default and the user should mark them done via a quick command — auto-detecting completion from email content is unreliable.\n\n2) drafts.py using the anthropic Python SDK with ROUTINE_TYPES = {"scheduling", "confirmation", "simple_question"} and draft_routine_response(email, classification, user_voice_sample) that returns None if classification["type"] is not in ROUTINE_TYPES, otherwise sends Claude (claude-sonnet-4-5, max_tokens=300) the email snippet, classification type, and user_voice_sample, asking it to draft a brief reply in the user\'s style — and if it\'s a scheduling request, to propose 2 specific time slots from their availability. Returns the response text.\n\nAdd a comment that user_voice_sample should be pulled from 3-5 of the user\'s actual recent sent emails — generic "professional" drafts are immediately recognizable as AI-written and feel impersonal.',
              verify: 'Call save_commitment() with a commitment due tomorrow, then get_due_soon(days=2) and confirm it\'s returned; confirm get_due_soon(days=0) does not return it. Run draft_routine_response() on a scheduling email and confirm it proposes 2 specific time slots in a style resembling user_voice_sample.',
            },
          ],
          goFurther: 'Add a weekly "commitments review" that surfaces all OPEN commitments regardless of deadline, so nothing silently falls through the cracks. 🛠️',
        },
        {
          number: 4,
          title: 'Assemble and deliver the daily briefing',
          time: '50 min',
          description: 'Combine everything into one morning briefing and run it automatically every weekday.',
          steps: [
            {
              instruction: 'Ask Claude to write briefing.py with a build_daily_briefing function, and main.py with a scheduled morning_routine function.',
              prompt: 'Write two Python files for an AI chief-of-staff agent.\n\n1) briefing.py with build_daily_briefing(priorities, meeting_briefs, commitments_due, drafts) that builds a Markdown document with sections:\n- "# Your Daily Briefing"\n- "## Top Priorities Today" listing each priority as "- {item}: {reason}"\n- "## Meeting Briefs" joining all meeting_briefs\n- "## Commitments Due Soon" (only if commitments_due is non-empty) listing each as "- {commitment} (due {deadline})"\n- "## {N} Draft Replies Ready for Review" (only if drafts is non-empty)\nReturns the joined sections as a single string.\n\nAdd a comment that "Top Priorities" must come FIRST — everything below it is supporting detail the user reads only if they have time.\n\n2) main.py using the schedule library with morning_routine() that: calls gather_daily_context(), then rank_priorities(context, USER_ROLE_CONTEXT), then builds a meeting brief for each of context["events"] via build_meeting_brief(), gets commitments_due via get_due_soon(), drafts routine replies for context["emails"] via draft_routine_response() (filtering out None results), builds the briefing via build_daily_briefing(), and delivers it via send_slack_dm(USER_SLACK_ID, briefing) (assume it exists). Schedule morning_routine to run at 06:30 every weekday (Monday through Friday) using the schedule library.',
              verify: 'Run morning_routine() once manually with test data and confirm a complete briefing is sent to the configured Slack DM, with priorities listed first, meeting briefs included, commitments due (if any) shown, and a count of draft replies ready.',
            },
          ],
          goFurther: 'Add an end-of-day "wrap-up" routine that reviews what got done vs. the morning\'s priorities and rolls anything unfinished into tomorrow\'s briefing automatically. 🛠️🛠️🛠️',
        },
      ],
      portfolio: 'Add this to your portfolio as "AI Chief of Staff Agent" — a flagship project for executive assistant tooling, productivity software, or AI agent orchestration roles. Show a sample daily briefing, a generated meeting brief, an extracted commitment, and a routine email draft.',
      portfolioPrompt: 'Help me write a portfolio entry and a LinkedIn post for a project I just built: an AI Chief of Staff Agent. Every morning it pulls together the day\'s calendar events, important unread emails, and Slack mentions, then has Claude rank the top 5 things that genuinely deserve attention today based on the user\'s role context. It prepares a one-page brief for every meeting by cross-referencing attendee emails and CRM history, scans the user\'s sent messages to extract and track commitments they\'ve made (surfacing ones due soon), and drafts replies to routine emails in the user\'s own writing voice for quick review. Everything is assembled into a single daily briefing — priorities first — and delivered automatically via Slack every weekday morning. Write:\n1. A 3-4 sentence portfolio project description emphasizing personalized, multi-source executive support\n2. A LinkedIn post (under 150 words) for a productivity tools / executive assistant / AI agents audience\n3. Two resume bullet points quantifying time saved per week and meeting prep quality improvement',
    },
    steps: [
      {
        number: 1,
        title: 'Aggregate the day’s inputs',
        description: 'Each morning, pull today’s calendar events, unread important emails, and unread Slack DMs/mentions.',
        code: `# aggregate.py
def gather_daily_context(gmail_service, calendar_service, slack_client):
    today_events = get_todays_events(calendar_service)
    important_emails = get_important_unread(gmail_service, max_results=20)
    slack_mentions = get_unread_mentions(slack_client)
    return {"events": today_events, "emails": important_emails, "slack": slack_mentions}`,
        tip: 'Filter emails to "important" using Gmail’s own importance markers plus a sender allowlist (direct reports, key clients) — don’t process the full inbox every morning.',
      },
      {
        number: 2,
        title: 'Build the priority ranker',
        description: 'Ask Claude to rank today’s items (meetings, emails, messages) by what genuinely needs the user’s attention today.',
        code: `# prioritize.py
from anthropic import Anthropic
import json

ai = Anthropic()

def rank_priorities(context, user_role_context):
    prompt = f"""You are a chief of staff for someone with this role: {user_role_context}

Today's calendar: {context['events']}
Important unread emails: {[{'from': e['from'], 'subject': e['subject']} for e in context['emails']]}
Slack mentions: {context['slack']}

Rank the top 5 things this person should focus on today, with a one-sentence reason each.
Return JSON: {{"priorities": [{{"item": "...", "reason": "...", "type": "meeting/email/slack"}}]}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=600,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)["priorities"]`,
        tip: 'Maintain user_role_context as a living document the user updates monthly ("VP of Sales, focused on enterprise renewals this quarter") — it’s what makes prioritization feel personalized rather than generic.',
      },
      {
        number: 3,
        title: 'Build meeting briefs',
        description: 'For each meeting today, gather attendee context, related past emails, and open action items into a one-page brief.',
        code: `# briefs.py
def build_meeting_brief(event, gmail_service, crm_client):
    attendees = event.get("attendees", [])
    related_emails = []
    for attendee in attendees:
        related_emails.extend(search_emails(gmail_service, f"from:{attendee['email']}", max_results=3))
    crm_context = [get_crm_record(crm_client, a["email"]) for a in attendees]

    prompt = f"""Meeting: {event['summary']} at {event['start']}
Attendees: {[a['email'] for a in attendees]}
Recent email exchanges: {[e['snippet'] for e in related_emails]}
CRM context: {crm_context}

Write a one-page brief: who's attending and their context, what was discussed recently,
likely topics for this meeting, and any open items to follow up on."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=600,
        messages=[{"role": "user", "content": prompt}]).content[0].text`,
        tip: 'Generate briefs the night before, not the morning of — it gives the user time to actually read them before back-to-back meetings start.',
      },
      {
        number: 4,
        title: 'Extract commitments from communications',
        description: 'Scan sent emails and Slack messages for commitments the user has made ("I\'ll send this by Friday") and track them.',
        code: `# commitments.py
def extract_commitments(message_text, sender, sent_date):
    prompt = f"""Message sent by the user on {sent_date}: "{message_text}"

Does this message contain a commitment the user made to do something (with or without
an explicit deadline)? If yes, extract it.

Return JSON: {{"has_commitment": true/false, "commitment": "...", "deadline": "..." or null}}"""
    import json
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=200,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)`,
        tip: 'Run this on the user’s SENT folder, not received — you’re tracking what THEY promised, not what others promised them.',
      },
      {
        number: 5,
        title: 'Build the commitment tracker',
        description: 'Store extracted commitments with deadlines and surface ones due soon or overdue.',
        code: `# tracker.py
import json
from datetime import datetime, timedelta

def save_commitment(commitment):
    with open("commitments.jsonl", "a") as f:
        f.write(json.dumps({**commitment, "status": "open", "created": datetime.utcnow().isoformat()}) + "\\n")

def get_due_soon(days=2):
    commitments = [json.loads(l) for l in open("commitments.jsonl")]
    cutoff = datetime.utcnow() + timedelta(days=days)
    return [c for c in commitments if c["status"] == "open" and c["deadline"]
            and datetime.fromisoformat(c["deadline"]) <= cutoff]`,
        tip: 'Mark commitments as "open" by default and let the user mark them done via a quick command — auto-detecting completion from email content is unreliable.',
      },
      {
        number: 6,
        title: 'Draft responses to routine emails',
        description: 'For emails classified as routine (scheduling, simple confirmations), draft a response for the user to review and send.',
        code: `# drafts.py
ROUTINE_TYPES = {"scheduling", "confirmation", "simple_question"}

def draft_routine_response(email, classification, user_voice_sample):
    if classification["type"] not in ROUTINE_TYPES:
        return None
    prompt = f"""Email: {email['snippet']}
This is a {classification['type']} email. Here's a sample of the user's writing style: {user_voice_sample}

Draft a brief reply in their style. If it's a scheduling request, propose 2 specific time slots
from their availability."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=300,
        messages=[{"role": "user", "content": prompt}]).content[0].text`,
        tip: 'Pull user_voice_sample from 3-5 of their actual recent sent emails — generic "professional" drafts are immediately recognizable as AI-written and feel impersonal.',
      },
      {
        number: 7,
        title: 'Generate the daily briefing',
        description: 'Combine priorities, meeting briefs, commitments due, and draft emails into a single morning briefing document.',
        code: `# briefing.py
def build_daily_briefing(priorities, meeting_briefs, commitments_due, drafts):
    sections = ["# Your Daily Briefing\\n"]
    sections.append("## Top Priorities Today\\n" + "\\n".join(f"- {p['item']}: {p['reason']}" for p in priorities))
    sections.append("## Meeting Briefs\\n" + "\\n\\n".join(meeting_briefs))
    if commitments_due:
        sections.append("## Commitments Due Soon\\n" + "\\n".join(f"- {c['commitment']} (due {c['deadline']})" for c in commitments_due))
    if drafts:
        sections.append(f"## {len(drafts)} Draft Replies Ready for Review")
    return "\\n\\n".join(sections)`,
        tip: 'Lead with "Top Priorities" — everything below it is supporting detail the user reads only if they have time.',
      },
      {
        number: 8,
        title: 'Schedule and deliver the briefing',
        description: 'Run the full pipeline every weekday morning and deliver the briefing via email or Slack DM.',
        code: `# main.py
import schedule

def morning_routine():
    context = gather_daily_context(gmail_service, calendar_service, slack_client)
    priorities = rank_priorities(context, USER_ROLE_CONTEXT)
    briefs = [build_meeting_brief(e, gmail_service, crm_client) for e in context["events"]]
    commitments_due = get_due_soon()
    drafts = [draft_routine_response(e, classify_email(e), USER_VOICE_SAMPLE) for e in context["emails"]]
    drafts = [d for d in drafts if d]

    briefing = build_daily_briefing(priorities, briefs, commitments_due, drafts)
    send_slack_dm(USER_SLACK_ID, briefing)

schedule.every().monday.at("06:30").do(morning_routine)
schedule.every().tuesday.at("06:30").do(morning_routine)
# ... repeat for wed-fri`,
        tip: 'Deliver via Slack DM rather than email — it’s a channel the user checks throughout the day, while a "briefing" email easily gets buried under new arrivals.',
      },
    ],
    starterCode: `"""
AgentForge Academy — AI Chief of Staff Agent (starter)
Run: pip install anthropic google-api-python-client slack_sdk
"""
import json
from anthropic import Anthropic

ai = Anthropic()
USER_ROLE_CONTEXT = "VP of Sales, focused on enterprise renewals this quarter"

def rank_priorities(events, emails):
    prompt = f"""Role: {USER_ROLE_CONTEXT}
Today's meetings: {events}
Unread important emails (subjects): {[e['subject'] for e in emails]}

Rank the top 3 priorities for today with a one-sentence reason each.
Return JSON: {{"priorities": [{{"item":"...", "reason":"..."}}]}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=400,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)["priorities"]

if __name__ == "__main__":
    events = [{"summary": "Renewal call with Acme Corp", "start": "10:00"}]
    emails = [{"subject": "Re: Contract terms - urgent"}, {"subject": "Team lunch Friday?"}]
    print(rank_priorities(events, emails))
`,
    resources: [
      { title: 'Gmail API Docs', url: 'https://developers.google.com/gmail/api' },
      { title: 'Google Calendar API', url: 'https://developers.google.com/calendar/api' },
      { title: 'Slack API Docs', url: 'https://api.slack.com' },
    ],
  },
  {
    id: 44,
    title: 'Self-Improving Agent Factory',
    emoji: '🏗️',
    department: ['Engineering', 'Strategy'],
    departmentIds: ['engineering', 'strategy'],
    difficulty: 'World Class',
    description:
      'A meta-agent that evaluates the performance of your other deployed agents, identifies failure patterns, and proposes (and tests) prompt and logic improvements automatically.',
    whatYouBuild:
      'A meta-agent system that collects logs and outcomes from your other deployed agents, clusters failures and edge cases, asks Claude to analyze failure patterns and propose specific prompt/logic changes, runs A/B evaluations of proposed changes against a held-out test set of historical cases, and — only for changes that demonstrably improve performance — opens a pull request with the change and a full evaluation report.',
    whatYouLearn: [
      'Design a logging schema that captures agent inputs, outputs, and outcomes',
      'Cluster and summarize failure cases at scale',
      'Generate and evaluate prompt variations systematically',
      'Build an offline evaluation harness using historical cases',
      'Implement statistical comparison between prompt versions',
      'Automate the propose-test-PR loop for agent improvements',
    ],
    techStack: ['Python', 'Claude API', 'pandas', 'GitHub API'],
    buildTime: '10 hrs',
    xp: 1500,
    popularity: 90,
    prerequisites: ['Completed AI Code Migration Agent', 'Completed Autonomous QA Testing Agent', 'At least one other deployed agent generating logs'],
    tags: ['meta-agent', 'evaluation', 'self-improvement', 'automation'],
    session: {
      totalTime: '230 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'A consistent outcome logging schema retrofitted onto your other agents, plus failure clustering via embeddings',
        'Claude-generated cluster summaries that diagnose root causes and route them appropriately',
        'Minimal, targeted prompt-improvement proposals plus an offline evaluation harness comparing old vs. new',
        'A statistical significance check and an automated PR with a full evaluation report for genuine improvements',
      ],
      whatYouNeed: [
        'Python installed locally',
        'An Anthropic API key (console.anthropic.com)',
        'pip install pandas anthropic scipy sentence-transformers scikit-learn',
        'At least one other deployed agent producing logs, and a GitHub repo + token for opening PRs',
      ],
      builds: [
        {
          number: 1,
          title: 'Log outcomes and cluster failures',
          time: '55 min',
          description: 'Establish a consistent outcome-logging schema, then group failures by similarity so patterns become visible.',
          steps: [
            {
              instruction: 'Ask Claude to write schema.py with LOG_SCHEMA and a log_outcome function, and cluster.py with a cluster_failures function.',
              prompt: 'Write two Python files for a self-improving agent factory.\n\n1) schema.py defining LOG_SCHEMA = {\n  "agent_name": str, "timestamp": str, "input": dict,\n  "output": dict, "outcome": "success | failure | needs_review",\n  "outcome_detail": str\n}\nand log_outcome(agent_name, input_data, output_data, outcome, detail="") that builds an entry dict with agent_name, timestamp (datetime.datetime.utcnow().isoformat()), input, output, outcome, and outcome_detail, then appends it as a JSON line to logs/{agent_name}.jsonl.\n\nAdd a comment that retrofitting this schema into existing agents is the highest-leverage prerequisite for this whole system — without outcome labels, there\'s nothing to learn from.\n\n2) cluster.py using pandas, sklearn.cluster.KMeans, and sentence_transformers.SentenceTransformer("all-MiniLM-L6-v2") with cluster_failures(agent_name, n_clusters=5) that:\n- Reads logs/{agent_name}.jsonl into a DataFrame with pd.read_json(lines=True)\n- Filters to rows where outcome != "success"\n- If fewer rows than n_clusters, returns them with a single cluster=0 column\n- Otherwise builds texts by concatenating outcome_detail and str(input) for each row, encodes them with the embedder, and assigns a cluster column via KMeans(n_clusters=n_clusters, random_state=42, n_init=10).fit_predict()\n- Returns the failures DataFrame with the cluster column\n\nAdd a comment that clustering on outcome_detail + input together captures both "what kind of input causes problems" and "what kind of problem occurs" in one pass.',
              verify: 'Call log_outcome() a few times with different outcomes and confirm logs/{agent_name}.jsonl accumulates valid JSON lines. Run cluster_failures() on a log file with at least 10 failures and confirm it returns a DataFrame with a cluster column having multiple distinct values.',
            },
          ],
          goFurther: 'Add a cluster_size_report() that ranks clusters by size, so the team tackles the highest-impact failure pattern first. 🛠️',
        },
        {
          number: 2,
          title: 'Summarize failure clusters and propose prompt fixes',
          time: '55 min',
          description: 'Have Claude diagnose each cluster\'s root cause, then propose a minimal, targeted prompt change for prompt-related issues.',
          steps: [
            {
              instruction: 'Ask Claude to write summarize.py with a summarize_cluster function, and propose.py with a propose_prompt_change function.',
              prompt: 'Write two Python files for a self-improving agent factory using the anthropic Python SDK.\n\n1) summarize.py with summarize_cluster(cluster_examples) that sends Claude (claude-sonnet-4-5, max_tokens=500) the count and first 5 of cluster_examples, asking it to describe: 1) the common pattern across these failures, 2) the likely root cause type (prompt issue, missing context, logic bug, or edge case), and 3) a specific suggested fix. Request JSON: {"pattern": "...", "root_cause_type": "...", "suggested_fix": "..."}. Parse and return the JSON.\n\nAdd a comment that root_cause_type is the routing signal — "prompt issue" goes to the prompt-improvement step, while "logic bug" should instead be filed as a regular GitHub issue for a human engineer.\n\n2) propose.py with propose_prompt_change(current_prompt, cluster_summary, examples) that sends Claude (max_tokens=1500) the current_prompt, cluster_summary["pattern"] and cluster_summary["suggested_fix"], and the first 3 examples, asking it to propose a MINIMAL, specific change to the system prompt that addresses this pattern WITHOUT changing behavior on cases that already work, returning the FULL revised prompt as plain text.\n\nAdd a comment that "minimal change" is the key constraint — large prompt rewrites are far more likely to fix the targeted failures while breaking previously-working cases.',
              verify: 'Run summarize_cluster() on a cluster of similar failures and confirm root_cause_type is one of the four valid categories with a specific (not vague) suggested_fix. Run propose_prompt_change() and confirm the returned prompt is the full original prompt with a small, targeted addition/edit — not a wholesale rewrite.',
            },
          ],
          goFurther: 'For root_cause_type == "logic bug", auto-open a GitHub issue (reusing the file_bug_issue pattern from the QA Testing Agent) instead of routing to prompt improvement. 🛠️🛠️',
        },
        {
          number: 3,
          title: 'Build the offline evaluation harness and scoring function',
          time: '50 min',
          description: 'Compare old vs. new prompts against a held-out set of historical cases, including past successes.',
          steps: [
            {
              instruction: 'Ask Claude to write evaluate.py with evaluate_prompt and compare_prompts functions, and scoring.py with a score_output function.',
              prompt: 'Write two Python files for a self-improving agent factory using pandas and the anthropic Python SDK.\n\n1) evaluate.py with:\n- evaluate_prompt(prompt_text, test_cases, agent_run_fn) that, for each case in test_cases, calls output = agent_run_fn(prompt_text, case["input"]), computes score = score_output(output, case), and collects {"case_id": case["id"], "score": score} into a list, returning it as a pandas DataFrame\n- compare_prompts(old_prompt, new_prompt, test_cases, agent_run_fn) that runs evaluate_prompt() for both prompts and returns {"old_avg": old_results["score"].mean(), "new_avg": new_results["score"].mean(), "regressions": (new_results["score"] < old_results["score"]).sum()}\n\nAdd a comment that test_cases MUST include previously-successful cases, not just failures — a prompt that fixes the failures but breaks 10 successes is a net loss.\n\n2) scoring.py with score_output(output, case) that:\n- If case.get("expected_fields") is set: returns the fraction of expected_fields keys where output.get(k) == v (structured output scoring)\n- Otherwise: sends Claude (claude-sonnet-4-5, max_tokens=10) the case["reference_output"] and the new output, asking it to score similarity/quality from 0-1 and return ONLY the number, then returns float(response.strip())\n\nAdd a comment that LLM-as-judge scoring is noisy — scores should be averaged over the full test set, never trusted on a single comparison, and a sample should be sanity-checked manually.',
              verify: 'Run evaluate_prompt() with a small test_cases list and a stub agent_run_fn, and confirm it returns a DataFrame with one row per case. Run compare_prompts() with old and new prompts that produce identical outputs and confirm old_avg == new_avg and regressions == 0.',
            },
          ],
          goFurther: 'Add a cost field to evaluate_prompt() that tracks token usage per case, so compare_prompts() can report whether the new prompt also changed cost, not just quality. 🛠️🛠️',
        },
        {
          number: 4,
          title: 'Check statistical significance and open the PR',
          time: '50 min',
          description: 'Only ship changes that are genuinely better, with a full evaluation report attached for human review.',
          steps: [
            {
              instruction: 'Ask Claude to write significance.py with an is_significant_improvement function, and open_pr.py with a propose_agent_improvement function — then main.py tying the whole pipeline together.',
              prompt: 'Write two Python files and a main.py for a self-improving agent factory.\n\n1) significance.py using scipy.stats with is_significant_improvement(old_scores, new_scores, alpha=0.05) that runs a paired t-test via stats.ttest_rel(new_scores, old_scores), computes mean_diff = new_scores.mean() - old_scores.mean(), and returns True only if mean_diff > 0 AND p_value < alpha.\n\nAdd a comment that a paired t-test (ttest_rel) is correct here because old and new scores are computed on the SAME test cases — paired tests have much more statistical power than unpaired ones.\n\n2) open_pr.py using requests and subprocess with propose_agent_improvement(repo, agent_name, new_prompt, comparison, branch_suffix) that:\n- Creates and checks out a new git branch named f"agent-improvement/{agent_name}-{branch_suffix}"\n- Calls update_agent_prompt_file(agent_name, new_prompt) (assume it exists)\n- Stages, commits (message f"Improve {agent_name} prompt based on failure analysis"), and pushes the branch\n- Builds a PR body summarizing old_avg, new_avg, and regressions count from comparison, noting the change was generated and evaluated automatically and should be reviewed before merging\n- POSTs to https://api.github.com/repos/{repo}/pulls with a Bearer GitHub token, creating a PR from the branch into "main" with title f"Improve {agent_name} prompt" and the body\n\nAdd a comment that this is the capstone of the whole improvement loop, and its PRs should get the same review rigor as the AI Code Migration Agent\'s PRs.\n\n3) main.py with run_improvement_cycle(agent_name, current_prompt, agent_run_fn, test_cases) that: clusters failures via cluster_failures(), summarizes each cluster via summarize_cluster(), and for clusters with root_cause_type == "prompt issue", calls propose_prompt_change() to get a new_prompt, then compare_prompts(current_prompt, new_prompt, test_cases, agent_run_fn) to get a comparison. If is_significant_improvement(old_scores, new_scores) is True AND comparison["regressions"] == 0, calls propose_agent_improvement() to open a PR. Otherwise logs that the proposed change was rejected and why.',
              verify: 'Run run_improvement_cycle() end-to-end on a sample agent with a few historical failures and a small test_cases set. Confirm: clusters are summarized, a prompt change is proposed for "prompt issue" clusters, comparison stats are computed, and a PR is opened ONLY when the improvement is statistically significant with zero regressions — otherwise confirm a clear rejection log is produced.',
            },
          ],
          goFurther: 'Add a dashboard tracking every proposed change over time — accepted, rejected, and the reasons — so the team can see how the self-improvement loop is performing in aggregate. 🛠️🛠️🛠️',
        },
      ],
      portfolio: 'Add this to your portfolio as "Self-Improving Agent Factory" — the capstone project for AI agent engineering, MLOps, or AI platform roles. Show a failure cluster summary, a proposed minimal prompt diff, the offline evaluation comparison, and an opened PR with its evaluation report.',
      portfolioPrompt: 'Help me write a portfolio entry and a LinkedIn post for a project I just built: a Self-Improving Agent Factory — a meta-agent that improves my OTHER deployed AI agents automatically. It collects outcome-labeled logs from those agents, clusters failures by similarity using embeddings, and has Claude diagnose each cluster\'s root cause and route it appropriately (prompt issue vs. logic bug vs. edge case). For prompt-related issues, it proposes a minimal, targeted prompt change, then runs an offline evaluation harness comparing the old and new prompts against a held-out set of historical cases — including past successes, to catch regressions. Only changes that pass a paired statistical significance test with zero regressions get turned into a GitHub PR with a full evaluation report attached for human review. Write:\n1. A 3-4 sentence portfolio project description emphasizing rigorous, statistically-validated self-improvement with human review gates\n2. A LinkedIn post (under 150 words) for an AI engineering / MLOps / AI platform audience\n3. Two resume bullet points quantifying agent quality improvement and reduced manual prompt-tuning effort',
    },
    steps: [
      {
        number: 1,
        title: 'Design the outcome logging schema',
        description: 'Ensure every agent you want to improve logs its input, output, and an outcome label (success/failure/needs_review).',
        code: `# schema.py
LOG_SCHEMA = {
    "agent_name": str, "timestamp": str, "input": dict,
    "output": dict, "outcome": "success | failure | needs_review",
    "outcome_detail": str,  # e.g. "user rejected the draft" or "API call failed"
}

def log_outcome(agent_name, input_data, output_data, outcome, detail=""):
    import json, datetime
    entry = {"agent_name": agent_name, "timestamp": datetime.datetime.utcnow().isoformat(),
             "input": input_data, "output": output_data, "outcome": outcome, "outcome_detail": detail}
    with open(f"logs/{agent_name}.jsonl", "a") as f:
        f.write(json.dumps(entry) + "\\n")`,
        tip: 'Retrofitting this schema into your existing agents is the highest-leverage prerequisite for this whole system — without outcome labels, there’s nothing to learn from.',
      },
      {
        number: 2,
        title: 'Load and cluster failures',
        description: 'Load all "failure" and "needs_review" logs for an agent and cluster them by similarity using embeddings.',
        code: `# cluster.py
import pandas as pd
from sklearn.cluster import KMeans
from sentence_transformers import SentenceTransformer

embedder = SentenceTransformer("all-MiniLM-L6-v2")

def cluster_failures(agent_name, n_clusters=5):
    df = pd.read_json(f"logs/{agent_name}.jsonl", lines=True)
    failures = df[df["outcome"] != "success"].copy()
    if len(failures) < n_clusters:
        return failures.assign(cluster=0)
    texts = failures["outcome_detail"] + " " + failures["input"].astype(str)
    embeddings = embedder.encode(texts.tolist())
    failures["cluster"] = KMeans(n_clusters=n_clusters, random_state=42, n_init=10).fit_predict(embeddings)
    return failures`,
        tip: 'Clustering on outcome_detail + input together captures both "what kind of input causes problems" and "what kind of problem occurs" in one pass.',
      },
      {
        number: 3,
        title: 'Summarize each failure cluster',
        description: 'For each cluster, ask Claude to describe the common pattern and hypothesize the root cause.',
        code: `# summarize.py
from anthropic import Anthropic
import json

ai = Anthropic()

def summarize_cluster(cluster_examples):
    prompt = f"""Here are {len(cluster_examples)} failure cases from an AI agent, all clustered together
as similar: {cluster_examples[:5]}

Describe: 1) the common pattern across these failures, 2) the likely root cause
(prompt issue, missing context, logic bug, or edge case), 3) a specific suggested fix.

Return JSON: {{"pattern": "...", "root_cause_type": "...", "suggested_fix": "..."}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=500,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)`,
        tip: 'root_cause_type is your routing signal — "prompt issue" goes to step 4, "logic bug" should be filed as a regular GitHub issue for a human engineer instead.',
      },
      {
        number: 4,
        title: 'Generate prompt improvement proposals',
        description: 'For prompt-related root causes, ask Claude to propose a specific, minimal change to the agent’s system prompt.',
        code: `# propose.py
def propose_prompt_change(current_prompt, cluster_summary, examples):
    prompt = f"""Current system prompt for the agent:
{current_prompt}

Failure pattern identified: {cluster_summary['pattern']}
Suggested fix direction: {cluster_summary['suggested_fix']}
Example failing inputs: {examples[:3]}

Propose a MINIMAL, specific change to the system prompt that addresses this pattern
without changing its behavior on cases that already work. Return the FULL revised prompt."""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=1500,
        messages=[{"role": "user", "content": prompt}])
    return resp.content[0].text`,
        tip: '"Minimal change" is the key constraint — large prompt rewrites are far more likely to fix the targeted failures while breaking previously-working cases.',
      },
      {
        number: 5,
        title: 'Build the offline evaluation harness',
        description: 'Re-run both the old and new prompt against a held-out set of historical cases (including past successes) and score the outputs.',
        code: `# evaluate.py
def evaluate_prompt(prompt_text, test_cases, agent_run_fn):
    results = []
    for case in test_cases:
        output = agent_run_fn(prompt_text, case["input"])
        score = score_output(output, case)  # task-specific scoring function
        results.append({"case_id": case["id"], "score": score})
    return pd.DataFrame(results)

def compare_prompts(old_prompt, new_prompt, test_cases, agent_run_fn):
    old_results = evaluate_prompt(old_prompt, test_cases, agent_run_fn)
    new_results = evaluate_prompt(new_prompt, test_cases, agent_run_fn)
    return {"old_avg": old_results["score"].mean(), "new_avg": new_results["score"].mean(),
            "regressions": (new_results["score"] < old_results["score"]).sum()}`,
        tip: 'Your test_cases set MUST include previously-successful cases, not just failures — a prompt that fixes the failures but breaks 10 successes is a net loss.',
      },
      {
        number: 6,
        title: 'Define the scoring function per agent',
        description: 'Implement task-specific scoring — for structured outputs, check schema compliance and key field accuracy; for text, use Claude as a judge.',
        code: `# scoring.py
def score_output(output, case):
    if case.get("expected_fields"):
        # structured output: fraction of expected fields matching
        matches = sum(1 for k, v in case["expected_fields"].items() if output.get(k) == v)
        return matches / len(case["expected_fields"])
    else:
        # free text: use Claude as a judge against the original "good" output
        prompt = f"""Compare this new output to the reference good output for the same input.
Reference: {case['reference_output']}
New output: {output}
Score similarity/quality from 0-1. Return ONLY the number."""
        resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=10,
            messages=[{"role": "user", "content": prompt}])
        return float(resp.content[0].text.strip())`,
        tip: 'LLM-as-judge scoring is noisy — average over the full test set, never trust a single comparison, and sanity-check a sample of judge scores manually.',
      },
      {
        number: 7,
        title: 'Apply a statistical significance check',
        description: 'Only accept a prompt change if the improvement is statistically significant, not just numerically higher.',
        code: `# significance.py
from scipy import stats

def is_significant_improvement(old_scores, new_scores, alpha=0.05):
    t_stat, p_value = stats.ttest_rel(new_scores, old_scores)
    mean_diff = new_scores.mean() - old_scores.mean()
    return mean_diff > 0 and p_value < alpha`,
        tip: 'A paired t-test (ttest_rel) is correct here because old and new scores are computed on the SAME test cases — paired tests have much more statistical power than unpaired.',
      },
      {
        number: 8,
        title: 'Open a PR with the evaluation report',
        description: 'For statistically significant improvements with zero regressions, open a PR updating the agent’s prompt with the full evaluation attached.',
        code: `# open_pr.py
import requests, subprocess

def propose_agent_improvement(repo, agent_name, new_prompt, comparison, branch_suffix):
    branch = f"agent-improvement/{agent_name}-{branch_suffix}"
    subprocess.run(["git", "checkout", "-b", branch], check=True)
    update_agent_prompt_file(agent_name, new_prompt)
    subprocess.run(["git", "add", "."], check=True)
    subprocess.run(["git", "commit", "-m", f"Improve {agent_name} prompt based on failure analysis"], check=True)
    subprocess.run(["git", "push", "-u", "origin", branch], check=True)

    body = (f"## Automated Prompt Improvement: {agent_name}\\n\\n"
            f"Old avg score: {comparison['old_avg']:.3f}\\nNew avg score: {comparison['new_avg']:.3f}\\n"
            f"Regressions: {comparison['regressions']} / N test cases\\n\\n"
            f"This change was generated and evaluated automatically. Please review the prompt diff "
            f"and evaluation results before merging.")
    requests.post(f"https://api.github.com/repos/{repo}/pulls",
        headers={"Authorization": "Bearer GITHUB_TOKEN"},
        json={"title": f"Improve {agent_name} prompt", "head": branch, "base": "main", "body": body})`,
        tip: 'This is the capstone agent for a reason — it closes the loop on everything else in AgentForge Academy. Treat its PRs with the same review rigor as the AI Code Migration Agent’s.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Self-Improving Agent Factory (starter)
Run: pip install pandas anthropic scipy sentence-transformers scikit-learn
"""
import pandas as pd, json
from anthropic import Anthropic

ai = Anthropic()

def load_failures(log_path):
    df = pd.read_json(log_path, lines=True)
    return df[df["outcome"] != "success"]

def summarize_failures(failures):
    prompt = f"""Here are failure cases from an AI agent: {failures.head(5).to_dict('records')}
Describe the common pattern and suggest a specific fix to the agent's system prompt.
Return JSON: {{"pattern":"...", "suggested_fix":"..."}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=400,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)

if __name__ == "__main__":
    failures = load_failures("logs/gmail_triage_agent.jsonl")
    if len(failures):
        print(summarize_failures(failures))
`,
    resources: [
      { title: 'scikit-learn KMeans', url: 'https://scikit-learn.org/stable/modules/generated/sklearn.cluster.KMeans.html' },
      { title: 'SciPy Statistical Tests', url: 'https://docs.scipy.org/doc/scipy/reference/stats.html' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
];
