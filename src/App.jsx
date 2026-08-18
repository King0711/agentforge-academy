import { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProfileInfoModal from './components/ProfileInfoModal';
import WhatsAppFloatButton from './components/WhatsAppFloatButton';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import PathDetail from './pages/PathDetail';
import BuilderSession from './pages/BuilderSession';
import Welcome from './pages/Welcome';
import Pricing from './pages/Pricing';
import Legal from './pages/Legal';
import About from './pages/About';
import FAQ from './pages/FAQ';
import WhatsAppBotGuide from './pages/WhatsAppBotGuide';
import AIBuilder from './pages/AIBuilder';
import Builder1Guide from './pages/Builder1Guide';
import PortfolioSessionGuide from './pages/PortfolioSessionGuide';
import News from './pages/News';
import NewsArticle from './pages/NewsArticle';
import GuidesIndex from './pages/guides/GuidesIndex';
import GuidePage from './pages/guides/GuidePage';
import NotFound from './pages/NotFound';
import { useProgress } from './hooks/useProgress';
import { useCertificateClaims } from './hooks/useCertificateClaims';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProfileInfoProvider } from './context/ProfileInfoContext';

// scripts/prerender.mjs snapshots every route in scripts/prerender-routes.mjs
// (Home, Catalog, PathDetail, BuilderSession, Welcome, Pricing, Legal, About,
// FAQ) as static HTML that main.jsx hydrates on top of. React's Suspense
// hydration relies on special dehydrated-boundary markers that only a real
// Suspense-aware SSR pass emits — a plain Puppeteer DOM snapshot doesn't have
// them, so wrapping ANY of those routes' elements in <Suspense> (even ones
// that don't actually suspend) throws a React #418 hydration error on every
// visit. Those routes above are therefore kept as ordinary eager imports.
// Only the auth-gated pages below are safe to lazy-load — they're excluded
// from prerendering (nothing to index client-side) and always start from an
// empty #root via createRoot, so there's no static markup to reconcile
// against and no hydration boundary problem. (NotFound stays a normal eager
// import — it's already statically pulled in by BuilderSession.jsx and
// CertificateView.jsx as an inline fallback UI, so lazy-loading it here
// wouldn't shrink the bundle, just add a pointless Suspense boundary.)
const AgentModal = lazy(() => import('./components/AgentModal'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const Admin = lazy(() => import('./pages/Admin'));
const Certificates = lazy(() => import('./pages/Certificates'));
const CertificateView = lazy(() => import('./pages/CertificateView'));
const VerifyCertificate = lazy(() => import('./pages/VerifyCertificate'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
// Full-screen keynote — deliberately excluded from prerendering (keyboard
// nav + fullscreen state have no business being static-snapshotted) and
// renders its own chrome, so AppShell below skips Navbar/Footer for it.
const Webinar = lazy(() => import('./pages/Webinar'));

function AppShell() {
  const { user } = useAuth();
  const progress = useProgress(user);
  useCertificateClaims(user?.id, progress.completed);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const location = useLocation();
  const isWebinar = location.pathname === '/webinar';
  // The student dashboard renders its own sidebar/top-bar chrome (see
  // StudentDashboard.jsx) instead of the site Navbar/Footer — same
  // suppression pattern as the webinar keynote.
  const isDashboard = location.pathname.startsWith('/dashboard');
  const hideChrome = isWebinar || isDashboard;

  return (
    <ProfileInfoProvider>
      <div className="min-h-screen flex flex-col bg-bg">
        {!hideChrome && <Navbar />}
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home progress={progress} onSelectAgent={setSelectedAgent} />} />
            <Route path="/catalog" element={<Catalog progress={progress} onSelectAgent={setSelectedAgent} />} />
            <Route path="/paths" element={<PathDetail progress={progress} />} />
            <Route path="/builder-1/:slug" element={<BuilderSession progress={progress} tier="Builder 1" />} />
            <Route path="/builder-2/:slug" element={<BuilderSession progress={progress} tier="Builder 2" />} />
            <Route
              path="/dashboard/*"
              element={
                <Suspense fallback={null}>
                  <StudentDashboard progress={progress} onSelectAgent={setSelectedAgent} />
                </Suspense>
              }
            />
            <Route path="/welcome" element={<Welcome />} />
            <Route
              path="/reset-password"
              element={
                <Suspense fallback={null}>
                  <ResetPassword />
                </Suspense>
              }
            />
            <Route path="/pricing" element={<Pricing />} />
            <Route
              path="/webinar"
              element={
                <Suspense fallback={null}>
                  <Webinar />
                </Suspense>
              }
            />
            <Route
              path="/admin/*"
              element={
                <Suspense fallback={null}>
                  <Admin />
                </Suspense>
              }
            />
            <Route
              path="/certificates"
              element={
                <Suspense fallback={null}>
                  <Certificates progress={progress} />
                </Suspense>
              }
            />
            <Route
              path="/certificate/:id"
              element={
                <Suspense fallback={null}>
                  <CertificateView />
                </Suspense>
              }
            />
            <Route
              path="/verify/:id"
              element={
                <Suspense fallback={null}>
                  <VerifyCertificate />
                </Suspense>
              }
            />
            <Route path="/legal/:page" element={<Legal />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/whatsapp-bot-guide" element={<WhatsAppBotGuide />} />
            <Route path="/ai-builder" element={<AIBuilder />} />
            <Route path="/builder-1-guide" element={<Builder1Guide />} />
            <Route path="/session/build-real-product" element={<PortfolioSessionGuide />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:slug" element={<NewsArticle />} />
            {/* Evergreen explainer section — DB-backed, so one route handles
                every guide. Served by api/guide-article.js for crawlers (same
                SSR pattern as /news/:slug), not prerendered. */}
            <Route path="/guides" element={<GuidesIndex />} />
            <Route path="/guides/:slug" element={<GuidePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        {!hideChrome && <Footer />}
        {!hideChrome && <WhatsAppFloatButton />}

        {selectedAgent && (
          <Suspense fallback={null}>
            <AgentModal
              agent={selectedAgent}
              completed={progress.isCompleted(selectedAgent.id)}
              onToggleComplete={progress.toggleComplete}
              onClose={() => setSelectedAgent(null)}
              onSelectAgent={setSelectedAgent}
            />
          </Suspense>
        )}
        <ProfileInfoModal />
      </div>
    </ProfileInfoProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
