import { useTestimonials } from '../hooks/useTestimonials';
import TestimonialCard from './TestimonialCard';

export default function TestimonialsSection() {
  const { testimonials, loading } = useTestimonials();

  if (loading || testimonials.length === 0) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-[5vw] pt-2 pb-14 max-w-6xl mx-auto">
      <h2 className="font-display font-extrabold text-2xl text-ink mb-4.5">What people are saying</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {testimonials.slice(0, 6).map((t) => (
          <TestimonialCard key={t.id} testimonial={t} />
        ))}
      </div>
    </div>
  );
}
