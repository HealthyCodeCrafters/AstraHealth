import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, Panel } from "@/components/astra/PageHeader";
import { SettingsForm } from "@/components/astra/SettingsForm";

export const Route = createFileRoute("/_mission/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Settings — ASTRA" },
      { name: "description", content: "Astronaut personal details, diet, space workplace and contact numbers." },
      { property: "og:title", content: "Profile & Settings — ASTRA" },
      { property: "og:description", content: "Astronaut personal details, diet, space workplace and contact numbers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <div className="space-y-6">
      <PageHeader kicker="Settings" title="Profile & Settings" description="These details personalise your checkups, emergency alerts and routine." />
      <Panel><SettingsForm /></Panel>
    </div>
  ),
});
