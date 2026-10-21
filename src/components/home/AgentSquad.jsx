// A drawn picture of what AI Agent Mastery builds: one chief of staff leading a
// squad of specialist agents (research, design, images, coding, video). Static
// on purpose, so it prerenders cleanly and has no motion to switch off. The
// wording is the program's own (see MasterySection / AIAgentMastery.jsx).
//
// Laid out on a 520x430 grid. Lines are drawn first so the boxes sit on top.
const CENTER = { x: 260, y: 215 };

const SPECIALISTS = [
  { label: 'Research', x: 86, y: 78 },
  { label: 'Design', x: 260, y: 40 },
  { label: 'Images', x: 434, y: 78 },
  { label: 'Coding', x: 120, y: 372 },
  { label: 'Video', x: 400, y: 372 },
];

const BOX_W = 118;
const BOX_H = 44;

export default function AgentSquad({ className = '' }) {
  return (
    <figure className={`m-0 ${className}`}>
      <svg
        viewBox="0 0 520 430"
        role="img"
        aria-label="One chief of staff connected to five specialist agents: research, design, images, coding and video."
        className="block h-auto w-full"
      >
        {SPECIALISTS.map((s) => (
          <g key={s.label}>
            <line
              x1={CENTER.x}
              y1={CENTER.y}
              x2={s.x}
              y2={s.y}
              stroke="#fff"
              strokeOpacity="0.4"
              strokeWidth="2"
              strokeDasharray="2 7"
              strokeLinecap="round"
            />
            <circle cx={(CENTER.x + s.x) / 2} cy={(CENTER.y + s.y) / 2} r="4.5" fill="#F2A93B" />
          </g>
        ))}

        {SPECIALISTS.map((s) => (
          <g key={`${s.label}-box`}>
            <rect
              x={s.x - BOX_W / 2}
              y={s.y - BOX_H / 2}
              width={BOX_W}
              height={BOX_H}
              rx="10"
              fill="#fff"
              fillOpacity="0.09"
              stroke="#fff"
              strokeOpacity="0.55"
              strokeWidth="1.5"
            />
            <text
              x={s.x}
              y={s.y + 5.5}
              textAnchor="middle"
              fontSize="16"
              fontWeight="700"
              fill="#fff"
              className="font-display"
            >
              {s.label}
            </text>
          </g>
        ))}

        <rect x={CENTER.x - 84} y={CENTER.y - 38} width="168" height="76" rx="14" fill="#F2A93B" />
        <text
          x={CENTER.x}
          y={CENTER.y - 3}
          textAnchor="middle"
          fontSize="19"
          fontWeight="800"
          fill="#0F1A2A"
          className="font-display"
        >
          Chief of staff
        </text>
        <text x={CENTER.x} y={CENTER.y + 20} textAnchor="middle" fontSize="13" fontWeight="600" fill="#0F1A2A" fillOpacity="0.75">
          you run it from your phone
        </text>
      </svg>
      <figcaption className="mt-2 text-sm text-body">One chief of staff, five specialist agents. Illustration.</figcaption>
    </figure>
  );
}
