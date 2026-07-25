import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Shield, Zap, Award } from 'lucide-react';
import SearchBar from './SearchBar';
import { useAuth } from '../context/AuthContext';
import { usePro } from '../hooks/usePro';

const links = [
  { to: '/', label: 'Home' },
  { to: '/catalog', label: 'Catalog' },
  { to: '/paths', label: 'Learning Paths' },
  { to: '/pricing', label: 'Pricing' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const { isPro, isAdmin } = usePro();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  useEffect(() => {
    if (location.pathname === '/catalog') {
      setValue(searchParams.get('q') || '');
    }
  }, [location.pathname, searchParams]);

  const handleChange = (v) => {
    setValue(v);
    navigate(`/catalog${v ? `?q=${encodeURIComponent(v)}` : ''}`);
  };

  const displayName = user?.user_metadata?.display_name || user?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-[#FFFDFF] border-b border-[#EFE9FB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[70px] flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <img src="/logo.jpeg" alt="Social Dev Technologies" className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-lg" />
          <span className="font-display font-extrabold text-[15px] sm:text-base text-ink tracking-tight whitespace-nowrap">
            Social Dev<span className="text-brand"> Technologies</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 ml-6 font-semibold text-[14.5px] text-[#4A4463] flex-shrink-0">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `flex-shrink-0 whitespace-nowrap transition-colors ${isActive ? 'text-brand' : 'hover:text-ink'}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1 hidden md:block max-w-xs ml-4">
          <SearchBar value={value} onChange={handleChange} />
        </div>

        <div className="hidden lg:flex items-center gap-4 ml-auto flex-shrink-0">
          {user ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `font-semibold text-[14.5px] whitespace-nowrap transition-colors ${isActive ? 'text-brand' : 'text-[#4A4463] hover:text-ink'}`}
              >
                My Dashboard
              </NavLink>
              <NavLink
                to="/certificates"
                className={({ isActive }) => `flex items-center gap-1 font-semibold text-[14.5px] whitespace-nowrap transition-colors ${isActive ? 'text-brand' : 'text-[#4A4463] hover:text-ink'}`}
              >
                <Award className="w-3.5 h-3.5" /> Certificates
              </NavLink>
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `flex items-center gap-1 font-semibold text-[13px] whitespace-nowrap transition-colors ${isActive ? 'text-brand' : 'text-amber-600 hover:text-brand'}`
                  }
                >
                  <Shield className="w-3.5 h-3.5" /> Admin
                </NavLink>
              )}
              <div className="flex items-center gap-2.5 pl-4 border-l border-border-soft flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-extrabold text-[13px] flex-shrink-0">
                  {initial}
                </div>
                <span className="font-bold text-ink text-sm whitespace-nowrap max-w-[140px] truncate">{displayName}</span>
                {isAdmin ? (
                  <span className="flex items-center gap-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    <Shield className="w-2.5 h-2.5" /> ADMIN
                  </span>
                ) : isPro ? (
                  <span className="flex items-center gap-0.5 text-[10px] font-bold bg-brand text-white px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    <Zap className="w-2.5 h-2.5" /> PRO
                  </span>
                ) : null}
                <button onClick={handleSignOut} className="text-[13px] text-gray-400 hover:text-ink transition-colors whitespace-nowrap">
                  Log out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/welcome" className="font-bold text-brand text-[14.5px] whitespace-nowrap flex-shrink-0">
                Log in
              </Link>
              <Link
                to="/welcome"
                className="bg-brand text-white font-bold px-5 py-2.5 rounded-full text-[14.5px] whitespace-nowrap flex-shrink-0 shadow-[0_6px_16px_rgba(124,58,237,.35)] hover:bg-brand-deep transition-colors"
              >
                Start building
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="lg:hidden ml-auto w-9 h-9 flex items-center justify-center rounded-lg bg-[#F3EBFF] text-brand flex-shrink-0"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-[#EFE9FB] overflow-hidden bg-white"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              <SearchBar value={value} onChange={handleChange} className="mb-2" />
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      isActive ? 'text-brand bg-[#F3EBFF]' : 'text-[#4A4463] hover:bg-[#FAF8FF]'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              <div className="border-t border-[#EFE9FB] mt-2 pt-3">
                {user ? (
                  <>
                    <NavLink
                      to="/dashboard"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-[#4A4463] hover:bg-[#FAF8FF]"
                    >
                      <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center font-extrabold text-xs flex-shrink-0">
                        {initial}
                      </div>
                      {displayName}
                      {isPro && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold bg-brand text-white px-1.5 py-0.5 rounded-full">
                          <Zap className="w-2.5 h-2.5" /> PRO
                        </span>
                      )}
                    </NavLink>
                    <NavLink
                      to="/certificates"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-[#4A4463] hover:bg-[#FAF8FF]"
                    >
                      <Award className="w-4 h-4" /> Certificates
                    </NavLink>
                    {isAdmin && (
                      <NavLink
                        to="/admin"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-amber-700"
                      >
                        <Shield className="w-4 h-4" /> Admin
                      </NavLink>
                    )}
                    <button
                      onClick={() => { setOpen(false); handleSignOut(); }}
                      className="w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-semibold text-gray-500 hover:bg-[#FAF8FF]"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/welcome"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-full text-sm font-bold bg-brand text-white"
                  >
                    Start building
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
