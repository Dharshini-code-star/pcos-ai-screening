import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The PCOSense mark: a three-petal lotus with a woman's profile (flowing
 * hair rendered as thin highlight strands) held in the center petal, plus
 * a small leaf sprig accent — used identically as the logo mark and as the
 * homepage hero emblem so the brand mark stays one consistent asset at
 * every size, from favicon up to the landing page.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={cn("size-8", className)} aria-hidden="true">
      <defs>
        <linearGradient id="pcosenseLeftPetal" x1="30" y1="170" x2="45" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--brand-blush-200)" />
          <stop offset="100%" stopColor="var(--brand-pink-300)" />
        </linearGradient>
        <linearGradient id="pcosenseRightPetal" x1="170" y1="170" x2="155" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--brand-pink-400)" />
          <stop offset="100%" stopColor="var(--brand-mauve-500)" />
        </linearGradient>
        <linearGradient id="pcosenseCenterPetal" x1="100" y1="170" x2="100" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--brand-mauve-600)" />
          <stop offset="100%" stopColor="var(--brand-mauve-700)" />
        </linearGradient>
      </defs>

      {/* left petal */}
      <path
        d="M100 172C78 165 55 148 41 118C29 93 27 66 36 42C46 55 56 74 66 97C79 124 91 149 100 172Z"
        fill="url(#pcosenseLeftPetal)"
      />
      {/* right petal */}
      <path
        d="M100 172C122 165 145 148 159 118C171 93 173 66 164 42C154 55 144 74 134 97C121 124 109 149 100 172Z"
        fill="url(#pcosenseRightPetal)"
      />
      {/* center petal */}
      <path
        d="M100 172C130 150 138 100 118 50C112 32 105 18 100 8C95 18 88 32 82 50C62 100 70 150 100 172Z"
        fill="url(#pcosenseCenterPetal)"
      />

      {/* small leaf sprig */}
      <path d="M150 46C159 36 172 33 179 40C172 48 159 51 150 46Z" fill="var(--brand-mauve-500)" />
      <path d="M155 57C165 51 178 53 184 60C176 65 163 65 155 57Z" fill="var(--brand-pink-300)" />

      {/* feminine profile, held in the center petal */}
      <path
        d="M88 26C96 21 106 24 110 33C114 41 115 48 111 54C114 57 114 61 110 64C107 67 103 66 101 63C103 69 101 76 96 80C98 88 97 96 93 102L85 102L85 78C78 68 77 50 82 36C84 32 86 28 88 26Z"
        fill="#2a1420"
      />
      {/* flowing hair highlights */}
      <path
        d="M87 30C80 46 78 64 86 82"
        fill="none"
        stroke="var(--brand-pink-300)"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.8"
      />
      <path
        d="M93 26C88 42 87 58 92 74"
        fill="none"
        stroke="var(--brand-pink-400)"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.65"
      />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  showTagline = false,
}: {
  className?: string;
  markClassName?: string;
  showTagline?: boolean;
}) {
  return (
    <Link href="/" className={cn("group flex items-center gap-2.5", className)}>
      <LogoMark
        className={cn(
          "transition-transform duration-300 ease-out group-hover:scale-105",
          markClassName
        )}
      />
      <span className="leading-tight">
        <span className="block text-lg font-semibold tracking-tight text-foreground">
          PCO<span className="text-primary">Sense</span>
        </span>
        {showTagline && (
          <span className="hidden text-[10px] font-medium tracking-wide text-muted-foreground sm:block">
            Know Earlier, Live Better
          </span>
        )}
      </span>
    </Link>
  );
}
