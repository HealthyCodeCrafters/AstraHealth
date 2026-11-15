import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).max(40),
  context: z.string().max(1000),
});

export const askNova = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const { novaReply } = await import("./nova.server");
    return { reply: await novaReply(data.messages, data.context) };
  });
