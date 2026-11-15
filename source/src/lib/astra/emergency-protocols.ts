export type ProtocolId = "general" | "bleeding" | "chest" | "breathing";

export const PROTOCOLS: Record<ProtocolId, { title: string; steps: string[]; source: string }> = {
  general: {
    title: "Immediate safety steps",
    steps: ["Check the area is safe; do not enter a hazardous area.", "Alert a nearby crewmate and contact the mission medical officer now; on Earth, call local emergency services.", "Follow your mission emergency checklist or the emergency dispatcher's instructions. Do not wait for this chat."],
    source: "https://www.redcross.org/take-a-class/first-aid/performing-first-aid/first-aid-steps",
  },
  bleeding: {
    title: "Severe bleeding",
    steps: ["Summon emergency medical help immediately and use protective gloves if available.", "Apply firm, direct pressure with clean cloth or a dressing. Do not remove an embedded object; press around it.", "Continue pressure while following your mission medical protocol or dispatcher's instructions."],
    source: "https://www.redcross.org/take-a-class/first-aid/performing-first-aid/first-aid-steps",
  },
  chest: {
    title: "Chest pain",
    steps: ["Contact emergency medical help now, especially for tight, squeezing or spreading pain.", "Stop activity and rest in a comfortable position. Have a crewmate stay nearby; do not drive yourself on Earth.", "Follow medical instructions. Do not take medication based on this chat."],
    source: "https://www.nhs.uk/conditions/heart-attack/",
  },
  breathing: {
    title: "Unresponsive or abnormal breathing",
    steps: ["Summon emergency help immediately. Check responsiveness and normal breathing promptly; gasping is not normal breathing.", "If unresponsive and not breathing normally, follow dispatcher instructions for CPR and use an AED if available, following its prompts.", "In space, use your mission-specific resuscitation protocol and trained crew assistance; Earth procedures may need adaptation."],
    source: "https://www.nwas.nhs.uk/ambulance-academy/resources-for-adults/how-to-do-cpr/",
  },
};

// A convenience selector, never a triage or diagnosis: unmatched wording still shows escalation.
export function selectProtocol(text: string): ProtocolId {
  if (/unresponsive|unconscious|not breathing|isn.t breathing|gasping/i.test(text)) return "breathing";
  if (/bleed|blood loss/i.test(text)) return "bleeding";
  if (/chest|heart attack/i.test(text)) return "chest";
  return "general";
}