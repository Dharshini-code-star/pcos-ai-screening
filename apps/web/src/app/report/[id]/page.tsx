import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { ClinicalDataForm } from "@/components/clinical/clinical-data-form";
import type { ClinicalData } from "@/lib/clinical";

export default async function ReportPage(props: PageProps<"/report/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, clinical_data")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!assessment) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Report not found</h1>
        <Button asChild className="mt-6 rounded-full">
          <Link href="/history">Back to history</Link>
        </Button>
      </div>
    );
  }

  const reportUrl = `/api/report/${id}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Doctor report</h1>
        <Button asChild className="rounded-full">
          <a href={reportUrl} download>
            <Download className="size-4" /> Download PDF
          </a>
        </Button>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        A one-page summary of this screening result, formatted to bring to a medical
        appointment.
      </p>

      {/* Mobile browsers generally don't render inline PDFs — show a clear
          download prompt there instead of a blank/broken embed. */}
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border/70 bg-muted/40 px-4 py-16 text-center sm:hidden">
        <FileText className="size-8 text-brand-mauve-500" />
        <p className="text-sm text-muted-foreground">
          Your phone&apos;s browser can&apos;t preview PDFs inline — download it instead.
        </p>
        <Button asChild className="rounded-full">
          <a href={reportUrl} download>
            <Download className="size-4" /> Download PDF
          </a>
        </Button>
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-border/70 sm:block" style={{ height: "80vh" }}>
        <embed src={reportUrl} type="application/pdf" width="100%" height="100%" />
      </div>

      <ClinicalDataForm
        assessmentId={id}
        initialValues={(assessment.clinical_data as ClinicalData) ?? {}}
      />
      <p className="mt-3 text-xs text-muted-foreground">
        After saving clinical values, re-download the PDF to include them in your summary.
      </p>
    </div>
  );
}
