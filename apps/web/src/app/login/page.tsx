import { AuthForm } from "@/components/auth/auth-form";
import { LogoMark } from "@/components/shared/logo";

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-hero-gradient px-4 py-16">
      <div data-animate className="w-full max-w-sm rounded-2xl border border-border/70 bg-card p-8 shadow-sm">
        <LogoMark className="mx-auto size-10" />
        <h1 className="mt-4 text-center text-2xl font-semibold tracking-tight">Log in</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Access your saved screening history.
        </p>
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
