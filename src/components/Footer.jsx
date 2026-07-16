import { Link } from 'react-router-dom';
import { Code2, AtSign, Globe } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050510]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <Link to="/" className="flex items-center gap-3 mb-3">
            <img src="/logo.svg" alt="Social Dev Technologies" className="w-10 h-10 object-contain rounded-lg" />
            <div>
              <p className="font-extrabold text-white text-base leading-tight">Social Dev</p>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Technologies</p>
            </div>
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
            { label: 'Pricing', to: '/pricing' },
            { label: 'Live Classes', to: '/pricing' },
            { label: 'Community', to: '#' },
            { label: 'Support', to: '#' },
          ]}
        />
      </div>

      <div className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Social Dev Technologies. Built for builders.
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
