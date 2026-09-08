import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { ChevronLeft, ChevronRight, Lock, Loader2, CheckCircle2, ClipboardList, Sparkles, ArrowLeft, BookOpen } from 'lucide-react';
import { usePro } from '../hooks/usePro';
import { useVibeCodingContent } from '../hooks/useVibeCodingContent';
import NotFound from './NotFound';

const TOTAL_CLASSES = 8;

export default function VibeCodingClass() {
  const { classNumber: classNumberParam } = useParams();
  const classNumber = Number(classNumberParam);
  const { hasVibeCoding, proLoading } = usePro();
  const { content, loading, locked } = useVibeCodingContent(classNumber);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [classNumber]);

  useEffect(() => {
    if (!content) return;
    const prevTitle = document.title;
    document.title = `Class ${classNumber} — ${content.title} | Vibe Coding Bootcamp`;
    return () => {
      document.title = prevTitle;
    };
  }, [content, classNumber]);

  if (!Number.isInteger(classNumber) || classNumber < 1 || classNumber > TOTAL_CLASSES) {
    return <NotFound />;
  }

  const prevClass = classNumber > 1 ? classNumber - 1 : null;
  const nextClass = classNumber < TOTAL_CLASSES ? classNumber + 1 : null;
  const showPaywall = !proLoading && !hasVibeCoding;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <Link
        to="/vibe-coding/classes"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-body hover:text-brand transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> All classes
      </Link>

      {(loading || proLoading) && (
        <div className="flex items-center justify-center py-16 text-body gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading class…
        </div>
      )}

      {!loading && !proLoading && (showPaywall || locked) && (
        <div className="flex flex-col items-center text-center gap-3 py-16 border-2 border-dashed border-border rounded-2xl mb-8">
          <Lock className="w-8 h-8 text-brand" />
          <p className="font-bold text-ink">This class is Vibe Coding Bootcamp content</p>
          <p className="text-sm text-body max-w-sm">Join the launch cohort to unlock all 8 classes, the prompt library, and live class links.</p>
          <Link
            to="/vibe-coding#pricing"
            className="mt-2 inline-flex items-center gap-2 bg-brand hover:bg-brand-deep text-white font-bold px-5 py-2.5 rounded-xl transition-colors"
          >
            See the offer
          </Link>
        </div>
      )}

      {!loading && !proLoading && !showPaywall && !locked && content && (
        <>
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-[1.5px] border-border-soft p-6 sm:p-8 mb-8"
            style={{ background: 'linear-gradient(135deg, #F3EBFF, #FBFAFF)' }}
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand bg-white dark:bg-[#181818] border border-brand/25 rounded-full px-3 py-1.5 mb-4">
              Class {classNumber} of {TOTAL_CLASSES}
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink leading-tight">{content.title}</h1>

            {content.topics?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {content.topics.map((t) => (
                  <span key={t} className="text-xs font-semibold text-body-strong bg-white dark:bg-[#181818] border border-border-soft rounded-full px-2.5 py-1">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </m.div>

          {content.session?.sections?.map((section) => (
            <section key={section.heading} className="mb-7">
              <h2 className="font-display font-bold text-lg text-ink mb-2.5">{section.heading}</h2>
              {section.body && <p className="text-[14.5px] text-body leading-relaxed mb-2.5">{section.body}</p>}
              {section.items?.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-[13.5px] text-body-strong">
                      <CheckCircle2 className="w-4 h-4 text-green mt-0.5 flex-shrink-0" /> <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {content.session?.project && (
            <section className="mb-7 rounded-2xl border-[1.5px] border-brand/30 bg-[#FAF7FF] dark:bg-[#181022] p-5">
              <h2 className="font-display font-bold text-lg text-ink mb-1.5">Project: {content.session.project.name}</h2>
              <p className="text-[14.5px] text-body leading-relaxed mb-3">{content.session.project.description}</p>
              {content.session.project.features?.length > 0 && (
                <>
                  <p className="text-[11.5px] font-bold uppercase tracking-wide text-brand mb-1.5">Features</p>
                  <ul className="flex flex-wrap gap-2 mb-3">
                    {content.session.project.features.map((f) => (
                      <li key={f} className="text-xs font-semibold text-body-strong bg-white dark:bg-[#141319] border border-border-soft rounded-full px-2.5 py-1">{f}</li>
                    ))}
                  </ul>
                </>
              )}
              {content.session.project.concepts?.length > 0 && (
                <>
                  <p className="text-[11.5px] font-bold uppercase tracking-wide text-brand mb-1.5">Concepts</p>
                  <ul className="flex flex-wrap gap-2">
                    {content.session.project.concepts.map((c) => (
                      <li key={c} className="text-xs font-semibold text-body-strong bg-white dark:bg-[#141319] border border-border-soft rounded-full px-2.5 py-1">{c}</li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}

          {content.session?.keyLesson && (
            <section className="mb-7 flex items-start gap-2.5 text-[13.5px] text-brand bg-[#F3EBFF] dark:bg-brand/15 rounded-lg px-4 py-3">
              <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" /> <span>{content.session.keyLesson}</span>
            </section>
          )}

          {content.assignment && (
            <section className="mb-7 rounded-2xl border-[1.5px] border-border-soft p-5">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardList className="w-4 h-4 text-brand" />
                <h2 className="font-display font-bold text-sm uppercase tracking-wide text-ink">Assignment</h2>
              </div>
              <p className="text-[13.5px] text-body leading-relaxed">{content.assignment}</p>
            </section>
          )}

          {content.challengeFeatures?.length > 0 && (
            <section className="mb-7">
              <h2 className="font-display font-bold text-sm uppercase tracking-wide text-ink mb-2.5">Challenge features</h2>
              <ul className="flex flex-wrap gap-2">
                {content.challengeFeatures.map((f) => (
                  <li key={f} className="text-xs font-semibold text-body-strong bg-[#FEF9E7] dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full px-2.5 py-1">{f}</li>
                ))}
              </ul>
            </section>
          )}

          <Link
            to="/vibe-coding/prompts"
            className="flex items-center gap-2 text-sm font-bold text-brand hover:text-brand-deep transition-colors mb-8"
          >
            <BookOpen className="w-4 h-4" /> View the prompt library →
          </Link>

          <div className="flex items-stretch justify-between gap-3 pt-6 border-t border-border-soft">
            {prevClass ? (
              <Link
                to={`/vibe-coding/class/${prevClass}`}
                className="flex items-center gap-2 bg-white dark:bg-[#181818] border-[1.5px] border-border-soft hover:border-brand/40 rounded-xl pl-2.5 pr-4 py-2.5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-brand flex-shrink-0" />
                <span className="block text-xs sm:text-sm font-bold text-ink">Class {prevClass}</span>
              </Link>
            ) : <span />}
            {nextClass && (
              <Link
                to={`/vibe-coding/class/${nextClass}`}
                className="flex items-center gap-2 bg-brand hover:bg-brand-deep text-white rounded-xl pl-4 pr-2.5 py-2.5 transition-colors"
              >
                <span className="block text-xs sm:text-sm font-bold">Class {nextClass}</span>
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
