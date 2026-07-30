import React, {type ReactNode} from 'react';

/**
 * A robot that has seen better days. Strokes use currentColor and fills use
 * theme variables so it reads correctly in both light and dark mode.
 */
export default function BrokenRobot({
  className,
}: {
  className?: string;
}): ReactNode {
  return (
    <svg
      className={className}
      viewBox="0 0 240 260"
      role="img"
      aria-label="A broken robot with a detached arm"
      xmlns="http://www.w3.org/2000/svg">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round">
        {/* Shadow on the floor */}
        <ellipse
          cx="120"
          cy="243"
          rx="82"
          ry="7"
          fill="currentColor"
          stroke="none"
          opacity="0.12"
        />

        {/* The robot leans, because of course it does */}
        <g transform="rotate(-4 120 180)">
          {/* Legs and feet */}
          <rect x="92" y="200" width="14" height="30" rx="6" />
          <rect x="136" y="200" width="14" height="30" rx="6" />
          <path d="M84 232h30M132 232h30" />

          {/* Body */}
          <rect
            x="70"
            y="128"
            width="100"
            height="76"
            rx="16"
            fill="var(--ifm-background-surface-color)"
          />

          {/* Chest panel */}
          <rect x="88" y="146" width="64" height="30" rx="4" />
          <text
            x="120"
            y="168"
            textAnchor="middle"
            fontSize="20"
            fontWeight="700"
            fill="var(--ifm-color-primary)"
            stroke="none"
            fontFamily="var(--ifm-font-family-base)">
            404
          </text>

          {/* Crack down the side of the chassis */}
          <path d="M73 138l9 10-7 9 8 9" strokeWidth="3" />

          {/* Right arm, still attached */}
          <path d="M170 150l20 18" />
          <circle
            cx="195"
            cy="173"
            r="8"
            fill="var(--ifm-background-surface-color)"
          />

          {/* Left shoulder socket, now empty */}
          <path d="M70 148a9 9 0 0 0 0 18" strokeWidth="3" />
          <path
            d="M52 146l-9-5M50 157h-10M52 168l-9 6"
            strokeWidth="3"
            opacity="0.6"
          />

          {/* Neck */}
          <path d="M108 122v6M132 122v6" />

          {/* Head */}
          <rect
            x="78"
            y="56"
            width="84"
            height="66"
            rx="14"
            fill="var(--ifm-background-surface-color)"
          />

          {/* One eye X'd out, one rolled back */}
          <path d="M94 76l12 12M106 76l-12 12" />
          <circle cx="139" cy="82" r="10" />
          <circle cx="135" cy="87" r="3.5" fill="currentColor" />

          {/* Wobbly mouth */}
          <path d="M100 106l8-7 8 7 8-7 8 7" strokeWidth="3" />

          {/* Bent antenna, sparking */}
          <path d="M120 56v-16l14-12" />
          <circle cx="137" cy="25" r="5" fill="var(--ifm-color-primary)" />
          <path
            d="M148 16l9-7-4 9 10-3"
            strokeWidth="3"
            stroke="var(--ifm-color-primary)"
          />
        </g>

        {/* The detached arm, on the floor */}
        <g transform="rotate(-8 44 230)">
          <path d="M32 232h26" />
          <circle
            cx="24"
            cy="232"
            r="8"
            fill="var(--ifm-background-surface-color)"
          />
        </g>

        {/* Loose bolts */}
        <circle cx="205" cy="236" r="3.5" />
        <circle cx="190" cy="241" r="2.5" />
      </g>
    </svg>
  );
}
