import { LOGO_PATH, LOGO_VIEWBOX } from "./logo-path";

type LogoProps = {
  className?: string;
  markOnly?: boolean;
};

export default function Logo({ className = "", markOnly = false }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox={LOGO_VIEWBOX}
        className="h-8 w-8 shrink-0"
        role="img"
        aria-label="Café DOA"
      >
        <path d={LOGO_PATH} fill="currentColor" fillRule="evenodd" />
      </svg>
      {!markOnly && (
        // The original wordmark is a geometric sans, not the serif used for
        // headings - Inter with wider tracking sits much closer to it.
        <span className="text-xl font-bold tracking-[0.08em]">DOA</span>
      )}
    </span>
  );
}
