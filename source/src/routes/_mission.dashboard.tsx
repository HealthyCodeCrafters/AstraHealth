import { ClientOnly, Link, createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { AlertTriangle, ChevronRight, MapPin, PlusCircle, Rocket, Target } from "lucide-react";

import { buildHealthCards, ENV_PRIORITY, type HealthCard } from "@/components/astra/healthCards";
import { MetricCard } from "@/components/astra/MetricCard";
import { Disclaimer, Panel } from "@/components/astra/PageHeader";
import { SimulationPanel } from "@/components/astra/SimulationPanel";
import { STATUS_CLASSES, StatusBadge } from "@/components/astra/status";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { dailyMissions, missionDay, overallStatus } from "@/lib/astra/derived";
import { ENVIRONMENTS } from "@/lib/astra/environments";
import { STATUS_META } from "@/lib/astra/ranges";
import { useAstra } from "@/lib/astra/store";
import type { Status } from "@/lib/astra/types";
import { cn } from "@/lib/utils";

const MissionAstronaut3D = lazy(() => import("@/components/astra/MissionAstronaut3D"));

export const Route = createFileRoute("/_mission/dashboard")({
  head: () => ({
    meta: [
      { title: "Mission Control — ASTRA" },
      { name: "description", content: "Live overview of cardiovascular, physical and environmental health indicators." },
      { property: "og:title", content: "Mission Control — ASTRA" },
      { property: "og:description", content: "Live overview of cardiovascular, physical and environmental health indicators." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function ProgressRing({ pct, day, total }: { pct: number; day: number; total: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-36 shrink-0">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <defs>
          <linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--violet)" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--muted)" strokeWidth="8" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="url(#ring-g)" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className="font-mono text-3xl font-semibold text-foreground">{day}</p>
          <p className="hud-label">of {total} days</p>
        </div>
      </div>
    </div>
  );
}

function Group({ title, cards, priority }: { title: string; cards: HealthCard[]; priority: string[] }) {
  return (
    <section className="space-y-3">
      <h2 className="hud-label text-primary">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c, i) => (
          <MetricCard
            key={c.key}
            icon={c.icon}
            title={c.title}
            value={c.value}
            unit={c.unit}
            status={c.status}
            trend={c.trend}
            series={c.series}
            explanation={c.explanation}
            highlight={priority.includes(c.key)}
            delay={i * 60}
            liveKey={c.key}
            footer={
              priority.includes(c.key) ? (
                <span className="text-primary">● Environment priority</span>
              ) : (
                c.footer
              )
            }
          />
        ))}
      </div>
    </section>
  );
}

function Dashboard() {
  const state = useAstra();
  const { profile } = state;
  const env = ENVIRONMENTS[profile.environment];
  const cards = buildHealthCards(state);
  const priority = ENV_PRIORITY[profile.environment];
  const day = missionDay(state);
  const overall = overallStatus(cards.map((c) => c.status));
  const counts = cards.reduce<Record<Status, number>>((acc, c) => ({ ...acc, [c.status]: acc[c.status] + 1 }), { green: 0, yellow: 0, orange: 0, red: 0 });
  const openAlerts = state.alerts.filter((a) => !a.acknowledged);
  const urgent = openAlerts.filter((a) => a.status === "red" || a.status === "orange");
  const missions = dailyMissions(state);
  const missionsDone = missions.filter((m) => m.done).length;

  return (
    <div className="space-y-8">
      <SimulationPanel />
      {/* Profile */}
      <section className="glass relative overflow-hidden rounded-3xl p-6 animate-rise md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-violet/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 size-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center">
          <div className="flex shrink-0 items-center justify-between gap-4 xl:flex-col">
            <ProgressRing pct={Math.min(1, day / profile.missionDurationDays)} day={day} total={profile.missionDurationDays} />
            <ClientOnly fallback={<div className="mission-astronaut-stage" />}><Suspense fallback={<div className="mission-astronaut-stage" />}><MissionAstronaut3D /></Suspense></ClientOnly>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <p className="hud-label text-primary">Mission Control · {profile.astronautId}</p>
              <h1 className="mt-1 text-3xl font-bold md:text-4xl">{profile.name}</h1>
              <p className="text-sm text-muted-foreground">{profile.role}</p>
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div>
                <dt className="hud-label">Mission</dt>
                <dd className="mt-0.5 flex items-center gap-1.5 text-foreground">
                  <Rocket className="size-3.5 text-primary" /> {profile.missionName}
                </dd>
              </div>
              <div>
                <dt className="hud-label">Duration</dt>
                <dd className="mt-0.5 text-foreground">{profile.missionDurationDays} days</dd>
              </div>
              <div>
                <dt className="hud-label">Location</dt>
                <dd className="mt-0.5 flex items-center gap-1.5 text-foreground">
                  <MapPin className="size-3.5 text-primary" /> {env.location}
                </dd>
              </div>
              <div>
                <dt className="hud-label">Mission status</dt>
                <dd className="mt-0.5 font-mono text-status-green">{profile.missionStatus.toUpperCase()}</dd>
              </div>
            </dl>
          </div>
          <div className="glass flex flex-col gap-3 rounded-2xl p-4 lg:w-64">
            <p className="hud-label">Health indicator summary</p>
            <StatusBadge status={overall} label={STATUS_META[overall].label} className="self-start" />
            <div className="grid grid-cols-4 gap-2 text-center">
              {(Object.keys(counts) as Status[]).map((s) => (
                <div key={s} className={cn("rounded-lg border py-1.5", STATUS_CLASSES[s].border, STATUS_CLASSES[s].soft)}>
                  <p className={cn("font-mono text-lg font-semibold", STATUS_CLASSES[s].text)}>{counts[s]}</p>
                  <p className="text-[0.6rem] uppercase text-muted-foreground">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {urgent.length > 0 && (
        <Link
          to="/alerts"
          className={cn("flex items-center gap-3 rounded-2xl border p-4 transition-colors hover:bg-status-orange/15", STATUS_CLASSES[urgent[0].status].border, STATUS_CLASSES[urgent[0].status].soft)}
        >
          <AlertTriangle className={cn("size-5 shrink-0", STATUS_CLASSES[urgent[0].status].text)} />
          <div className="flex-1">
            <p className="font-semibold text-foreground">{urgent[0].title}</p>
            <p className="text-sm text-muted-foreground">
              {urgent.length > 1 ? `${urgent.length} alerts need review. ` : ""}Open the Alert Centre for guidance and approved procedures.
            </p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground" />
        </Link>
      )}

      {/* Environment focus */}
      <section className="glass flex flex-col gap-4 rounded-2xl p-5 md:flex-row md:items-center animate-rise">
        <div className="md:w-72">
          <p className="hud-label">Active environment</p>
          <p className="font-display text-lg font-semibold text-foreground">{env.name}</p>
          <p className="text-xs text-muted-foreground">{env.gravityLabel}</p>
        </div>
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {env.priorities.map((p) => (
            <div key={p.title} className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-sm font-semibold text-primary">{p.title}</p>
              <p className="text-xs text-muted-foreground">{p.detail}</p>
            </div>
          ))}
        </div>
        <Button asChild variant="glass" size="sm">
          <Link to="/environments">Why it matters</Link>
        </Button>
      </section>

      <Group title="Cardiovascular health" cards={cards.filter((c) => c.group === "Cardiovascular")} priority={priority} />
      <Group title="Physical health" cards={cards.filter((c) => c.group === "Physical")} priority={priority} />
      <Group title="Environmental conditions" cards={cards.filter((c) => c.group === "Environment")} priority={priority} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          kicker="Wellness Quest"
          title="Today's wellness missions"
          className="lg:col-span-2"
          actions={
            <Button asChild variant="glass" size="sm">
              <Link to="/quest">
                <Target /> View quest
              </Link>
            </Button>
          }
        >
          <div className="mb-4 flex items-center gap-3">
            <Progress value={(missionsDone / missions.length) * 100} className="h-2 flex-1" />
            <span className="font-mono text-sm text-primary">
              {missionsDone}/{missions.length}
            </span>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
            {missions.map((m) => (
              <li key={m.id} className={cn("flex items-center gap-3 rounded-xl border px-3 py-2", m.done ? "border-status-green/40 bg-status-green/8" : "border-border")}>
                <span className={cn("grid size-6 place-items-center rounded-full border font-mono text-[0.65rem]", m.done ? "border-status-green bg-status-green/20 text-status-green" : "border-border text-muted-foreground")}>
                  {m.done ? "✓" : Math.round(m.progress * 100)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{m.title}</p>
                  <p className="text-xs text-muted-foreground">{m.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel kicker="Quick log" title="Record a measurement">
          <div className="grid grid-cols-2 gap-2">
            {[
              ["heartRate", "Heart rate"],
              ["bloodPressure", "Blood pressure"],
              ["spo2", "SpO₂"],
              ["sleep", "Sleep"],
              ["water", "Water"],
              ["activity", "Activity"],
            ].map(([k, label]) => (
              <Button key={k} asChild variant="glass" className="justify-start">
                <Link to="/monitor" search={{ m: k as "heartRate" | "bloodPressure" | "spo2" | "sleep" | "water" | "activity" }}>
                  <PlusCircle className="text-primary" /> {label}
                </Link>
              </Button>
            ))}
          </div>
          <Button asChild variant="hero" className="mt-3 w-full">
            <Link to="/wellbeing">Daily wellbeing check-in</Link>
          </Button>
        </Panel>
      </div>

      <Disclaimer />
    </div>
  );
}
