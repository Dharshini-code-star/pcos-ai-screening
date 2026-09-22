"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Cross-fades page content on route change.
 *
 * `children` is rendered on the server and passed straight through, so
 * wrapping the app in this does not turn any page into a client component.
 * Keying on the pathname restarts the CSS animation for each route; the
 * subtree is already remounted by the router on navigation, so the key costs
 * no extra state.
 *
 * Opacity only — per-section movement comes from ScrollReveal, and animating
 * both here would read as a double fade.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
