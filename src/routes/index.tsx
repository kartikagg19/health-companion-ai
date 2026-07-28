import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Activity,
  Apple,
  HeartPulse,
  Leaf,
  RotateCcw,
  Shield,
  Stethoscope,
} from "lucide-react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/chat/conversation";
import { Message, MessageContent } from "@/components/chat/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/chat/prompt-input";
import { Button } from "@/components/ui/button";
import curaLogo from "@/assets/cura-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cura — Your Everyday Healthcare Companion" },
      {
        name: "description",
        content:
          "A warm AI healthcare companion for symptoms, nutrition, prevention, and first-aid guidance. Not a substitute for professional medical advice.",
      },
      {
        property: "og:title",
        content: "Cura — Your Everyday Healthcare Companion",
      },
      {
        property: "og:description",
        content:
          "Chat with Cura for calm, human answers about symptoms, healthy living, nutrition, and first aid.",
      },
    ],
  }),
  component: HomePage,
});

const STORAGE_KEY = "cura.chat.v1";

const SUGGESTIONS = [
  { icon: Activity, label: "What could a persistent headache mean?" },
  { icon: Apple, label: "Simple diet for better energy?" },
  { icon: Shield, label: "How do I lower my blood pressure naturally?" },
  { icon: HeartPulse, label: "First aid for a small burn" },
];

function loadInitial(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UIMessage[]) : [];
  } catch {
    return [];
  }
}

function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }
  return <ChatApp />;
}

function ChatApp() {
  const [initial] = useState<UIMessage[]>(loadInitial);

  const { messages, sendMessage, status, setMessages, stop } = useChat({
    id: "cura-main",
    messages: initial,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (err) => console.error("useChat error", err),
  });


  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [input, setInput] = useState("");

  // Persist to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      /* ignore quota */
    }
  }, [messages]);

  // Keep the textarea focused after send / stream / clear
  useEffect(() => {
    textareaRef.current?.focus();
  }, [status, messages.length]);

  const isBusy = status === "submitted" || status === "streaming";

  const handleSubmit = async ({ text }: { text: string }) => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    setInput("");
    await sendMessage({ text: trimmed });
  };

  const sendSuggestion = async (text: string) => {
    if (isBusy) return;
    await sendMessage({ text });
  };

  const resetChat = () => {
    setMessages([]);
    setInput("");
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const showEmpty = messages.length === 0;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header onReset={resetChat} hasMessages={messages.length > 0} />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-6 pt-4 sm:px-6">
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-[var(--surface)] shadow-[var(--shadow-soft)]">
          <Conversation className="flex-1">
            <ConversationContent className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 sm:px-6">
              {showEmpty ? (
                <EmptyState onPick={sendSuggestion} disabled={isBusy} />
              ) : (
                messages.map((m) => (
                  <ChatBubble key={m.id} message={m} />
                ))
              )}
              {status === "submitted" && <ThinkingBubble />}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <div className="border-t border-border bg-[var(--surface)] px-3 py-3 sm:px-4">
            <PromptInput onSubmit={handleSubmit} className="rounded-xl">
              <PromptInputTextarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                placeholder="Ask about symptoms, nutrition, first aid…"
                autoFocus
              />
              <PromptInputFooter className="justify-between">
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  Cura offers general info — not a medical diagnosis.
                </span>
                <PromptInputSubmit
                  status={isBusy ? "streaming" : undefined}
                  disabled={!input.trim() && !isBusy}
                  onClick={(e) => {
                    if (isBusy) {
                      e.preventDefault();
                      stop();
                    }
                  }}
                />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Cura is an AI companion for general wellness information. For medical
          concerns, please consult a licensed healthcare professional. In an
          emergency, call your local emergency number.
        </p>
      </main>
    </div>
  );
}

function Header({
  onReset,
  hasMessages,
}: {
  onReset: () => void;
  hasMessages: boolean;
}) {
  return (
    <header className="border-b border-border bg-[var(--surface)]/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
            <img src={curaLogo} alt="Cura" className="h-6 w-6" />
          </div>
          <div className="leading-tight">
            <h1 className="font-display text-lg font-semibold text-foreground">
              Cura
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Your everyday healthcare companion
            </p>
          </div>
        </div>
        {hasMessages && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            New chat
          </Button>
        )}
      </div>
    </header>
  );
}

function EmptyState({
  onPick,
  disabled,
}: {
  onPick: (text: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
        <Stethoscope className="h-8 w-8 text-primary" strokeWidth={1.6} />
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
          How are you feeling today?
        </h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          I'm Cura — ask me about symptoms, nutrition, healthy habits, or
          basic first-aid. I'll keep it clear and honest, and point you to a
          professional when it matters.
        </p>
      </div>

      <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map(({ icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            disabled={disabled}
            onClick={() => onPick(label)}
            className="group flex items-start gap-2.5 rounded-xl border border-border bg-background px-3.5 py-3 text-left text-sm text-foreground transition hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50"
          >
            <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-md bg-primary/10 text-primary transition group-hover:bg-primary/15">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="leading-snug">{label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Leaf className="h-3 w-3" />
        General wellness info · not a medical diagnosis
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: UIMessage }) {
  const text = message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");

  const isUser = message.role === "user";

  if (isUser) {
    return (
      <Message from="user">
        <MessageContent className="bg-primary text-primary-foreground">
          <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
        </MessageContent>
      </Message>
    );
  }

  return (
    <Message from="assistant" className="items-start">
      <div className="mt-1 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
        <img src={curaLogo} alt="" className="h-4 w-4" />
      </div>
      <MessageContent className="msg-prose bg-transparent px-0 py-0 text-foreground">
        <ReactMarkdown>{text || "…"}</ReactMarkdown>
      </MessageContent>
    </Message>
  );
}

function ThinkingBubble() {
  return (
    <Message from="assistant" className="items-start">
      <div className="mt-1 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
        <img src={curaLogo} alt="" className="h-4 w-4" />
      </div>
      <MessageContent className="bg-transparent px-0 py-0 text-muted-foreground">
        <span className="inline-flex items-center gap-1 text-sm">
          Thinking
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </span>
      </MessageContent>
    </Message>
  );
}
