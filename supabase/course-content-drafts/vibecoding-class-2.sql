insert into public.vibecoding_content (class_number, title, topics, session, assignment, challenge_features)
values (
  2,
  'Communicating With AI + Building Your First Website',
  $topics$["Why vague prompts produce poor results", "The CLEAR framework for communicating with AI", "Giving AI one task at a time", "Breaking large projects into smaller tasks", "Asking AI to explain code", "Reviewing AI-generated code", "Avoiding blindly accepting AI output"]$topics$::jsonb,
  $sess${
  "sections": [
    {
      "heading": "The CLEAR Framework",
      "items": [
        "C — Context: tell AI what it needs to know",
        "L — Limitations: tell AI what it should and should not do",
        "E — Expected Result: explain what you want the final result to look like",
        "A — Actions: tell AI what you want it to do",
        "R — Requirements: specify technical, design, or functional requirements"
      ]
    }
  ],
  "project": {
    "name": "Personal Portfolio Website",
    "description": "Students build a responsive personal portfolio website. They don't just copy code — they learn what the different parts of the application are doing.",
    "features": ["Navigation bar", "Hero section", "About section", "Skills", "Projects", "Contact section", "Footer", "Responsive design"],
    "concepts": ["HTML", "CSS", "JavaScript", "Files and folders", "VS Code", "Basic web development structure"]
  }
}$sess$::jsonb,
  'Customize the portfolio with: their name, personal description, skills, projects, contact information, and personal design choices.',
  null
)
on conflict (class_number) do update set
  title = excluded.title,
  topics = excluded.topics,
  session = excluded.session,
  assignment = excluded.assignment,
  challenge_features = excluded.challenge_features,
  updated_at = now();
