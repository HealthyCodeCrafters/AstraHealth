import { Outlet, createFileRoute, useHydrated } from "@tanstack/react-router";
import { useEffect } from "react";

import { AppShell } from "@/components/astra/AppShell";
import { AstraMark } from "@/components/astra/AstraLogo";
import { SettingsForm } from "@/components/astra/SettingsForm";
import { useAstra } from "@/lib/astra/store";
import { dayKey } from "@/lib/astra/time";

// Mission pages read the crew's locally stored data, so they render after hydration.
export const Route = createFileRoute("/_mission")({
  component: MissionLayout,
});

function useDailyNotifications() {
  const state = useAstra();
  useEffect(() => {
    if (!state.settings || typeof Notification === "undefined") return;
    const check = () => {
      const key = dayKey(Date.now());
      const send = (tag: string, title: string, body: string) => {
        const sentKey = `astra-notified-${tag}-${key}`;
        if (localStorage.getItem(sentKey)) return;
        localStorage.setItem(sentKey, "1");
        new Notification(title, { body, tag });
      };
      const go = () => {
        const h = new Date().getHours();
        if (h >= 8 && !(state.checkups ?? []).some((c) => c.date === key)) send("checkup", "ASTRA: Daily checkup not done", "Use your onboard equipment and log today's checkup.");
        if (h >= 9 && !(state.wellbeingTalks ?? []).includes(key)) send("talk", "ASTRA: Wellbeing talk", "Nova is ready for your daily wellbeing chat.");
      };
      if (Notification.permission === "granted") go();
      else if (Notification.permission === "default") Notification.requestPermission().then((p) => p === "granted" && go());
    };
    check();
    const t = setInterval(check, 5 * 60_000);
    return () => clearInterval(t);
  }, [state.settings, state.checkups, state.wellbeingTalks]);
}

function MissionLayout() {
  const hydrated = useHydrated();
  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="flex flex-col items-center gap-3">
          <AstraMark className="size-12 animate-pulse-glow" />
          <p className="hud-label">Establishing telemetry uplink…</p>
        </div>
      </div>
    );
  }
  return <HydratedMission />;
}

function HydratedMission() {
  const state = useAstra();
  useDailyNotifications();
  if (!state.settings) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="hud-label">First-time setup</p>
        <h1 className="mt-1 text-3xl font-semibold">Set up your astronaut settings</h1>
        <p className="mt-2 mb-8 text-muted-foreground">ASTRA uses these details to personalise your checkups, emergency alerts and routine.</p>
        <SettingsForm submitLabel="Save and continue" />
      </div>
    );
  }
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
