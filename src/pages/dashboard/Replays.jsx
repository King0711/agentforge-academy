import { useOutletContext } from 'react-router-dom';
import { PlayCircle, Lock, Loader2 } from 'lucide-react';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ReplayCard({ session }) {
  const available = Boolean(session.recording_url);
  return (
    <div
      className={`rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4 ${
        available
          ? 'border-[1.5px] border-border-soft bg-white dark:bg-[#181818]'
          : 'border-2 border-dashed border-border'
      }`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${available ? 'bg-[#F3EBFF] dark:bg-brand/15' : 'bg-[#FAF8FF] dark:bg-white/5'}`}>
          {available ? <PlayCircle className="w-5 h-5 text-brand" /> : <Lock className="w-5 h-5 text-gray-400" />}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-ink truncate">{session.title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(session.session_date)} · {session.tier === 'builder1' ? 'Builder 1' : 'Builder 2'}</p>
        </div>
      </div>
      {available ? (
        <a
          href={session.recording_url}
          target="_blank"
          rel="noreferrer"
          className="flex-shrink-0 bg-brand hover:bg-brand-deep text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
        >
          Watch replay
        </a>
      ) : (
        <span className="flex-shrink-0 text-xs font-semibold text-gray-400 bg-[#FAF8FF] dark:bg-white/5 px-3 py-2 rounded-lg">
          Recording coming soon
        </span>
      )}
    </div>
  );
}

export default function Replays() {
  const { liveSessions } = useOutletContext();
  const { past, loading } = liveSessions;

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink mb-6 flex items-center gap-3">
        <PlayCircle className="w-7 h-7 text-brand" /> Replays
      </h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-brand" />
        </div>
      ) : past.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-10 text-center">
          <PlayCircle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-ink font-bold">No past sessions yet</p>
          <p className="text-sm text-body mt-1">Replays show up here once a live session has happened.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {past.map((s) => <ReplayCard key={s.id} session={s} />)}
        </div>
      )}
    </div>
  );
}
