import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { modelInfo } from "@/lib/ml/client";
import { DisclaimerBanner } from "@/components/shared/disclaimer-banner";
import { ResearchFrontier } from "@/components/research/research-frontier";

export default async function AboutModelPage() {
  let info;
  let error: string | null = null;
  try {
    info = await modelInfo();
  } catch {
    error = "Couldn't reach the screening service right now.";
  }

  return (
    <div id="disclaimer" data-animate-group className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-semibold tracking-tight">About the model</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Full transparency on how the risk estimate is produced, and where it falls short.
      </p>

      <DisclaimerBanner className="mt-4" />

      {error && <p className="mt-6 text-sm text-destructive">{error}</p>}

      {info && (
        <div data-animate-group className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Training data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                {info.n_training_rows} records from a single public dataset (
                <a
                  href="https://www.kaggle.com/datasets/prasoonkottarathil/polycystic-ovary-syndrome-pcos"
                  className="underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Kottarathil PCOS dataset, Kaggle
                </a>
                ) — women evaluated across ten hospitals in Kerala, India.
              </p>
              <p>
                Class balance: {info.class_balance["0"] ?? "—"} without PCOS,{" "}
                {info.class_balance["1"] ?? "—"} with PCOS.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Model &amp; performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                {info.selected_model.replace("_", " ")}, calibrated. Evaluated on a held-out
                20% test split never used for model selection or calibration:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>AUROC: {info.held_out_test.auroc.toFixed(3)}</li>
                <li>Accuracy: {(info.held_out_test.accuracy * 100).toFixed(1)}%</li>
                <li>Brier score (lower is better-calibrated): {info.held_out_test.brier.toFixed(3)}</li>
                <li>Test set size: {info.held_out_test.n_test_rows} records</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">What it asks — and what it deliberately doesn&apos;t</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Only {info.feature_columns.length} self-reportable, non-invasive fields: age,
                BMI, menstrual cycle patterns, common symptoms, and two lifestyle factors. No
                blood tests, no ultrasound, no clinical measurements — this is a screening
                questionnaire, not a lab panel.
              </p>
              <p>
                Family history is not included as a factor, despite being clinically
                relevant, because the training dataset doesn&apos;t contain it — we chose not to
                fabricate a feature with no data behind it.
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-300">
            <CardHeader>
              <CardTitle className="text-base">Limitations</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <p>{info.limitations}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <ResearchFrontier />
    </div>
  );
}
