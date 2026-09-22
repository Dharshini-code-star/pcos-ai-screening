"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { markSaved, readLastAssessment, type StoredAssessment } from "@/lib/screening-storage";

export function SaveResultButton({ answers }: { answers: StoredAssessment["answers"] }) {
  const [status, setStatus] = useState<"checking" | "anon" | "idle" | "saving" | "saved" | "error">("checking");
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    // sessionStorage + a one-time auth check, read once on mount to hydrate
    // client state — not a subscription to an external store's updates.
    const stored = readLastAssessment();
    if (stored?.savedAssessmentId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSavedId(stored.savedAssessmentId);
      setStatus("saved");
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setStatus(data.user ? "idle" : "anon");
    });
  }, []);

  async function handleSave() {
    setStatus("saving");
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error("save failed");
      const data = await res.json();
      markSaved(data.assessmentId);
      setSavedId(data.assessmentId);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  if (status === "checking") return null;

  if (status === "saved") {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" disabled>
          <Check className="size-4" /> Saved to your history
        </Button>
        {savedId && (
          <Button asChild variant="ghost">
            <Link href={`/report/${savedId}`}>
              <FileText className="size-4" /> View report
            </Link>
          </Button>
        )}
      </div>
    );
  }

  if (status === "anon") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild>
          <Link href="/signup">Sign up to save this result</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/login">Log in</Link>
        </Button>
        <span className="text-xs text-muted-foreground">
          Come back to this page after signing in — it&apos;ll still be here.
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleSave} disabled={status === "saving"}>
        {status === "saving" && <Loader2 className="size-4 animate-spin" />}
        Save to my history
      </Button>
      {status === "error" && <span className="text-xs text-destructive">Couldn&apos;t save — try again.</span>}
    </div>
  );
}
