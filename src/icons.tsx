import type { CSSProperties } from "react";
const paths: Record<string, React.ReactNode> = {
  arrow: (
    <>
      <path d="M4 12h15m-6-6 6 6-6 6" />
    </>
  ),
  diagonal: (
    <>
      <path d="M6 18 18 6M6 6h12v12" />
    </>
  ),
  down: <path d="m6 9 6 6 6-6" />,
  left: <path d="m14 5-7 7 7 7" />,
  right: <path d="m9 5 7 7-7 7" />,
  cube: (
    <>
      <path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10M7.5 4.5l9 5" />
    </>
  ),
  close: <path d="m5 5 14 14M19 5 5 19" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 2v6m10-6v6M3 11h18" />
    </>
  ),
  plane: <path d="m3 14 7-3 6-8c2-2 5-1 3 2l-5 8 1 7-2 1-3-6-5 2z" />,
  train: (
    <>
      <rect x="5" y="2" width="14" height="16" rx="4" />
      <path d="M6 10h12M9 14h.1m6 0h.1M8 18l-3 4m11-4 3 4M8 20h8" />
    </>
  ),
  case: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M8 7V4h8v3M2 12q10 5 20 0m-10 0v4" />
    </>
  ),
  spark: (
    <>
      <path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6v7l5 3" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m16 8-3 6-5 2 3-6z" />
    </>
  ),
  orbit: (
    <>
      <ellipse cx="12" cy="12" rx="10" ry="5" transform="rotate(-30 12 12)" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  pin: (
    <>
      <path d="M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="9" r="2.4" />
    </>
  ),
  check: <path d="m4 13 5 5L20 6" />,
  plus: <path d="M12 4v16M4 12h16" />,
  return: <path d="m8 4-5 5 5 5M3 9h12a6 6 0 0 1 0 12" />,
  seat: (
    <>
      <path d="m7 3 2 10 3 4h8v3H9l-4-6L3 4z" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v7m0-11v1" />
    </>
  ),
};
export function Icon({
  name,
  size = 18,
  style,
}: {
  name: string;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {paths[name]}
    </svg>
  );
}
export function Brand() {
  return (
    <span className="brand">
      <svg
        aria-hidden="true"
        width="45"
        height="40"
        viewBox="0 0 48 42"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.15"
      >
        <path d="M2 34 13 5l11 24L35 5l11 29M6 33l8-20 10 23 10-23 8 20" />
        <path d="m8 22 16 16 16-16" />
      </svg>
      <span>
        MAISON VEYRE<small>CHAUFFEURS PRIVÉS</small>
      </span>
    </span>
  );
}
