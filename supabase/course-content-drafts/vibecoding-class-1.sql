insert into public.vibecoding_content (class_number, title, topics, session, assignment, challenge_features)
values (
  1,
  'Introduction to Vibe Coding & AI-Assisted Development',
  $topics$["What is software?", "What are websites and web applications?", "What is coding?", "What is AI-assisted development?", "What is vibe coding?", "What AI can and cannot do", "The role of the human developer", "The VIBE Method", "The modern AI-assisted development workflow"]$topics$::jsonb,
  $sess${
  "sections": [
    {
      "heading": "Development Workflow",
      "body": "Idea → Plan → Build → Test → Debug → Improve → Deploy"
    },
    {
      "heading": "Tools Setup",
      "items": ["Claude Pro", "Visual Studio Code", "GitHub", "A modern web browser"]
    },
    {
      "heading": "Practical Activity",
      "body": "Students choose an idea for an application. Using Claude, they define: the problem, target users, proposed solution, core features, and basic user experience."
    }
  ]
}$sess$::jsonb,
  'Create a simple project brief containing: (1) Project name, (2) Problem, (3) Target users, (4) Proposed solution, (5) Five core features.',
  null
)
on conflict (class_number) do update set
  title = excluded.title,
  topics = excluded.topics,
  session = excluded.session,
  assignment = excluded.assignment,
  challenge_features = excluded.challenge_features,
  updated_at = now();
