import { codexEvents } from "@/server/codex-events";
import { withCors } from "@/server/cors";

const encoder = new TextEncoder();

export function streamChat(upstream: Response, model: string, created: number) {
  let id = `chatcmpl-${crypto.randomUUID()}`;
  let sentChunk = false;
  return withCors(
    new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const event of codexEvents(upstream)) {
              if (!sentChunk) {
                id = event.response?.id ?? id;
              }
              if (event.type === "response.output_text.delta" && event.delta) {
                sentChunk = true;
                controller.enqueue(
                  sse(chatChunk(id, model, created, event.delta)),
                );
              }
              if (event.type === "response.completed") {
                controller.enqueue(sse(chatChunk(id, model, created)));
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          "X-Content-Type-Options": "nosniff",
        },
      },
    ),
  );
}

export async function jsonChat(
  upstream: Response,
  model: string,
  created: number,
) {
  let id = `chatcmpl-${crypto.randomUUID()}`;
  let content = "";
  for await (const event of codexEvents(upstream)) {
    id = event.response?.id ?? id;
    if (event.type === "response.output_text.delta") {
      content += event.delta ?? "";
    }
  }
  return jsonCors({
    id,
    object: "chat.completion",
    created,
    model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content },
        finish_reason: "stop",
      },
    ],
  });
}

function jsonCors(value: unknown) {
  return withCors(Response.json(value));
}

function chatChunk(id: string, model: string, created: number, content = "") {
  return {
    id,
    object: "chat.completion.chunk",
    created,
    model,
    choices: [
      {
        index: 0,
        delta: content ? { content } : {},
        finish_reason: content ? null : "stop",
      },
    ],
  };
}

function sse(value: unknown) {
  return encoder.encode(`data: ${JSON.stringify(value)}\n\n`);
}
