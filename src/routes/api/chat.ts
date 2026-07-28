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
          onError: (error) => {
            console.error("chat stream error", error);
            const msg = error instanceof Error ? error.message : String(error);
            if (/authentication|unauthorized|401|api key/i.test(msg)) {
              return "The AI provider rejected the request — no valid credentials. Set AI_GATEWAY_API_KEY in your environment variables.";
            }
            if (msg.includes("429")) {
              return "I'm getting a lot of requests right now — please try again in a moment.";
            }
            if (msg.includes("402")) {
              return "AI credits or service quota exhausted. Please check your API key configuration.";
            }
            if (/not found|404|model/i.test(msg)) {
              return `The configured model is unavailable. Check the AI_MODEL setting. (${msg})`;
            }
            return "Something went wrong generating a response. Please try again.";
          },
        });
      },
    },
  },
});
