export default function IconeRespiracao({ className }: { className?: string }) {
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
      <path d="M12 21c0-6 .5-10 .5-14" />
      <path d="M12.5 13c-3 0-5-2-5-5 3 0 5 2 5 5Z" />
      <path d="M12.5 9c3 0 5-2.5 5-6-3.5 0-5 2.5-5 6Z" />
    </svg>
  );
}
