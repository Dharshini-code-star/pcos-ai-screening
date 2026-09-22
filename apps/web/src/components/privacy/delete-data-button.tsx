"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteDataButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch("/api/account/delete-data", { method: "POST" });
      if (res.ok) {
        router.refresh();
        router.push("/");
      }
    } finally {
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <Button variant="destructive" className="rounded-full" onClick={() => setConfirming(true)}>
        <Trash2 className="size-4" /> Delete all my data
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="destructive" className="rounded-full" onClick={handleDelete} disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        Yes, permanently delete everything
      </Button>
      <Button variant="ghost" className="rounded-full" onClick={() => setConfirming(false)} disabled={loading}>
        Cancel
      </Button>
    </div>
  );
}
