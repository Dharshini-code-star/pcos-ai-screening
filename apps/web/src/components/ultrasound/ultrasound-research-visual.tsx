import { ArrowRight } from "lucide-react";

/**
 * Abstract 3D-inspired visual for the ultrasound research pipeline.
 *
 * This is an ILLUSTRATION, not a reconstruction. It is drawn from arbitrary
 * coordinates chosen for composition — it is not derived from any scan, does
 * not depict a patient, and asserts nothing clinical. It exists to give the
 * research pipeline a visual anchor.
 *
 * Depth comes from three SVG layers separated on the Z axis inside a shared
 * CSS `perspective`, so the very slow drift in globals.css produces real
 * parallax between them. No 3D library, no canvas: three inline SVGs and one
 * keyframe, which keeps the page as light as it was.
 *
 * Renders on the server — there is no state and no JS behaviour.
 */

const PIPELINE = [
  "Ultrasound image",
  "EfficientNetB0",
  "Visual features",
  "Model output",
  "Screening signal",
];

/** Composition-only coordinates, ordered back-to-front so overlaps read right. */
const FOLLICLES = [
  { cx: 236, cy: 98, r: 16 },
  { cx: 156, cy: 99, r: 10 },
  { cx: 295, cy: 117, r: 11 },
  { cx: 101, cy: 120, r: 13 },
  { cx: 200, cy: 131, r: 8 },
  { cx: 299, cy: 144, r: 14 },
  { cx: 105, cy: 147, r: 15 },
  { cx: 244, cy: 165, r: 18 },
  { cx: 164, cy: 166, r: 12 },
];

/** Thin corner brackets, as an analysis overlay would mark a region. */
function Bracket({ x, y, s }: { x: number; y: number; s: number }) {
  const a = s * 0.34;
  return (
    <g stroke="#2a1420" strokeWidth="1.4" fill="none" opacity="0.45" strokeLinecap="round">
      <path d={`M${x} ${y + a}V${y}H${x + a}`} />
      <path d={`M${x + s - a} ${y}H${x + s}V${y + a}`} />
      <path d={`M${x + s} ${y + s - a}V${y + s}H${x + s - a}`} />
      <path d={`M${x + a} ${y + s}H${x}V${y + s - a}`} />
    </g>
  );
}

export function UltrasoundResearchVisual() {
  return (
    <figure className="card-lift mt-4 overflow-hidden rounded-2xl border border-border/70 bg-card">
      <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-5">
        <span className="inline-block rounded-full border border-brand-pink-300/70 bg-brand-blush-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-brand-mauve-700">
          Ultrasound AI Research Preview
        </span>
      </div>

      <div className="usv-stage px-4 pt-2 sm:px-5">
        <div className="usv-scene">
          {/* Back — the scan field: a tilted plane of depth contours. */}
          <svg className="usv-base" viewBox="0 30 400 170" aria-hidden="true">
            <defs>
              <radialGradient id="usvField" cx="0.5" cy="0.5" r="0.62">
                <stop offset="0%" stopColor="var(--brand-blush-100)" />
                <stop offset="100%" stopColor="var(--brand-blush-50)" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="usvBeam" x1="200" y1="44" x2="200" y2="192" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="var(--brand-pink-300)" stopOpacity="0.09" />
                <stop offset="100%" stopColor="var(--brand-pink-300)" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* the sector beam, fanning down onto the plane — a depth cue, kept
                faint enough that it never reads as a shape of its own */}
            <path d="M200 46 L318 174 A150 52 0 0 1 82 174 Z" fill="url(#usvBeam)" />

            <ellipse cx="200" cy="140" rx="150" ry="52" fill="url(#usvField)" />
            <ellipse cx="200" cy="140" rx="150" ry="52" fill="none" stroke="var(--brand-pink-300)" strokeOpacity="0.6" />
            <ellipse cx="200" cy="140" rx="112" ry="39" fill="none" stroke="var(--brand-pink-300)" strokeOpacity="0.45" />
            <ellipse cx="200" cy="140" rx="74" ry="26" fill="none" stroke="var(--brand-pink-300)" strokeOpacity="0.32" />
            <ellipse cx="200" cy="140" rx="36" ry="12" fill="none" stroke="var(--brand-pink-300)" strokeOpacity="0.2" />
          </svg>

          {/* Mid — abstract follicular forms. Shaded spheres, nothing anatomical. */}
          <svg className="usv-layer usv-layer-mid" viewBox="0 30 400 170" aria-hidden="true">
            <defs>
              <radialGradient id="usvSphere" cx="0.34" cy="0.28" r="0.78">
                <stop offset="0%" stopColor="#fdf6f9" />
                <stop offset="42%" stopColor="var(--brand-pink-300)" />
                <stop offset="100%" stopColor="var(--brand-mauve-600)" />
              </radialGradient>
              <radialGradient id="usvContact" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#2a1420" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#2a1420" stopOpacity="0" />
              </radialGradient>
            </defs>

            {FOLLICLES.map((f) => (
              <g key={`${f.cx}-${f.cy}`}>
                <ellipse
                  cx={f.cx}
                  cy={f.cy + f.r * 0.82}
                  rx={f.r * 0.95}
                  ry={f.r * 0.3}
                  fill="url(#usvContact)"
                />
                <circle cx={f.cx} cy={f.cy} r={f.r} fill="url(#usvSphere)" />
                <circle
                  cx={f.cx - f.r * 0.3}
                  cy={f.cy - f.r * 0.36}
                  r={f.r * 0.2}
                  fill="#ffffff"
                  opacity="0.55"
                />
              </g>
            ))}
          </svg>

          {/* Front — the analysis overlay the model would draw over features. */}
          <svg className="usv-layer usv-layer-front" viewBox="0 30 400 170" aria-hidden="true">
            <Bracket x={216} y={137} s={56} />
            <Bracket x={80} y={124} s={48} />
          </svg>
        </div>
      </div>

      <div className="space-y-2.5 px-4 pt-1 pb-4 sm:px-5">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {PIPELINE.map((step, i) => (
            <li key={step} className="flex items-center gap-1.5">
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                {step}
              </span>
              {i < PIPELINE.length - 1 && (
                <ArrowRight className="size-3 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>
        <figcaption className="text-xs text-muted-foreground">
          AI-assisted visual analysis — research prototype, not a diagnosis.
        </figcaption>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Illustration only. The shapes above are drawn for explanation and are not a scan, a
          reconstruction, or anyone&apos;s ovary.
        </p>
      </div>
    </figure>
  );
}
