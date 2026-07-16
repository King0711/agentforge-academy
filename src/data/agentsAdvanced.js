// Advanced tier agents (ids 26-36)
export const agentsAdvanced = [
  {
    id: 26,
    title: 'Multi-Agent Customer Onboarding Orchestrator',
    emoji: '🧩',
    department: ['Operations', 'Customer Support'],
    departmentIds: ['operations', 'support'],
    difficulty: 'Advanced',
    description:
      'A team of specialized AI agents that collaborate to onboard new customers — provisioning accounts, sending welcome sequences, and scheduling kickoff calls.',
    whatYouBuild:
      'A CrewAI-based multi-agent system with a Provisioning Agent (creates accounts via API), a Communications Agent (sends personalized welcome emails and Slack invites), and a Scheduling Agent (books a kickoff call via calendar API). A Manager Agent coordinates the crew, handles failures by retrying or escalating to a human, and reports a final onboarding summary.',
    whatYouLearn: [
      'Design multi-agent systems with CrewAI roles, goals, and tools',
      'Build custom tools that wrap internal APIs for agent use',
      'Implement a manager/orchestrator agent pattern',
      'Handle partial failures and retries across an agent crew',
      'Coordinate sequential and parallel agent tasks',
      'Generate human-readable run summaries from agent output',
    ],
    techStack: ['Python', 'CrewAI', 'Claude API', 'HubSpot API', 'Google Calendar'],
    buildTime: '6 hrs',
    xp: 750,
    popularity: 82,
    prerequisites: ['Completed an Intermediate-tier agent', 'CrewAI installed', 'API access to CRM and calendar'],
    tags: ['multi-agent', 'orchestration', 'onboarding', 'crewai'],
    session: {
      totalTime: '160 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'A CrewAI crew of three specialist agents — Provisioning, Communications, and Scheduling — plus a Manager agent that orchestrates them',
        'Custom tools wrapping your account API, email/Slack invites, and Google Calendar booking',
        'A hierarchical crew that runs the full onboarding flow from a single kickoff() call',
        'Failure escalation to a human Slack channel and a Claude-written run summary for account managers',
      ],
      whatYouNeed: [
        'Python installed locally',
        'An Anthropic API key (console.anthropic.com)',
        'pip install crewai langchain-anthropic anthropic requests google-api-python-client',
        'Access to your internal account-provisioning API (or a mock endpoint), SMTP credentials, a Slack bot token, and Google Calendar API credentials',
      ],
      builds: [
        {
          number: 1,
          title: 'Define the agent crew',
          time: '30 min',
          description: 'Create three specialist agents and one manager agent, each with a role, goal, and backstory that shapes how it behaves.',
          steps: [
            {
              instruction: 'Ask Claude to build crew.py defining the Provisioning, Communications, Scheduling, and Manager agents using CrewAI and ChatAnthropic.',
              prompt: 'Write crew.py for a CrewAI multi-agent onboarding system using langchain_anthropic.ChatAnthropic with model="claude-sonnet-4-5".\n\nDefine 4 Agents:\n- provisioner: role="Provisioning Specialist", goal="Create and configure new customer accounts correctly", backstory="Meticulous ops engineer who never skips a setup step."\n- communicator: role="Customer Communications Specialist", goal="Send warm, personalized onboarding messages", backstory="Friendly CSM who writes like a human, not a template."\n- scheduler: role="Scheduling Coordinator", goal="Find and book the best kickoff call time", backstory="Efficient coordinator who respects everyone\'s calendar."\n- manager: role="Onboarding Manager", goal="Ensure every new customer is fully onboarded within 24 hours", backstory="Experienced ops lead who escalates issues immediately."\n\nAll agents share the same llm instance. Add a comment explaining that backstories should constrain behavior (e.g. "never skips a setup step" actually changes how the agent plans), not just add flavor text.',
              verify: 'Import crew.py with no errors and print each agent\'s role to confirm all four agents are defined correctly.',
            },
          ],
          goFurther: 'Add a fifth "QA Agent" whose job is to re-check the Provisioning Agent\'s output before Communications proceeds. 🛠️🛠️',
        },
        {
          number: 2,
          title: 'Build the provisioning, comms, and scheduling tools',
          time: '40 min',
          description: 'Wrap your internal APIs as CrewAI tools so each agent has something concrete to call.',
          steps: [
            {
              instruction: 'Ask Claude to build tools/provisioning.py, tools/comms.py, and tools/scheduling.py as CrewAI @tool functions.',
              prompt: 'Write three Python files defining CrewAI tools with the @tool decorator from crewai.tools.\n\n1) tools/provisioning.py with create_account(company_name: str, plan: str, admin_email: str) -> str that:\n- POSTs to https://internal-api.yourapp.com/accounts with company_name, plan, admin_email\n- Includes an Authorization Bearer header for INTERNAL_API_KEY\n- Calls raise_for_status() so failures surface as exceptions (not silent failures)\n- Returns the account_id from the response JSON\n- Has a clear docstring describing what it does, since CrewAI agents read docstrings to decide when to call a tool\n\n2) tools/comms.py with:\n- send_welcome_email(to_email: str, customer_name: str, account_id: str) -> str that builds and sends a welcome email via smtplib/EmailMessage with subject "Welcome to AgentForge, {customer_name}!" and a body referencing their account_id\n- send_slack_invite(email: str, workspace_id: str) -> str that POSTs to Slack\'s conversations.invite API with a Bearer SLACK_BOT_TOKEN to invite the email to the workspace channel\n\n3) tools/scheduling.py with book_kickoff_call(customer_email: str, preferred_window: str) -> str that:\n- Uses the Google Calendar API to query freebusy for "primary" between 9am-5pm on preferred_window\n- Finds the first free 30-minute slot (via a small helper find_first_free_slot)\n- Creates a "Kickoff Call" event inviting customer_email and returns the event\'s htmlLink\n- Define find_first_free_slot and add_minutes as small pure helper functions, separate from the tool function, so they can be unit tested independently',
              verify: 'Call create_account() against a test/mock endpoint and confirm it returns an account_id. Send a test welcome email and Slack invite to yourself. Run book_kickoff_call() against your calendar and confirm an event appears.',
            },
          ],
          goFurther: 'Add a dry_run flag to each tool that logs the action instead of calling the real API — useful for testing the crew end-to-end safely. 🛠️',
        },
        {
          number: 3,
          title: 'Define tasks and assemble the crew',
          time: '40 min',
          description: 'Wire the tools to tasks, assign tasks to agents, and run the crew under the Manager in hierarchical mode.',
          steps: [
            {
              instruction: 'Ask Claude to build tasks.py with the three onboarding tasks, and main.py to assemble and run the crew.',
              prompt: 'Write two Python files for a CrewAI onboarding system.\n\n1) tasks.py importing the agents from crew.py and the tools from tools/provisioning.py, tools/comms.py, tools/scheduling.py. Define three Task objects:\n- provision_task: description="Create a new account for {company_name} on the {plan} plan for {admin_email}.", agent=provisioner, tools=[create_account], expected_output="The new account_id"\n- comms_task: description="Send a welcome email and Slack invite to {admin_email} for account {account_id}.", agent=communicator, tools=[send_welcome_email, send_slack_invite], expected_output="Confirmation both messages were sent"\n- schedule_task: description="Book a kickoff call with {admin_email} sometime in the next business week.", agent=scheduler, tools=[book_kickoff_call], expected_output="Link to the booked calendar event"\n\nAdd a comment that {placeholders} in task descriptions get filled from the kickoff() inputs dict at runtime.\n\n2) main.py that:\n- Imports the agents, manager, and tasks\n- Creates a Crew with agents=[provisioner, communicator, scheduler], tasks=[provision_task, comms_task, schedule_task], manager_agent=manager, process=Process.hierarchical, verbose=True\n- Calls crew.kickoff(inputs={"company_name": "Acme Robotics", "plan": "Pro", "admin_email": "jane@acme.com"})\n- Prints the result\n\nAdd a comment explaining that Process.hierarchical lets the manager dynamically re-order or retry tasks, while Process.sequential is simpler and more predictable.',
              verify: 'Run main.py with a test company — watch the verbose output show the manager delegating to each specialist agent in turn, ending with a booked call link.',
            },
          ],
          goFurther: 'Try switching process=Process.sequential and compare how the run differs — note when hierarchical mode actually re-plans vs. just running in order. 🛠️🛠️',
        },
        {
          number: 4,
          title: 'Add failure escalation and a run summary',
          time: '50 min',
          description: 'Make sure a failed step alerts a human with enough context to resume, and give account managers a plain-English recap.',
          steps: [
            {
              instruction: 'Ask Claude to build escalation.py for Slack alerts on failure, and summary.py to have Claude summarize the run for account managers — then wire both into main.py.',
              prompt: 'Write two Python files and update main.py for a CrewAI onboarding system.\n\n1) escalation.py with escalate_to_human(step_name, error, context) that POSTs to a Slack webhook URL with a message like "⚠️ Onboarding step \'{step_name}\' failed: {error}\\nContext: {context}\\nNeeds manual follow-up." Add a comment that the escalation should include enough context for a human to resume from where the agent stopped, not start over.\n\n2) summary.py using the anthropic Python SDK with summarize_run(task_outputs) that:\n- Sends the raw task outputs from the crew run to Claude (claude-sonnet-4-5, max_tokens=200)\n- Asks for a 3-sentence summary for the account manager: what was done, what\'s scheduled next, and anything needing their attention\n- Returns the summary text\nAdd a comment that account managers skim, so the summary should lead with anything needing action.\n\n3) Update main.py to wrap crew.kickoff() in a try/except: on success, call summarize_run() with the result and print it; on exception, call escalate_to_human() with the failing step name (if determinable), the error, and the kickoff inputs as context.',
              verify: 'Run main.py with a deliberately broken tool (e.g. wrong API URL) and confirm escalate_to_human() posts to Slack with useful context. Run it successfully and confirm summarize_run() prints a 3-sentence recap.',
            },
          ],
          goFurther: 'Log every run (inputs, outputs, summary, success/failure) to a database table so you can build an onboarding dashboard later. 🛠️🛠️',
        },
      ],
      portfolio: 'Add this to your portfolio as "Multi-Agent Customer Onboarding Orchestrator" — this is a flagship piece for ops, platform engineering, or AI engineering roles. Show the crew diagram (3 specialists + manager), a sample run log, the Slack escalation, and the Claude-generated summary.',
      portfolioPrompt: 'Help me write a portfolio entry and a LinkedIn post for a project I just built: a Multi-Agent Customer Onboarding Orchestrator using CrewAI and Claude. It coordinates a crew of specialist AI agents — a Provisioning Agent that creates customer accounts via API, a Communications Agent that sends personalized welcome emails and Slack invites, and a Scheduling Agent that books kickoff calls via Google Calendar — all directed by a Manager Agent running in hierarchical mode. If any step fails, it escalates to a human Slack channel with full context for manual follow-up, and after each run Claude generates a 3-sentence summary for the account manager. Write:\n1. A 3-4 sentence portfolio project description emphasizing multi-agent orchestration and reliability (failure handling)\n2. A LinkedIn post (under 150 words) for an AI/platform engineering audience\n3. Two resume bullet points quantifying onboarding time saved and operational reliability',
    },
    steps: [
      {
        number: 1,
        title: 'Define the agent crew',
        description: 'Create three specialist agents and one manager agent with CrewAI, each with a distinct role and goal.',
        code: `# crew.py
from crewai import Agent
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(model="claude-sonnet-4-5")

provisioner = Agent(role="Provisioning Specialist",
    goal="Create and configure new customer accounts correctly",
    backstory="Meticulous ops engineer who never skips a setup step.", llm=llm)

communicator = Agent(role="Customer Communications Specialist",
    goal="Send warm, personalized onboarding messages",
    backstory="Friendly CSM who writes like a human, not a template.", llm=llm)

scheduler = Agent(role="Scheduling Coordinator",
    goal="Find and book the best kickoff call time",
    backstory="Efficient coordinator who respects everyone's calendar.", llm=llm)

manager = Agent(role="Onboarding Manager",
    goal="Ensure every new customer is fully onboarded within 24 hours",
    backstory="Experienced ops lead who escalates issues immediately.", llm=llm)`,
        tip: 'Write backstories that constrain behavior, not just flavor text — "never skips a setup step" actually changes how the agent plans.',
      },
      {
        number: 2,
        title: 'Build the provisioning tool',
        description: 'Wrap your internal account-creation API as a CrewAI tool the Provisioning Agent can call.',
        code: `# tools/provisioning.py
from crewai.tools import tool
import requests

@tool("create_account")
def create_account(company_name: str, plan: str, admin_email: str) -> str:
    """Create a new customer account in the internal system."""
    resp = requests.post("https://internal-api.yourapp.com/accounts", json={
        "company_name": company_name, "plan": plan, "admin_email": admin_email,
    }, headers={"Authorization": "Bearer INTERNAL_API_KEY"})
    resp.raise_for_status()
    return resp.json()["account_id"]`,
        tip: 'Always raise_for_status() inside tools — CrewAI agents handle exceptions far better than silent failures.',
      },
      {
        number: 3,
        title: 'Build the communications tool',
        description: 'Wrap email sending and Slack invite APIs as tools for the Communications Agent.',
        code: `# tools/comms.py
from crewai.tools import tool
import requests, smtplib
from email.message import EmailMessage

@tool("send_welcome_email")
def send_welcome_email(to_email: str, customer_name: str, account_id: str) -> str:
    """Send a personalized welcome email to a new customer."""
    msg = EmailMessage()
    msg["Subject"] = f"Welcome to AgentForge, {customer_name}!"
    msg["From"] = "onboarding@yourapp.com"
    msg["To"] = to_email
    msg.set_content(f"Hi {customer_name},\\n\\nYour account ({account_id}) is ready. Let's get you set up!")
    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login("onboarding@yourapp.com", "app-password")
        server.send_message(msg)
    return "email sent"

@tool("send_slack_invite")
def send_slack_invite(email: str, workspace_id: str) -> str:
    """Invite a new customer to the shared Slack channel."""
    requests.post(f"https://slack.com/api/conversations.invite",
        headers={"Authorization": "Bearer SLACK_BOT_TOKEN"},
        json={"channel": workspace_id, "users": email})
    return "invite sent"`,
        tip: 'Tool docstrings are read by the LLM to decide when to call the tool — write them as clear instructions, not comments.',
      },
      {
        number: 4,
        title: 'Build the scheduling tool',
        description: 'Wrap Google Calendar’s freebusy and events API to find and book kickoff call slots.',
        code: `# tools/scheduling.py
from crewai.tools import tool
from googleapiclient.discovery import build

@tool("book_kickoff_call")
def book_kickoff_call(customer_email: str, preferred_window: str) -> str:
    """Find a free 30-minute slot in the given window and book a kickoff call."""
    service = build("calendar", "v3", credentials=get_credentials())
    fb = service.freebusy().query(body={
        "timeMin": f"{preferred_window}T09:00:00Z", "timeMax": f"{preferred_window}T17:00:00Z",
        "items": [{"id": "primary"}],
    }).execute()
    busy = fb["calendars"]["primary"]["busy"]
    slot_start = find_first_free_slot(busy, preferred_window)
    event = service.events().insert(calendarId="primary", body={
        "summary": "Kickoff Call", "attendees": [{"email": customer_email}],
        "start": {"dateTime": slot_start}, "end": {"dateTime": add_minutes(slot_start, 30)},
    }).execute()
    return event["htmlLink"]`,
        tip: 'Define find_first_free_slot and add_minutes as small pure helper functions you unit test independently of the agent.',
      },
      {
        number: 5,
        title: 'Define tasks and assign tools',
        description: 'Create CrewAI Task objects for each step of onboarding and assign the relevant tools to each agent.',
        code: `# tasks.py
from crewai import Task

provision_task = Task(
    description="Create a new account for {company_name} on the {plan} plan for {admin_email}.",
    agent=provisioner, tools=[create_account],
    expected_output="The new account_id")

comms_task = Task(
    description="Send a welcome email and Slack invite to {admin_email} for account {account_id}.",
    agent=communicator, tools=[send_welcome_email, send_slack_invite],
    expected_output="Confirmation both messages were sent")

schedule_task = Task(
    description="Book a kickoff call with {admin_email} sometime in the next business week.",
    agent=scheduler, tools=[book_kickoff_call],
    expected_output="Link to the booked calendar event")`,
        tip: 'Use {placeholders} in task descriptions — CrewAI fills them from the kickoff() inputs dict at runtime.',
      },
      {
        number: 6,
        title: 'Assemble the crew with the manager',
        description: 'Run tasks sequentially under a manager agent that can re-plan if a step fails.',
        code: `# main.py
from crewai import Crew, Process

crew = Crew(
    agents=[provisioner, communicator, scheduler],
    tasks=[provision_task, comms_task, schedule_task],
    manager_agent=manager,
    process=Process.hierarchical,
    verbose=True,
)

result = crew.kickoff(inputs={
    "company_name": "Acme Robotics", "plan": "Pro", "admin_email": "jane@acme.com",
})
print(result)`,
        tip: 'Process.hierarchical lets the manager agent dynamically re-order or retry tasks — use Process.sequential for simpler, predictable flows.',
      },
      {
        number: 7,
        title: 'Add failure escalation',
        description: 'If any tool call raises after retries, have the manager post an escalation to a human Slack channel instead of failing silently.',
        code: `# escalation.py
import requests

def escalate_to_human(step_name, error, context):
    requests.post("https://hooks.slack.com/services/XXX/YYY/ZZZ", json={
        "text": f"⚠️ Onboarding step '{step_name}' failed: {error}\\nContext: {context}\\nNeeds manual follow-up."
    })

# Wrap crew.kickoff() in try/except and call escalate_to_human on failure,
# including which step failed and the inputs so a human can resume manually.`,
        tip: 'Always include enough context in the escalation for a human to resume from where the agent stopped, not start over.',
      },
      {
        number: 8,
        title: 'Generate the run summary',
        description: 'After the crew finishes, ask Claude to turn the raw task outputs into a one-paragraph summary for the account manager.',
        code: `# summary.py
from anthropic import Anthropic
ai = Anthropic()

def summarize_run(task_outputs):
    prompt = f"""These are the raw outputs from an automated customer onboarding run:
{task_outputs}

Write a 3-sentence summary for the account manager: what was done, what's scheduled next,
and anything that needs their attention."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=200,
        messages=[{"role": "user", "content": prompt}]).content[0].text`,
        tip: 'Account managers skim — keep the summary to 3 sentences and lead with anything that needs their action.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Multi-Agent Customer Onboarding Orchestrator (starter)
Run: pip install crewai langchain-anthropic anthropic
"""
from crewai import Agent, Task, Crew, Process
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(model="claude-sonnet-4-5")

provisioner = Agent(role="Provisioning Specialist",
    goal="Create new customer accounts correctly", llm=llm,
    backstory="Meticulous ops engineer.")

communicator = Agent(role="Communications Specialist",
    goal="Send a warm welcome message", llm=llm,
    backstory="Friendly customer success manager.")

provision_task = Task(description="Outline the steps to create an account for {company_name}.",
    agent=provisioner, expected_output="A numbered setup checklist")
comms_task = Task(description="Draft a welcome email for {company_name}'s admin.",
    agent=communicator, expected_output="A complete welcome email")

crew = Crew(agents=[provisioner, communicator], tasks=[provision_task, comms_task],
    process=Process.sequential, verbose=True)

if __name__ == "__main__":
    result = crew.kickoff(inputs={"company_name": "Acme Robotics"})
    print(result)
`,
    resources: [
      { title: 'CrewAI Documentation', url: 'https://docs.crewai.com' },
      { title: 'Google Calendar API', url: 'https://developers.google.com/calendar/api' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 27,
    title: 'Autonomous Data Pipeline Agent',
    emoji: '🔄',
    department: ['Data & Analytics', 'Engineering'],
    departmentIds: ['data', 'engineering'],
    difficulty: 'Advanced',
    description:
      'A self-healing ETL pipeline agent that ingests data from multiple sources, detects schema drift, fixes broken transformations, and reports data quality issues.',
    whatYouBuild:
      'A pipeline orchestrator that pulls data from APIs/CSVs/databases on a schedule, validates schema against an expected contract, and when drift is detected, asks Claude to propose and apply a transformation fix. Failed runs are logged with full context, data quality metrics are computed per run, and a daily summary is posted to Slack.',
    whatYouLearn: [
      'Design a schema contract and validate incoming data against it',
      'Detect and classify schema drift automatically',
      'Use Claude to generate and apply transformation patches',
      'Build a self-healing retry loop with bounded attempts',
      'Compute data quality metrics (completeness, freshness, validity)',
      'Implement structured logging for pipeline observability',
    ],
    techStack: ['Python', 'pandas', 'Claude API', 'SQLAlchemy', 'schedule'],
    buildTime: '6.5 hrs',
    xp: 800,
    popularity: 79,
    prerequisites: ['Strong pandas knowledge', 'Basic SQL', 'Completed Financial Reporting Agent'],
    tags: ['data-engineering', 'etl', 'self-healing', 'pipelines'],
    session: {
      totalTime: '150 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'A schema contract system and ingester pulling from APIs, CSVs, and SQL sources',
        'A schema validator that detects drift (missing/extra columns, type mismatches)',
        'A Claude-powered self-healer that proposes pandas fixes for drift, applied in a sandboxed namespace and re-validated',
        'Data quality scoring, structured JSONL run logs, and a daily Slack summary on a schedule',
      ],
      whatYouNeed: [
        'Python installed locally',
        'An Anthropic API key (console.anthropic.com)',
        'pip install pandas requests sqlalchemy schedule anthropic',
        'At least one real data source (an API, CSV, or database table) to ingest',
        'A Slack incoming webhook URL for the daily summary',
      ],
      builds: [
        {
          number: 1,
          title: 'Define the schema contract and build the ingester',
          time: '30 min',
          description: 'Specify what "correct" data looks like for each source, then pull raw data into pandas.',
          steps: [
            {
              instruction: 'Ask Claude to build contracts.py with a SCHEMA_CONTRACTS dict, and ingest.py with an ingest_source function supporting API, CSV, and SQL sources.',
              prompt: 'Write two Python files for a self-healing ETL pipeline.\n\n1) contracts.py with a SCHEMA_CONTRACTS dict. Include at least one entry (e.g. "orders") with a "columns" dict mapping column names to expected types (e.g. {"order_id": "int", "customer_id": "int", "amount": "float", "created_at": "datetime"}) and a "required" list of column names that must be present and non-null. Add a comment recommending versioned contract names (e.g. orders_v2) to distinguish intentional schema changes from accidental drift.\n\n2) ingest.py with ingest_source(source_config) that:\n- If source_config["type"] == "api", GETs source_config["url"] with optional headers and returns a DataFrame from the JSON response\n- If source_config["type"] == "csv", reads source_config["path"] with pd.read_csv\n- If source_config["type"] == "sql", uses SQLAlchemy create_engine(source_config["connection_string"]) and pd.read_sql(source_config["query"], engine)\n- Returns a pandas DataFrame in all cases\n\nAdd a comment that each ingestion call should be wrapped in a timeout and retry, since flaky upstream APIs are the most common cause of pipeline failures.',
              verify: 'Run ingest_source() against one real source config and confirm you get back a DataFrame with the expected columns.',
            },
          ],
          goFurther: 'Add a retry decorator (e.g. 3 attempts with exponential backoff) around ingest_source() and apply it to all three source types. 🛠️',
        },
        {
          number: 2,
          title: 'Build the schema validator',
          time: '25 min',
          description: 'Compare ingested data against the contract and classify any differences as missing columns, extra columns, or type mismatches.',
          steps: [
            {
              instruction: 'Ask Claude to build validate.py with a validate_schema function.',
              prompt: 'Write validate.py for a self-healing ETL pipeline with a function validate_schema(df, contract) that:\n- Computes the set of expected columns from contract["columns"] and the set of actual columns in df\n- If any expected columns are missing, appends {"type": "missing_columns", "columns": [...]} to an issues list\n- If there are extra columns not in the contract, appends {"type": "extra_columns", "columns": [...]}\n- For each column present in both, if the expected type is "int" but the actual pandas dtype doesn\'t contain "int", appends {"type": "type_mismatch", "column": ..., "expected": ..., "actual": ...}\n- Returns the issues list (empty list if everything matches)\n\nAdd a comment that "extra_columns" should be treated as informational, not failures — new fields from upstream are common and rarely break anything.',
              verify: 'Run validate_schema() on a DataFrame that matches the contract — issues should be empty. Then rename or drop a column and confirm validate_schema() reports the right issue type.',
            },
          ],
          goFurther: 'Extend the type check to cover "float", "datetime", and "str" expected types, not just "int". 🛠️',
        },
        {
          number: 3,
          title: 'Build the Claude self-healer and sandboxed fix applier',
          time: '40 min',
          description: 'When drift is detected, ask Claude to write a fix function, run it in a restricted namespace, and re-validate before accepting it.',
          steps: [
            {
              instruction: 'Ask Claude to build heal.py with a propose_fix function, and apply_fix.py with a sandboxed apply_fix function.',
              prompt: 'Write two Python files for a self-healing ETL pipeline.\n\n1) heal.py using the anthropic Python SDK with propose_fix(issues, sample_columns, contract) that:\n- Builds a prompt telling Claude the expected schema (contract["columns"]), the detected issues, and the incoming data\'s actual columns\n- Asks Claude to write a Python function `fix(df)` that takes the incoming DataFrame and returns one matching the expected schema (renaming, casting, or dropping columns as needed)\n- Explicitly asks for ONLY the function code, no explanation\n- Calls claude-sonnet-4-5 with max_tokens=600 and returns the response text\n\n2) apply_fix.py with apply_fix(df, fix_code, contract) that:\n- Creates a restricted namespace dict containing only {"pd": pandas}\n- Uses exec() to define the fix function from fix_code in that namespace\n- Calls namespace["fix"](df) to get fixed_df\n- Re-runs validate_schema(fixed_df, contract) — if any issues remain, raises ValueError with the remaining issues\n- Returns fixed_df if clean\n\nAdd a prominent comment: never exec() Claude-generated code directly in production without a sandboxed review step — in early runs, log proposed fixes for human approval first instead of auto-applying them.',
              verify: 'Simulate drift (rename a column in a test DataFrame), run propose_fix() then apply_fix() — confirm the fixed DataFrame passes validate_schema() with zero remaining issues. Confirm apply_fix() raises ValueError if the fix is incomplete.',
            },
          ],
          goFurther: 'Add a "review mode" where proposed fixes are written to a pending_fixes.jsonl file for a human to approve before apply_fix() runs them. 🛠️🛠️',
        },
        {
          number: 4,
          title: 'Add quality scoring, run logging, and daily Slack reports',
          time: '55 min',
          description: 'Score each run\'s data quality, log everything as JSON lines, and run the whole thing on a schedule with a daily Slack digest.',
          steps: [
            {
              instruction: 'Ask Claude to build quality.py, logging_pipeline.py, and main.py to tie everything together with scheduling and Slack reporting.',
              prompt: 'Write three Python files for a self-healing ETL pipeline.\n\n1) quality.py with quality_report(df, contract, freshness_column="created_at", max_age_hours=24) that:\n- Computes completeness as 1 minus the mean fraction of missing values across contract["required"] columns\n- If freshness_column is in df.columns, computes freshness as max(0, 1 - age_hours / max_age_hours) where age_hours is hours since the latest timestamp in that column; otherwise freshness is None\n- Returns {"completeness": rounded to 3 decimals, "freshness": ..., "row_count": len(df)}\n\n2) logging_pipeline.py with log_run(source_name, status, issues, fix_applied, quality) that appends a JSON line to pipeline_log.jsonl containing timestamp (UTC ISO), source, status, issues, fix_applied, and quality.\n\n3) main.py that:\n- Defines run_all_sources(sources, contracts): for each named source, ingest it, validate against its contract, and if issues exist call propose_fix() then apply_fix() (catching ValueError to log a "failed" run and skip); otherwise compute quality_report() and log_run() with status "ok"; collect {"source": name, "quality": ..., "fix_applied": ...} for each source\n- Defines post_daily_summary(results) that builds a text summary line per source ("source: quality (fix applied: bool)") and POSTs it to a Slack incoming webhook\n- Uses the `schedule` library to run post_daily_summary(run_all_sources(SOURCES, SCHEMA_CONTRACTS)) every day at 06:00\n- Includes a loop calling schedule.run_pending() with a short sleep\n\nAdd a comment that the schedule loop should run inside a process manager (systemd, supervisord, or a Docker restart policy) so it survives crashes. Track quality scores over time in a small SQLite table — a sudden drop is often the earliest sign of an upstream problem.',
              verify: 'Run run_all_sources() once manually and confirm pipeline_log.jsonl gets a new line per source with the right status. Run post_daily_summary() and confirm the Slack message arrives with per-source quality and fix status.',
            },
          ],
          goFurther: 'Load pipeline_log.jsonl into pandas with pd.read_json(path, lines=True) and chart completeness/freshness trends over the last 30 days. 🛠️🛠️',
        },
      ],
      portfolio: 'Add this to your portfolio as "Self-Healing ETL Pipeline Agent" — a top-tier project for data engineering and platform roles. Show a schema drift example: the validator catching it, Claude\'s proposed fix code, and the before/after quality report.',
      portfolioPrompt: 'Help me write a portfolio entry and a LinkedIn post for a project I just built: a Self-Healing Autonomous Data Pipeline Agent. It ingests data from APIs, CSVs, and SQL databases on a schedule, validates each source against a schema contract, and when schema drift is detected (missing columns, extra columns, type mismatches), asks Claude to generate a pandas transformation that maps the new schema back to the contract — applied in a sandboxed namespace and re-validated before being accepted. Every run computes data quality metrics (completeness, freshness, row count), logs structured JSON lines for observability, and posts a daily summary to Slack. Write:\n1. A 3-4 sentence portfolio project description emphasizing self-healing and reliability\n2. A LinkedIn post (under 150 words) for a data engineering audience\n3. Two resume bullet points quantifying pipeline uptime/reliability improvements',
    },
    steps: [
      {
        number: 1,
        title: 'Define the schema contract',
        description: 'Specify the expected columns, types, and constraints for each data source as a JSON contract.',
        code: `# contracts.py
SCHEMA_CONTRACTS = {
    "orders": {
        "columns": {"order_id": "int", "customer_id": "int", "amount": "float", "created_at": "datetime"},
        "required": ["order_id", "customer_id", "amount"],
    },
}`,
        tip: 'Version your contracts (e.g. orders_v2) so you can detect intentional schema changes vs. accidental drift.',
      },
      {
        number: 2,
        title: 'Build the ingester',
        description: 'Pull raw data from a source (API, CSV, or database table) into a pandas DataFrame.',
        code: `# ingest.py
import pandas as pd
import requests

def ingest_source(source_config):
    if source_config["type"] == "api":
        data = requests.get(source_config["url"], headers=source_config.get("headers", {})).json()
        return pd.DataFrame(data)
    elif source_config["type"] == "csv":
        return pd.read_csv(source_config["path"])
    elif source_config["type"] == "sql":
        from sqlalchemy import create_engine
        engine = create_engine(source_config["connection_string"])
        return pd.read_sql(source_config["query"], engine)`,
        tip: 'Wrap each ingestion call in a timeout and retry — flaky upstream APIs are the #1 cause of pipeline failures.',
      },
      {
        number: 3,
        title: 'Build the schema validator',
        description: 'Compare the ingested DataFrame’s columns and types against the contract and report differences.',
        code: `# validate.py
def validate_schema(df, contract):
    issues = []
    expected_cols = set(contract["columns"].keys())
    actual_cols = set(df.columns)

    missing = expected_cols - actual_cols
    extra = actual_cols - expected_cols
    if missing:
        issues.append({"type": "missing_columns", "columns": list(missing)})
    if extra:
        issues.append({"type": "extra_columns", "columns": list(extra)})

    for col, expected_type in contract["columns"].items():
        if col in df.columns:
            actual_type = str(df[col].dtype)
            if expected_type == "int" and "int" not in actual_type:
                issues.append({"type": "type_mismatch", "column": col, "expected": expected_type, "actual": actual_type})
    return issues`,
        tip: 'Treat "extra_columns" as informational, not failures — new fields from upstream are common and rarely break anything.',
      },
      {
        number: 4,
        title: 'Build the Claude self-healer',
        description: 'When schema drift is detected, ask Claude to generate a pandas transformation that maps the new schema back to the contract.',
        code: `# heal.py
from anthropic import Anthropic
ai = Anthropic()

def propose_fix(issues, sample_columns, contract):
    prompt = f"""Our data pipeline expects this schema: {contract['columns']}
The incoming data has these issues: {issues}
The incoming data's actual columns are: {sample_columns}

Write a Python function \`fix(df)\` that takes the incoming pandas DataFrame and returns
a DataFrame matching the expected schema (rename/cast/drop columns as needed).
Return ONLY the function code, no explanation."""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=600,
        messages=[{"role": "user", "content": prompt}])
    return resp.content[0].text`,
        tip: 'Never exec() Claude-generated code directly in production without a sandboxed review step — log proposed fixes for human approval first in early runs.',
      },
      {
        number: 5,
        title: 'Build a sandboxed fix applier',
        description: 'Execute the proposed fix function in a restricted namespace and validate the result before committing.',
        code: `# apply_fix.py
def apply_fix(df, fix_code, contract):
    namespace = {"pd": __import__("pandas")}
    exec(fix_code, namespace)
    fixed_df = namespace["fix"](df)
    remaining_issues = validate_schema(fixed_df, contract)
    if remaining_issues:
        raise ValueError(f"Fix did not resolve all issues: {remaining_issues}")
    return fixed_df`,
        tip: 'Re-run validate_schema after applying the fix — only accept it if the result is fully clean.',
      },
      {
        number: 6,
        title: 'Build the data quality scorer',
        description: 'Compute completeness, freshness, and validity scores for each pipeline run.',
        code: `# quality.py
from datetime import datetime

def quality_report(df, contract, freshness_column="created_at", max_age_hours=24):
    completeness = 1 - df[contract["required"]].isna().mean().mean()
    if freshness_column in df.columns:
        latest = pd.to_datetime(df[freshness_column]).max()
        age_hours = (datetime.utcnow() - latest).total_seconds() / 3600
        freshness = max(0, 1 - age_hours / max_age_hours)
    else:
        freshness = None
    return {"completeness": round(completeness, 3), "freshness": freshness, "row_count": len(df)}`,
        tip: 'Track quality scores over time in a small SQLite table — a sudden drop is often the earliest sign of an upstream problem.',
      },
      {
        number: 7,
        title: 'Build structured run logging',
        description: 'Log every pipeline run with status, issues found, fixes applied, and quality metrics as JSON lines.',
        code: `# logging_pipeline.py
import json
from datetime import datetime

def log_run(source_name, status, issues, fix_applied, quality):
    entry = {
        "timestamp": datetime.utcnow().isoformat(), "source": source_name,
        "status": status, "issues": issues, "fix_applied": fix_applied, "quality": quality,
    }
    with open("pipeline_log.jsonl", "a") as f:
        f.write(json.dumps(entry) + "\\n")`,
        tip: 'JSON Lines format makes it trivial to load the log into pandas later for trend analysis: pd.read_json(path, lines=True).',
      },
      {
        number: 8,
        title: 'Schedule and report daily',
        description: 'Run all sources on a schedule and post a daily summary of statuses and quality scores to Slack.',
        code: `# main.py
import schedule, time, requests, pandas as pd

def run_all_sources(sources, contracts):
    results = []
    for name, config in sources.items():
        df = ingest_source(config)
        issues = validate_schema(df, contracts[name])
        fix_applied = False
        if issues:
            fix_code = propose_fix(issues, list(df.columns), contracts[name])
            try:
                df = apply_fix(df, fix_code, contracts[name])
                fix_applied = True
            except ValueError:
                log_run(name, "failed", issues, False, None)
                continue
        quality = quality_report(df, contracts[name])
        log_run(name, "ok", issues, fix_applied, quality)
        results.append({"source": name, "quality": quality, "fix_applied": fix_applied})
    return results

def post_daily_summary(results):
    text = "\\n".join(f"{r['source']}: {r['quality']} (fix applied: {r['fix_applied']})" for r in results)
    requests.post("https://hooks.slack.com/services/XXX/YYY/ZZZ", json={"text": f"Daily Pipeline Report:\\n{text}"})

schedule.every().day.at("06:00").do(lambda: post_daily_summary(run_all_sources(SOURCES, SCHEMA_CONTRACTS)))`,
        tip: 'Run the schedule loop inside a process manager (systemd, supervisord, or a Docker restart policy) so it survives crashes.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Autonomous Data Pipeline Agent (starter)
Run: pip install pandas anthropic requests sqlalchemy
"""
import pandas as pd
from anthropic import Anthropic

ai = Anthropic()
CONTRACT = {"columns": {"order_id": "int", "customer_id": "int", "amount": "float"}, "required": ["order_id", "amount"]}

def validate(df, contract):
    return [c for c in contract["columns"] if c not in df.columns]

def propose_fix(missing_cols, actual_cols):
    prompt = f"""Expected columns: {list(CONTRACT['columns'].keys())}, missing: {missing_cols}, actual: {actual_cols}.
Write a Python function fix(df) that renames/derives columns to match expected schema. Return only the function."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=400,
        messages=[{"role": "user", "content": prompt}]).content[0].text

if __name__ == "__main__":
    df = pd.read_csv("orders.csv")
    missing = validate(df, CONTRACT)
    if missing:
        print(propose_fix(missing, list(df.columns)))
    else:
        print("Schema OK", df.shape)
`,
    resources: [
      { title: 'pandas Documentation', url: 'https://pandas.pydata.org/docs/' },
      { title: 'SQLAlchemy Documentation', url: 'https://docs.sqlalchemy.org' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 28,
    title: 'AI Sales Forecasting Agent',
    emoji: '📈',
    department: ['Sales', 'Finance'],
    departmentIds: ['sales', 'finance'],
    difficulty: 'Advanced',
    description:
      'Combines statistical time-series forecasting with Claude’s reasoning to produce sales forecasts plus narrative explanations of the drivers behind them.',
    whatYouBuild:
      'A forecasting pipeline that loads historical sales data, fits a Prophet time-series model to project the next quarter, computes confidence intervals, and then asks Claude to analyze the forecast alongside pipeline data (deal stages, seasonality, rep performance) to write an executive narrative explaining the forecast and identifying risks/opportunities.',
    whatYouLearn: [
      'Fit and tune a Prophet time-series forecasting model',
      'Compute and interpret confidence intervals',
      'Combine quantitative forecasts with qualitative pipeline data',
      'Write prompts that ask Claude to reason over numerical + textual context together',
      'Detect forecast risk factors (seasonality, concentration, pipeline coverage)',
      'Generate executive-ready forecast narratives',
    ],
    techStack: ['Python', 'pandas', 'Prophet', 'Claude API', 'matplotlib'],
    buildTime: '6 hrs',
    xp: 780,
    popularity: 81,
    prerequisites: ['pandas basics', 'Basic statistics', 'Historical sales CSV (24+ months)'],
    tags: ['forecasting', 'time-series', 'sales', 'finance'],
    session: {
      totalTime: '150 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'A monthly time-series dataset and a fitted Prophet model forecasting the next 3 months with confidence intervals',
        'Pipeline coverage and concentration risk calculations layered on top of the statistical forecast',
        'A rep attainment model that risk-adjusts pipeline contributions',
        'A Claude-written executive forecast narrative, a confidence-band chart, and a combined markdown forecast pack',
      ],
      whatYouNeed: [
        'Python installed locally',
        'An Anthropic API key (console.anthropic.com)',
        'pip install pandas prophet anthropic matplotlib',
        'A sales.csv with at least 24 months of date + amount history, plus open pipeline deals and rep quota/closed-won history',
      ],
      builds: [
        {
          number: 1,
          title: 'Prepare the time series and fit the forecast model',
          time: '35 min',
          description: 'Aggregate raw sales data into a monthly series and fit a Prophet model to project the next quarter.',
          steps: [
            {
              instruction: 'Ask Claude to build prepare.py to aggregate sales into a monthly series, and forecast.py to fit a Prophet model and produce a 3-month forecast.',
              prompt: 'Write two Python files for a sales forecasting pipeline.\n\n1) prepare.py with prepare_timeseries(path="sales.csv") that:\n- Reads the CSV with pandas, parsing the "date" column as dates\n- Groups by month (pd.Grouper(key="date", freq="M")) and sums the "amount" column\n- Renames the result columns to ["ds", "y"] (Prophet\'s required format)\n- Returns the monthly DataFrame\n\n2) forecast.py with fit_forecast(df, periods=3) that:\n- Creates a Prophet model with yearly_seasonality=True, weekly_seasonality=False\n- Fits it on df\n- Creates a future dataframe extending periods months with freq="M"\n- Predicts and returns the last `periods` rows of forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]]\n\nAdd a comment that Prophet needs at least 2 full seasonal cycles of history (24+ months for monthly seasonality), and that `pip install prophet` may need conda-forge if the pip build fails due to cmdstanpy.',
              verify: 'Run prepare_timeseries() and confirm you get a DataFrame with "ds" and "y" columns, one row per month. Run fit_forecast() and confirm it returns 3 rows with yhat, yhat_lower, and yhat_upper.',
            },
          ],
          goFurther: 'Add monthly seasonality too (Prophet add_seasonality) if your business has within-month patterns like end-of-quarter pushes. 🛠️🛠️',
        },
        {
          number: 2,
          title: 'Compute pipeline coverage and concentration risk',
          time: '30 min',
          description: 'Check whether current open pipeline can realistically cover the forecast, and how dependent that pipeline is on a handful of big deals.',
          steps: [
            {
              instruction: 'Ask Claude to build coverage.py with a pipeline_coverage function, and concentration.py with a concentration_risk function.',
              prompt: 'Write two Python files for a sales forecasting pipeline.\n\n1) coverage.py with pipeline_coverage(forecast_row, open_pipeline_value) that:\n- Takes the forecast\'s "yhat" value as the target\n- Computes coverage = open_pipeline_value / target (None if target is 0/falsy)\n- Returns {"target": target, "open_pipeline": open_pipeline_value, "coverage_ratio": rounded to 2 decimals or None}\n\nAdd a comment that a healthy B2B coverage ratio is typically 3-4x, and months below 2.5x should be flagged as at-risk.\n\n2) concentration.py with concentration_risk(deals_df, top_n=3) that:\n- Computes total pipeline value as the sum of deals_df["amount"]\n- Computes the sum of the top_n largest deals\n- Returns {"top_n_share": rounded to 3 decimals (0 if total is 0), "top_deals": the top_n deals as a list of dicts with "name" and "amount"}\n\nAdd a comment that concentration above 40% in the top 3 deals is one of the most common reasons forecasts miss, and should be surfaced explicitly.',
              verify: 'Run pipeline_coverage() with your forecast and open pipeline total — confirm the ratio matches a manual calculation. Run concentration_risk() and confirm top_deals lists your actual largest open deals.',
            },
          ],
          goFurther: 'Add a third risk metric: % of pipeline in deals with no activity (stage change) in the last 14 days — "stale pipeline" risk. 🛠️🛠️',
        },
        {
          number: 3,
          title: 'Build rep attainment context and the Claude forecast narrative',
          time: '35 min',
          description: 'Risk-adjust the forecast based on rep track records, then have Claude write the executive briefing.',
          steps: [
            {
              instruction: 'Ask Claude to build reps.py with a rep_attainment function, and narrative.py with a write_forecast_narrative function.',
              prompt: 'Write two Python files for a sales forecasting pipeline.\n\n1) reps.py with rep_attainment(history_df) that:\n- Groups history_df by "rep"\n- For each rep, computes closed_won total divided by quota total (None if quota total is 0)\n- Returns a dict mapping rep name to attainment ratio, rounded to 2 decimals\n\nAdd a comment that reps consistently below 70% attainment should have their pipeline contributions risk-adjusted downward in the forecast narrative.\n\n2) narrative.py using the anthropic Python SDK with write_forecast_narrative(forecast, coverage, concentration, rep_attainment) that:\n- Frames the prompt as "You are a VP of Sales preparing a forecast briefing for the CEO"\n- Includes the statistical forecast (as records), pipeline coverage, concentration risk, and rep attainment history in the prompt\n- Asks for a briefing with: 1) the headline forecast number and confidence range, 2) two key risks, 3) two opportunities, 4) one recommended action — in plain English, no jargon\n- Calls claude-sonnet-4-5 with max_tokens=600 and returns the response text\n\nAdd a comment that the confidence interval (yhat_lower/yhat_upper) should always be passed in, not just the point estimate, so Claude can frame appropriate caveats.',
              verify: 'Run rep_attainment() and confirm ratios look reasonable for your team. Run write_forecast_narrative() with all four inputs and confirm the output covers all 4 requested sections in plain English.',
            },
          ],
          goFurther: 'Have Claude flag specifically which reps\' pipeline contributions should be discounted, and by roughly how much, based on their attainment history. 🛠️🛠️',
        },
        {
          number: 4,
          title: 'Visualize the forecast and assemble the forecast pack',
          time: '30 min',
          description: 'Chart actuals vs. forecast with confidence bands, and combine everything into one shareable report.',
          steps: [
            {
              instruction: 'Ask Claude to build visualize.py with a plot_forecast function, and report.py with a build_forecast_pack function — then a main.py tying the whole pipeline together.',
              prompt: 'Write three Python files for a sales forecasting pipeline.\n\n1) visualize.py using matplotlib with plot_forecast(history, forecast, path="forecast.png") that:\n- Plots history["ds"] vs history["y"] labeled "Actual"\n- Plots forecast["ds"] vs forecast["yhat"] labeled "Forecast" with a dashed line\n- Fills between forecast["yhat_lower"] and forecast["yhat_upper"] with alpha=0.2 to show the confidence band\n- Adds a legend and title "Sales Forecast", saves to path, and closes the figure\n\nAdd a comment that including the confidence band visually makes stakeholders far less likely to over-anchor on the point estimate.\n\n2) report.py with build_forecast_pack(forecast, narrative, chart_path, output="forecast_pack.md") that writes a markdown file with a title heading, the narrative text, an embedded image reference to chart_path, and a "Raw Forecast Data" section containing forecast.to_markdown(index=False).\n\nAdd a comment that markdown renders cleanly in Notion/GitHub/wikis, and PDF conversion should only happen if leadership specifically requests it.\n\n3) main.py that chains all builds: prepare_timeseries -> fit_forecast -> pipeline_coverage -> concentration_risk -> rep_attainment -> write_forecast_narrative -> plot_forecast -> build_forecast_pack, and prints a confirmation when forecast_pack.md is written.',
              verify: 'Run main.py end-to-end — forecast.png should show actuals plus a dashed forecast line with a shaded confidence band, and forecast_pack.md should contain the narrative, chart reference, and raw forecast table.',
            },
          ],
          goFurther: 'Automate this to run on the 1st of every month and email the forecast_pack.md (rendered to PDF) to sales leadership. 🛠️🛠️',
        },
      ],
      portfolio: 'Add this to your portfolio as "AI Sales Forecasting Agent" — a strong project for RevOps, sales analytics, or FP&A roles. Show the forecast chart with confidence bands alongside Claude\'s executive narrative covering risks and opportunities.',
      portfolioPrompt: 'Help me write a portfolio entry and a LinkedIn post for a project I just built: an AI Sales Forecasting Agent that combines statistical time-series forecasting with Claude\'s reasoning. It fits a Prophet model to historical sales data to forecast the next quarter with confidence intervals, computes pipeline coverage and concentration risk (how dependent the pipeline is on a few big deals), factors in rep quota attainment history, and then has Claude write an executive briefing covering the headline forecast, key risks, opportunities, and a recommended action — all assembled into a markdown forecast pack with a confidence-band chart. Write:\n1. A 3-4 sentence portfolio project description emphasizing the combination of quantitative + qualitative analysis\n2. A LinkedIn post (under 150 words) for a RevOps/sales analytics audience\n3. Two resume bullet points quantifying forecast accuracy improvements or time saved producing forecast briefings',
    },
    steps: [
      {
        number: 1,
        title: 'Load and prepare historical data',
        description: 'Aggregate daily/weekly sales into a monthly time series formatted for Prophet (columns ds, y).',
        code: `# prepare.py
import pandas as pd

def prepare_timeseries(path="sales.csv"):
    df = pd.read_csv(path, parse_dates=["date"])
    monthly = df.groupby(pd.Grouper(key="date", freq="M"))["amount"].sum().reset_index()
    monthly.columns = ["ds", "y"]
    return monthly`,
        tip: 'Prophet requires at least 2 full seasonal cycles of data — for monthly seasonality that means 24+ months of history.',
      },
      {
        number: 2,
        title: 'Fit the Prophet model',
        description: 'Train a Prophet model with yearly seasonality and generate a forecast for the next 3 months.',
        code: `# forecast.py
from prophet import Prophet

def fit_forecast(df, periods=3):
    model = Prophet(yearly_seasonality=True, weekly_seasonality=False)
    model.fit(df)
    future = model.make_future_dataframe(periods=periods, freq="M")
    forecast = model.predict(future)
    return forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(periods)`,
        tip: 'pip install prophet can require cmdstanpy build tools on some systems — use conda-forge if pip install fails.',
      },
      {
        number: 3,
        title: 'Compute pipeline coverage',
        description: 'Compare the forecast against current open pipeline value to compute a coverage ratio.',
        code: `# coverage.py
def pipeline_coverage(forecast_row, open_pipeline_value):
    target = forecast_row["yhat"]
    coverage = open_pipeline_value / target if target else None
    return {"target": target, "open_pipeline": open_pipeline_value, "coverage_ratio": round(coverage, 2) if coverage else None}`,
        tip: 'A healthy B2B coverage ratio is typically 3-4x — flag months below 2.5x as at-risk.',
      },
      {
        number: 4,
        title: 'Compute concentration risk',
        description: 'Check what percentage of the open pipeline depends on the top 3 deals.',
        code: `# concentration.py
def concentration_risk(deals_df, top_n=3):
    total = deals_df["amount"].sum()
    top = deals_df.nlargest(top_n, "amount")["amount"].sum()
    return {"top_n_share": round(top / total, 3) if total else 0, "top_deals": deals_df.nlargest(top_n, "amount")[["name", "amount"]].to_dict("records")}`,
        tip: 'High concentration (>40% in top 3 deals) is one of the most common reasons forecasts miss — surface it explicitly.',
      },
      {
        number: 5,
        title: 'Build rep performance context',
        description: 'Compute each rep’s historical quota attainment to weight their current pipeline contributions.',
        code: `# reps.py
def rep_attainment(history_df):
    return history_df.groupby("rep").apply(
        lambda g: (g["closed_won"].sum() / g["quota"].sum()) if g["quota"].sum() else None
    ).round(2).to_dict()`,
        tip: 'Reps consistently below 70% attainment should have their pipeline contributions risk-adjusted downward in the forecast narrative.',
      },
      {
        number: 6,
        title: 'Build the Claude forecast analyst',
        description: 'Send the forecast, coverage, concentration, and rep data to Claude and request an executive narrative.',
        code: `# narrative.py
from anthropic import Anthropic
ai = Anthropic()

def write_forecast_narrative(forecast, coverage, concentration, rep_attainment):
    prompt = f"""You are a VP of Sales preparing a forecast briefing for the CEO.

Statistical forecast (next 3 months): {forecast.to_dict('records')}
Pipeline coverage: {coverage}
Concentration risk: {concentration}
Rep attainment history: {rep_attainment}

Write a briefing with: 1) the headline forecast number and confidence range,
2) two key risks, 3) two opportunities, 4) one recommended action. Plain English, no jargon."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=600,
        messages=[{"role": "user", "content": prompt}]).content[0].text`,
        tip: 'Always pass the confidence interval (yhat_lower/yhat_upper), not just the point estimate — it lets Claude frame appropriate caveats.',
      },
      {
        number: 7,
        title: 'Visualize the forecast',
        description: 'Plot historical actuals and the forecast with confidence bands.',
        code: `# visualize.py
import matplotlib.pyplot as plt

def plot_forecast(history, forecast, path="forecast.png"):
    plt.plot(history["ds"], history["y"], label="Actual")
    plt.plot(forecast["ds"], forecast["yhat"], label="Forecast", linestyle="--")
    plt.fill_between(forecast["ds"], forecast["yhat_lower"], forecast["yhat_upper"], alpha=0.2)
    plt.legend(); plt.title("Sales Forecast"); plt.tight_layout(); plt.savefig(path); plt.close()`,
        tip: 'Including the confidence band visually makes stakeholders far less likely to over-anchor on the point estimate.',
      },
      {
        number: 8,
        title: 'Assemble the monthly forecast pack',
        description: 'Combine the chart and narrative into a single shareable report.',
        code: `# report.py
def build_forecast_pack(forecast, narrative, chart_path, output="forecast_pack.md"):
    with open(output, "w") as f:
        f.write("# Monthly Sales Forecast\\n\\n")
        f.write(narrative + "\\n\\n")
        f.write(f"![Forecast Chart]({chart_path})\\n\\n")
        f.write("## Raw Forecast Data\\n\\n")
        f.write(forecast.to_markdown(index=False))`,
        tip: 'Markdown output renders cleanly in Notion, GitHub, and most wikis — convert to PDF only if leadership specifically wants it.',
      },
    ],
    starterCode: `"""
AgentForge Academy — AI Sales Forecasting Agent (starter)
Run: pip install pandas prophet anthropic
"""
import pandas as pd
from prophet import Prophet
from anthropic import Anthropic

ai = Anthropic()

def forecast_and_explain(csv_path):
    df = pd.read_csv(csv_path, parse_dates=["date"])
    monthly = df.groupby(pd.Grouper(key="date", freq="M"))["amount"].sum().reset_index()
    monthly.columns = ["ds", "y"]

    model = Prophet(yearly_seasonality=True)
    model.fit(monthly)
    future = model.make_future_dataframe(periods=3, freq="M")
    forecast = model.predict(future)[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(3)

    prompt = f"Sales forecast for next 3 months: {forecast.to_dict('records')}. Write a 3-sentence executive summary."
    narrative = ai.messages.create(model="claude-sonnet-4-5", max_tokens=300,
        messages=[{"role": "user", "content": prompt}]).content[0].text
    return forecast, narrative

if __name__ == "__main__":
    forecast, narrative = forecast_and_explain("sales.csv")
    print(narrative)
`,
    resources: [
      { title: 'Prophet Documentation', url: 'https://facebook.github.io/prophet/' },
      { title: 'pandas Documentation', url: 'https://pandas.pydata.org/docs/' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 29,
    title: 'Knowledge Graph Builder Agent',
    emoji: '🕸️',
    department: ['Data & Analytics', 'Engineering'],
    departmentIds: ['data', 'engineering'],
    difficulty: 'Advanced',
    description:
      'Reads a corpus of company documents and automatically builds a Neo4j knowledge graph of entities and relationships, queryable in plain English.',
    whatYouBuild:
      'A pipeline that chunks a document corpus, uses Claude to extract entities (people, companies, products, projects) and relationships between them as structured triples, loads them into a Neo4j graph database, deduplicates and merges entity aliases, and exposes a natural-language query interface that translates questions into Cypher queries.',
    whatYouLearn: [
      'Extract entities and relationships from unstructured text with Claude',
      'Model a knowledge graph schema (nodes, relationship types, properties)',
      'Load and query data in Neo4j with Cypher',
      'Implement entity resolution to merge aliases and duplicates',
      'Translate natural-language questions into Cypher with an LLM',
      'Visualize a knowledge graph subgraph',
    ],
    techStack: ['Python', 'Neo4j', 'Claude API'],
    buildTime: '7 hrs',
    xp: 850,
    popularity: 75,
    prerequisites: ['Completed Customer Support RAG Bot', 'Neo4j installed (Desktop or AuraDB free tier)'],
    tags: ['knowledge-graph', 'neo4j', 'entity-extraction', 'nlp'],
    session: {
      totalTime: '160 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'A Neo4j connection and a fixed schema of node labels and relationship types',
        'A Claude-powered extractor that chunks documents and pulls entities/relationships as JSON triples constrained to your schema',
        'Entity resolution that merges aliases via fuzzy matching, and an idempotent loader that MERGEs triples into the graph',
        'A natural-language query interface that translates questions into Cypher, answers in plain English, and visualizes a subgraph',
      ],
      whatYouNeed: [
        'Python installed locally',
        'An Anthropic API key (console.anthropic.com)',
        'pip install neo4j anthropic rapidfuzz networkx matplotlib',
        'A free Neo4j AuraDB instance (or Neo4j Desktop) and connection credentials',
        'A small corpus of company documents (10-30 docs) to build the graph from',
      ],
      builds: [
        {
          number: 1,
          title: 'Connect to Neo4j and define the graph schema',
          time: '20 min',
          description: 'Get a working Neo4j connection and decide on the fixed set of node and relationship types you\'ll extract.',
          steps: [
            {
              instruction: 'Ask Claude to build db.py with a Neo4j connection and run_query helper, and schema.py defining NODE_LABELS and RELATIONSHIP_TYPES.',
              prompt: 'Write two Python files for a knowledge graph builder.\n\n1) db.py using the neo4j Python driver that:\n- Creates a driver via GraphDatabase.driver() using a neo4j+s:// AuraDB connection string and (neo4j, password) auth — use placeholder values and a comment showing where to put real credentials\n- Defines run_query(query, params=None) that opens a session, runs the query with params, and returns list(session.run(...))\n\n2) schema.py with:\n- NODE_LABELS = ["Person", "Company", "Product", "Project", "Technology"]\n- RELATIONSHIP_TYPES = ["WORKS_AT", "LEADS", "USES", "PARTNERS_WITH", "COMPETES_WITH", "BUILT_BY"]\n\nAdd a comment that AuraDB Free gives a hosted instance with no install needed, and that a small fixed schema (5-10 node types, 5-10 relationship types) produces far more consistent extractions than an open-ended one.',
              verify: 'Run run_query("RETURN 1") and confirm it connects without error and returns a result.',
            },
          ],
          goFurther: 'Add 2-3 more relationship types specific to your domain (e.g. "FUNDED_BY", "ACQUIRED") before moving on. 🛠️',
        },
        {
          number: 2,
          title: 'Build the entity/relationship extractor',
          time: '40 min',
          description: 'Chunk your documents and ask Claude to extract entities and relationships as structured triples constrained to your schema.',
          steps: [
            {
              instruction: 'Ask Claude to build extract.py with an extract_triples function and a simple document chunker.',
              prompt: 'Write extract.py for a knowledge graph builder using the anthropic Python SDK.\n\nCreate:\n1. A simple chunker function chunk_text(text, chunk_size_words=1000) that splits text into chunks of roughly chunk_size_words words each\n2. extract_triples(text_chunk, node_labels, rel_types) that:\n- Builds a prompt listing the allowed entity types (node_labels) and allowed relationship types (rel_types)\n- Includes the text_chunk\n- Asks Claude to extract entities (as {"name": "...", "type": "..."}) and relationships (as {"source": "...", "type": "...", "target": "..."}), only including relationships explicitly stated or strongly implied in the text\n- Calls claude-sonnet-4-5 with max_tokens=1500\n- Requests JSON: {"entities": [...], "relationships": [...]}\n- Parses and returns the JSON\n\nAdd a comment that ~1000-word chunks work best — larger chunks cause Claude to miss relationships between entities mentioned far apart in the text.',
              verify: 'Run extract_triples() on one chunk of a real document — confirm the entities have types from NODE_LABELS and relationships have types from RELATIONSHIP_TYPES.',
            },
          ],
          goFurther: 'Add a second pass that re-extracts triples for any chunk where extract_triples returned zero relationships, using a more explicit prompt. 🛠️🛠️',
        },
        {
          number: 3,
          title: 'Resolve entity aliases and load into Neo4j',
          time: '50 min',
          description: 'Merge duplicate entities like "Acme Corp" and "Acme" before loading triples idempotently into the graph.',
          steps: [
            {
              instruction: 'Ask Claude to build resolve.py with fuzzy-matching entity resolution, and load.py to MERGE triples into Neo4j.',
              prompt: 'Write two Python files for a knowledge graph builder.\n\n1) resolve.py using rapidfuzz with resolve_entities(new_entities, known_entities) that:\n- For each entity in new_entities, finds the best fuzzy match in known_entities by comparing lowercased names with fuzz.ratio\n- If the best match scores > 85, treats it as the same entity: appends {"name": match["name"], "type": entity["type"], "alias": entity["name"]} to the resolved list\n- Otherwise, appends the entity as-is and adds it to known_entities (so future entities can match against it)\n- Returns the resolved list\n\nAdd a comment that for ambiguous matches (fuzzy score 70-85), these should be queued for a Claude call asking "are these the same entity?" rather than auto-merging.\n\n2) load.py with load_triples(triples) using run_query() from db.py that:\n- For each entity, runs a Cypher MERGE on (n:{type} {name: $name}) using the entity\'s type and name\n- For each relationship, runs a Cypher MATCH on the source and target nodes by name, then MERGEs the relationship of the given type between them\n\nAdd a comment that MERGE is idempotent — re-running the pipeline on the same documents won\'t create duplicate nodes or relationships.',
              verify: 'Run resolve_entities() with a known_entities list containing "Acme Corp" and a new entity "Acme" — confirm it resolves to the same canonical name. Run load_triples() twice on the same data and confirm the node/relationship count in Neo4j doesn\'t double.',
            },
          ],
          goFurther: 'Build a small review queue: log all 70-85 fuzzy matches to a file, then ask Claude in a batch "are these the same entity?" and apply the merges. 🛠️🛠️',
        },
        {
          number: 4,
          title: 'Build natural-language Q&A and subgraph visualization',
          time: '50 min',
          description: 'Let people ask plain-English questions about the graph, and visualize the neighborhood around any entity.',
          steps: [
            {
              instruction: 'Ask Claude to build nl_query.py and answer.py for natural-language Cypher querying, and visualize.py for subgraph visualization — then main.py to tie the whole pipeline together.',
              prompt: 'Write three Python files for a knowledge graph builder.\n\n1) nl_query.py using the anthropic Python SDK with question_to_cypher(question, node_labels, rel_types) that:\n- Builds a prompt describing the graph schema (node labels and relationship types)\n- Asks Claude to translate the plain-English question into a Cypher query, returning ONLY the query with no explanation\n- Calls claude-sonnet-4-5 with max_tokens=200, strips and returns the text\n- Automatically appends " LIMIT 25" to the generated query as a safeguard against runaway result sets\n\n2) answer.py with answer_question(question) using question_to_cypher() and run_query() that:\n- Translates the question to Cypher and runs it\n- Converts results to a list of dicts\n- Sends the question and results to Claude, asking for a 1-2 sentence answer based only on those results\n- If results are empty, the prompt should instruct Claude to say so explicitly rather than guessing\n- Calls claude-sonnet-4-5 with max_tokens=200 and returns the answer text\n\n3) visualize.py using networkx and matplotlib with visualize_entity_neighborhood(entity_name, path="graph.png") that:\n- Runs a Cypher query MATCH (n {name: $name})-[r]-(m) RETURN n, r, m for the given entity\n- Builds a networkx MultiDiGraph from the results, with edges labeled by relationship type\n- Draws the graph with labels and saves it to path\n\nAdd a comment that for graphs with more than ~50 nodes, Neo4j Browser\'s built-in visualization is more readable than networkx layouts.\n\nAlso write main.py that chains: chunk documents -> extract_triples -> resolve_entities -> load_triples for the whole corpus, then demonstrates answer_question() with 2-3 example questions.',
              verify: 'Run answer_question() with a question like "Who works at Acme Corp?" and confirm it returns a sensible 1-2 sentence answer grounded in the graph. Run visualize_entity_neighborhood() for a well-connected entity and confirm graph.png shows its connections.',
            },
          ],
          goFurther: 'Build a small Streamlit chat UI where users type questions and see both the answer and the generated Cypher query (for transparency/debugging). 🛠️🛠️',
        },
      ],
      portfolio: 'Add this to your portfolio as "AI Knowledge Graph Builder" — an excellent project for data engineering, knowledge management, or AI infrastructure roles. Show the graph schema, a visualized subgraph, and a few natural-language Q&A examples with their generated Cypher.',
      portfolioPrompt: 'Help me write a portfolio entry and a LinkedIn post for a project I just built: an AI Knowledge Graph Builder. It reads a corpus of company documents, chunks them, and uses Claude to extract entities (people, companies, products, projects) and relationships between them as structured triples constrained to a fixed schema. It resolves entity aliases via fuzzy matching, idempotently loads everything into a Neo4j graph database with MERGE, and exposes a natural-language query interface — Claude translates plain-English questions into Cypher, runs them, and answers based only on the results. It also visualizes the subgraph around any entity. Write:\n1. A 3-4 sentence portfolio project description emphasizing turning unstructured docs into a queryable knowledge graph\n2. A LinkedIn post (under 150 words) for a data/knowledge management audience\n3. Two resume bullet points quantifying how this improves findability of organizational knowledge',
    },
    steps: [
      {
        number: 1,
        title: 'Set up Neo4j',
        description: 'Install Neo4j Desktop or create a free AuraDB instance, and connect from Python.',
        code: `# db.py
from neo4j import GraphDatabase

driver = GraphDatabase.driver("neo4j+s://<your-instance>.databases.neo4j.io",
                                auth=("neo4j", "your-password"))

def run_query(query, params=None):
    with driver.session() as session:
        return list(session.run(query, params or {}))`,
        tip: 'AuraDB Free gives you a hosted Neo4j instance with no install — ideal for this project if you don’t want to run Docker.',
      },
      {
        number: 2,
        title: 'Define the graph schema',
        description: 'Decide on node labels and relationship types up front to keep extraction consistent.',
        code: `# schema.py
NODE_LABELS = ["Person", "Company", "Product", "Project", "Technology"]
RELATIONSHIP_TYPES = ["WORKS_AT", "LEADS", "USES", "PARTNERS_WITH", "COMPETES_WITH", "BUILT_BY"]`,
        tip: 'A small, fixed schema (5-10 node types, 5-10 relationship types) produces far more consistent extractions than an open-ended one.',
      },
      {
        number: 3,
        title: 'Build the entity/relationship extractor',
        description: 'Chunk documents and ask Claude to extract entities and relationships as JSON triples constrained to the schema.',
        code: `# extract.py
from anthropic import Anthropic
import json

ai = Anthropic()

def extract_triples(text_chunk, node_labels, rel_types):
    prompt = f"""Extract entities and relationships from this text.
Allowed entity types: {node_labels}
Allowed relationship types: {rel_types}

Text: {text_chunk}

Return JSON: {{"entities": [{{"name": "...", "type": "..."}}],
"relationships": [{{"source": "...", "type": "...", "target": "..."}}]}}
Only include relationships explicitly stated or strongly implied in the text."""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=1500,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)`,
        tip: 'Process chunks of ~1000 words — larger chunks cause Claude to miss relationships between entities mentioned far apart.',
      },
      {
        number: 4,
        title: 'Build entity resolution',
        description: 'Merge aliases (e.g. "Acme Corp" and "Acme") into a single canonical entity using fuzzy matching plus a Claude tiebreaker.',
        code: `# resolve.py
from rapidfuzz import fuzz

def resolve_entities(new_entities, known_entities):
    resolved = []
    for entity in new_entities:
        match = max(known_entities, key=lambda k: fuzz.ratio(k["name"].lower(), entity["name"].lower()), default=None)
        if match and fuzz.ratio(match["name"].lower(), entity["name"].lower()) > 85:
            resolved.append({"name": match["name"], "type": entity["type"], "alias": entity["name"]})
        else:
            resolved.append(entity)
            known_entities.append(entity)
    return resolved`,
        tip: 'For ambiguous matches (fuzzy score 70-85), queue them for a Claude call asking "are these the same entity?" rather than auto-merging.',
      },
      {
        number: 5,
        title: 'Load triples into Neo4j',
        description: 'Use MERGE (not CREATE) to upsert nodes and relationships, avoiding duplicates.',
        code: `# load.py
def load_triples(triples):
    for entity in triples["entities"]:
        run_query(
            f"MERGE (n:{entity['type']} {{name: $name}})",
            {"name": entity["name"]}
        )
    for rel in triples["relationships"]:
        run_query(
            f"""MATCH (a {{name: $source}}), (b {{name: $target}})
            MERGE (a)-[r:{rel['type']}]->(b)""",
            {"source": rel["source"], "target": rel["target"]}
        )`,
        tip: 'MERGE is idempotent — re-running the pipeline on the same documents won’t create duplicate nodes or relationships.',
      },
      {
        number: 6,
        title: 'Build the natural-language query translator',
        description: 'Ask Claude to translate a plain-English question into a Cypher query against your known schema.',
        code: `# nl_query.py
def question_to_cypher(question, node_labels, rel_types):
    prompt = f"""Graph schema: node labels = {node_labels}, relationship types = {rel_types}.
Translate this question into a Cypher query: "{question}"
Return ONLY the Cypher query, no explanation."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=200,
        messages=[{"role": "user", "content": prompt}]).content[0].text.strip()`,
        tip: 'Append "LIMIT 25" to generated queries automatically as a safeguard against runaway result sets.',
      },
      {
        number: 7,
        title: 'Build the answer formatter',
        description: 'Run the generated Cypher query and ask Claude to summarize the results in plain English.',
        code: `# answer.py
def answer_question(question):
    cypher = question_to_cypher(question, NODE_LABELS, RELATIONSHIP_TYPES)
    results = run_query(cypher)
    records = [dict(r) for r in results]
    prompt = f"""Question: {question}
Query results: {records}

Answer the question in 1-2 sentences based only on these results."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=200,
        messages=[{"role": "user", "content": prompt}]).content[0].text`,
        tip: 'If results are empty, have Claude say so explicitly rather than guessing — empty graph results are a real (and common) answer.',
      },
      {
        number: 8,
        title: 'Visualize a subgraph',
        description: 'Export a subgraph around a given entity for visualization in Neo4j Browser or with networkx/matplotlib.',
        code: `# visualize.py
import networkx as nx
import matplotlib.pyplot as plt

def visualize_entity_neighborhood(entity_name, path="graph.png"):
    results = run_query(
        "MATCH (n {name: $name})-[r]-(m) RETURN n, r, m", {"name": entity_name})
    G = nx.MultiDiGraph()
    for record in results:
        G.add_edge(record["n"]["name"], record["m"]["name"], label=type(record["r"]).__name__)
    nx.draw(G, with_labels=True, node_color="lightblue", node_size=1500, font_size=8)
    plt.savefig(path); plt.close()`,
        tip: 'For graphs with more than ~50 nodes, use Neo4j Browser’s built-in visualization instead — networkx layouts get unreadable fast.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Knowledge Graph Builder Agent (starter)
Run: pip install neo4j anthropic
"""
import json
from neo4j import GraphDatabase
from anthropic import Anthropic

ai = Anthropic()
driver = GraphDatabase.driver("neo4j+s://YOUR_INSTANCE.databases.neo4j.io", auth=("neo4j", "password"))

def extract_and_load(text_chunk):
    prompt = f"""Extract entities (Person/Company/Product) and relationships from:
{text_chunk}
Return JSON: {{"entities": [{{"name":"...","type":"..."}}], "relationships": [{{"source":"...","type":"...","target":"..."}}]}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=800,
        messages=[{"role": "user", "content": prompt}])
    triples = json.loads(resp.content[0].text)
    with driver.session() as session:
        for e in triples["entities"]:
            session.run(f"MERGE (n:{e['type']} {{name: $name}})", name=e["name"])
        for r in triples["relationships"]:
            session.run(f"MATCH (a {{name:$s}}),(b {{name:$t}}) MERGE (a)-[:{r['type']}]->(b)", s=r["source"], t=r["target"])

if __name__ == "__main__":
    extract_and_load("Jane Smith leads the Phoenix project at Acme Corp, which uses Neo4j.")
`,
    resources: [
      { title: 'Neo4j Python Driver', url: 'https://neo4j.com/docs/python-manual/current/' },
      { title: 'Cypher Query Language', url: 'https://neo4j.com/docs/cypher-manual/current/' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 30,
    title: 'Voice-Based Customer Service Agent',
    emoji: '📞',
    department: ['Customer Support'],
    departmentIds: ['support'],
    difficulty: 'Advanced',
    description:
      'A phone-based AI agent that answers customer calls, understands speech, looks up account info, and responds with natural-sounding voice.',
    whatYouBuild:
      'A Twilio-powered voice agent that answers incoming calls, transcribes speech in real time, sends the transcript to Claude with account context retrieved from your database, generates a response, converts it to natural speech with ElevenLabs, and plays it back — handling multi-turn conversations and escalating to a human agent when needed.',
    whatYouLearn: [
      'Handle inbound calls and call flow with Twilio Voice',
      'Stream and transcribe live audio',
      'Maintain multi-turn conversation state across a phone call',
      'Generate natural speech with ElevenLabs text-to-speech',
      'Look up account context mid-call to ground responses',
      'Implement escalation to a human agent (call transfer)',
    ],
    techStack: ['Python', 'Twilio', 'ElevenLabs', 'Claude API', 'FastAPI'],
    buildTime: '7.5 hrs',
    xp: 900,
    popularity: 78,
    prerequisites: ['Completed Customer Support RAG Bot', 'Twilio account with a phone number', 'ElevenLabs API key'],
    tags: ['voice', 'twilio', 'customer-support', 'realtime'],
    session: {
      totalTime: '160 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'A FastAPI app that answers Twilio calls and gathers speech input',
        'Multi-turn conversation state per call, with account context looked up by caller phone number',
        'Claude generating short, speech-friendly responses, converted to natural audio via ElevenLabs',
        'Escalation to a human agent and call logging/analytics when calls complete',
      ],
      whatYouNeed: [
        'Python installed locally',
        'An Anthropic API key (console.anthropic.com)',
        'A Twilio account with a phone number, and ngrok for local webhook testing',
        'An ElevenLabs API key and a chosen voice ID',
        'pip install fastapi uvicorn anthropic requests python-multipart',
      ],
      builds: [
        {
          number: 1,
          title: 'Set up the Twilio webhook and conversation state',
          time: '30 min',
          description: 'Get a FastAPI server answering calls with TwiML, gathering speech, and tracking conversation history per call.',
          steps: [
            {
              instruction: 'Ask Claude to build main.py with a /voice webhook that greets callers and gathers speech, and state.py to track conversation history per call SID.',
              prompt: 'Write two Python files for a Twilio voice agent using FastAPI.\n\n1) main.py with:\n- A FastAPI app instance\n- A POST /voice endpoint that returns TwiML (as an XML Response) with a <Say voice="Polly.Joanna"> greeting like "Hi, thanks for calling. How can I help you today?" followed by a <Gather input="speech" action="/handle-speech" speechTimeout="auto" />\n\n2) state.py with:\n- A module-level conversations dict mapping CallSid to a list of message dicts\n- get_history(call_sid) that returns conversations.setdefault(call_sid, [])\n- append_turn(call_sid, role, content) that appends {"role": role, "content": content} to that call\'s history\n\nAdd a comment that ngrok should be used during development to expose the local FastAPI server to Twilio\'s webhook system, and that Redis with a ~1 hour TTL is recommended over an in-memory dict if running more than one server process.',
              verify: 'Run uvicorn locally, expose it with ngrok, point a Twilio number\'s voice webhook at /voice, and call it — confirm you hear the greeting and Twilio waits for speech.',
            },
          ],
          goFurther: 'Add a "press 0 for a human" DTMF option alongside the speech gather, for callers who prefer not to talk to a bot. 🛠️',
        },
        {
          number: 2,
          title: 'Look up account context and build the Claude responder',
          time: '35 min',
          description: 'Ground responses in the caller\'s real account data, and have Claude generate short, spoken-friendly replies.',
          steps: [
            {
              instruction: 'Ask Claude to build context.py to look up account info by phone number, and respond.py with a generate_response function using a speech-tuned system prompt.',
              prompt: 'Write two Python files for a Twilio voice agent.\n\n1) context.py with get_account_context(phone_number) using requests that GETs https://internal-api.yourapp.com/accounts/by-phone/{phone_number} and returns the JSON if status 200, else None. Add a comment that if no account is found, Claude should be told explicitly "no account found for this caller" so it asks for an account number instead of guessing.\n\n2) respond.py using the anthropic Python SDK, importing get_history/append_turn from state.py and get_account_context from context.py, with:\n- SYSTEM_PROMPT: "You are a phone support agent. Keep responses to 1-2 short sentences — they will be read aloud. Be warm and direct. If you cannot resolve the issue, say you\'ll transfer them to a specialist."\n- async def generate_response(call_sid, speech_text, from_number) that: gets the call\'s history, appends the user turn, looks up account context via from_number, builds the messages list (including account context only on the first turn), calls claude-sonnet-4-5 with max_tokens=150 and the system prompt, appends the assistant turn to history, and returns the response text\n\nAdd a comment that max_tokens should stay around 150 — longer Claude responses become awkward, rambling speech.',
              verify: 'Call generate_response() with a test call_sid and a sample question — confirm the reply is 1-2 sentences and references account context when available.',
            },
          ],
          goFurther: 'If get_account_context returns None twice in a row, have the system prompt instruct Claude to ask for an account number or email directly. 🛠️',
        },
        {
          number: 3,
          title: 'Wire up speech handling and ElevenLabs voice synthesis',
          time: '40 min',
          description: 'Connect Twilio\'s speech result to Claude, convert the reply to audio, and play it back in the call.',
          steps: [
            {
              instruction: 'Ask Claude to add a /handle-speech endpoint to main.py, and build tts.py with a synthesize_speech function using ElevenLabs.',
              prompt: 'Write tts.py and update main.py for a Twilio voice agent.\n\n1) tts.py using requests with synthesize_speech(text) that:\n- POSTs to https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID with header xi-api-key: YOUR_ELEVENLABS_KEY and JSON body {"text": text, "model_id": "eleven_turbo_v2"}\n- Saves the returned audio bytes to a uniquely-named file under static/ (using uuid)\n- Returns a public URL to that file (e.g. https://yourdomain.com/static/<uuid>.mp3)\n\nAdd a comment that eleven_turbo_v2 trades a small amount of voice quality for much lower latency, which matters for call responsiveness.\n\n2) Add to main.py a POST /handle-speech endpoint that:\n- Accepts SpeechResult and CallSid as Form fields\n- Calls generate_response(CallSid, SpeechResult, From) to get the reply text (From also as a Form field — Twilio includes the caller\'s number)\n- Calls synthesize_speech() on the reply text to get an audio URL\n- Returns TwiML with <Play>{audio_url}</Play> followed by another <Gather input="speech" action="/handle-speech" speechTimeout="auto" /> to continue the conversation\n\nAdd a comment that Twilio\'s built-in SpeechResult transcription is good enough for most use cases — a separate STT service is only needed for higher accuracy.',
              verify: 'Call your Twilio number, say something, and confirm you hear a natural-sounding ElevenLabs voice respond — and that the call continues listening for your next turn.',
            },
          ],
          goFurther: 'Pre-generate and cache audio for common phrases (greetings, "let me check that") to reduce perceived latency. 🛠️🛠️',
        },
        {
          number: 4,
          title: 'Add escalation and call logging',
          time: '35 min',
          description: 'Detect when Claude can\'t resolve the issue and transfer to a human, then log every completed call for analytics.',
          steps: [
            {
              instruction: 'Ask Claude to build escalate.py with escalation detection and TwiML, and analytics.py with a /call-status endpoint for logging completed calls.',
              prompt: 'Write two Python files for a Twilio voice agent.\n\n1) escalate.py with:\n- needs_escalation(response_text) that returns True if response_text (lowercased) contains any of "transfer you", "specialist", or "let me connect you"\n- ESCALATION_TWIML: a TwiML string with <Say voice="Polly.Joanna">One moment while I connect you to a specialist.</Say> followed by <Dial>+15551234567</Dial> (placeholder number)\n- A comment showing that in /handle-speech, if needs_escalation(response_text) is True, return ESCALATION_TWIML instead of the normal Play+Gather response\n\nAdd a comment that every escalation should be logged with the full conversation transcript — this is the highest-value data for improving the system prompt.\n\n2) analytics.py with a FastAPI POST /call-status endpoint that:\n- Accepts CallSid, CallStatus, and CallDuration (default "0") as Form fields\n- If CallStatus == "completed": gets the call\'s history from state.py, builds a log_entry with call_sid, duration (int), turns (len of history), the full transcript, and an escalated flag (True if any assistant message contains "specialist")\n- Saves the log entry with a save_call_log() function (write to a JSONL file)\n- Removes the call from the in-memory conversations dict\n- Returns {"ok": True}\n\nAdd a comment that this endpoint should be registered as the statusCallback URL on the Twilio number so it fires automatically when calls complete.\n\nUpdate main.py to import and use needs_escalation in /handle-speech, and register the /call-status route.',
              verify: 'Trigger an escalation by saying something that prompts Claude to say "let me connect you to a specialist" — confirm the call plays the escalation message and dials the transfer number. End a call and confirm a log entry appears with the full transcript and correct escalated flag.',
            },
          ],
          goFurther: 'Build a small dashboard summarizing call volume, average duration, and escalation rate from the JSONL call logs. 🛠️🛠️',
        },
      ],
      portfolio: 'Add this to your portfolio as "AI Voice Customer Service Agent" — a standout project for support ops, conversational AI, or contact-center tech roles. Record a short demo call (with a test number) showing natural back-and-forth and an escalation.',
      portfolioPrompt: 'Help me write a portfolio entry and a LinkedIn post for a project I just built: an AI Voice-Based Customer Service Agent built on Twilio, Claude, and ElevenLabs. It answers incoming phone calls, transcribes caller speech, looks up account context by phone number, sends the conversation history and context to Claude (with a system prompt tuned for short, spoken responses), converts the reply to natural-sounding speech with ElevenLabs, and plays it back — maintaining multi-turn conversation state across the call. If Claude can\'t resolve the issue, it automatically transfers the caller to a human agent, and every completed call is logged with a full transcript and escalation flag for analytics. Write:\n1. A 3-4 sentence portfolio project description emphasizing the natural conversational experience and escalation safety net\n2. A LinkedIn post (under 150 words) for a conversational AI / contact center audience\n3. Two resume bullet points quantifying potential call deflection rate or average handle time impact',
    },
    steps: [
      {
        number: 1,
        title: 'Set up the Twilio webhook',
        description: 'Build a FastAPI endpoint that Twilio calls when a phone number receives an incoming call, returning TwiML to start gathering speech.',
        code: `# main.py
from fastapi import FastAPI, Form
from fastapi.responses import Response

app = FastAPI()

@app.post("/voice")
async def voice_webhook():
    twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Hi, thanks for calling. How can I help you today?</Say>
  <Gather input="speech" action="/handle-speech" speechTimeout="auto" />
</Response>"""
    return Response(content=twiml, media_type="application/xml")`,
        tip: 'Use ngrok during development to expose your local FastAPI server to Twilio’s webhook system.',
      },
      {
        number: 2,
        title: 'Handle the speech result',
        description: 'Receive the transcribed speech from Twilio’s Gather verb and pass it to your agent logic.',
        code: `# handle_speech.py
@app.post("/handle-speech")
async def handle_speech(SpeechResult: str = Form(...), CallSid: str = Form(...)):
    response_text = await generate_response(CallSid, SpeechResult)
    audio_url = await synthesize_speech(response_text)
    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>{audio_url}</Play>
  <Gather input="speech" action="/handle-speech" speechTimeout="auto" />
</Response>"""
    return Response(content=twiml, media_type="application/xml")`,
        tip: 'Twilio’s built-in speech recognition (SpeechResult) is good enough for most use cases — only add a separate STT service if you need higher accuracy.',
      },
      {
        number: 3,
        title: 'Maintain conversation state',
        description: 'Track conversation history per call SID in memory (or Redis) so Claude has multi-turn context.',
        code: `# state.py
conversations = {}  # CallSid -> list of messages

def get_history(call_sid):
    return conversations.setdefault(call_sid, [])

def append_turn(call_sid, role, content):
    conversations[call_sid].append({"role": role, "content": content})`,
        tip: 'Use Redis with a TTL of ~1 hour instead of an in-memory dict if you run more than one server process.',
      },
      {
        number: 4,
        title: 'Look up account context',
        description: 'Use Twilio’s caller ID to look up the customer’s account before generating a response.',
        code: `# context.py
import requests

def get_account_context(phone_number):
    resp = requests.get(f"https://internal-api.yourapp.com/accounts/by-phone/{phone_number}")
    if resp.status_code == 200:
        return resp.json()
    return None`,
        tip: 'If no account is found, tell Claude explicitly "no account found for this caller" so it can ask for an account number instead of guessing.',
      },
      {
        number: 5,
        title: 'Build the Claude response generator',
        description: 'Send conversation history plus account context to Claude with a system prompt tuned for spoken responses.',
        code: `# respond.py
from anthropic import Anthropic
ai = Anthropic()

SYSTEM_PROMPT = """You are a phone support agent. Keep responses to 1-2 short sentences —
they will be read aloud. Be warm and direct. If you cannot resolve the issue,
say you'll transfer them to a specialist."""

async def generate_response(call_sid, speech_text, from_number):
    history = get_history(call_sid)
    append_turn(call_sid, "user", speech_text)
    context = get_account_context(from_number)
    messages = [{"role": "user", "content": f"Account context: {context}\\n\\n{speech_text}"}] if not history else history + [{"role": "user", "content": speech_text}]
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=150,
        system=SYSTEM_PROMPT, messages=messages)
    text = resp.content[0].text
    append_turn(call_sid, "assistant", text)
    return text`,
        tip: 'Cap max_tokens around 150 — long Claude responses become awkward, rambling speech.',
      },
      {
        number: 6,
        title: 'Synthesize speech with ElevenLabs',
        description: 'Convert Claude’s text response into natural-sounding audio and host it for Twilio to play.',
        code: `# tts.py
import requests, uuid

def synthesize_speech(text):
    resp = requests.post(
        "https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID",
        headers={"xi-api-key": "YOUR_ELEVENLABS_KEY"},
        json={"text": text, "model_id": "eleven_turbo_v2"},
    )
    filename = f"static/{uuid.uuid4()}.mp3"
    with open(filename, "wb") as f:
        f.write(resp.content)
    return f"https://yourdomain.com/{filename}"`,
        tip: 'eleven_turbo_v2 trades a small amount of voice quality for much lower latency — important for keeping calls feeling responsive.',
      },
      {
        number: 7,
        title: 'Implement escalation to a human',
        description: 'If Claude’s response indicates it cannot resolve the issue, transfer the call to a human agent queue.',
        code: `# escalate.py
def needs_escalation(response_text):
    triggers = ["transfer you", "specialist", "let me connect you"]
    return any(t in response_text.lower() for t in triggers)

# In handle_speech, if needs_escalation(response_text):
ESCALATION_TWIML = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">One moment while I connect you to a specialist.</Say>
  <Dial>+15551234567</Dial>
</Response>"""`,
        tip: 'Log every escalation with the full conversation transcript — this is your highest-value training data for improving the system prompt.',
      },
      {
        number: 8,
        title: 'Add call logging and analytics',
        description: 'After each call ends, save the full transcript and compute basic metrics (duration, resolved vs. escalated).',
        code: `# analytics.py
@app.post("/call-status")
async def call_status(CallSid: str = Form(...), CallStatus: str = Form(...), CallDuration: str = Form("0")):
    if CallStatus == "completed":
        history = get_history(CallSid)
        log_entry = {
            "call_sid": CallSid, "duration": int(CallDuration),
            "turns": len(history), "transcript": history,
            "escalated": any("specialist" in m["content"].lower() for m in history if m["role"] == "assistant"),
        }
        save_call_log(log_entry)
        conversations.pop(CallSid, None)
    return {"ok": True}`,
        tip: 'Register this endpoint as the statusCallback URL on your Twilio number to get notified when calls complete.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Voice-Based Customer Service Agent (starter)
Run: pip install fastapi uvicorn anthropic requests python-multipart
Twilio webhook: POST /voice
"""
from fastapi import FastAPI, Form
from fastapi.responses import Response
from anthropic import Anthropic

app = FastAPI()
ai = Anthropic()
SYSTEM_PROMPT = "You are a phone support agent. Keep replies to 1-2 short sentences for speech."

@app.post("/voice")
async def voice():
    twiml = '''<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Hi! How can I help you today?</Say>
  <Gather input="speech" action="/handle-speech" speechTimeout="auto" />
</Response>'''
    return Response(content=twiml, media_type="application/xml")

@app.post("/handle-speech")
async def handle_speech(SpeechResult: str = Form(...)):
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=100,
        system=SYSTEM_PROMPT, messages=[{"role": "user", "content": SpeechResult}])
    text = resp.content[0].text
    twiml = f'''<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">{text}</Say>
  <Gather input="speech" action="/handle-speech" speechTimeout="auto" />
</Response>'''
    return Response(content=twiml, media_type="application/xml")
`,
    resources: [
      { title: 'Twilio Voice TwiML', url: 'https://www.twilio.com/docs/voice/twiml' },
      { title: 'ElevenLabs API Docs', url: 'https://elevenlabs.io/docs' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 31,
    title: 'Automated Marketing Campaign Manager',
    emoji: '📢',
    department: ['Marketing'],
    departmentIds: ['marketing'],
    difficulty: 'Advanced',
    description:
      'Plans, creates, and launches multi-channel marketing campaigns — generating ad copy, email sequences, and social posts from a single campaign brief.',
    whatYouBuild:
      'A campaign orchestration agent that takes a one-paragraph campaign brief, generates a full multi-channel plan (email sequence, social posts, ad copy variants), creates assets via Claude, schedules them across Mailchimp/Buffer/ad platforms, and tracks performance to suggest mid-campaign optimizations.',
    whatYouLearn: [
      'Decompose a campaign brief into a structured multi-channel plan',
      'Generate channel-specific copy variants from one core message',
      'Integrate with email (Mailchimp) and social (Buffer) scheduling APIs',
      'Build an A/B variant generator with hypothesis tracking',
      'Pull campaign performance metrics and summarize them',
      'Generate mid-campaign optimization recommendations',
    ],
    techStack: ['Python', 'Claude API', 'Mailchimp API', 'Postiz/Buffer API'],
    buildTime: '6.5 hrs',
    xp: 820,
    popularity: 83,
    prerequisites: ['Completed LinkedIn Content Creator Agent', 'Mailchimp account', 'Buffer account'],
    tags: ['marketing', 'campaigns', 'multi-channel', 'automation'],
    session: {
      totalTime: '150 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'A campaign planner that turns one brief into a structured 2-week multi-channel plan',
        'Generated email sequences, platform-specific social posts, and A/B ad copy variants',
        'Emails scheduled via Mailchimp and social posts queued via Buffer',
        'Mid-campaign performance pulls and Claude-generated optimization recommendations',
      ],
      whatYouNeed: [
        'Python installed locally',
        'An Anthropic API key (console.anthropic.com)',
        'pip install anthropic mailchimp-marketing requests',
        'A Mailchimp account with API key and audience/list ID, and a Buffer account with access token and profile IDs',
      ],
      builds: [
        {
          number: 1,
          title: 'Build the campaign planner',
          time: '25 min',
          description: 'Turn a one-paragraph campaign brief into a structured multi-channel plan with timing.',
          steps: [
            {
              instruction: 'Ask Claude to build plan.py with a plan_campaign function that produces a structured 2-week campaign plan.',
              prompt: 'Write plan.py for a marketing campaign manager using the anthropic Python SDK.\n\nCreate plan_campaign(brief) that:\n- Sends the campaign brief to Claude\n- Asks for a 2-week multi-channel campaign plan including: 3 emails (each with a send day and goal), 6 social posts (each with a day, platform, and goal), and 2 ad copy variant slots for paid social\n- Calls claude-sonnet-4-5 with max_tokens=1200\n- Requests JSON: {"emails": [{"day": 1, "subject": "...", "goal": "..."}], "social_posts": [{"day": 1, "platform": "...", "goal": "..."}], "ad_variants": [{"headline": "...", "angle": "..."}]}\n- Parses and returns the JSON\n\nAdd a comment that asking for "goal" per asset (not just topic) lets later steps generate copy matching intent — awareness vs. conversion.',
              verify: 'Run plan_campaign() with a sample brief — confirm you get 3 emails, 6 social posts, and 2 ad variant slots, each with day/platform/goal fields.',
            },
          ],
          goFurther: 'Add a "budget allocation" field to the plan that suggests how to split paid spend across the two ad variants. 🛠️',
        },
        {
          number: 2,
          title: 'Generate emails and social posts',
          time: '40 min',
          description: 'Write the full copy for each planned email and social post, tuned to each platform.',
          steps: [
            {
              instruction: 'Ask Claude to build emails.py with a write_email function, and social.py with a write_social_post function using platform-specific rules.',
              prompt: 'Write two Python files for a marketing campaign manager using the anthropic Python SDK.\n\n1) emails.py with write_email(email_plan, brief) that:\n- Sends the campaign brief, the email\'s goal, and its planned subject line to Claude\n- Asks for the full email: a refined subject line, preview text (under 90 chars), and body copy (150-250 words) with one clear CTA\n- Calls claude-sonnet-4-5 with max_tokens=600\n- Requests JSON: {"subject": "...", "preview": "...", "body": "..."}\n- Parses and returns the JSON\n\nAdd a comment that generating all 3 emails in one session by feeding previous emails as context keeps the narrative arc of the sequence consistent.\n\n2) social.py with write_social_post(post_plan, brief) that:\n- Has a platform_rules dict, e.g. {"LinkedIn": "professional tone, 100-200 words, 3-5 hashtags", "Twitter": "casual tone, under 280 characters, 1-2 hashtags"}\n- Sends the campaign brief, the post\'s platform (with its rules), and its goal to Claude, asking it to write the post copy\n- Calls claude-sonnet-4-5 with max_tokens=300 and returns the response text\n\nAdd a comment that the platform_rules dict can be extended for Instagram or TikTok later as a one-line change.',
              verify: 'Run write_email() on each of the 3 planned emails and confirm each has subject, preview (under 90 chars), and a 150-250 word body. Run write_social_post() on a LinkedIn and a Twitter slot and confirm the tone/length matches platform_rules.',
            },
          ],
          goFurther: 'Feed each generated email back into the next email\'s prompt as context, so the 3-email sequence reads as one continuous story. 🛠️🛠️',
        },
        {
          number: 3,
          title: 'Generate ad variants and schedule everything',
          time: '40 min',
          description: 'Create distinct ad angles for A/B testing, then push emails to Mailchimp and posts to Buffer.',
          steps: [
            {
              instruction: 'Ask Claude to build ads.py with a write_ad_variants function, mailchimp.py with a schedule_email function, and buffer.py with a schedule_social_post function.',
              prompt: 'Write three Python files for a marketing campaign manager.\n\n1) ads.py using the anthropic Python SDK with write_ad_variants(brief, n=2) that:\n- Sends the campaign brief to Claude, asking for n distinct paid social ad variants, each with a DIFFERENT creative angle (e.g. pain point vs. aspiration)\n- Each variant needs: angle, headline (under 40 chars), body (under 125 chars), and CTA button text\n- Calls claude-sonnet-4-5 with max_tokens=500\n- Requests JSON: {"variants": [{"angle": "...", "headline": "...", "body": "...", "cta": "..."}]}\n- Parses and returns the variants list\n\nAdd a comment that explicitly requesting "different angles" matters — without it Claude tends to generate near-duplicate variants that don\'t test anything meaningful.\n\n2) mailchimp.py using mailchimp_marketing with schedule_email(email, send_time, list_id) that:\n- Configures a Mailchimp client with an API key and server prefix\n- Creates a "regular" campaign for the given list_id with subject_line, preview_text, title, from_name, and reply_to set from the email dict\n- Sets the campaign content to an HTML wrapper around email["body"]\n- Schedules the campaign for send_time\n\nAdd a comment that schedule_time must be UTC and at least 15 minutes in the future — validate this before calling the API.\n\n3) buffer.py using requests with schedule_social_post(text, profile_id, scheduled_at, access_token) that POSTs to https://api.bufferapp.com/1/updates/create.json with access_token, profile_ids[], text, and scheduled_at.\n\nAdd a comment that Buffer\'s scheduled_at is a Unix timestamp — convert planned campaign days to actual dates/times before calling.',
              verify: 'Run write_ad_variants() and confirm the 2 variants have visibly different angles. Run schedule_email() against a Mailchimp test list and confirm a draft campaign appears scheduled. Run schedule_social_post() and confirm the post appears in your Buffer queue.',
            },
          ],
          goFurther: 'Build a small dry_run mode for mailchimp.py and buffer.py that prints what would be scheduled instead of calling the real APIs — useful for reviewing a full campaign before going live. 🛠️🛠️',
        },
        {
          number: 4,
          title: 'Pull performance and generate optimizations',
          time: '45 min',
          description: 'Once the campaign is live, pull real metrics and have Claude suggest specific changes to the remaining assets.',
          steps: [
            {
              instruction: 'Ask Claude to build performance.py with email/social performance functions, and optimize.py with a suggest_optimizations function — then main.py to run the full pipeline.',
              prompt: 'Write two Python files and a main.py for a marketing campaign manager.\n\n1) performance.py with:\n- get_email_performance(campaign_id) using the mailchimp client\'s reports.get_campaign_report(campaign_id), returning {"open_rate": ..., "click_rate": ...} from the report\n- get_social_performance(post_id, access_token) using requests to GET https://api.bufferapp.com/1/updates/{post_id}.json with the access_token, returning the "statistics" field from the response\n\nAdd a comment that performance data should be pulled no earlier than 48 hours after send — early metrics are statistically noisy.\n\n2) optimize.py using the anthropic Python SDK with suggest_optimizations(brief, performance_data, remaining_plan) that:\n- Sends the campaign brief, performance data so far, and the remaining planned assets to Claude\n- Asks for 2-3 specific changes to the remaining assets based on what\'s performing well/poorly, with an example like "shift email 3\'s subject line toward urgency, since the curiosity-based email 1 underperformed"\n- Calls claude-sonnet-4-5 with max_tokens=500 and returns the response text\n\nAdd a comment that feeding actual numbers ("12% open rate" not "low open rate") helps Claude calibrate recommendations better against raw data.\n\n3) main.py that chains: plan_campaign -> write_email (for each email) -> write_social_post (for each post) -> write_ad_variants -> schedule_email / schedule_social_post for the first few assets -> (after a delay) get_email_performance / get_social_performance -> suggest_optimizations for the remaining plan, printing the recommendations.',
              verify: 'After your campaign has been live 48+ hours, run get_email_performance() and get_social_performance() and confirm you get real numbers back. Run suggest_optimizations() with those numbers and confirm the output references specific metrics in its recommendations.',
            },
          ],
          goFurther: 'Automatically apply low-risk optimizations (e.g. regenerate an underperforming email\'s subject line) and flag higher-risk ones for human approval. 🛠️🛠️',
        },
      ],
      portfolio: 'Add this to your portfolio as "AI Marketing Campaign Manager" — a great showcase for growth marketing, marketing ops, or demand gen roles. Show the campaign plan, a sample email/social/ad set generated from one brief, and a mid-campaign optimization recommendation grounded in real metrics.',
      portfolioPrompt: 'Help me write a portfolio entry and a LinkedIn post for a project I just built: an Automated Marketing Campaign Manager. From a single one-paragraph campaign brief, it generates a full 2-week multi-channel plan — 3 emails, 6 social posts, and 2 A/B ad variants with distinct creative angles — writes the complete copy for each asset tuned to its platform, schedules emails via Mailchimp and social posts via Buffer, and after the campaign goes live, pulls real performance metrics (open rates, click rates, engagement) and has Claude generate specific, data-grounded recommendations for optimizing the remaining assets. Write:\n1. A 3-4 sentence portfolio project description emphasizing speed-to-launch and data-driven mid-campaign optimization\n2. A LinkedIn post (under 150 words) for a growth marketing audience\n3. Two resume bullet points quantifying campaign turnaround time saved',
    },
    steps: [
      {
        number: 1,
        title: 'Build the campaign planner',
        description: 'Take a campaign brief and ask Claude to produce a structured multi-channel plan with timing.',
        code: `# plan.py
from anthropic import Anthropic
import json

ai = Anthropic()

def plan_campaign(brief):
    prompt = f"""Campaign brief: {brief}

Create a 2-week multi-channel campaign plan. Include: 3 emails (with send days),
6 social posts (LinkedIn/Twitter, with days), and 2 ad copy variants for paid social.

Return JSON: {{"emails": [{{"day": 1, "subject": "...", "goal": "..."}}],
"social_posts": [{{"day": 1, "platform": "...", "goal": "..."}}],
"ad_variants": [{{"headline": "...", "angle": "..."}}]}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=1200,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)`,
        tip: 'Ask for "goal" per asset, not just topic — it lets later steps generate copy that matches intent (awareness vs. conversion).',
      },
      {
        number: 2,
        title: 'Generate email copy',
        description: 'For each planned email, generate full subject line, preview text, and body copy.',
        code: `# emails.py
def write_email(email_plan, brief):
    prompt = f"""Campaign context: {brief}
Email goal: {email_plan['goal']}, planned subject: "{email_plan['subject']}"

Write the full email: subject line (refine if needed), preview text (under 90 chars),
and body (150-250 words) with one clear CTA.
Return JSON: {{"subject": "...", "preview": "...", "body": "..."}}"""
    import json
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=600,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)`,
        tip: 'Generate all 3 emails in one session by feeding previous emails as context — it keeps the narrative arc of the sequence consistent.',
      },
      {
        number: 3,
        title: 'Generate social posts',
        description: 'For each social slot, generate platform-appropriate copy (length, tone, hashtags).',
        code: `# social.py
def write_social_post(post_plan, brief):
    platform_rules = {
        "LinkedIn": "professional tone, 100-200 words, 3-5 hashtags",
        "Twitter": "casual tone, under 280 characters, 1-2 hashtags",
    }
    prompt = f"""Campaign context: {brief}
Platform: {post_plan['platform']} ({platform_rules.get(post_plan['platform'], '')})
Post goal: {post_plan['goal']}

Write the post copy."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=300,
        messages=[{"role": "user", "content": prompt}]).content[0].text`,
        tip: 'Maintain a platform_rules dict you can extend — adding Instagram or TikTok later is then a one-line change.',
      },
      {
        number: 4,
        title: 'Generate ad copy variants',
        description: 'Generate two distinct creative angles for paid social ads, each with headline, body, and CTA.',
        code: `# ads.py
def write_ad_variants(brief, n=2):
    prompt = f"""Campaign brief: {brief}

Write {n} distinct paid social ad variants, each with a different angle (e.g. pain point vs. aspiration).
Each variant: headline (under 40 chars), body (under 125 chars), CTA button text.
Return JSON: {{"variants": [{{"angle": "...", "headline": "...", "body": "...", "cta": "..."}}]}}"""
    import json
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=500,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)["variants"]`,
        tip: 'Explicitly request "different angles" — without it, Claude tends to generate near-duplicate variants that don’t test anything meaningful.',
      },
      {
        number: 5,
        title: 'Schedule emails via Mailchimp',
        description: 'Create and schedule campaign emails through the Mailchimp Marketing API.',
        code: `# mailchimp.py
import mailchimp_marketing as MailchimpMarketing

client = MailchimpMarketing.Client()
client.set_config({"api_key": "YOUR_KEY", "server": "us1"})

def schedule_email(email, send_time, list_id):
    campaign = client.campaigns.create({
        "type": "regular",
        "recipients": {"list_id": list_id},
        "settings": {"subject_line": email["subject"], "preview_text": email["preview"],
                      "title": email["subject"], "from_name": "Your Company", "reply_to": "hello@yourcompany.com"},
    })
    client.campaigns.set_content(campaign["id"], {"html": f"<p>{email['body']}</p>"})
    client.campaigns.schedule(campaign["id"], {"schedule_time": send_time})`,
        tip: 'Mailchimp schedule_time must be in UTC and at least 15 minutes in the future — validate this before calling the API.',
      },
      {
        number: 6,
        title: 'Schedule social posts via Buffer',
        description: 'Queue social posts to Buffer for the planned dates and times.',
        code: `# buffer.py
import requests

def schedule_social_post(text, profile_id, scheduled_at, access_token):
    requests.post("https://api.bufferapp.com/1/updates/create.json", data={
        "access_token": access_token, "profile_ids[]": profile_id,
        "text": text, "scheduled_at": scheduled_at,
    })`,
        tip: 'Buffer’s scheduled_at is a Unix timestamp — convert your planned campaign days to actual dates/times before calling.',
      },
      {
        number: 7,
        title: 'Pull mid-campaign performance',
        description: 'After the campaign has been live for several days, pull open rates, click rates, and engagement metrics.',
        code: `# performance.py
def get_email_performance(campaign_id):
    report = client.reports.get_campaign_report(campaign_id)
    return {"open_rate": report["opens"]["open_rate"], "click_rate": report["clicks"]["click_rate"]}

def get_social_performance(post_id, access_token):
    resp = requests.get(f"https://api.bufferapp.com/1/updates/{post_id}.json",
        params={"access_token": access_token})
    return resp.json().get("statistics", {})`,
        tip: 'Pull performance data no earlier than 48 hours after send — early metrics are statistically noisy and lead to premature conclusions.',
      },
      {
        number: 8,
        title: 'Generate optimization recommendations',
        description: 'Send mid-campaign performance data to Claude and ask for specific recommendations for the remaining assets.',
        code: `# optimize.py
def suggest_optimizations(brief, performance_data, remaining_plan):
    prompt = f"""Campaign brief: {brief}
Performance so far: {performance_data}
Remaining planned assets: {remaining_plan}

Based on what's performing well/poorly, suggest 2-3 specific changes to the remaining assets
(e.g. "shift email 3's subject line toward urgency, since the curiosity-based email 1 underperformed")."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=500,
        messages=[{"role": "user", "content": prompt}]).content[0].text`,
        tip: 'Feed actual numbers, not adjectives ("12% open rate" not "low open rate") — Claude calibrates recommendations better against raw data.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Automated Marketing Campaign Manager (starter)
Run: pip install anthropic mailchimp-marketing requests
"""
import json
from anthropic import Anthropic

ai = Anthropic()

def plan_campaign(brief):
    prompt = f"""Campaign brief: {brief}
Create a 2-week plan: 3 emails (day, subject, goal) and 4 social posts (day, platform, goal).
Return JSON: {{"emails": [...], "social_posts": [...]}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=800,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)

def write_email(email_plan, brief):
    prompt = f"""Brief: {brief}\\nEmail goal: {email_plan['goal']}\\nWrite subject, preview, and 150-word body.
Return JSON: {{"subject":"...","preview":"...","body":"..."}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=400,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)

if __name__ == "__main__":
    plan = plan_campaign("Launch of our new AI-powered analytics dashboard for mid-market SaaS companies.")
    print(write_email(plan["emails"][0], "AI analytics dashboard launch"))
`,
    resources: [
      { title: 'Mailchimp Marketing API', url: 'https://mailchimp.com/developer/marketing/api/' },
      { title: 'Buffer API Docs', url: 'https://buffer.com/developers/api' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 32,
    title: 'Inventory & Supply Chain Optimization Agent',
    emoji: '📦',
    department: ['Operations'],
    departmentIds: ['operations'],
    difficulty: 'Advanced',
    description:
      'Analyzes inventory levels, sales velocity, and supplier lead times to recommend reorder quantities and flag stockout/overstock risks before they happen.',
    whatYouBuild:
      'A supply chain agent that ingests inventory levels, historical sales, and supplier lead times, computes reorder points and economic order quantities per SKU, simulates demand scenarios to flag stockout/overstock risk, and asks Claude to write supplier-facing purchase order emails with reasoning for the recommended quantities.',
    whatYouLearn: [
      'Compute reorder points and safety stock from demand variability',
      'Calculate economic order quantity (EOQ)',
      'Run simple Monte Carlo demand simulations',
      'Classify SKUs by risk (stockout vs. overstock)',
      'Generate supplier purchase order communications with Claude',
      'Build a prioritized action dashboard for ops teams',
    ],
    techStack: ['Python', 'pandas', 'Claude API', 'NumPy'],
    buildTime: '6 hrs',
    xp: 800,
    popularity: 73,
    prerequisites: ['pandas basics', 'Basic statistics', 'Inventory + sales history CSVs'],
    tags: ['operations', 'supply-chain', 'inventory', 'optimization'],
    session: {
      totalTime: '150 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'A unified dataset combining inventory levels, sales history, and supplier lead times per SKU',
        'Reorder points, safety stock, and economic order quantities computed per SKU',
        'A Monte Carlo stockout simulation and a Critical/Watch/Healthy/Overstocked risk classification',
        'Claude-drafted supplier purchase order emails and a prioritized action report for ops',
      ],
      whatYouNeed: [
        'Python installed locally',
        'An Anthropic API key (console.anthropic.com)',
        'pip install pandas numpy scipy anthropic',
        'inventory.csv (sku, on_hand), sales.csv (sku, date, units_sold — 90+ days), suppliers.csv (sku, lead_time_days, moq)',
      ],
      builds: [
        {
          number: 1,
          title: 'Load data and compute demand statistics',
          time: '30 min',
          description: 'Combine inventory, sales, and supplier data, then calculate average daily demand and variability per SKU.',
          steps: [
            {
              instruction: 'Ask Claude to build load.py to combine the three CSVs, and demand.py with a demand_stats function.',
              prompt: 'Write two Python files for an inventory optimization tool using pandas.\n\n1) load.py with load_data(inventory_path, sales_path, suppliers_path) that:\n- Reads inventory.csv (columns: sku, on_hand)\n- Reads sales.csv (columns: sku, date, units_sold), parsing date as a datetime\n- Reads suppliers.csv (columns: sku, lead_time_days, moq)\n- Returns the three DataFrames\n\nAdd a comment that at least 90 days of sales history is needed for demand variability calculations to be meaningful.\n\n2) demand.py with demand_stats(sales) that:\n- Groups sales by sku and date, summing units_sold to get daily totals\n- Groups those daily totals by sku and computes mean and std of units_sold\n- Renames the result columns to ["sku", "avg_daily_demand", "demand_std"]\n- Fills NaN with 0 and returns the result\n\nAdd a comment that SKUs with very few sales will have demand_std near 0, understating risk — apply a minimum std floor of 0.1x the mean.',
              verify: 'Run load_data() and confirm all three DataFrames load with the expected columns. Run demand_stats() and confirm every SKU has avg_daily_demand and demand_std values.',
            },
          ],
          goFurther: 'Implement the minimum std floor mentioned in the comment: demand_std = max(demand_std, 0.1 * avg_daily_demand). 🛠️',
        },
        {
          number: 2,
          title: 'Compute reorder points and economic order quantities',
          time: '35 min',
          description: 'Calculate safety stock, reorder points, and the order quantity that minimizes total ordering + holding costs.',
          steps: [
            {
              instruction: 'Ask Claude to build reorder.py with a compute_reorder_point function, and eoq.py with a compute_eoq function.',
              prompt: 'Write two Python files for an inventory optimization tool using numpy and scipy.stats.\n\n1) reorder.py with compute_reorder_point(demand_stats, suppliers, service_level=0.95) that:\n- Computes z = norm.ppf(service_level)\n- Merges demand_stats with suppliers on "sku"\n- Computes safety_stock = z * demand_std * sqrt(lead_time_days)\n- Computes reorder_point = avg_daily_demand * lead_time_days + safety_stock\n- Returns the merged DataFrame with these new columns\n\nAdd a comment that a 95% service level (z≈1.65) is a reasonable default — push to 99% only for the highest-margin or most critical SKUs.\n\n2) eoq.py with compute_eoq(df, order_cost, holding_cost_pct, unit_cost) that:\n- Computes annual_demand = avg_daily_demand * 365\n- Computes holding_cost = unit_cost * holding_cost_pct\n- Computes eoq = sqrt((2 * annual_demand * order_cost) / holding_cost)\n- Clips eoq to be at least the supplier\'s moq (df["moq"])\n- Returns the DataFrame with the eoq column added\n\nAdd a comment that EOQ must always be clipped to the supplier\'s MOQ, since the formula can suggest order quantities below what suppliers will accept.',
              verify: 'Run compute_reorder_point() and confirm reorder_point > 0 for every SKU. Run compute_eoq() and confirm eoq >= moq for every SKU.',
            },
          ],
          goFurther: 'Add a per-SKU service_level override for your top 10% highest-revenue SKUs, bumping them to 99%. 🛠️🛠️',
        },
        {
          number: 3,
          title: 'Run Monte Carlo stockout simulation and classify risk',
          time: '35 min',
          description: 'Simulate demand variability to estimate stockout probability, then bucket each SKU into a risk category.',
          steps: [
            {
              instruction: 'Ask Claude to build simulate.py with a simulate_stockout_risk function, and classify.py with a classify_risk function.',
              prompt: 'Write two Python files for an inventory optimization tool using numpy.\n\n1) simulate.py with simulate_stockout_risk(row, n_simulations=1000) that:\n- Generates n_simulations samples from a normal distribution with mean = avg_daily_demand * lead_time_days and std = demand_std * sqrt(lead_time_days)\n- Clips negative simulated values to 0 with np.clip (normal distributions can produce small negative numbers for low-demand SKUs)\n- Computes stockout_prob as the fraction of simulations where simulated lead-time demand exceeds on_hand\n- Returns stockout_prob rounded to 3 decimals\n\n2) classify.py with classify_risk(row) that:\n- Returns "Critical" if stockout_prob > 0.3\n- Returns "Watch" if on_hand < reorder_point\n- Returns "Overstocked" if on_hand > reorder_point * 3\n- Otherwise returns "Healthy"\n\nAdd a comment that the output table should be sorted by risk category with Critical first, since that\'s the order ops teams will actually work through it.',
              verify: 'Apply simulate_stockout_risk() to every row of your merged DataFrame and confirm stockout_prob values are between 0 and 1. Apply classify_risk() and confirm SKUs fall into all 4 categories across a realistic dataset.',
            },
          ],
          goFurther: 'Run the simulation with a "what if lead time doubles" scenario (e.g. for a supplier going through a disruption) and compare stockout probabilities. 🛠️🛠️',
        },
        {
          number: 4,
          title: 'Generate purchase order emails and the action dashboard',
          time: '50 min',
          description: 'Have Claude draft supplier purchase orders for at-risk SKUs, and produce a prioritized report for the ops team.',
          steps: [
            {
              instruction: 'Ask Claude to build po_email.py with a write_po_email function, and dashboard.py with a build_action_report function — then main.py to run the full pipeline.',
              prompt: 'Write two Python files and a main.py for an inventory optimization tool.\n\n1) po_email.py using the anthropic Python SDK with write_po_email(sku_row, supplier_name) that:\n- Builds a prompt asking Claude to write a brief, professional purchase order email to supplier_name for sku_row["sku"]\n- Includes the order quantity (int(sku_row["eoq"])), current stock (sku_row["on_hand"]), reorder point (formatted to 0 decimals), and lead time\n- Asks Claude to mention the order is time-sensitive given current stock levels, under 100 words\n- Calls claude-sonnet-4-5 with max_tokens=250 and returns the response text\n\nAdd a comment that PO emails for the same supplier should be batched into a single email rather than one-per-SKU.\n\n2) dashboard.py with build_action_report(df, output="inventory_actions.md") that:\n- Sorts df by risk category in the order Critical, Watch, Healthy, Overstocked\n- Writes a markdown file with a title heading\n- For each Critical or Watch SKU, writes a bullet with the SKU, risk level, recommended order quantity (int(eoq)), and stockout risk percentage\n- For each Overstocked SKU, writes a bullet suggesting promotion or pausing reordering\n\nAdd a comment that this report should be run weekly since supply chain conditions (especially lead times) shift faster than most teams expect.\n\n3) main.py that chains: load_data -> demand_stats -> compute_reorder_point -> compute_eoq -> simulate_stockout_risk (per row) -> classify_risk (per row) -> build_action_report, and for Critical/Watch SKUs, calls write_po_email() and prints the drafts grouped by supplier.',
              verify: 'Run main.py end-to-end — inventory_actions.md should list Critical/Watch SKUs first with order quantities and stockout risk, and PO email drafts should print for each at-risk SKU.',
            },
          ],
          goFurther: 'Group PO email drafts by supplier into one combined email per supplier covering all their at-risk SKUs. 🛠️🛠️',
        },
      ],
      portfolio: 'Add this to your portfolio as "AI Inventory & Supply Chain Optimization Agent" — a strong project for operations, supply chain, or inventory management roles. Show the risk classification breakdown, the stockout simulation for a sample SKU, and a generated purchase order email.',
      portfolioPrompt: 'Help me write a portfolio entry and a LinkedIn post for a project I just built: an AI Inventory & Supply Chain Optimization Agent. It combines inventory levels, sales history, and supplier lead times to compute reorder points, safety stock, and economic order quantities per SKU, runs a Monte Carlo simulation to estimate stockout probability, classifies every SKU as Critical/Watch/Healthy/Overstocked, and uses Claude to draft supplier-facing purchase order emails with reasoning for the recommended quantities — all rolled up into a prioritized action report for the ops team. Write:\n1. A 3-4 sentence portfolio project description emphasizing proactive stockout prevention and cost optimization\n2. A LinkedIn post (under 150 words) for an operations/supply chain audience\n3. Two resume bullet points quantifying potential reduction in stockouts and excess inventory carrying costs',
    },
    steps: [
      {
        number: 1,
        title: 'Load inventory and sales data',
        description: 'Combine current stock levels, historical daily sales, and supplier lead times into one DataFrame per SKU.',
        code: `# load.py
import pandas as pd

def load_data(inventory_path, sales_path, suppliers_path):
    inventory = pd.read_csv(inventory_path)   # sku, on_hand
    sales = pd.read_csv(sales_path, parse_dates=["date"])  # sku, date, units_sold
    suppliers = pd.read_csv(suppliers_path)   # sku, lead_time_days, moq
    return inventory, sales, suppliers`,
        tip: 'At least 90 days of sales history is needed for the demand variability calculation in step 2 to be meaningful.',
      },
      {
        number: 2,
        title: 'Compute demand statistics',
        description: 'Calculate average daily demand and demand standard deviation per SKU.',
        code: `# demand.py
def demand_stats(sales):
    daily = sales.groupby(["sku", "date"])["units_sold"].sum().reset_index()
    stats = daily.groupby("sku")["units_sold"].agg(["mean", "std"]).reset_index()
    stats.columns = ["sku", "avg_daily_demand", "demand_std"]
    return stats.fillna(0)`,
        tip: 'SKUs with very few sales will have demand_std near 0, understating risk — apply a minimum std floor of 0.1x the mean.',
      },
      {
        number: 3,
        title: 'Compute reorder points and safety stock',
        description: 'Calculate safety stock and reorder point using lead time and a target service level.',
        code: `# reorder.py
import numpy as np
from scipy.stats import norm

def compute_reorder_point(demand_stats, suppliers, service_level=0.95):
    z = norm.ppf(service_level)
    df = demand_stats.merge(suppliers, on="sku")
    df["safety_stock"] = z * df["demand_std"] * np.sqrt(df["lead_time_days"])
    df["reorder_point"] = df["avg_daily_demand"] * df["lead_time_days"] + df["safety_stock"]
    return df`,
        tip: 'A 95% service level (z≈1.65) is a reasonable default — push it to 99% only for your highest-margin or most critical SKUs.',
      },
      {
        number: 4,
        title: 'Compute economic order quantity (EOQ)',
        description: 'Calculate the order quantity that minimizes total ordering + holding costs.',
        code: `# eoq.py
def compute_eoq(df, order_cost, holding_cost_pct, unit_cost):
    annual_demand = df["avg_daily_demand"] * 365
    holding_cost = unit_cost * holding_cost_pct
    df["eoq"] = np.sqrt((2 * annual_demand * order_cost) / holding_cost)
    df["eoq"] = df["eoq"].clip(lower=df["moq"])  # respect supplier minimum order quantity
    return df`,
        tip: 'Always clip EOQ to the supplier’s MOQ — the formula can suggest order quantities below what suppliers will accept.',
      },
      {
        number: 5,
        title: 'Run a Monte Carlo stockout simulation',
        description: 'Simulate demand over the lead time period many times to estimate stockout probability for current stock levels.',
        code: `# simulate.py
def simulate_stockout_risk(row, n_simulations=1000):
    lead_time_demand = np.random.normal(
        row["avg_daily_demand"] * row["lead_time_days"],
        row["demand_std"] * np.sqrt(row["lead_time_days"]),
        n_simulations,
    )
    stockout_prob = (lead_time_demand > row["on_hand"]).mean()
    return round(stockout_prob, 3)`,
        tip: 'Clip negative simulated demand values to 0 with np.clip — normal distributions can produce small negative numbers for low-demand SKUs.',
      },
      {
        number: 6,
        title: 'Classify SKU risk',
        description: 'Combine reorder point, EOQ, and stockout probability to classify each SKU as Critical, Watch, Healthy, or Overstocked.',
        code: `# classify.py
def classify_risk(row):
    if row["stockout_prob"] > 0.3:
        return "Critical"
    if row["on_hand"] < row["reorder_point"]:
        return "Watch"
    if row["on_hand"] > row["reorder_point"] * 3:
        return "Overstocked"
    return "Healthy"`,
        tip: 'Sort the output table by risk category (Critical first) — that’s the order ops teams will actually work through it.',
      },
      {
        number: 7,
        title: 'Generate purchase order emails',
        description: 'For Critical and Watch SKUs, ask Claude to draft a purchase order email to the supplier with reasoning.',
        code: `# po_email.py
from anthropic import Anthropic
ai = Anthropic()

def write_po_email(sku_row, supplier_name):
    prompt = f"""Write a brief, professional purchase order email to {supplier_name} for SKU {sku_row['sku']}.
Order quantity: {int(sku_row['eoq'])} units. Current stock: {sku_row['on_hand']}.
Reorder point: {sku_row['reorder_point']:.0f}. Lead time: {sku_row['lead_time_days']} days.

Mention the order is time-sensitive given current stock levels. Keep it under 100 words."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=250,
        messages=[{"role": "user", "content": prompt}]).content[0].text`,
        tip: 'Batch all PO emails for the same supplier into a single email rather than one-per-SKU — suppliers (and your AP team) will thank you.',
      },
      {
        number: 8,
        title: 'Build the action dashboard',
        description: 'Export a prioritized CSV/Markdown summary for the ops team showing risk category, recommended action, and quantities.',
        code: `# dashboard.py
def build_action_report(df, output="inventory_actions.md"):
    df = df.sort_values(by="risk", key=lambda s: s.map({"Critical": 0, "Watch": 1, "Healthy": 2, "Overstocked": 3}))
    with open(output, "w") as f:
        f.write("# Inventory Action Report\\n\\n")
        for _, row in df.iterrows():
            if row["risk"] in ("Critical", "Watch"):
                f.write(f"- **{row['sku']}** ({row['risk']}): order {int(row['eoq'])} units "
                        f"(stockout risk {row['stockout_prob']*100:.0f}%)\\n")
            elif row["risk"] == "Overstocked":
                f.write(f"- **{row['sku']}** (Overstocked): consider promotion or pause reordering\\n")`,
        tip: 'Run this report weekly — supply chain conditions (lead times especially) shift faster than most teams expect.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Inventory & Supply Chain Optimization Agent (starter)
Run: pip install pandas numpy scipy anthropic
"""
import pandas as pd
import numpy as np
from scipy.stats import norm
from anthropic import Anthropic

ai = Anthropic()

def analyze_inventory(inventory_path, sales_path, suppliers_path, service_level=0.95):
    inventory = pd.read_csv(inventory_path)
    sales = pd.read_csv(sales_path, parse_dates=["date"])
    suppliers = pd.read_csv(suppliers_path)

    daily = sales.groupby(["sku", "date"])["units_sold"].sum().reset_index()
    stats = daily.groupby("sku")["units_sold"].agg(["mean", "std"]).reset_index()
    stats.columns = ["sku", "avg_daily_demand", "demand_std"]

    df = stats.merge(suppliers, on="sku").merge(inventory, on="sku")
    z = norm.ppf(service_level)
    df["safety_stock"] = z * df["demand_std"].fillna(0) * np.sqrt(df["lead_time_days"])
    df["reorder_point"] = df["avg_daily_demand"] * df["lead_time_days"] + df["safety_stock"]
    df["needs_reorder"] = df["on_hand"] < df["reorder_point"]
    return df

if __name__ == "__main__":
    df = analyze_inventory("inventory.csv", "sales.csv", "suppliers.csv")
    print(df[df["needs_reorder"]][["sku", "on_hand", "reorder_point"]])
`,
    resources: [
      { title: 'SciPy Statistics', url: 'https://docs.scipy.org/doc/scipy/reference/stats.html' },
      { title: 'pandas Documentation', url: 'https://pandas.pydata.org/docs/' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 33,
    title: 'AI Code Migration Agent',
    emoji: '🛠️',
    department: ['Engineering'],
    departmentIds: ['engineering'],
    difficulty: 'Advanced',
    description:
      'Scans a legacy codebase, identifies outdated patterns (e.g. Python 2, deprecated APIs, old framework versions), and generates migration patches with tests.',
    whatYouBuild:
      'A code migration agent that walks a codebase, identifies files using deprecated patterns (via AST analysis and pattern matching), asks Claude to generate a migrated version of each file plus a unit test verifying behavior is preserved, runs the tests in a sandbox, and opens a pull request with all passing migrations grouped by module.',
    whatYouLearn: [
      'Walk and analyze a codebase with Python’s ast module',
      'Detect deprecated patterns and API usage programmatically',
      'Generate code migrations with Claude while preserving behavior',
      'Generate accompanying unit tests for migrated code',
      'Run generated tests in an isolated sandbox before accepting changes',
      'Automate PR creation grouped by logical module',
    ],
    techStack: ['Python', 'Claude API', 'GitHub API', 'ast'],
    buildTime: '7 hrs',
    xp: 880,
    popularity: 80,
    prerequisites: ['Completed Code Review Agent', 'Strong Python fundamentals', 'Git/GitHub familiarity'],
    tags: ['engineering', 'migration', 'refactoring', 'automation'],
    session: {
      totalTime: '160 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'A codebase walker and AST-based detector flagging deprecated imports and patterns',
        'A Claude-powered migrator that rewrites flagged files while preserving the public API',
        'Generated pytest tests run in a sandboxed copy of the repo before anything is accepted',
        'Migrations grouped by module, applied on new branches, and opened as review-required PRs',
      ],
      whatYouNeed: [
        'Python installed locally',
        'An Anthropic API key (console.anthropic.com)',
        'pip install anthropic',
        'A target git repo with write access and a GitHub personal access token',
        'A clear migration target (e.g. "Flask 1.x to 2.x" or "Python 2 idioms to Python 3")',
      ],
      builds: [
        {
          number: 1,
          title: 'Walk the codebase and detect deprecated patterns',
          time: '30 min',
          description: 'Find every Python file in the target repo and flag files using outdated patterns via AST analysis.',
          steps: [
            {
              instruction: 'Ask Claude to build walk.py to find Python files, and detect.py with an AST-based DeprecationVisitor.',
              prompt: 'Write two Python files for a code migration agent.\n\n1) walk.py with:\n- EXCLUDE_DIRS = {".git", "__pycache__", "venv", "node_modules", ".venv"}\n- find_python_files(root) that uses os.walk, prunes EXCLUDE_DIRS by modifying dirnames in place, and returns a list of paths to all .py files found\n\nAdd a comment explaining that modifying dirnames[:] in place is how os.walk lets you prune directories from traversal.\n\n2) detect.py using the ast module with:\n- DEPRECATED_IMPORTS = a set of module names relevant to your migration (e.g. {"imp", "urllib2", "ConfigParser", "Queue"} for Python 2->3, or relevant deprecated APIs for your target framework)\n- A DeprecationVisitor(ast.NodeVisitor) class that tracks a findings list and implements visit_Import to flag any imported name in DEPRECATED_IMPORTS as {"line": ..., "type": "deprecated_import", "name": ...}\n- detect_deprecations(file_path) that parses the file\'s AST, runs the visitor, and returns its findings\n\nAdd a comment recommending starting with a small DEPRECATED_IMPORTS list scoped to your specific migration rather than trying to catch everything at once.',
              verify: 'Run find_python_files() on a real repo and confirm it returns .py paths while skipping venv/.git. Run detect_deprecations() on a file with a known deprecated import and confirm it\'s flagged.',
            },
          ],
          goFurther: 'Extend DeprecationVisitor with visit_Call or visit_Attribute to flag deprecated function calls, not just imports (e.g. `urllib.urlopen` vs `urllib.request.urlopen`). 🛠️🛠️',
        },
        {
          number: 2,
          title: 'Build the Claude migrator and test generator',
          time: '40 min',
          description: 'For flagged files, ask Claude to rewrite them preserving behavior, and generate pytest tests to verify that.',
          steps: [
            {
              instruction: 'Ask Claude to build migrate.py with a migrate_file function, and generate_tests.py with a generate_tests function.',
              prompt: 'Write two Python files for a code migration agent using the anthropic Python SDK.\n\n1) migrate.py with migrate_file(source_code, findings, migration_guide) that:\n- Builds a prompt telling Claude the file has these deprecated patterns: {findings}, and includes the migration_guide and the full source_code\n- Asks Claude to rewrite the file to fix the deprecated patterns while preserving all behavior and the public API (function/class names and signatures must stay the same unless the migration guide says otherwise)\n- Asks for ONLY the complete migrated file content, no explanation\n- Calls claude-sonnet-4-5 with max_tokens=8000 and returns the response text\n\nAdd a comment that the migration_guide should contain explicit before/after examples for the specific migration — generic instructions produce inconsistent results across files.\n\n2) generate_tests.py with generate_tests(original_code, migrated_code, file_path) that:\n- Sends both the original and migrated file content to Claude\n- Asks for a pytest test file that imports the public functions/classes from the module and verifies they behave correctly with at least 3 test cases covering typical usage\n- Asks for ONLY the test file content\n- Calls claude-sonnet-4-5 with max_tokens=2000 and returns the response text\n\nAdd a comment that generated tests are a safety net, not a replacement for the project\'s existing test suite — both should run against the migrated code.',
              verify: 'Run migrate_file() on one flagged file and confirm the migrated code no longer triggers detect_deprecations(). Run generate_tests() on the original/migrated pair and confirm the output is valid pytest syntax with at least 3 test functions.',
            },
          ],
          goFurther: 'Write a small migration_guide.txt with 3-5 before/after code snippets specific to your migration, and pass it into migrate_file(). 🛠️🛠️',
        },
        {
          number: 3,
          title: 'Run migrations in a sandbox',
          time: '40 min',
          description: 'Test every migration in an isolated copy of the repo before it ever touches your real working tree.',
          steps: [
            {
              instruction: 'Ask Claude to build sandbox.py with a run_in_sandbox function.',
              prompt: 'Write sandbox.py for a code migration agent using subprocess, tempfile, shutil, and os.\n\nCreate run_in_sandbox(repo_path, file_path, migrated_code, test_code) that:\n- Creates a temporary directory\n- Copies the entire repo_path into a "repo" subdirectory of the temp dir using shutil.copytree\n- Computes the relative path of file_path within repo_path and writes migrated_code to that same relative path in the sandbox copy\n- Writes test_code to a sibling file named <original_name>_migration_test.py\n- Runs `pytest <test_path> -q` via subprocess with cwd set to the sandbox repo, capturing output\n- Returns (success: bool based on returncode == 0, stdout text)\n\nAdd a prominent comment: always copy the repo into a temp directory — never run generated code or tests directly against the working tree.',
              verify: 'Run run_in_sandbox() with a migrated file and its generated test — confirm it returns (True, ...) for a passing migration and (False, ...) with useful pytest output for a failing one. Confirm your real repo is untouched afterward.',
            },
          ],
          goFurther: 'Also run the project\'s existing test suite (not just the generated test) inside the sandbox, and require both to pass before accepting the migration. 🛠️🛠️',
        },
        {
          number: 4,
          title: 'Group migrations, create branches, and open PRs',
          time: '50 min',
          description: 'Organize passing migrations by module, apply them on dedicated branches, and open review-required pull requests.',
          steps: [
            {
              instruction: 'Ask Claude to build group.py, apply.py, and open_pr.py, then main.py to run the full migration pipeline.',
              prompt: 'Write three Python files and a main.py for a code migration agent.\n\n1) group.py with group_by_module(migrated_files, repo_root) that uses os.path.relpath and collections.defaultdict to group file paths by their top-level directory under repo_root, returning a dict of module name -> list of file paths.\n\nAdd a comment that PRs scoped to one module (e.g. "migrate auth/ to new config API") are far easier for reviewers than one giant PR.\n\n2) apply.py with create_migration_branch(repo_path, module_name, file_changes) using subprocess that:\n- Creates and checks out a new branch named "ai-migration/{module_name}"\n- Writes each (file_path, content) in file_changes to disk\n- git add ., commits with message "AI migration: {module_name}", and pushes the branch to origin with -u\n- Returns the branch name\n\nAdd a comment that this should always push to a new branch, never main — PR review is non-negotiable for AI-generated migrations.\n\n3) open_pr.py using requests with open_migration_pr(repo, branch, module_name, summary, token) that POSTs to https://api.github.com/repos/{repo}/pulls with a Bearer token, creating a PR titled "AI Migration: {module_name}" from branch to "main", with a body including the summary and a note that all generated tests passed in sandbox and reviewers should check carefully before merging.\n\nAdd a comment that the "please review carefully" language and a human reviewer tag are mandatory — these PRs should never auto-merge.\n\n4) main.py that chains: find_python_files -> detect_deprecations (skip files with no findings) -> migrate_file -> generate_tests -> run_in_sandbox (skip/log failures) -> group_by_module (for passing files) -> create_migration_branch per module -> open_migration_pr per module with a summary of what changed and test results.',
              verify: 'Run main.py against a small test repo with one known deprecated pattern — confirm it produces a branch with the migrated file + test, and opens a PR with a clear "review carefully" message.',
            },
          ],
          goFurther: 'Add a --dry-run flag that runs the whole pipeline up through sandbox testing but skips branch creation and PR opening, printing a summary report instead. 🛠️🛠️',
        },
      ],
      portfolio: 'Add this to your portfolio as "AI Code Migration Agent" — a flagship project for senior engineering, platform, or DevEx roles. Show a before/after code diff for one migrated file, its generated test, the sandbox test run output, and the resulting PR.',
      portfolioPrompt: 'Help me write a portfolio entry and a LinkedIn post for a project I just built: an AI Code Migration Agent. It walks a codebase, uses Python\'s AST module to detect deprecated patterns and API usage, and for each flagged file asks Claude to generate a migrated version that preserves the public API and behavior, plus a pytest test suite verifying that. Every migration is tested in a sandboxed copy of the repo before being accepted, then passing migrations are grouped by module, applied on dedicated branches, and opened as GitHub pull requests with clear "review carefully" language for human approval — nothing auto-merges. Write:\n1. A 3-4 sentence portfolio project description emphasizing safe, behavior-preserving automated migration at scale\n2. A LinkedIn post (under 150 words) for a senior engineering / platform audience\n3. Two resume bullet points quantifying potential time saved on large-scale refactors',
    },
    steps: [
      {
        number: 1,
        title: 'Walk the codebase',
        description: 'Recursively find all Python files in the target repository, excluding common non-source directories.',
        code: `# walk.py
import os

EXCLUDE_DIRS = {".git", "__pycache__", "venv", "node_modules", ".venv"}

def find_python_files(root):
    files = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for f in filenames:
            if f.endswith(".py"):
                files.append(os.path.join(dirpath, f))
    return files`,
        tip: 'Modify dirnames in place (dirnames[:] = ...) — that’s how os.walk lets you prune directories from traversal.',
      },
      {
        number: 2,
        title: 'Detect deprecated patterns with AST',
        description: 'Parse each file’s AST and flag usages of deprecated functions/modules (e.g. imp module, urllib2, print statements).',
        code: `# detect.py
import ast

DEPRECATED_IMPORTS = {"imp", "urllib2", "ConfigParser", "Queue"}

class DeprecationVisitor(ast.NodeVisitor):
    def __init__(self):
        self.findings = []

    def visit_Import(self, node):
        for alias in node.names:
            if alias.name in DEPRECATED_IMPORTS:
                self.findings.append({"line": node.lineno, "type": "deprecated_import", "name": alias.name})
        self.generic_visit(node)

def detect_deprecations(file_path):
    tree = ast.parse(open(file_path).read())
    visitor = DeprecationVisitor()
    visitor.visit(tree)
    return visitor.findings`,
        tip: 'Start with a small DEPRECATED_IMPORTS list for your specific migration (e.g. just Flask 1.x → 2.x APIs) rather than trying to catch everything at once.',
      },
      {
        number: 3,
        title: 'Build the Claude migrator',
        description: 'For files with findings, send the full source and ask Claude to produce a migrated version preserving behavior.',
        code: `# migrate.py
from anthropic import Anthropic
ai = Anthropic()

def migrate_file(source_code, findings, migration_guide):
    prompt = f"""This Python file has deprecated patterns: {findings}

Migration guide: {migration_guide}

Source code:
{source_code}

Rewrite the file to fix the deprecated patterns while preserving all behavior and the public API
(function/class names and signatures must stay the same unless the migration guide says otherwise).
Return ONLY the complete migrated file content."""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=8000,
        messages=[{"role": "user", "content": prompt}])
    return resp.content[0].text`,
        tip: 'Write a migration_guide string with explicit before/after examples for your specific migration — generic instructions produce inconsistent results across files.',
      },
      {
        number: 4,
        title: 'Generate accompanying tests',
        description: 'Ask Claude to generate a pytest test file that verifies the migrated file behaves the same as the original.',
        code: `# generate_tests.py
def generate_tests(original_code, migrated_code, file_path):
    prompt = f"""Original file:
{original_code}

Migrated file:
{migrated_code}

Write a pytest test file that imports the public functions/classes from this module
and verifies they behave correctly with at least 3 test cases covering typical usage.
Return ONLY the test file content."""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=2000,
        messages=[{"role": "user", "content": prompt}])
    return resp.content[0].text`,
        tip: 'Generated tests are a safety net, not a replacement for existing test suites — always run the project’s existing tests against the migrated code too.',
      },
      {
        number: 5,
        title: 'Run migrations in a sandbox',
        description: 'Write the migrated file and generated test to a temporary copy of the repo and run pytest there.',
        code: `# sandbox.py
import subprocess, tempfile, shutil, os

def run_in_sandbox(repo_path, file_path, migrated_code, test_code):
    with tempfile.TemporaryDirectory() as tmp:
        sandbox_repo = os.path.join(tmp, "repo")
        shutil.copytree(repo_path, sandbox_repo)
        target = os.path.join(sandbox_repo, os.path.relpath(file_path, repo_path))
        open(target, "w").write(migrated_code)
        test_path = target.replace(".py", "_migration_test.py")
        open(test_path, "w").write(test_code)
        result = subprocess.run(["pytest", test_path, "-q"], capture_output=True, text=True, cwd=sandbox_repo)
        return result.returncode == 0, result.stdout`,
        tip: 'Always copy the repo into a temp directory — never run generated code or tests directly against your working tree.',
      },
      {
        number: 6,
        title: 'Group migrations by module',
        description: 'Group successfully-migrated files by their top-level package/module so each PR has a coherent scope.',
        code: `# group.py
import os
from collections import defaultdict

def group_by_module(migrated_files, repo_root):
    groups = defaultdict(list)
    for file_path in migrated_files:
        rel = os.path.relpath(file_path, repo_root)
        module = rel.split(os.sep)[0]
        groups[module].append(file_path)
    return groups`,
        tip: 'PRs scoped to one module (e.g. "migrate auth/ to new config API") are far easier for human reviewers to evaluate than one giant PR.',
      },
      {
        number: 7,
        title: 'Apply migrations and create a branch',
        description: 'Write all passing migrations and tests to a new git branch.',
        code: `# apply.py
import subprocess

def create_migration_branch(repo_path, module_name, file_changes):
    branch = f"ai-migration/{module_name}"
    subprocess.run(["git", "checkout", "-b", branch], cwd=repo_path, check=True)
    for file_path, content in file_changes.items():
        open(file_path, "w").write(content)
    subprocess.run(["git", "add", "."], cwd=repo_path, check=True)
    subprocess.run(["git", "commit", "-m", f"AI migration: {module_name}"], cwd=repo_path, check=True)
    subprocess.run(["git", "push", "-u", "origin", branch], cwd=repo_path, check=True)
    return branch`,
        tip: 'Always push to a new branch, never directly to main — the PR review step is non-negotiable for AI-generated migrations.',
      },
      {
        number: 8,
        title: 'Open the pull request',
        description: 'Use the GitHub API to open a PR with a description summarizing what was migrated and the test results.',
        code: `# open_pr.py
import requests

def open_migration_pr(repo, branch, module_name, summary, token):
    requests.post(f"https://api.github.com/repos/{repo}/pulls",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": f"AI Migration: {module_name}", "head": branch, "base": "main",
              "body": f"Automated migration generated by AgentForge.\\n\\n{summary}\\n\\n"
                      f"All generated tests passed in sandbox. Please review carefully before merging."})`,
        tip: 'Always include "Please review carefully" language and tag a human reviewer — these PRs should never auto-merge.',
      },
    ],
    starterCode: `"""
AgentForge Academy — AI Code Migration Agent (starter)
Run: pip install anthropic
"""
import ast
from anthropic import Anthropic

ai = Anthropic()

def detect_print_statements(file_path):
    tree = ast.parse(open(file_path).read())
    findings = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "print":
            findings.append({"line": node.lineno})
    return findings

def migrate_file(file_path, findings):
    source = open(file_path).read()
    prompt = f"""This file has these issues: {findings}
Source:
{source}

Rewrite to use logging instead of print(), preserving all other behavior.
Return ONLY the complete file content."""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=4000,
        messages=[{"role": "user", "content": prompt}])
    return resp.content[0].text

if __name__ == "__main__":
    findings = detect_print_statements("legacy_module.py")
    if findings:
        print(migrate_file("legacy_module.py", findings))
`,
    resources: [
      { title: 'Python ast module', url: 'https://docs.python.org/3/library/ast.html' },
      { title: 'GitHub Pulls API', url: 'https://docs.github.com/en/rest/pulls' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 34,
    title: 'Fraud Detection & Investigation Agent',
    emoji: '🕵️',
    department: ['Finance'],
    departmentIds: ['finance'],
    difficulty: 'Advanced',
    description:
      'Monitors transactions for suspicious patterns using statistical models, then has Claude investigate flagged cases and write up findings for human review.',
    whatYouBuild:
      'A fraud monitoring pipeline that scores incoming transactions with an isolation forest anomaly model, enriches flagged transactions with customer history and geolocation context, asks Claude to investigate each flagged case and write a structured findings report with a recommended action (approve/hold/block), and routes high-confidence blocks for immediate action while queuing ambiguous cases for human review.',
    whatYouLearn: [
      'Train and apply an isolation forest anomaly detection model',
      'Engineer features for fraud detection (velocity, geo-distance, amount z-scores)',
      'Enrich flagged transactions with customer context',
      'Write investigation prompts that produce structured, evidence-based findings',
      'Implement a confidence-based routing system (auto-action vs. human review)',
      'Build an audit trail for compliance',
    ],
    techStack: ['Python', 'pandas', 'scikit-learn', 'Claude API'],
    buildTime: '7 hrs',
    xp: 900,
    popularity: 77,
    prerequisites: ['pandas + scikit-learn basics', 'Completed Invoice Processing Agent', 'Transaction history dataset'],
    tags: ['finance', 'fraud', 'anomaly-detection', 'investigation'],
    session: {
      totalTime: '170 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'Engineered fraud features (velocity, amount z-score) and a trained isolation forest anomaly model',
        'Impossible-travel detection using geo-distance and timing between transactions',
        'A Claude investigator producing structured, evidence-cited risk findings for flagged transactions',
        'Confidence-based routing (auto-approve / human review / auto-block), an audit trail, and a Streamlit review queue',
      ],
      whatYouNeed: [
        'Python installed locally',
        'An Anthropic API key (console.anthropic.com)',
        'pip install pandas numpy scikit-learn anthropic streamlit',
        'A transaction history dataset with customer_id, timestamp, amount, merchant, lat, lon, plus a customers table with account_age_days and status',
      ],
      builds: [
        {
          number: 1,
          title: 'Engineer fraud features and train the anomaly model',
          time: '45 min',
          description: 'Build velocity and amount-deviation features, then fit an isolation forest to score every transaction.',
          steps: [
            {
              instruction: 'Ask Claude to build features.py with an engineer_features function, and model.py with train_model and score_transactions functions.',
              prompt: 'Write two Python files for a fraud detection pipeline.\n\n1) features.py using pandas and numpy with engineer_features(transactions) that:\n- Sorts transactions by customer_id and timestamp\n- Computes time_since_last as seconds since the customer\'s previous transaction (fillna 99999 for first transactions)\n- Computes velocity_flag = 1 if time_since_last < 60 seconds, else 0\n- Computes per-customer avg_amount and std_amount, merges them in\n- Computes amount_zscore = (amount - avg_amount) / std_amount (replacing std of 0 with 1 to avoid division by zero)\n- Returns the augmented DataFrame\n\nAdd a comment that velocity (multiple transactions in a short window) is one of the strongest individual fraud signals and should be weighted heavily.\n\n2) model.py using sklearn.ensemble.IsolationForest with:\n- FEATURES = ["amount_zscore", "velocity_flag", "time_since_last"]\n- train_model(df, contamination=0.01) that fits an IsolationForest(contamination=contamination, random_state=42) on df[FEATURES] and returns it\n- score_transactions(model, df) that adds anomaly_score = -model.decision_function(df[FEATURES]) (higher = more anomalous) and is_flagged = model.predict(df[FEATURES]) == -1, returning the augmented df\n\nAdd a comment that contamination=0.01 assumes ~1% fraud rate and should be tuned against the historical confirmed-fraud rate.',
              verify: 'Run engineer_features() and confirm time_since_last, velocity_flag, and amount_zscore columns are populated sensibly. Run train_model() + score_transactions() and confirm roughly contamination% of transactions are flagged.',
            },
          ],
          goFurther: 'Add a feature for transactions in a merchant category the customer has never used before — a classic fraud signal not captured by velocity or amount alone. 🛠️🛠️',
        },
        {
          number: 2,
          title: 'Detect impossible travel and enrich flagged transactions',
          time: '40 min',
          description: 'Flag transactions that imply physically impossible travel speed, then gather context for every flagged case.',
          steps: [
            {
              instruction: 'Ask Claude to build geo.py with a flag_impossible_travel function, and enrich.py with an enrich_flagged function.',
              prompt: 'Write two Python files for a fraud detection pipeline.\n\n1) geo.py with:\n- haversine(lat1, lon1, lat2, lon2) computing great-circle distance in km using the haversine formula\n- flag_impossible_travel(df, max_speed_kmh=900) that: sorts by customer_id and timestamp, shifts lat/lon to get each transaction\'s previous location (prev_lat, prev_lon), computes hours_elapsed since the previous transaction, computes distance_km via haversine (0 if there\'s no previous location), and sets impossible_travel = True if distance_km / hours_elapsed (with 0 elapsed replaced by 0.01) exceeds max_speed_kmh\n- Returns the augmented DataFrame\n\nAdd a comment that 900 km/h is roughly commercial flight speed — anything faster between consecutive transactions is physically implausible.\n\n2) enrich.py with enrich_flagged(transaction, all_transactions, customers) that:\n- Gets the customer\'s last 10 transactions (timestamp, amount, merchant) from all_transactions\n- Looks up the customer\'s account_age_days and status from customers\n- Returns {"transaction": transaction.to_dict(), "recent_history": [...], "account_age_days": ..., "account_status": ...}\n\nAdd a comment that account age is a strong contextual signal — fraud is disproportionately common on accounts less than 30 days old.',
              verify: 'Run flag_impossible_travel() on a test customer with two transactions in different countries within an hour — confirm impossible_travel is True. Run enrich_flagged() on a flagged transaction and confirm it includes recent history and account context.',
            },
          ],
          goFurther: 'Combine impossible_travel and is_flagged into a combined "flag_reasons" list per transaction so the investigator prompt can reference both signals explicitly. 🛠️🛠️',
        },
        {
          number: 3,
          title: 'Build the Claude investigator and confidence-based routing',
          time: '40 min',
          description: 'Have Claude produce structured, evidence-based findings for each flagged case, then route based on risk and confidence.',
          steps: [
            {
              instruction: 'Ask Claude to build investigate.py with an investigate function, and routing.py with a route_case function.',
              prompt: 'Write two Python files for a fraud detection pipeline.\n\n1) investigate.py using the anthropic Python SDK with investigate(enriched) that:\n- Sends the enriched transaction, recent history, account age, and account status to Claude\n- Asks Claude to provide: risk_level (low/medium/high/critical), key_evidence (a list of specific observations citing the data provided — not vague statements), recommended_action (approve/hold_for_review/block), and confidence (0-1)\n- Calls claude-sonnet-4-5 with max_tokens=600\n- Requests JSON: {"risk_level": "...", "key_evidence": ["..."], "recommended_action": "...", "confidence": 0.0}\n- Parses and returns the JSON\n\nAdd a comment that requiring key_evidence to cite specific data points makes the output auditable and prevents vague "this seems suspicious" reasoning.\n\n2) routing.py with route_case(investigation) that:\n- Returns "auto_block" if recommended_action == "block" and confidence >= 0.85\n- Returns "human_review" if risk_level is "medium", "high", or "critical"\n- Otherwise returns "auto_approve"\n\nAdd a comment that the auto-block confidence threshold should start high (0.85+) since false positives that block legitimate customers are extremely costly to trust.',
              verify: 'Run investigate() on an enriched flagged transaction and confirm key_evidence cites specific values from the input. Run route_case() on investigations with varying risk_level/confidence and confirm it routes to all three buckets appropriately.',
            },
          ],
          goFurther: 'Track the false-positive rate of auto_block decisions over time (cases later overturned by a human) and use it to tune the 0.85 threshold. 🛠️🛠️',
        },
        {
          number: 4,
          title: 'Build the audit trail and human review queue',
          time: '45 min',
          description: 'Log every investigation for compliance, and give analysts a simple UI to resolve human-review cases.',
          steps: [
            {
              instruction: 'Ask Claude to build audit.py with a log_investigation function, and review_ui.py as a Streamlit app for the review queue — then main.py to run the full pipeline.',
              prompt: 'Write two Python files and a main.py for a fraud detection pipeline.\n\n1) audit.py with log_investigation(transaction_id, anomaly_score, investigation, routing_decision) that appends a JSON line to fraud_audit_log.jsonl containing timestamp (UTC ISO), transaction_id, anomaly_score (as float), the full investigation dict, and routing_decision.\n\nAdd a comment that most financial regulators require an explainable audit trail for any automated transaction-blocking decision — this log is that record.\n\n2) review_ui.py using Streamlit with:\n- A title "Fraud Review Queue"\n- A loop over load_review_queue() (a function you define that reads cases with routing_decision == "human_review" from fraud_audit_log.jsonl)\n- For each case, an st.expander showing "Transaction {id} - Risk: {risk_level}", displaying the full investigation JSON via st.json\n- Two columns with "Approve" and "Block" buttons that call resolve_case(transaction_id, "approved"/"blocked") — define resolve_case to append a resolution record to a resolutions.jsonl file\n\nAdd a comment that showing the full investigation JSON (not just a summary) matters — analysts need the key_evidence list to make a fast, confident decision.\n\n3) main.py that chains: engineer_features -> train_model -> score_transactions -> flag_impossible_travel -> (for each flagged transaction) enrich_flagged -> investigate -> route_case -> log_investigation, printing a summary of how many cases were auto_approve / human_review / auto_block.',
              verify: 'Run main.py on a sample dataset and confirm fraud_audit_log.jsonl gets one entry per flagged transaction with all fields populated. Run `streamlit run review_ui.py` and confirm human_review cases appear with working Approve/Block buttons.',
            },
          ],
          goFurther: 'Add a "case re-opened" workflow: if an analyst overturns an auto_block decision, log it separately and surface a weekly report of overturned auto-blocks for threshold tuning. 🛠️🛠️',
        },
      ],
      portfolio: 'Add this to your portfolio as "AI Fraud Detection & Investigation Agent" — a top-tier project for fintech, trust & safety, or risk management roles. Show the anomaly score distribution, an impossible-travel example, a Claude investigation with cited evidence, and the review queue UI.',
      portfolioPrompt: 'Help me write a portfolio entry and a LinkedIn post for a project I just built: an AI Fraud Detection & Investigation Agent. It engineers fraud-relevant features (transaction velocity, amount z-scores, impossible-travel geo checks), trains an isolation forest to flag anomalous transactions, enriches each flagged case with customer history and account context, and has Claude investigate it — producing a structured report with risk level, evidence citing specific data points, a recommended action, and a confidence score. Cases are routed by confidence: auto-approved, auto-blocked (only high-confidence), or sent to a human review queue with a Streamlit UI, and every decision is logged to an audit trail for compliance. Write:\n1. A 3-4 sentence portfolio project description emphasizing explainable, auditable fraud detection\n2. A LinkedIn post (under 150 words) for a fintech/risk/trust & safety audience\n3. Two resume bullet points quantifying potential fraud loss reduction and analyst time saved',
    },
    steps: [
      {
        number: 1,
        title: 'Engineer fraud features',
        description: 'Build features known to correlate with fraud: transaction velocity, amount z-score, and geo-distance from usual location.',
        code: `# features.py
import pandas as pd
import numpy as np

def engineer_features(transactions):
    df = transactions.sort_values(["customer_id", "timestamp"])
    df["time_since_last"] = df.groupby("customer_id")["timestamp"].diff().dt.total_seconds().fillna(99999)
    df["velocity_flag"] = (df["time_since_last"] < 60).astype(int)  # 2 transactions within 60s

    customer_stats = df.groupby("customer_id")["amount"].agg(["mean", "std"]).reset_index()
    customer_stats.columns = ["customer_id", "avg_amount", "std_amount"]
    df = df.merge(customer_stats, on="customer_id")
    df["amount_zscore"] = (df["amount"] - df["avg_amount"]) / df["std_amount"].replace(0, 1)
    return df`,
        tip: 'Velocity (multiple transactions in a short window) is one of the strongest individual fraud signals — weight it heavily.',
      },
      {
        number: 2,
        title: 'Train the anomaly model',
        description: 'Fit an isolation forest on the engineered features to score each transaction’s anomaly level.',
        code: `# model.py
from sklearn.ensemble import IsolationForest

FEATURES = ["amount_zscore", "velocity_flag", "time_since_last"]

def train_model(df, contamination=0.01):
    model = IsolationForest(contamination=contamination, random_state=42)
    model.fit(df[FEATURES])
    return model

def score_transactions(model, df):
    df["anomaly_score"] = -model.decision_function(df[FEATURES])  # higher = more anomalous
    df["is_flagged"] = model.predict(df[FEATURES]) == -1
    return df`,
        tip: 'contamination=0.01 assumes ~1% of transactions are fraudulent — tune this against your historical confirmed-fraud rate.',
      },
      {
        number: 3,
        title: 'Compute geo-distance anomalies',
        description: 'Flag transactions that occur geographically far from a customer’s typical location within an implausibly short time.',
        code: `# geo.py
from math import radians, sin, cos, sqrt, atan2

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat, dlon = radians(lat2 - lat1), radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))

def flag_impossible_travel(df, max_speed_kmh=900):
    df = df.sort_values(["customer_id", "timestamp"])
    df["prev_lat"] = df.groupby("customer_id")["lat"].shift()
    df["prev_lon"] = df.groupby("customer_id")["lon"].shift()
    df["hours_elapsed"] = df.groupby("customer_id")["timestamp"].diff().dt.total_seconds() / 3600
    df["distance_km"] = df.apply(lambda r: haversine(r["prev_lat"], r["prev_lon"], r["lat"], r["lon"])
                                  if pd.notna(r["prev_lat"]) else 0, axis=1)
    df["impossible_travel"] = (df["distance_km"] / df["hours_elapsed"].replace(0, 0.01)) > max_speed_kmh
    return df`,
        tip: '900 km/h is roughly commercial flight speed — anything faster than that between consecutive transactions is physically implausible.',
      },
      {
        number: 4,
        title: 'Enrich flagged transactions with context',
        description: 'For each flagged transaction, gather the customer’s recent transaction history and account age.',
        code: `# enrich.py
def enrich_flagged(transaction, all_transactions, customers):
    customer_id = transaction["customer_id"]
    history = all_transactions[all_transactions["customer_id"] == customer_id].tail(10)
    customer = customers[customers["customer_id"] == customer_id].iloc[0]
    return {
        "transaction": transaction.to_dict(),
        "recent_history": history[["timestamp", "amount", "merchant"]].to_dict("records"),
        "account_age_days": customer["account_age_days"],
        "account_status": customer["status"],
    }`,
        tip: 'Account age is a strong contextual signal — fraud is disproportionately common on accounts less than 30 days old.',
      },
      {
        number: 5,
        title: 'Build the Claude investigator',
        description: 'Send the enriched flagged transaction to Claude and ask for a structured investigation with evidence-based reasoning.',
        code: `# investigate.py
from anthropic import Anthropic
import json

ai = Anthropic()

def investigate(enriched):
    prompt = f"""Investigate this flagged transaction for potential fraud.

Transaction: {enriched['transaction']}
Recent history (last 10 transactions): {enriched['recent_history']}
Account age: {enriched['account_age_days']} days, status: {enriched['account_status']}

Provide: risk_level (low/medium/high/critical), key_evidence (list of specific observations
from the data above), recommended_action (approve/hold_for_review/block), confidence (0-1).

Return JSON: {{"risk_level": "...", "key_evidence": ["..."], "recommended_action": "...", "confidence": 0.0}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=600,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)`,
        tip: 'Require key_evidence to cite specific data points — this makes the output auditable and prevents vague "this seems suspicious" reasoning.',
      },
      {
        number: 6,
        title: 'Implement confidence-based routing',
        description: 'Auto-block only high-confidence critical cases; route everything else to a human review queue.',
        code: `# routing.py
def route_case(investigation):
    if investigation["recommended_action"] == "block" and investigation["confidence"] >= 0.85:
        return "auto_block"
    if investigation["risk_level"] in ("medium", "high", "critical"):
        return "human_review"
    return "auto_approve"`,
        tip: 'Set the auto-block confidence threshold high (0.85+) initially — false positives that block legitimate customers are extremely costly to trust.',
      },
      {
        number: 7,
        title: 'Build the audit trail',
        description: 'Log every investigation with the model score, Claude’s reasoning, and the routing decision for compliance.',
        code: `# audit.py
import json
from datetime import datetime

def log_investigation(transaction_id, anomaly_score, investigation, routing_decision):
    entry = {
        "timestamp": datetime.utcnow().isoformat(), "transaction_id": transaction_id,
        "anomaly_score": float(anomaly_score), "investigation": investigation,
        "routing_decision": routing_decision,
    }
    with open("fraud_audit_log.jsonl", "a") as f:
        f.write(json.dumps(entry) + "\\n")`,
        tip: 'Most financial regulators require an explainable audit trail for any automated transaction-blocking decision — this log is that record.',
      },
      {
        number: 8,
        title: 'Build the human review queue UI',
        description: 'Build a simple Streamlit app showing queued cases with full context for an analyst to approve/block.',
        code: `# review_ui.py
import streamlit as st

st.title("Fraud Review Queue")
for case in load_review_queue():
    with st.expander(f"Transaction {case['transaction_id']} - Risk: {case['investigation']['risk_level']}"):
        st.json(case["investigation"])
        col1, col2 = st.columns(2)
        if col1.button("Approve", key=f"approve_{case['transaction_id']}"):
            resolve_case(case['transaction_id'], "approved")
        if col2.button("Block", key=f"block_{case['transaction_id']}"):
            resolve_case(case['transaction_id'], "blocked")`,
        tip: 'Show the full investigation JSON, not just the summary — analysts need the key_evidence list to make a fast, confident decision.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Fraud Detection & Investigation Agent (starter)
Run: pip install pandas scikit-learn anthropic
"""
import pandas as pd
import json
from sklearn.ensemble import IsolationForest
from anthropic import Anthropic

ai = Anthropic()

def detect_and_investigate(transactions_csv):
    df = pd.read_csv(transactions_csv, parse_dates=["timestamp"])
    df["amount_zscore"] = (df["amount"] - df["amount"].mean()) / df["amount"].std()

    model = IsolationForest(contamination=0.02, random_state=42)
    df["is_flagged"] = model.fit_predict(df[["amount_zscore"]]) == -1

    flagged = df[df["is_flagged"]]
    results = []
    for _, txn in flagged.iterrows():
        prompt = f"""Transaction: amount={txn['amount']}, z-score={txn['amount_zscore']:.2f}, merchant={txn['merchant']}.
Assess fraud risk (low/medium/high) and recommend action (approve/hold_for_review/block).
Return JSON: {{"risk_level":"...", "recommended_action":"..."}}"""
        resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=150,
            messages=[{"role": "user", "content": prompt}])
        results.append({"transaction_id": txn["transaction_id"], **json.loads(resp.content[0].text)})
    return results

if __name__ == "__main__":
    print(detect_and_investigate("transactions.csv"))
`,
    resources: [
      { title: 'scikit-learn IsolationForest', url: 'https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.IsolationForest.html' },
      { title: 'pandas Documentation', url: 'https://pandas.pydata.org/docs/' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 35,
    title: 'Multi-Step Negotiation Agent',
    emoji: '🤝',
    department: ['Sales'],
    departmentIds: ['sales'],
    difficulty: 'Advanced',
    description:
      'Negotiates pricing and contract terms over a multi-email back-and-forth, staying within configured limits while maximizing deal value.',
    whatYouBuild:
      'An email-based negotiation agent that monitors a deal inbox, classifies incoming counter-offers, evaluates them against a configured negotiation policy (price floors, acceptable terms, concession schedule), drafts responses that make calculated concessions or hold firm, escalates to a human when limits are reached or sentiment turns negative, and maintains a full negotiation history log per deal.',
    whatYouLearn: [
      'Define a structured negotiation policy (floors, ceilings, concession schedule)',
      'Classify incoming negotiation emails by intent and sentiment',
      'Generate counter-offer responses within policy constraints',
      'Implement a concession schedule that tightens over rounds',
      'Detect when to escalate a negotiation to a human',
      'Maintain a full audit log of a multi-round negotiation',
    ],
    techStack: ['Python', 'Claude API', 'Gmail API', 'HubSpot API'],
    buildTime: '7 hrs',
    xp: 920,
    popularity: 76,
    prerequisites: ['Completed CRM Lead Follow-Up Agent', 'Completed Sales Email Personalization Agent'],
    tags: ['sales', 'negotiation', 'email-automation', 'policy'],
    session: {
      totalTime: '150 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'A negotiation policy with price floors, targets, and a concession schedule that tightens over rounds',
        'A classifier that reads incoming negotiation emails for intent, proposed price, and sentiment',
        'Logic that computes the next offer, checks non-negotiable terms, and decides when to escalate',
        'A response generator and persisted negotiation state, wired into a draft-only inbox workflow',
      ],
      whatYouNeed: [
        'Python installed locally',
        'An Anthropic API key (console.anthropic.com)',
        'pip install anthropic',
        'Gmail API access for drafting emails, and a place to persist deal state (HubSpot custom object or small DB)',
      ],
      builds: [
        {
          number: 1,
          title: 'Define the negotiation policy and offer logic',
          time: '35 min',
          description: 'Set the boundaries the agent can never cross, and the math for how it concedes over rounds.',
          steps: [
            {
              instruction: 'Ask Claude to write policy.py with a NEGOTIATION_POLICY dict, and concession.py with a compute_next_offer function.',
              prompt: 'Write two Python files for a negotiation agent.\n\n1) policy.py defining NEGOTIATION_POLICY = {\n  "list_price": 10000,\n  "target_price": 9000,\n  "floor_price": 7500,\n  "max_rounds": 4,\n  "concession_schedule": [0.5, 0.7, 0.9, 1.0],\n  "non_negotiable_terms": ["payment must be net-30 or shorter", "no perpetual license"]\n}\n\nAdd a comment explaining that concession_schedule is the fraction of the remaining gap (to the floor) conceded each round, and that increasing it toward 1.0 naturally signals "we are reaching our limit" as the negotiation progresses.\n\n2) concession.py with compute_next_offer(policy, round_number, current_offer, counter_price) that:\n- Returns counter_price directly if counter_price >= policy["floor_price"] (accept if they meet our floor)\n- Otherwise computes gap = current_offer - max(counter_price, policy["floor_price"])\n- Looks up concession_pct from policy["concession_schedule"] using min(round_number, len-1)\n- Computes next_offer = current_offer - gap * concession_pct, rounds to nearest 100, and clamps to never go below policy["floor_price"]\n\nAdd a comment that the final max(..., floor_price) clamp is essential — arithmetic alone cannot guarantee the agent never crosses the hard limit.',
              verify: 'Call compute_next_offer() across all 4 rounds with a counter_price below the floor and confirm offers decrease toward but never below floor_price. Confirm passing a counter_price >= floor_price returns it directly (auto-accept).',
            },
          ],
          goFurther: 'Make the concession schedule deal-size-aware — larger deals get a slower (more conservative) schedule than smaller ones. 🛠️🛠️',
        },
        {
          number: 2,
          title: 'Classify incoming emails and check non-negotiable terms',
          time: '35 min',
          description: 'Read every reply for intent, price, and sentiment, and screen proposed term changes against your hard limits.',
          steps: [
            {
              instruction: 'Ask Claude to write classify.py with a classify_negotiation_email function, and terms_check.py with a check_terms function.',
              prompt: 'Write two Python files for a negotiation agent using the anthropic Python SDK.\n\n1) classify.py with classify_negotiation_email(email_text) that sends the email to Claude (claude-sonnet-4-5, max_tokens=300) asking it to:\n- Classify intent: counter_offer / acceptance / rejection / question / other\n- Extract any proposed price as a number or null\n- Extract any proposed terms changes as a list\n- Rate sentiment: positive / neutral / negative\nRequest JSON: {"intent": "...", "proposed_price": null, "proposed_terms": [], "sentiment": "..."}\nParse and return the JSON.\n\nAdd a comment that sentiment is an early-warning signal — a shift from neutral to negative is often the strongest cue to escalate, even before price terms get extreme.\n\n2) terms_check.py with check_terms(proposed_terms, non_negotiable) that sends both lists to Claude (max_tokens=200) asking whether any proposed change violates a non-negotiable term, requesting JSON: {"violations": ["..."], "ok_to_proceed": true/false}. Parse and return the JSON.\n\nAdd a comment that term violations should always escalate to a human regardless of price — pricing concessions are reversible, but contract term precedents often aren\'t.',
              verify: 'Run classify_negotiation_email() on a sample counter-offer email and confirm it extracts a price and a sentiment. Run check_terms() with a proposed term that conflicts with a non-negotiable term and confirm ok_to_proceed is false with a populated violations list.',
            },
          ],
          goFurther: 'Add a "patience score" derived from sentiment trend across the whole history, not just the latest message, to make escalation decisions more robust to one-off tone. 🛠️🛠️',
        },
        {
          number: 3,
          title: 'Build escalation logic, response generator, and deal state',
          time: '40 min',
          description: 'Decide when a human needs to step in, draft the counter-offer email, and persist where each deal stands.',
          steps: [
            {
              instruction: 'Ask Claude to write escalate.py with should_escalate, respond.py with write_negotiation_email, and state.py with update_deal_state.',
              prompt: 'Write three Python files for a negotiation agent.\n\n1) escalate.py with should_escalate(state, classification, terms_check) that returns a (bool, reason) tuple, escalating to a human if:\n- terms_check["ok_to_proceed"] is False -> "Non-negotiable term violated"\n- classification["proposed_price"] is set and below state["policy"]["floor_price"] -> "Counter-offer below floor price"\n- state["consecutive_negative_sentiment"] >= 2 -> "Two consecutive negative-sentiment messages"\n- state["round_number"] >= state["policy"]["max_rounds"] -> "Max negotiation rounds reached"\n- Otherwise returns (False, None)\n\nAdd a comment that consecutive_negative_sentiment should be tracked as running per-deal state — one frustrated email is normal, two in a row is a pattern worth a human\'s attention.\n\n2) respond.py using the anthropic Python SDK with write_negotiation_email(classification, next_offer, round_number, max_rounds) that:\n- Sets framing = "final offer" if round_number >= max_rounds - 1 else "good-faith counter"\n- Sends Claude (claude-sonnet-4-5, max_tokens=300) the proposed price, sentiment, our next_offer, and framing, asking it to write a brief professional email — acknowledging the prospect\'s concern first if sentiment was negative, and stating clearly but respectfully if it\'s a final offer\n- Returns the email text\n\n3) state.py with update_deal_state(deal_id, classification, next_offer, escalated) that loads state via load_state(deal_id) (assume it exists), increments round_number, appends {"from_prospect": classification, "our_offer": next_offer} to state["history"], updates consecutive_negative_sentiment (increment if sentiment is "negative", else reset to 0), sets status to "escalated" or "in_progress", saves via save_state(deal_id, state), and returns state.\n\nAdd a comment that persisting state to a CRM custom object or small database matters — losing state mid-negotiation forces an awkward restart.',
              verify: 'Run should_escalate() with each of the four trigger conditions and confirm each returns True with the right reason. Generate an email with write_negotiation_email() for a "final offer" framing and confirm the tone is firm but respectful.',
            },
          ],
          goFurther: 'Have escalate.py also draft a recommended response for the human rep to use as a starting point, rather than leaving them to start from scratch. 🛠️🛠️',
        },
        {
          number: 4,
          title: 'Wire up the inbox monitor end-to-end',
          time: '40 min',
          description: 'Connect every piece into a single pipeline that processes each reply and drafts (never sends) the next email.',
          steps: [
            {
              instruction: 'Ask Claude to write main.py that chains classification, term checks, escalation, offer computation, response drafting, and state updates.',
              prompt: 'Write main.py for a negotiation agent that defines process_negotiation_email(deal_id, email_text):\n1. Load the current deal state via load_state(deal_id)\n2. Classify the email with classify_negotiation_email(email_text)\n3. Check terms with check_terms(classification["proposed_terms"], state["policy"]["non_negotiable_terms"])\n4. Call should_escalate(state, classification, terms_check)\n5. If escalating: call notify_human_rep(deal_id, reason, classification) (assume it exists — e.g. Slack message), call update_deal_state(deal_id, classification, None, escalated=True), and return\n6. Otherwise: compute the next offer with compute_next_offer(), draft the email with write_negotiation_email(), save it as a Gmail draft via save_gmail_draft(deal_id, email_draft) (assume it exists), and call update_deal_state(deal_id, classification, next_offer, escalated=False)\n\nAdd a comment that the agent ALWAYS saves drafts for human approval — never auto-sends — because pricing emails are the highest-stakes output this agent produces, and that this should remain true even after the agent has a long track record of good drafts.',
              verify: 'Run process_negotiation_email() with a sample email through several rounds in a row and confirm: round_number increments correctly, the email is saved as a Gmail draft (never sent), and an escalation triggers notify_human_rep() instead of drafting when the floor price is breached.',
            },
          ],
          goFurther: 'Add a weekly digest summarizing all in-progress negotiations — current round, latest offer, days since last reply — so sales leadership can spot stalled deals. 🛠️',
        },
      ],
      portfolio: 'Add this to your portfolio as "AI Multi-Step Negotiation Agent" — a strong showcase for sales ops, revenue operations, or AI agent design roles. Show the policy config, a sample multi-round negotiation transcript with computed offers, and the escalation triggers in action.',
      portfolioPrompt: 'Help me write a portfolio entry and a LinkedIn post for a project I just built: an AI Multi-Step Negotiation Agent. It monitors a sales deal inbox, classifies incoming counter-offer emails for intent, proposed price, and sentiment, and computes the next counter-offer using a concession schedule that tightens over rounds while never crossing a configured price floor. It checks proposed contract term changes against a non-negotiable list, escalates to a human rep when limits are reached, sentiment turns negative repeatedly, or rounds run out, and drafts (but never auto-sends) each response email while maintaining a full per-deal negotiation history log. Write:\n1. A 3-4 sentence portfolio project description emphasizing policy-bounded automation with human-in-the-loop safety\n2. A LinkedIn post (under 150 words) for a sales operations / revenue operations audience\n3. Two resume bullet points quantifying rep time saved and deal velocity improvements',
    },
    steps: [
      {
        number: 1,
        title: 'Define the negotiation policy',
        description: 'Configure price floors, target prices, and a concession schedule per deal.',
        code: `# policy.py
NEGOTIATION_POLICY = {
    "list_price": 10000,
    "target_price": 9000,
    "floor_price": 7500,
    "max_rounds": 4,
    "concession_schedule": [0.5, 0.7, 0.9, 1.0],  # fraction of remaining gap to concede each round
    "non_negotiable_terms": ["payment must be net-30 or shorter", "no perpetual license"],
}`,
        tip: 'A concession schedule that increases each round (0.5 → 1.0) signals "we are reaching our limit" naturally through the negotiation’s pacing, mirroring real human negotiators.',
      },
      {
        number: 2,
        title: 'Build the email classifier',
        description: 'Classify incoming negotiation emails by intent (counter-offer, acceptance, rejection, question) and extract any proposed price/terms.',
        code: `# classify.py
from anthropic import Anthropic
import json

ai = Anthropic()

def classify_negotiation_email(email_text):
    prompt = f"""Email from a prospect during a price negotiation:
{email_text}

Classify intent (counter_offer / acceptance / rejection / question / other),
extract any proposed price (number or null), extract any proposed terms changes,
and rate sentiment (positive/neutral/negative).

Return JSON: {{"intent": "...", "proposed_price": null, "proposed_terms": [], "sentiment": "..."}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=300,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)`,
        tip: 'Sentiment classification is your early-warning system — a shift from neutral to negative is often the strongest signal to escalate.',
      },
      {
        number: 3,
        title: 'Compute the next offer',
        description: 'Apply the concession schedule to calculate the next price offer based on the round number and the gap to the floor.',
        code: `# concession.py
def compute_next_offer(policy, round_number, current_offer, counter_price):
    if counter_price >= policy["floor_price"]:
        return counter_price  # accept if they meet our floor

    gap = current_offer - max(counter_price, policy["floor_price"])
    concession_pct = policy["concession_schedule"][min(round_number, len(policy["concession_schedule"]) - 1)]
    next_offer = current_offer - gap * concession_pct
    return max(round(next_offer, -2), policy["floor_price"])  # round to nearest 100`,
        tip: 'Always clamp the result with max(..., policy["floor_price"]) — arithmetic alone can’t guarantee the agent never goes below your hard limit.',
      },
      {
        number: 4,
        title: 'Check non-negotiable terms',
        description: 'Scan proposed terms changes against the non-negotiable list and flag violations.',
        code: `# terms_check.py
def check_terms(proposed_terms, non_negotiable):
    prompt = f"""Proposed term changes: {proposed_terms}
Our non-negotiable terms: {non_negotiable}

Does any proposed change violate a non-negotiable term? Return JSON:
{{"violations": ["..."], "ok_to_proceed": true/false}}"""
    import json
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=200,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)`,
        tip: 'Term violations should always escalate to a human regardless of price — pricing concessions are reversible, contract term precedents often aren’t.',
      },
      {
        number: 5,
        title: 'Build the response generator',
        description: 'Draft an email response presenting the next offer with appropriate framing (firm, flexible, or final).',
        code: `# respond.py
def write_negotiation_email(classification, next_offer, round_number, max_rounds):
    framing = "final offer" if round_number >= max_rounds - 1 else "good-faith counter"
    prompt = f"""The prospect proposed \${classification['proposed_price']}. Sentiment: {classification['sentiment']}.
We're countering at \${next_offer} as a {framing}.

Write a brief, professional email presenting this offer. If it's a final offer, say so respectfully
but firmly. If sentiment was negative, acknowledge their concern first."""
    return ai.messages.create(model="claude-sonnet-4-5", max_tokens=300,
        messages=[{"role": "user", "content": prompt}]).content[0].text`,
        tip: 'Acknowledging negative sentiment before presenting numbers measurably reduces the chance of the prospect walking away.',
      },
      {
        number: 6,
        title: 'Implement escalation triggers',
        description: 'Escalate to a human sales rep when the floor is reached, terms are violated, sentiment is negative twice in a row, or max rounds exceeded.',
        code: `# escalate.py
def should_escalate(state, classification, terms_check):
    if not terms_check["ok_to_proceed"]:
        return True, "Non-negotiable term violated"
    if classification["proposed_price"] and classification["proposed_price"] < state["policy"]["floor_price"]:
        return True, "Counter-offer below floor price"
    if state["consecutive_negative_sentiment"] >= 2:
        return True, "Two consecutive negative-sentiment messages"
    if state["round_number"] >= state["policy"]["max_rounds"]:
        return True, "Max negotiation rounds reached"
    return False, None`,
        tip: 'Track consecutive_negative_sentiment as running state per deal — a single frustrated email is normal, two in a row is a pattern.',
      },
      {
        number: 7,
        title: 'Build the deal state machine',
        description: 'Track each deal’s negotiation state (round, current offer, history) persisted to your CRM.',
        code: `# state.py
def update_deal_state(deal_id, classification, next_offer, escalated):
    state = load_state(deal_id)
    state["round_number"] += 1
    state["history"].append({"from_prospect": classification, "our_offer": next_offer})
    if classification["sentiment"] == "negative":
        state["consecutive_negative_sentiment"] += 1
    else:
        state["consecutive_negative_sentiment"] = 0
    state["status"] = "escalated" if escalated else "in_progress"
    save_state(deal_id, state)
    return state`,
        tip: 'Persist negotiation state to a HubSpot custom object or a small database — losing state mid-negotiation forces an awkward restart.',
      },
      {
        number: 8,
        title: 'Wire it together with the inbox monitor',
        description: 'Poll the deal inbox, run the full pipeline for each new reply, and either send the response or escalate.',
        code: `# main.py
def process_negotiation_email(deal_id, email_text):
    state = load_state(deal_id)
    classification = classify_negotiation_email(email_text)
    terms_check = check_terms(classification["proposed_terms"], state["policy"]["non_negotiable_terms"])
    escalate, reason = should_escalate(state, classification, terms_check)

    if escalate:
        notify_human_rep(deal_id, reason, classification)
        update_deal_state(deal_id, classification, None, escalated=True)
        return

    next_offer = compute_next_offer(state["policy"], state["round_number"], state["current_offer"], classification["proposed_price"])
    email_draft = write_negotiation_email(classification, next_offer, state["round_number"], state["policy"]["max_rounds"])
    save_gmail_draft(deal_id, email_draft)  # human approves before sending
    update_deal_state(deal_id, classification, next_offer, escalated=False)`,
        tip: 'Always save as a draft for human approval, even after dozens of successful runs — pricing emails are the highest-stakes output this agent produces.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Multi-Step Negotiation Agent (starter)
Run: pip install anthropic
"""
import json
from anthropic import Anthropic

ai = Anthropic()
POLICY = {"list_price": 10000, "target_price": 9000, "floor_price": 7500,
          "max_rounds": 4, "concession_schedule": [0.5, 0.7, 0.9, 1.0]}

def classify(email_text):
    prompt = f"""Email: {email_text}
Classify intent (counter_offer/acceptance/rejection/question), extract proposed price (or null),
and sentiment (positive/neutral/negative).
Return JSON: {{"intent":"...", "proposed_price": null, "sentiment":"..."}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=200,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)

def next_offer(round_number, current_offer, counter_price):
    if counter_price and counter_price >= POLICY["floor_price"]:
        return counter_price
    gap = current_offer - POLICY["floor_price"]
    pct = POLICY["concession_schedule"][min(round_number, 3)]
    return max(round(current_offer - gap * pct, -2), POLICY["floor_price"])

if __name__ == "__main__":
    c = classify("Thanks for the proposal, but $7000 is more our budget.")
    print(c, "-> next offer:", next_offer(0, POLICY["target_price"], c["proposed_price"]))
`,
    resources: [
      { title: 'Gmail API Drafts', url: 'https://developers.google.com/gmail/api/guides/drafts' },
      { title: 'HubSpot Custom Objects', url: 'https://developers.hubspot.com/docs/api/crm/crm-custom-objects' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
  {
    id: 36,
    title: 'Autonomous QA Testing Agent',
    emoji: '🧪',
    department: ['Engineering'],
    departmentIds: ['engineering'],
    difficulty: 'Advanced',
    description:
      'Explores a web app like a real user, generates test cases from user stories, runs them with Playwright, and files detailed bug reports for failures.',
    whatYouBuild:
      'A QA agent that takes user stories as input, asks Claude to generate concrete test cases (steps + expected results), translates each test case into a Playwright script, runs the scripts against your staging environment, captures screenshots and console logs on failure, and uses Claude to write a structured bug report with reproduction steps for each failure.',
    whatYouLearn: [
      'Generate test cases from user stories with an LLM',
      'Translate natural-language test steps into Playwright automation scripts',
      'Run browser automation and capture failure artifacts (screenshots, logs, DOM state)',
      'Use Claude to triage failures and distinguish real bugs from flaky tests',
      'Generate structured bug reports with reproduction steps',
      'Build a regression suite that grows over time',
    ],
    techStack: ['Python', 'Playwright', 'Claude API', 'GitHub API'],
    buildTime: '7.5 hrs',
    xp: 950,
    popularity: 84,
    prerequisites: ['Completed Code Review Agent', 'Basic Playwright/Selenium familiarity', 'Staging environment with test data'],
    tags: ['qa', 'testing', 'playwright', 'automation'],
    session: {
      totalTime: '170 min',
      buildCount: 4,
      model: 'Claude Sonnet 4.5',
      outcomes: [
        'A pipeline that expands user stories into concrete test cases covering edge cases, not just the happy path',
        'Generated Playwright scripts that run against staging using a maintained selector map',
        'Failure capture (screenshots, console logs, DOM) plus Claude-based triage to separate real bugs from flaky tests and stale selectors',
        'Auto-filed GitHub bug reports and a growing regression suite that runs on every deploy',
      ],
      whatYouNeed: [
        'Python installed locally',
        'An Anthropic API key (console.anthropic.com)',
        'pip install playwright anthropic && playwright install chromium',
        'A staging environment with test data, and a GitHub token with issue-creation permission',
      ],
      builds: [
        {
          number: 1,
          title: 'Generate test cases and translate them into Playwright scripts',
          time: '45 min',
          description: 'Turn a plain-English user story into concrete test cases, then into runnable browser automation.',
          steps: [
            {
              instruction: 'Ask Claude to write generate_cases.py with a generate_test_cases function, and generate_script.py with a generate_playwright_script function.',
              prompt: 'Write two Python files for a QA testing agent using the anthropic Python SDK.\n\n1) generate_cases.py with generate_test_cases(user_story) that sends Claude (claude-sonnet-4-5, max_tokens=1200) the user story and asks it to generate 4-6 test cases covering the happy path AND important edge cases (empty inputs, invalid data, boundary values, permission errors). Request JSON: {"test_cases": [{"name": "...", "steps": ["..."], "expected_result": "..."}]}. Parse and return the test_cases list.\n\nAdd a comment that you must explicitly ask for edge cases — left to defaults, an LLM (like most humans) over-indexes on the happy path.\n\n2) generate_script.py with generate_playwright_script(test_case, base_url, selector_map) that sends Claude (max_tokens=800) the test case, base_url, and selector_map (a dict of known element selectors), asking it to generate a Playwright Python script (sync API) defining a function test_case(page) that performs the steps and asserts the expected result. Return ONLY the function code as a string.\n\nAdd a comment that selector_map should be maintained as a living dict (e.g. {"login_button": "#login-btn"}) — generated scripts are far more reliable when given real selectors instead of guessing from the DOM.',
              verify: 'Run generate_test_cases() on a sample user story and confirm it returns at least one edge-case test alongside the happy path. Run generate_playwright_script() on one of those cases and confirm it returns a valid test_case(page) function definition.',
            },
          ],
          goFurther: 'Have generate_test_cases() also tag each case with a priority (P0/P1/P2) so the runner can execute P0 tests first and fail fast. 🛠️',
        },
        {
          number: 2,
          title: 'Run scripts in Playwright and capture failure artifacts',
          time: '40 min',
          description: 'Execute generated scripts against staging, and on failure, capture everything needed to diagnose it.',
          steps: [
            {
              instruction: 'Ask Claude to write run_tests.py with a run_test function, and capture.py with a capture_failure function.',
              prompt: 'Write two Python files for a QA testing agent using playwright.sync_api.\n\n1) run_tests.py with run_test(script_code, base_url) that:\n- Executes script_code via exec() into a namespace dict and pulls out the test_case function\n- Launches a Chromium browser (headless), opens a new page, navigates to base_url\n- Calls test_case(page) inside a try/except\n- On success returns {"status": "passed"}\n- On exception returns {"status": "failed", "error": str(e), "screenshot": capture_failure(page)}\n- Closes the browser in a finally block\n\nAdd a comment that headless=True should be used in CI, but headless=False is useful locally while debugging generated scripts.\n\n2) capture.py with capture_failure(page) that:\n- Generates a unique screenshot path under failures/ using uuid\n- Calls page.screenshot(path=..., full_page=True)\n- Reads console logs via page.evaluate("() => window.__consoleLogs || []")\n- Reads the first 5000 characters of page.content() as a DOM snippet\n- Returns {"screenshot": screenshot_path, "console_logs": console_logs, "dom_snippet": dom_snippet}\n\nAdd a comment that you must inject a small script at page load that pushes console messages into window.__consoleLogs, because Playwright cannot retroactively read console history after a failure.',
              verify: 'Run run_test() with a script that intentionally fails (e.g. asserts on a non-existent element) and confirm it returns status "failed" with a screenshot path, console logs, and a DOM snippet populated.',
            },
          ],
          goFurther: 'Add a retry-once mechanism for failed tests before capturing artifacts, to filter out one-off network blips before they reach triage. 🛠️🛠️',
        },
        {
          number: 3,
          title: 'Triage failures and generate bug reports with Claude',
          time: '40 min',
          description: 'Classify each failure as a real bug, flaky test, or stale selector, and write up real bugs as structured reports.',
          steps: [
            {
              instruction: 'Ask Claude to write triage.py with a triage_failure function, and bug_report.py with a generate_bug_report function.',
              prompt: 'Write two Python files for a QA testing agent using the anthropic Python SDK.\n\n1) triage.py with triage_failure(test_case, error, dom_snippet) that sends Claude (claude-sonnet-4-5, max_tokens=300) the test case, error message, and a truncated DOM snippet, asking it to classify the failure as one of: real_bug, flaky_test, or stale_selector (the script\'s selector no longer matches the current UI). Request JSON: {"classification": "...", "reasoning": "..."}. Parse and return the JSON.\n\nAdd a comment that stale selectors are extremely common after UI redesigns, and should route to "update test script" rather than "file bug" to avoid noisy false reports.\n\n2) bug_report.py with generate_bug_report(test_case, error, screenshot_path) that sends Claude (max_tokens=400) the test case and error, asking it to write a bug report. Request JSON: {"title": "...", "severity": "low/medium/high/critical", "repro_steps": ["..."], "expected": "...", "actual": "..."}. Parse and return the JSON.\n\nAdd a comment that severity classification from an LLM is a starting point, not a final verdict — a QA lead should re-triage severity during sprint planning.',
              verify: 'Run triage_failure() on a failure caused by a renamed CSS class and confirm it classifies as stale_selector with reasoning that references the selector. Run generate_bug_report() on a real_bug failure and confirm all five JSON fields are populated with specific repro steps.',
            },
          ],
          goFurther: 'Feed triage_failure() the git diff of recent UI changes (if available) — recent changes to the failing element are strong evidence for stale_selector over real_bug. 🛠️🛠️',
        },
        {
          number: 4,
          title: 'File GitHub issues and grow the regression suite',
          time: '45 min',
          description: 'Auto-file real bugs as labeled GitHub issues, and save passing scripts into a suite that runs on every deploy.',
          steps: [
            {
              instruction: 'Ask Claude to write file_issue.py with a file_bug_issue function, regression.py with a save_to_regression_suite function, and main.py tying the whole pipeline together.',
              prompt: 'Write two Python files and a main.py for a QA testing agent.\n\n1) file_issue.py using requests with file_bug_issue(repo, bug_report, screenshot_path, token) that builds a markdown issue body from bug_report (severity, numbered repro_steps, expected, actual) and POSTs to https://api.github.com/repos/{repo}/issues with the Authorization header set to "Bearer {token}", title=bug_report["title"], the body, and labels=[f"severity:{{bug_report[\'severity\']}}", "auto-filed"].\n\nAdd a comment that labeling auto-filed issues distinctly (e.g. "auto-filed") lets the team quickly filter and review the AI-generated batch separately from human-filed issues.\n\n2) regression.py with save_to_regression_suite(test_case_name, script_code, suite_dir="regression_suite") that creates suite_dir if needed and writes script_code to a file named test_<slugified test_case_name>.py inside it.\n\nAdd a comment that the regression_suite/ directory should be run with pytest on every CI deploy to catch regressions in previously-passing flows, and ideally re-run weekly even without code changes since UI changes elsewhere can silently break selectors.\n\n3) main.py that chains: generate_test_cases(user_story) -> for each test case, generate_playwright_script() -> run_test() -> if passed, save_to_regression_suite(); if failed, triage_failure() -> if real_bug, generate_bug_report() + file_bug_issue(), else log the classification for review. Print a summary of pass/fail/filed counts at the end.',
              verify: 'Run main.py against a sample user story and staging URL, then confirm: passing tests appear as files in regression_suite/, real-bug failures create a GitHub issue labeled "auto-filed" with the correct severity label, and stale_selector/flaky_test failures are logged but not filed as issues.',
            },
          ],
          goFurther: 'Add a dashboard that tracks regression suite size and pass rate over time, so the team can see test coverage growing alongside the codebase. 🛠️🛠️',
        },
      ],
      portfolio: 'Add this to your portfolio as "AI Autonomous QA Testing Agent" — a standout project for QA automation, SDET, or AI tooling roles. Show a generated test case set, a Playwright script it produced, a failure triage result, and an auto-filed GitHub issue.',
      portfolioPrompt: 'Help me write a portfolio entry and a LinkedIn post for a project I just built: an AI Autonomous QA Testing Agent. It takes plain-English user stories and asks Claude to generate concrete test cases covering both the happy path and edge cases, translates each into a runnable Playwright script using a maintained selector map, and runs them against a staging environment. On failure it captures screenshots, console logs, and DOM snapshots, then has Claude triage the failure as a real bug, a flaky test, or a stale selector. Real bugs get auto-filed as labeled GitHub issues with structured repro steps and severity, while passing tests are saved into a growing regression suite that runs on every deploy. Write:\n1. A 3-4 sentence portfolio project description emphasizing end-to-end automated QA with human-reviewable triage\n2. A LinkedIn post (under 150 words) for a QA/SDET or engineering audience\n3. Two resume bullet points quantifying test coverage growth and QA time saved',
    },
    steps: [
      {
        number: 1,
        title: 'Generate test cases from user stories',
        description: 'Ask Claude to expand a user story into a set of concrete test cases covering happy path and edge cases.',
        code: `# generate_cases.py
from anthropic import Anthropic
import json

ai = Anthropic()

def generate_test_cases(user_story):
    prompt = f"""User story: {user_story}

Generate 4-6 test cases covering the happy path and important edge cases (empty inputs,
invalid data, boundary values, permission errors).

Return JSON: {{"test_cases": [{{"name": "...", "steps": ["..."], "expected_result": "..."}}]}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=1200,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)["test_cases"]`,
        tip: 'Explicitly ask for edge cases — left to defaults, Claude (like most humans) over-indexes on the happy path.',
      },
      {
        number: 2,
        title: 'Translate test cases into Playwright scripts',
        description: 'For each test case, ask Claude to generate a runnable Playwright Python script using your app’s known selectors.',
        code: `# generate_script.py
def generate_playwright_script(test_case, base_url, selector_map):
    prompt = f"""Generate a Playwright Python script (sync API) for this test case.

Test case: {test_case}
Base URL: {base_url}
Known element selectors: {selector_map}

The script should be a function test_case(page) that takes a Playwright Page object,
performs the steps, and asserts the expected result. Return ONLY the function code."""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=800,
        messages=[{"role": "user", "content": prompt}])
    return resp.content[0].text`,
        tip: 'Maintain selector_map as a living dict (e.g. {"login_button": "#login-btn"}) — generated scripts are far more reliable when given real selectors instead of guessing.',
      },
      {
        number: 3,
        title: 'Run scripts in a Playwright sandbox',
        description: 'Execute each generated script against staging, capturing pass/fail and any exceptions.',
        code: `# run_tests.py
from playwright.sync_api import sync_playwright

def run_test(script_code, base_url):
    namespace = {}
    exec(script_code, namespace)
    test_fn = namespace["test_case"]

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(base_url)
        try:
            test_fn(page)
            result = {"status": "passed"}
        except Exception as e:
            result = {"status": "failed", "error": str(e), "screenshot": capture_failure(page)}
        finally:
            browser.close()
    return result`,
        tip: 'Run tests with browser.launch(headless=True) in CI but headless=False locally while debugging generated scripts.',
      },
      {
        number: 4,
        title: 'Capture failure artifacts',
        description: 'On failure, capture a screenshot, the console log, and a snippet of the relevant DOM.',
        code: `# capture.py
import uuid

def capture_failure(page):
    screenshot_path = f"failures/{uuid.uuid4()}.png"
    page.screenshot(path=screenshot_path, full_page=True)
    console_logs = page.evaluate("() => window.__consoleLogs || []")
    dom_snippet = page.content()[:5000]
    return {"screenshot": screenshot_path, "console_logs": console_logs, "dom_snippet": dom_snippet}`,
        tip: 'Inject a small script at page load that pushes console messages into window.__consoleLogs — Playwright can’t retroactively read console history.',
      },
      {
        number: 5,
        title: 'Triage failures with Claude',
        description: 'Send failure details to Claude and ask it to classify the failure as a real bug, a flaky test, or a stale selector.',
        code: `# triage.py
def triage_failure(test_case, error, dom_snippet):
    prompt = f"""Test case: {test_case}
Error: {error}
Page DOM at time of failure (truncated): {dom_snippet}

Classify this failure: real_bug, flaky_test, or stale_selector (the test script's
selector no longer matches the current UI).
Return JSON: {{"classification": "...", "reasoning": "..."}}"""
    import json
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=300,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)`,
        tip: 'Stale selectors are extremely common after UI redesigns — route these to "update test script" rather than "file bug" to avoid noisy false reports.',
      },
      {
        number: 6,
        title: 'Generate the bug report',
        description: 'For real bugs, ask Claude to write a structured bug report with title, repro steps, expected vs. actual, and severity.',
        code: `# bug_report.py
def generate_bug_report(test_case, error, screenshot_path):
    prompt = f"""Write a bug report for this test failure.

Test case: {test_case}
Error: {error}

Return JSON: {{"title": "...", "severity": "low/medium/high/critical",
"repro_steps": ["..."], "expected": "...", "actual": "..."}}"""
    import json
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=400,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)`,
        tip: 'Severity classification from an LLM is a starting point, not a final verdict — let your QA lead re-triage severity during sprint planning.',
      },
      {
        number: 7,
        title: 'File issues in GitHub',
        description: 'Open a GitHub issue for each real bug, attaching the screenshot and labeling by severity.',
        code: `# file_issue.py
import requests

def file_bug_issue(repo, bug_report, screenshot_path, token):
    body = (f"**Severity:** {bug_report['severity']}\\n\\n**Steps to reproduce:**\\n" +
            "\\n".join(f"{i+1}. {s}" for i, s in enumerate(bug_report["repro_steps"])) +
            f"\\n\\n**Expected:** {bug_report['expected']}\\n**Actual:** {bug_report['actual']}")
    requests.post(f"https://api.github.com/repos/{repo}/issues",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": bug_report["title"], "body": body, "labels": [f"severity:{bug_report['severity']}", "auto-filed"]})`,
        tip: 'Label auto-filed issues distinctly (e.g. "auto-filed") so your team can quickly filter and review the AI-generated batch separately.',
      },
      {
        number: 8,
        title: 'Build the growing regression suite',
        description: 'Save passing generated scripts into a regression suite directory that runs on every deploy.',
        code: `# regression.py
import os

def save_to_regression_suite(test_case_name, script_code, suite_dir="regression_suite"):
    os.makedirs(suite_dir, exist_ok=True)
    filename = os.path.join(suite_dir, f"test_{test_case_name.lower().replace(' ', '_')}.py")
    with open(filename, "w") as f:
        f.write(script_code)

# Run the full regression_suite/ directory with pytest on every CI deploy
# to catch regressions in previously-passing flows.`,
        tip: 'Re-run the full regression suite weekly even without code changes — UI changes elsewhere can silently break selectors.',
      },
    ],
    starterCode: `"""
AgentForge Academy — Autonomous QA Testing Agent (starter)
Run: pip install playwright anthropic && playwright install chromium
"""
import json
from anthropic import Anthropic
from playwright.sync_api import sync_playwright

ai = Anthropic()

def generate_test_cases(user_story):
    prompt = f"""User story: {user_story}
Generate 3 test cases (happy path + 2 edge cases).
Return JSON: {{"test_cases": [{{"name":"...", "steps":["..."], "expected_result":"..."}}]}}"""
    resp = ai.messages.create(model="claude-sonnet-4-5", max_tokens=600,
        messages=[{"role": "user", "content": prompt}])
    return json.loads(resp.content[0].text)["test_cases"]

def check_page_loads(base_url):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(base_url)
        title = page.title()
        browser.close()
        return title

if __name__ == "__main__":
    cases = generate_test_cases("As a user, I can log in with my email and password.")
    print(cases)
    print("Page title:", check_page_loads("https://example.com"))
`,
    resources: [
      { title: 'Playwright Python Docs', url: 'https://playwright.dev/python/' },
      { title: 'GitHub Issues API', url: 'https://docs.github.com/en/rest/issues' },
      { title: 'Anthropic Claude API Docs', url: 'https://docs.anthropic.com' },
    ],
  },
];
