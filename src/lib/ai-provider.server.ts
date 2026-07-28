import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

/**
 * Default Gemini model. This is a bare Google model id (no `provider/` prefix),
 * which is what the Generative Language API expects.
 */
export const DEFAULT_MODEL = "gemini-3.6-flash";

/**
 * Resolves the language model for the chat route.
 *
 * Default path: Google's Generative Language API, authenticated with
 * `GEMINI_API_KEY` (get one at https://aistudio.google.com/apikey).
 *
 * Override path: set `AI_BASE_URL` to point at any OpenAI-compatible endpoint,
 * in which case `AI_API_KEY` is required and `AI_MODEL` must name a model that
 * host actually serves.
 */
export function resolveChatModel(): LanguageModel {
  const modelId = process.env.AI_MODEL || DEFAULT_MODEL;
  const baseURL = process.env.AI_BASE_URL;

  if (baseURL) {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "AI_BASE_URL is set but AI_API_KEY is missing. Set AI_API_KEY, or unset AI_BASE_URL to use Gemini directly.",
      );
    }
    return createOpenAICompatible({
      name: "ai-provider",
      baseURL,
      headers: { Authorization: `Bearer ${apiKey}` },
    })(modelId);
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing GEMINI_API_KEY. Add it to your environment variables (get a key at https://aistudio.google.com/apikey).",
    );
  }

  return createGoogleGenerativeAI({ apiKey })(modelId);
}
