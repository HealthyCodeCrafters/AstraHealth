import { describe, expect, it } from "vitest";
import { enforceEscalation, MAX_PHOTO_BYTES, needsImmediateHelp, symptomSchema, validPhotoType, type AssessmentSymptoms } from "@/lib/astra/emergency-assessment";

const symptoms: AssessmentSymptoms = { symptoms: "Small scrape", location: "Arm", onset: "Today", severity: "mild", progression: "unchanged", additional: "", chatContext: "", redFlags: [] };
describe("Camera assessment safeguards", () => {
  it("accepts chatbot-described symptoms and fills safe defaults", () => {
    const parsed = symptomSchema.parse({ symptoms: "Headache since this morning" });
    expect(parsed.location).toBe("Not specified");
    expect(parsed.onset).toBe("Not specified");
    expect(parsed.severity).toBe("moderate");
    expect(parsed.progression).toBe("unchanged");
    expect(parsed.redFlags).toEqual([]);
  });
  it("still requires symptom text", () => expect(symptomSchema.safeParse({ symptoms: "  " }).success).toBe(false));
  it("escalates chest pain immediately without an image", () => expect(needsImmediateHelp({ ...symptoms, symptoms: "New chest pain" })).toBe(true));
  it("escalates explicitly selected life-threatening symptoms", () => expect(needsImmediateHelp({ ...symptoms, redFlags: ["stroke"] })).toBe(true));
  it("checks explicitly shared chatbot information", () => expect(needsImmediateHelp({ ...symptoms, chatContext: "I am gasping" })).toBe(true));
  it("never lets a normal photograph downgrade life-threatening symptoms", () => {
    const output = enforceEscalation({ status: "Non-urgent", visualObservations: ["No visible abnormality"], symptomAnalysis: "Chest pain", potentialConcerns: [], recommendedActions: [], medicalAssistance: "Seek advice" }, { ...symptoms, symptoms: "Chest pain" });
    expect(output.status).toBe("Emergency");
    expect(output.medicalAssistance).toContain("Contact your mission medical officer immediately");
  });
  it("caps uploaded photos at four megabytes", () => expect(MAX_PHOTO_BYTES).toBe(4194304));
  it("accepts supported image types only", () => { expect(validPhotoType("image/jpeg")).toBe(true); expect(validPhotoType("image/svg+xml")).toBe(false); });
});