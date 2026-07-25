import { LayoutDashboard } from 'lucide-react';
import Dashboard from '../components/Dashboard';
import TestimonialPrompt from '../components/TestimonialPrompt';

export default function MyDashboard({ progress, onSelectAgent }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink flex items-center gap-3">
          <LayoutDashboard className="w-7 h-7 text-brand" />
          My Dashboard
        </h1>
        <p className="text-body mt-2">Track your XP, streaks, and progress through the curriculum.</p>
      </div>
      <TestimonialPrompt completedCount={progress.completed.length} />
      <Dashboard progress={progress} onSelectAgent={onSelectAgent} />
    </div>
  );
}
