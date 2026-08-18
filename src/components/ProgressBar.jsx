import { motion } from 'framer-motion';

export default function ProgressBar({ value, max, color = '#7C3AED', label, showLabel = true, height = 'h-2.5' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-1.5 text-sm">
          <span className="text-body-strong font-medium">{label}</span>
          <span className="text-body">
            <span>{value.toLocaleString()}</span> / <span>{max.toLocaleString()}</span>
          </span>
        </div>
      )}
      <div className={`w-full ${height} rounded-full bg-[#F3EBFF] dark:bg-[#181818] overflow-hidden`}>
        <motion.div
          className={`${height} rounded-full`}
          style={{ background: `linear-gradient(90deg, ${color}, ${color}AA)` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
