import { z } from "zod";

// Symptoms are described in the emergency chatbot; structured fields keep safe defaults.
export const symptomSchema = z.object({
  symptoms: z.string().trim().min(1).max(4000),
  location: z.string().trim().max(200).default("Not specified"),
  onset: z.string().trim().max(200).default("Not specified"),
  severity: z.enum(["mild", "moderate", "severe"]).default("moderate"),
  progression: z.enum(["improving", "unchanged", "worsening", "rapidly worsening"]).default("unchanged"),
  additional: z.string().max(4000).default(""),
  chatContext: z.string().max(8000).default(""),
  redFlags: z.array(z.enum(["breathing", "chest", "bleeding", "stroke", "allergy"])).max(5).default([]),
});
export type AssessmentSymptoms = z.infer<typeof symptomSchema>;

export const assessmentSchema = z.object({
  status: z.enum(["Emergency", "Urgent", "Non-urgent"]),
  visualObservations: z.array(z.string()),
  symptomAnalysis: z.string(),
  potentialConcerns: z.array(z.string()),
  recommendedActions: z.array(z.string()),
  medicalAssistance: z.string(),
}).strict();
export type EmergencyAssessment = z.infer<typeof assessmentSchema>;

export const RED_FLAGS = [
  { id: "breathing", label: "Unresponsive or struggling to breathe" },
  { id: "chest", label: "New chest pain or pressure" },
  { id: "bleeding", label: "Severe or uncontrolled bleeding" },
  { id: "stroke", label: "Sudden face droop, arm weakness or speech difficulty" },
  { id: "allergy", label: "Tongue or throat swelling" },
] as const;

// A conservative escalation trigger, never a diagnosis or a safety clearance.
export function needsImmediateHelp(input: Pick<AssessmentSymptoms, "symptoms" | "additional" | "chatContext" | "redFlags">) {
  if (input.redFlags.length) return true;
  return /chest\s+(pain|pressure|tightness)|unresponsive|unconscious|not breathing|can.?t breathe|cannot breathe|struggl\w* to breathe|shortness of breath|severe\s+bleeding|uncontrolled\s+bleeding|gasping|face\s+droop|slurred\s+speech|throat\s+swelling|tongue\s+swelling/i.test([input.symptoms, input.additional, input.chatContext].join(" "));
}

export function enforceEscalation(result: EmergencyAssessment, input: AssessmentSymptoms): EmergencyAssessment {
  if (!needsImmediateHelp(input)) return result;
  return {
    ...result, status: "Emergency",
    medicalAssistance: "Contact your mission medical officer immediately; on Earth call local emergency services. Do not wait for this assessment. " + result.medicalAssistance,
  };
}

export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
export function validPhotoType(type: string) { return ["image/jpeg", "image/png", "image/webp"].includes(type); }