import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AgentModal from './components/AgentModal';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import PathDetail from './pages/PathDetail';
import BuilderSession from './pages/BuilderSession';
import MyDashboard from './pages/MyDashboard';
import Welcome from './pages/Welcome';
import Pricing from './pages/Pricing';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import Legal from './pages/Legal';
import Certificates from './pages/Certificates';
import CertificateView from './pages/CertificateView';
import VerifyCertificate from './pages/VerifyCertificate';
import { useProgress } from './hooks/useProgress';
import { useCertificateClaims } from './hooks/useCertificateClaims';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

function AppShell() {
  const { user } = useAuth();
  const progress = useProgress(user);
  useCertificateClaims(user?.id, progress.completed);
  const [selectedAgent, setSelectedAgent] = useState(null);

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home progress={progress} onSelectAgent={setSelectedAgent} />} />
          <Route path="/catalog" element={<Catalog progress={progress} onSelectAgent={setSelectedAgent} />} />
          <Route path="/paths" element={<PathDetail progress={progress} />} />
          <Route path="/builder-1/:slug" element={<BuilderSession progress={progress} tier="Builder 1" />} />
          <Route path="/builder-2/:slug" element={<BuilderSession progress={progress} tier="Builder 2" />} />
          <Route path="/dashboard" element={<MyDashboard progress={progress} onSelectAgent={setSelectedAgent} />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/certificates" element={<Certificates progress={progress} />} />
          <Route path="/certificate/:id" element={<CertificateView />} />
          <Route path="/verify/:id" element={<VerifyCertificate />} />
          <Route path="/legal/:page" element={<Legal />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />

      {selectedAgent && (
        <AgentModal
          agent={selectedAgent}
          completed={progress.isCompleted(selectedAgent.id)}
          onToggleComplete={progress.toggleComplete}
          onClose={() => setSelectedAgent(null)}
          onSelectAgent={setSelectedAgent}
        />
      )}
    </div>
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
