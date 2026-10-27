import type { SVGProps } from "react";

// Hand-authored, stroke-based icon set so interface icons stay consistent and never
// rely on emoji, without adding an icon-library dependency.
const defaults: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

export function CheckCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" />
    </svg>
  );
}

export function XCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  );
}

export function TruckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...defaults} {...props}>
      <rect x="2" y="7" width="12" height="9" rx="1.5" />
      <path d="M14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18.5" r="1.5" />
      <circle cx="17" cy="18.5" r="1.5" />
    </svg>
  );
}

export function MapPinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...defaults} {...props}>
      <path d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.3" />
    </svg>
  );
}

export function PhoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...defaults} {...props}>
      <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

export function UserIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...defaults} {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.2-4 4.2-6 7-6s5.8 2 7 6" />
    </svg>
  );
}

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...defaults} {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function UndoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...defaults} {...props}>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
    </svg>
  );
}

export function PackageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...defaults} {...props}>
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v9l9 5 9-5V8M12 13v9" />
    </svg>
  );
}

export function HistoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...defaults} {...props}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 8v5l3 2" />
    </svg>
  );
}

export function EyeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...defaults} {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...defaults} {...props}>
      <path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-2.6 3.6" />
      <path d="M6.6 6.6A17.4 17.4 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m3 3 18 18" />
    </svg>
  );
}

export function LogOutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...defaults} {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}

export function MailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...defaults} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
