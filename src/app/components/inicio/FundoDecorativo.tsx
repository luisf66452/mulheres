export default function FundoDecorativo() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute -top-16 -right-20 -z-10"
      width="320"
      height="320"
      viewBox="0 0 320 320"
      fill="none"
    >
      <circle cx="160" cy="160" r="160" fill="url(#gradiente-decorativo-lilas)" />
      <defs>
        <radialGradient
          id="gradiente-decorativo-lilas"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(160 160) rotate(90) scale(160)"
        >
          <stop stopColor="#B9A6D4" stopOpacity="0.35" />
          <stop offset="1" stopColor="#B9A6D4" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
