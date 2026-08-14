import { useEffect } from 'react';
import { Routes, Route, Outlet, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLiveSessions } from '../hooks/useLiveSessions';
import DashboardSidebar, { DashboardMobileNav } from '../components/dashboard/DashboardSidebar';
import DashboardTopBar from '../components/dashboard/DashboardTopBar';
import JumpBackInCard from '../components/dashboard/JumpBackInCard';
import Home from './dashboard/Home';
import LiveSessions from './dashboard/LiveSessions';
import Replays from './dashboard/Replays';
import Account from './dashboard/Account';
import Help from './dashboard/Help';

// Layout shell for every /dashboard/* page — sidebar + top bar + a
// persistent right-hand "Jump back in" card, mirroring Admin.jsx's
// nested-Routes-within-a-lazy-loaded-page pattern. liveSessions is fetched
// once here (not per sub-page) and threaded to children via Outlet context,
// same reasoning as Admin's shared showToast.
function DashboardOutlet({ context }) {
  return <Outlet context={context} />;
}

export default function StudentDashboard({ progress, onSelectAgent }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const liveSessions = useLiveSessions(user);

  // Anonymous visitors get bounced to /welcome — this shell used to render
  // for anyone regardless of auth state, so a signed-out visitor hitting
  // /dashboard directly saw the full sidebar/topbar chrome with nothing
  // behind it. Waits on `loading` so a real logged-in user isn't
  // redirected during the brief window before the session is restored.
  useEffect(() => {
    if (loading) return;
    if (!user) navigate('/welcome', { replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <DashboardSidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <DashboardTopBar />
        <div className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-20 lg:pb-6 grid lg:grid-cols-[1fr_300px] gap-8 items-start">
          <main className="min-w-0">
            <Routes>
              <Route element={<DashboardOutlet context={{ progress, onSelectAgent, liveSessions }} />}>
                <Route index element={<Home />} />
                <Route path="live-sessions" element={<LiveSessions />} />
                <Route path="replays" element={<Replays />} />
                <Route path="account" element={<Account />} />
                <Route path="help" element={<Help />} />
              </Route>
            </Routes>
          </main>
          <aside className="hidden lg:block sticky top-24">
            <JumpBackInCard nextSession={liveSessions.nextSession} />
          </aside>
        </div>
      </div>
      <DashboardMobileNav />
    </div>
  );
}
