import { ClientOnly, Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronRight, FlaskConical, Radio, ShieldCheck, Satellite } from "lucide-react";
import { lazy, Suspense } from "react";

import { AstraMark } from "@/components/astra/AstraLogo";
import { Button } from "@/components/ui/button";
import { HomeMusic } from "@/components/astra/HomeMusic";
import { missionDay } from "@/lib/astra/derived";
import { ENVIRONMENTS } from "@/lib/astra/environments";
import { simActions } from "@/lib/astra/simulation-store";
import { useAstra } from "@/lib/astra/store";

const HomePlanets = lazy(() => import("@/components/astra/HomePlanets"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ASTRA — Advanced Space Traveller Regulation & Assessment" },
      {
        name: "description",
        content: "Astronaut health monitoring for long-duration missions: vital signs, routines, wellbeing and environment adaptation.",
      },
      { property: "og:title", content: "ASTRA — Advanced Space Traveller Regulation & Assessment" },
      {
        property: "og:description",
        content: "Astronaut health monitoring for long-duration missions: vital signs, routines, wellbeing and environment adaptation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function LiveTelemetry() {
  const state = useAstra();
  const env = ENVIRONMENTS[state.profile.environment];
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 font-mono text-xs">
      <div>
        <dt className="hud-label">Crew</dt>
        <dd className="text-foreground">{state.profile.name}</dd>
      </div>
      <div>
        <dt className="hud-label">Mission day</dt>
        <dd className="text-primary">
          {missionDay(state)} / {state.profile.missionDurationDays}
        </dd>
      </div>
      <div>
        <dt className="hud-label">Environment</dt>
        <dd className="text-foreground">{env.name}</dd>
      </div>
      <div>
        <dt className="hud-label">Status</dt>
        <dd className="text-status-green">{state.profile.missionStatus.toUpperCase()}</dd>
      </div>
    </dl>
  );
}

function Landing() {
  const navigate = useNavigate();
  const launchDemo = () => {
    simActions.start();
    void navigate({ to: "/dashboard" });
  };
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 starfield opacity-60 animate-twinkle" aria-hidden />


      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 md:px-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AstraMark />
            <span className="font-display text-lg font-bold tracking-[0.32em]">ASTRA</span>
          </div>
          <div className="flex items-center gap-3"><HomeMusic /><span className="hidden items-center gap-2 rounded-full border border-status-green/40 bg-status-green/10 px-3 py-1 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-status-green sm:inline-flex">
            <span className="size-1.5 rounded-full bg-status-green animate-pulse-glow" /> Uplink stable
          </span></div>
        </header>

        <ClientOnly><Suspense fallback={<div className="home-planets" />}><HomePlanets /></Suspense></ClientOnly>
        <main className="home-main flex flex-1 flex-col justify-center py-10 lg:py-16">
          <p className="hud-label text-primary animate-rise">Advanced Space Traveller Regulation &amp; Assessment</p>
          <h1 className="mt-4 text-5xl font-bold leading-[1.05] text-foreground animate-rise md:text-6xl" style={{ animationDelay: "80ms" }}>
            Health intelligence for the <span className="text-gradient">long voyage.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground animate-rise md:text-lg" style={{ animationDelay: "160ms" }}>
            Monitor vital signs, follow mission routines and understand how orbit, the Moon and Mars affect your body — so small changes are noticed before
            they become serious.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4 animate-rise" style={{ animationDelay: "240ms" }}>
            <Button asChild variant="hero" size="lg" className="h-14 px-8 text-sm">
              <Link to="/dashboard">
                Enter Mission Control <ChevronRight className="size-5" />
              </Link>
            </Button>
            <Button asChild variant="glass" size="lg" className="h-14 px-6">
              <Link to="/learn">Explore the Education Centre</Link>
            </Button>
            <Button variant="glass" size="lg" className="h-14 px-6" onClick={launchDemo}>
              <FlaskConical className="size-5 text-primary" /> Launch Offline Demo
            </Button>
          </div>

          <div className="glass mt-14 max-w-xl rounded-2xl p-5 animate-rise" style={{ animationDelay: "320ms" }}>
            <div className="mb-4 flex items-center justify-between">
              <p className="hud-label">Mission status display</p>
              <span className="rounded-sm border border-violet/40 bg-violet/10 px-1.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-violet">
                Simulated
              </span>
            </div>
            <ClientOnly fallback={<p className="hud-label">Acquiring telemetry…</p>}>
              <LiveTelemetry />
            </ClientOnly>
          </div>
        </main>

        <footer className="grid gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:grid-cols-3">
          <p className="flex items-center gap-2">
            <Satellite className="size-4 text-primary" /> Orbit · ISS · Lunar · Mars profiles
          </p>
          <p className="flex items-center gap-2">
            <Radio className="size-4 text-primary" /> Wearable-ready data model
          </p>
          <p className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" /> Supports — never replaces — your flight surgeon
          </p>
        </footer>
      </div>
    </div>
  );
}
