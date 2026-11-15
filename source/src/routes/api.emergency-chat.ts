import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/emergency-chat")({
  server: { handlers: { POST: async ({ request }) => {
    const { handleEmergencyChat } = await import("@/lib/astra/emergency-ai/chat.server");
    return handleEmergencyChat(request, process.env.LOVABLE_API_KEY);
  } } },
});