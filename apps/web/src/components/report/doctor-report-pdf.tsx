import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { ALL_QUESTIONS } from "@/lib/questionnaire";
import { clinicalFieldLabel } from "@/lib/clinical";
import type { HistoryEntry } from "@/lib/history";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#221722" },
  title: { fontSize: 17, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  subtitle: { fontSize: 9, color: "#6b5a63", marginBottom: 14 },
  disclaimer: {
    fontSize: 8.5,
    padding: 9,
    backgroundColor: "#fdf6f9",
    borderWidth: 1,
    borderColor: "#f0b0cb",
    borderRadius: 6,
    marginBottom: 14,
    lineHeight: 1.4,
    color: "#5c3a4a",
  },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 16, marginBottom: 6, color: "#872f58" },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3, borderBottomWidth: 0.5, borderBottomColor: "#f1e4ea" },
  label: { color: "#6b5a63" },
  value: { fontFamily: "Helvetica-Bold" },
  bigNumber: { fontSize: 26, fontFamily: "Helvetica-Bold", color: "#ab3e70" },
  factorRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: "#f1e4ea" },
  factorLabel: { flex: 1 },
  factorDirection: { width: 90, textAlign: "right" },
  footer: { position: "absolute", bottom: 24, left: 36, right: 36, fontSize: 7.5, color: "#948592", lineHeight: 1.4 },
});

function displayAnswer(name: string, value: unknown): string {
  if (value === null || value === undefined) return "Not answered";
  const q = ALL_QUESTIONS.find((q) => q.name === name);
  if (q?.type === "boolean") return value ? (q.trueLabel ?? "Yes") : (q.falseLabel ?? "No");
  if (q?.unit) return `${value} ${q.unit}`;
  return String(value);
}

const RISK_BAND_TEXT: Record<string, string> = {
  low: "Low screening signal",
  moderate: "Emerging screening signal",
  elevated: "Elevated screening signal",
};

export function DoctorReportPdf({
  entry,
  generatedAt,
  comparison,
}: {
  entry: HistoryEntry;
  generatedAt: string;
  /** §9 — changes since the previous assessment, when one exists. */
  comparison?: { previousDate: string; narrative: string[]; changedAnswers: { label: string; before: string; after: string }[] } | null;
}) {
  const r = entry.result;
  const topFactors = r ? [...r.shapValues].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)).slice(0, 8) : [];
  const clinicalEntries = Object.entries(entry.clinical ?? {});

  return (
    <Document title="PCOSense Screening Report">
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>PCOSense — Screening Report</Text>
        <Text style={styles.subtitle}>
          Generated {generatedAt} · Screening completed {new Date(entry.createdAt).toLocaleString()}
        </Text>

        <View style={styles.disclaimer}>
          <Text>
            This document reports the output of an automated self-screening questionnaire. It
            is NOT a diagnosis. PCOS diagnosis requires clinical evaluation against the
            Rotterdam criteria (clinical, biochemical, and ultrasound assessment) by a
            qualified clinician. The factors listed below are statistical associations found
            by a model trained on a small public dataset — they are not proven causes of
            PCOS and should not be interpreted as such. Please use this as a starting point
            for discussion, not a substitute for clinical judgment. This report is intended to
            support discussion with a healthcare professional. It is not a diagnosis.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Screening signal</Text>
        {r && !r.isInsufficientData ? (
          <>
            <Text style={styles.bigNumber}>{Math.round(r.riskProbability * 100)} / 100</Text>
            <Text style={{ marginBottom: 4 }}>{RISK_BAND_TEXT[r.riskBand] ?? r.riskBand}</Text>
            <Text style={{ color: "#555555" }}>
              Data confidence: {Math.round(r.confidenceScore * 100)}% · Model version {r.modelVersion}
            </Text>
            <Text style={{ color: "#555555", marginTop: 3 }}>
              This signal scales how strongly the responses match patterns in the model&apos;s
              training data. It is not a probability of having or developing PCOS.
            </Text>
          </>
        ) : (
          <Text>Insufficient data was provided for a reliable estimate at this screening.</Text>
        )}

        <Text style={styles.sectionTitle}>Patient-reported information</Text>
        {ALL_QUESTIONS.map((q) => (
          <View style={styles.row} key={q.name}>
            <Text style={styles.label}>{q.label}</Text>
            <Text style={styles.value}>
              {displayAnswer(q.name, (entry.answers as unknown as Record<string, unknown>)[q.name])}
            </Text>
          </View>
        ))}
        {entry.bmi && (
          <View style={styles.row}>
            <Text style={styles.label}>Body mass index (BMI, calculated)</Text>
            <Text style={styles.value}>{entry.bmi.toFixed(1)}</Text>
          </View>
        )}

        {comparison && (
          <>
            <Text style={styles.sectionTitle}>Changes since previous assessment</Text>
            <Text style={{ color: "#6b5a63", marginBottom: 4 }}>
              Previous assessment: {comparison.previousDate}
            </Text>
            {comparison.narrative.map((line, i) => (
              <Text key={i} style={{ marginBottom: 2 }}>
                • {line}
              </Text>
            ))}
            {comparison.changedAnswers.map((c) => (
              <View style={styles.row} key={c.label}>
                <Text style={styles.label}>{c.label}</Text>
                {/* ASCII arrow: the built-in Helvetica face has no glyph for "→". */}
                <Text style={styles.value}>
                  {c.before} {"->"} {c.after}
                </Text>
              </View>
            ))}
          </>
        )}

        {clinicalEntries.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Optional clinical values (patient-entered)</Text>
            <Text style={{ color: "#6b5a63", marginBottom: 4 }}>
              Entered by the patient from their own records. Not measured, verified, or
              interpreted by PCOSense, and not used by the screening model.
            </Text>
            {clinicalEntries.map(([name, value]) => {
              const f = clinicalFieldLabel(name);
              return (
                <View style={styles.row} key={name}>
                  <Text style={styles.label}>{f.label}</Text>
                  <Text style={styles.value}>
                    {value} {f.unit}
                  </Text>
                </View>
              );
            })}
          </>
        )}

        {topFactors.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Factors most associated with this screening signal</Text>
            {topFactors.map((f) => (
              <View style={styles.factorRow} key={f.feature}>
                <Text style={styles.factorLabel}>
                  {f.label}
                  {f.is_imputed ? " (not answered — typical value assumed)" : ""}
                </Text>
                <Text style={styles.factorDirection}>
                  {f.direction === "higher_risk"
                    ? "Contributed toward a higher signal"
                    : "Contributed toward a lower signal"}
                </Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.footer}>
          Model trained on the public Kottarathil PCOS dataset (541 records, ten hospitals,
          Kerala, India) using only self-reportable, non-invasive features — no lab or
          imaging data. Not clinically validated. Generated by PCOSense, an AI-assisted
          screening tool built for SHELIX 2026; not a certified medical device.
        </Text>
      </Page>
    </Document>
  );
}
