export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

export type DiagramKey = "heart" | "pressure" | "oxygen" | "sleep" | "water" | "microgravity" | "bone" | "radiation" | "mind";

export interface Module {
  id: string;
  title: string;
  tagline: string;
  minutes: number;
  diagram: DiagramKey;
  points: { heading: string; body: string }[];
  quiz: QuizQuestion[];
}

export const MODULES: Module[] = [
  {
    id: "heart-rate",
    title: "What heart rate means",
    tagline: "Your heartbeat is a window into fitness, stress and adaptation.",
    minutes: 4,
    diagram: "heart",
    points: [
      { heading: "The basics", body: "Heart rate is beats per minute (bpm). Each beat pushes blood carrying oxygen to your muscles and brain." },
      { heading: "Resting vs active", body: "Resting heart rate is measured when calm. It rises during exercise, stress, illness or dehydration and falls as you rest." },
      { heading: "In space", body: "Without gravity your heart pumps less hard to reach your head. Over months it may get slightly smaller, so trends matter more than single numbers." },
    ],
    quiz: [
      { q: "When should a resting heart rate be measured?", options: ["Right after exercise", "After 5 minutes of quiet rest", "During an EVA"], answer: 1, explain: "Resting rate is only comparable when taken in the same calm conditions." },
      { q: "Why do trends matter more than one reading?", options: ["Single readings are always wrong", "Many things briefly change heart rate", "Trends are easier to read"], answer: 1, explain: "Caffeine, stress or movement can briefly change one reading. Trends show real adaptation." },
    ],
  },
  {
    id: "blood-pressure",
    title: "How to measure blood pressure",
    tagline: "Two numbers that describe how hard blood pushes on your arteries.",
    minutes: 5,
    diagram: "pressure",
    points: [
      { heading: "Systolic & diastolic", body: "Systolic (top) is pressure during a heartbeat. Diastolic (bottom) is pressure while the heart relaxes. Written like 118/76 mmHg." },
      { heading: "Good technique", body: "Rest 5 minutes, arm supported at heart level, cuff on bare skin, no talking. Bad position can change a reading by 10 mmHg or more." },
      { heading: "Returning to gravity", body: "After spaceflight, blood can pool in the legs when standing, causing dizziness. Pre-flight and in-flight trends help flight surgeons plan recovery." },
    ],
    quiz: [
      { q: "In 120/80, what is 80?", options: ["Systolic", "Diastolic", "Heart rate"], answer: 1, explain: "The bottom number is diastolic — pressure between beats." },
      { q: "Where should your arm be during measurement?", options: ["Above your head", "At heart level", "Hanging loose"], answer: 1, explain: "Heart level avoids falsely high or low readings." },
    ],
  },
  {
    id: "oxygen",
    title: "What oxygen saturation represents",
    tagline: "How much of your blood's oxygen-carrying capacity is in use.",
    minutes: 3,
    diagram: "oxygen",
    points: [
      { heading: "SpO₂", body: "A pulse oximeter shines red and infrared light through your finger to estimate the % of haemoglobin carrying oxygen." },
      { heading: "Typical readings", body: "Healthy people at sea-level pressure usually read 95–100%. Your mission's reference range may differ." },
      { heading: "Common errors", body: "Cold fingers, movement, nail polish and poor fit can produce low readings. Always repeat an unexpected low value." },
    ],
    quiz: [
      { q: "What should you do with an unexpected low SpO₂ reading?", options: ["Ignore it", "Check sensor fit and repeat", "Turn off the oximeter"], answer: 1, explain: "Many low readings are caused by fit or cold hands. Repeat, then follow procedures if still low." },
    ],
  },
  {
    id: "sleep",
    title: "Why sleep is important",
    tagline: "Rest protects alertness, mood and safety-critical performance.",
    minutes: 4,
    diagram: "sleep",
    points: [
      { heading: "Sleep cycles", body: "Each night has ~4–5 cycles of light, deep and REM sleep. Deep sleep helps physical recovery; REM supports memory and mood." },
      { heading: "Space disruptors", body: "Noise from fans, light, 16 orbital sunrises and busy schedules mean astronauts often sleep ~6 hours." },
      { heading: "Helpful habits", body: "Keep a regular sleep time, dim screens, use eye masks and earplugs, and avoid caffeine late in the day." },
    ],
    quiz: [
      { q: "Which sleep stage especially supports memory and mood?", options: ["REM sleep", "Light sleep", "Being awake"], answer: 0, explain: "REM sleep is linked with memory consolidation and emotional processing." },
    ],
  },
  {
    id: "hydration",
    title: "Why hydration matters",
    tagline: "Thirst is a poor guide in microgravity.",
    minutes: 3,
    diagram: "water",
    points: [
      { heading: "Less thirst", body: "Fluid shifts toward the head trick the body into sensing it has extra fluid, so you may feel less thirsty." },
      { heading: "Kidney stones", body: "Bone calcium released in microgravity increases kidney stone risk. Drinking enough water helps flush it." },
      { heading: "EVAs & exercise", body: "Suits and exercise cause sweating. Hydrate before and after sessions." },
    ],
    quiz: [
      { q: "Why is kidney stone risk higher in space?", options: ["More salt in food", "Calcium released from bones", "Cold water"], answer: 1, explain: "Bone loss releases calcium that can form stones without enough fluid." },
    ],
  },
  {
    id: "microgravity",
    title: "How microgravity affects the body",
    tagline: "Fluids float up, muscles unload and balance gets confused.",
    minutes: 6,
    diagram: "microgravity",
    points: [
      { heading: "Fluid shift", body: "About 2 litres of fluid move from legs to head — 'puffy face, bird legs'. It can raise pressure around the eyes." },
      { heading: "Balance", body: "The inner ear loses its sense of 'down', which can cause space motion sickness in the first days." },
      { heading: "Adaptation", body: "The body adapts within weeks, then must readapt on return. Monitoring tracks both phases." },
    ],
    quiz: [
      { q: "What is the 'puffy face, bird legs' effect?", options: ["Weight gain", "Fluid shifting toward the head", "Muscle growth"], answer: 1, explain: "Without gravity pulling fluid down, it redistributes upward." },
      { q: "What causes space motion sickness?", options: ["Inner ear confusion", "Radiation", "Low oxygen"], answer: 0, explain: "The vestibular system loses its gravity reference." },
    ],
  },
  {
    id: "bone-muscle",
    title: "Bone and muscle changes",
    tagline: "Use it or lose it — even in orbit.",
    minutes: 5,
    diagram: "bone",
    points: [
      { heading: "Bone loss", body: "Weight-bearing bones like hips and spine can lose around 1–1.5% of mass per month without loading." },
      { heading: "Muscle loss", body: "Postural muscles in legs and back weaken because they no longer hold you up." },
      { heading: "Countermeasures", body: "Daily resistance (ARED), cycling (CEVIS), treadmill (T2) and good nutrition greatly reduce losses." },
    ],
    quiz: [
      { q: "What is the main countermeasure for bone loss?", options: ["Extra sleep", "Resistance exercise", "Drinking coffee"], answer: 1, explain: "Mechanical loading through resistance exercise signals bones to stay strong." },
    ],
  },
  {
    id: "radiation",
    title: "How radiation exposure is monitored",
    tagline: "Invisible but measurable — dosimeters keep count.",
    minutes: 5,
    diagram: "radiation",
    points: [
      { heading: "Sources", body: "Galactic cosmic rays, solar particle events and trapped belt particles. Earth's magnetic field shields low orbit partly; the Moon and Mars have little protection." },
      { heading: "Measuring dose", body: "Personal and area dosimeters record dose in millisieverts (mSv). A typical ISS day is ~0.5–1 mSv; a chest X-ray is ~0.1 mSv." },
      { heading: "Protection", body: "Mission control warns of solar storms so crews can shelter in shielded areas. Cumulative dose is tracked against career limits." },
    ],
    quiz: [
      { q: "What unit is used for radiation dose?", options: ["mmHg", "Millisievert (mSv)", "Kelvin"], answer: 1, explain: "Sieverts measure the biological effect of radiation dose." },
      { q: "Why is surface radiation higher on the Moon?", options: ["It's closer to the Sun", "No global magnetic field or thick atmosphere", "Moon rocks are radioactive"], answer: 1, explain: "Without a magnetic field or atmosphere, particles reach the surface." },
    ],
  },
  {
    id: "mental",
    title: "Why mental wellbeing matters",
    tagline: "Isolation and confinement test every crew.",
    minutes: 4,
    diagram: "mind",
    points: [
      { heading: "Stressors", body: "Isolation, confinement, distance from family, workload and the same faces every day can build up over months." },
      { heading: "Noticing early", body: "Regular check-ins help you notice changes in mood, energy or sleep before they affect you or the team." },
      { heading: "Support", body: "Breathing exercises, exercise, hobbies, private family calls and conversations with mission psychologists all help. Asking for support is a strength." },
    ],
    quiz: [
      { q: "Why do daily wellbeing check-ins help?", options: ["They diagnose illness", "They help notice changes early", "They replace psychologists"], answer: 1, explain: "Check-ins raise self-awareness; they do not diagnose." },
    ],
  },
];

export const GLOSSARY: { term: string; def: string }[] = [
  { term: "ARED", def: "Advanced Resistive Exercise Device — the ISS weight-lifting machine using vacuum cylinders." },
  { term: "Bradycardia", def: "A heart rate lower than the usual reference range (often below 50–60 bpm at rest)." },
  { term: "CEVIS", def: "Cycle Ergometer with Vibration Isolation and Stabilization — the ISS exercise bike." },
  { term: "Circadian rhythm", def: "Your body's ~24-hour internal clock controlling sleep, temperature and hormones." },
  { term: "Diastolic pressure", def: "Blood pressure while the heart relaxes between beats (bottom number)." },
  { term: "Dosimeter", def: "A device that measures accumulated radiation dose." },
  { term: "EVA", def: "Extravehicular Activity — any work done in a spacesuit outside the vehicle or habitat." },
  { term: "Fluid shift", def: "Movement of body fluids toward the head in microgravity." },
  { term: "Flight surgeon", def: "A physician responsible for crew health before, during and after missions." },
  { term: "Hypoxia", def: "Not enough oxygen reaching body tissues." },
  { term: "Microgravity", def: "A condition of very weak apparent gravity, as experienced in orbit." },
  { term: "mmHg", def: "Millimetres of mercury — the unit for blood pressure and cabin CO₂ partial pressure." },
  { term: "mSv", def: "Millisievert — a unit of radiation dose reflecting biological effect." },
  { term: "Orthostatic intolerance", def: "Dizziness or fainting when standing, common after returning from space." },
  { term: "ppCO₂", def: "Partial pressure of carbon dioxide in cabin air. High levels can cause headaches and fatigue." },
  { term: "Pulse oximeter", def: "A clip-on sensor that estimates blood oxygen saturation (SpO₂) using light." },
  { term: "SANS", def: "Spaceflight Associated Neuro-ocular Syndrome — eye changes linked to long-duration flight." },
  { term: "Sol", def: "A Martian solar day: 24 hours 39 minutes." },
  { term: "Solar particle event", def: "A burst of high-energy particles from the Sun that raises radiation dose." },
  { term: "SpO₂", def: "Peripheral oxygen saturation — % of haemoglobin carrying oxygen." },
  { term: "Systolic pressure", def: "Blood pressure during a heartbeat (top number)." },
  { term: "Tachycardia", def: "A heart rate higher than the usual reference range (often above 100 bpm at rest)." },
  { term: "Vestibular system", def: "The balance organs in your inner ear." },
];
