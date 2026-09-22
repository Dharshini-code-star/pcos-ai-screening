import Link from "next/link";
import { ScanLine } from "lucide-react";
import { QuestionnaireForm } from "@/components/screening/questionnaire-form";
import { DisclaimerBanner } from "@/components/shared/disclaimer-banner";
import { Button } from "@/components/ui/button";

export default function ScreeningPage() {
  return (
    <div className="bg-hero-gradient">
      <div data-animate-group className="mx-auto max-w-xl px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Screening</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Takes about two minutes. Skip anything you&apos;re not sure about — you&apos;ll still get a
          result, just with a lower confidence score.
        </p>
        <DisclaimerBanner compact className="mt-4" />
        <div className="mt-8 rounded-2xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <QuestionnaireForm />
        </div>

        {/* Optional second modality — never required for screening. */}
        <div className="mt-4 rounded-2xl border border-border/70 bg-card p-5">
          <p className="flex items-center gap-2 text-sm font-medium">
            <ScanLine className="size-4 text-primary" />
            Have an ovarian ultrasound image?
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Optional. An image model can add a second, independent screening signal. Your
            questionnaire result does not need one.
          </p>
          <Button asChild variant="outline" size="sm" className="mt-3 rounded-full">
            <Link href="/screening/ultrasound">Try ultrasound screening</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
