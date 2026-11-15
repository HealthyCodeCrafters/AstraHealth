import { useSyncExternalStore } from "react";

import { readingStatus } from "./derived";
import { DEFAULT_RANGES, STATUS_META } from "./ranges";
import { createSeedState, STATE_VERSION, uid } from "./seed";
import { dayKey } from "./time";
import type { AstronautSettings, DailyCheckup } from "./types";
import type { Alert, AstraState, Profile, RangeKey, RefRange, Reading, Reminder, Status, WellbeingEntry } from "./types";

const STORAGE_KEY = "astra-state-v1";

let state: AstraState | null = null;
const listeners = new Set<() => void>();

function load(): AstraState {
  if (typeof window === "undefined") return createSeedState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AstraState;
      if (parsed.version === STATE_VERSION) return parsed;
    }
  } catch {
    /* fall through to seed */
  }
  return createSeedState();
}

export function getState(): AstraState {
  if (!state) {
    state = load();
    persist();
  }
  return state;
}

function persist() {
  if (typeof window === "undefined" || !state) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable: keep session state */
  }
}

function set(updater: (s: AstraState) => AstraState) {
  state = updater(getState());
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAstra(): AstraState {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function storageAvailable() {
  try {
    const k = "__astra_probe";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

/* ---------- Alert messaging ---------- */

function alertCopy(r: Reading, status: Status): { title: string; message: string } {
  const g = STATUS_META[status].guidance;
  switch (r.kind) {
    case "heartRate": {
      const high = r.value > getState().ranges.heartRate.normalMax;
      return {
        title: `Heart rate ${high ? "above" : "below"} reference range`,
        message: `${r.value} bpm. ${high ? "Exercise, stress, dehydration or fluid shifts can raise heart rate." : "A low resting rate can be normal for well-trained crew, but needs review if you feel dizzy or faint."} ${g}`,
      };
    }
    case "bloodPressure":
      return {
        title: "Blood pressure outside reference range",
        message: `${r.value}/${r.value2} mmHg. Movement, talking, cuff position or recent exercise can affect results. ${g}`,
      };
    case "spo2":
      return {
        title: "Oxygen saturation below reference range",
        message: `${r.value}%. Cold fingers, movement or a poor sensor fit can lower readings — check fit and cabin CO₂. ${g}`,
      };
    case "sleep": {
      const short = r.value < getState().ranges.sleep.normalMin;
      return {
        title: `Sleep ${short ? "shorter" : "longer"} than reference range`,
        message: `${r.value} h. ${short ? "Short sleep reduces alertness for safety-critical tasks; tell your crew lead if workload allows a rest period." : "Unusually long sleep can follow heavy workload or illness."} ${g}`,
      };
    }
    default:
      return { title: "Measurement outside range", message: g };
  }
}

/* ---------- Actions ---------- */

export interface AddReadingResult {
  reading: Reading;
  status: Status | null;
  alert?: Alert;
}

export const actions = {
  addReading(input: Omit<Reading, "id" | "simulated" | "timestamp"> & { timestamp?: number }): AddReadingResult {
    const reading: Reading = { ...input, id: uid("r"), timestamp: input.timestamp ?? Date.now(), simulated: false };
    const status = readingStatus(reading, getState().ranges);
    let alert: Alert | undefined;
    if (status && status !== "green") {
      const copy = alertCopy(reading, status);
      alert = {
        id: uid("a"),
        readingId: reading.id,
        metric: reading.kind,
        status,
        ...copy,
        timestamp: reading.timestamp,
        acknowledged: false,
        simulated: false,
      };
    }
    set((s) => ({
      ...s,
      readings: [...s.readings, reading].sort((a, b) => a.timestamp - b.timestamp),
      alerts: alert ? [alert, ...s.alerts] : s.alerts,
    }));
    return { reading, status, alert };
  },
  deleteReading(id: string) {
    set((s) => ({ ...s, readings: s.readings.filter((r) => r.id !== id) }));
  },
  addWellbeing(entry: Omit<WellbeingEntry, "id" | "timestamp" | "simulated">) {
    const e: WellbeingEntry = { ...entry, id: uid("w"), timestamp: Date.now(), simulated: false };
    set((s) => ({ ...s, wellbeing: [...s.wellbeing, e] }));
    return e;
  },
  deleteWellbeing(id: string) {
    set((s) => ({ ...s, wellbeing: s.wellbeing.filter((w) => w.id !== id) }));
  },
  toggleReminder(id: string, date: string) {
    set((s) => ({
      ...s,
      reminders: s.reminders.map((r) =>
        r.id !== id ? r : { ...r, completions: r.completions.includes(date) ? r.completions.filter((c) => c !== date) : [...r.completions, date] },
      ),
    }));
  },
  addReminder(r: Omit<Reminder, "id" | "completions">) {
    set((s) => ({ ...s, reminders: [...s.reminders, { ...r, id: uid("t"), completions: [] }] }));
  },
  updateReminder(id: string, patch: Partial<Reminder>) {
    set((s) => ({ ...s, reminders: s.reminders.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  },
  deleteReminder(id: string) {
    set((s) => ({ ...s, reminders: s.reminders.filter((r) => r.id !== id) }));
  },
  acknowledgeAlert(id: string) {
    set((s) => ({ ...s, alerts: s.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)) }));
  },
  acknowledgeAll() {
    set((s) => ({ ...s, alerts: s.alerts.map((a) => ({ ...a, acknowledged: true })) }));
  },
  markNotificationsRead(ids: string[]) {
    set((s) => ({ ...s, readNotifications: Array.from(new Set([...s.readNotifications, ...ids])) }));
  },
  updateProfile(patch: Partial<Profile>) {
    set((s) => ({ ...s, profile: { ...s.profile, ...patch } }));
  },
  setEnvironment(env: Profile["environment"]) {
    set((s) => ({ ...s, profile: { ...s.profile, environment: env } }));
  },
  updateRange(key: RangeKey, range: RefRange) {
    set((s) => ({ ...s, ranges: { ...s.ranges, [key]: range } }));
  },
  resetRanges() {
    set((s) => ({ ...s, ranges: structuredClone(DEFAULT_RANGES) }));
  },
  passQuiz(id: string) {
    set((s) => (s.quizzesPassed.includes(id) ? s : { ...s, quizzesPassed: [...s.quizzesPassed, id] }));
  },
  saveSettings(settings: AstronautSettings) {
    set((s) => ({
      ...s,
      settings,
      // the entered name becomes the crew member's display name everywhere
      profile: settings.name.trim() ? { ...s.profile, name: settings.name.trim() } : s.profile,
    }));
  },
  addCheckup(c: Omit<DailyCheckup, "id" | "timestamp" | "date">) {
    const now = Date.now();
    const entry: DailyCheckup = { ...c, id: uid("c"), timestamp: now, date: dayKey(now) };
    set((s) => ({ ...s, checkups: [...(s.checkups ?? []).filter((x) => x.date !== entry.date), entry] }));
    // also feed the main health monitor so alerts fire on abnormal values
    actions.addReading({ kind: "heartRate", value: c.heartRate, context: "Daily checkup" });
    actions.addReading({ kind: "bloodPressure", value: c.systolic, value2: c.diastolic, context: "Daily checkup" });
    actions.addReading({ kind: "spo2", value: c.spo2, context: "Daily checkup" });
    return entry;
  },
  markWellbeingTalk() {
    const k = dayKey(Date.now());
    set((s) => ({ ...s, wellbeingTalks: Array.from(new Set([...(s.wellbeingTalks ?? []), k])) }));
  },
  resetDemo() {
    set(() => createSeedState());
  },
  clearHealthData() {
    set((s) => ({
      ...s,
      readings: [],
      alerts: [],
      wellbeing: [],
      quizzesPassed: [],
      readNotifications: [],
      reminders: s.reminders.map((r) => ({ ...r, completions: [] })),
    }));
  },
};
