/** Small spot illustrations for the three steps. Decorative, so hidden from assistive tech. */
const common = { viewBox: "0 0 160 110", fill: "none", "aria-hidden": true, className: "h-full w-full" } as const;

export function UploadArt() {
  return (
    <svg {...common}>
      <rect x="30" y="80" width="100" height="14" rx="7" className="fill-accent-soft stroke-accent" strokeWidth="2" />
      <rect x="52" y="20" width="56" height="68" rx="7" className="fill-white stroke-foreground" strokeWidth="2" />
      <path d="M62 40h36M62 51h36M62 62h22" className="stroke-[#c9d1de]" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="116" cy="30" r="13" className="fill-accent" />
      <path d="M116 37V24M110 29.5l6-6 6 6" stroke="white" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="22" y="30" width="30" height="16" rx="5" className="fill-violet-soft stroke-violet" strokeWidth="1.5" />
      <text x="37" y="41.5" textAnchor="middle" fontSize="9" fontWeight="700" className="fill-violet">PDF</text>
    </svg>
  );
}

export function UnderstandArt() {
  return (
    <svg {...common}>
      <rect x="36" y="12" width="72" height="88" rx="7" className="fill-white stroke-foreground" strokeWidth="2" />
      <rect x="46" y="28" width="52" height="9" rx="2" fill="var(--marker-teal)" />
      <path d="M48 32.5h48" className="stroke-foreground" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M48 48h40M48 58h46" className="stroke-[#c9d1de]" strokeWidth="3.5" strokeLinecap="round" />
      <rect x="46" y="70" width="40" height="9" rx="2" fill="var(--marker-amber)" />
      <path d="M48 74.5h36" className="stroke-foreground" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="104" cy="66" r="19" fill="white" fillOpacity="0.85" className="stroke-accent" strokeWidth="3.5" />
      <path d="M96 66l6 6 10-12" className="stroke-accent" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M118 80l14 14" className="stroke-accent" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

export function PrepareArt() {
  return (
    <svg {...common}>
      <rect x="40" y="16" width="80" height="88" rx="9" className="fill-white stroke-foreground" strokeWidth="2" />
      <rect x="62" y="9" width="36" height="15" rx="5" className="fill-foreground" />
      {[38, 58, 78].map((y, i) => (
        <g key={y}>
          <rect x="52" y={y} width="14" height="14" rx="4" className={i < 2 ? "fill-accent stroke-accent" : "fill-white stroke-[#aab4c5]"} strokeWidth="2" />
          {i < 2 ? (
            <path d={`M55.5 ${y + 7.5}l3 3 5-6.5`} stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          ) : null}
          <path d={`M74 ${y + 7}h${i === 0 ? 34 : i === 1 ? 28 : 32}`} className="stroke-[#c9d1de]" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      ))}
      <circle cx="124" cy="34" r="12" fill="var(--marker-amber)" />
      <path d="M124 28v7l4 3" className="stroke-warn" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
