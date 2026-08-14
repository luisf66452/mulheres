export default function IconePreferencias({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M4 6h9" />
      <path d="M17 6h3" />
      <circle cx="14" cy="6" r="2.4" />
      <path d="M4 12h3" />
      <path d="M11 12h9" />
      <circle cx="8" cy="12" r="2.4" />
      <path d="M4 18h9" />
      <path d="M17 18h3" />
      <circle cx="14" cy="18" r="2.4" />
    </svg>
  );
}
