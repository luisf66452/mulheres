export default function IconeDiario({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 4.5h9a3 3 0 0 1 3 3V19a2.5 2.5 0 0 0-2.5-2.5H6a1.5 1.5 0 0 1-1.5-1.5V6A1.5 1.5 0 0 1 6 4.5Z" />
      <path d="M9 9h6" />
      <path d="M9 12.5h4" />
    </svg>
  );
}
