// Browser store that drives the offline simulation engine and feeds the main ASTRA store.
// Settings persist in localStorage so the demo survives closing and reopening the app.

import { useSyncExternalStore } from "react";

import { actions } from "./store";
import { createSimulation, tickSimulation, vitalsToReadings, SIM_PROFILES, type SimProfileId, type ScenarioId, type SimState, type SimVitals } from "./simulation";
import type { EnvironmentId } from "./types";

const STORAGE_KEY = "astra-sim-v1";
const TICK_MS = 2000;

export interface SimSettings {
  demoMode: boolean;
  running: boolean;
  speed: number; // 0.5 | 1 | 2 | 4
  profileId: SimProfileId;
  scenarioId: ScenarioId;
}

interface SimStore {
  settings: SimSettings;
  sim: SimState;
  latest: SimVitals;
}

const DEFAULTS: SimSettings = { demoMode: false, running: false, speed: 1, profileId: "cmdr", scenarioId: "nominal" };

let store: SimStore | null = null;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
let tickCount = 0;

function loadSettings(): SimSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<SimSettings>) };
  } catch {
    /* fall through */
  }
  return DEFAULTS;
}

function persist() {
  if (typeof window === "undefined" || !store) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store.settings));
  } catch {
    /* storage unavailable */
  }
}

function getStore(): SimStore {
  if (!store) {
    const settings = loadSettings();
    store = { settings, sim: createSimulation(settings.profileId, settings.scenarioId), latest: createSimulation(settings.profileId, settings.scenarioId).vitals };
    store.latest = store.sim.vitals;
    if (settings.running) startTimer();
  }
  return store;
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useSimulation(): SimStore {
  return useSyncExternalStore(subscribe, getStore, getStore);
}

function runTick() {
  const s = getStore();
  if (!s.settings.running) return;
  const steps = s.settings.speed >= 4 ? 4 : s.settings.speed >= 2 ? 2 : 1;
  let sim = s.sim;
  for (let i = 0; i < steps; i++) sim = tickSimulation(sim, 7);
  tickCount += 1;
  // Feed the main health store every 3rd tick (~6 s at 1×) so charts and alerts update.
  if (tickCount % 3 === 0) {
    const now = Date.now();
    vitalsToReadings(sim.vitals, now).forEach((r) => actions.addReading(r));
  }
  store = { ...s, sim, latest: sim.vitals };
  emit();
}

function startTimer() {
  if (timer || typeof window === "undefined") return;
  timer = setInterval(runTick, TICK_MS);
}

function stopTimer() {
  if (timer) clearInterval(timer);
  timer = null;
}

export const simActions = {
  setDemoMode(on: boolean) {
    const s = getStore();
    store = { ...s, settings: { ...s.settings, demoMode: on } };
    emit();
  },
  start() {
    const s = getStore();
    store = { ...s, settings: { ...s.settings, running: true, demoMode: true } };
    startTimer();
    emit();
  },
  pause() {
    const s = getStore();
    store = { ...s, settings: { ...s.settings, running: false } };
    stopTimer();
    emit();
  },
  reset() {
    const s = getStore();
    const sim = createSimulation(s.settings.profileId, s.settings.scenarioId, s.sim.environment);
    store = { ...s, sim, latest: sim.vitals, settings: { ...s.settings, running: false } };
    stopTimer();
    emit();
  },
  setSpeed(speed: number) {
    const s = getStore();
    store = { ...s, settings: { ...s.settings, speed } };
    emit();
  },
  setProfile(profileId: SimProfileId) {
    const s = getStore();
    const sim = createSimulation(profileId, s.settings.scenarioId, s.sim.environment);
    store = { ...s, sim, latest: sim.vitals, settings: { ...s.settings, profileId } };
    // Switch the app's crew profile to match the demonstration astronaut.
    const p = SIM_PROFILES[profileId];
    actions.updateProfile({ name: p.name, role: p.role });
    emit();
  },
  setScenario(scenarioId: ScenarioId) {
    const s = getStore();
    store = { ...s, settings: { ...s.settings, scenarioId }, sim: { ...s.sim, scenarioId } };
    emit();
  },
  setEnvironment(environment: EnvironmentId) {
    const s = getStore();
    store = { ...s, sim: { ...s.sim, environment } };
    actions.setEnvironment(environment);
    emit();
  },
};
