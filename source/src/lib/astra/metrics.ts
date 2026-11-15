import type { ReadingKind } from "./types";

export interface MetricInfo {
  kind: ReadingKind;
  label: string;
  unit: string;
  what: string;
  why: string;
  how: string[];
}

export const METRICS: Record<ReadingKind, MetricInfo> = {
  heartRate: {
    kind: "heartRate",
    label: "Heart rate",
    unit: "bpm",
    what: "The number of times your heart beats per minute. A resting value is taken after sitting or floating quietly.",
    why: "In microgravity the heart has less work to pump against gravity and can shrink slightly. Tracking heart rate helps show how your cardiovascular system is adapting, and how hard exercise sessions are.",
    how: [
      "Rest quietly for 5 minutes — no exercise, caffeine or talking.",
      "Use the wrist monitor, or place two fingers on the inside of your wrist.",
      "Count beats for 30 seconds and multiply by 2.",
      "Note whether you were resting or active.",
    ],
  },
  bloodPressure: {
    kind: "bloodPressure",
    label: "Blood pressure",
    unit: "mmHg",
    what: "The pressure of blood against your artery walls. Systolic (top number) is during a heartbeat, diastolic (bottom) is between beats.",
    why: "Fluid shifts toward the head change how blood pressure is regulated. When returning to gravity, low pressure on standing (orthostatic intolerance) can cause dizziness.",
    how: [
      "Rest for 5 minutes with feet restrained and arm supported at heart level.",
      "Wrap the cuff on bare upper arm, 2–3 cm above the elbow.",
      "Stay still and silent while the cuff inflates.",
      "Record both numbers. Repeat after 1–2 minutes if unusual.",
    ],
  },
  spo2: {
    kind: "spo2",
    label: "Oxygen saturation",
    unit: "% SpO₂",
    what: "The percentage of haemoglobin in your blood that is carrying oxygen, measured with a fingertip pulse oximeter.",
    why: "It confirms the cabin atmosphere and your lungs are delivering enough oxygen. It is especially important after EVAs, in reduced-pressure habitats and if CO₂ rises.",
    how: [
      "Warm your hand and remove any nail coating if possible.",
      "Clip the oximeter on your index or middle finger.",
      "Keep still for 30–60 seconds until the reading is steady.",
      "Record the stable value, not the first number shown.",
    ],
  },
  sleep: {
    kind: "sleep",
    label: "Sleep",
    unit: "hours",
    what: "How long you slept in your last main sleep period, and how rested you feel (quality 1–5).",
    why: "Crews often sleep less in space due to noise, light, workload and shifting schedules. Poor sleep affects alertness, mood, reaction time and safety-critical tasks.",
    how: [
      "Note when you got into your sleeping bag and when you woke.",
      "Subtract time spent awake during the night.",
      "Rate how rested you feel from 1 (exhausted) to 5 (fully rested).",
      "Log it within an hour of waking.",
    ],
  },
  water: {
    kind: "water",
    label: "Hydration",
    unit: "ml",
    what: "The volume of water and drinks you have consumed.",
    why: "Astronauts often feel less thirsty in microgravity, yet dehydration raises the risk of kidney stones, headaches and reduced performance — especially around EVAs and exercise.",
    how: [
      "Check the volume printed on your drink pouch.",
      "Log each pouch when you finish it.",
      "Include rehydrated food drinks such as juice or coffee.",
      "Drink extra before and after exercise or EVA.",
    ],
  },
  activity: {
    kind: "activity",
    label: "Physical activity",
    unit: "min",
    what: "Minutes of exercise or physically demanding work, such as resistance training, cycling, treadmill or EVA.",
    why: "Without gravity loading, bones and muscles weaken. Regular exercise is the main countermeasure that protects strength and bone density for the return home.",
    how: [
      "Record the session length from start to finish.",
      "Mark whether it was an assigned exercise session.",
      "Add the device or activity type (ARED, CEVIS, T2, EVA).",
      "Log immediately after you finish.",
    ],
  },
};
