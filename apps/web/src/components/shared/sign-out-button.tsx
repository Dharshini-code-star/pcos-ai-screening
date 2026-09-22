"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    // SiteHeader is a server component in the root layout, so a client-side
    // push alone reuses the cached layout and leaves the signed-in header —
    // and this button — on screen. Refresh AFTER navigating so the layout is
    // re-fetched for the destination; refreshing first only refreshed the
    // page we are leaving.
    router.push("/");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" className="rounded-full" onClick={handleSignOut} disabled={loading}>
      {loading ? "Signing out…" : "Sign out"}
    </Button>
  );
}
