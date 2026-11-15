import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  BellRing,
  BrainCircuit,
  CalendarClock,
  Check,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  Menu,
  Orbit,
  Trophy,
  UserCog,
  Siren,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { missionDay, notifications } from "@/lib/astra/derived";
import { ENV_LIST, ENVIRONMENTS } from "@/lib/astra/environments";
import { simActions, useSimulation } from "@/lib/astra/simulation-store";
import { actions, useAstra } from "@/lib/astra/store";
import { dayKey } from "@/lib/astra/time";
import type { EnvironmentId } from "@/lib/astra/types";
import { cn } from "@/lib/utils";

import { AstraLogo } from "./AstraLogo";
import { STATUS_CLASSES } from "./status";

const NAV = [
  { to: "/dashboard", label: "Mission Control", icon: LayoutDashboard },
  { to: "/monitor", label: "Health Monitor", icon: Activity },
  { to: "/emergency", label: "Emergency Scan", icon: Siren },
  { to: "/alerts", label: "Alert Centre", icon: Bell },
  { to: "/analytics", label: "Daily Checkup", icon: LineChart },
  { to: "/routines", label: "Mission Routines", icon: CalendarClock },
  { to: "/quest", label: "Wellness Quest", icon: Trophy },
  { to: "/wellbeing", label: "Wellbeing", icon: BrainCircuit },
  { to: "/environments", label: "Environments", icon: Orbit },
  { to: "/learn", label: "Education Centre", icon: GraduationCap },
  { to: "/profile", label: "Profile & Settings", icon: UserCog },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const state = useAstra();
  const openAlerts = state.alerts.filter((a) => !a.acknowledged).length;
  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{ className: "border-primary/30 bg-sidebar-accent text-primary glow" }}
        >
          <item.icon className="size-4 shrink-0" aria-hidden />
          <span className="flex-1">{item.label}</span>
          {item.to === "/alerts" && openAlerts > 0 && (
            <span className="rounded-full bg-status-orange/20 px-1.5 font-mono text-[0.65rem] text-status-orange">{openAlerts}</span>
          )}
        </Link>
      ))}
    </nav>
  );
}

function MissionChip() {
  const state = useAstra();
  const day = missionDay(state);
  return (
    <div className="glass rounded-xl p-3">
      <p className="hud-label">Crew member</p>
      <p className="mt-1 truncate font-display text-sm font-semibold text-foreground">{state.profile.name}</p>
      <p className="font-mono text-[0.68rem] text-muted-foreground">{state.profile.astronautId}</p>
      <div className="mt-3 flex items-center justify-between font-mono text-[0.68rem]">
        <span className="text-muted-foreground">MISSION DAY</span>
        <span className="text-primary">
          {day} / {state.profile.missionDurationDays}
        </span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-gradient-primary" style={{ width: `${Math.min(100, (day / state.profile.missionDurationDays) * 100)}%` }} />
      </div>
    </div>
  );
}

function NotificationCentre() {
  const state = useAstra();
  const list = notifications(state);
  const unread = list.filter((n) => !state.readNotifications.includes(n.id));
  const today = dayKey(Date.now());
  return (
    <Popover onOpenChange={(open) => open && unread.length && actions.markNotificationsRead(unread.map((n) => n.id))}>
      <PopoverTrigger asChild>
        <Button variant="glass" size="icon" aria-label={`Notifications (${unread.length} new)`} className="relative">
          {unread.length ? <BellRing className="text-primary" /> : <Bell />}
          {unread.length > 0 && (
            <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-gradient-primary font-mono text-[0.6rem] font-bold text-primary-foreground">
              {unread.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] border-border bg-popover p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="font-display font-semibold">Notification centre</p>
          <Link to="/routines" className="text-xs text-primary hover:underline">
            Open routines
          </Link>
        </div>
        <ul className="max-h-96 overflow-y-auto">
          {list.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted-foreground">All caught up. No pending tasks or alerts.</li>}
          {list.map((n) => (
            <li key={n.id} className="flex gap-3 border-b border-border/60 px-4 py-3 last:border-0">
              <span
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full",
                  n.kind === "alert" ? STATUS_CLASSES[n.status ?? "yellow"].bg : n.kind === "due" ? "bg-status-yellow" : "bg-primary",
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{n.title}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{n.detail}</p>
                {n.kind === "alert" && (
                  <Link to="/alerts" className="mt-1 inline-block text-xs text-primary hover:underline">
                    Review alert →
                  </Link>
                )}
              </div>
              {n.reminderId && (
                <Button size="sm" variant="glass" className="h-7 shrink-0 px-2 text-xs" onClick={() => actions.toggleReminder(n.reminderId!, today)}>
                  <Check /> Done
                </Button>
              )}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function EnvironmentSelect() {
  const state = useAstra();
  return (
    <Select value={state.profile.environment} onValueChange={(v) => actions.setEnvironment(v as EnvironmentId)}>
      <SelectTrigger className="glass h-9 w-[12.5rem] border-border text-sm" aria-label="Mission environment">
        <Orbit className="size-4 text-primary" />
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
  );
}

function DemoBanner() {
  const { settings } = useSimulation();
  if (!settings.demoMode) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-primary/30 bg-primary/10 px-4 py-1.5 text-center text-xs">
      <span className="font-mono font-semibold uppercase tracking-[0.14em] text-primary">
        Offline Demo Mode · DEMONSTRATION DATA{settings.running ? ` · simulating at ${settings.speed}×` : " · paused"}
      </span>
      <button className="text-muted-foreground underline hover:text-foreground" onClick={() => { simActions.pause(); simActions.setDemoMode(false); }}>
        Exit demo
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const state = useAstra();
  const env = ENVIRONMENTS[state.profile.environment];
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-0 starfield opacity-40" aria-hidden />
      <div className="lg:pl-64">
        <DemoBanner />
      </div>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-6 border-r border-sidebar-border bg-sidebar p-4 backdrop-blur-xl lg:flex">
        <Link to="/" aria-label="ASTRA home">
          <AstraLogo />
        </Link>
        <div className="flex-1 overflow-y-auto">
          <NavList />
        </div>
        <MissionChip />
      </aside>

      <div className="relative lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/70 px-4 py-3 backdrop-blur-xl md:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="glass" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-4">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <AstraLogo className="mb-6" />
              <NavList onNavigate={() => setOpen(false)} />
              <div className="mt-6">
                <MissionChip />
              </div>
            </SheetContent>
          </Sheet>
          <div className="hidden min-w-0 flex-1 md:block">
            <p className="hud-label">
              {state.profile.missionName} · Day {missionDay(state)}
            </p>
            <p className="truncate text-sm text-foreground">{env.location}</p>
          </div>
          <div className="flex-1 md:hidden" />
          <span className="hidden items-center gap-1.5 rounded-full border border-violet/40 bg-violet/10 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-violet sm:inline-flex">
            Demo · simulated data
          </span>
          <EnvironmentSelect />
          <NotificationCentre />
        </header>
        <main key={pathname} className="relative mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
