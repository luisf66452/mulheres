export default function IlustracaoFlorCabecalho({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 64 64" fill="none" className={className}>
      <path d="M32 58c0-8 1-14 1-19" stroke="#8FA888" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M33 46c-4-2-7-1-9 2" stroke="#8FA888" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M33 40c4-1 6-3 6-6" stroke="#8FA888" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <g transform="translate(33 21)">
        <ellipse rx="7" ry="11" fill="#B8697A" fillOpacity="0.55" />
        <ellipse rx="7" ry="11" fill="#B8697A" fillOpacity="0.45" transform="rotate(72)" />
        <ellipse rx="7" ry="11" fill="#B8697A" fillOpacity="0.4" transform="rotate(144)" />
        <ellipse rx="7" ry="11" fill="#B8697A" fillOpacity="0.4" transform="rotate(216)" />
        <ellipse rx="7" ry="11" fill="#B8697A" fillOpacity="0.5" transform="rotate(288)" />
        <circle r="4" fill="#E8B894" />
      </g>
    </svg>
  );
}
