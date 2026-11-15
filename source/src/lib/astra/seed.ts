import { DEFAULT_RANGES } from "./ranges";
import type { Alert, AstraState, Reading, Reminder, WellbeingEntry } from "./types";
import { dayKey } from "./time";

export const STATE_VERSION = 1;
export const SEED_MISSION_DAYS_ELAPSED = 86;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let idCounter = 0;
export function uid(prefix = "id") {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function at(dayStart: number, hour: number, minute = 0) {
  return dayStart + hour * 3_600_000 + minute * 60_000;
}

export function createSeedState(now = Date.now()): AstraState {
  const rand = mulberry32(42);
  const noise = (amp: number) => (rand() * 2 - 1) * amp;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();
  const start = new Date(todayStart - (SEED_MISSION_DAYS_ELAPSED - 1) * 86_400_000);

  const readings: Reading[] = [];
  const alerts: Alert[] = [];
  const push = (r: Omit<Reading, "id" | "simulated">) => {
    if (r.timestamp > now) return null;
    const reading: Reading = { ...r, id: uid("r"), simulated: true };
    readings.push(reading);
    return reading;
  };

  for (let d = SEED_MISSION_DAYS_ELAPSED - 1; d >= 0; d--) {
    const ds = todayStart - d * 86_400_000;
    const progress = 1 - d / SEED_MISSION_DAYS_ELAPSED; // 0 → 1 across mission
    const restingBase = 58 + progress * 4;

    push({ kind: "heartRate", value: Math.round(restingBase + noise(3)), context: "Resting", timestamp: at(ds, 7, 10) });
    push({ kind: "heartRate", value: Math.round(74 + noise(6)), context: "Daytime", timestamp: at(ds, 13, 20) });
    push({ kind: "heartRate", value: Math.round(68 + noise(5)), context: "Evening", timestamp: at(ds, 19, 40) });

    push({
      kind: "bloodPressure",
      value: Math.round(114 + progress * 4 + noise(5)),
      value2: Math.round(74 + noise(4)),
      timestamp: at(ds, 7, 30),
    });

    push({ kind: "spo2", value: Math.round(97 + noise(1.3)), timestamp: at(ds, 8, 0) });
    push({ kind: "spo2", value: Math.round(97 + noise(1.2)), timestamp: at(ds, 20, 0) });

    push({
      kind: "sleep",
      value: Math.round((6.9 + noise(0.7) - (d % 7 === 3 ? 0.8 : 0)) * 10) / 10,
      value2: Math.max(1, Math.min(5, Math.round(3.6 + noise(1)))),
      timestamp: at(ds, 6, 30),
    });

    const pouches = d === 0 ? [500, 350, 400, 300] : [500, 400, 450, 350, 400, 300];
    const hours = [7.5, 10, 12.5, 15, 17.5, 20];
    pouches.forEach((ml, i) => {
      if (d > 0 && rand() < 0.12) return; // occasionally missed
      push({ kind: "water", value: ml, timestamp: at(ds, Math.floor(hours[i]), (hours[i] % 1) * 60) });
    });

    if (rand() > 0.08) push({ kind: "activity", value: 60, assigned: true, context: "ARED resistance", timestamp: at(ds, 11, 30) });
    if (rand() > 0.15)
      push({ kind: "activity", value: Math.round(40 + noise(8)), assigned: true, context: "CEVIS cycle", timestamp: at(ds, 16, 45) });
  }

  // A few clearly simulated anomalies so the alert centre has history.
  const anomalies: { d: number; reading: Omit<Reading, "id" | "simulated" | "timestamp">; h: number; status: Alert["status"]; title: string; message: string }[] = [
    {
      d: 30,
      h: 21,
      reading: { kind: "spo2", value: 93 },
      status: "yellow",
      title: "Oxygen saturation slightly low",
      message: "SpO₂ 93% after a high-CO₂ period in the node. Repeat measurement recommended; a repeat 15 minutes later read 97%.",
    },
    {
      d: 12,
      h: 14,
      reading: { kind: "heartRate", value: 112, context: "Post-EVA prep" },
      status: "yellow",
      title: "Heart rate above reference range",
      message: "112 bpm recorded shortly after suit prep activity. Rest and repeat the measurement when calm.",
    },
    {
      d: 4,
      h: 9,
      reading: { kind: "bloodPressure", value: 141, value2: 89 },
      status: "orange",
      title: "Blood pressure notably above range",
      message: "141/89 mmHg. Repeat after 5 minutes of quiet rest and share the result in your next private medical conference.",
    },
  ];
  for (const a of anomalies) {
    const r = push({ ...a.reading, timestamp: at(todayStart - a.d * 86_400_000, a.h, 5) });
    if (r)
      alerts.push({
        id: uid("a"),
        readingId: r.id,
        metric: a.reading.kind,
        status: a.status,
        title: a.title,
        message: a.message,
        timestamp: r.timestamp,
        acknowledged: a.d > 10,
        simulated: true,
      });
  }

  readings.sort((a, b) => a.timestamp - b.timestamp);

  // Wellbeing: last 6 days present (streak of 6 — today's check-in completes 7).
  const wellbeing: WellbeingEntry[] = [];
  for (let d = 40; d >= 1; d--) {
    const skip = d === 7 || (d > 7 && rand() < 0.3);
    if (skip) continue;
    const dip = d >= 18 && d <= 22 ? 1 : 0; // a simulated stressful week
    const clamp = (v: number) => Math.max(1, Math.min(5, Math.round(v)));
    wellbeing.push({
      id: uid("w"),
      timestamp: at(todayStart - d * 86_400_000, 21, 15),
      mood: clamp(4 + noise(0.8) - dip),
      stress: clamp(2 + noise(0.8) + dip),
      energy: clamp(3.6 + noise(0.9) - dip),
      sleepSatisfaction: clamp(3.5 + noise(0.9)),
      wellbeing: clamp(3.9 + noise(0.7) - dip),
      simulated: true,
    });
  }

  const everyDay = [0, 1, 2, 3, 4, 5, 6];
  const baseReminders: Omit<Reminder, "id" | "completions">[] = [
    { title: "Log last sleep period", category: "sleep", time: "07:00", days: everyDay, enabled: true },
    { title: "Morning heart rate & blood pressure", category: "health", time: "07:30", days: everyDay, enabled: true },
    { title: "SpO₂ check — morning", category: "health", time: "08:00", days: everyDay, enabled: true },
    { title: "Hydration: drink 500 ml", category: "hydration", time: "10:00", days: everyDay, enabled: true },
    { title: "ARED resistance session (60 min)", category: "exercise", time: "11:00", days: [1, 2, 3, 4, 5, 6], enabled: true },
    { title: "Review cabin environment panel", category: "environment", time: "12:30", days: everyDay, enabled: true },
    { title: "Hydration: drink 500 ml", category: "hydration", time: "14:00", days: everyDay, enabled: true },
    { title: "CEVIS aerobic session (45 min)", category: "exercise", time: "16:30", days: everyDay, enabled: true },
    { title: "Hydration: drink 400 ml", category: "hydration", time: "18:00", days: everyDay, enabled: true },
    { title: "SpO₂ check — evening", category: "health", time: "20:00", days: everyDay, enabled: true },
    { title: "Daily wellbeing check-in", category: "wellbeing", time: "21:00", days: everyDay, enabled: true },
    { title: "Weekly vision & eye check", category: "health", time: "09:30", days: [3], enabled: true },
    { title: "Private family conference", category: "wellbeing", time: "15:00", days: [5], enabled: true },
  ];
  const reminders: Reminder[] = baseReminders.map((r) => {
    const completions: string[] = [];
    for (let d = 1; d <= 6; d++) {
      const date = new Date(todayStart - d * 86_400_000);
      if (r.days.includes(date.getDay()) && rand() > 0.12) completions.push(dayKey(date.getTime()));
    }
    return { ...r, id: uid("t"), completions };
  });

  return {
    version: STATE_VERSION,
    profile: {
      name: "Cmdr. Aria Kessler",
      astronautId: "ASTRA-07-AK",
      role: "Mission Commander · Flight Engineer",
      missionName: "Horizon Endurance IV",
      missionDurationDays: 180,
      missionStart: dayKey(start.getTime()),
      missionStatus: "Nominal",
      environment: "iss",
      hydrationTargetMl: 2500,
      activityTargetMin: 105,
      sleepTargetHours: 8,
      spo2ChecksPerDay: 2,
    },
    ranges: structuredClone(DEFAULT_RANGES),
    readings,
    alerts,
    reminders,
    wellbeing,
    quizzesPassed: [],
    readNotifications: [],
  };
}
