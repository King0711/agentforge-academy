import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Menu, X, LogIn, LogOut, UserCircle2, Zap, Shield } from 'lucide-react';
import SearchBar from './SearchBar';
import { useAuth } from '../context/AuthContext';
import { usePro } from '../hooks/usePro';

const links = [
  { to: '/', label: 'Home' },
  { to: '/catalog', label: 'Catalog' },
  { to: '/paths', label: 'Learning Paths' },
  { to: '/dashboard', label: 'My Dashboard' },
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

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A1A]/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-white text-lg flex-shrink-0">
          <img src="/logo.svg" alt="Social Dev Technologies" className="w-9 h-9 object-contain rounded-lg" />
          <span className="hidden sm:inline text-base leading-tight">
            Social Dev<br /><span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Technologies</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'text-white bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex-1 hidden md:block max-w-sm ml-4">
          <SearchBar value={value} onChange={handleChange} />
        </div>

        <div className="hidden lg:flex items-center gap-2 ml-auto">
          {user ? (
            <>
              <span className="flex items-center gap-1.5 text-sm text-slate-300 px-2">
                <UserCircle2 className="w-4 h-4" />
                {user.user_metadata?.display_name || user.email}
                {isAdmin && (
                  <span className="flex items-center gap-0.5 text-[10px] font-bold bg-amber-500 text-[#0A0A1A] px-1.5 py-0.5 rounded-full">
                    <Shield className="w-2.5 h-2.5" /> ADMIN
                  </span>
                )}
                {isPro && !isAdmin && (
                  <span className="flex items-center gap-0.5 text-[10px] font-bold bg-gradient-to-r from-[#0067B8] to-[#7C3AED] text-white px-1.5 py-0.5 rounded-full">
                    <Zap className="w-2.5 h-2.5" /> PRO
                  </span>
                )}
              </span>
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-amber-400/20 text-amber-300' : 'text-amber-400 hover:bg-amber-400/10'
                    }`
                  }
                >
                  <Shield className="w-4 h-4" /> Admin
                </NavLink>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </button>
            </>
          ) : (
            <Link
              to="/welcome"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-bold bg-[#0067B8] hover:bg-[#0078D4] text-white transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign Up / Log In
            </Link>
          )}
        </div>

        <button
          onClick={() => setOpen((o) => !o)}
          className="lg:hidden ml-auto w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white"
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
            className="lg:hidden border-t border-white/10 overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-2">
              <SearchBar value={value} onChange={handleChange} className="mb-2" />
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'text-white bg-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              <div className="border-t border-white/10 mt-2 pt-3">
                {user ? (
                  <>
                    <p className="flex items-center gap-1.5 text-sm text-slate-400 px-3.5 pb-2">
                      <UserCircle2 className="w-4 h-4" />
                      {user.user_metadata?.display_name || user.email}
                      {isPro && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold bg-gradient-to-r from-[#0067B8] to-[#7C3AED] text-white px-1.5 py-0.5 rounded-full">
                          <Zap className="w-2.5 h-2.5" /> PRO
                        </span>
                      )}
                    </p>
                    <button
                      onClick={() => { setOpen(false); handleSignOut(); }}
                      className="w-full flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-medium bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Log Out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/welcome"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-bold bg-[#0067B8] hover:bg-[#0078D4] text-white transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign Up / Log In
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
