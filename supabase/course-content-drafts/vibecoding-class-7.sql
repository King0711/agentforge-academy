insert into public.vibecoding_content (class_number, title, topics, session, assignment, challenge_features)
values (
  7,
  'Building With AI + Debugging',
  $topics$["AI model", "Prompt", "Context", "Response", "API", "How AI can become part of the products you build"]$topics$::jsonb,
  $sess${
  "sections": [
    {
      "heading": "Examples",
      "items": ["AI chatbot", "AI writing assistant", "Customer support assistant", "Recommendation system", "AI content generator"]
    },
    {
      "heading": "Security",
      "items": ["Never expose API keys in frontend code", "Never publish passwords or secrets", "Never place private credentials inside GitHub", "Understand the difference between frontend and backend secrets"]
    },
    {
      "heading": "The Debugging Process",
      "body": "Students learn that getting an error does not mean the project has failed.",
      "items": [
        "1. Reproduce — make the problem happen again",
        "2. Describe — clearly explain what went wrong",
        "3. Observe — look at the error message and application behavior",
        "4. Capture — collect relevant information such as screenshots, errors, or code",
        "5. Ask — give AI enough context to investigate the problem",
        "6. Test — apply the suggested solution",
        "7. Verify — confirm that the solution actually works"
      ]
    }
  ],
  "project": {
    "name": "AI Application Prototype",
    "description": "Students build an AI-powered application prototype. Where a paid AI API would create additional costs, students can use a mock/demo workflow or other free options rather than being forced to spend additional money.",
    "features": ["AI Content Assistant", "AI Customer Support Assistant", "AI Study Assistant", "AI Business Idea Generator", "AI Writing Assistant"],
    "concepts": ["AI model", "Prompt", "Context", "Response", "API"]
  }
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
