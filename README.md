# Cura — Everyday Healthcare Companion

Cura is an AI-powered healthcare and wellness companion that provides clear, calm, and human-centered answers to everyday health questions — symptoms, nutrition, first-aid, and healthy lifestyle guidance.

---

## Features

- 💬 **AI Chat Interface** — Conversational health Q&A with streaming responses
- 🩺 **Symptom Guidance** — Plain-language context around common symptoms
- 🥗 **Nutrition & Lifestyle** — Diet tips, sleep, stress, exercise recommendations
- 🚑 **First-Aid** — Quick actionable steps for common emergencies
- 🔒 **Safety-First** — Automatically directs emergencies to professional services
- 💾 **History Persistence** — Chat history saved locally with a one-click reset

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Tailwind CSS |
| **Routing & SSR** | TanStack Start, TanStack Router |
| **AI Integration** | Vercel AI SDK (`ai`, `@ai-sdk/react`) |
| **UI Components** | Radix UI, Lucide Icons |
| **Build Tool** | Vite |
| **Forms** | React Hook Form + Zod |

---

## Prerequisites

- **Node.js** ≥ 18.0.0 ([download](https://nodejs.org/))
- **npm** ≥ 9.0.0 (bundled with Node.js)
- An **AI API Key** (OpenAI-compatible provider)

---

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/kartikagg19/health-companion-ai.git
cd health-companion-ai
```

### 2. Install Dependencies
```bash
npm install
```

All required packages are listed in `requirements.txt` for reference.

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Required — your AI provider API key
AI_API_KEY=your_api_key_here

# Optional — override default AI gateway endpoint
# AI_BASE_URL=https://api.openai.com/v1
```

### 4. Start the Development Server
```bash
npm run dev
```

Open your browser at `http://localhost:3000`

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

---

## Project Structure

```
├── public/                  # Static assets (favicon, robots.txt)
├── src/
│   ├── assets/              # Logos and images
│   ├── components/
│   │   ├── chat/            # Chat UI: Conversation, Message, PromptInput
│   │   └── ui/              # Reusable UI: Button, Dialog, Input, etc.
│   ├── lib/
│   │   └── ai-provider.server.ts  # AI provider factory
│   ├── routes/
│   │   ├── api/chat.ts      # Streaming chat API endpoint
│   │   ├── index.tsx        # Main chat page
│   │   └── __root.tsx       # Root layout and meta tags
│   └── styles.css           # Global Tailwind styles
├── requirements.txt         # Human-readable dependency overview
├── package.json             # Full dependency manifest
└── vite.config.ts           # Vite build configuration
```

---

## Deployment

This app supports SSR via TanStack Start + Vite Nitro. You can deploy to:

- **Vercel** — connect your GitHub repo and set `AI_API_KEY` in environment variables
- **Netlify** — same process via site environment variables
- **Node.js Server** — run `npm run build` then serve the output

---

## Disclaimer

Cura provides general wellness information only. It is **not** a substitute for professional medical advice, diagnosis, or treatment. Always consult a licensed healthcare professional for medical concerns. In emergencies, call your local emergency services immediately.

---

## License

MIT License — open source and free to use.
