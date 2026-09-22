import { WhatIfSimulator } from "@/components/whatif/whatif-simulator";
import { DisclaimerBanner } from "@/components/shared/disclaimer-banner";

export default function WhatIfPage() {
  return (
    <div data-animate-group className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">What-if</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        See how the estimate shifts if a few lifestyle factors were different. Nothing here
        is saved.
      </p>
      <DisclaimerBanner compact className="mt-4" />
      <div className="mt-6">
        <WhatIfSimulator />
      </div>
    </div>
  );
}
