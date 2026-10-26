import type { SVGProps } from "react";

/** Minimal inline icon set — stroke inherits currentColor. */
type P = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 18, ...rest }: P): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...rest,
  };
}

export const SearchIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.8-3.8" />
  </svg>
);

export const HeartIcon = ({ filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base(p)} fill={filled ? "currentColor" : "none"}>
    <path d="M12 20.5s-7.5-4.7-9.3-9A5.3 5.3 0 0 1 12 6.6a5.3 5.3 0 0 1 9.3 4.9c-1.8 4.3-9.3 9-9.3 9Z" />
  </svg>
);

export const MenuIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const BedIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" />
    <path d="M3 18h18" />
    <path d="M6 10V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3" />
  </svg>
);

export const BathIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2Z" />
    <path d="M6 12V5.5A1.5 1.5 0 0 1 7.5 4c.8 0 1.5.7 1.5 1.5V7" />
    <path d="M8 21l-1 1M16 21l1 1" />
  </svg>
);

export const AreaIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="16" height="16" rx="1.5" />
    <path d="M4 9h5V4M20 15h-5v5" />
  </svg>
);

export const PinIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s-6.5-5.7-6.5-10.3A6.5 6.5 0 0 1 12 4a6.5 6.5 0 0 1 6.5 6.7C18.5 15.3 12 21 12 21Z" />
    <circle cx="12" cy="10.6" r="2.2" />
  </svg>
);

export const MapIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" />
    <path d="M9 4v14M15 6v14" />
  </svg>
);

export const GridIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="7" height="7" rx="1" />
    <rect x="13" y="4" width="7" height="7" rx="1" />
    <rect x="4" y="13" width="7" height="7" rx="1" />
    <rect x="13" y="13" width="7" height="7" rx="1" />
  </svg>
);

export const ChevronLeftIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m14 6-6 6 6 6" />
  </svg>
);

export const ChevronRightIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m10 6 6 6-6 6" />
  </svg>
);

export const ChevronDownIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const PhoneIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 4h4l1.7 4-2.2 1.6a12 12 0 0 0 5.9 5.9L16 13.3 20 15v4a1.9 1.9 0 0 1-2.1 1.9A16.5 16.5 0 0 1 3.1 6.1 1.9 1.9 0 0 1 5 4Z" />
  </svg>
);

export const MailIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

export const ShareIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="6" cy="12" r="2.6" />
    <circle cx="17.5" cy="6" r="2.6" />
    <circle cx="17.5" cy="18" r="2.6" />
    <path d="m8.4 10.8 6.7-3.6M8.4 13.2l6.7 3.6" />
  </svg>
);

export const CalendarIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

export const InfoIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 10.5V17M12 7.5v.2" />
  </svg>
);

export const StarIcon = ({ filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base(p)} fill={filled ? "currentColor" : "none"}>
    <path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L4.2 9.7l5.4-.8L12 4Z" />
  </svg>
);

export const CheckIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const ArrowRightIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 12h16M14 6l6 6-6 6" />
  </svg>
);

export const ShieldIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3 5 6v5.2c0 4.6 3 8 7 9.8 4-1.8 7-5.2 7-9.8V6l-7-3Z" />
    <path d="m9.2 12 2 2 3.6-3.8" />
  </svg>
);

export const HandshakeIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m3 11 4-4 5 4.5L14.5 9l6.5 6" />
    <path d="m3 11 6 6 3-2.5" />
    <path d="m12.5 13.5 2 2M14.5 11.5l2 2" />
  </svg>
);

export const DocsIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="3" width="12" height="16" rx="1.5" />
    <path d="M8 7h6M8 11h6M8 15h4" />
    <path d="M17 7h2v14H9v-2" />
  </svg>
);

export const CompassIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
  </svg>
);

export const UploadIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 16V4m0 0 4 4m-4-4L8 8" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </svg>
);

export const HomeIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="m4 11 8-7 8 7" />
    <path d="M6 9.5V20h12V9.5" />
    <path d="M10 20v-5h4v5" />
  </svg>
);
