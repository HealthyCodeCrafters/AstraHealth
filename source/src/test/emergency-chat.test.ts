import { describe, expect, it } from "vitest";
import { selectProtocol } from "@/lib/astra/emergency-protocols";
import { parseEmergencyHistory } from "@/lib/astra/emergency-history";

describe("Immediate emergency protocol selection", () => {
  it("prioritises abnormal breathing over bleeding", () => expect(selectProtocol("Unresponsive, not breathing and bleeding")).toBe("breathing"));
  it("selects severe bleeding guidance", () => expect(selectProtocol("Severe bleeding from my arm")).toBe("bleeding"));
  it("selects chest pain guidance", () => expect(selectProtocol("I have chest pain")).toBe("chest"));
  it("does not classify unknown symptoms as safe", () => expect(selectProtocol("I feel strange")).toBe("general"));
});
describe("Browser chat history", () => {
  it("restores both roles in one conversation", () => {
    const turns = [{ id: "u", role: "user", parts: [{ type: "text", text: "Chest pain" }] }, { id: "a", role: "assistant", parts: [{ type: "text", text: "Contact medical help" }] }];
    expect(parseEmergencyHistory(JSON.stringify(turns))).toEqual(turns);
  });
  it("rejects malformed storage", () => expect(parseEmergencyHistory("not json")).toEqual([]));
});