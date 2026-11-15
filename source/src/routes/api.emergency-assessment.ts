import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/emergency-assessment")({
  server: { handlers: { POST: async ({ request }) => {
    const { handleEmergencyAssessment } = await import("@/lib/astra/emergency-ai/assessment.server");
    return handleEmergencyAssessment(request, process.env['LOVABLE_API_KEY']);
  } } },
});