import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, Users, BookOpen, Award,
  Quote, ChevronRight, Zap, Globe, Video,
} from 'lucide-react';
import HeroSection from '../components/HeroSection';
import AgentCard from '../components/AgentCard';
import { agents } from '../data/agents';
import { departments } from '../data/departments';
import { usePro } from '../hooks/usePro';

/* ─── data ─────────────────────────────────────────────── */

const benefits = [
  { icon: BookOpen, text: 'Learn from expert-crafted sessions with copy-paste Claude prompts' },
  { icon: Award, text: 'Build portfolio-ready AI agent projects in every session' },
  { icon: Users, text: 'Join a community of 1,500+ builders across Africa and beyond' },
];

const companyLogos = [
  'Google', 'Microsoft', 'Meta', 'Amazon', 'Flutterwave',
  'Paystack', 'Interswitch', 'Andela', 'Konga', 'Jumia',
];

const stats = [
  { value: '#1', label: 'AI Skills Platform', sublabel: 'in West Africa', color: '#0067B8' },
  { value: '70%', label: 'of graduates', sublabel: 'land AI-related roles within 3 months', color: '#7C3AED' },
  { value: '40K+', label: 'XP points', sublabel: 'available across all sessions', color: '#F59E0B' },
  { value: '1,500+', label: 'Active builders', sublabel: 'in our community', color: '#10B981' },
];

const testimonials = [
  {
    name: 'Chukwuemeka A.',
    role: 'Data Analyst, Lagos',
    avatar: 'C',
    color: '#0067B8',
    text: 'I built my first AI agent in week 1 and already used it to automate my team\'s reporting. Social Dev Technologies changed how I work forever.',
  },
  {
    name: 'Fatima B.',
    role: 'Product Manager, Abuja',
    avatar: 'F',
    color: '#7C3AED',
    text: 'The live cohort was intensive but worth every naira. Having an instructor who understood our context (African businesses) made all the difference.',
  },
  {
    name: 'Oluwaseun K.',
    role: 'Software Developer, Ibadan',
    avatar: 'O',
    color: '#10B981',
    text: 'I went from zero AI knowledge to deploying a customer support agent for my client in 30 days. The step-by-step format is brilliant.',
  },
];

const instructors = [
  { name: 'Samuel King', role: 'AI & Automation Lead', avatar: 'S', color: '#0067B8', bio: '5+ years building AI systems. Former tech lead at multiple African startups.' },
  { name: 'Amara Okonkwo', role: 'ML Engineer & Educator', avatar: 'A', color: '#7C3AED', bio: 'Google-certified educator. Passionate about democratizing AI skills across Africa.' },
  { name: 'David Mensah', role: 'Product & AI Strategist', avatar: 'D', color: '#F59E0B', bio: 'Helped 200+ professionals integrate AI into their workflows and careers.' },
];

const deptTabs = [
  { id: 'all', label: 'All' },
  ...departments.filter((d) => d.id !== 'all').slice(0, 6),
];

/* ─── component ─────────────────────────────────────────── */

export default function Home({ progress, onSelectAgent }) {
  const { isPro } = usePro();
  const [activeDept, setActiveDept] = useState('all');
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  const popularAgents = [...agents].sort((a, b) => b.popularity - a.popularity);
  const filteredAgents = activeDept === 'all'
    ? popularAgents.slice(0, 8)
    : popularAgents.filter((a) => a.department === activeDept).slice(0, 8);

  return (
    <div className="bg-[#050510]">

      {/* ── 1. Hero ── */}
      <HeroSection />

      {/* ── 2. Benefits bar ── */}
      <section className="bg-white/[0.02] border-y border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold text-slate-400 mb-6 uppercase tracking-widest">
            Join the course adapted to your needs
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {benefits.map((b) => (
              <div key={b.text} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#0067B8]/15 border border-[#0067B8]/20 flex items-center justify-center flex-shrink-0">
                  <b.icon className="w-4 h-4 text-[#3FA9F5]" />
                </div>
                <p className="text-sm text-slate-300 leading-tight">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Course catalogue with department tabs ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-1">Browse by Department</h2>
            <p className="text-slate-400">Pick a focus area and start building immediately</p>
          </div>
          <Link to="/catalog" className="flex items-center gap-1 text-sm font-semibold text-[#3FA9F5] hover:gap-2 transition-all flex-shrink-0">
            View full catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Dept filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-none">
          {deptTabs.map((d) => (
            <button
              key={d.id}
              onClick={() => setActiveDept(d.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                activeDept === d.id
                  ? 'bg-[#0067B8] border-[#0067B8] text-white'
                  : 'border-white/15 text-slate-400 hover:text-white hover:border-white/30 bg-white/[0.03]'
              }`}
            >
              {d.icon ? `${d.icon} ` : ''}{d.name || d.label}
            </button>
          ))}
        </div>

        {/* Agent cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredAgents.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <AgentCard
                agent={agent}
                completed={progress.isCompleted(agent.id)}
                onClick={() => onSelectAgent(agent)}
                isPro={isPro}
              />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 4. "In-demand skills" gradient CTA section ── */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] via-[#0067B8] to-[#050510]" />
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white mb-4">
            <Zap className="w-3.5 h-3.5" />
            AI is the most in-demand skill of 2025
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight">
            Learn the most in-demand skills,{' '}
            <span className="underline decoration-amber-400 underline-offset-4">including AI.</span>
          </h2>
          <p className="text-slate-200 text-lg mb-8 max-w-2xl mx-auto">
            Our platform is built around real-world AI agent projects you can deploy immediately —
            not videos you watch and forget. Every session produces something you can show.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/welcome"
              className="flex items-center gap-2 bg-white text-[#0A0A1A] font-bold px-8 py-4 rounded-xl transition-colors text-base hover:bg-slate-100 shadow-lg"
            >
              Join for Free
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              to="/pricing"
              className="flex items-center gap-2 border border-white/30 text-white font-bold px-8 py-4 rounded-xl transition-colors text-base hover:bg-white/10"
            >
              <Video className="w-5 h-5" />
              Enroll in Live Classes
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. Hired by companies ── */}
      <section className="py-16 border-y border-white/10 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-widest mb-10">
            Our graduates are hired at leading companies
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            {companyLogos.map((name) => (
              <div key={name} className="flex items-center justify-center h-10 px-4 opacity-40 hover:opacity-70 transition-opacity">
                <span className="text-white font-extrabold text-sm uppercase tracking-widest">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Award / recognition ── */}
      <section className="py-16 bg-[#050510]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
              Social Dev Technologies is among{' '}
              <span className="bg-gradient-to-r from-[#0067B8] to-[#7C3AED] bg-clip-text text-transparent">
                Africa's leading tech education companies
              </span>
            </h2>
            <p className="text-slate-400 text-base mb-6">
              We have been placed among the top technology education platforms serving Africa —
              committed to our learners, obsessed with their success.
            </p>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 bg-[#0067B8] hover:bg-[#0078D4] text-white font-bold px-6 py-3 rounded-lg transition-colors"
            >
              Explore sessions <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {/* Recognition badge */}
          <div className="flex-shrink-0 w-56 h-56 rounded-3xl border border-[#0067B8]/30 bg-gradient-to-br from-[#0067B8]/20 to-[#7C3AED]/20 flex flex-col items-center justify-center text-center p-6">
            <Globe className="w-10 h-10 text-[#3FA9F5] mb-3" />
            <p className="text-3xl font-extrabold text-white">2025</p>
            <p className="text-xs font-bold text-[#3FA9F5] uppercase tracking-widest mt-1">EdTech</p>
            <p className="text-xs text-slate-400 mt-1">Top AI Education Platform — West Africa</p>
          </div>
        </div>
      </section>

      {/* ── 7. Stats ── */}
      <section className="py-16 bg-[#0067B8]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-white/70 text-sm font-semibold uppercase tracking-widest mb-10">
            Join the leading Digital School in Africa
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-4xl sm:text-5xl font-extrabold text-white mb-1">{s.value}</p>
                <p className="text-sm font-bold text-white/90">{s.label}</p>
                <p className="text-xs text-white/60 mt-0.5 leading-tight">{s.sublabel}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              to="/welcome"
              className="inline-flex items-center gap-2 bg-white text-[#0067B8] font-bold px-8 py-3.5 rounded-lg transition-colors hover:bg-slate-100"
            >
              Join Now — It's Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 8. Testimonials ── */}
      <section className="py-20 bg-[#050510]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">They boosted their career. You can too.</h2>
            <p className="text-slate-400">Our 1,500+ builders started where you are. Here's what they say after finishing.</p>
          </div>

          <div className="relative">
            <motion.div
              key={testimonialIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center max-w-2xl mx-auto"
            >
              <Quote className="w-8 h-8 text-[#0067B8] mx-auto mb-4" />
              <p className="text-lg text-slate-200 leading-relaxed mb-6">"{testimonials[testimonialIdx].text}"</p>
              <div className="flex items-center justify-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                  style={{ background: testimonials[testimonialIdx].color }}
                >
                  {testimonials[testimonialIdx].avatar}
                </div>
                <div className="text-left">
                  <p className="font-bold text-white text-sm">{testimonials[testimonialIdx].name}</p>
                  <p className="text-xs text-slate-400">{testimonials[testimonialIdx].role}</p>
                </div>
              </div>
            </motion.div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialIdx(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${i === testimonialIdx ? 'bg-[#0067B8]' : 'bg-white/20 hover:bg-white/40'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. Instructors ── */}
      <section className="py-20 bg-white/[0.02] border-y border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
                Learn with highly-qualified instructors
              </h2>
              <p className="text-slate-400 text-base mb-6 leading-relaxed">
                Our instructors are practitioners — people who build AI systems for real businesses
                every day. They know the shortcuts, the pitfalls, and the patterns that work.
              </p>
              <Link
                to="/welcome"
                className="inline-flex items-center gap-2 bg-[#0067B8] hover:bg-[#0078D4] text-white font-bold px-6 py-3 rounded-lg transition-colors"
              >
                Meet the team <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {instructors.map((ins) => (
                <div key={ins.name} className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-white text-lg flex-shrink-0"
                    style={{ background: ins.color }}
                  >
                    {ins.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-white">{ins.name}</p>
                    <p className="text-xs text-slate-400 font-medium mb-0.5">{ins.role}</p>
                    <p className="text-xs text-slate-500 leading-tight">{ins.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. Community / waitlist form ── */}
      <section className="py-20 bg-[#050510]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">Join a community of leaders and learners</h2>
          <p className="text-slate-400 mb-10">
            Get updates on new sessions, live cohorts, and exclusive resources — delivered straight to your inbox.
          </p>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="First name"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0067B8]"
              />
              <input
                type="text"
                placeholder="Last name"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0067B8]"
              />
            </div>
            <input
              type="email"
              placeholder="Email address"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0067B8] mb-4"
            />
            <select
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0067B8] mb-4"
              defaultValue=""
            >
              <option value="" disabled>I'm interested in...</option>
              <option value="self">Self-paced learning (Free / Pro)</option>
              <option value="live">Live instructor-led cohort</option>
              <option value="both">Both</option>
            </select>
            <Link
              to="/welcome"
              className="w-full flex items-center justify-center gap-2 bg-[#0067B8] hover:bg-[#0078D4] text-white font-bold py-3.5 rounded-lg transition-colors"
            >
              Join the Community
            </Link>
            <p className="text-xs text-slate-600 mt-3">No spam, ever. Unsubscribe anytime.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
