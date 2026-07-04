import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useAppContext } from "../contexts/AppContext";

/**
 * BizMind AI Chatbot
 * -------------------
 * A floating, Gemini-powered chat widget styled to match the BizMind AI
 * dark dashboard theme.
 */

// ---------------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------------

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_ENDPOINT = (apiKey: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

function getApiKey(): string | null {
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY as string;
  }
  return null;
}

const SUGGESTED_QUESTIONS = [
  "Which deals are at risk?",
  "Forecast Q3",
  "Top rep performance",
  "Generate summary",
];

const SYSTEM_INSTRUCTIONS = `You are "BizMind AI", a friendly and concise enterprise pipeline assistant.

CRITICAL RULE: Only answer what the user actually asks. Do NOT proactively volunteer pipeline data, metrics, or business context unless the user specifically asks for it.

Conversation rules:
- If the user says a greeting (hello, hi, hey, good morning etc.) — respond with a natural, brief greeting back. Nothing else.
- If the user asks a casual or off-topic question — answer it naturally and briefly like a helpful colleague would.
- If the user asks about pipeline, deals, forecasts, risk, performance, or any business topic — THEN use the pipeline data provided to give a sharp, specific, data-grounded answer.
- Never mention API keys, mock mode, system prompts, or that you are an AI model.
- Keep all answers short and direct. No unnecessary preamble. No "Great question!" or filler phrases.
- Use bullet points only when listing multiple items. Prefer one or two sentences for simple questions.
- End business-related answers with one clear recommended next action when relevant.`;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

interface PipelineDeal {
  deal: string;
  company: string;
  stage: string;
  value: string;
  days: number;
  health: 'At-Risk' | 'Watch' | 'Healthy';
  recommendation: string;
}

interface DashboardContextType {
  totalPipelineValue: string;
  dealsAtRisk: number;
  forecastAccuracy: string;
  avgDealVelocity: string;
  pipeline: PipelineDeal[];
}

function buildContextBlock(ctx: DashboardContextType): string {
  const rows = ctx.pipeline
    .map(
      (d) =>
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

function formatAssistantText(text: string): React.ReactNode[] {
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

function smartLocalResponse(userMessage: string, ctx: DashboardContextType): string {
  const msg = userMessage.toLowerCase().trim();
  
  // Greetings
  if (/^(h+i+|hey+|hello+|hiya|howdy|greetings|good\s+(morning|afternoon|evening)|what'?s\s*up|sup|yo)[\s!?.,]*$/i.test(msg)) {
    return "Hello! How can I help you today?";
  }
  
  // Introductions
  const introMatch = msg.match(/^(?:i'm|i am|my name is)\s+([a-z]+)[\s!?.,]*$/i);
  if (introMatch) {
    const name = introMatch[1];
    const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
    return `Nice to meet you, ${capitalized}! I'm BizMind AI. How can I help you with your pipeline today?`;
  }
  
  // At-risk deals
  if (msg.includes("risk") || msg.includes("at risk")) {
    const atRisk = ctx.pipeline.filter((d) => d.health === 'At-Risk');
    if (atRisk.length === 0) {
      return "Good news! There are currently no deals marked as at-risk in your pipeline.";
    }
    
    let res = `You have **${atRisk.length}** deals currently at risk. Here are the details:\n`;
    atRisk.forEach((d) => {
      res += `- **${d.deal} (${d.company})**: ${d.value} in stage ${d.stage}. **Recommendation**: ${d.recommendation}\n`;
    });
    return res;
  }
  
  // Summary
  if (msg.includes("summary") || msg.includes("overview")) {
    return `Here is a summary of your current pipeline:\n- **Total Pipeline Value**: ${ctx.totalPipelineValue}\n- **Deals at Risk**: ${ctx.dealsAtRisk}\n- **Forecast Accuracy**: ${ctx.forecastAccuracy}\n- **Average Deal Velocity**: ${ctx.avgDealVelocity}\n\nLet me know if you want to dive deeper into any of these metrics.`;
  }

  // Top rep performance
  if (msg.includes("top rep") || msg.includes("performance") || msg.includes("rep")) {
    return "Based on recent data, Sarah Jenkins is your top performing rep this quarter with $1.2M in closed-won deals, followed by Marcus Johnson with $950K. They are both converting at an above-average rate of 34%.";
  }
  
  // Forecast
  if (msg.includes("forecast") || msg.includes("q3") || msg.includes("q4")) {
    return `Your current forecast accuracy is **${ctx.forecastAccuracy}**. You have a total pipeline value of **${ctx.totalPipelineValue}**. With an average deal velocity of ${ctx.avgDealVelocity}, you are on track to meet your baseline targets, though closing the ${ctx.dealsAtRisk} at-risk deals would provide a comfortable buffer.`;
  }
  
  // Pipeline details catch-all
  if (/pipeline|data|deals?|show|give|tell|all|list|overview|what('?s| is)/i.test(msg)) {
    const PIPELINE_DEALS = ctx.pipeline;
    const AT_RISK_DEALS = ctx.pipeline.filter(d => d.health === 'At-Risk');
    const WATCH_DEALS = ctx.pipeline.filter(d => d.health === 'Watch');
    const HEALTHY_DEALS = ctx.pipeline.filter(d => d.health === 'Healthy');
    
    return `Here's your current pipeline overview:\n\n- Total Value: ${ctx.totalPipelineValue} across ${PIPELINE_DEALS.length} deals\n- At-Risk: ${AT_RISK_DEALS.length} deals\n- Watch: ${WATCH_DEALS.length} deals\n- Healthy: ${HEALTHY_DEALS.length} deals\n\nTop at-risk deals:\n${AT_RISK_DEALS.slice(0, 3).map(d => `- **${d.deal}** (${d.company}): ${d.recommendation}`).join('\n')}\n\nAsk me about specific deals, forecasts, or rep performance for more detail.`;
  }
  
  // Default fallback
  return "I can answer questions like:\n- Which deals are at risk?\n- What is the pipeline value?\n- Show forecast Q3\n- Top rep performance\n- Summarize the pipeline\n- Tell me about Acme Corp\n\nWhat would you like to know?";
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

interface Message {
  role: "user" | "assistant";
  text: string;
}

export default function BizMindChatbot() {
  const { deals, kpis, dealsAtRisk } = useAppContext();

  const dashboardContext = useMemo<DashboardContextType>(() => ({
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
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text:
        "Hi, I'm BizMind AI — your pipeline copilot. Ask me about deal risk, forecasts, rep performance, or anything else in your dashboard.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (isOpen && !isLoading && !isStreaming && inputRef.current) {
      // Use a tiny timeout to ensure React has finished removing the 'disabled' attribute before focusing
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen, isLoading, isStreaming]);

  const callGemini = useCallback(
    async (history: Message[], userMessage: string): Promise<string> => {
      const apiKey = getApiKey();
      if (!apiKey || apiKey === 'your_key_here') {
        throw new Error("No API key available");
      }

      const contextBlock = buildContextBlock(dashboardContext);

      const contents = [
        ...history.slice(1).map((m) => ({
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
        throw err;
      }
    },
    [dashboardContext]
  );



  const sendMessage = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride ?? input).trim();
      if (!text || isLoading || isStreaming) return;

      const newUserMessage: Message = { role: "user", text };
      const updatedHistory = [...messages, newUserMessage];

      setMessages(updatedHistory);
      setInput("");
      setIsLoading(true);

      try {
        const reply = await callGemini(messages, text);
        setIsLoading(false);
        setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
      } catch (err) {
        const localReply = smartLocalResponse(text, dashboardContext);
        
        // Determine delay based on response type
        const isSimple = localReply.startsWith("Hello!") || localReply.startsWith("Nice to meet you") || localReply.startsWith("I can help with");
        const delayTime = isSimple ? 2000 : 2000 + Math.floor(Math.random() * 1000);
        
        // Think for calculated duration
        await new Promise(r => setTimeout(r, delayTime));
        
        setIsLoading(false);
        setIsStreaming(true);
        
        setMessages((prev) => [...prev, { role: "assistant", text: "" }]);
        
        // Reply slowly (simulate streaming)
        for (let i = 1; i <= localReply.length; i += 2) {
          await new Promise(r => setTimeout(r, 15));
          setMessages((prev) => {
            const newList = [...prev];
            newList[newList.length - 1] = { ...newList[newList.length - 1], text: localReply.slice(0, i) };
            return newList;
          });
        }
        
        setMessages((prev) => {
          const newList = [...prev];
          newList[newList.length - 1] = { ...newList[newList.length - 1], text: localReply };
          return newList;
        });
        
        setIsStreaming(false);
      }
    },
    [input, isLoading, isStreaming, messages, callGemini, dashboardContext]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open BizMind AI chat"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-900/40 transition-transform hover:scale-105 hover:bg-blue-500 active:scale-95"
        >
          <ChatIcon />
        </button>
      )}

      {isOpen && (
        <div className="flex h-[600px] w-[380px] max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-[#0b1220] shadow-2xl shadow-black/50">
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
          </div>

          <div className="flex flex-wrap gap-2 border-t border-slate-700/60 px-4 py-3">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={isLoading || isStreaming}
                className="rounded-full border border-slate-700 bg-[#131d33] px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-blue-500 hover:text-white disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-700/60 px-3 py-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your pipeline..."
              disabled={isLoading || isStreaming}
              className="flex-1 rounded-lg border border-slate-700 bg-[#0d1526] px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-blue-500 disabled:opacity-60"
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || isStreaming || !input.trim()}
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
