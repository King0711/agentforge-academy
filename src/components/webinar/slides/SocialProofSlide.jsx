import { motion } from 'framer-motion';
import SlideShell from '../SlideShell';
import TestimonialCard from '../../TestimonialCard';
import { useTestimonials } from '../../../hooks/useTestimonials';

export default function SocialProofSlide() {
  const { testimonials, loading } = useTestimonials();
  const featured = testimonials.slice(0, 3);

  return (
    <SlideShell>
      <h2 className="font-display font-extrabold text-[26px] sm:text-[38px] text-ink text-center tracking-[-.8px] mb-10">
        Real builders. Real results.
      </h2>

      {loading ? (
        <p className="text-center text-body">Loading…</p>
      ) : featured.length === 0 ? (
        <p className="text-center text-body max-w-md mx-auto">
          Presenter: narrate a testimonial live here — see the Pricing/FAQ pages for backup quotes if none have loaded.
        </p>
      ) : (
        <div className="grid sm:grid-cols-3 gap-4">
          {featured.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
              <TestimonialCard testimonial={t} />
            </motion.div>
          ))}
        </div>
      )}
    </SlideShell>
  );
}
