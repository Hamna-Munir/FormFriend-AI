/** The FormFriend mark: a sheet of paper with a highlighted line and a tick. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#0f766e" />
      <path d="M9 7.5h10.2L23 11.3V24a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 8 24V9a1.5 1.5 0 0 1 1-1.5Z" fill="#fff" />
      <path d="M19.2 7.5v3a.8.8 0 0 0 .8.8h3" fill="#cfe9e6" />
      <rect x="11" y="13" width="8" height="2.6" rx="1.3" fill="#b8ece3" />
      <path d="m11.4 20.2 2.3 2.3 4.6-4.9" fill="none" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
