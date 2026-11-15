import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/astra/PageHeader";
import { EmergencyScanner } from "@/components/astra/EmergencyScanner";
import { EmergencyChat } from "@/components/astra/EmergencyChat";

export const Route = createFileRoute("/_mission/emergency")({
  head: () => ({
    meta: [
      { title: "Emergency Camera Assessment — ASTRA" },
      { name: "description", content: "Preliminary image-and-symptom assessment, immediate basic safety protocols and emergency AI guidance. Not diagnosis or automatic emergency calls." },
      { property: "og:title", content: "Emergency Camera Assessment — ASTRA" },
      { property: "og:description", content: "Preliminary image-and-symptom assessment, immediate basic safety protocols and emergency AI guidance. Not diagnosis or automatic emergency calls." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Emergency,
});

function Emergency() {
  const [chatContext, setChatContext] = useState("");
  return (
    <div className="space-y-6">
      <PageHeader kicker="Emergency" title="Emergency Scan" />
      <EmergencyScanner chatContext={chatContext} />
      <div className="border-t border-border pt-6"><EmergencyChat onUserContextChange={setChatContext} /></div>
    </div>
  );
}
