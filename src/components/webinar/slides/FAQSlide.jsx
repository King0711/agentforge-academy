import { motion } from 'framer-motion';
import { CircleHelp } from 'lucide-react';
import SlideShell from '../SlideShell';

// Answers grounded in real site facts (Pricing.jsx, About.jsx principles) —
// no softened or invented claims, since this slide's whole job is to be
// honest enough that it actually clears objections instead of dodging them.
const FAQS = [
  { q: 'Do I need coding experience?', a: "No. Every build starts from a ready-to-use prompt — you're directing Claude, not writing software from scratch." },
  { q: "What if I've never programmed at all?", a: "That's who Builder 1 is built for. If you can follow steps and copy-paste, you can complete these sessions." },
  { q: "What if I don't know what to build?", a: 'That\'s why every Builder 1 session is project-based — you\'re never starting from a blank page, you\'re following a real, guided build.' },
  { q: "What if I'm busy?", a: 'Fully self-paced — 1.5 to 3 hours per session, 6 months of access. No live cohort attendance required.' },
  { q: 'Why do I need Claude Pro?', a: "You're using a real, production AI tool, not a toy sandbox — the free tier hits limits fast during an actual build." },
  { q: 'What support do I get?', a: "Direct support — reach us and get an answer. This isn't a forum you're left alone in." },
  { q: 'What if I get stuck?', a: "You won't be building alone. If you get stuck, you can reach out to our support team and we'll help you move forward." },
  { q: 'What if AI changes?', a: 'Builder 1 teaches principles, not memorizing tools — how to find a problem, prompt it, and ship it. That doesn\'t expire when a new model ships.' },
];

export default function FAQSlide() {
  return (
    <SlideShell>
      <h2 className="font-display font-extrabold text-[26px] sm:text-[38px] text-ink text-center tracking-[-.8px] mb-9">
        Before we go further — your questions
      </h2>

      <div className="grid sm:grid-cols-2 gap-3.5 max-w-3xl mx-auto">
        {FAQS.map((item, i) => (
          <motion.div
            key={item.q}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.07 * i }}
            className="bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-2xl p-4.5"
          >
            <div className="flex items-start gap-2.5 mb-1.5">
              <CircleHelp className="w-4 h-4 text-brand mt-0.5 flex-shrink-0" />
              <span className="font-display font-bold text-[14px] text-ink">{item.q}</span>
            </div>
            <p className="text-[13px] text-body leading-relaxed m-0 pl-6.5">{item.a}</p>
          </motion.div>
        ))}
      </div>
    </SlideShell>
  );
}
