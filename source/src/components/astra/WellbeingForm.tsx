import { Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { actions, useAstra } from "@/lib/astra/store";
import { dayKey } from "@/lib/astra/time";

const FIELDS = [
  { key: "mood", label: "Mood", low: "Very low", high: "Very good" },
  { key: "stress", label: "Stress level", low: "Calm", high: "Very stressed" },
  { key: "energy", label: "Energy level", low: "Exhausted", high: "Energised" },
  { key: "sleepSatisfaction", label: "Sleep satisfaction", low: "Very poor", high: "Excellent" },
  { key: "wellbeing", label: "General wellbeing", low: "Struggling", high: "Thriving" },
] as const;

type Key = (typeof FIELDS)[number]["key"];

export function supportiveMessage(v: Record<Key, number>) {
  if (v.stress >= 4 || v.mood <= 2 || v.wellbeing <= 2)
    return "Thank you for checking in honestly. Consider a few minutes of guided breathing, a conversation with a crewmate, or booking a private conference with your mission psychologist. Reaching out is a sign of strength.";
  if (v.energy <= 2 || v.sleepSatisfaction <= 2)
    return "Low energy or poor sleep noted. Protect your next sleep period — dim lights early, use an eye mask and earplugs, and let your crew lead know if workload is high.";
  return "Check-in recorded. Keep doing what's working — regular routines, exercise and connection with family and crew all support wellbeing.";
}

export function WellbeingForm({ onDone }: { onDone?: () => void }) {
  const state = useAstra();
  const [values, setValues] = useState<Record<Key, number>>({ mood: 3, stress: 3, energy: 3, sleepSatisfaction: 3, wellbeing: 3 });
  const [journal, setJournal] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const doneToday = state.wellbeing.some((w) => dayKey(w.timestamp) === dayKey(Date.now()));

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (journal.length > 2000) {
          toast.error("Journal entry is too long (max 2000 characters).");
          return;
        }
        actions.addWellbeing({ ...values, journal: journal.trim() || undefined });
        setResult(supportiveMessage(values));
        setJournal("");
        toast.success("Wellbeing check-in saved · +20 XP");
        onDone?.();
      }}
    >
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="size-3.5 text-violet" /> Private — stored only on this device. ASTRA does not diagnose mental health conditions.
      </p>
      {doneToday && <p className="rounded-lg border border-status-green/40 bg-status-green/10 px-3 py-2 text-xs text-status-green">You've already checked in today. Additional check-ins are welcome.</p>}
      {FIELDS.map((f) => (
        <div key={f.key} className="space-y-2">
          <div className="flex items-center justify-between">
            <label id={`wb-${f.key}`} className="text-sm font-medium text-foreground">
              {f.label}
            </label>
            <span className="font-mono text-sm text-primary">{values[f.key]} / 5</span>
          </div>
          <Slider
            aria-labelledby={`wb-${f.key}`}
            min={1}
            max={5}
            step={1}
            value={[values[f.key]]}
            onValueChange={([v]) => setValues((s) => ({ ...s, [f.key]: v }))}
          />
          <div className="flex justify-between text-[0.68rem] text-muted-foreground">
            <span>{f.low}</span>
            <span>{f.high}</span>
          </div>
        </div>
      ))}
      <div className="space-y-2">
        <label htmlFor="wb-journal" className="text-sm font-medium text-foreground">
          Journal <span className="text-muted-foreground">(optional)</span>
        </label>
        <Textarea
          id="wb-journal"
          value={journal}
          maxLength={2000}
          onChange={(e) => setJournal(e.target.value)}
          placeholder="How was today? Anything on your mind…"
          className="min-h-24 border-input bg-background/40"
        />
      </div>
      <Button type="submit" variant="hero" className="w-full">
        Save check-in
      </Button>
      {result && <p className="rounded-xl border border-primary/30 bg-primary/8 p-3 text-sm leading-relaxed text-foreground">{result}</p>}
    </form>
  );
}
