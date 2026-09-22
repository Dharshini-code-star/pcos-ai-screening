import { AssistantChat } from "@/components/assistant/assistant-chat";
import { DisclaimerBanner } from "@/components/shared/disclaimer-banner";

export default function AssistantPage() {
  return (
    <div data-animate-group className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Assistant</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ask general questions about PCOS. Answers are grounded only in curated excerpts from
        the 2023 International Evidence-based PCOS Guideline and WHO, with citations.
      </p>
      <DisclaimerBanner compact className="mt-4" />
      <div className="mt-6">
        <AssistantChat />
      </div>
    </div>
  );
}
