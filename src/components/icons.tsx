type IconProps = {
  className?: string;
};

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function InstagramIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PhoneIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6.5 3.5c.6 1.6 1.1 3 2 4.3-.8 1-1.3 1.4-2 2 1.4 3 3.2 4.8 6.2 6.2.6-.7 1-1.2 2-2 1.3.9 2.7 1.4 4.3 2v2.7c0 1-.9 1.8-1.9 1.6C9.7 19.3 4.7 14.3 3.8 6.9 3.6 5.9 4.4 5 5.4 5H6.5v-1.5z" />
    </svg>
  );
}

export function MenuIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function CloseIcon({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M5 5l14 14M19 5L5 19" />
    </svg>
  );
}

export function CheckIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function CoffeeCupIcon({ className = "h-10 w-10" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} {...base}>
      <path d="M10 20h22v9c0 6-5 11-11 11s-11-5-11-11v-9z" />
      <path d="M32 22h3.5c2.5 0 4.5 2 4.5 4.5S38 31 35.5 31H32" />
      <path d="M15 15c0-2 2-2.5 2-4.5S15 8 15 6" />
      <path d="M22 15c0-2 2-2.5 2-4.5S22 8 22 6" />
    </svg>
  );
}

export function MatchaGlassIcon({ className = "h-10 w-10" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} {...base}>
      <path d="M15 14h18l-2.5 24a3 3 0 01-3 2.7H20.5a3 3 0 01-3-2.7L15 14z" />
      <path d="M13 14h22" />
      <path d="M28 10l3-6" />
      <path d="M19 24c3 2 7 2 10 0" />
    </svg>
  );
}

export function AvocadoToastIcon({ className = "h-10 w-10" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} {...base}>
      <rect x="6" y="26" width="36" height="9" rx="2" />
      <path d="M6 26c0-9 8-14 18-14s18 5 18 14" />
      <ellipse cx="24" cy="20" rx="8" ry="6" />
      <circle cx="24" cy="20" r="2.3" />
    </svg>
  );
}

export function AcaiBowlIcon({ className = "h-10 w-10" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} {...base}>
      <path d="M6 22h36c0 8-8 15-18 15S6 30 6 22z" />
      <path d="M6 22c0-1.5 1-2.5 2.5-2.5h31c1.5 0 2.5 1 2.5 2.5" />
      <circle cx="18" cy="27" r="1.4" />
      <circle cx="24" cy="30" r="1.4" />
      <circle cx="30" cy="27" r="1.4" />
    </svg>
  );
}

export function PendantLampIcon({ className = "h-10 w-10" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} {...base}>
      <path d="M24 4v14" />
      <path d="M15 18h18l-3 10H18l-3-10z" />
      <path d="M12 44h24" />
    </svg>
  );
}

export function PlantBranchIcon({ className = "h-10 w-10" }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} {...base}>
      <path d="M24 42V10" />
      <path d="M24 30c-6 0-10-4-10-10" />
      <path d="M24 22c6 0 10-4 10-10" />
      <path d="M24 38c-4.5 0-7.5-3-7.5-7.5" />
      <path d="M24 12c4.5 0 7.5 3 7.5 7.5" />
    </svg>
  );
}
