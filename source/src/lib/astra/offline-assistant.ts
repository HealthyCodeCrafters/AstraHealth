// Rule-based offline demonstration assistant.
// Used when the AI gateway is unreachable (no internet). It answers from locally stored
// knowledge only — it is NOT a real AI and never gives medical diagnoses.

import { PROTOCOLS, selectProtocol } from "./emergency-protocols";
import { isOfflineBuild } from "./local-assets";

export function useDemoAssistant(): boolean {
  return isOfflineBuild || (typeof navigator !== "undefined" && !navigator.onLine);
}

export interface OfflineReply {
  text: string;
  /** true when the message describes an emergency protocol */
  urgent: boolean;
}

const RULES: { match: RegExp; reply: string; urgent?: boolean }[] = [
  {
    match: /heart rate|pulse|bpm|tachycard|bradycard/i,
    reply:
      "Heart rate (demonstration guidance): a resting adult rate of 60–100 bpm is typical. In microgravity the heart works against less gravity, so small changes are common. If the simulated reading is high, check recent activity, stress and hydration, then repeat the measurement after 5 minutes of rest. Chest pain, fainting or severe shortness of breath need immediate attention.",
  },
  {
    match: /blood pressure|systolic|diastolic|hypertension/i,
    reply:
      "Blood pressure (demonstration guidance): around 90–120 systolic and 60–80 diastolic is a typical resting range. Fluid shifts in space can change readings. Sit quietly for 5 minutes, keep the cuff at heart level, and repeat. A reading above 180/120 with symptoms is an emergency.",
  },
  {
    match: /spo2|oxygen|saturation|breath/i,
    reply:
      "Oxygen saturation (demonstration guidance): 95–100% is typical. Cold fingers, movement or a loose sensor can cause falsely low readings — warm the hand and repeat. Also check cabin CO₂. A sustained reading below 90% needs urgent attention.",
  },
  {
    match: /sleep|insomnia|tired|fatigue|rest/i,
    reply:
      "Sleep (demonstration guidance): crews aim for about 8 hours. In orbit, 16 sunrises a day, noise and light often shorten sleep. Keep the sleep station dark and cool, follow the scheduled bedtime, and avoid caffeine late in the day. Rising fatigue over several days should be flagged to the crew lead.",
  },
  {
    match: /hydrat|water|drink|thirst/i,
    reply:
      "Hydration (demonstration guidance): thirst is weaker in microgravity, so crews drink on a schedule rather than by feel. Check today's total against the target on the dashboard and top up steadily — large amounts at once are less effective.",
  },
  {
    match: /stress|anxious|anxiety|mood|lonely|isolation|sad|wellbeing/i,
    reply:
      "Wellbeing (demonstration guidance): isolation and confinement can affect mood — this is well documented in spaceflight and analog missions. Helpful steps: keep the daily routine, exercise, stay in contact with crew and family, and use the daily wellbeing check-in. Persistent low mood should be raised with the flight surgeon.",
  },
  {
    match: /radiation|dose|msv/i,
    reply:
      "Radiation (demonstration guidance): dose rate depends on the environment — the lunar surface is roughly 2–3× the ISS. During a solar particle event alert, move to the storm shelter area and follow the mission procedure. Cumulative dose is tracked against mission limits on the dashboard.",
  },
  {
    match: /exercise|workout|training|bone|muscle/i,
    reply:
      "Exercise (demonstration guidance): without load, bones can lose about 1–1.5% of mass per month in microgravity. Crews exercise about 2 hours daily (ARED resistance, CEVIS cycle, T2 treadmill). Check exercise completion on Mission Control.",
  },
  {
    match: /temperature|fever|hot|cold/i,
    reply:
      "Body temperature (demonstration guidance): about 36.1–37.2°C is typical. A reading above 38°C suggests fever — rest, hydrate, and re-measure. Cabin temperature is shown separately under Environmental conditions.",
  },
  {
    match: /demo|simulation|simulated|demonstration/i,
    reply:
      "This is Offline Demo Mode: a local simulation engine generates the values you see. Use the control panel to start or pause the simulation, change speed, switch astronaut profiles, environments and scenarios. Every value is demonstration data, not a real measurement.",
  },
];

const FALLBACK =
  "I'm the offline demonstration assistant — a simple rule-based helper, not the full AI. I can explain the simulated health indicators (heart rate, blood pressure, SpO₂, sleep, hydration, stress, radiation, exercise) and basic emergency protocols. Try asking about one of those, or say \"bleeding\", \"chest pain\" or \"not breathing\" for an immediate protocol.";

/** Answer a message using only local rules. Never calls the network. */
export function offlineAnswer(message: string): OfflineReply {
  const protocol = PROTOCOLS[selectProtocol(message)];
  if (selectProtocol(message) !== "general") {
    return {
      urgent: true,
      text: `${protocol.title}\n\n${protocol.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nSource: ${protocol.source}`,
    };
  }
  for (const rule of RULES) {
    if (rule.match.test(message)) return { text: rule.reply, urgent: rule.urgent ?? false };
  }
  return { text: FALLBACK, urgent: false };
}
