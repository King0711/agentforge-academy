insert into public.vibecoding_content (class_number, title, topics, session, assignment, challenge_features)
values (
  4,
  'Building an Expense Tracker',
  $topics$["Forms and input validation", "Working with structured data", "Introduction to localStorage"]$topics$::jsonb,
  $sess${
  "sections": [
    {
      "heading": "localStorage",
      "body": "Students are introduced to localStorage, allowing their application to remember information in the browser."
    }
  ],
  "project": {
    "name": "Personal Expense Tracker",
    "description": "Students build an application that allows users to track spending.",
    "features": ["Add expenses", "Enter amount", "Select category", "Select date", "Display expenses", "Delete expenses", "Calculate totals"],
    "concepts": ["Forms", "Input validation", "Application logic", "Data", "Local storage"]
  }
}$sess$::jsonb,
  null,
  $cf$["Income tracking", "Monthly budget", "Savings goals", "Expense categories", "Spending summaries"]$cf$::jsonb
)
on conflict (class_number) do update set
  title = excluded.title,
  topics = excluded.topics,
  session = excluded.session,
  assignment = excluded.assignment,
  challenge_features = excluded.challenge_features,
  updated_at = now();
