import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AgentModal from './components/AgentModal';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import PathDetail from './pages/PathDetail';
import MyDashboard from './pages/MyDashboard';
import Welcome from './pages/Welcome';
import Pricing from './pages/Pricing';
import { useProgress } from './hooks/useProgress';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppShell() {
  const { user } = useAuth();
  const progress = useProgress(user);
  const [selectedAgent, setSelectedAgent] = useState(null);

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A1A]">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home progress={progress} onSelectAgent={setSelectedAgent} />} />
          <Route path="/catalog" element={<Catalog progress={progress} onSelectAgent={setSelectedAgent} />} />
          <Route path="/paths" element={<PathDetail progress={progress} />} />
          <Route path="/dashboard" element={<MyDashboard progress={progress} onSelectAgent={setSelectedAgent} />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/pricing" element={<Pricing />} />
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
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
