/**
 * §4 — Optional Clinical Data.
 *
 * These values are user-entered results they ALREADY HAVE from a healthcare
 * professional or laboratory. Critically:
 *   - they are never required,
 *   - they are never fed into the ML model (the model was trained on
 *     self-reportable inputs only — see services/ml/README.md),
 *   - no value here is interpreted, scored, flagged as abnormal, or used to
 *     assert any condition. They are carried as context for the doctor-ready
 *     summary only.
 */

export interface ClinicalField {
  name: string;
  label: string;
  unit: string;
  /** Shown under the field — plain-language context, never interpretation. */
  note?: string;
}

export interface ClinicalGroup {
  title: string;
  fields: ClinicalField[];
}

export const CLINICAL_GROUPS: ClinicalGroup[] = [
  {
    title: "Androgens",
    fields: [
      { name: "total_testosterone", label: "Total testosterone", unit: "ng/dL" },
      { name: "free_testosterone", label: "Free testosterone", unit: "pg/mL" },
      { name: "dheas", label: "DHEAS", unit: "µg/dL" },
    ],
  },
  {
    title: "Reproductive hormones",
    fields: [
      {
        name: "amh",
        label: "AMH",
        unit: "ng/mL",
        note: "AMH is not a standalone diagnostic test for PCOS. Guidelines do not recommend using it on its own to diagnose PCOS.",
      },
      { name: "lh", label: "LH", unit: "mIU/mL" },
      { name: "fsh", label: "FSH", unit: "mIU/mL" },
    ],
  },
  {
    title: "Metabolic",
    fields: [
      { name: "hba1c", label: "HbA1c", unit: "%" },
      { name: "fasting_glucose", label: "Fasting glucose", unit: "mg/dL" },
      { name: "triglycerides", label: "Triglycerides", unit: "mg/dL" },
      { name: "hdl", label: "HDL cholesterol", unit: "mg/dL" },
    ],
  },
  {
    title: "Vitals",
    fields: [
      { name: "bp_systolic", label: "Blood pressure (systolic)", unit: "mmHg" },
      { name: "bp_diastolic", label: "Blood pressure (diastolic)", unit: "mmHg" },
    ],
  },
];

export const CLINICAL_FIELDS: ClinicalField[] = CLINICAL_GROUPS.flatMap((g) => g.fields);

export type ClinicalData = Record<string, number>;

export function clinicalFieldLabel(name: string): { label: string; unit: string } {
  const f = CLINICAL_FIELDS.find((f) => f.name === name);
  return f ? { label: f.label, unit: f.unit } : { label: name, unit: "" };
}

export function hasClinicalValues(data: ClinicalData | null | undefined): boolean {
  return !!data && Object.keys(data).length > 0;
}
