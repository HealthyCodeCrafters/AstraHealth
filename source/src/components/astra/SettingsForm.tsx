import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { actions, useAstra } from "@/lib/astra/store";
import type { AstronautSettings, DietPlan } from "@/lib/astra/types";

const DIETS: { value: DietPlan; label: string }[] = [
  { value: "standard", label: "Standard space ration" },
  { value: "high-protein", label: "High protein" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "low-sodium", label: "Low sodium" },
  { value: "diabetic", label: "Diabetic-friendly" },
];

const EMPTY: AstronautSettings = {
  name: "", age: 35, gender: "", nationality: "", diet: "standard", allergies: "",
  workplace: "", homePhone: "", company: "", workPhone: "",
};

export function SettingsForm({ onSaved, submitLabel = "Save settings" }: { onSaved?: () => void; submitLabel?: string }) {
  const state = useAstra();
  const [f, setF] = useState<AstronautSettings>(state.settings ?? EMPTY);
  const up = <K extends keyof AstronautSettings>(k: K, v: AstronautSettings[K]) => setF((p) => ({ ...p, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const required: (keyof AstronautSettings)[] = ["name", "gender", "nationality", "workplace", "homePhone", "company", "workPhone"];
    if (required.some((k) => !String(f[k]).trim()) || !f.age || f.age < 18 || f.age > 90) {
      toast.error("Please fill in every field (age 18–90).");
      return;
    }
    actions.saveSettings({ ...f, age: Number(f.age) });
    toast.success("Settings saved");
    onSaved?.();
  };

  const text = (k: keyof AstronautSettings, label: string, type = "text", ph = "") => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} type={type} placeholder={ph} value={String(f[k])} onChange={(e) => up(k, (type === "number" ? Number(e.target.value) : e.target.value) as never)} />
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-6">
      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="hud-label mb-2">Personal</legend>
        {text("name", "Full name", "text", "e.g. Gnana Deepa")}
        {text("age", "Age", "number")}
        <div className="space-y-1.5">
          <Label>Gender</Label>
          <Select value={f.gender} onValueChange={(v) => up("gender", v)}>
            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
            <SelectContent>
              {["Female", "Male", "Non-binary", "Prefer not to say"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {text("nationality", "Nationality", "text", "e.g. Indian")}
      </fieldset>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="hud-label mb-2">Diet</legend>
        <div className="space-y-1.5">
          <Label>Diet plan</Label>
          <Select value={f.diet} onValueChange={(v) => up("diet", v as DietPlan)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{DIETS.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {text("allergies", "Allergies (optional)", "text", "e.g. peanuts")}
      </fieldset>
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="hud-label mb-2">Work & contacts</legend>
        {text("workplace", "Workplace in space", "text", "e.g. ISS Harmony module")}
        {text("company", "Company / agency", "text", "e.g. ISRO")}
        {text("workPhone", "Work phone", "tel")}
        {text("homePhone", "Home phone", "tel")}
      </fieldset>
      <Button type="submit" variant="hero">{submitLabel}</Button>
    </form>
  );
}
