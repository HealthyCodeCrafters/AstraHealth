import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";

export async function novaReply(messages: ModelMessage[], context: string) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("AI is not configured.");
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  let failure: unknown;
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system:
      "You are Nova, a warm, calm wellbeing companion for an astronaut on a long space mission. " +
      "Hold a short daily wellbeing talk: ask about mood, sleep, stress, isolation and relationships with crew and family. " +
      "Give practical, space-appropriate coping ideas. Keep replies under 120 words. You are not a doctor; " +
      "for medical emergencies tell them to use the Emergency Scan. Astronaut context: " + context,
    messages,
    onError: ({ error }) => {
      failure = error;
    },
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  const text = await result.text;
  if (failure || !text) {
    const status = (failure as { statusCode?: number })?.statusCode;
    if (status === 429) throw new Error("Nova is busy right now. Please try again in a minute.");
    if (status === 402) throw new Error("AI credits have run out. Add credits in Settings → Plans & credits.");
    throw new Error("Nova couldn't reply. Please try again.");
  }
  return text;
}
