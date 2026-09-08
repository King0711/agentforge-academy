insert into public.vibecoding_content (class_number, title, topics, session, assignment, challenge_features)
values (
  5,
  'Databases, Backends & Supabase',
  $topics$["Frontend", "Backend", "Database", "API", "CRUD", "Tables", "Rows", "Columns", "Records"]$topics$::jsonb,
  $sess${
  "sections": [
    {
      "heading": "Simple Analogy — Think of a Restaurant",
      "items": [
        "Frontend = Dining Area — what the customer sees",
        "Backend = Kitchen — where work happens behind the scenes",
        "Database = Storage — where information is stored",
        "API = Waiter — carries requests and information between systems"
      ]
    },
    {
      "heading": "Supabase",
      "body": "Students learn how to: create a Supabase project, create a database table, create columns, add records, read records, understand database relationships, and connect an application to Supabase."
    },
    {
      "heading": "Practical Exercise",
      "body": "Students design a database for a Student Management System, identifying: student information, courses, status, contact information, and other relevant fields."
    }
  ]
}$sess$::jsonb,
  null,
  null
)
on conflict (class_number) do update set
  title = excluded.title,
  topics = excluded.topics,
  session = excluded.session,
  assignment = excluded.assignment,
  challenge_features = excluded.challenge_features,
  updated_at = now();
