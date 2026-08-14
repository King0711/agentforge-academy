import { useNavigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import SearchBar from '../SearchBar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import NotificationBell from './NotificationBell';

export default function DashboardTopBar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const displayName = user?.user_metadata?.display_name || user?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-[#FFFDFF]/95 dark:bg-[#0A090F]/95 backdrop-blur border-b border-[#EFE9FB] dark:border-[#232228] px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
      <div className="flex-1 max-w-xs">
        <SearchBar value="" onChange={(v) => navigate(`/catalog${v ? `?q=${encodeURIComponent(v)}` : ''}`)} />
      </div>
      <div className="flex items-center gap-3 ml-auto flex-shrink-0">
        <NotificationBell />
        <button
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#F3EBFF] dark:bg-white/10 text-brand transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-extrabold text-[13px] flex-shrink-0 lg:hidden">
          {initial}
        </div>
      </div>
    </header>
  );
}
