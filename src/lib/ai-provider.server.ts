import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

/**
 * Default model slug. This is an AI Gateway slug (provider/model), not a bare
 * OpenAI model id — it only resolves through the gateway.
 */
export const DEFAULT_MODEL = "google/gemini-3.6-flash";

/**
 * Resolves the language model for the chat route.
 *
 * Default path: returns the model as a plain string, which the `ai` package
 * routes through the Vercel AI Gateway. The gateway authenticates with
 * `AI_GATEWAY_API_KEY`, or automatically via OIDC when running on Vercel.
 *
 * Override path: set `AI_BASE_URL` to point at any OpenAI-compatible endpoint,
 * in which case `AI_API_KEY` is required and the model id is passed through
 * verbatim (so it must be one that endpoint actually serves).
 */
export function resolveChatModel(): LanguageModel {
  const modelId = process.env.AI_MODEL || DEFAULT_MODEL;
  const baseURL = process.env.AI_BASE_URL;

  if (baseURL) {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "AI_BASE_URL is set but AI_API_KEY is missing. Set AI_API_KEY, or unset AI_BASE_URL to use the Vercel AI Gateway.",
      );
    }
    return createOpenAICompatible({
      name: "ai-provider",
      baseURL,
      headers: { Authorization: `Bearer ${apiKey}` },
    })(modelId);
  }

  return modelId;
}
