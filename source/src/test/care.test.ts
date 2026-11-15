import { describe, expect, it } from "vitest";

import { runScan } from "@/lib/astra/care";

const normal = { heartRate: 72, spo2: 98, systolic: 115, temperature: 36.8, respRate: 14, conscious: true, symptoms: [] as string[] };

describe("emergency scan", () => {
  it("normal vitals with a cramp are not fatal", () => {
    expect(runScan({ ...normal, symptoms: ["muscle cramp"] }, []).fatal).toBe(false);
  });
  it("an unresponsive astronaut is fatal", () => {
    expect(runScan({ ...normal, conscious: false }, []).fatal).toBe(true);
  });
  it("oxygen below 88% is fatal", () => {
    expect(runScan({ ...normal, spo2: 85 }, []).fatal).toBe(true);
  });
});
