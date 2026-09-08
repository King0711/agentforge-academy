insert into public.vibecoding_content (class_number, title, topics, session, assignment, challenge_features)
values (
  6,
  'Building a Student Management System',
  $topics$["Database integration", "CRUD operations", "Supabase", "Forms", "Data retrieval", "Data manipulation", "Application structure"]$topics$::jsonb,
  $sess${
  "sections": [
    {
      "heading": "Important AI Development Lesson",
      "body": "Students learn why they should not blindly replace an entire codebase when AI suggests changes.",
      "items": ["Back up their work", "Understand the proposed change", "Make one change at a time", "Test", "Observe the result", "Continue only after verification"]
    }
  ],
  "project": {
    "name": "Student Management System",
    "description": "Students build a real database-connected web application.",
    "features": ["Add students", "View students", "Search students", "Edit students", "Delete students"],
    "concepts": ["Database integration", "CRUD operations", "Supabase", "Forms", "Data retrieval", "Data manipulation", "Application structure"]
  }
}$sess$::jsonb,
  null,
  $cf$["Course filtering", "Student status", "Advanced search", "Student profiles", "Dashboard statistics"]$cf$::jsonb
)
on conflict (class_number) do update set
  title = excluded.title,
  topics = excluded.topics,
  session = excluded.session,
  assignment = excluded.assignment,
  challenge_features = excluded.challenge_features,
  updated_at = now();
