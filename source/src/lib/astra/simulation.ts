// Pure offline simulation engine for ASTRA's Offline Demo Mode.
// Generates realistic, logically related demonstration vitals without any network access.
// Everything produced here is DEMONSTRATION DATA — never real astronaut measurements.

import type { EnvironmentId } from "./types";
import { ENVIRONMENTS } from "./environments";

export type SimProfileId = "cmdr" | "pilot" | "scientist";
export type ScenarioId = "nominal" | "eva" | "illness" | "emergency";

export interface SimProfile {
  id: SimProfileId;
  name: string;
  role: string;
  baseline: SimVitals;
}

export interface SimVitals {
  heartRate: number; // bpm
  systolic: number; // mmHg
  diastolic: number; // mmHg
  spo2: number; // %
  temperature: number; // °C
  stress: number; // 1-5
  fatigue: number; // 1-5
  hydrationMl: number; // ml today
  activityMin: number; // min today
  sleepHours: number; // last night
}

export interface Scenario {
  id: ScenarioId;
  name: string;
  description: string;
  /** Multipliers/offsets applied to the profile baseline while the scenario runs. */
  effect: Partial<Record<keyof SimVitals, number>>;
}

export const SIM_PROFILES: Record<SimProfileId, SimProfile> = {
  cmdr: {
    id: "cmdr",
    name: "Cmdr. Elena Vargas",
    role: "Mission Commander",
    baseline: { heartRate: 62, systolic: 116, diastolic: 74, spo2: 98, temperature: 36.6, stress: 2, fatigue: 2, hydrationMl: 1400, activityMin: 45, sleepHours: 7.2 },
  },
  pilot: {
    id: "pilot",
    name: "Lt. Marcus Chen",
    role: "Pilot / EVA Specialist",
    baseline: { heartRate: 58, systolic: 112, diastolic: 71, spo2: 98, temperature: 36.5, stress: 2, fatigue: 2, hydrationMl: 1600, activityMin: 70, sleepHours: 7.6 },
  },
  scientist: {
    id: "scientist",
    name: "Dr. Amara Okafor",
    role: "Flight Scientist",
    baseline: { heartRate: 66, systolic: 118, diastolic: 76, spo2: 97, temperature: 36.7, stress: 3, fatigue: 3, hydrationMl: 1200, activityMin: 35, sleepHours: 6.8 },
  },
};

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  nominal: {
    id: "nominal",
    name: "Nominal operations",
    description: "A routine mission day. All vitals drift gently around the crew member's personal baseline.",
    effect: {},
  },
  eva: {
    id: "eva",
    name: "EVA exertion",
    description: "Spacesuit work in progress: heart rate, blood pressure and fluid loss rise; recovery follows.",
    effect: { heartRate: 38, systolic: 18, diastolic: 8, spo2: -1, stress: 1, fatigue: 2, hydrationMl: -350, activityMin: 60 },
  },
  illness: {
    id: "illness",
    name: "Developing illness",
    description: "A mild infection develops: temperature and resting heart rate climb, sleep and appetite suffer.",
    effect: { heartRate: 14, systolic: -6, diastolic: -4, spo2: -1.5, temperature: 1.3, stress: 1, fatigue: 2, sleepHours: -1.4, hydrationMl: -300 },
  },
  emergency: {
    id: "emergency",
    name: "Emergency drill",
    description: "A simulated cabin event: acute stress response with sharply elevated heart rate and blood pressure.",
    effect: { heartRate: 52, systolic: 34, diastolic: 18, spo2: -3, stress: 2, fatigue: 1, temperature: 0.4 },
  },
};

export interface SimState {
  profileId: SimProfileId;
  scenarioId: ScenarioId;
  environment: EnvironmentId;
  tick: number;
  vitals: SimVitals;
}

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

/** Environment modifiers: microgravity raises resting HR slightly; high CO₂ lowers SpO₂. */
function envModifier(env: EnvironmentId): Partial<SimVitals> {
  const e = ENVIRONMENTS[env];
  return {
    heartRate: e.gravityG === 0 ? 4 : 0,
    spo2: e.co2 > 2.6 ? -0.6 : 0,
    fatigue: env === "mars" ? 0.4 : 0,
  };
}

export function createSimulation(profileId: SimProfileId, scenarioId: ScenarioId = "nominal", environment: EnvironmentId = "iss"): SimState {
  const base = SIM_PROFILES[profileId].baseline;
  const mod = envModifier(environment);
  return {
    profileId,
    scenarioId,
    environment,
    tick: 0,
    vitals: {
      ...base,
      heartRate: base.heartRate + (mod.heartRate ?? 0),
      spo2: base.spo2 + (mod.spo2 ?? 0),
      fatigue: base.fatigue + (mod.fatigue ?? 0),
    },
  };
}

const CLAMPS: Record<keyof SimVitals, [number, number]> = {
  heartRate: [40, 185],
  systolic: [85, 190],
  diastolic: [50, 120],
  spo2: [85, 100],
  temperature: [35, 40],
  stress: [1, 5],
  fatigue: [1, 5],
  hydrationMl: [0, 4000],
  activityMin: [0, 300],
  sleepHours: [0, 12],
};

/** Advance the simulation one tick. Vitals random-walk toward (baseline + scenario effect + environment),
 *  so values stay consistent and logically related. Deterministic for a given seed. */
export function tickSimulation(sim: SimState, seed = 1): SimState {
  const rand = mulberry32(seed * 7919 + sim.tick * 104729);
  const noise = (amp: number) => (rand() * 2 - 1) * amp;
  const profile = SIM_PROFILES[sim.profileId];
  const scenario = SCENARIOS[sim.scenarioId];
  const mod = envModifier(sim.environment);

  const next = { ...sim.vitals };
  (Object.keys(CLAMPS) as (keyof SimVitals)[]).forEach((key) => {
    const target = profile.baseline[key] + (scenario.effect[key] ?? 0) + (mod[key] ?? 0);
    const current = sim.vitals[key];
    // ease 18% toward the target each tick, plus small noise scaled to the metric
    const scale = Math.max(Math.abs(target) * 0.02, key === "temperature" ? 0.05 : key === "spo2" ? 0.15 : 0.5);
    let v = current + (target - current) * 0.18 + noise(scale);
    const [lo, hi] = CLAMPS[key];
    v = Math.min(hi, Math.max(lo, v));
    next[key] = key === "temperature" || key === "spo2" || key === "sleepHours" ? Math.round(v * 10) / 10 : Math.round(v);
  });

  return { ...sim, tick: sim.tick + 1, vitals: next };
}

/** Convert a vitals snapshot into store readings. */
export function vitalsToReadings(v: SimVitals, timestamp: number) {
  return [
    { kind: "heartRate" as const, value: v.heartRate, context: "Live simulation", timestamp },
    { kind: "bloodPressure" as const, value: v.systolic, value2: v.diastolic, context: "Live simulation", timestamp },
    { kind: "spo2" as const, value: Math.round(v.spo2), context: "Live simulation", timestamp },
  ];
}
