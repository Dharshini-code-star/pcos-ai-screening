import { AuthForm } from "@/components/auth/auth-form";
import { LogoMark } from "@/components/shared/logo";

export default function SignupPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-hero-gradient px-4 py-16">
      <div data-animate className="w-full max-w-sm rounded-2xl border border-border/70 bg-card p-8 shadow-sm">
        <LogoMark className="mx-auto size-10" />
        <h1 className="mt-4 text-center text-2xl font-semibold tracking-tight">Sign up</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Save your results and track your risk over time. We only store what the
          questionnaire asks — see our{" "}
          <a href="/privacy" className="text-primary underline">privacy page</a>.
        </p>
        <AuthForm mode="signup" />
      </div>
    </div>
  );
}
