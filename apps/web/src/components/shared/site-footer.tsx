import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border/70 bg-muted/40">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Logo showTagline />
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <Link href="/screening" className="hover:text-foreground">Screening</Link>
            <Link href="/screening/ultrasound" className="hover:text-foreground">Ultrasound</Link>
            <Link href="/guidance" className="hover:text-foreground">Guidance</Link>
            <Link href="/history" className="hover:text-foreground">History</Link>
            <Link href="/assistant" className="hover:text-foreground">Assistant</Link>
            <Link href="/reliability" className="hover:text-foreground">Reliability</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/about-model" className="hover:text-foreground">About</Link>
          </div>
        </div>
        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
          PCOSense is an educational risk <em>screening</em> tool, not a medical device — it
          does not diagnose PCOS or any other condition and cannot replace an evaluation by a
          qualified clinician. If you have symptoms that concern you, please seek medical care
          regardless of what this tool shows.
        </p>
      </div>
    </footer>
  );
}
