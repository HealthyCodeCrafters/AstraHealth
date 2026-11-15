import { dayTotal } from "./derived";
import { STATUS_META } from "./ranges";
import type { AstraState, Reading, ReadingKind, Status } from "./types";

export interface ValidationResult {
  ok: boolean;
  errors: Record<string, string>;
}

/** Plausibility limits for manual entry — values outside these are almost certainly typos. */
export const ENTRY_LIMITS = {
  heartRate: { min: 25, max: 220 },
  systolic: { min: 60, max: 250 },
  diastolic: { min: 30, max: 150 },
  spo2: { min: 50, max: 100 },
  sleep: { min: 0, max: 16 },
  quality: { min: 1, max: 5 },
  water: { min: 50, max: 2000 },
  activity: { min: 1, max: 360 },
};

function check(errors: Record<string, string>, field: string, raw: string, limit: { min: number; max: number }, label: string, integer = true) {
  if (raw.trim() === "") {
    errors[field] = `Enter ${label}.`;
    return NaN;
  }
  const v = Number(raw);
  if (!Number.isFinite(v)) {
    errors[field] = `${label[0].toUpperCase()}${label.slice(1)} must be a number.`;
    return NaN;
  }
  if (integer && !Number.isInteger(v)) {
    errors[field] = `Use a whole number for ${label}.`;
    return NaN;
  }
  if (v < limit.min || v > limit.max) {
    errors[field] = `${label[0].toUpperCase()}${label.slice(1)} should be between ${limit.min} and ${limit.max}. Check the value and try again.`;
    return NaN;
  }
  return v;
}

export function validateEntry(kind: ReadingKind, f: Record<string, string>): ValidationResult & { value?: number; value2?: number } {
  const errors: Record<string, string> = {};
  let value = NaN;
  let value2: number | undefined;
  switch (kind) {
    case "heartRate":
      value = check(errors, "value", f.value ?? "", ENTRY_LIMITS.heartRate, "heart rate");
      break;
    case "bloodPressure":
      value = check(errors, "value", f.value ?? "", ENTRY_LIMITS.systolic, "systolic pressure");
      value2 = check(errors, "value2", f.value2 ?? "", ENTRY_LIMITS.diastolic, "diastolic pressure");
      if (!errors.value && !errors.value2 && value2 >= value) errors.value2 = "Diastolic (bottom number) must be lower than systolic.";
      break;
    case "spo2":
      value = check(errors, "value", f.value ?? "", ENTRY_LIMITS.spo2, "oxygen saturation");
      break;
    case "sleep":
      value = check(errors, "value", f.value ?? "", ENTRY_LIMITS.sleep, "sleep hours", false);
      value2 = check(errors, "value2", f.value2 ?? "", ENTRY_LIMITS.quality, "sleep quality");
      break;
    case "water":
      value = check(errors, "value", f.value ?? "", ENTRY_LIMITS.water, "water volume");
      break;
    case "activity":
      value = check(errors, "value", f.value ?? "", ENTRY_LIMITS.activity, "activity minutes");
      break;
  }
  const ok = Object.keys(errors).length === 0;
  return { ok, errors, value: ok ? value : undefined, value2: ok ? value2 : undefined };
}

export function resultExplanation(r: Reading, status: Status | null, state: AstraState): string {
  const { ranges, profile } = state;
  const meta = status ? STATUS_META[status] : null;
  switch (r.kind) {
    case "heartRate":
      return `${r.value} bpm compared with your configured range of ${ranges.heartRate.normalMin}–${ranges.heartRate.normalMax} bpm. ${meta?.guidance} For trends, compare readings taken in the same conditions (e.g. resting on waking).`;
    case "bloodPressure":
      return `${r.value}/${r.value2} mmHg. Configured ranges: systolic ${ranges.systolic.normalMin}–${ranges.systolic.normalMax}, diastolic ${ranges.diastolic.normalMin}–${ranges.diastolic.normalMax} mmHg. ${meta?.guidance} Cuff position, talking and recent exercise can each shift a reading.`;
    case "spo2":
      return `${r.value}% SpO₂, configured reference ${ranges.spo2.normalMin}–${ranges.spo2.normalMax}%. ${meta?.guidance} If a value is low, warm your hand, check the clip fit and look at the cabin CO₂ panel before repeating.`;
    case "sleep":
      return `${r.value} h of sleep (quality ${r.value2}/5). Your configured range is ${ranges.sleep.normalMin}–${ranges.sleep.normalMax} h and personal target ${profile.sleepTargetHours} h. ${meta?.guidance}`;
    case "water": {
      const total = dayTotal(state.readings, "water", r.timestamp);
      const pct = Math.round((total / profile.hydrationTargetMl) * 100);
      return `Logged ${r.value} ml. Today's total is ${total.toLocaleString()} ml — ${pct}% of your ${profile.hydrationTargetMl.toLocaleString()} ml target. ${pct >= 100 ? "Target met — keep sipping steadily, especially around exercise." : "Spread the rest across the day; drink extra before and after exercise or EVA."}`;
    }
    case "activity": {
      const total = dayTotal(state.readings, "activity", r.timestamp);
      const pct = Math.round((total / profile.activityTargetMin) * 100);
      return `Logged ${r.value} min${r.context ? ` of ${r.context}` : ""}. Today's total is ${total} min — ${pct}% of your ${profile.activityTargetMin} min target. ${r.assigned ? "Assigned session recorded — this counts toward your exercise completion." : "Extra activity is great; your assigned sessions still protect bone and muscle the most."}`;
    }
  }
}
