const DROP = "M12 0C12 0 3 11.5 3 18a9 9 0 0 0 18 0C21 11.5 12 0 12 0Z";

// left %, top px, size px, opacity, blur px: the same scatter as the approved design
const DROPS: [number, number, number, number, number][] = [
  [66, 70, 38, 0.75, 0],
  [80, 150, 22, 0.55, 0],
  [88, 48, 14, 0.45, 1.5],
  [72, 230, 16, 0.4, 2],
  [93, 210, 30, 0.5, 3],
  [60, 190, 10, 0.35, 1],
  [84, 290, 12, 0.3, 2.5],
  [76, 30, 9, 0.3, 2],
];

/**
 * Small, sparse oxblood drops and one thin heartbeat that fades in and out.
 * Drawn flat on purpose: rendered or glossy versions read as stock or AI art.
 * Hidden on phones, where the band is too narrow for it.
 */
export function BloodMotif() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 hidden md:block">
      <svg viewBox="0 0 1184 320" preserveAspectRatio="xMaxYMid slice" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="csb-ecg-fade" x1="660" y1="0" x2="1184" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#c9605a" stopOpacity="0" />
            <stop offset="35%" stopColor="#c9605a" stopOpacity="0.75" />
            <stop offset="75%" stopColor="#c9605a" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#c9605a" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M660 200 H900 c6 0 8 -9 14 -9 s8 9 14 9 h10 l6 6 l10 -78 l11 104 l8 -40 h22 c10 0 14 -16 26 -16 s16 16 26 16 H1184"
          fill="none"
          stroke="url(#csb-ecg-fade)"
          strokeWidth="1.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      {DROPS.map(([left, top, size, opacity, blur]) => (
        <svg
          key={`${left}-${top}`}
          viewBox="0 0 24 28"
          width={size}
          height={Math.round((size * 28) / 24)}
          className="absolute"
          style={{ left: `${left}%`, top, opacity, filter: blur ? `blur(${blur}px)` : undefined }}
        >
          <path d={DROP} fill="#5a161c" />
          <path d="M8.5 15.5c-1 2.4-.8 4.6.6 6.3" fill="none" stroke="#f4efe8" strokeOpacity="0.28" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      ))}
    </div>
  );
}
