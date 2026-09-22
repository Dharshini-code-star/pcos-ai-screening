import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function DisclaimerBanner({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div
      role="note"
      className={cn(
        "flex w-fit items-center gap-2 rounded-full border border-brand-pink-300/70 bg-brand-blush-50 text-brand-mauve-700",
        compact ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
        className
      )}
    >
      <ShieldAlert className={cn("shrink-0", compact ? "size-3.5" : "size-4")} />
      <span>Screening estimate, not a diagnosis.</span>
      <Link href="/about-model" className="inline-flex items-center gap-0.5 font-medium underline underline-offset-2 hover:no-underline">
        Learn more <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
