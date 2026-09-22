import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { PageTransition } from "@/components/shared/page-transition";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PCOSense — Know Earlier, Live Better",
  description:
    "An explainable, uncertainty-aware PCOS risk screening tool. Not a diagnosis — a starting point for a conversation with your doctor.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // Tells the App Router to fall back to instant scrolling during route
      // transitions. Without it, the `scroll-behavior: smooth` set in
      // globals.css would make every navigation animate its scroll-to-top.
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
        <SiteFooter />
        <ScrollReveal />
      </body>
    </html>
  );
}
