-- Vibe Coding bootcamp concept guide (table is still called vibecoding_prompts,
-- and the route is still /vibe-coding/prompts, so nothing that links to it breaks).
-- Rewritten 2026-11-02: the first version was eight copy-and-paste prompts. The
-- classes are not about pasting prompts. Students tell the AI what to build in
-- plain words, then debug what it makes, so this is now a "what is happening
-- and why" guide: frontend, database, backend/API, GitHub, security, deploying,
-- debugging. No code to copy. Each card is plain text; blank lines separate
-- paragraphs and a line ending in a colon is a small label.
--
-- Backup of the previous rows: vibecoding_prompts_backup_20261102.
create table if not exists public.vibecoding_prompts_backup_20261102 as
  select * from public.vibecoding_prompts;
alter table public.vibecoding_prompts_backup_20261102 enable row level security;
revoke all on public.vibecoding_prompts_backup_20261102 from anon, authenticated;

delete from public.vibecoding_prompts;

insert into public.vibecoding_prompts (id, title, prompt_text, order_index) values
(1, 'Telling the AI What to Build', $p1$You are the product owner. The AI is your developer. Your job is not to write code. It is to say clearly what you want, check what comes back, and understand it well enough to steer.

A good instruction says:
- Who the app is for and what problem it solves
- What the person should be able to do, one feature at a time
- What should happen when something goes wrong, such as an empty form or a wrong password

What to remember:
Ask for one feature, look at the result, then ask for the next. Big all-at-once requests give you a pile of code you do not understand and cannot fix.

Before you accept anything, be able to answer:
- What did the AI just build?
- Which part of the app does it belong to: the screen, the database, or the logic in between?
- How will I check that it works?$p1$, 1),
(2, 'The Big Picture: How an App Fits Together', $p2$Almost every app you will build has four parts. Learn these and you can follow any project.

The four parts:
- Frontend: what the person sees and taps. Pages, buttons, forms.
- Backend: the logic that runs out of sight. It decides what is allowed and does the work.
- Database: where information is kept so it is still there tomorrow.
- API: the messenger. The frontend asks, the backend answers, and an API is how they talk.

A simple picture:
A restaurant. The frontend is the dining room and menu. The backend is the kitchen. The database is the storeroom. The API is the waiter carrying orders between them.

Follow one action from end to end:
Someone adds an expense. The form sends it through the API, the backend checks it, the database stores it, and the screen shows the new total.

When something breaks, your first question is always: which of the four parts is failing?$p2$, 2),
(3, 'The Frontend: What People See', $p3$The frontend is everything that happens in the person's browser.

Three layers:
- HTML is the structure: the headings, the form, the buttons.
- CSS is the look: colours, spacing, how it adapts to a phone.
- JavaScript is the behaviour: what happens when you click, type or submit.

What to understand:
The frontend can be seen and changed by anyone who opens their browser tools. That is why it is never the place for secrets, and never the only place a rule is checked.

Things worth noticing in your own project:
- What changes on screen when you click a button, and what code reacts to it
- What the page does on a small phone screen
- What the person sees while data is loading, and when nothing comes back

Ask the AI to explain, in plain words, how the page you just built is put together. If its answer does not make sense to you, ask again until it does.$p3$, 3),
(4, 'The Database: Where Information Lives', $p4$A database remembers things when the page is closed. In this bootcamp we use Supabase, which gives you a real database without running a server yourself.

How it is organised:
- A table is one kind of thing, such as students or expenses.
- A row is one item in that table, such as one student.
- A column is one detail about each item, such as name or amount.

The four things every app does with data (CRUD):
- Create a new record
- Read records back
- Update a record
- Delete a record

Why this matters:
Your Student Management System is just those four actions on a table of students. Once you see that, most apps stop looking mysterious.

Design before you build:
Decide what a table holds before asking the AI to create it. What is each row? What does each row need to know? Changing the shape of your data later is much harder than getting it right at the start.

Questions to be able to answer about your project:
- Which tables do I have, and what is one row in each?
- Where does the data go when someone submits a form?
- What happens to it when someone deletes something?$p4$, 4),
(5, 'The Backend and APIs: The Work Behind the Screen', $p5$The backend is the part that does work the person never sees, and an API is the doorway to it.

What a request looks like:
The frontend sends a request: "give me this student" or "save this expense". The backend does the job and sends back a response. Every time something loads or saves, this conversation is happening.

Why not do everything in the browser?
- Anything in the browser can be read and changed by the user.
- Secrets, such as AI keys, must live where users cannot reach them.
- Rules, such as who may see what, must be enforced somewhere the user cannot bypass.

AI inside your product:
When your app uses AI, the frontend does not talk to the AI directly. It asks your backend, and the backend talks to the AI using a key that stays private. The person only ever sees the answer.

Useful to be able to say out loud:
- What did the frontend ask for?
- What did the backend do?
- What came back, and what did the screen do with it?

When something fails, the browser's network view shows each request and whether it succeeded. That is often the fastest way to find where it broke.$p5$, 5),
(6, 'GitHub: Your Project''s Safe History', $p6$GitHub is where your project's code is stored online, with a record of every change.

The words you will hear:
- Repository: the project folder, stored on GitHub.
- Commit: a saved snapshot with a short note on what changed.
- Push: sending your snapshots up to GitHub.
- Branch: a separate copy to try something without risking the working version.

Why it matters:
- If an AI change breaks everything, you can go back to the last working snapshot.
- It is your backup if your laptop dies.
- It is how you share a project and how hosting services pick up your latest version to put online.

Good habits:
- Commit when something works, not when you are halfway through breaking it.
- Write a commit note that says what changed, in plain words.
- Never put passwords, keys or secrets into a repository. Once something is on GitHub, treat it as public, even if you delete it later.

Questions to be able to answer:
- What is the last version of my project that worked?
- If today's changes go wrong, how do I get back to it?$p6$, 6),
(7, 'Security: Keeping Your App and Its Users Safe', $p7$AI will happily build something that works but is not safe. Security is the part you have to understand and check yourself.

Keys and secrets:
- An API key is like a password for a service. Anyone who has it can use that service as you, and you may pay for what they do.
- Keep them in environment variables, never typed into the code, and never pushed to GitHub.
- A key in front-end code is a key the whole world can read.

Who is allowed to do what:
- Authentication is proving who you are, by logging in.
- Authorization is what you are allowed to do once you are in.
- In Supabase, Row Level Security lets the database itself decide which rows each person can see or change. Without it, a clever user can reach other people's data.

Never trust what comes in:
- Check what people type in. Empty, wrong, or deliberately harmful input should be handled safely.
- Checking only on the screen is not enough. The same rule has to hold on the server side, because the screen can be bypassed.

A quick security check on your own app:
- Are any keys visible in my code or my repository?
- Can one user see another user's data?
- What happens if someone submits something nonsense?
- Who can delete things, and have I decided that on purpose?

Ask the AI to review your project for these exact things, then make sure you understand each answer before you act on it.$p7$, 7),
(8, 'Deployment: Putting It Online', $p8$Deploying means moving your app from your computer to a public address, so anyone can open it.

How it works for us:
You connect your GitHub repository to a hosting service such as Netlify or Vercel. Each time you push a change, the host builds your project and updates the live site.

What to understand:
- Your computer and the live site are two different places. Something working locally can still fail online.
- Secrets are added in the host's settings, as environment variables, not in the code.
- The live site has its own address, and you should open it and test it, not assume.

Common reasons a deployed app breaks:
- A key or setting that exists on your computer but was never added to the host
- A file that never made it into the repository
- The live site pointing to the wrong database

After every deploy, test it like a stranger would:
- Open the live address on a phone
- Try the main action from start to finish
- Try it logged out and logged in$p8$, 8),
(9, 'Debugging: Finding What Went Wrong', $p9$Bugs are normal. Skilled builders are not the ones with no bugs, they are the ones who find them calmly.

Start by describing the problem precisely:
- What did I expect to happen?
- What actually happened?
- What is the exact error message, if there is one?

Then narrow it down:
- Is the problem on the screen, in the logic behind it, or in the data?
- Did it work before? What did I change since then?
- Can I make it happen again every time?

Working with the AI:
- Ask it to explain what is going wrong before it changes anything.
- Ask for the smallest change that could fix it, not a rewrite.
- Change one thing at a time and test after each, so you know what fixed it.
- If a fix does not make sense to you, ask it to explain until it does. Do not apply changes you do not understand.

When you are stuck:
Go back to the last working version on GitHub and try again from there. That is exactly what the history is for.

The goal is not to avoid errors. It is to be able to look at one and know where to look first.$p9$, 9);

select setval('vibecoding_prompts_id_seq', (select max(id) from vibecoding_prompts));
