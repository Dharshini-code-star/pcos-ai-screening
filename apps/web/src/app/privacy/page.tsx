import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteDataButton } from "@/components/privacy/delete-data-button";

export default async function PrivacyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div data-animate-group className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>

      <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          <strong className="text-foreground">Nothing is stored until you choose to save it.</strong>{" "}
          You can complete the full screening questionnaire and see your result without an
          account — that result exists only in your browser for that session and is never
          sent to our database.
        </p>
        <p>
          <strong className="text-foreground">Creating an account only stores what the questionnaire asks.</strong>{" "}
          Your answers, the computed risk estimate, and the explanation behind it — nothing
          more. We don&apos;t collect your name, location, or any identifier beyond your login
          email.
        </p>
        <p>
          <strong className="text-foreground">Every table is access-controlled per user</strong> at the
          database level (Postgres row-level security), so your saved results are only ever
          readable by you, never by other users.
        </p>
        <p>
          <strong className="text-foreground">You can delete everything, anytime.</strong> The button
          below permanently removes every screening result and assistant conversation tied
          to your account. This cannot be undone.
        </p>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Delete my data</CardTitle>
        </CardHeader>
        <CardContent>
          {user ? (
            <DeleteDataButton />
          ) : (
            <p className="text-sm text-muted-foreground">Log in to manage or delete your saved data.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
