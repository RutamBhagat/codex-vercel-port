# Codex Vercel Port

An OpenAI-compatible Chat Completions proxy backed by the ChatGPT Codex Responses API.

## Supported endpoints

- `GET /v1/models`
- `POST /v1/chat/completions`

Chat completions support normal text messages, JSON/JSON Schema responses, streaming, inline files, and
vision inputs. Standard Chat Completions image parts are translated to Codex Responses `input_image` parts:

```json
{
  "model": "gpt-5.6-sol-medium",
  "messages": [
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "Describe this image" },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/png;base64,...",
            "detail": "high"
          }
        }
      ]
    }
  ]
}
```

The image URL may be an HTTP(S) URL or a base64 data URL. Multiple image parts may be included in one
message, which allows clients to send an original image together with derived layers or contact sheets.

### Vercel AI SDK

The generic OpenAI-compatible provider cannot discover endpoint capabilities. Enable structured outputs
when creating the provider so `Output.object()` sends a JSON Schema instead of falling back to JSON mode:

```ts
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const codex = createOpenAICompatible({
  name: "codex-vercel-port",
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
  supportsStructuredOutputs: true,
});
```

Without `supportsStructuredOutputs: true`, the AI SDK omits the schema before the request reaches this
proxy and reports that `responseFormat` is unsupported.

## Environment

```bash
OPENAI_CODEX_AUTH='{"tokens":{...}}'
OPENAI_API_KEY=optional-client-facing-proxy-key
```

Optional server settings include `REASONING_EFFORT`, `REASONING_SUMMARY`, `CHATGPT_RESPONSES_URL`, and
`CHATGPT_LOCAL_CLIENT_ID`; their defaults and validation live in `src/env.js`.

## Development

```bash
bun install
bun run dev
```
