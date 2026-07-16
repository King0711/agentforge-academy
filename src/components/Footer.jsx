import { Link } from 'react-router-dom';
import { Sparkles, Code2, AtSign, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0A0A1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <Link to="/" className="flex items-center gap-2 font-extrabold text-white text-lg mb-3">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0067B8] to-[#7C3AED] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </span>
            AgentForge Academy
          </Link>
          <p className="text-sm text-slate-400 leading-relaxed">
            Hands-on, project-based learning for building real-world AI agents — from your first
            chatbot to autonomous multi-agent systems.
          </p>
          <div className="flex items-center gap-3 mt-4">
            {[Code2, AtSign, Globe].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        <FooterCol
          title="Learn"
          links={[
            { label: 'Catalog', to: '/catalog' },
            { label: 'Learning Paths', to: '/paths' },
            { label: 'My Dashboard', to: '/dashboard' },
          ]}
        />
        <FooterCol
          title="Difficulty Levels"
          links={[
            { label: '🌱 Beginner', to: '/catalog?difficulty=Beginner' },
            { label: '⚡ Intermediate', to: '/catalog?difficulty=Intermediate' },
            { label: '🚀 Advanced', to: '/catalog?difficulty=Advanced' },
            { label: '🏆 World Class', to: '/catalog?difficulty=World Class' },
          ]}
        />
        <FooterCol
          title="Resources"
          links={[
            { label: 'Documentation', to: '#' },
            { label: 'Community', to: '#' },
            { label: 'Support', to: '#' },
          ]}
        />
      </div>

      <div className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} AgentForge Academy. Built for builders.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 className="text-white font-bold text-sm mb-3">{title}</h4>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.label}>
            <Link to={link.to} className="text-sm text-slate-400 hover:text-white transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
