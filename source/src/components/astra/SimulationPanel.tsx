import { FlaskConical, Pause, Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ENV_LIST } from "@/lib/astra/environments";
import { SCENARIOS, SIM_PROFILES, type ScenarioId, type SimProfileId } from "@/lib/astra/simulation";
import { simActions, useSimulation } from "@/lib/astra/simulation-store";
import type { EnvironmentId } from "@/lib/astra/types";
import { cn } from "@/lib/utils";

const SPEEDS = [0.5, 1, 2, 4];

/** Offline Demo Mode control panel: start/pause/reset the local simulation engine,
 *  switch demonstration astronauts, scenarios, environments and speed. */
export function SimulationPanel({ compact = false }: { compact?: boolean }) {
  const { settings, latest, sim } = useSimulation();
  const { running, speed, profileId, scenarioId } = settings;

  return (
    <section className="glass space-y-4 rounded-2xl border-primary/25 p-5" aria-label="Offline demo simulation controls">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
          <FlaskConical className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-foreground">Offline Demo Mode</p>
          <p className="text-xs text-muted-foreground">
            Local simulation engine · all values are <span className="font-semibold text-primary">DEMONSTRATION DATA</span>, not real measurements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {running ? (
            <Button variant="glass" size="sm" onClick={() => simActions.pause()}>
              <Pause /> Pause
            </Button>
          ) : (
            <Button variant="hero" size="sm" onClick={() => simActions.start()}>
              <Play /> {latest && settings.demoMode ? "Resume" : "Start"} simulation
            </Button>
          )}
          <Button variant="glass" size="sm" onClick={() => simActions.reset()} disabled={!settings.demoMode}>
            <RotateCcw /> Reset
          </Button>
        </div>
      </div>

      <div className={cn("grid gap-3", compact ? "sm:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-4")}>
        <label className="space-y-1">
          <span className="hud-label">Astronaut profile</span>
          <Select value={profileId} onValueChange={(v) => simActions.setProfile(v as SimProfileId)}>
            <SelectTrigger className="glass h-9 border-border text-sm" aria-label="Demonstration astronaut profile">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-popover">
              {Object.values(SIM_PROFILES).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} · {p.role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="space-y-1">
          <span className="hud-label">Scenario</span>
          <Select value={scenarioId} onValueChange={(v) => simActions.setScenario(v as ScenarioId)}>
            <SelectTrigger className="glass h-9 border-border text-sm" aria-label="Demonstration scenario">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-popover">
              {Object.values(SCENARIOS).map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="space-y-1">
          <span className="hud-label">Mission environment</span>
          <Select value={sim.environment} onValueChange={(v) => simActions.setEnvironment(v as EnvironmentId)}>
            <SelectTrigger className="glass h-9 border-border text-sm" aria-label="Simulation environment">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-popover">
              {ENV_LIST.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <div className="space-y-1">
          <span className="hud-label">Simulation speed</span>
          <div className="flex gap-1" role="group" aria-label="Simulation speed">
            {SPEEDS.map((s) => (
              <Button key={s} variant={speed === s ? "hero" : "glass"} size="sm" className="flex-1 px-0" onClick={() => simActions.setSpeed(s)} aria-pressed={speed === s}>
                {s}×
              </Button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{SCENARIOS[scenarioId].description}</p>

      {settings.demoMode && (
        <dl className="grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center sm:grid-cols-6">
          {[
            ["HR", `${latest.heartRate} bpm`],
            ["BP", `${latest.systolic}/${latest.diastolic}`],
            ["SpO₂", `${latest.spo2}%`],
            ["Temp", `${latest.temperature}°C`],
            ["Stress", `${latest.stress}/5`],
            ["Fatigue", `${latest.fatigue}/5`],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-border/60 py-1.5">
              <dt className="text-[0.6rem] uppercase tracking-wide text-muted-foreground">{k}</dt>
              <dd className="font-mono text-sm text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
