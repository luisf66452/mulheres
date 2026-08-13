export default function IconeMeditacao({ className }: { className?: string }) {
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
      <path d="M12 20c-4 0-7-2-7-2s1.5-4 7-4 7 4 7 4-3 2-7 2Z" />
      <path d="M12 14V8" />
      <path d="M12 14c-2-1-3-3-3-6 2 1 3 3 3 6Z" />
      <path d="M12 14c2-1 3-3 3-6-2 1-3 3-3 6Z" />
    </svg>
  );
}
