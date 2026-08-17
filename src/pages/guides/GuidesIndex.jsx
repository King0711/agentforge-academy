import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight } from 'lucide-react';
import { usePageSeo } from '../../hooks/usePageSeo';
import { guides } from '../../data/guides';

const CANONICAL_PATH = '/guides';
const DESCRIPTION =
  'Plain-language guides to the AI agents businesses actually use — what each one does, where it helps, and how to run one well.';

// Index for the evergreen /guides section. Exists so guides are reachable by
// a real internal link (footer -> /guides -> guide), not only from the
// sitemap — an orphaned page is slow to get crawled no matter how good it is.
export default function GuidesIndex() {
  usePageSeo({
    title: 'AI Agent Guides — Social Dev Technologies',
    description: DESCRIPTION,
    canonicalPath: CANONICAL_PATH,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'AI Agent Guides',
      description: DESCRIPTION,
      url: `https://socialdevtechnologies.com${CANONICAL_PATH}`,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: guides.map((g, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `https://socialdevtechnologies.com/guides/${g.slug}`,
          name: g.title,
        })),
      },
    },
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-ink flex items-center gap-3">
        <BookOpen className="w-7 h-7 text-brand" />
        AI Agent Guides
      </h1>
      <p className="text-body mt-2.5 max-w-2xl leading-relaxed">{DESCRIPTION}</p>

      <div className="grid sm:grid-cols-2 gap-4 mt-8">
        {guides.map((g) => (
          <Link
            key={g.slug}
            to={`/guides/${g.slug}`}
            className="group flex flex-col bg-white dark:bg-[#181818] border-[1.5px] border-border-soft rounded-2xl p-5 transition-all hover:border-brand/40 hover:shadow-[0_10px_28px_-8px_rgba(124,58,237,.18)]"
          >
            <div className="text-2xl mb-3">{g.emoji}</div>
            <h2 className="font-display font-bold text-[17px] text-ink leading-snug mb-2">{g.title}</h2>
            <p className="text-[13.5px] text-body leading-relaxed flex-1">{g.dek}</p>
            <div className="flex items-center justify-between mt-4">
              <span className="text-[11.5px] text-gray-400 font-semibold">{g.readingTime}</span>
              <ArrowRight className="w-4 h-4 text-brand opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
