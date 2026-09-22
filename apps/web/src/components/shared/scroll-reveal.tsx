"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISIBLE = "is-visible";

/**
 * Drives the scroll-reveal motion declared in globals.css.
 *
 * Mounted once in the root layout. It renders nothing, so every page it
 * animates stays a server component — sections opt in with a `data-animate`
 * or `data-animate-group` attribute rather than being wrapped in a client
 * component.
 *
 * The stagger index is assigned at reveal time from how many elements enter
 * together, not from DOM order. An element scrolling in on its own therefore
 * animates immediately instead of waiting out the delay of siblings that were
 * revealed long before it.
 */
export function ScrollReveal() {
  // Re-scan after a client-side navigation, when the new page's markup is in.
  const pathname = usePathname();

  useEffect(() => {
    const selector =
      "[data-animate]:not(.is-visible), [data-animate-group] > *:not([data-animate-group]):not(.is-visible)";

    const reveal = (el: HTMLElement, index: number) => {
      el.style.setProperty("--anim-i", String(index));
      el.classList.add(VISIBLE);
    };

    // No observer, or the visitor asked for less motion: show everything now.
    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canObserve = !reduced && typeof IntersectionObserver !== "undefined";

    const observer = canObserve
      ? new IntersectionObserver(
          (entries) => {
            entries
              .filter((e) => e.isIntersecting)
              // Top-down, so a row of cards lights up left-to-right visually.
              .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
              .forEach((entry, i) => {
                // Cap the stagger so a long batch never ends on a sluggish delay.
                reveal(entry.target as HTMLElement, Math.min(i, 6));
                observer!.unobserve(entry.target);
              });
          },
          // Reveal slightly before the element reaches the bottom edge, so the
          // motion reads as "already there" rather than triggering under the fold.
          { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
        )
      : null;

    const claimed = new WeakSet<Element>();

    function scan() {
      for (const el of document.querySelectorAll<HTMLElement>(selector)) {
        if (claimed.has(el)) continue;
        claimed.add(el);
        if (observer) observer.observe(el);
        else reveal(el, 0);
      }
    }

    scan();

    // Pages that render client-side only — /screening/results reads its result
    // from sessionStorage on mount and renders null until then — have no
    // markup at all when the effect first runs. Without this their content
    // would mount into the hidden state and stay at opacity 0 forever, which
    // is exactly what happened. Re-scan whenever nodes are added.
    let frame = 0;
    const mutations = new MutationObserver(() => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        scan();
      });
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer?.disconnect();
      mutations.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
