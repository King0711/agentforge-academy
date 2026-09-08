insert into public.vibecoding_content (class_number, title, topics, session, assignment, challenge_features)
values (
  8,
  'Final Project, Deployment & Presentation',
  $topics$["Defining the problem", "Defining must-have vs. nice-to-have features", "Planning with AI", "Building, testing, and improving with AI", "Deployment", "Presenting your work"]$topics$::jsonb,
  $sess${
  "sections": [
    {
      "heading": "Project 6 — Build Your Own Product",
      "body": "Students use everything they have learned to build their own application.",
      "items": [
        "Step 1 — Define the Problem: the problem, target users, proposed solution",
        "Step 2 — Define Features: separate Must-Have Features from Nice-to-Have Features",
        "Step 3 — Plan With AI: using Claude, create pages, features, user flow, database requirements, development steps",
        "Step 4 — Build: one feature at a time",
        "Step 5 — Test & Debug: test the application and fix problems",
        "Step 6 — Improve: use AI to review design, usability, code, and features",
        "Step 7 — Deploy: deploy online using Netlify, Vercel, or another suitable platform",
        "Step 8 — Present: the problem, target users, solution, application, core features, how AI helped, challenges encountered, what they learned"
      ]
    },
    {
      "heading": "Capstone Requirements",
      "items": ["A clearly defined problem", "A target user", "A functional interface", "Core working features", "Testing", "At least one documented debugging experience", "Deployment where possible"]
    }
  ],
  "keyLesson": "Students are not expected to become professional software developers in four weeks. The goal is to develop a practical AI-assisted workflow that allows them to continue building independently."
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
