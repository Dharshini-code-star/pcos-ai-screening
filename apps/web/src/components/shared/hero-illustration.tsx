import Image from "next/image";
import { cn } from "@/lib/utils";

export function HeroIllustration({ className }: { className?: string }) {
  return (
    <Image
      src="/hero-health-tech.jpg"
      alt="Female physician reviewing digital health data on a tablet"
      width={1024}
      height={683}
      className={cn("media-zoom size-full rounded-[2rem] object-cover object-[72%_center] shadow-[0_24px_50px_rgba(135,47,88,0.18)]", className)}
    />
  );
}