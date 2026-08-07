import { useEffect } from 'react';
import WebinarDeck from '../components/webinar/WebinarDeck';

// Full-screen keynote — used live (presenter mode + keyboard nav) and as a
// self-paced replay/landing page afterward, so it gets its own title/OG tags
// like About.jsx rather than inheriting index.html's homepage defaults.
export default function Webinar() {
  useEffect(() => {
    const prevTitle = document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute('content');

    document.title = 'The AI Builder Workshop — Become an AI Builder | Social Dev Technologies';
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Learn how ordinary people are building AI systems that save time, grow businesses, and create new career opportunities — join Social Dev Technologies\' live AI Builder Workshop and watch a real AI agent get built from scratch.'
      );
    }

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc) metaDesc.setAttribute('content', prevDesc);
    };
  }, []);

  return <WebinarDeck />;
}
