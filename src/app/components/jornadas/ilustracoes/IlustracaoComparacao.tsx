export default function IlustracaoComparacao({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 220"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      className={className}
    >
      <path
        d="M122 204c-2-24 2-34 2-34-11-4-17-14-17-26 0-16 13-28 28-28 14 0 25 10 27 22 8 2 15 10 15 19 0 9-6 16-13 19l4 28z"
        fill="#8677A8"
        fillOpacity="0.26"
      />
      <path
        d="M152 118c4-4 5-10 2-15"
        stroke="#8677A8"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.45"
      />
      <path
        d="M40 192c6-30 10-49 27-64"
        stroke="#8FA888"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <ellipse
        cx="53"
        cy="150"
        rx="6"
        ry="10"
        fill="#8FA888"
        fillOpacity="0.4"
        transform="rotate(-30 53 150)"
      />
      <ellipse
        cx="61"
        cy="127"
        rx="5"
        ry="9"
        fill="#8FA888"
        fillOpacity="0.4"
        transform="rotate(-15 61 127)"
      />
      <circle cx="34" cy="176" r="3" fill="#B8697A" fillOpacity="0.45" />
    </svg>
  );
}
