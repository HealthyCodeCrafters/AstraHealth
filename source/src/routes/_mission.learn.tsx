import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, BookOpen } from "lucide-react";

import { PageHeader, Panel } from "@/components/astra/PageHeader";
import { Button } from "@/components/ui/button";
import { MODULES } from "@/lib/astra/education";
import researchCover from "@/assets/human-research/image1.png.asset.json";
import { assetUrl } from "@/lib/astra/local-assets";

export const Route = createFileRoute("/_mission/learn")({
  head: () => ({
    meta: [
      { title: "Education Centre — ASTRA" },
      { name: "description", content: "Short lessons on astronaut health in space." },
      { property: "og:title", content: "Education Centre — ASTRA" },
      { property: "og:description", content: "Short lessons on astronaut health in space." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <div className="space-y-6">
      <PageHeader kicker="Learn" title="Education Centre" />
      <Button asChild variant="glass" className="h-auto w-full justify-start overflow-hidden whitespace-normal rounded-lg p-0 text-left">
        <Link to="/learn/human-research" className="group flex flex-col sm:flex-row">
          <img src={assetUrl(researchCover, "human-research-image1.png")} alt="Samantha Cristoforetti working in the Columbus module’s BioLab" className="h-48 w-full object-cover sm:h-44 sm:w-64" />
          <div className="flex min-w-0 flex-1 items-center gap-4 p-5">
            <div className="min-w-0 flex-1">
              <p className="mb-2 flex items-center gap-2 text-xs text-primary"><BookOpen /> Human spaceflight research</p>
              <h2 className="text-2xl font-semibold text-foreground">The Human Research</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">NASA’s research into radiation, isolation, distance from Earth, gravity and closed environments.</p>
              <p className="mt-3 text-xs text-muted-foreground">5 spaceflight hazards · 6 NASA photographs</p>
            </div>
            <ArrowUpRight className="size-5 shrink-0 text-primary" />
          </div>
        </Link>
      </Button>
      <div className="grid gap-4 md:grid-cols-2">
        {MODULES.map((m) => (
          <Panel key={m.id} kicker={`${m.minutes} min`} title={m.title}>
            <p className="mb-2 text-sm text-muted-foreground">{m.tagline}</p>
            {m.points.map((p) => <p key={p.heading} className="text-sm"><b>{p.heading}:</b> {p.body}</p>)}
          </Panel>
        ))}
      </div>
    </div>
  ),
});
