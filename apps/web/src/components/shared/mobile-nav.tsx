"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/shared/sign-out-button";
import { LogoMark } from "@/components/shared/logo";
import { NAV_LINKS } from "@/lib/nav-links";

export function MobileNav({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full lg:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <LogoMark className="size-7" />
            PCO<span className="text-primary">Sense</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4">
          {NAV_LINKS.map((l) => (
            <SheetClose asChild key={l.href}>
              <Link
                href={l.href}
                className="rounded-full px-3 py-2.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                {l.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t px-4 py-4">
          {signedIn ? (
            <SignOutButton />
          ) : (
            <>
              <SheetClose asChild>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/login">Log in</Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button asChild className="rounded-full">
                  <Link href="/signup">Sign up</Link>
                </Button>
              </SheetClose>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
