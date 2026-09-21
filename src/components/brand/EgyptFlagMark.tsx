'use client';

/** Compact Egypt flag mark for headers/nav */
export function EgyptFlagMark({ className = 'w-8 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 24"
      className={`${className} rounded-sm shadow-sm overflow-hidden`}
      aria-label="علم مصر"
      role="img"
    >
      <rect width="36" height="8" y="0" fill="#A11D2E" />
      <rect width="36" height="8" y="8" fill="#F4F7FA" />
      <rect width="36" height="8" y="16" fill="#152238" />
      {/* Eagle of Saladin — simplified gold emblem */}
      <g transform="translate(18 12)">
        <path
          d="M0-3.2 L2.2-0.6 L1.2 2.8 L-1.2 2.8 L-2.2-0.6 Z"
          fill="#B8954A"
        />
        <circle cx="0" cy="-0.2" r="0.55" fill="#152238" />
      </g>
    </svg>
  );
}
