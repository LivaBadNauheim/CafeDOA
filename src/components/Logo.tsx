type LogoProps = {
  className?: string;
  markOnly?: boolean;
};

/**
 * Inspired by the café's mosaic-square mark: an irregular terrazzo of cells
 * inside a square frame. Hand-drawn as SVG since we don't have the original
 * vector file - swap for the real logo asset whenever it's available.
 */
export default function Logo({ className = "", markOnly = false }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="h-8 w-8 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={4}
        strokeLinejoin="round"
      >
        <rect x="6" y="6" width="88" height="88" />
        <path d="M6 34 L34 28 L52 6" />
        <path d="M34 28 L48 48 L94 40" />
        <path d="M48 48 L38 74 L6 68" />
        <path d="M38 74 L58 94" />
        <path d="M48 48 L58 94" />
        <path d="M58 94 L82 70 L94 76" />
        <path d="M52 6 L82 22 L94 40" />
        <path d="M82 22 L48 48" />
        <path d="M82 70 L94 40" />
        <path d="M6 68 L34 28" />
      </svg>
      {!markOnly && (
        <span className="font-display text-xl font-semibold tracking-wide">DOA</span>
      )}
    </span>
  );
}
