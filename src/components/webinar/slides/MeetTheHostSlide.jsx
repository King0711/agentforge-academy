import SlideShell from '../SlideShell';
import PresenterBio from '../PresenterBio';

const CREDENTIALS = [
  'AI Engineer',
  'Web Engineer @ Swish Sports (US)',
  'Former National Ed-Tech Manager',
  'Cybersecurity · Mentoring',
];

export default function MeetTheHostSlide() {
  return (
    <SlideShell decorations>
      <PresenterBio
        initials="ES"
        name="Emmanuel A. Samuel"
        title="Director, AI & Web Engineer, Social Dev Technologies"
        credentials={CREDENTIALS}
        closingLine="A lifelong focus on education, coaching, and community — which is exactly why this platform exists."
      />
    </SlideShell>
  );
}
