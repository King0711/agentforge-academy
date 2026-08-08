import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  MessageSquareText, Star, CheckCircle2, XCircle, Trash2, Loader2, AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

function TestimonialRow({ t, actionLoading, onApprove, onReject, onFeatureToggle, onDelete }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 px-5 py-4 border-b border-border-soft last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-semibold text-ink text-sm">{t.display_name}</span>
          <span className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-3 h-3 ${i < t.rating ? 'fill-yellow text-yellow' : 'fill-gray-200 text-gray-200'}`} />
            ))}
          </span>
          {t.source === 'google_business' ? (
            <span className="text-[11px] font-semibold text-gray-500">Google review</span>
          ) : (
            <span className="text-[11px] font-semibold text-brand">Student submission</span>
          )}
          {t.approved ? (
            <span className="text-[11px] font-bold text-green bg-[#EAFAF1] dark:bg-green/10 px-2 py-0.5 rounded-full">Live</span>
          ) : (
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-[#FEF9E7] dark:bg-amber-500/10 px-2 py-0.5 rounded-full">Pending</span>
          )}
          {t.featured && (
            <span className="text-[11px] font-bold text-brand bg-[#F3EBFF] dark:bg-brand/15 px-2 py-0.5 rounded-full">Featured</span>
          )}
        </div>
        <p className="text-sm text-body leading-relaxed">{t.body}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
        <button
          onClick={() => (t.approved ? onReject(t.id) : onApprove(t.id))}
          disabled={!!actionLoading}
          className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
            t.approved
              ? 'bg-[#FDEEF4] dark:bg-rose/10 text-rose hover:bg-rose/10'
              : 'bg-green text-white hover:brightness-95'
          }`}
        >
          {actionLoading === t.id + '_approve' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : t.approved ? (
            <>
              <XCircle className="w-3 h-3" /> Unpublish
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3" /> Approve
            </>
          )}
        </button>
        <button
          onClick={() => onFeatureToggle(t.id, t.featured)}
          disabled={!!actionLoading || !t.approved}
          title={t.approved ? 'Toggle featured' : 'Approve first'}
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:bg-[#F3EBFF] dark:hover:bg-brand/15 hover:text-brand transition-colors disabled:opacity-40"
        >
          {t.featured ? 'Unfeature' : 'Feature'}
        </button>
        <button
          onClick={() => onDelete(t.id)}
          disabled={!!actionLoading}
          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#FAF8FF] dark:bg-white/5 text-body-strong hover:bg-[#FDEEF4] dark:hover:bg-rose/10 hover:text-rose transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default function AdminTestimonials() {
  const { showToast } = useOutletContext();
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');

  const fetchTestimonials = useCallback(async () => {
    setTestimonialsLoading(true);
    try {
      const { data, error: err } = await supabase.rpc('admin_list_testimonials');
      if (err) throw err;
      setTestimonials(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load testimonials.');
    } finally {
      setTestimonialsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const setTestimonialApproved = async (id, approved) => {
    setActionLoading(id + '_approve');
    try {
      const { error: err } = await supabase.rpc('admin_set_testimonial_approved', {
        testimonial_id: id,
        set_approved: approved,
      });
      if (err) throw err;
      setTestimonials((prev) => prev.map((t) => (t.id === id ? { ...t, approved } : t)));
      showToast(approved ? 'Testimonial published.' : 'Testimonial unpublished.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleTestimonialFeatured = async (id, currentFeatured) => {
    setActionLoading(id + '_feature');
    try {
      const { error: err } = await supabase.rpc('admin_set_testimonial_featured', {
        testimonial_id: id,
        set_featured: !currentFeatured,
      });
      if (err) throw err;
      setTestimonials((prev) => prev.map((t) => (t.id === id ? { ...t, featured: !currentFeatured } : t)));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteTestimonial = async (id) => {
    if (!window.confirm('Delete this testimonial permanently?')) return;
    setActionLoading(id + '_delete');
    try {
      const { error: err } = await supabase.rpc('admin_delete_testimonial', { testimonial_id: id });
      if (err) throw err;
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
      showToast('Testimonial deleted.');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display text-3xl font-extrabold text-ink flex items-center gap-3">
          <MessageSquareText className="w-7 h-7 text-brand" />
          Testimonials
        </h1>
        {testimonials.some((t) => !t.approved) && (
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-[#FEF9E7] dark:bg-amber-500/10 px-2.5 py-1 rounded-full">
            {testimonials.filter((t) => !t.approved).length} pending
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-rose bg-[#FDEEF4] dark:bg-rose/10 border border-rose/20 rounded-lg px-4 py-3 mb-6">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-border-soft overflow-hidden bg-white dark:bg-[#181818]">
        {testimonialsLoading ? (
          <div className="px-5 py-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand mx-auto" />
          </div>
        ) : testimonials.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400 text-sm">No testimonials yet.</div>
        ) : (
          testimonials.map((t) => (
            <TestimonialRow
              key={t.id}
              t={t}
              actionLoading={actionLoading}
              onApprove={(id) => setTestimonialApproved(id, true)}
              onReject={(id) => setTestimonialApproved(id, false)}
              onFeatureToggle={toggleTestimonialFeatured}
              onDelete={deleteTestimonial}
            />
          ))
        )}
      </div>
    </div>
  );
}
