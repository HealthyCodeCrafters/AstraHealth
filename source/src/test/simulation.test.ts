import { describe, expect, it } from "vitest";

import { createSimulation, tickSimulation, vitalsToReadings, SIM_PROFILES, SCENARIOS } from "@/lib/astra/simulation";

describe("simulation engine", () => {
  it("creates a simulation at the profile baseline", () => {
    const sim = createSimulation("cmdr", "nominal", "mars");
    expect(sim.vitals.heartRate).toBe(SIM_PROFILES.cmdr.baseline.heartRate); // mars has gravity, no HR modifier
    expect(sim.tick).toBe(0);
  });

  it("applies the microgravity heart-rate modifier in orbit", () => {
    const sim = createSimulation("pilot", "nominal", "orbit");
    expect(sim.vitals.heartRate).toBe(SIM_PROFILES.pilot.baseline.heartRate + 4);
  });

  it("drifts vitals toward the emergency scenario targets", () => {
    let sim = createSimulation("cmdr", "emergency", "iss");
    for (let i = 0; i < 40; i++) sim = tickSimulation(sim, 3);
    const target = SIM_PROFILES.cmdr.baseline.heartRate + (SCENARIOS.emergency.effect.heartRate ?? 0) + 4; // iss microgravity
    expect(Math.abs(sim.vitals.heartRate - target)).toBeLessThan(8);
    expect(sim.vitals.systolic).toBeGreaterThan(SIM_PROFILES.cmdr.baseline.systolic + 20);
  });

  it("keeps vitals inside physiological clamps", () => {
    let sim = createSimulation("scientist", "emergency", "lunar");
    for (let i = 0; i < 200; i++) sim = tickSimulation(sim, 11);
    expect(sim.vitals.heartRate).toBeGreaterThanOrEqual(40);
    expect(sim.vitals.heartRate).toBeLessThanOrEqual(185);
    expect(sim.vitals.spo2).toBeGreaterThanOrEqual(85);
    expect(sim.vitals.spo2).toBeLessThanOrEqual(100);
    expect(sim.vitals.temperature).toBeGreaterThanOrEqual(35);
    expect(sim.vitals.temperature).toBeLessThanOrEqual(40);
  });

  it("is deterministic for the same seed", () => {
    let a = createSimulation("cmdr", "eva", "iss");
    let b = createSimulation("cmdr", "eva", "iss");
    for (let i = 0; i < 25; i++) {
      a = tickSimulation(a, 5);
      b = tickSimulation(b, 5);
    }
    expect(a.vitals).toEqual(b.vitals);
  });

  it("converts vitals to store readings marked as simulation context", () => {
    const sim = createSimulation("cmdr");
    const readings = vitalsToReadings(sim.vitals, 1000);
    expect(readings).toHaveLength(3);
    expect(readings.every((r) => r.context === "Live simulation")).toBe(true);
    expect(readings.map((r) => r.kind)).toEqual(["heartRate", "bloodPressure", "spo2"]);
  });
});
