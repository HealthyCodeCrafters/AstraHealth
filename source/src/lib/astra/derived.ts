import { ENVIRONMENTS } from "./environments";
import { classify, classifyBloodPressure, classifyTarget, statusRank } from "./ranges";
import { DAY_MS, dayKey, minutesOfDay, parseDayKey, startOfDay } from "./time";
import type { AstraState, Reading, ReadingKind, RefRanges, Reminder, Status, WellbeingEntry } from "./types";

export type Trend = "improving" | "declining" | "stable";

export function missionDay(state: AstraState, now = Date.now()) {
  const start = parseDayKey(state.profile.missionStart);
  return Math.max(1, Math.floor((startOfDay(now) - start) / DAY_MS) + 1);
}

export function missionProgress(state: AstraState, now = Date.now()) {
  return Math.min(1, missionDay(state, now) / state.profile.missionDurationDays);
}

export function byKind(readings: Reading[], kind: ReadingKind) {
  return readings.filter((r) => r.kind === kind);
}

export function latest(readings: Reading[], kind: ReadingKind) {
  for (let i = readings.length - 1; i >= 0; i--) if (readings[i].kind === kind) return readings[i];
  return undefined;
}

export function readingStatus(r: Reading, ranges: RefRanges): Status | null {
  switch (r.kind) {
    case "heartRate":
      return classify(r.value, ranges.heartRate);
    case "bloodPressure":
      return classifyBloodPressure(r.value, r.value2 ?? 0, ranges);
    case "spo2":
      return classify(r.value, ranges.spo2);
    case "sleep":
      return classify(r.value, ranges.sleep);
    default:
      return null;
  }
}

export function dayTotal(readings: Reading[], kind: ReadingKind, ts = Date.now()) {
  const key = dayKey(ts);
  return readings.filter((r) => r.kind === kind && dayKey(r.timestamp) === key).reduce((s, r) => s + r.value, 0);
}

export type Agg = "avg" | "sum" | "min" | "max";

export interface SeriesPoint {
  t: number;
  label: string;
  value: number;
  value2?: number;
  status?: Status | null;
  flagged?: boolean;
}

export function dailySeries(readings: Reading[], kind: ReadingKind, days: number, agg: Agg, now = Date.now()): SeriesPoint[] {
  const start = startOfDay(now) - (days - 1) * DAY_MS;
  const buckets = new Map<string, Reading[]>();
  for (const r of readings) {
    if (r.kind !== kind || r.timestamp < start) continue;
    const k = dayKey(r.timestamp);
    const arr = buckets.get(k) ?? [];
    arr.push(r);
    buckets.set(k, arr);
  }
  const out: SeriesPoint[] = [];
  for (let i = 0; i < days; i++) {
    const t = start + i * DAY_MS;
    const arr = buckets.get(dayKey(t));
    if (!arr || arr.length === 0) {
      if (agg === "sum") out.push({ t, label: shortDate(t), value: 0 });
      continue;
    }
    const vals = arr.map((r) => r.value);
    const vals2 = arr.map((r) => r.value2 ?? 0);
    const reduce = (v: number[]) =>
      agg === "sum" ? v.reduce((a, b) => a + b, 0) : agg === "min" ? Math.min(...v) : agg === "max" ? Math.max(...v) : v.reduce((a, b) => a + b, 0) / v.length;
    out.push({
      t,
      label: shortDate(t),
      value: round1(reduce(vals)),
      value2: arr[0].value2 !== undefined ? round1(reduce(vals2)) : undefined,
    });
  }
  return out;
}

export function rawSeries(readings: Reading[], kind: ReadingKind, sinceMs: number, now = Date.now()): SeriesPoint[] {
  return readings
    .filter((r) => r.kind === kind && r.timestamp >= now - sinceMs)
    .map((r) => ({
      t: r.timestamp,
      label: new Date(r.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
      value: r.value,
      value2: r.value2,
    }));
}

function shortDate(t: number) {
  return new Date(t).toLocaleDateString([], { day: "numeric", month: "short" });
}

export function round1(v: number) {
  return Math.round(v * 10) / 10;
}

export function mean(v: number[]) {
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN;
}

export function stdev(v: number[]) {
  if (v.length < 2) return 0;
  const m = mean(v);
  return Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / (v.length - 1));
}

/** Flag points that leave the reference range or deviate more than 2 SD from the window mean. */
export function flagUnusual(points: SeriesPoint[], statusOf?: (p: SeriesPoint) => Status | null): SeriesPoint[] {
  const vals = points.map((p) => p.value);
  const m = mean(vals);
  const sd = stdev(vals);
  return points.map((p) => {
    const status = statusOf ? statusOf(p) : null;
    const z = sd > 0 ? Math.abs(p.value - m) / sd : 0;
    return { ...p, status, flagged: (status !== null && status !== "green") || z > 2 };
  });
}

/**
 * Compares the recent average with a baseline average.
 * better: "higher" → rising is improving; "lower" → falling is improving;
 * "center" → moving toward `center` is improving.
 */
export function trendOf(recent: number[], baseline: number[], tolerance: number, better: "higher" | "lower" | "center", center = 0): Trend {
  if (recent.length === 0 || baseline.length === 0) return "stable";
  const r = mean(recent);
  const b = mean(baseline);
  if (Math.abs(r - b) < tolerance) return "stable";
  if (better === "higher") return r > b ? "improving" : "declining";
  if (better === "lower") return r < b ? "improving" : "declining";
  return Math.abs(r - center) < Math.abs(b - center) ? "improving" : "declining";
}

export function splitTrend(points: SeriesPoint[], recentN = 3) {
  const vals = points.map((p) => p.value);
  return { recent: vals.slice(-recentN), baseline: vals.slice(0, -recentN) };
}

/* ---------- Environment (simulated sensor feed) ---------- */

export interface EnvSample {
  t: number;
  label: string;
  cabinTemp: number;
  co2: number;
  radiation: number;
}

export function environmentFeed(state: AstraState, hours = 24, now = Date.now()): EnvSample[] {
  const env = ENVIRONMENTS[state.profile.environment];
  const out: EnvSample[] = [];
  const baseHour = Math.floor(now / 3_600_000);
  for (let i = hours - 1; i >= 0; i--) {
    const h = baseHour - i;
    const s1 = Math.sin(h * 0.7) * 0.5 + Math.sin(h * 0.23) * 0.4;
    const s2 = Math.sin(h * 0.41 + 1) * 0.5 + Math.cos(h * 0.17) * 0.3;
    const s3 = Math.sin(h * 0.29 + 2);
    out.push({
      t: h * 3_600_000,
      label: `${String(new Date(h * 3_600_000).getHours()).padStart(2, "0")}:00`,
      cabinTemp: round1(env.cabinTemp + s1 * 0.8),
      co2: round1(env.co2 + s2 * 0.45),
      radiation: Math.round((env.radiation + s3 * env.radiation * 0.15) * 100) / 100,
    });
  }
  return out;
}

/* ---------- Gamification ---------- */

export function checkinDays(state: AstraState) {
  return new Set(state.wellbeing.map((w) => dayKey(w.timestamp)));
}

/** Consecutive days with a wellbeing check-in, counting back from today (or yesterday if today is not done yet). */
export function streak(wellbeing: WellbeingEntry[], now = Date.now()) {
  const days = new Set(wellbeing.map((w) => dayKey(w.timestamp)));
  let cursor = startOfDay(now);
  if (!days.has(dayKey(cursor))) cursor -= DAY_MS;
  let n = 0;
  while (days.has(dayKey(cursor))) {
    n += 1;
    cursor -= DAY_MS;
  }
  return n;
}

export const XP = { manualReading: 10, task: 15, checkin: 20, quiz: 30 };
export const XP_PER_LEVEL = 250;

export function xpTotal(state: AstraState) {
  const manual = state.readings.filter((r) => !r.simulated).length;
  const tasks = state.reminders.reduce((s, r) => s + r.completions.length, 0);
  return manual * XP.manualReading + tasks * XP.task + state.wellbeing.length * XP.checkin + state.quizzesPassed.length * XP.quiz;
}

export function levelInfo(xp: number) {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const into = xp % XP_PER_LEVEL;
  const titles = ["Cadet", "Specialist", "Flight Engineer", "Mission Specialist", "Commander", "Station Chief", "Pathfinder", "Deep-Space Veteran"];
  return { level, into, pct: into / XP_PER_LEVEL, title: titles[Math.min(titles.length - 1, Math.floor((level - 1) / 3))] };
}

export function remindersForDay(reminders: Reminder[], ts: number) {
  const dow = new Date(ts).getDay();
  return reminders.filter((r) => r.enabled && r.days.includes(dow)).sort((a, b) => minutesOfDay(a.time) - minutesOfDay(b.time));
}

export interface DailyMission {
  id: string;
  title: string;
  detail: string;
  done: boolean;
  progress: number;
  xp: number;
}

export function dailyMissions(state: AstraState, now = Date.now()): DailyMission[] {
  const key = dayKey(now);
  const today = state.readings.filter((r) => dayKey(r.timestamp) === key);
  const count = (k: ReadingKind) => today.filter((r) => r.kind === k).length;
  const water = dayTotal(state.readings, "water", now);
  const activity = today.filter((r) => r.kind === "activity" && r.assigned).reduce((s, r) => s + r.value, 0);
  const checkin = state.wellbeing.some((w) => dayKey(w.timestamp) === key);
  const p = state.profile;
  const mk = (id: string, title: string, detail: string, progress: number, xp: number): DailyMission => ({
    id,
    title,
    detail,
    progress: Math.min(1, progress),
    done: progress >= 1,
    xp,
  });
  return [
    mk("hr", "Record heart rate", `${count("heartRate")} / 1 today`, count("heartRate"), 10),
    mk("bp", "Record blood pressure", `${count("bloodPressure")} / 1 today`, count("bloodPressure"), 10),
    mk("spo2", "Scheduled SpO₂ checks", `${count("spo2")} / ${p.spo2ChecksPerDay} today`, count("spo2") / p.spo2ChecksPerDay, 20),
    mk("sleep", "Log your sleep", count("sleep") ? "Logged" : "Not logged yet", count("sleep"), 10),
    mk("water", "Meet hydration target", `${water} / ${p.hydrationTargetMl} ml`, water / p.hydrationTargetMl, 15),
    mk("exercise", "Complete assigned exercise", `${activity} / ${p.activityTargetMin} min`, activity / p.activityTargetMin, 15),
    mk("checkin", "Wellbeing check-in", checkin ? "Completed" : "Not completed", checkin ? 1 : 0, 20),
  ];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  progress: number;
  icon: "oxygen" | "sleep" | "water" | "heart" | "streak" | "mind" | "book" | "first";
}

export function badges(state: AstraState, now = Date.now()): Badge[] {
  const missions = dailyMissions(state, now);
  const m = (id: string) => missions.find((x) => x.id === id)!;
  const sleepDays = new Set(byKind(state.readings, "sleep").map((r) => dayKey(r.timestamp)));
  let sleepLogged = 0;
  for (let i = 0; i < 7; i++) if (sleepDays.has(dayKey(now - i * DAY_MS))) sleepLogged++;
  const s = streak(state.wellbeing, now);
  const weekCheckins = state.wellbeing.filter((w) => w.timestamp >= startOfDay(now) - 6 * DAY_MS).length;
  const manual = state.readings.filter((r) => !r.simulated).length;
  const cardio = (m("hr").progress + m("bp").progress) / 2;
  const mk = (b: Omit<Badge, "unlocked">): Badge => ({ ...b, progress: Math.min(1, b.progress), unlocked: b.progress >= 1 });
  return [
    mk({ id: "oxygen", name: "Oxygen Observer", description: "Complete all of today's scheduled SpO₂ recordings.", progress: m("spo2").progress, icon: "oxygen" }),
    mk({ id: "sleep", name: "Sleep Guardian", description: "Log your sleep on each of the last 7 days.", progress: sleepLogged / 7, icon: "sleep" }),
    mk({ id: "water", name: "Hydration Hero", description: "Meet your personal hydration target today.", progress: m("water").progress, icon: "water" }),
    mk({ id: "cardio", name: "Cardio Commander", description: "Complete today's heart rate and blood pressure assessments.", progress: cardio, icon: "heart" }),
    mk({ id: "streak", name: "Mission Consistency", description: "Seven consecutive days of wellbeing check-ins.", progress: s / 7, icon: "streak" }),
    mk({ id: "mind", name: "Mindful Navigator", description: "Five wellbeing check-ins within the past 7 days.", progress: weekCheckins / 5, icon: "mind" }),
    mk({ id: "scholar", name: "Space Medicine Scholar", description: "Pass three Education Centre quizzes.", progress: state.quizzesPassed.length / 3, icon: "book" }),
    mk({ id: "first", name: "First Contact", description: "Enter your first manual measurement.", progress: manual >= 1 ? 1 : 0, icon: "first" }),
  ];
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  current: number;
  target: number;
}

export function weeklyChallenges(state: AstraState, now = Date.now()): WeeklyChallenge[] {
  const since = startOfDay(now) - 6 * DAY_MS;
  const days = (pred: (ts: number) => boolean) => {
    let n = 0;
    for (let i = 0; i < 7; i++) if (pred(startOfDay(now) - i * DAY_MS)) n++;
    return n;
  };
  const hydrationDays = days((ts) => dayTotal(state.readings, "water", ts) >= state.profile.hydrationTargetMl);
  const sleepDays = days((ts) => state.readings.some((r) => r.kind === "sleep" && dayKey(r.timestamp) === dayKey(ts)));
  const checkins = state.wellbeing.filter((w) => w.timestamp >= since).length;
  const tasks = state.reminders.reduce((s, r) => s + r.completions.filter((c) => parseDayKey(c) >= since).length, 0);
  return [
    { id: "w-hyd", title: "Meet hydration target on 5 days", current: hydrationDays, target: 5 },
    { id: "w-sleep", title: "Log sleep every day this week", current: sleepDays, target: 7 },
    { id: "w-check", title: "Complete 6 wellbeing check-ins", current: checkins, target: 6 },
    { id: "w-tasks", title: "Complete 60 routine tasks", current: tasks, target: 60 },
  ];
}

/* ---------- Notifications ---------- */

export interface Notification {
  id: string;
  kind: "due" | "upcoming" | "alert";
  title: string;
  detail: string;
  status?: Status;
  reminderId?: string;
  ts: number;
}

export function notifications(state: AstraState, now = Date.now()): Notification[] {
  const key = dayKey(now);
  const nowMin = new Date(now).getHours() * 60 + new Date(now).getMinutes();
  const out: Notification[] = [];
  for (const r of remindersForDay(state.reminders, now)) {
    if (r.completions.includes(key)) continue;
    const mins = minutesOfDay(r.time);
    const ts = startOfDay(now) + mins * 60_000;
    if (mins <= nowMin) out.push({ id: `due-${r.id}-${key}`, kind: "due", title: r.title, detail: `Scheduled ${r.time} · overdue`, reminderId: r.id, ts });
    else if (mins - nowMin <= 90) out.push({ id: `up-${r.id}-${key}`, kind: "upcoming", title: r.title, detail: `Coming up at ${r.time}`, reminderId: r.id, ts });
  }
  if (!(state.checkups ?? []).some((c) => c.date === key)) {
    out.push({ id: `checkup-${key}`, kind: "due", title: "Daily health checkup not done", detail: "Use your onboard equipment and log today's checkup.", ts: startOfDay(now) + 8 * 3_600_000 });
  }
  if (!(state.wellbeingTalks ?? []).includes(key)) {
    out.push({ id: `talk-${key}`, kind: "upcoming", title: "Daily wellbeing talk", detail: "Have today's chat with your wellbeing companion, Nova.", ts: startOfDay(now) + 9 * 3_600_000 });
  }
  for (const a of state.alerts) {
    if (a.acknowledged) continue;
    out.push({ id: `alert-${a.id}`, kind: "alert", title: a.title, detail: a.message, status: a.status, ts: a.timestamp });
  }
  return out.sort((a, b) => {
    const pri = (n: Notification) => (n.kind === "alert" ? 0 : n.kind === "due" ? 1 : 2);
    return pri(a) - pri(b) || b.ts - a.ts;
  });
}

/** Share of the waking day (07:00–22:00) that has elapsed — used to pace daily targets. */
export function paceFraction(now = Date.now()) {
  const d = new Date(now);
  const h = d.getHours() + d.getMinutes() / 60;
  return Math.max(0.15, Math.min(1, (h - 7) / 15));
}

export function overallStatus(statuses: (Status | null | undefined)[]): Status {
  return statuses.reduce<Status>((acc, s) => (s && statusRank(s) > statusRank(acc) ? s : acc), "green");
}

export { classifyTarget };
