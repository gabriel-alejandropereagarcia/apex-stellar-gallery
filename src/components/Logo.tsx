export default function Logo({ size = 26 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      {/* constelación: nodos conectados = ecosistema */}
      <g stroke="var(--accent)" strokeWidth="1" opacity="0.55">
        <path d="M8 22 L16 8 L24 20" />
        <path d="M16 8 L27 11" />
        <path d="M8 22 L14 26 L24 20" />
      </g>
      <g fill="var(--accent-ink)">
        <circle cx="16" cy="8" r="2.6" />
        <circle cx="8" cy="22" r="2.2" />
        <circle cx="24" cy="20" r="2.2" />
        <circle cx="27" cy="11" r="1.6" opacity="0.8" />
        <circle cx="14" cy="26" r="1.6" opacity="0.8" />
        <circle cx="5" cy="10" r="1.1" opacity="0.5" />
        <circle cx="28" cy="26" r="1.1" opacity="0.5" />
      </g>
      <circle cx="16" cy="8" r="4.5" fill="var(--accent)" opacity="0.25" />
    </svg>
  );
}
