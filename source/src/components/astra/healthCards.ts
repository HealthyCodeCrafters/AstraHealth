import {
  Activity,
  Droplets,
  Dumbbell,
  Gauge,
  HeartPulse,
  Moon,
  Radiation,
  Thermometer,
  Wind,
  Waves,
  Orbit,
  HeartHandshake,
  type LucideIcon,
} from "lucide-react";

import {
  byKind,
  classifyTarget,
  dailySeries,
  dayTotal,
  environmentFeed,
  latest,
  paceFraction,
  rawSeries,
  splitTrend,
  trendOf,
  type Trend,
} from "@/lib/astra/derived";
import { ENVIRONMENTS } from "@/lib/astra/environments";
import { classify, classifyBloodPressure } from "@/lib/astra/ranges";
import { DAY_MS, dayKey, startOfDay } from "@/lib/astra/time";
import type { AstraState, EnvironmentId, Status } from "@/lib/astra/types";

export type CardKey =
  | "hr"
  | "rhr"
  | "bp"
  | "spo2"
  | "activity"
  | "exercise"
  | "sleep"
  | "water"
  | "temp"
  | "radiation"
  | "co2"
  | "gravity";

export interface HealthCard {
  key: CardKey;
  group: "Cardiovascular" | "Physical" | "Environment";
  icon: LucideIcon;
  title: string;
  value: string;
  unit?: string;
  status: Status;
  trend: Trend;
  series: { label: string; value: number }[];
  explanation: string;
  footer?: string;
}

export const ENV_PRIORITY: Record<EnvironmentId, CardKey[]> = {
  orbit: ["hr", "bp", "sleep", "radiation", "co2"],
  iss: ["activity", "exercise", "temp", "co2", "rhr"],
  lunar: ["activity", "water", "radiation", "gravity", "spo2"],
  mars: ["sleep", "hr", "bp", "co2", "temp"],
};

export function buildHealthCards(state: AstraState, now = Date.now()): HealthCard[] {
  const { readings, ranges, profile } = state;
  const env = ENVIRONMENTS[profile.environment];
  const feed = environmentFeed(state, 24, now);
  const lastEnv = feed[feed.length - 1];

  const hrLatest = latest(readings, "heartRate");
  const hrDaily = dailySeries(readings, "heartRate", 14, "avg", now);
  const hrT = splitTrend(hrDaily);
  const restDaily = dailySeries(readings, "heartRate", 14, "min", now);
  const restT = splitTrend(restDaily);
  const bp = latest(readings, "bloodPressure");
  const bpDaily = dailySeries(readings, "bloodPressure", 14, "avg", now);
  const bpT = splitTrend(bpDaily);
  const spo2 = latest(readings, "spo2");
  const spo2Daily = dailySeries(readings, "spo2", 14, "avg", now);
  const spo2T = splitTrend(spo2Daily);
  const sleep = latest(readings, "sleep");
  const sleepDaily = dailySeries(readings, "sleep", 14, "avg", now);
  const sleepT = splitTrend(sleepDaily);

  const pace = paceFraction(now);
  const activityToday = dayTotal(readings, "activity", now);
  const activityDaily = dailySeries(readings, "activity", 14, "sum", now);
  const actT = splitTrend(activityDaily.slice(0, -1));
  const waterToday = dayTotal(readings, "water", now);
  const waterDaily = dailySeries(readings, "water", 14, "sum", now);
  const waterT = splitTrend(waterDaily.slice(0, -1));

  // Exercise completion: share of scheduled exercise reminders completed over the last 7 days.
  const exerciseReminders = state.reminders.filter((r) => r.category === "exercise" && r.enabled);
  const completion: { label: string; value: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const ts = startOfDay(now) - i * DAY_MS;
    const sched = exerciseReminders.filter((r) => r.days.includes(new Date(ts).getDay()));
    const done = sched.filter((r) => r.completions.includes(dayKey(ts))).length;
    completion.push({ label: new Date(ts).toLocaleDateString([], { day: "numeric", month: "short" }), value: sched.length ? Math.round((done / sched.length) * 100) : 100 });
  }
  const last7 = completion.slice(-8, -1);
  const prior7 = completion.slice(0, 6);
  const completionRate = last7.length ? Math.round(last7.reduce((s, p) => s + p.value, 0) / last7.length) : 0;

  const fmt = (s: { label: string; value: number }[]) => s.map((p) => ({ label: p.label, value: p.value }));

  return [
    {
      key: "hr",
      group: "Cardiovascular",
      icon: HeartPulse,
      title: "Heart rate",
      value: hrLatest ? String(hrLatest.value) : "—",
      unit: "bpm",
      status: hrLatest ? classify(hrLatest.value, ranges.heartRate) : "yellow",
      trend: trendOf(hrT.recent, hrT.baseline, 2, "center", 70),
      series: fmt(rawSeries(readings, "heartRate", 7 * DAY_MS, now)),
      explanation: "Beats per minute. Rises with activity and stress; in microgravity the heart works against less gravity.",
      footer: hrLatest ? `Last: ${hrLatest.context ?? "manual"} · ${new Date(hrLatest.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}` : undefined,
    },
    {
      key: "rhr",
      group: "Cardiovascular",
      icon: Waves,
      title: "Resting HR trend",
      value: restDaily.length ? String(Math.round(restDaily[restDaily.length - 1].value)) : "—",
      unit: "bpm",
      status: restDaily.length ? classify(restDaily[restDaily.length - 1].value, ranges.heartRate) : "yellow",
      trend: trendOf(restT.recent, restT.baseline, 1.5, "lower"),
      series: fmt(restDaily),
      explanation: "Lowest daily heart rate. A slowly rising trend can reflect fatigue, poor sleep or deconditioning.",
    },
    {
      key: "bp",
      group: "Cardiovascular",
      icon: Gauge,
      title: "Blood pressure",
      value: bp ? `${bp.value}/${bp.value2}` : "—",
      unit: "mmHg",
      status: bp ? classifyBloodPressure(bp.value, bp.value2 ?? 0, ranges) : "yellow",
      trend: trendOf(bpT.recent, bpT.baseline, 3, "center", 115),
      series: fmt(bpDaily),
      explanation: "Systolic/diastolic pressure. Fluid shifts in space change how the body regulates blood pressure.",
      footer: "Chart shows daily systolic average",
    },
    {
      key: "spo2",
      group: "Cardiovascular",
      icon: Wind,
      title: "Oxygen saturation",
      value: spo2 ? String(spo2.value) : "—",
      unit: "%",
      status: spo2 ? classify(spo2.value, ranges.spo2) : "yellow",
      trend: trendOf(spo2T.recent, spo2T.baseline, 0.5, "higher"),
      series: fmt(rawSeries(readings, "spo2", 7 * DAY_MS, now)),
      explanation: "How much of your blood's haemoglobin carries oxygen. Confirms cabin air and lungs are working well.",
    },
    {
      key: "activity",
      group: "Physical",
      icon: Activity,
      title: "Daily activity",
      value: String(activityToday),
      unit: `/ ${profile.activityTargetMin} min`,
      status: classifyTarget(activityToday / (profile.activityTargetMin * pace)),
      trend: trendOf(actT.recent, actT.baseline, 8, "higher"),
      series: fmt(activityDaily),
      explanation: "Exercise and physical work today, compared with the target expected by this time of day.",
    },
    {
      key: "exercise",
      group: "Physical",
      icon: Dumbbell,
      title: "Exercise completion",
      value: String(completionRate),
      unit: "% · 7 days",
      status: classifyTarget(completionRate / 100),
      trend: trendOf(
        last7.map((p) => p.value),
        prior7.map((p) => p.value),
        5,
        "higher",
      ),
      series: completion,
      explanation: "Share of assigned exercise sessions completed. Consistent exercise protects bone and muscle.",
    },
    {
      key: "sleep",
      group: "Physical",
      icon: Moon,
      title: "Sleep",
      value: sleep ? String(sleep.value) : "—",
      unit: sleep?.value2 ? `h · quality ${sleep.value2}/5` : "h",
      status: sleep ? classify(sleep.value, ranges.sleep) : "yellow",
      trend: trendOf(sleepT.recent, sleepT.baseline, 0.3, "center", 8),
      series: fmt(sleepDaily),
      explanation: "Duration of your last sleep period. Noise, light and schedules often shorten sleep in space.",
    },
    {
      key: "water",
      group: "Physical",
      icon: Droplets,
      title: "Hydration",
      value: String(waterToday),
      unit: `/ ${profile.hydrationTargetMl} ml`,
      status: classifyTarget(waterToday / (profile.hydrationTargetMl * pace)),
      trend: trendOf(waterT.recent, waterT.baseline, 150, "higher"),
      series: fmt(waterDaily),
      explanation: "Fluid intake today versus the amount expected by now. Thirst is weaker in microgravity.",
    },
    {
      key: "temp",
      group: "Environment",
      icon: Thermometer,
      title: "Cabin temperature",
      value: lastEnv.cabinTemp.toFixed(1),
      unit: "°C",
      status: classify(lastEnv.cabinTemp, ranges.cabinTemp),
      trend: "stable",
      series: feed.map((f) => ({ label: f.label, value: f.cabinTemp })),
      explanation: "Module air temperature. Comfortable temperatures support sleep and exercise recovery.",
    },
    {
      key: "radiation",
      group: "Environment",
      icon: Radiation,
      title: "Radiation dose rate",
      value: lastEnv.radiation.toFixed(2),
      unit: "mSv/day",
      status: classify(lastEnv.radiation, ranges.radiation),
      trend: "stable",
      series: feed.map((f) => ({ label: f.label, value: f.radiation })),
      explanation: `Area dosimeter estimate for ${env.short}. Cumulative dose is tracked against mission limits.`,
    },
    {
      key: "co2",
      group: "Environment",
      icon: HeartHandshake,
      title: "Cabin CO₂",
      value: lastEnv.co2.toFixed(1),
      unit: "mmHg",
      status: classify(lastEnv.co2, ranges.co2),
      trend: "stable",
      series: feed.map((f) => ({ label: f.label, value: f.co2 })),
      explanation: "Partial pressure of carbon dioxide. Elevated CO₂ can cause headaches and tiredness.",
    },
    {
      key: "gravity",
      group: "Environment",
      icon: Orbit,
      title: "Gravity environment",
      value: env.gravityG === 0 ? "µg" : env.gravityG.toFixed(3),
      unit: env.gravityG === 0 ? "" : "g",
      status: "green",
      trend: "stable",
      series: feed.map((f) => ({ label: f.label, value: env.gravityG })),
      explanation: `${env.gravityLabel}. Lower gravity unloads bones and muscles and shifts body fluids.`,
    },
  ];
}

export function healthReadingsCount(state: AstraState) {
  return byKind(state.readings, "heartRate").length;
}
