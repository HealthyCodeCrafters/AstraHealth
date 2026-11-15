import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Brain, Droplets, Flame, HeartPulse, Lock, Moon, Sparkles, Star, Trophy, Wind, Zap } from "lucide-react";

import { PageHeader, Panel } from "@/components/astra/PageHeader";
import { Progress } from "@/components/ui/progress";
import { badges, dailyMissions, levelInfo, missionDay, streak, weeklyChallenges, XP, XP_PER_LEVEL, xpTotal, type Badge } from "@/lib/astra/derived";
import { useAstra } from "@/lib/astra/store";
import { DAY_MS, dayKey, startOfDay, WEEKDAYS } from "@/lib/astra/time";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_mission/quest")({
  head: () => ({
    meta: [
      { title: "Wellness Quest — ASTRA" },
      { name: "description", content: "Earn XP, badges and streaks for consistent, responsible health monitoring." },
      { property: "og:title", content: "Wellness Quest — ASTRA" },
      { property: "og:description", content: "Earn XP, badges and streaks for consistent, responsible health monitoring." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Quest,
});

const BADGE_ICON: Record<Badge["icon"], typeof Star> = {
  oxygen: Wind,
  sleep: Moon,
  water: Droplets,
  heart: HeartPulse,
  streak: Flame,
  mind: Brain,
  book: BookOpen,
  first: Sparkles,
};

function Quest() {
  const state = useAstra();
  const xp = xpTotal(state);
  const lvl = levelInfo(xp);
  const s = streak(state.wellbeing);
  const missions = dailyMissions(state);
  const done = missions.filter((m) => m.done).length;
  const weekly = weeklyChallenges(state);
  const all = badges(state);
  const unlocked = all.filter((b) => b.unlocked).length;
  const day = missionDay(state);
  const checkDays = new Set(state.wellbeing.map((w) => dayKey(w.timestamp)));
  const last7 = Array.from({ length: 7 }, (_, i) => startOfDay(Date.now()) - (6 - i) * DAY_MS);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Gamification"
        title="Mission Wellness Quest"
        description="Rewards consistency and responsible monitoring — never perfect numbers or extreme performance. Logging an out-of-range value earns exactly the same XP as a normal one."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="glass relative overflow-hidden rounded-2xl p-6 lg:col-span-2 animate-rise">
          <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-primary/15 blur-3xl" />
          <div className="flex items-center gap-5">
            <div className="grid size-20 shrink-0 place-items-center rounded-2xl bg-gradient-primary glow">
              <span className="font-display text-3xl font-bold text-primary-foreground">{lvl.level}</span>
            </div>
            <div className="flex-1">
              <p className="hud-label">Level {lvl.level}</p>
              <p className="font-display text-2xl font-semibold">{lvl.title}</p>
              <p className="font-mono text-sm text-muted-foreground">{xp.toLocaleString()} XP total</p>
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-1 flex justify-between font-mono text-xs text-muted-foreground">
              <span>{lvl.into} XP</span>
              <span>{XP_PER_LEVEL} XP to level {lvl.level + 1}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div className="relative h-full rounded-full bg-gradient-primary transition-all duration-1000" style={{ width: `${lvl.pct * 100}%` }}>
                <div className="absolute inset-0 animate-pulse-glow bg-primary-glow/30" />
              </div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            {[
              ["Manual reading", XP.manualReading],
              ["Routine task", XP.task],
              ["Wellbeing check-in", XP.checkin],
              ["Quiz passed", XP.quiz],
            ].map(([l, v]) => (
              <div key={l} className="rounded-lg border border-border px-3 py-2">
                <p className="text-muted-foreground">{l}</p>
                <p className="font-mono text-primary">+{v} XP</p>
              </div>
            ))}
          </div>
        </section>

        <Panel kicker="Check-in streak" title={`${s} day${s === 1 ? "" : "s"}`}>
          <div className="flex items-center gap-2">
            <Flame className={cn("size-10", s >= 7 ? "text-status-orange" : "text-muted-foreground")} />
            <p className="text-sm text-muted-foreground">{s >= 7 ? "Mission Consistency achieved!" : `${7 - s} more consecutive day${7 - s === 1 ? "" : "s"} for Mission Consistency.`}</p>
          </div>
          <div className="mt-4 flex justify-between">
            {last7.map((ts) => (
              <div key={ts} className="flex flex-col items-center gap-1">
                <span className={cn("grid size-8 place-items-center rounded-full border", checkDays.has(dayKey(ts)) ? "border-status-orange bg-status-orange/20 text-status-orange" : "border-border text-muted-foreground")}>
                  {checkDays.has(dayKey(ts)) ? <Flame className="size-4" /> : "·"}
                </span>
                <span className="font-mono text-[0.6rem] text-muted-foreground">{WEEKDAYS[new Date(ts).getDay()]}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-border pt-4">
            <p className="hud-label">Mission completion</p>
            <div className="mt-2 flex items-center gap-3">
              <Progress value={(day / state.profile.missionDurationDays) * 100} className="h-2 flex-1" />
              <span className="font-mono text-sm text-primary">{Math.round((day / state.profile.missionDurationDays) * 100)}%</span>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel kicker={`${done}/${missions.length} complete`} title="Daily wellness missions">
          <ul className="space-y-3">
            {missions.map((m) => (
              <li key={m.id}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className={cn(m.done ? "text-status-green" : "text-foreground")}>
                    {m.done && "✓ "}
                    {m.title}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">{m.detail}</span>
                </div>
                <Progress value={m.progress * 100} className="h-1.5" />
              </li>
            ))}
          </ul>
        </Panel>
        <Panel kicker="Resets weekly" title="Weekly challenges">
          <ul className="space-y-4">
            {weekly.map((w) => {
              const pct = Math.min(100, (w.current / w.target) * 100);
              return (
                <li key={w.id} className="rounded-xl border border-border p-3">
                  <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2">
                      <Zap className={cn("size-4", pct >= 100 ? "text-status-green" : "text-status-yellow")} /> {w.title}
                    </span>
                    <span className="font-mono text-xs text-primary">
                      {Math.min(w.current, w.target)}/{w.target}
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

      <Panel kicker={`${unlocked} of ${all.length} unlocked`} title="Achievement gallery" actions={<Trophy className="size-5 text-status-yellow" />}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {all.map((b, i) => {
            const Icon = BADGE_ICON[b.icon];
            return (
              <article
                key={b.id}
                className={cn("relative flex flex-col items-center rounded-2xl border p-5 text-center transition-all animate-rise", b.unlocked ? "border-primary/40 bg-primary/8 glow" : "border-border opacity-80")}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className={cn("relative grid size-16 place-items-center rounded-full border-2", b.unlocked ? "border-primary bg-gradient-primary" : "border-border bg-muted")}>
                  <Icon className={cn("size-7", b.unlocked ? "text-primary-foreground" : "text-muted-foreground")} />
                  {!b.unlocked && <Lock className="absolute -bottom-1 -right-1 size-5 rounded-full bg-popover p-1 text-muted-foreground" />}
                </div>
                <h3 className="mt-3 font-display font-semibold">{b.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{b.description}</p>
                <div className="mt-3 w-full">
                  <Progress value={b.progress * 100} className="h-1" />
                  <p className="mt-1 font-mono text-[0.65rem] text-muted-foreground">{b.unlocked ? "UNLOCKED" : `${Math.round(b.progress * 100)}%`}</p>
                </div>
              </article>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
