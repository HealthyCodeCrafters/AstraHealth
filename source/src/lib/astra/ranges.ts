import type { RangeKey, RefRange, RefRanges, Status } from "./types";

/**
 * Illustrative default reference ranges for the demonstration.
 * Real ranges must come from the crew member's flight surgeon and mission protocols.
 */
export const DEFAULT_RANGES: RefRanges = {
  heartRate: { normalMin: 50, normalMax: 100, attentionMin: 45, attentionMax: 110, concernMin: 40, concernMax: 130 },
  systolic: { normalMin: 90, normalMax: 129, attentionMin: 85, attentionMax: 139, concernMin: 80, concernMax: 159 },
  diastolic: { normalMin: 60, normalMax: 84, attentionMin: 55, attentionMax: 89, concernMin: 50, concernMax: 99 },
  spo2: { normalMin: 95, normalMax: 100, attentionMin: 93, attentionMax: 100, concernMin: 90, concernMax: 100 },
  sleep: { normalMin: 7, normalMax: 9, attentionMin: 6, attentionMax: 10, concernMin: 5, concernMax: 11 },
  cabinTemp: { normalMin: 18, normalMax: 27, attentionMin: 17, attentionMax: 28, concernMin: 15, concernMax: 30 },
  co2: { normalMin: 0, normalMax: 3, attentionMin: 0, attentionMax: 4, concernMin: 0, concernMax: 5.3 },
  radiation: { normalMin: 0, normalMax: 1.5, attentionMin: 0, attentionMax: 2, concernMin: 0, concernMax: 5 },
};

export const RANGE_LABELS: Record<RangeKey, { label: string; unit: string }> = {
  heartRate: { label: "Heart rate", unit: "bpm" },
  systolic: { label: "Systolic pressure", unit: "mmHg" },
  diastolic: { label: "Diastolic pressure", unit: "mmHg" },
  spo2: { label: "Oxygen saturation", unit: "%" },
  sleep: { label: "Sleep duration", unit: "h" },
  cabinTemp: { label: "Cabin temperature", unit: "°C" },
  co2: { label: "Cabin CO₂ (ppCO₂)", unit: "mmHg" },
  radiation: { label: "Radiation dose rate", unit: "mSv/day" },
};

export function classify(value: number, r: RefRange): Status {
  if (value >= r.normalMin && value <= r.normalMax) return "green";
  if (value >= r.attentionMin && value <= r.attentionMax) return "yellow";
  if (value >= r.concernMin && value <= r.concernMax) return "orange";
  return "red";
}

const ORDER: Status[] = ["green", "yellow", "orange", "red"];

export function worst(...s: Status[]): Status {
  return s.reduce((a, b) => (ORDER.indexOf(b) > ORDER.indexOf(a) ? b : a), "green" as Status);
}

export function statusRank(s: Status) {
  return ORDER.indexOf(s);
}

/** Hydration and activity are scored against the personal daily target (ratio of target). */
export function classifyTarget(ratio: number): Status {
  if (ratio >= 0.9) return "green";
  if (ratio >= 0.6) return "yellow";
  if (ratio >= 0.3) return "orange";
  return "red";
}

export function classifyBloodPressure(sys: number, dia: number, ranges: RefRanges): Status {
  return worst(classify(sys, ranges.systolic), classify(dia, ranges.diastolic));
}

/** Validates that bands are nested: concern ⊇ attention ⊇ normal. */
export function validateRange(r: RefRange): string | null {
  const vals = Object.values(r);
  if (vals.some((v) => !Number.isFinite(v))) return "All limits must be numbers.";
  if (r.normalMin > r.normalMax) return "Reference minimum must be below the maximum.";
  if (r.attentionMin > r.normalMin || r.attentionMax < r.normalMax)
    return "Attention band must contain the reference range.";
  if (r.concernMin > r.attentionMin || r.concernMax < r.attentionMax)
    return "Concern band must contain the attention band.";
  return null;
}

export const STATUS_META: Record<Status, { label: string; short: string; guidance: string }> = {
  green: {
    label: "Within reference range",
    short: "Nominal",
    guidance: "Within your configured reference range. Continue routine monitoring.",
  },
  yellow: {
    label: "Requires attention",
    short: "Attention",
    guidance: "Slightly outside your reference range. Rest for a few minutes and repeat the measurement.",
  },
  orange: {
    label: "Significant concern",
    short: "Review",
    guidance:
      "Notably outside your reference range. Repeat the measurement and request a review through your mission's medical procedure.",
  },
  red: {
    label: "Urgent warning",
    short: "Urgent",
    guidance:
      "Far outside your reference range. Contact your mission medical officer now and follow the established emergency protocol.",
  },
};
