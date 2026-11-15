import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpen, ClipboardCheck, History, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Disclaimer, PageHeader, Panel } from "@/components/astra/PageHeader";
import { SimulatedTag, StatusBadge } from "@/components/astra/status";
import { WellbeingForm } from "@/components/astra/WellbeingForm";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { readingStatus } from "@/lib/astra/derived";
import { resultExplanation, validateEntry } from "@/lib/astra/explain";
import { METRICS } from "@/lib/astra/metrics";
import { actions, useAstra, type AddReadingResult } from "@/lib/astra/store";
import { fmtDateTime } from "@/lib/astra/time";
import type { Reading, ReadingKind } from "@/lib/astra/types";
import { cn } from "@/lib/utils";

const TABS = ["heartRate", "bloodPressure", "spo2", "sleep", "water", "activity", "wellbeing"] as const;
type Tab = (typeof TABS)[number];

export const Route = createFileRoute("/_mission/monitor")({
  validateSearch: (s: Record<string, unknown>): { m?: Tab } => ({
    m: TABS.includes(s.m as Tab) ? (s.m as Tab) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Health Monitor — ASTRA" },
      { name: "description", content: "Record heart rate, blood pressure, SpO₂, sleep, hydration, activity and wellbeing." },
      { property: "og:title", content: "Health Monitor — ASTRA" },
      { property: "og:description", content: "Record heart rate, blood pressure, SpO₂, sleep, hydration, activity and wellbeing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Monitor,
});

const TAB_LABEL: Record<Tab, string> = {
  heartRate: "Heart rate",
  bloodPressure: "Blood pressure",
  spo2: "SpO₂",
  sleep: "Sleep",
  water: "Water",
  activity: "Activity",
  wellbeing: "Wellbeing",
};

function Field({ id, label, error, hint, ...props }: { id: string; label: string; error?: string; hint?: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <Input id={id} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={cn("bg-background/40 font-mono", error && "border-status-red")} {...props} />
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`${id}-err`} role="alert" className="text-xs text-status-red">
          {error}
        </p>
      )}
    </div>
  );
}

function EntryForm({ kind, onResult }: { kind: ReadingKind; onResult: (r: AddReadingResult) => void }) {
  const [f, setF] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [assigned, setAssigned] = useState(true);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = validateEntry(kind, f);
    setErrors(v.errors);
    if (!v.ok || v.value === undefined) return;
    const res = actions.addReading({
      kind,
      value: v.value,
      value2: v.value2,
      context: f.context?.trim() || (kind === "heartRate" ? "Resting" : undefined),
      assigned: kind === "activity" ? assigned : undefined,
    });
    onResult(res);
    setF({});
    if (res.alert) toast.warning(res.alert.title, { description: "Logged in the Alert Centre." });
    else toast.success(`${METRICS[kind].label} recorded · +10 XP`);
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {kind === "heartRate" && (
        <>
          <Field id="hr" label="Heart rate (bpm)" inputMode="numeric" placeholder="e.g. 62" value={f.value ?? ""} onChange={set("value")} error={errors.value} />
          <Field id="hr-ctx" label="Context" placeholder="Resting, post-exercise, post-EVA…" value={f.context ?? ""} onChange={set("context")} />
        </>
      )}
      {kind === "bloodPressure" && (
        <div className="grid grid-cols-2 gap-3">
          <Field id="sys" label="Systolic (top)" inputMode="numeric" placeholder="118" value={f.value ?? ""} onChange={set("value")} error={errors.value} />
          <Field id="dia" label="Diastolic (bottom)" inputMode="numeric" placeholder="76" value={f.value2 ?? ""} onChange={set("value2")} error={errors.value2} />
        </div>
      )}
      {kind === "spo2" && <Field id="spo2" label="Oxygen saturation (%)" inputMode="numeric" placeholder="98" value={f.value ?? ""} onChange={set("value")} error={errors.value} />}
      {kind === "sleep" && (
        <div className="grid grid-cols-2 gap-3">
          <Field id="sleep" label="Hours slept" inputMode="decimal" placeholder="7.5" value={f.value ?? ""} onChange={set("value")} error={errors.value} />
          <Field id="quality" label="Quality (1–5)" inputMode="numeric" placeholder="4" value={f.value2 ?? ""} onChange={set("value2")} error={errors.value2} hint="1 exhausted · 5 fully rested" />
        </div>
      )}
      {kind === "water" && (
        <>
          <Field id="water" label="Volume (ml)" inputMode="numeric" placeholder="350" value={f.value ?? ""} onChange={set("value")} error={errors.value} />
          <div className="flex flex-wrap gap-2">
            {[250, 350, 500].map((ml) => (
              <Button key={ml} type="button" size="sm" variant="glass" onClick={() => setF((s) => ({ ...s, value: String(ml) }))}>
                {ml} ml pouch
              </Button>
            ))}
          </div>
        </>
      )}
      {kind === "activity" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field id="act" label="Duration (min)" inputMode="numeric" placeholder="45" value={f.value ?? ""} onChange={set("value")} error={errors.value} />
            <Field id="act-ctx" label="Activity" placeholder="ARED, CEVIS, T2, EVA" value={f.context ?? ""} onChange={set("context")} />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox checked={assigned} onCheckedChange={(v) => setAssigned(v === true)} /> Assigned exercise session
          </label>
        </>
      )}
      <Button type="submit" variant="hero" className="w-full">
        Record measurement
      </Button>
    </form>
  );
}

function valueText(r: Reading) {
  switch (r.kind) {
    case "bloodPressure":
      return `${r.value}/${r.value2} mmHg`;
    case "sleep":
      return `${r.value} h · Q${r.value2}`;
    case "water":
      return `${r.value} ml`;
    case "activity":
      return `${r.value} min`;
    case "spo2":
      return `${r.value}%`;
    default:
      return `${r.value} bpm`;
  }
}

function HistoryTable() {
  const state = useAstra();
  const [filter, setFilter] = useState<ReadingKind | "all">("all");
  const [onlyManual, setOnlyManual] = useState(false);
  const [limit, setLimit] = useState(25);
  const rows = state.readings
    .filter((r) => (filter === "all" || r.kind === filter) && (!onlyManual || !r.simulated))
    .slice()
    .reverse();
  return (
    <Panel
      kicker="Measurement history"
      title="All recorded entries"
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Checkbox checked={onlyManual} onCheckedChange={(v) => setOnlyManual(v === true)} /> My entries only
          </label>
          <Select value={filter} onValueChange={(v) => setFilter(v as ReadingKind | "all")}>
            <SelectTrigger className="h-8 w-40 bg-background/40 text-xs" aria-label="Filter measurements">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All measurements</SelectItem>
              {(Object.keys(METRICS) as ReadingKind[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {METRICS[k].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="hud-label py-2 font-normal">Time</th>
              <th className="hud-label py-2 font-normal">Measurement</th>
              <th className="hud-label py-2 font-normal">Value</th>
              <th className="hud-label py-2 font-normal">Status</th>
              <th className="hud-label py-2 font-normal">Source</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, limit).map((r) => {
              const s = readingStatus(r, state.ranges);
              const hasAlert = state.alerts.some((a) => a.readingId === r.id);
              return (
                <tr key={r.id} className={cn("border-b border-border/50", !r.simulated && "bg-primary/5")}>
                  <td className="py-2 font-mono text-xs text-muted-foreground">{fmtDateTime(r.timestamp)}</td>
                  <td className="py-2 text-foreground">
                    {METRICS[r.kind].label}
                    {r.context && <span className="text-muted-foreground"> · {r.context}</span>}
                  </td>
                  <td className="py-2 font-mono text-foreground">{valueText(r)}</td>
                  <td className="py-2">
                    {s ? <StatusBadge status={s} /> : <span className="text-xs text-muted-foreground">Logged</span>}
                    {hasAlert && <span className="ml-2 text-[0.65rem] text-status-orange">alert recorded</span>}
                  </td>
                  <td className="py-2">{r.simulated ? <SimulatedTag /> : <span className="font-mono text-[0.65rem] uppercase text-primary">Manual</span>}</td>
                  <td className="py-2 text-right">
                    {!r.simulated && (
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Delete entry"
                        onClick={() => {
                          actions.deleteReading(r.id);
                          toast("Entry deleted");
                        }}
                      >
                        <Trash2 className="text-muted-foreground" />
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No entries yet.</p>}
      </div>
      {rows.length > limit && (
        <Button variant="glass" size="sm" className="mt-4" onClick={() => setLimit((l) => l + 50)}>
          Show more ({rows.length - limit} remaining)
        </Button>
      )}
    </Panel>
  );
}

function Monitor() {
  const { m } = Route.useSearch();
  const navigate = useNavigate({ from: "/monitor" });
  const tab: Tab = m ?? "heartRate";
  const state = useAstra();
  const [result, setResult] = useState<AddReadingResult | null>(null);
  const info = tab !== "wellbeing" ? METRICS[tab] : null;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Interactive health assessment"
        title="Health Monitor"
        description="Enter measurements manually. Each entry updates Mission Control, analytics, quests and history instantly — and is saved on this device."
      />

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setResult(null);
          navigate({ search: { m: v as Tab } });
        }}
      >
        <TabsList className="glass h-auto flex-wrap justify-start gap-1 p-1">
          {TABS.map((t) => (
            <TabsTrigger key={t} value={t} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              {TAB_LABEL[t]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {info ? (
        <div className="grid gap-6 lg:grid-cols-5">
          <Panel kicker="Understand it" title={info.label} className="lg:col-span-3">
            <div className="space-y-4 text-sm leading-relaxed">
              <div>
                <h3 className="mb-1 flex items-center gap-2 font-semibold text-primary">
                  <BookOpen className="size-4" /> 1 · What it represents
                </h3>
                <p className="text-muted-foreground">{info.what}</p>
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-primary">2 · Why it matters in spaceflight</h3>
                <p className="text-muted-foreground">{info.why}</p>
              </div>
              <div>
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-primary">
                  <ClipboardCheck className="size-4" /> 3 · How to measure it
                </h3>
                <ol className="space-y-2">
                  {info.how.map((step, i) => (
                    <li key={step} className="flex gap-3">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full border border-primary/40 font-mono text-xs text-primary">{i + 1}</span>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Panel>
          <div className="space-y-6 lg:col-span-2">
            <Panel kicker="Record" title={`Enter ${info.label.toLowerCase()}`}>
              <EntryForm key={tab} kind={tab as ReadingKind} onResult={setResult} />
            </Panel>
            {result && result.reading.kind === tab && (
              <Panel kicker="4 · Recorded result" title={valueText(result.reading)}>
                <div className="space-y-3">
                  {result.status && <StatusBadge status={result.status} />}
                  <h3 className="text-sm font-semibold text-primary">5 · What this result means</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{resultExplanation(result.reading, result.status, state)}</p>
                  {result.status === "red" && (
                    <p role="alert" className="rounded-lg border border-status-red/50 bg-status-red/10 p-3 text-sm font-medium text-status-red">
                      Contact your mission medical officer now and follow the established emergency protocol.
                    </p>
                  )}
                  {result.alert && <p className="text-xs text-status-orange">An alert has been recorded in the Alert Centre and health history.</p>}
                </div>
              </Panel>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel kicker="Daily questionnaire" title="Wellbeing check-in">
            <WellbeingForm />
          </Panel>
          <Panel kicker="Why check in?" title="Small signals, noticed early">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Isolation, confinement and demanding schedules can gradually affect mood, energy and sleep. A one-minute daily check-in makes changes visible over time —
              for you, not for diagnosis. Your answers stay on this device. Visit the Wellbeing page for trends, breathing exercises and your journal.
            </p>
          </Panel>
        </div>
      )}

      <div className="flex items-center gap-2 text-muted-foreground">
        <History className="size-4" />
        <span className="text-xs">Reference ranges are configurable in Profile &amp; Settings and depend on your individual medical guidance and mission protocols.</span>
      </div>
      <HistoryTable />
      <Disclaimer />
    </div>
  );
}
