import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import {
  Menu, X, Shield, Zap, Award, Sun, Moon, ChevronDown, LayoutDashboard, LogOut,
  ArrowRight, Phone,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePro } from '../hooks/usePro';
import { useTheme } from '../context/ThemeContext';
import { BUILDER1_PRICE } from '../data/pricing';

// The same WhatsApp line the floating chat button and the footer use. It is not
// a voice line (replies 10am-5pm WAT, Monday to Saturday), so it opens WhatsApp
// instead of a tel: link.
const PHONE_DISPLAY = '+234 906 600 6963';
const WHATSAPP_URL = 'https://wa.me/2349066006963';

// No "Home" link (the logo goes home) and no search box: the Catalog page has
// its own search.
const links = [
  { to: '/catalog', label: 'Catalog' },
  // The three sellable programs — this dropdown replaces the old standalone
  // "Programs" nav item entirely (founder-confirmed 2026-09-22); "Learning
  // Paths" no longer links directly to /paths (the difficulty/department
  // catalog browser), which still exists but is reached from the footer
  // rather than the top-level nav.
  { label: 'Learning Paths', children: [
      // AI Agent Mastery listed first — it's the priority/flagship program
      // (founder-confirmed 2026-09-23).
      // Each description repeats a fact from the destination page (the
      // homepage programs table), never a new claim.
      { to: '/ai-agent-mastery', label: 'AI Agent Mastery', text: 'Live cohort: build an AI team you run from your phone' },
      { to: '/vibe-coding', label: 'Vibe Coding Bootcamp', text: '4 weeks, 8 live classes. No coding experience needed' },
      { to: '/ai-builder', label: 'AI Agent Guides', text: `Self-paced builds you keep for good, from ₦${BUILDER1_PRICE.toLocaleString()}` },
    ] },
  // Grouped under one "Learn" dropdown rather than separate top-level links.
  // Both stay real, separately-crawlable routes — the dropdown is only a
  // navigation affordance, not a tab switcher that would hide one of them
  // from crawlers.
  { label: 'Learn', children: [
      { to: '/guides', label: 'Guides', text: 'Step-by-step guides for building AI agents' },
      { to: '/news', label: 'AI News', text: 'AI news, explained for builders' },
    ] },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { isPro, isAdmin } = usePro();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const displayName = user?.user_metadata?.display_name || user?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  // The AI Agent Mastery sales page is a single-purpose landing page: only
  // the logo stays (not a link), so nothing pulls the visitor away from the
  // offer (founder request 2026-10-18).
  const focused = location.pathname.replace(/\/+$/, '') === '/ai-agent-mastery';

  return (
    // The dark utility bar is 36px tall (h-9) and the header sticks at -36px on
    // wide screens, so the bar scrolls away and the main row stays pinned.
    <header className="sticky top-0 lg:-top-9 z-40 bg-surface border-b border-border">
      {!focused && (
        <div className="section-dark hidden lg:block h-9 text-[13px] font-semibold">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-6">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-yellow" />
              <span>{PHONE_DISPLAY}</span>
              <span className="text-white/60 font-medium">· Chat on WhatsApp, Mon–Sat 10am–5pm WAT</span>
            </a>
            <div className="flex items-center gap-5">
              {[['/pricing', 'Pricing'], ['/about', 'About'], ['/faq', 'FAQ']].map(([to, label]) => (
                <Link key={to} to={to} className="text-white/80 hover:text-white transition-colors">{label}</Link>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[68px] lg:h-[78px] flex items-center gap-4">
        <Link to={focused ? '#' : '/'} onClick={focused ? (e) => e.preventDefault() : undefined} className="flex items-center gap-2.5 flex-shrink-0">
          <img src="/logo-icon.webp" alt="" className="w-9 h-9 sm:w-11 sm:h-11 object-contain rounded-lg" />
          <span className="font-display font-extrabold text-[15px] sm:text-[17px] text-ink tracking-tight whitespace-nowrap">
            Social Dev<span className="text-link"> Technologies</span>
          </span>
        </Link>

        {!focused && <nav className="hidden lg:flex items-center gap-7 ml-8 font-bold text-base text-body-strong flex-shrink-0">
          {links.map((link) =>
            link.children ? (
              <div key={link.label} className="relative group flex-shrink-0">
                <button
                  aria-haspopup="true"
                  className={`flex items-center gap-1 whitespace-nowrap py-6 transition-colors ${
                    link.children.some((c) => location.pathname.startsWith(c.to)) ? 'text-link' : 'hover:text-link'
                  }`}
                >
                  {link.label}
                  <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
                </button>
                {/* Opens on hover or keyboard focus, but is in the DOM at all
                    times so the links inside are always crawlable. */}
                <div className="absolute left-0 top-full opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-opacity">
                  <div className="card-float w-[340px] border border-border p-2">
                    {link.children.map((child) => (
                      <NavLink
                        key={child.to}
                        to={child.to}
                        className={({ isActive }) =>
                          `block rounded-lg px-4 py-3 transition-colors ${
                            isActive ? 'bg-link/10' : 'hover:bg-link/[0.07]'
                          }`
                        }
                      >
                        <span className="min-w-0">
                          <span className="block text-[15px] font-extrabold leading-snug text-ink">{child.label}</span>
                          <span className="mt-0.5 block text-[13px] font-medium leading-snug text-body">{child.text}</span>
                        </span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) => `flex-shrink-0 whitespace-nowrap py-6 transition-colors ${isActive ? 'text-link' : 'hover:text-link'}`}
              >
                {link.label}
              </NavLink>
            ),
          )}
        </nav>}

        {!focused && <div className="hidden lg:flex items-center gap-4 ml-auto flex-shrink-0">
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-link/10 text-link flex-shrink-0 transition-colors hover:bg-link/15"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {user ? (
            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-full hover:bg-[#F1F4F8] dark:hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center font-extrabold text-[13px] flex-shrink-0">
                  {initial}
                </div>
                <span className="font-bold text-ink text-sm whitespace-nowrap max-w-[120px] truncate">{displayName}</span>
                {isAdmin ? (
                  <span className="flex items-center gap-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    <Shield className="w-2.5 h-2.5" /> ADMIN
                  </span>
                ) : isPro ? (
                  <span className="flex items-center gap-0.5 text-[10px] font-bold bg-brand text-white px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    <Zap className="w-2.5 h-2.5" /> PRO
                  </span>
                ) : null}
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <m.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#131E2F] border border-[#E7ECF2] dark:border-[#26364B] rounded-xl shadow-[0_16px_40px_-12px_rgba(15,26,42,.3)] py-1.5 overflow-hidden"
                  >
                    <NavLink
                      to="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors ${isActive ? 'text-link bg-[#F1F4F8] dark:bg-white/5' : 'text-[#4A5B6C] dark:text-[#A2B1C3] hover:bg-[#F6F8FB] dark:hover:bg-white/5'}`
                      }
                    >
                      <LayoutDashboard className="w-4 h-4" /> My Dashboard
                    </NavLink>
                    <NavLink
                      to="/certificates"
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors ${isActive ? 'text-link bg-[#F1F4F8] dark:bg-white/5' : 'text-[#4A5B6C] dark:text-[#A2B1C3] hover:bg-[#F6F8FB] dark:hover:bg-white/5'}`
                      }
                    >
                      <Award className="w-4 h-4" /> Certificates
                    </NavLink>
                    {isAdmin && (
                      <NavLink
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold transition-colors ${isActive ? 'text-link bg-[#F1F4F8] dark:bg-white/5' : 'text-amber-600 hover:bg-[#F6F8FB] dark:hover:bg-white/5'}`
                        }
                      >
                        <Shield className="w-4 h-4" /> Admin
                      </NavLink>
                    )}
                    <div className="border-t border-[#E7ECF2] dark:border-[#26364B] my-1" />
                    <button
                      onClick={() => { setMenuOpen(false); handleSignOut(); }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-gray-500 hover:bg-[#F6F8FB] dark:hover:bg-white/5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link to="/welcome" className="font-bold text-ink text-base whitespace-nowrap flex-shrink-0 hover:text-link transition-colors">
                Log in
              </Link>
              {!focused && <Link
                to="/pricing"
                className="inline-flex items-center gap-2 bg-brand text-white font-extrabold px-6 py-3.5 rounded-xl text-[15px] leading-none whitespace-nowrap flex-shrink-0 hover:bg-brand-deep transition-colors"
              >
                View programs <ArrowRight className="w-4 h-4" />
              </Link>}
            </>
          )}
        </div>}

        {!focused && <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="lg:hidden ml-auto w-9 h-9 flex items-center justify-center rounded-lg bg-[#E8EDF3] dark:bg-white/10 text-link flex-shrink-0"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>}
      </div>

      <AnimatePresence>
        {open && !focused && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-[#E7ECF2] dark:border-[#26364B] overflow-hidden bg-white dark:bg-[#0C1420]"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-[#4A5B6C] dark:text-[#A2B1C3] hover:bg-[#F6F8FB] dark:hover:bg-white/5 mb-1"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              </button>
              {/* Flattened on mobile — a nested dropdown inside an already
                  collapsible menu is worse than just listing the children. */}
              {links.flatMap((link) =>
                link.children
                  ? link.children.map((child) => ({ ...child, indented: true }))
                  : [link],
              ).map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                      isActive ? 'text-link bg-[#E8EDF3] dark:bg-white/10' : 'text-[#4A5B6C] dark:text-[#A2B1C3] hover:bg-[#F6F8FB] dark:hover:bg-white/5'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              <div className="border-t border-[#E7ECF2] dark:border-[#26364B] mt-2 pt-3">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 px-3.5 py-2 mb-1">
                      <div className="w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center font-extrabold text-xs flex-shrink-0">
                        {initial}
                      </div>
                      <span className="font-bold text-ink text-sm truncate">{displayName}</span>
                      {isAdmin ? (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          <Shield className="w-2.5 h-2.5" /> ADMIN
                        </span>
                      ) : isPro ? (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold bg-brand text-white px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          <Zap className="w-2.5 h-2.5" /> PRO
                        </span>
                      ) : null}
                    </div>
                    <NavLink
                      to="/dashboard"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-[#4A5B6C] dark:text-[#A2B1C3] hover:bg-[#F6F8FB] dark:hover:bg-white/5"
                    >
                      <LayoutDashboard className="w-4 h-4" /> My Dashboard
                    </NavLink>
                    <NavLink
                      to="/certificates"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-sm font-semibold text-[#4A5B6C] dark:text-[#A2B1C3] hover:bg-[#F6F8FB] dark:hover:bg-white/5"
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
                      className="w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-semibold text-gray-500 hover:bg-[#F6F8FB] dark:hover:bg-white/5"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 px-3.5 py-2.5 mb-1 rounded-lg text-sm font-semibold text-[#4A5B6C] dark:text-[#A2B1C3] hover:bg-[#F6F8FB] dark:hover:bg-white/5"
                    >
                      <Phone className="w-4 h-4" /> {PHONE_DISPLAY} · WhatsApp
                    </a>
                    <Link
                      to="/welcome"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-center px-3.5 py-2.5 mb-2 rounded-xl text-sm font-bold text-link border-[1.5px] border-link"
                    >
                      Log in
                    </Link>
                    <Link
                      to="/pricing"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl text-[15px] font-extrabold bg-brand text-white"
                    >
                      View programs <ArrowRight className="w-4 h-4" />
                    </Link>
                  </>
                )}
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
}
