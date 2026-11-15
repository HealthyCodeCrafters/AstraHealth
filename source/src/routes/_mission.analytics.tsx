import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Lightbulb, TriangleAlert } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { CheckupForm } from "@/components/astra/CheckupForm";
import { PageHeader, Panel } from "@/components/astra/PageHeader";
import { checkupScore, improvements } from "@/lib/astra/care";
import { useAstra } from "@/lib/astra/store";
import { dayKey } from "@/lib/astra/time";

export const Route = createFileRoute("/_mission/analytics")({
  head: () => ({
    meta: [
      { title: "Daily Checkup & Health Status — ASTRA" },
      { name: "description", content: "Log your daily equipment checkup and see your health status as a bar graph with tips." },
      { property: "og:title", content: "Daily Checkup & Health Status — ASTRA" },
      { property: "og:description", content: "Log your daily equipment checkup and see your health status as a bar graph with tips." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Analytics,
});

function barColor(score: number) {
  if (score >= 90) return "var(--status-green)";
  if (score >= 75) return "var(--status-yellow)";
  if (score >= 60) return "var(--status-orange)";
  return "var(--status-red)";
}

function Analytics() {
  const state = useAstra();
  const checkups = [...(state.checkups ?? [])].sort((a, b) => a.timestamp - b.timestamp);
  const today = checkups.find((c) => c.date === dayKey(Date.now()));
  const latest = checkups[checkups.length - 1];
  const data = checkups.slice(-14).map((c) => ({ day: c.date.slice(5), score: checkupScore(c) }));
  const tips = improvements(latest, state.settings);

  return (
    <div className="space-y-6">
      <PageHeader kicker="Daily necessary checkup" title="Daily Checkup & Health Status" description="Measure with your onboard equipment and log the results every day." />

      {today ? (
        <div className="flex items-center gap-2 rounded-lg border border-status-green/40 bg-status-green/10 p-3 text-sm">
          <CheckCircle2 className="size-4 text-status-green" /> Today's checkup is done — score {checkupScore(today)}/100.
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border border-status-red/40 bg-status-red/10 p-3 text-sm">
          <TriangleAlert className="size-4 text-status-red" /> Today's checkup has not been done yet. Please complete it below.
        </div>
      )}

      <Panel kicker="Log" title={today ? "Update today's checkup" : "Today's checkup"}>
        <CheckupForm />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel kicker="Bar graph" title="Daily health status (score out of 100)" className="lg:col-span-2">
          {data.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)" }} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {data.map((d) => <Cell key={d.day} fill={barColor(d.score)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No checkups yet. Your bar graph appears after your first checkup.</p>
          )}
        </Panel>
        <Panel kicker="Improve your health" title="What to do next">
          <ul className="space-y-2 text-sm">
            {tips.map((t) => (
              <li key={t} className="flex gap-2"><Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />{t}</li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
