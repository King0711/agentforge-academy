import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications, formatRelativeTime } from '../../hooks/useNotifications';

export default function NotificationBell() {
  const { user } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(user);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Same click-outside pattern as the account dropdown in Navbar.jsx —
  // listener only attached while the dropdown is actually open.
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleItemClick = (n) => {
    markRead(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative flex-shrink-0" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-[#F3EBFF] dark:bg-white/10 text-brand transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-rose text-white text-[10px] font-bold leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#141319] border border-[#EFE9FB] dark:border-[#232228] rounded-xl shadow-[0_16px_40px_-12px_rgba(30,20,60,.3)] overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#EFE9FB] dark:border-[#232228]">
              <span className="text-sm font-bold text-ink">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-deep transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-400">You're all caught up.</div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`w-full text-left px-4 py-3 border-b border-[#EFE9FB] dark:border-[#232228] last:border-b-0 transition-colors hover:bg-[#FAF8FF] dark:hover:bg-white/5 ${
                      !n.read_at ? 'bg-[#F7F4FF] dark:bg-white/[0.03]' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read_at && <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 flex-shrink-0" />}
                      <div className={n.read_at ? 'pl-3.5' : ''}>
                        <p className="text-sm font-semibold text-ink leading-snug">{n.title}</p>
                        <p className="text-xs text-body mt-0.5 leading-snug">{n.body}</p>
                        <p className="text-[11px] text-gray-400 mt-1">{formatRelativeTime(n.created_at)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
