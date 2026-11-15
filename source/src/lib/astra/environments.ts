import type { EnvironmentId } from "./types";

export interface EnvironmentProfile {
  id: EnvironmentId;
  name: string;
  short: string;
  location: string;
  gravityG: number;
  gravityLabel: string;
  cabinTemp: number;
  co2: number;
  radiation: number; // mSv/day typical
  pressureKpa: number;
  commsDelay: string;
  summary: string;
  whyDifferent: string;
  priorities: { title: string; detail: string }[];
  extras: { label: string; value: string; note: string }[];
}

export const ENVIRONMENTS: Record<EnvironmentId, EnvironmentProfile> = {
  orbit: {
    id: "orbit",
    name: "Earth Orbit / Spacecraft",
    short: "Orbit",
    location: "Orion-class capsule · 410 km LEO",
    gravityG: 0,
    gravityLabel: "Microgravity (~10⁻⁶ g)",
    cabinTemp: 22.5,
    co2: 2.8,
    radiation: 0.55,
    pressureKpa: 101.3,
    commsDelay: "< 1 s",
    summary:
      "A compact vehicle with limited volume. Fluid shifts, disrupted sleep and radiation exposure are the key monitoring priorities.",
    whyDifferent:
      "Without gravity, about 2 litres of body fluid shift toward the head. Heart workload changes, faces look puffy and sleep is disturbed by noise, light and a 90-minute day–night cycle.",
    priorities: [
      { title: "Cardiovascular", detail: "Fluid shift changes blood pressure and heart rate patterns." },
      { title: "Sleep", detail: "16 sunrises per day can disrupt circadian rhythm." },
      { title: "Radiation", detail: "South Atlantic Anomaly passes raise dose rate briefly." },
      { title: "Cabin CO₂", detail: "Small cabin volume makes CO₂ build up faster." },
    ],
    extras: [
      { label: "Orbit period", value: "92 min", note: "≈ 16 sunrises per day" },
      { label: "SAA passes today", value: "5", note: "Higher radiation zone" },
    ],
  },
  iss: {
    id: "iss",
    name: "International Space Station",
    short: "ISS",
    location: "ISS · Destiny module · 408 km LEO",
    gravityG: 0,
    gravityLabel: "Microgravity (~10⁻⁶ g)",
    cabinTemp: 22.0,
    co2: 2.5,
    radiation: 0.65,
    pressureKpa: 101.3,
    commsDelay: "< 1 s",
    summary:
      "Long-duration station life. Daily exercise, environmental control and long-term health records protect bone, muscle and heart health.",
    whyDifferent:
      "Crews live in microgravity for six months or more. Without load, bones can lose about 1–1.5% of mass per month, so roughly 2 hours of daily exercise on ARED, CEVIS and T2 is scheduled.",
    priorities: [
      { title: "Exercise", detail: "≈ 2 h/day resistance + aerobic to protect bone and muscle." },
      { title: "Environment", detail: "Track CO₂, temperature and air quality in each module." },
      { title: "Long-term records", detail: "Trends over months reveal slow changes early." },
      { title: "Vision", detail: "Fluid shifts can affect the eyes (SANS) over long stays." },
    ],
    extras: [
      { label: "Exercise devices", value: "ARED · CEVIS · T2", note: "Resistance, cycle, treadmill" },
      { label: "Crew aboard", value: "7", note: "Shared air and schedule" },
    ],
  },
  lunar: {
    id: "lunar",
    name: "Lunar Surface",
    short: "Moon",
    location: "Artemis Base Camp · Shackleton rim",
    gravityG: 0.166,
    gravityLabel: "Lunar gravity (0.166 g)",
    cabinTemp: 21.0,
    co2: 2.2,
    radiation: 1.37,
    pressureKpa: 70.3,
    commsDelay: "1.3 s",
    summary:
      "Surface operations with frequent spacesuit EVAs. Workload, thermal stress, dust and higher radiation exposure need close attention.",
    whyDifferent:
      "The Moon has no magnetic field or thick atmosphere, so surface dose rates are about 2–3× higher than on the ISS. EVAs are physically demanding, and fine abrasive regolith dust can irritate eyes and lungs.",
    priorities: [
      { title: "EVA workload", detail: "Suit work raises heart rate and fluid loss — hydrate before and after." },
      { title: "Radiation", detail: "Watch for solar particle events; shelter if alerted." },
      { title: "Dust exposure", detail: "Report eye, nose or throat irritation after EVAs." },
      { title: "Partial gravity", detail: "1/6 g changes gait and loads joints differently." },
    ],
    extras: [
      { label: "EVA hours this week", value: "11.5 h", note: "Spacesuit operations" },
      { label: "Suit O₂ reserve", value: "92%", note: "Last EVA post-check" },
    ],
  },
  mars: {
    id: "mars",
    name: "Mars Habitat",
    short: "Mars",
    location: "Ares Habitat · Jezero Crater",
    gravityG: 0.38,
    gravityLabel: "Martian gravity (0.38 g)",
    cabinTemp: 21.5,
    co2: 2.4,
    radiation: 0.64,
    pressureKpa: 70.3,
    commsDelay: "4–24 min",
    summary:
      "Very long isolation with delayed communication. Self-monitoring, sleep patterns, wellbeing and habitat conditions are essential.",
    whyDifferent:
      "Help from Earth can be up to 24 minutes away each direction, so crews must spot changes themselves. The 24 h 39 min sol slowly shifts sleep timing, and months of confinement can affect mood and team dynamics.",
    priorities: [
      { title: "Isolation & wellbeing", detail: "Daily check-ins help notice changes in mood and stress." },
      { title: "Sleep patterns", detail: "The longer sol can drift your body clock." },
      { title: "Cardiovascular", detail: "Readapting from transit microgravity to 0.38 g." },
      { title: "Habitat air", detail: "Closed-loop life support needs constant checks." },
    ],
    extras: [
      { label: "Sol length", value: "24 h 39 m", note: "Martian solar day" },
      { label: "Earth comms delay", value: "14 min", note: "One way, current" },
    ],
  },
};

export const ENV_LIST = Object.values(ENVIRONMENTS);
