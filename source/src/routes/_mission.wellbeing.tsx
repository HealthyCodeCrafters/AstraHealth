import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { MoonStar, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { PageHeader, Panel } from "@/components/astra/PageHeader";
import { WellbeingForm } from "@/components/astra/WellbeingForm";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { askNova } from "@/lib/astra/nova.functions";
import { offlineAnswer, useDemoAssistant } from "@/lib/astra/offline-assistant";
import { isOfflineBuild } from "@/lib/astra/local-assets";
import { actions, useAstra } from "@/lib/astra/store";
import { dayKey } from "@/lib/astra/time";

export const Route = createFileRoute("/_mission/wellbeing")({
  head: () => ({
    meta: [
      { title: "Wellbeing Talk with Nova — ASTRA" },
      { name: "description", content: "Daily wellbeing talk with Nova, your personal AI companion, plus mood check-ins." },
      { property: "og:title", content: "Wellbeing Talk with Nova — ASTRA" },
      { property: "og:description", content: "Daily wellbeing talk with Nova, your personal AI companion, plus mood check-ins." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Wellbeing,
});

type Msg = { role: "user" | "assistant"; content: string };

function Wellbeing() {
  const state = useAstra();
  const ask = useServerFn(askNova);
  const first = state.profile.name.split(" ").slice(-2, -1)[0] ?? "there";
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: `Hi ${first}, it's Nova. How are you feeling today — in body and mind?` }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const doneToday = (state.wellbeingTalks ?? []).includes(dayKey(Date.now()));

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [msgs]);

  const s = state.settings;
  const context = `${state.profile.name}, age ${s?.age}, ${s?.gender}, ${s?.nationality}, diet ${s?.diet}, works at ${s?.workplace} for ${s?.company}, mission day of ${state.profile.missionName}.`;

  const send = async () => {
    const t = text.trim();
    if (!t || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content: t }];
    setMsgs(next);
    setText("");
    setBusy(true);
    setError("");
    if (useDemoAssistant()) {
      const reply = offlineAnswer(t);
      setMsgs((m) => [...m, { role: "assistant", content: `(Local demonstration assistant — rule-based, not AI)\n\n${reply.text}` }]);
      if (next.filter((m) => m.role === "user").length >= 2) actions.markWellbeingTalk();
      setBusy(false);
      return;
    }
    try {
      const { reply } = await ask({ data: { messages: next.slice(-20), context } });
      setMsgs((m) => [...m, { role: "assistant", content: reply }]);
      if (next.filter((m) => m.role === "user").length >= 2) actions.markWellbeingTalk();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nova couldn't reply.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader kicker="Daily wellbeing talk" title="Talk with Nova" description={doneToday ? "Today's wellbeing talk is complete. You can keep chatting anytime." : "Your daily talk is due — share at least two messages to complete it."} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel kicker="AI companion" title="Nova" className="lg:col-span-2">
          <div className="flex h-[26rem] flex-col">
            {isOfflineBuild && <p role="note" className="mb-3 text-sm text-muted-foreground">Local demonstration assistant: rule-based replies, not Nova's AI. Messages stay in this browser.</p>}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {msgs.map((m, i) => (
                <div key={i} className={m.role === "user" ? "ml-auto max-w-[80%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground" : "flex max-w-[85%] gap-2 text-sm"}>
                  {m.role === "assistant" && <MoonStar className="mt-0.5 size-4 shrink-0 text-teal" />}
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}
              {busy && <p className="text-sm text-muted-foreground">Nova is thinking…</p>}
              {error && <p className="text-sm text-status-red">{error}</p>}
              <div ref={end} />
            </div>
            <div className="mt-3 flex gap-2">
              <Textarea rows={2} value={text} placeholder="Tell Nova how you're doing…" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
              <Button onClick={send} disabled={busy || !text.trim()} aria-label="Send"><Send /></Button>
            </div>
          </div>
        </Panel>
        <Panel kicker="Quick check-in" title="Mood log">
          <WellbeingForm />
        </Panel>
      </div>
    </div>
  );
}
