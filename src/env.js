import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    OPENAI_API_KEY: z.string().optional(),
    OPENAI_CODEX_AUTH: z.string().min(1),
    REASONING_EFFORT: z
      .enum(["minimal", "low", "medium", "high", "xhigh", "none"])
      .optional(),
    REASONING_SUMMARY: z
      .enum(["auto", "concise", "detailed", "none"])
      .default("auto"),
    CHATGPT_RESPONSES_URL: z
      .string()
      .url()
      .default("https://chatgpt.com/backend-api/codex/responses"),
    CHATGPT_LOCAL_CLIENT_ID: z.string().default("app_EMoamEEZ73f0CkXaXp7hrann"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    // NEXT_PUBLIC_CLIENTVAR: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_CODEX_AUTH: process.env.OPENAI_CODEX_AUTH,
    REASONING_EFFORT: process.env.REASONING_EFFORT,
    REASONING_SUMMARY: process.env.REASONING_SUMMARY,
    CHATGPT_RESPONSES_URL: process.env.CHATGPT_RESPONSES_URL,
    CHATGPT_LOCAL_CLIENT_ID: process.env.CHATGPT_LOCAL_CLIENT_ID,
    // NEXT_PUBLIC_CLIENTVAR: process.env.NEXT_PUBLIC_CLIENTVAR,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
