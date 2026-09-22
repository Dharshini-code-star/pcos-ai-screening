"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** §5 — every personalized suggestion can explain itself. */
export function WhyThis({ reason }: { reason: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        Why am I seeing this?
        <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <p className="mt-1.5 rounded-lg bg-muted/60 p-2.5 text-xs leading-relaxed text-muted-foreground">
          {reason}
        </p>
      )}
    </div>
  );
}
