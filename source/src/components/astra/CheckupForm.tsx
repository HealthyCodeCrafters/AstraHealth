import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CHECKUP_FIELDS, type CheckupKey } from "@/lib/astra/care";
import { actions } from "@/lib/astra/store";

const DEFAULTS: Record<CheckupKey, string> = {
  heartRate: "", systolic: "", diastolic: "", spo2: "", temperature: "", glucose: "", weightKg: "", sleepHours: "",
};

export function CheckupForm({ onDone }: { onDone?: () => void }) {
  const [v, setV] = useState(DEFAULTS);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const nums = Object.fromEntries(Object.entries(v).map(([k, x]) => [k, Number(x)])) as Record<CheckupKey, number>;
    if (Object.values(nums).some((n) => !n || Number.isNaN(n))) {
      toast.error("Please enter every measurement.");
      return;
    }
    actions.addCheckup(nums);
    toast.success("Today's checkup saved");
    setV(DEFAULTS);
    onDone?.();
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CHECKUP_FIELDS.map((f) => (
          <div key={f.key} className="space-y-1">
            <Label htmlFor={`ck-${f.key}`}>{f.label} ({f.unit})</Label>
            <Input id={`ck-${f.key}`} type="number" step="0.1" value={v[f.key]} onChange={(e) => setV((p) => ({ ...p, [f.key]: e.target.value }))} />
            <p className="text-xs text-muted-foreground">Device: {f.device}</p>
          </div>
        ))}
      </div>
      <Button type="submit" variant="hero">Save today's checkup</Button>
    </form>
  );
}
