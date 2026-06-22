import { z } from "zod";

const codexEventSchema = z
  .object({
    type: z.string().optional(),
    delta: z.string().optional(),
    response: z.object({ id: z.string().optional() }).passthrough().optional(),
  })
  .passthrough();

type CodexEvent = z.infer<typeof codexEventSchema>;

export async function* codexEvents(
  response: Response,
): AsyncGenerator<CodexEvent> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Upstream response body is empty");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const data = line.startsWith("data: ") ? line.slice(6).trim() : "";
        if (!data || data === "[DONE]") {
          continue;
        }
        yield codexEventSchema.parse(JSON.parse(data));
      }
    }
  } finally {
    reader.releaseLock();
  }
}
