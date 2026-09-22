import Link from "next/link";
import { ArrowRight, Brain, HeartHandshake, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DisclaimerBanner } from "@/components/shared/disclaimer-banner";
import { HeroIllustration } from "@/components/shared/hero-illustration";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Private",
    body: "Your data stays yours.",
  },
  {
    icon: Brain,
    title: "AI-powered",
    body: "Clear, explainable results.",
  },
  {
    icon: HeartHandshake,
    title: "Actionable",
    body: "Know your next steps.",
  },
];

export default function Home() {
  return (
    <div className="bg-hero-gradient">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:py-28">
        <div className="hero-enter space-y-6">
          <span className="inline-block rounded-full border border-brand-pink-300/70 bg-brand-blush-50 px-3 py-1 text-xs font-semibold tracking-wide text-brand-mauve-700">
            SHELIX 2026
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Understand your <span className="text-primary">PCOS</span> risk.
          </h1>
          <p className="max-w-md text-lg text-muted-foreground">
            A quick, private screening with clear next steps.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/screening">
                Start screening <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <Link href="/about-model">Learn more</Link>
            </Button>
          </div>
          <DisclaimerBanner />
        </div>

        <div className="hero-media relative mx-auto flex items-center justify-center">
          <HeroIllustration className="h-64 w-64 sm:h-72 sm:w-72 lg:h-80 lg:w-80" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div data-animate-group className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card-lift rounded-2xl border border-border/70 bg-card p-6">
              <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-brand-blush-100 text-brand-mauve-600">
                <f.icon className="size-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
