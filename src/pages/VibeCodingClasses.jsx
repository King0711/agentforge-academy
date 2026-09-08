import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { Lock, Loader2, ChevronRight, BookOpen, ArrowLeft } from 'lucide-react';
import { usePro } from '../hooks/usePro';

const CLASS_TITLES = [
  'Introduction to Vibe Coding & AI-Assisted Development',
  'Communicating With AI + Building Your First Website',
  'From Websites to Web Applications',
  'Building an Expense Tracker',
  'Databases, Backends & Supabase',
  'Building a Student Management System',
  'Building With AI + Debugging',
  'Final Project, Deployment & Presentation',
];

export default function VibeCodingClasses() {
  const { hasVibeCoding, proLoading } = usePro();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <Link to="/vibe-coding" className="inline-flex items-center gap-1.5 text-sm font-semibold text-body hover:text-brand transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Vibe Coding Bootcamp
      </Link>

      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink mb-2">Your 8 classes</h1>
      <p className="text-body text-[14.5px] mb-8">4 weeks, 2 classes per week — work through them in order alongside your live sessions.</p>

      {proLoading ? (
        <div className="flex items-center justify-center py-16 text-body gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading…
        </div>
      ) : !hasVibeCoding ? (
        <div className="flex flex-col items-center text-center gap-3 py-16 border-2 border-dashed border-border rounded-2xl mb-8">
          <Lock className="w-8 h-8 text-brand" />
          <p className="font-bold text-ink">Join the launch cohort to unlock class materials</p>
          <Link to="/vibe-coding#pricing" className="mt-2 inline-flex items-center gap-2 bg-brand hover:bg-brand-deep text-white font-bold px-5 py-2.5 rounded-xl transition-colors">
            See the offer
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {CLASS_TITLES.map((title, i) => {
            const n = i + 1;
            return (
              <m.div key={n} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Link
                  to={`/vibe-coding/class/${n}`}
                  className="flex items-center gap-3.5 bg-white dark:bg-[#181818] border-[1.5px] border-border-soft hover:border-brand/40 rounded-2xl px-4 py-3.5 transition-colors"
                >
                  <span className="w-8 h-8 rounded-full bg-brand text-white font-display font-extrabold text-[13px] flex items-center justify-center flex-shrink-0">{n}</span>
                  <span className="flex-1 min-w-0 font-semibold text-ink text-[14px] truncate">{title}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </Link>
              </m.div>
            );
          })}

          <Link
            to="/vibe-coding/prompts"
            className="flex items-center gap-2 justify-center text-sm font-bold text-brand hover:text-brand-deep transition-colors mt-4"
          >
            <BookOpen className="w-4 h-4" /> View the prompt library →
          </Link>
        </div>
      )}
    </div>
  );
}
