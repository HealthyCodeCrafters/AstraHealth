import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCheck, PhoneCall, RotateCcw, ShieldAlert, Siren } from "lucide-react";
import { useState } from "react";

import { Disclaimer, PageHeader, Panel } from "@/components/astra/PageHeader";
import { SimulatedTag, STATUS_CLASSES, StatusBadge } from "@/components/astra/status";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STATUS_META } from "@/lib/astra/ranges";
import { actions, useAstra } from "@/lib/astra/store";
import { fmtDateTime } from "@/lib/astra/time";
import type { ReadingKind, Status } from "@/lib/astra/types";
import { cn } from "@/lib/utils";
import { EmergencyChat } from "@/components/astra/EmergencyChat";

export const Route = createFileRoute("/_mission/alerts")({
  head: () => ({
    meta: [
      { title: "Alert & Response Centre — ASTRA" },
      { name: "description", content: "Out-of-range measurements, guidance and links to approved mission medical procedures." },
      { property: "og:title", content: "Alert & Response Centre — ASTRA" },
      { property: "og:description", content: "Out-of-range measurements, guidance and links to approved mission medical procedures." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Alerts,
});

const STEPS: Record<Status, string[]> = {
  green: ["Continue routine monitoring."],
  yellow: ["Rest quietly for 5 minutes.", "Check sensor or cuff position.", "Repeat the measurement and record it.", "Mention it at your next scheduled medical conference if it persists."],
  orange: ["Repeat the measurement after 5 minutes of rest.", "Note any symptoms (dizziness, headache, breathlessness).", "Request a review via the mission's approved medical procedure (crew medical officer / flight surgeon)."],
  red: ["Stop strenuous activity.", "Contact your mission medical officer immediately.", "Follow the established emergency medical protocol for your vehicle or habitat.", "Inform your commander and crew."],
};

function Alerts() {
  const state = useAstra();
  const [tab, setTab] = useState<"open" | "all">("open");
  const list = state.alerts.filter((a) => tab === "all" || !a.acknowledged).sort((a, b) => b.timestamp - a.timestamp);
  const counts = state.alerts.filter((a) => !a.acknowledged).reduce<Record<Status, number>>((acc, a) => ({ ...acc, [a.status]: acc[a.status] + 1 }), { green: 0, yellow: 0, orange: 0, red: 0 });
  const hasRed = state.alerts.some((a) => !a.acknowledged && a.status === "red");

  return (
    <div className="space-y-6">
      <EmergencyChat />
      <PageHeader
        kicker="Alert & response"
        title="Alert Centre"
        description="When a measurement falls outside your configured reference range, ASTRA highlights it, explains why it may need attention and points to approved procedures."
        actions={
          state.alerts.some((a) => !a.acknowledged) && (
            <Button variant="glass" onClick={() => actions.acknowledgeAll()}>
              <CheckCheck /> Acknowledge all
            </Button>
          )
        }
      />

      {hasRed && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border-2 border-status-red/60 bg-status-red/12 p-5 md:flex-row md:items-center">
          <Siren className="size-8 shrink-0 animate-pulse-glow text-status-red" />
          <div className="flex-1">
            <p className="font-display text-lg font-semibold text-status-red">Urgent warning active</p>
            <p className="text-sm text-foreground">Contact your mission medical officer now and follow the established emergency protocol. Do not rely on this app for medical decisions.</p>
          </div>
          <Button variant="destructive" size="lg">
            <PhoneCall /> Contact medical officer
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {(["red", "orange", "yellow", "green"] as Status[]).map((s) => (
          <div key={s} className={cn("glass rounded-2xl border p-4", STATUS_CLASSES[s].border)}>
            <p className={cn("font-mono text-3xl font-semibold", STATUS_CLASSES[s].text)}>{s === "green" ? state.alerts.filter((a) => a.acknowledged).length : counts[s]}</p>
            <p className="text-xs text-muted-foreground">{s === "green" ? "Acknowledged" : `Open · ${STATUS_META[s].short}`}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "open" | "all")}>
            <TabsList className="glass">
              <TabsTrigger value="open">Open alerts</TabsTrigger>
              <TabsTrigger value="all">Full alert history</TabsTrigger>
            </TabsList>
          </Tabs>
          {list.length === 0 && (
            <Panel>
              <p className="py-6 text-center text-sm text-muted-foreground">No open alerts. All recent measurements are within your configured ranges.</p>
            </Panel>
          )}
          {list.map((a) => (
            <article key={a.id} className={cn("glass rounded-2xl border-l-4 p-5 animate-rise", STATUS_CLASSES[a.status].border, a.acknowledged && "opacity-70")}>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={a.status} label={STATUS_META[a.status].label} />
                {a.simulated && <SimulatedTag />}
                {a.acknowledged && <span className="font-mono text-[0.65rem] uppercase text-muted-foreground">Acknowledged</span>}
                <span className="ml-auto font-mono text-xs text-muted-foreground">{fmtDateTime(a.timestamp)}</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold">{a.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{a.message}</p>
              <div className="mt-4 rounded-xl border border-border bg-background/30 p-3">
                <p className="hud-label mb-2">Recommended response</p>
                <ol className="list-inside list-decimal space-y-1 text-sm text-foreground">
                  {STEPS[a.status].map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {["heartRate", "bloodPressure", "spo2", "sleep"].includes(a.metric) && (
                  <Button asChild size="sm" variant="glass">
                    <Link to="/monitor" search={{ m: a.metric as ReadingKind }}>
                      <RotateCcw /> Repeat measurement
                    </Link>
                  </Button>
                )}
                {!a.acknowledged && (
                  <Button size="sm" onClick={() => actions.acknowledgeAlert(a.id)}>
                    <CheckCheck /> Acknowledge
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="space-y-4">
          <Panel kicker="Colour code reference" title="What each level means">
            <ul className="space-y-3">
              {(["green", "yellow", "orange", "red"] as Status[]).map((s) => (
                <li key={s} className="flex gap-3">
                  <span className={cn("mt-1 size-3 shrink-0 rounded-full", STATUS_CLASSES[s].bg)} />
                  <div>
                    <p className={cn("text-sm font-semibold", STATUS_CLASSES[s].text)}>{STATUS_META[s].label}</p>
                    <p className="text-xs text-muted-foreground">{STATUS_META[s].guidance}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel kicker="Approved procedures" title="Medical response chain">
            <ol className="space-y-3 text-sm">
              {[
                ["Self-check", "Repeat the measurement correctly."],
                ["Crew medical officer", "Onboard trained crew member reviews symptoms."],
                ["Flight surgeon", "Private medical conference via mission control (delayed on Mars)."],
                ["Emergency protocol", "Vehicle/habitat-specific emergency medical checklist."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border border-primary/40 font-mono text-xs text-primary">{i + 1}</span>
                  <div>
                    <p className="font-medium text-foreground">{t}</p>
                    <p className="text-xs text-muted-foreground">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldAlert className="size-4 shrink-0 text-violet" /> ASTRA never replaces professional medical assessment.
            </p>
          </Panel>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}
