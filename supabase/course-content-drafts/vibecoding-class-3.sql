insert into public.vibecoding_content (class_number, title, topics, session, assignment, challenge_features)
values (
  3,
  'From Websites to Web Applications',
  $topics$["The difference between a website and a web application", "Building applications one feature at a time instead of generating everything at once"]$topics$::jsonb,
  $sess${
  "sections": [
    {
      "heading": "AI Development Lesson",
      "body": "Students practice building applications one feature at a time instead of asking AI to generate an entire complex application at once."
    }
  ],
  "project": {
    "name": "Interactive To-Do Application",
    "description": "Students build a functional To-Do application.",
    "features": ["Add tasks", "Display tasks", "Complete tasks", "Delete tasks", "Edit tasks"],
    "concepts": ["Variables", "Functions", "Events", "Arrays", "DOM manipulation", "Application logic", "User interaction"]
  }
}$sess$::jsonb,
  null,
  $cf$["Task priorities", "Categories", "Due dates", "Dark mode"]$cf$::jsonb
)
on conflict (class_number) do update set
  title = excluded.title,
  topics = excluded.topics,
  session = excluded.session,
  assignment = excluded.assignment,
  challenge_features = excluded.challenge_features,
  updated_at = now();
