import { DoctorFinder } from "@/components/doctor/doctor-finder";
import { DISCLAIMER, SCREENING_NOTE } from "@/lib/doctor";

export const metadata = {
  title: "Healthcare support — PCOSense",
};

export default function DoctorPage() {
  return (
    <div data-animate-group className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Healthcare support</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Find verified healthcare in Tamil Nadu.
      </p>

      <div className="mt-6">
        <DoctorFinder />
      </div>

      <p className="mt-8 border-t border-border/70 pt-4 text-xs text-muted-foreground">
        {DISCLAIMER} {SCREENING_NOTE}
      </p>
    </div>
  );
}
