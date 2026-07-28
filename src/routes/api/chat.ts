import { resolveChatModel } from "@/lib/ai-provider.server";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

const SYSTEM_PROMPT = `You are Cura, a warm and knowledgeable healthcare assistant. You speak like a caring nurse friend — clear, human, never robotic. Avoid corporate hedging and long disclaimers; be conversational.

You help people understand:
- Common symptoms and what they might mean in general terms
- General information about diseases and conditions
- Healthy lifestyle habits (sleep, exercise, stress)
- Nutrition and diet
- Preventive healthcare and screenings
- Basic first-aid guidance

How to respond:
- Keep answers concise and easy to read. Use short paragraphs, and bullet points only when a list genuinely helps.
- Ask a quick follow-up question when it will meaningfully change your advice (age, duration, other symptoms). Don't interrogate.
- Speak in plain language. Explain medical terms briefly if you use them.
- Sound like a human — vary sentence length, use natural phrasing, avoid "As an AI…" or overly formal openers.

Safety:
- You are NOT a doctor and do NOT provide diagnoses, prescriptions, or dosages.
- For anything specific, personal, or serious, gently recommend consulting a licensed healthcare professional.
- For red-flag emergencies (chest pain, stroke signs like FAST, severe bleeding, difficulty breathing, suicidal thoughts, anaphylaxis, poisoning), tell them clearly and immediately to call local emergency services.
- Politely refuse requests outside healthcare/wellness and redirect.

Only include a brief disclaimer (one short sentence) when the question is medical enough to warrant it — not on every message.`;

type ChatRequestBody = { messages?: unknown };

/**
 * Pulls the useful text out of an AI SDK / gateway error. The top-level
 * `message` is often generic, with the real cause nested in `cause`,
 * `responseBody`, or `data`, so collect whatever is present.
 */
function extractErrorDetail(error: unknown): { text: string; status?: number } {
  const parts: string[] = [];
  let status: number | undefined;
  let current: unknown = error;

  for (let depth = 0; current && depth < 4; depth++) {
    if (typeof current === "string") {
      parts.push(current);
      break;
    }
    if (typeof current !== "object") break;

    const e = current as Record<string, unknown>;
    if (typeof e.message === "string") parts.push(e.message);
    if (typeof e.responseBody === "string") parts.push(e.responseBody);
    if (typeof e.statusCode === "number") status ??= e.statusCode;
    if (typeof e.status === "number") status ??= e.status;
    if (e.data && typeof e.data === "object") {
      parts.push(JSON.stringify(e.data));
    }
    current = e.cause;
  }

  const text = [...new Set(parts)].join(" | ").slice(0, 600);
  return { text: text || "Unknown error", status };
}

/**
 * Maps a streaming failure to text shown in the chat. Known cases get friendly
 * wording; anything unrecognised still reports the underlying message rather
 * than hiding it behind a generic string, so misconfiguration stays debuggable.
 */
function describeChatError(error: unknown): string {
  const { text, status } = extractErrorDetail(error);
  console.error("chat stream error", { status, detail: text, error });

  if (
    status === 401 ||
    status === 403 ||
    /authentication|unauthorized|invalid api key/i.test(text)
  ) {
    return "Google rejected the API key. Check that GEMINI_API_KEY is set correctly in your environment variables.";
  }
  if (status === 429 || /rate limit|too many requests/i.test(text)) {
    return "I'm getting a lot of requests right now — please try again in a moment.";
  }
  if (status === 402 || /insufficient|credit|quota|billing|payment|spend limit/i.test(text)) {
    return `Your Gemini API quota is exhausted. Check usage and limits in Google AI Studio. (${text})`;
  }
  if (status === 404 || /not found|unknown model|unsupported model/i.test(text)) {
    return `The configured model isn't available to your account. Check AI_MODEL. (${text})`;
  }
  return `Something went wrong generating a response. (${text})`;
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        let model;
        try {
          model = resolveChatModel();
        } catch (error) {
          console.error("chat config error", error);
          return new Response(
            error instanceof Error ? error.message : "AI provider misconfigured",
            { status: 500 },
          );
        }

        const result = streamText({
          model,
          system: SYSTEM_PROMPT,
          messages: await convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
          onError: (error) => describeChatError(error),
        });
      },
    },
  },
});
