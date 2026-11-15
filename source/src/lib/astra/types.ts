// Core ASTRA data model. All health data is stored on this device only.

export type Status = "green" | "yellow" | "orange" | "red";

export type ReadingKind = "heartRate" | "bloodPressure" | "spo2" | "sleep" | "water" | "activity";

export interface Reading {
  id: string;
  kind: ReadingKind;
  /** heart rate bpm | systolic mmHg | SpO2 % | sleep hours | water ml | activity minutes */
  value: number;
  /** diastolic mmHg | sleep quality 1-5 */
  value2?: number;
  /** activity: true when it was an assigned exercise session */
  assigned?: boolean;
  context?: string;
  timestamp: number;
  simulated: boolean;
}

export type EnvironmentId = "orbit" | "iss" | "lunar" | "mars";

export interface Profile {
  name: string;
  astronautId: string;
  role: string;
  missionName: string;
  missionDurationDays: number;
  missionStart: string; // ISO date (yyyy-mm-dd)
  missionStatus: "Nominal" | "Caution" | "Hold" | "Recovery";
  environment: EnvironmentId;
  hydrationTargetMl: number;
  activityTargetMin: number;
  sleepTargetHours: number;
  spo2ChecksPerDay: number;
}

/** A metric is green inside [normalMin, normalMax], yellow inside the attention band,
 *  orange inside the concern band and red outside every band. */
export interface RefRange {
  normalMin: number;
  normalMax: number;
  attentionMin: number;
  attentionMax: number;
  concernMin: number;
  concernMax: number;
}

export type RangeKey =
  | "heartRate"
  | "systolic"
  | "diastolic"
  | "spo2"
  | "sleep"
  | "cabinTemp"
  | "co2"
  | "radiation";

export type RefRanges = Record<RangeKey, RefRange>;

export interface Alert {
  id: string;
  readingId?: string;
  metric: string;
  status: Status;
  title: string;
  message: string;
  timestamp: number;
  acknowledged: boolean;
  simulated: boolean;
}

export type ReminderCategory = "health" | "hydration" | "exercise" | "sleep" | "wellbeing" | "environment";

export interface Reminder {
  id: string;
  title: string;
  category: ReminderCategory;
  time: string; // HH:MM mission time
  days: number[]; // 0 = Sunday
  completions: string[]; // yyyy-mm-dd
  enabled: boolean;
}

export interface WellbeingEntry {
  id: string;
  timestamp: number;
  mood: number; // 1-5
  stress: number; // 1-5 (5 = very stressed)
  energy: number; // 1-5
  sleepSatisfaction: number; // 1-5
  wellbeing: number; // 1-5
  journal?: string;
  simulated: boolean;
}

export type DietPlan = "standard" | "high-protein" | "vegetarian" | "vegan" | "low-sodium" | "diabetic";

export interface AstronautSettings {
  name: string;
  age: number;
  gender: string;
  nationality: string;
  diet: DietPlan;
  allergies: string;
  workplace: string;
  homePhone: string;
  company: string;
  workPhone: string;
}

export interface DailyCheckup {
  id: string;
  date: string; // yyyy-mm-dd
  timestamp: number;
  heartRate: number;
  systolic: number;
  diastolic: number;
  spo2: number;
  temperature: number;
  glucose: number;
  weightKg: number;
  sleepHours: number;
  notes?: string;
}

export interface AstraState {
  settings?: AstronautSettings;
  checkups?: DailyCheckup[];
  wellbeingTalks?: string[]; // yyyy-mm-dd of completed AI talks
  version: number;
  profile: Profile;
  ranges: RefRanges;
  readings: Reading[];
  alerts: Alert[];
  reminders: Reminder[];
  wellbeing: WellbeingEntry[];
  quizzesPassed: string[];
  readNotifications: string[];
}
