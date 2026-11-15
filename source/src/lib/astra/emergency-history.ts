import type { UIMessage } from "ai";

export const EMERGENCY_HISTORY_KEY = "astra-emergency-chat-v1";

export function parseEmergencyHistory(raw: string | null): UIMessage[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((m): m is UIMessage => !!m && typeof m === "object" && typeof m.id === "string" && ["user", "assistant"].includes(m.role) && Array.isArray(m.parts) && m.parts.every((p: unknown) => !!p && typeof p === "object" && "type" in p && typeof p.type === "string"));
  } catch { return []; }
}