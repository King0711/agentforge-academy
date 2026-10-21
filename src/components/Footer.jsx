import { Link, useLocation } from 'react-router-dom';
import { Phone } from 'lucide-react';

export default function Footer() {
  const { pathname } = useLocation();
  // The AI Agent Mastery sales page keeps only legal links, FAQ and a contact
  // line (founder request 2026-10-18). Contact is WhatsApp, not email: the
  // apex domain has no MX record, so mail to support@ bounces.
  if (pathname.replace(/\/+$/, '') === '/ai-agent-mastery') {
    return (
      <footer className="section-dark mt-auto px-4 sm:px-6 lg:px-8 py-7">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13.5px] text-[#B7C3D1]">
          <Link to="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link to="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
          <a href="https://wa.me/2349066006963" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Contact us on WhatsApp</a>
        </div>
        <div className="max-w-6xl mx-auto mt-4 text-center text-[12.5px] text-[#8A96A5]">
          © <span>{new Date().getFullYear()}</span> Social Dev Technologies. All rights reserved.
        </div>
      </footer>
    );
  }

  return (
    // A permanent dark band even in the light theme: section-dark paints the
    // brand-blue gradient and flips the text tokens, so it never inverts.
    <footer className="section-dark section-grad mt-auto px-4 sm:px-6 lg:px-[5vw] pt-16 md:pt-20 pb-8">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-end lg:justify-between gap-7 pb-12 md:pb-14 mb-12 border-b border-white/15">
        <p className="t-section text-white max-w-[14em]">Learn AI by building real agents.</p>
        <a
          href="https://wa.me/2349066006963"
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary btn-lg w-full sm:w-auto flex-shrink-0"
        >
          <Phone className="w-5 h-5" /> Chat on WhatsApp
        </a>
      </div>
      <div className="max-w-7xl mx-auto flex flex-wrap justify-between gap-10">
        <div className="max-w-xs">
          <Link to="/" className="flex items-center gap-3 mb-4">
            <img src="/logo-icon.webp" alt="" className="w-10 h-10 object-contain rounded-xl bg-white p-0.5" />
            <span className="font-display font-extrabold text-base text-white">Social Dev Technologies</span>
          </Link>
          <p className="text-sm text-white/75 leading-relaxed">
            Learn AI by building real agents: hands-on sessions, real prompts, a portfolio that gets you hired.
          </p>
        </div>

        <div className="flex gap-12 sm:gap-20 flex-wrap">
          <FooterCol
            title="Platform"
            links={[
              { label: 'AI Agent Mastery', to: '/ai-agent-mastery' },
              { label: 'Vibe Coding Bootcamp', to: '/vibe-coding' },
              { label: 'Become an AI Builder', to: '/ai-builder' },
              { label: 'Catalog', to: '/catalog' },
              { label: 'Agent Guides', to: '/guides' },
              { label: 'Learning Paths', to: '/paths' },
              { label: 'Pricing', to: '/pricing' },
              { label: 'Home', to: '/' },
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              { label: 'About', to: '/about' },
              { label: 'FAQ', to: '/faq' },
              { label: 'Terms of Service', to: '/legal/terms' },
              { label: 'Privacy Policy', to: '/legal/privacy' },
            ]}
          />
          <div>
            <div className="t-eyebrow text-yellow mb-4">Connect</div>
            <div className="flex flex-col gap-3 text-[14.5px] text-white/75">
              <a href="https://www.linkedin.com/company/social-dev-technologies/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
              <a href="https://www.facebook.com/SocialDevTech/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Facebook</a>
              <a href="https://wa.me/2349066006963" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">WhatsApp</a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-white/15 mt-12 pt-5 text-[12.5px] text-white/60">
        © <span>{new Date().getFullYear()}</span> Social Dev Technologies. All rights reserved.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <div className="t-eyebrow text-yellow mb-4">{title}</div>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link to={link.to} className="text-[14.5px] text-white/75 hover:text-white transition-colors">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
