import { Zap } from 'lucide-react';

export default function XPBadge({ xp, size = 'md', className = '' }) {
  const sizes = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md font-semibold bg-[#FEF9E7] dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber/30 ${sizes[size]} ${className}`}
    >
      <Zap className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} fill="currentColor" />
      {xp.toLocaleString()} XP
    </span>
  );
}
