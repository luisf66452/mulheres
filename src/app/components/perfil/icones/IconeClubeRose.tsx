export default function IconeClubeRose({ className }: { className?: string }) {
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
      <path d="M12 21c0-4 .5-7 .5-9.5" />
      <ellipse cx="12" cy="8" rx="2.6" ry="4" />
      <ellipse cx="12" cy="8" rx="2.6" ry="4" transform="rotate(72 12 8)" />
      <ellipse cx="12" cy="8" rx="2.6" ry="4" transform="rotate(144 12 8)" />
      <ellipse cx="12" cy="8" rx="2.6" ry="4" transform="rotate(216 12 8)" />
      <ellipse cx="12" cy="8" rx="2.6" ry="4" transform="rotate(288 12 8)" />
      <circle cx="12" cy="8" r="1.4" />
    </svg>
  );
}
