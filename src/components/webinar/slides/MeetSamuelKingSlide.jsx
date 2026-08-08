import SlideShell from '../SlideShell';
import PresenterBio from '../PresenterBio';

const CREDENTIALS = [
  'Cut manual data entry by 80%',
  'Coordinated TEDx-level events',
  'Certified: Claude · Microsoft AI',
];

export default function MeetSamuelKingSlide() {
  return (
    <SlideShell decorations>
      <PresenterBio
        initials="SK"
        name="Samuel King"
        title="AI Workflow Automation Specialist, Social Dev Technologies"
        credentials={CREDENTIALS}
        closingLine="He bridges high-level project management with hands-on technical execution — in a few minutes, you'll watch him build."
      />
    </SlideShell>
  );
}
