import { createFileRoute } from "@tanstack/react-router";
import { Bell, Brain, Check, Droplets, Dumbbell, HeartPulse, Moon, Pencil, Plus, Thermometer, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader, Panel } from "@/components/astra/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { strictRoutine } from "@/lib/astra/care";
import { notifications, remindersForDay } from "@/lib/astra/derived";
import { actions, useAstra } from "@/lib/astra/store";
import { DAY_MS, dayKey, minutesOfDay, startOfDay, WEEKDAYS } from "@/lib/astra/time";
import type { Reminder, ReminderCategory } from "@/lib/astra/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_mission/routines")({
  head: () => ({
    meta: [
      { title: "Mission Routines — ASTRA" },
      { name: "description", content: "Daily and weekly health routines, reminders and notification centre for crew." },
      { property: "og:title", content: "Mission Routines — ASTRA" },
      { property: "og:description", content: "Daily and weekly health routines, reminders and notification centre for crew." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Routines,
});

const CATEGORY: Record<ReminderCategory, { label: string; icon: typeof Bell; cls: string }> = {
  health: { label: "Health check", icon: HeartPulse, cls: "text-status-red" },
  hydration: { label: "Hydration", icon: Droplets, cls: "text-primary" },
  exercise: { label: "Exercise", icon: Dumbbell, cls: "text-status-orange" },
  sleep: { label: "Sleep", icon: Moon, cls: "text-violet" },
  wellbeing: { label: "Wellbeing", icon: Brain, cls: "text-teal" },
  environment: { label: "Environment", icon: Thermometer, cls: "text-status-yellow" },
};

type Draft = { id?: string; title: string; category: ReminderCategory; time: string; days: number[] };

function ReminderDialog({ draft, onClose }: { draft: Draft | null; onClose: () => void }) {
  const [d, setD] = useState<Draft | null>(draft);
  const [error, setError] = useState<string | null>(null);
  if (draft && (!d || d.id !== draft.id)) setD(draft);
  if (!d) return null;
  const save = () => {
    if (d.title.trim().length < 3) return setError("Give the reminder a title of at least 3 characters.");
    if (d.title.length > 80) return setError("Keep the title under 80 characters.");
    if (!/^\d{2}:\d{2}$/.test(d.time)) return setError("Choose a valid time.");
    if (d.days.length === 0) return setError("Select at least one day.");
    if (d.id) actions.updateReminder(d.id, { title: d.title.trim(), category: d.category, time: d.time, days: d.days });
    else actions.addReminder({ title: d.title.trim(), category: d.category, time: d.time, days: d.days, enabled: true });
    toast.success(d.id ? "Reminder updated" : "Reminder added");
    setError(null);
    onClose();
  };
  return (
    <Dialog open={!!draft} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="border-border bg-popover">
        <DialogHeader>
          <DialogTitle className="font-display">{d.id ? "Edit reminder" : "New reminder"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="rem-title" className="text-sm font-medium">
              Title
            </label>
            <Input id="rem-title" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} placeholder="e.g. Post-EVA hydration" className="bg-background/40" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <Select value={d.category} onValueChange={(v) => setD({ ...d, category: v as ReminderCategory })}>
                <SelectTrigger className="bg-background/40" aria-label="Category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {(Object.keys(CATEGORY) as ReminderCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY[c].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="rem-time" className="text-sm font-medium">
                Time
              </label>
              <Input id="rem-time" type="time" value={d.time} onChange={(e) => setD({ ...d, time: e.target.value })} className="bg-background/40 font-mono" />
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Days</p>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((w, i) => (
                <label key={w} className={cn("flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs", d.days.includes(i) ? "border-primary/50 bg-primary/10 text-primary" : "border-border")}>
                  <Checkbox
                    checked={d.days.includes(i)}
                    onCheckedChange={(v) => setD({ ...d, days: v ? [...d.days, i].sort() : d.days.filter((x) => x !== i) })}
                  />
                  {w}
                </label>
              ))}
            </div>
          </div>
          {error && (
            <p role="alert" className="text-sm text-status-red">
              {error}
            </p>
          )}
          <Button variant="hero" className="w-full" onClick={save}>
            Save reminder
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Routines() {
  const state = useAstra();
  const [view, setView] = useState<"daily" | "weekly" | "all">("daily");
  const [draft, setDraft] = useState<Draft | null>(null);
  const now = Date.now();
  const today = dayKey(now);
  const nowMin = new Date(now).getHours() * 60 + new Date(now).getMinutes();
  const todays = remindersForDay(state.reminders, now);
  const done = todays.filter((r) => r.completions.includes(today)).length;
  const notes = notifications(state, now);

  const weekStart = startOfDay(now) - 6 * DAY_MS;
  const weekDays = Array.from({ length: 7 }, (_, i) => weekStart + i * DAY_MS);
  const weekly = weekDays.map((ts) => {
    const list = remindersForDay(state.reminders, ts);
    return { ts, total: list.length, done: list.filter((r) => r.completions.includes(dayKey(ts))).length };
  });
  const weekTotal = weekly.reduce((s, d) => s + d.total, 0);
  const weekDone = weekly.reduce((s, d) => s + d.done, 0);

  const newDraft = () => setDraft({ title: "", category: "health", time: "09:00", days: [0, 1, 2, 3, 4, 5, 6] });
  const editDraft = (r: Reminder) => setDraft({ id: r.id, title: r.title, category: r.category, time: r.time, days: r.days });

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Smart mission reminders"
        title="Mission Routines"
        description="Scheduled health checks, hydration, exercise, sleep logs, wellbeing check-ins and environment reviews — built around a demanding crew timeline."
        actions={
          <Button variant="hero" onClick={newDraft}>
            <Plus /> New reminder
          </Button>
        }
      />

      <Panel kicker="Personalised from your latest checkup and diet" title="Strict daily health routine">
        <ul className="divide-y divide-border text-sm">
          {strictRoutine((state.checkups ?? []).at(-1), state.settings).map((b) => (
            <li key={b.time + b.title} className="flex gap-4 py-2"><span className="w-14 font-mono text-primary">{b.time}</span><span><b>{b.title}</b> — {b.detail}</span></li>
          ))}
        </ul>
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        <Panel kicker="Today" title={`${done} of ${todays.length} tasks complete`}>
          <Progress value={todays.length ? (done / todays.length) * 100 : 0} className="h-2" />
        </Panel>
        <Panel kicker="Last 7 days" title={`${weekTotal ? Math.round((weekDone / weekTotal) * 100) : 0}% completion`}>
          <div className="flex h-10 items-end gap-1.5">
            {weekly.map((d) => (
              <div key={d.ts} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-sm bg-gradient-primary" style={{ height: `${d.total ? (d.done / d.total) * 32 + 2 : 2}px` }} />
                <span className="font-mono text-[0.55rem] text-muted-foreground">{WEEKDAYS[new Date(d.ts).getDay()][0]}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel kicker="Notification centre" title={`${notes.length} pending`}>
          <p className="text-xs text-muted-foreground">{notes.filter((n) => n.kind === "due").length} overdue · {notes.filter((n) => n.kind === "upcoming").length} upcoming · {notes.filter((n) => n.kind === "alert").length} alerts</p>
        </Panel>
      </div>

      <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
        <TabsList className="glass">
          <TabsTrigger value="daily">Daily schedule</TabsTrigger>
          <TabsTrigger value="weekly">Weekly schedule</TabsTrigger>
          <TabsTrigger value="all">Manage reminders</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {view === "daily" && (
            <Panel kicker={new Date(now).toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" })} title="Today's timeline">
              <ol className="relative space-y-2 border-l border-border pl-5">
                {todays.map((r) => {
                  const isDone = r.completions.includes(today);
                  const overdue = !isDone && minutesOfDay(r.time) <= nowMin;
                  const C = CATEGORY[r.category];
                  return (
                    <li key={r.id} className={cn("relative flex items-center gap-3 rounded-xl border p-3 transition-colors", isDone ? "border-status-green/40 bg-status-green/8" : overdue ? "border-status-yellow/40 bg-status-yellow/5" : "border-border")}>
                      <span className={cn("absolute -left-[1.6rem] size-2.5 rounded-full", isDone ? "bg-status-green" : overdue ? "bg-status-yellow" : "bg-muted-foreground")} />
                      <span className="w-12 font-mono text-sm text-muted-foreground">{r.time}</span>
                      <C.icon className={cn("size-4 shrink-0", C.cls)} />
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-sm", isDone ? "text-muted-foreground line-through" : "text-foreground")}>{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {C.label}
                          {overdue && " · overdue"}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={isDone ? "glass" : "default"}
                        onClick={() => {
                          actions.toggleReminder(r.id, today);
                          if (!isDone) toast.success("Task complete · +15 XP");
                        }}
                        aria-pressed={isDone}
                      >
                        <Check /> {isDone ? "Done" : "Complete"}
                      </Button>
                    </li>
                  );
                })}
                {todays.length === 0 && <p className="text-sm text-muted-foreground">No reminders scheduled today.</p>}
              </ol>
            </Panel>
          )}

          {view === "weekly" && (
            <Panel kicker="Rolling 7 days" title="Weekly schedule" actions={<p className="text-xs text-muted-foreground">Tap a cell to mark complete. Future days are locked.</p>}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-xs">
                  <thead>
                    <tr>
                      <th className="hud-label py-2 text-left font-normal">Task</th>
                      {weekDays.map((ts) => (
                        <th key={ts} className={cn("hud-label py-2 font-normal", dayKey(ts) === today && "text-primary")}>
                          {WEEKDAYS[new Date(ts).getDay()]}
                          <br />
                          {new Date(ts).getDate()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {state.reminders
                      .filter((r) => r.enabled)
                      .sort((a, b) => minutesOfDay(a.time) - minutesOfDay(b.time))
                      .map((r) => (
                        <tr key={r.id} className="border-t border-border/50">
                          <td className="py-1.5 pr-2 text-foreground">
                            <span className="font-mono text-muted-foreground">{r.time}</span> {r.title}
                          </td>
                          {weekDays.map((ts) => {
                            const sched = r.days.includes(new Date(ts).getDay());
                            const k = dayKey(ts);
                            const isDone = r.completions.includes(k);
                            return (
                              <td key={ts} className="py-1.5 text-center">
                                {sched ? (
                                  <button
                                    type="button"
                                    onClick={() => actions.toggleReminder(r.id, k)}
                                    aria-label={`${r.title} on ${k}: ${isDone ? "completed" : "not completed"}`}
                                    className={cn("mx-auto grid size-7 place-items-center rounded-md border transition-colors", isDone ? "border-status-green/50 bg-status-green/20 text-status-green" : "border-border hover:border-primary/50")}
                                  >
                                    {isDone && <Check className="size-3.5" />}
                                  </button>
                                ) : (
                                  <span className="text-muted-foreground/40">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}

          {view === "all" && (
            <Panel kicker="Customise" title="All reminders">
              <ul className="space-y-2">
                {state.reminders
                  .slice()
                  .sort((a, b) => minutesOfDay(a.time) - minutesOfDay(b.time))
                  .map((r) => {
                    const C = CATEGORY[r.category];
                    return (
                      <li key={r.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                        <Switch checked={r.enabled} onCheckedChange={(v) => actions.updateReminder(r.id, { enabled: v })} aria-label={`Enable ${r.title}`} />
                        <C.icon className={cn("size-4", C.cls)} />
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-sm", !r.enabled && "text-muted-foreground")}>{r.title}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {r.time} · {r.days.length === 7 ? "Every day" : r.days.map((d) => WEEKDAYS[d]).join(", ")}
                          </p>
                        </div>
                        <Button size="icon" variant="ghost" aria-label="Edit reminder" onClick={() => editDraft(r)}>
                          <Pencil />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="Delete reminder"
                          onClick={() => {
                            actions.deleteReminder(r.id);
                            toast("Reminder deleted");
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </li>
                    );
                  })}
              </ul>
            </Panel>
          )}
        </div>

        <Panel kicker="Notification centre" title="Needs your attention">
          <ul className="space-y-2">
            {notes.length === 0 && <li className="text-sm text-muted-foreground">All caught up.</li>}
            {notes.map((n) => (
              <li key={n.id} className="rounded-xl border border-border p-3">
                <div className="flex items-start gap-2">
                  <Bell className={cn("mt-0.5 size-4 shrink-0", n.kind === "alert" ? "text-status-orange" : n.kind === "due" ? "text-status-yellow" : "text-primary")} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{n.title}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{n.detail}</p>
                  </div>
                </div>
                {n.reminderId && (
                  <Button size="sm" variant="glass" className="mt-2 h-7 text-xs" onClick={() => actions.toggleReminder(n.reminderId!, today)}>
                    <Check /> Mark complete
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <ReminderDialog draft={draft} onClose={() => setDraft(null)} />
    </div>
  );
}
