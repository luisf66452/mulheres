export default function IlustracaoAutocompaixao({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 200 220"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      className={className}
    >
      <g transform="translate(152 92)">
        <ellipse rx="26" ry="40" fill="#B8697A" fillOpacity="0.32" />
        <ellipse rx="26" ry="40" fill="#B8697A" fillOpacity="0.28" transform="rotate(51)" />
        <ellipse rx="26" ry="40" fill="#B8697A" fillOpacity="0.36" transform="rotate(102)" />
        <ellipse rx="26" ry="40" fill="#B8697A" fillOpacity="0.28" transform="rotate(153)" />
        <ellipse rx="26" ry="40" fill="#B8697A" fillOpacity="0.32" transform="rotate(204)" />
        <ellipse rx="26" ry="40" fill="#B8697A" fillOpacity="0.28" transform="rotate(255)" />
        <ellipse rx="26" ry="40" fill="#B8697A" fillOpacity="0.36" transform="rotate(306)" />
        <circle r="13" fill="#E8B894" fillOpacity="0.85" />
      </g>
      <path
        d="M62 204c9-30 13-47 13-61"
        stroke="#8FA888"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M75 168c-8-4-14-2-18 4"
        stroke="#8FA888"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <ellipse
        cx="42"
        cy="62"
        rx="9"
        ry="15"
        fill="#B8697A"
        fillOpacity="0.18"
        transform="rotate(-20 42 62)"
      />
    </svg>
  );
}
