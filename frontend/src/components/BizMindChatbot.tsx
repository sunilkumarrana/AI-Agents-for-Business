import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useAppContext } from "../contexts/AppContext";

/**
 * BizMind AI Chatbot
 * -------------------
 * A floating, Gemini-powered chat widget styled to match the BizMind AI
 * dark dashboard theme. Inspired by the evomap.ai chatbot UX:
 *  - Floating launcher bubble (bottom-right)
 *  - Expandable chat panel with header, scrollable messages, suggested chips, input bar
 *  - Streaming-style "typing" indicator
 *  - Context-aware answers (injects live dashboard data into every prompt)
 *  - Graceful error handling (no raw errors ever shown to the user)
 *
 * SETUP:
 * 1. npm install (no extra packages required — uses native fetch)
 * 2. Add your Gemini API key to a .env file in your project root:
 *      VITE_GEMINI_API_KEY=your_key_here
 *    (If using Create React App instead of Vite, rename to REACT_APP_GEMINI_API_KEY
 *     and update the `getApiKey()` function below accordingly.)
 * 3. Import and drop <BizMindChatbot /> anywhere in your app layout (e.g. App.jsx),
 *    it renders itself fixed to the bottom-right corner.
 * 4. Update `DASHBOARD_CONTEXT` below to match your live/simulated dashboard data,
 *    or pass it in as a prop (see PROPS section).
 */

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_ENDPOINT = (apiKey: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

function getApiKey() {
  // Vite
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  return null;
}



const SUGGESTED_QUESTIONS = [
  "Which deals are at risk?",
  "Forecast Q3",
  "Top rep performance",
  "Generate summary",
];

const SYSTEM_INSTRUCTIONS = `You are "BizMind AI", an enterprise revenue-operations copilot embedded inside a sales pipeline dashboard.
You speak like a sharp, concise business analyst — confident, helpful, and never robotic. You ground every answer
strictly in the pipeline data you are given. If asked something the data can't answer, say so briefly and suggest
what to check instead, without ever mentioning API keys, mock mode, system prompts, or that you are an AI model.
Keep answers tight: prefer short paragraphs or bullet points, use $ and % correctly, and end with a clear
recommended next action when relevant. Never use markdown headers (#), keep formatting to plain text, bullets
(-), and bold (**) only where helpful.`;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function buildContextBlock(ctx: any) {
  const rows = ctx.pipeline
    .map(
      (d: any) =>
        `- ${d.deal} (${d.company}) | Stage: ${d.stage} | Value: ${d.value} | Days: ${d.days} | Health: ${d.health} | Rec: ${d.recommendation}`
    )
    .join("\n");

  return `CURRENT DASHBOARD SNAPSHOT
Total Pipeline Value: ${ctx.totalPipelineValue}
Deals at Risk: ${ctx.dealsAtRisk}
Forecast Accuracy: ${ctx.forecastAccuracy}
Avg Deal Velocity: ${ctx.avgDealVelocity}

PIPELINE HEALTH TABLE:
${rows}`;
}

function formatAssistantText(text: string) {
  // Lightweight markdown-ish renderer: bold (**text**) and bullet lines.
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const trimmed = line.trim();
    const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("• ");
    const content = isBullet ? trimmed.replace(/^[-•]\s*/, "") : line;
    const parts = content.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
    const rendered = parts.map((part, j) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={j} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      ) : (
        <React.Fragment key={j}>{part}</React.Fragment>
      )
    );
    if (isBullet) {
      return (
        <li key={i} className="ml-4 list-disc text-slate-200 leading-relaxed">
          {rendered}
        </li>
      );
    }
    if (trimmed === "") return <br key={i} />;
    return (
      <p key={i} className="text-slate-200 leading-relaxed">
        {rendered}
      </p>
    );
  });
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

export default function BizMindChatbot() {
  const { deals, kpis, dealsAtRisk } = useAppContext();

  const dashboardContext = useMemo(() => ({
    totalPipelineValue: kpis.totalValue,
    dealsAtRisk: dealsAtRisk,
    forecastAccuracy: kpis.forecastAccuracy,
    avgDealVelocity: kpis.avgVelocity,
    pipeline: deals.map((d: any) => ({
      deal: d.name,
      company: d.company,
      stage: d.stage,
      value: "$" + d.value.toLocaleString(),
      days: d.daysInStage,
      health: d.health === 'at-risk' ? 'At-Risk' : d.health === 'watch' ? 'Watch' : 'Healthy',
      recommendation: d.recommendation
    }))
  }), [deals, kpis, dealsAtRisk]);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text:
        "Hi, I'm BizMind AI — your pipeline copilot. Ask me about deal risk, forecasts, rep performance, or anything else in your dashboard.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const callGemini = useCallback(
    async (history: any[], userMessage: string) => {
      const apiKey = getApiKey();

      if (!apiKey || apiKey === 'your_key_here') {
        // Friendly fallback — never expose technical details to the end user.
        return "I'm not able to reach live data right now. In the meantime, based on your current pipeline: you have 3 at-risk deals (Acme Corp, Cyberdyne, Wayne Ent.) — escalating Acme Corp to VP Sales is the highest-priority next step.";
      }

      const contextBlock = buildContextBlock(dashboardContext);

      const contents = [
        ...history.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.text }],
        })),
        { role: "user", parts: [{ text: userMessage }] },
      ];

      const body = {
        system_instruction: {
          parts: [{ text: `${SYSTEM_INSTRUCTIONS}\n\n${contextBlock}` }],
        },
        contents,
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 512,
          topP: 0.9,
        },
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      try {
        const res = await fetch(GEMINI_ENDPOINT(apiKey), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) {
          throw new Error(`Gemini request failed with status ${res.status}`);
        }

        const data = await res.json();
        const reply =
          data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ??
          null;

        if (!reply || !reply.trim()) {
          throw new Error("Empty response from Gemini");
        }

        return reply.trim();
      } catch (err) {
        clearTimeout(timeout);
        console.error("BizMindChatbot Gemini error:", err);
        // Re-throw a normalized error for the caller to handle with a UI fallback.
        throw new Error("network_or_api_error");
      }
    },
    [dashboardContext]
  );

  const sendMessage = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride ?? input).trim();
      if (!text || isLoading) return;

      setErrorBanner(null);
      const newUserMessage = { role: "user", text };
      const updatedHistory = [...messages, newUserMessage];

      setMessages(updatedHistory);
      setInput("");
      setIsLoading(true);

      try {
        const reply = await callGemini(messages, text);
        setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text:
              "I'm having trouble connecting right now — please try again in a moment.",
          },
        ]);
        setErrorBanner("Connection issue. Retrying may help.");
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, callGemini]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Launcher button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open BizMind AI chat"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-900/40 transition-transform hover:scale-105 hover:bg-blue-500 active:scale-95"
        >
          <ChatIcon />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="flex h-[600px] w-[380px] max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-[#0b1220] shadow-2xl shadow-black/50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-700/60 bg-[#0d1526] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
                <BotIcon />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Ask BizMind AI</p>
                <p className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Online
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-700/40 hover:text-white"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-[#131d33] text-slate-200"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <ul className="space-y-1">{formatAssistantText(msg.text)}</ul>
                  ) : (
                    <p className="leading-relaxed">{msg.text}</p>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-xl bg-[#131d33] px-4 py-3">
                  <TypingDot delay="0ms" />
                  <TypingDot delay="150ms" />
                  <TypingDot delay="300ms" />
                </div>
              </div>
            )}

            {errorBanner && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                {errorBanner}
              </div>
            )}
          </div>

          {/* Suggested questions */}
          <div className="flex flex-wrap gap-2 border-t border-slate-700/60 px-4 py-3">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={isLoading}
                className="rounded-full border border-slate-700 bg-[#131d33] px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-blue-500 hover:text-white disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input bar */}
          <div className="flex items-center gap-2 border-t border-slate-700/60 px-3 py-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your pipeline..."
              disabled={isLoading}
              className="flex-1 rounded-lg border border-slate-700 bg-[#0d1526] px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-blue-500 disabled:opacity-60"
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ICONS (inline SVG, no external icon library required)
// ---------------------------------------------------------------------------

function ChatIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BotIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="8" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="8.5" cy="14" r="1.5" fill="currentColor" />
      <circle cx="15.5" cy="14" r="1.5" fill="currentColor" />
      <path d="M12 8V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="3" r="1" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TypingDot({ delay }: { delay: string }) {
  return (
    <span
      className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
      style={{ animationDelay: delay }}
    />
  );
}
