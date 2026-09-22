// Plain data, deliberately dependency-free — imported by both the
// server-rendered SiteHeader and the client-rendered MobileNav. Importing
// nav data FROM site-header.tsx into a client component would pull that
// server component's transitive imports (Supabase's server client, which
// uses next/headers) into the client bundle and break the build.
export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/screening", label: "Screening" },
  { href: "/guidance", label: "Guidance" },
  { href: "/history", label: "History" },
  { href: "/assistant", label: "Assistant" },
  { href: "/doctor", label: "Support" },
  { href: "/about-model", label: "About" },
];
