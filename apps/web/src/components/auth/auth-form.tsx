"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (!data.session) {
          // Email confirmation is required by this Supabase project's auth
          // settings — no session yet.
          setCheckEmail(true);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
      // Navigate first, then refresh: the header is a server component in the
      // root layout, and refreshing before the push only re-rendered the page
      // being left, so the destination kept the signed-out header.
      router.push("/screening/results");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (checkEmail) {
    return (
      <Alert>
        <AlertDescription>
          Check <strong>{email}</strong> for a confirmation link, then come back and log in.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full rounded-full" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />}
        {mode === "signup" ? "Create account" : "Log in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {mode === "signup" ? (
          <>Already have an account? <Link href="/login" className="font-medium text-primary underline">Log in</Link></>
        ) : (
          <>Don&apos;t have an account? <Link href="/signup" className="font-medium text-primary underline">Sign up</Link></>
        )}
      </p>
    </form>
  );
}
