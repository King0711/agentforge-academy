import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] bg-[#0A0A1A] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <p className="text-8xl font-extrabold bg-gradient-to-r from-[#0067B8] to-[#7C3AED] bg-clip-text text-transparent mb-4">404</p>
        <h1 className="text-2xl font-extrabold text-white mb-3">Page not found</h1>
        <p className="text-slate-400 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="flex items-center justify-center gap-2 bg-[#0067B8] hover:bg-[#0078D4] text-white font-bold px-6 py-3 rounded-lg transition-colors">
            <Home className="w-4 h-4" /> Back to Home
          </Link>
          <Link to="/catalog" className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-6 py-3 rounded-lg transition-colors">
            <Compass className="w-4 h-4" /> Browse Catalog
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
