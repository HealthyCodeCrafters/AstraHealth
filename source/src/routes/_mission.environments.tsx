import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, Panel } from "@/components/astra/PageHeader";
import { ENV_LIST } from "@/lib/astra/environments";

export const Route = createFileRoute("/_mission/environments")({
  head: () => ({
    meta: [
      { title: "Space Environments — ASTRA" },
      { name: "description", content: "How orbit, ISS, lunar and Mars environments affect astronaut health." },
      { property: "og:title", content: "Space Environments — ASTRA" },
      { property: "og:description", content: "How orbit, ISS, lunar and Mars environments affect astronaut health." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <div className="space-y-6">
      <PageHeader kicker="Environments" title="Space Environments" />
      <div className="grid gap-4 md:grid-cols-2">
        {ENV_LIST.map((e) => (
          <Panel key={e.id} kicker={e.location} title={e.name}>
            <p className="text-sm">{e.summary}</p>
            <p className="mt-2 text-xs text-muted-foreground">{e.gravityLabel} · Cabin {e.cabinTemp} °C · Comms delay {e.commsDelay}</p>
          </Panel>
        ))}
      </div>
    </div>
  ),
});
