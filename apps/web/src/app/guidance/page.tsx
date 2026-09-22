import { GuidancePlan } from "@/components/guidance/guidance-plan";
import { getHistory } from "@/lib/history";

export default async function GuidancePage() {
  // Signed-in users get guidance from their most recent saved assessment.
  // Everyone else falls back to the screening still held in sessionStorage,
  // which the client component reads — so guidance works without an account,
  // exactly like the screening result itself does.
  const { entries } = await getHistory();
  const latest = entries.find((e) => e.result && !e.result.isInsufficientData) ?? entries[0];

  return (
    <div data-animate-group className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Your Daily Guidance</h1>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">
        General lifestyle guidance shaped by your screening answers and the goal you choose. It
        is not a treatment plan or a medical diet.
      </p>

      <div className="mt-6">
        <GuidancePlan serverAnswers={latest?.answers ?? null} />
      </div>
    </div>
  );
}
