import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// The six projects, names and descriptions copied from VibeCoding.jsx's
// PROJECTS. Keep the two in step if the bootcamp changes.
const PROJECTS = [
  { name: 'Personal Portfolio Website', text: 'A professional responsive website showcasing your skills, projects, and experience.' },
  { name: 'Interactive To-Do App', text: 'Tasks, editing, deletion, completion, and real user interaction.' },
  { name: 'Expense Tracker', text: 'Recording expenses, categories, dates, and spending totals.' },
  { name: 'Student Management System', text: 'A real database-connected application using Supabase.' },
  { name: 'AI-Powered Application', text: 'An AI assistant, content tool, study assistant, or support prototype.' },
  { name: 'Your Own Product', text: 'Take an idea of your own and turn it into a working application.' },
];

export default function VibeProjects() {
  return (
    <div className="grid lg:grid-cols-[1fr_1.9fr] gap-9 lg:gap-14">
      <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
        <h2 className="t-section text-ink">What you'll build in the Vibe Coding Bootcamp</h2>
        <p className="t-lead text-body mt-5 mb-6 lg:mb-8">
          Six projects across 4 weeks and 8 live classes, from your first website to a product of your own.
        </p>
        <Link to="/vibe-coding" className="btn btn-secondary">
          See the Vibe Coding Bootcamp <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <ol className="grid sm:grid-cols-2 gap-x-12 list-none m-0 p-0 border-b border-border sm:border-b-0">
        {PROJECTS.map((p, i) => (
          <li key={p.name} className="flex gap-5 min-w-0 border-t border-border py-6 lg:py-7">
            <span aria-hidden="true" className="t-num w-9 flex-shrink-0 pt-0.5 text-2xl text-link">{String(i + 1).padStart(2, '0')}</span>
            <div className="min-w-0">
              <h3 className="font-display font-extrabold text-xl lg:text-2xl leading-tight tracking-[-0.02em] text-ink mb-2">{p.name}</h3>
              <p className="t-card text-body">{p.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
