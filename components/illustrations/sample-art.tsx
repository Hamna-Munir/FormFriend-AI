/** Icons for the three sample documents. Decorative. */
const base = { viewBox: "0 0 120 80", fill: "none", "aria-hidden": true, className: "h-full w-full" } as const;

export function ScholarshipArt() {
  return (
    <svg {...base}>
      <path d="M38 46v14c0 7 10.5 11 22 11s22-4 22-11V46" className="fill-accent/15 stroke-accent" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M60 14L103 34 60 54 17 34z" className="fill-accent stroke-accent" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M99 37v19" className="stroke-foreground" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="99" cy="59" r="4" className="fill-foreground" />
    </svg>
  );
}

export function InternshipArt() {
  return (
    <svg {...base}>
      <path d="M46 28v-6a5 5 0 0 1 5-5h18a5 5 0 0 1 5 5v6" className="stroke-foreground" strokeWidth="3" strokeLinecap="round" />
      <rect x="24" y="28" width="72" height="44" rx="8" className="fill-warn/20 stroke-warn" strokeWidth="2.5" />
      <path d="M24 46h72" className="stroke-warn" strokeWidth="2.5" />
      <rect x="54" y="42" width="12" height="10" rx="3" className="fill-white stroke-warn" strokeWidth="2.5" />
    </svg>
  );
}

export function HackathonArt() {
  return (
    <svg {...base}>
      <rect x="26" y="16" width="68" height="44" rx="6" className="fill-violet/15 stroke-violet" strokeWidth="2.5" />
      <path d="M12 66h96l-6 8H18z" className="fill-violet stroke-violet" strokeWidth="2" strokeLinejoin="round" />
      <path d="M52 30l-8 8 8 8M68 30l8 8-8 8" className="stroke-violet" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M62 27l-4 22" className="stroke-foreground" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
