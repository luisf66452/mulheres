export default function IconeAssinatura({ className }: { className?: string }) {
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
      <path d="m12 3.5 2.35 4.85 5.15.75-3.75 3.7.9 5.3L12 15.6l-4.65 2.5.9-5.3-3.75-3.7 5.15-.75Z" />
    </svg>
  );
}
