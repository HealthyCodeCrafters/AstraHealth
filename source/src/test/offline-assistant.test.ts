import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("demonstration assistant availability", () => {
  it("uses local replies in a static offline build even when the browser is online", async () => {
    vi.stubEnv("VITE_OFFLINE", "true");
    vi.stubGlobal("navigator", { onLine: true });
    const { useDemoAssistant, offlineAnswer } = await import("@/lib/astra/offline-assistant");
    expect(useDemoAssistant()).toBe(true);
    expect(offlineAnswer("sleep").text).toContain("Sleep");
  });

  it("uses local replies for disconnected server-backed builds", async () => {
    vi.stubEnv("VITE_OFFLINE", "false");
    vi.stubGlobal("navigator", { onLine: false });
    const { useDemoAssistant } = await import("@/lib/astra/offline-assistant");
    expect(useDemoAssistant()).toBe(true);
  });

  it("keeps online server-backed builds on the AI path", async () => {
    vi.stubEnv("VITE_OFFLINE", "false");
    vi.stubGlobal("navigator", { onLine: true });
    const { useDemoAssistant } = await import("@/lib/astra/offline-assistant");
    expect(useDemoAssistant()).toBe(false);
  });
});
