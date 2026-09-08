-- Vibe Coding bootcamp prompt library — 8 reusable copy-and-paste prompts,
-- not tied to any single class, so they live in their own table
-- (vibecoding_prompts) rather than inside a vibecoding_content row.
delete from public.vibecoding_prompts;

insert into public.vibecoding_prompts (id, title, prompt_text, order_index) values
(1, 'Project Planning Prompt', $p1$Help me plan a web application for [describe idea].

Before writing code, help me define:
- The problem
- Target users
- Core features
- Pages/screens
- User flow
- Data requirements
- Recommended technology

Do not write the entire application yet. Help me create a practical development plan first.$p1$, 1),
(2, 'Development Planning Prompt', $p2$Break this project into small development tasks that I can complete one at a time.

For each task:
- Explain what we are building
- Explain why it is needed
- Tell me which files need to change
- Give me the implementation steps
- Tell me how to test it

Do not change multiple unrelated parts of the project at once.$p2$, 2),
(3, 'Code Explanation Prompt', $p3$Explain this code to me as a beginner.

Tell me:
1. What this code does
2. What each major section does
3. Why it is needed
4. What would happen if I removed it
5. Any problems or improvements you notice$p3$, 3),
(4, 'Debugging Prompt', $p4$I have a problem with my application.

Here is what I expected to happen:
[describe expected behavior]

Here is what actually happened:
[describe actual behavior]

Here is the error message:
[paste error]

Here is the relevant code:
[paste code]

Help me identify the likely cause.

Do not rewrite my entire application. Explain the problem first, then suggest the smallest change that can fix it.$p4$, 4),
(5, 'Design Review Prompt', $p5$Review my application's design as a professional UI/UX designer.

Evaluate:
- Layout
- Spacing
- Typography
- Navigation
- Mobile responsiveness
- Visual hierarchy
- Accessibility
- Usability

Give me specific improvements and explain why each improvement matters.$p5$, 5),
(6, 'Code Review Prompt', $p6$Review my code as a senior developer.

Look for:
- Bugs
- Security issues
- Poor structure
- Duplicate code
- Maintainability problems
- Performance problems
- Opportunities for improvement

Do not rewrite everything. Identify the most important issues first.$p6$, 6),
(7, 'Feature Development Prompt', $p7$I want to add this feature:

[describe feature]

Before changing my code:
1. Explain how the feature should work.
2. Identify which files need to change.
3. Explain how it fits into my existing application.
4. Tell me how we will test it.

Then implement the feature with the smallest necessary changes.$p7$, 7),
(8, 'Testing Prompt', $p8$Help me test my application.

Create a test checklist covering:
- Normal user behavior
- Invalid input
- Empty states
- Error states
- Mobile responsiveness
- Edge cases
- Security issues

For each test, tell me what result I should expect.$p8$, 8);

select setval('vibecoding_prompts_id_seq', (select max(id) from vibecoding_prompts));
