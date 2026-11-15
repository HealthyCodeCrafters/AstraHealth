// Daily checkup scoring, improvement tips, the personalised emergency scan model and the strict routine.
import type { AstronautSettings, DailyCheckup } from "./types";

export const CHECKUP_FIELDS = [
  { key: "heartRate", label: "Heart rate", unit: "bpm", min: 55, max: 90, device: "ECG chest strap" },
  { key: "systolic", label: "Systolic BP", unit: "mmHg", min: 95, max: 130, device: "BP cuff" },
  { key: "diastolic", label: "Diastolic BP", unit: "mmHg", min: 60, max: 85, device: "BP cuff" },
  { key: "spo2", label: "Oxygen (SpO₂)", unit: "%", min: 95, max: 100, device: "Pulse oximeter" },
  { key: "temperature", label: "Body temperature", unit: "°C", min: 36.1, max: 37.5, device: "Thermometer" },
  { key: "glucose", label: "Blood glucose", unit: "mg/dL", min: 70, max: 140, device: "Glucometer" },
  { key: "weightKg", label: "Body mass", unit: "kg", min: 0, max: 999, device: "Mass measurement device" },
  { key: "sleepHours", label: "Sleep", unit: "h", min: 7, max: 9, device: "Actigraphy watch" },
] as const;

export type CheckupKey = (typeof CHECKUP_FIELDS)[number]["key"];

/** Score each measurement 0-100: 100 inside range, dropping 10 points per 5% outside it. */
export function fieldScore(key: CheckupKey, v: number): number {
  const f = CHECKUP_FIELDS.find((x) => x.key === key)!;
  if (v >= f.min && v <= f.max) return 100;
  const edge = v < f.min ? f.min : f.max;
  const pct = (Math.abs(v - edge) / edge) * 100;
  return Math.max(0, Math.round(100 - pct * 2));
}

export function checkupScore(c: DailyCheckup): number {
  const keys = CHECKUP_FIELDS.filter((f) => f.key !== "weightKg").map((f) => f.key);
  return Math.round(keys.reduce((s, k) => s + fieldScore(k, c[k]), 0) / keys.length);
}

export function improvements(c: DailyCheckup | undefined, s?: AstronautSettings): string[] {
  if (!c) return ["Log today's checkup to get personalised advice."];
  const tips: string[] = [];
  if (c.heartRate > 90) tips.push("Heart rate is high: do 5 minutes of slow breathing (4s in, 6s out) and drink 250 ml of water.");
  if (c.heartRate < 55) tips.push("Heart rate is low: if you feel dizzy, rest and tell the flight surgeon.");
  if (c.systolic > 130 || c.diastolic > 85) tips.push("Blood pressure is raised: cut salty rations today and add a 20-minute bike session.");
  if (c.systolic < 95) tips.push("Blood pressure is low: increase fluids and salt tablets as advised; stand up slowly.");
  if (c.spo2 < 95) tips.push("Oxygen is low: check sensor fit, check cabin CO₂ and rest near an air vent. Re-test in 10 minutes.");
  if (c.temperature > 37.5) tips.push("Temperature is raised: rest, hydrate and re-check in 2 hours. Report if over 38 °C.");
  if (c.glucose > 140) tips.push("Glucose is high: choose low-sugar meals and add light exercise after eating.");
  if (c.glucose < 70) tips.push("Glucose is low: eat a fast-acting snack (juice or glucose gel) now.");
  if (c.sleepHours < 7) tips.push("Sleep was short: dim cabin lights 1 hour before bed and avoid screens; aim for 8 hours tonight.");
  if (s?.diet === "high-protein") tips.push("Keep protein spread across 4 meals to protect muscle in low gravity.");
  if (s?.diet === "vegan" || s?.diet === "vegetarian") tips.push("Take your B12, iron and vitamin D supplements with breakfast.");
  tips.push("Do your 2.5 h resistance and cardio countermeasures to protect bone and muscle.");
  return tips;
}

/* ---------- Personalised emergency scan model ---------- */

export interface ScanInput {
  heartRate: number;
  spo2: number;
  systolic: number;
  temperature: number;
  respRate: number;
  conscious: boolean;
  symptoms: string[];
}

export interface ScanResult {
  fatal: boolean;
  risk: number; // 0-100
  condition: string;
  explanation: string;
  steps: string[];
}

function baseline(history: DailyCheckup[]) {
  const pick = (k: CheckupKey, def: number) => {
    const v = history.map((h) => h[k]);
    if (!v.length) return { mean: def, sd: def * 0.08 };
    const mean = v.reduce((a, b) => a + b, 0) / v.length;
    const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length) || mean * 0.05;
    return { mean, sd: Math.max(sd, mean * 0.04) };
  };
  return { hr: pick("heartRate", 70), spo2: pick("spo2", 98), sys: pick("systolic", 115), temp: pick("temperature", 36.8) };
}

/** Anomaly model: compares the scan against this astronaut's own checkup history (z-scores),
 *  combined with hard clinical danger limits and reported symptoms. */
export function runScan(input: ScanInput, history: DailyCheckup[]): ScanResult {
  const b = baseline(history);
  const z = (v: number, m: { mean: number; sd: number }) => Math.abs(v - m.mean) / m.sd;
  let risk = Math.min(60, (z(input.heartRate, b.hr) + z(input.spo2, b.spo2) * 1.5 + z(input.systolic, b.sys) + z(input.temperature, b.temp)) * 4);
  const critical: string[] = [];
  if (!input.conscious) critical.push("unresponsive");
  if (input.spo2 < 88) critical.push("severe low oxygen");
  if (input.heartRate > 150 || input.heartRate < 40) critical.push("dangerous heart rhythm");
  if (input.systolic < 80 || input.systolic > 190) critical.push("dangerous blood pressure");
  if (input.respRate < 8 || input.respRate > 30) critical.push("abnormal breathing");
  if (input.temperature > 40) critical.push("very high fever");
  if (input.symptoms.includes("chest pain")) critical.push("chest pain");
  if (input.symptoms.includes("severe bleeding")) critical.push("severe bleeding");
  risk += critical.length * 25 + input.symptoms.length * 4;
  risk = Math.min(100, Math.round(risk));
  const fatal = critical.length > 0 || risk >= 75;

  if (fatal) {
    return {
      fatal,
      risk: Math.max(risk, 75),
      condition: `Life-threatening: ${critical.join(", ") || "multiple vital signs far from your normal"}`,
      explanation: "Your readings are far outside your personal baseline. Your workplace is being alerted now.",
      steps: [
        "Stay still and secure yourself to a restraint or wall.",
        "Put on the oxygen mask from the medical kit at 4 L/min.",
        input.symptoms.includes("severe bleeding") ? "Press firmly on the wound with gauze and do not let go." : "Loosen tight clothing around your chest and neck.",
        input.symptoms.includes("chest pain") ? "Chew one 325 mg aspirin from the kit unless you are allergic." : "Breathe slowly: 4 seconds in, 6 seconds out.",
        "If a crewmate is near, they should prepare the defibrillator (AED).",
      ],
    };
  }

  let condition = "Mild deviation from your baseline";
  const steps: string[] = [];
  if (input.symptoms.includes("dizziness") || input.symptoms.includes("nausea")) {
    condition = "Space motion sickness / disorientation";
    steps.push("Keep your head still and look at a fixed point.", "Take the anti-nausea medicine from the kit if prescribed.");
  }
  if (input.symptoms.includes("muscle cramp") || input.symptoms.includes("back pain")) {
    condition = "Muscle strain or spasm";
    steps.push("Gently stretch the muscle for 30 seconds, three times.", "Apply a warm pack and drink 500 ml of electrolyte water.");
  }
  if (input.symptoms.includes("headache")) {
    condition = condition === "Mild deviation from your baseline" ? "Headache (possible CO₂ or fluid shift)" : condition;
    steps.push("Move near a fan or air vent and check cabin CO₂.", "Drink water and rest for 20 minutes.");
  }
  if (input.spo2 < 95) steps.push("Check the oximeter fit and re-test after 5 slow breaths.");
  if (input.heartRate > 100) steps.push("Stop activity and rest until your heart rate is under 100.");
  if (!steps.length) steps.push("Rest for 10 minutes and drink 250 ml of water.");
  return {
    fatal,
    risk,
    condition,
    explanation: "Not life-threatening. Try moving each arm and leg slowly to check for pain or weakness.",
    steps: [...steps, "Run a new scan in 15 minutes, or sooner if you feel worse."],
  };
}

/* ---------- Strict routine ---------- */

export interface RoutineBlock {
  time: string;
  title: string;
  detail: string;
}

export function strictRoutine(c: DailyCheckup | undefined, s?: AstronautSettings): RoutineBlock[] {
  const lowSleep = c ? c.sleepHours < 7 : false;
  const highBp = c ? c.systolic > 130 : false;
  const lowO2 = c ? c.spo2 < 95 : false;
  const meal = (when: string) => {
    switch (s?.diet) {
      case "high-protein": return `${when}: lean protein ration + vegetables`;
      case "vegan": return `${when}: legumes, grains and fortified plant milk`;
      case "vegetarian": return `${when}: eggs or dairy, grains and vegetables`;
      case "low-sodium": return `${when}: low-salt ration, fresh produce`;
      case "diabetic": return `${when}: low-sugar ration, whole grains, protein`;
      default: return `${when}: standard balanced ration`;
    }
  };
  return [
    { time: "06:30", title: "Wake & hydrate", detail: "Drink 500 ml water. Lights to full brightness." },
    { time: "06:45", title: "Daily health checkup", detail: "Heart rate, BP, oxygen, temperature, glucose, mass. Log it in ASTRA." },
    { time: "07:15", title: "Breakfast", detail: meal("Breakfast") + (highBp ? " — no added salt" : "") },
    { time: "08:00", title: "Mission work block", detail: "Drink 250 ml every hour." },
    { time: "10:30", title: "Resistance training (ARED)", detail: "60 min squats, deadlifts, heel raises to protect bones." },
    { time: "12:00", title: "Lunch", detail: meal("Lunch") },
    { time: "13:00", title: "Mission work block", detail: lowO2 ? "Re-check oxygen at 14:00." : "Stand and stretch every 45 min." },
    { time: "16:00", title: "Cardio (treadmill or bike)", detail: highBp ? "45 min moderate pace to lower blood pressure." : "40 min interval session." },
    { time: "17:00", title: "Wellbeing talk with Nova", detail: "10-minute check-in with your AI companion." },
    { time: "18:30", title: "Dinner", detail: meal("Dinner") },
    { time: "19:30", title: "Free time / call home", detail: "Personal time and family contact." },
    { time: lowSleep ? "20:30" : "21:00", title: "Wind down", detail: "Dim lights, no screens, light stretching." },
    { time: lowSleep ? "21:30" : "22:00", title: "Sleep", detail: lowSleep ? "Early sleep — aim for 8.5 hours to recover." : "8 hours sleep." },
  ];
}
