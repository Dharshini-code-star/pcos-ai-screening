import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { MobileNav } from "@/components/shared/mobile-nav";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { NAV_LINKS } from "@/lib/nav-links";

export async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo showTagline />
        {/*
          Desktop nav appears at lg, not md. Logo + seven links + the two auth
          buttons need ~883px of content, so with the container's 48px padding
          the bar cannot fit below ~931px — at md (768px) it overflowed the
          viewport by ~107px. Everything below lg uses the sheet instead, which
          already carries the same links plus Log in / Sign up.
        */}
        <nav className="hidden items-center gap-1 text-sm font-medium text-muted-foreground lg:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 hover:bg-accent hover:text-accent-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <SignOutButton />
            ) : (
              <>
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full">
                  <Link href="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>
          <MobileNav signedIn={!!user} />
        </div>
      </div>
    </header>
  );
}
