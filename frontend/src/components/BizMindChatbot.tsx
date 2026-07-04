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

const SYSTEM_PROMPT = `You are "BizMind AI", a friendly assistant built into an enterprise sales pipeline dashboard. You have two modes:

MODE 1 — DAILY CONVERSATION:
For casual messages, respond naturally and briefly like a helpful colleague:
- Greetings (hi, hello, hey, hii, good morning etc.) → greet back warmly
- "how are you" → short friendly response
- "i'm [name]" or "my name is [name]" → "Nice to meet you, [name]!"
- "who are you" → explain you are BizMind AI, an AI-powered pipeline copilot
- "what is this" or "what is BizMind" → explain the app briefly
- "thank you" / "thanks" → "You're welcome!"
- "bye" / "goodbye" → "Goodbye! Good luck with your pipeline!"
- General small talk → respond briefly and naturally

MODE 2 — PIPELINE & BUSINESS QUESTIONS:
For anything related to the dashboard, answer using ONLY the pipeline data provided:
- Deal risk, at-risk deals, stale deals
- Pipeline value, total deals, deal breakdown
- Forecasts, Q3 numbers, revenue projections  
- Rep performance, who is performing best
- Specific company or deal questions (Acme Corp, Wayne Ent, Cyberdyne etc.)
- Recommendations and next actions
- Agent status (PipelineAnalystAgent, InsightGeneratorAgent etc.)
- Reports, alerts, dashboard features

STRICT RULES:
- ONLY answer questions about the pipeline data OR casual daily conversation listed above
- If someone asks something completely unrelated to the website or daily conversation (e.g. "what is the capital of France", "solve this math", "write me a poem") respond with: "I'm focused on your sales pipeline! I can help with deal risk, forecasts, rep performance, and pipeline insights. What would you like to know?"
- NEVER mention API keys, mock mode, Gemini, or any technical details
- NEVER say you are a Google or Anthropic AI model
- Keep all answers short, clear, and actionable
- Use bullet points when listing multiple items
- For business answers, always end with one clear recommended next action
- Handle broken or poor English — understand the intent and answer accordingly
- If the user's question is unclear but seems pipeline-related, give the most relevant pipeline answer`;

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
  const parseValue = (valStr: string) => parseInt(valStr.replace(/[^0-9]/g, ''), 10) || 0;
  
  const PIPELINE_DEALS = ctx.pipeline.map((d, i) => {
    const reps = ["Marcus Reid", "Sarah Jenkins", "Priya Patel"];
    return {
      name: d.deal,
      company: d.company,
      stage: d.stage,
      value: parseValue(d.value),
      days: d.days,
      health: d.health,
      recommendation: d.recommendation,
      rep: reps[i % reps.length]
    };
  });
  
  const AT_RISK_DEALS = PIPELINE_DEALS.filter(d => d.health === 'At-Risk');
  const WATCH_DEALS = PIPELINE_DEALS.filter(d => d.health === 'Watch');
  const HEALTHY_DEALS = PIPELINE_DEALS.filter(d => d.health === 'Healthy');
  const STALE_DEALS = PIPELINE_DEALS.filter(d => d.days >= 14);
  const TOTAL_PIPELINE = PIPELINE_DEALS.reduce((s, d) => s + d.value, 0);

  return `
ABOUT THIS APP:
- Name: BizMind AI
- Purpose: Enterprise autonomous revenue operations platform
- AI Agents: PipelineAnalystAgent (pipeline health), InsightGeneratorAgent (business insights), AlertManagerAgent (threshold monitoring), ReportBuilderAgent (report generation)
- Features: Live pipeline dashboard, active alerts with human-in-the-loop approval, executive reports, agent builder, real-time deal monitoring

CURRENT PIPELINE DATA:
- Total Pipeline Value: $${(TOTAL_PIPELINE/1000000).toFixed(1)}M
- Total Active Deals: ${PIPELINE_DEALS.length}
- At-Risk Deals: ${AT_RISK_DEALS.length} — ${AT_RISK_DEALS.map(d=>d.name+' ('+d.company+')').join(', ')}
- Watch Deals: ${WATCH_DEALS.length} — ${WATCH_DEALS.map(d=>d.name+' ('+d.company+')').join(', ')}
- Healthy Deals: ${HEALTHY_DEALS.length}
- Stale Deals (14+ days no movement): ${STALE_DEALS.length}
- Forecast Accuracy: ${ctx.forecastAccuracy}
- Avg Deal Velocity: ${ctx.avgDealVelocity}

FULL DEAL TABLE:
${PIPELINE_DEALS.map(d=>
  d.name+' | '+d.company+' | Stage: '+d.stage+' | Value: $'+(d.value/1000).toFixed(0)+'K | Days: '+d.days+' | Health: '+d.health+' | Owner: '+d.rep+' | Action: '+d.recommendation
).join('\n')}

REP PERFORMANCE:
${Object.entries(PIPELINE_DEALS.reduce((acc:any,d)=>{acc[d.rep]=(acc[d.rep]||0)+d.value;return acc},{})).sort((a:any,b:any)=>b[1]-a[1]).map(([rep,val]:any)=>rep+': $'+(val/1000).toFixed(0)+'K').join('\n')}
`;
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

function smartLocalResponse(userMessage: string, ctx: DashboardContextType): string | null {
  const q = userMessage.toLowerCase().trim().replace(/[^\w\s]/g, ' ');
  const PIPELINE_DEALS = ctx.pipeline;
  const AT_RISK_DEALS = PIPELINE_DEALS.filter(d => d.health === 'At-Risk');
  const WATCH_DEALS = PIPELINE_DEALS.filter(d => d.health === 'Watch');
  const HEALTHY_DEALS = PIPELINE_DEALS.filter(d => d.health === 'Healthy');
  const STALE_DEALS = PIPELINE_DEALS.filter(d => d.days >= 14);

  const parseValue = (valStr: string) => parseInt(valStr.replace(/[^0-9]/g, ''), 10) || 0;

  // Greetings
  if (/hello|hi|hey|howdy|greetings|yo|namaste|helo/i.test(q)) {
    return "Hello! How can I help you today?";
  }

  // Introductions
  const introMatch = q.match(/^(i m|im|i am|my name is)\s+([a-z0-9_\s]+)/i);
  if (introMatch) {
    const rawName = introMatch[2].trim();
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    return `Nice to meet you, ${name}! I'm BizMind AI. How can I help you with your pipeline today?`;
  }

  // Small talk
  if (/how are|howre|you ok/i.test(q)) {
    return "Doing great, thanks! Ready to help with your pipeline. What would you like to know?";
  }

  // What can you do
  if (/what can|help me|capabilities|features/i.test(q)) {
    return "I can help you with:\n- Which deals are at risk\n- Full pipeline data and value\n- Q3 forecast and revenue projections\n- Rep performance breakdown\n- Stale and inactive deals\n- Specific company deal details\n- Executive pipeline summary\n- Next recommended actions\n\nJust ask naturally!";
  }

  // Pipeline data / show all / give me data
  if (/pipeline|data|overview|summary|all|full/i.test(q)) {
    const atRiskTotal = AT_RISK_DEALS.reduce((s,d)=>s+parseValue(d.value),0);
    return `**Pipeline Overview**\n\n- Total Value: ${ctx.totalPipelineValue} across ${PIPELINE_DEALS.length} deals\n- At-Risk: ${AT_RISK_DEALS.length} deals ($${(atRiskTotal/1000).toFixed(0)}K at risk)\n- Watch: ${WATCH_DEALS.length} deals need attention\n- Healthy: ${HEALTHY_DEALS.length} deals on track\n- Stale (14+ days): ${STALE_DEALS.length} deals\n\n**At-Risk Deals:**\n${AT_RISK_DEALS.map(d=>`- ${d.deal} (${d.company}): ${d.recommendation}`).join('\n')}\n\n**Watch Deals:**\n${WATCH_DEALS.map(d=>`- ${d.deal} (${d.company}): ${d.recommendation}`).join('\n')}`;
  }

  // At-risk
  if (/risk|danger|stall|stuck|problem|bad|issue|concern/i.test(q)) {
    const totalAtRisk = AT_RISK_DEALS.reduce((s,d)=>s+parseValue(d.value),0);
    return `You have ${AT_RISK_DEALS.length} at-risk deals totalling $${(totalAtRisk/1000).toFixed(0)}K:\n\n${AT_RISK_DEALS.map(d=>`- **${d.deal}** (${d.company}) — ${d.stage}, ${d.value}, ${d.days} days\n  → ${d.recommendation}`).join('\n\n')}\n\nHighest priority: escalate Acme Corp to VP Sales immediately.`;
  }

  // Forecast / revenue / Q3
  if (/forecast|q3|quarter|revenue|predict|target|number/i.test(q)) {
    const committed = PIPELINE_DEALS.filter(d=>["Negotiation","Closed"].includes(d.stage));
    const committedTotal = committed.reduce((s,d)=>s+parseValue(d.value),0);
    return `**Q3 Forecast**\n\n- Forecast Accuracy: ${ctx.forecastAccuracy}\n- Committed Pipeline: $${(committedTotal/1000000).toFixed(1)}M\n- Total Pipeline: ${ctx.totalPipelineValue}\n- At-Risk: ${AT_RISK_DEALS.length} deals may slip\n\nRecommendation: Address the ${AT_RISK_DEALS.length} at-risk deals to protect Q3 numbers.`;
  }

  // Rep performance
  if (/rep|perform|person|who|team|sarah|marcus|priya|james|best|top|leader/i.test(q)) {
    return `**Rep Performance by Pipeline Value:**\n\n1. Sarah Jenkins: $1,200K\n2. Marcus Johnson: $950K\n3. Priya Patel: $820K\n\nTop performer: **Sarah Jenkins** at $1,200K`;
  }

  // Stale deals
  if (/stale|old|inactive|movement|activity|overdue|long/i.test(q)) {
    return `${STALE_DEALS.length} deals stale for 14+ days:\n\n${STALE_DEALS.map(d=>`- **${d.deal}** (${d.company}) — ${d.days} days in ${d.stage}\n  → ${d.recommendation}`).join('\n\n')}`;
  }

  // Recommendations
  if (/recommend|next|action|should|priority|urgent|do|focus/i.test(q)) {
    return `**Top 3 Recommended Actions:**\n\n1. Escalate **Acme Corp** (Q3 Enterprise Expansion) to VP Sales — 18 days stalled\n2. Re-engage **Cyberdyne** (Analytics Expansion) executive sponsor — at-risk\n3. Offer discount to **Wayne Ent.** (API Integration) — 21 days in Negotiation`;
  }

  // Specific company lookup
  const matchedDeal = PIPELINE_DEALS.find(d => {
    const dealWords = d.deal.toLowerCase().replace(/[^\w\s]/g, ' ').split(" ");
    return q.includes(d.company.toLowerCase().replace(/[^\w\s]/g, ' ')) || 
           (dealWords[0] && q.includes(dealWords[0])) || 
           (dealWords[1] && q.includes(dealWords[1]));
  });
  if (matchedDeal) {
    return `**${matchedDeal.deal}** (${matchedDeal.company})\n- Stage: ${matchedDeal.stage}\n- Value: ${matchedDeal.value}\n- Days in stage: ${matchedDeal.days}\n- Health: ${matchedDeal.health}\n\nRecommendation: ${matchedDeal.recommendation}`;
  }

  // Watch deals
  if (/watch|amber|caution|monitor|careful/i.test(q)) {
    return `${WATCH_DEALS.length} deals need watching:\n\n${WATCH_DEALS.map(d=>`- **${d.deal}** (${d.company}): ${d.recommendation}`).join('\n')}`;
  }

  // Healthy deals
  if (/health|good|green|fine|ok|strong/i.test(q)) {
    return `${HEALTHY_DEALS.length} healthy deals on track:\n\n${HEALTHY_DEALS.map(d=>`- **${d.deal}** (${d.company}) — ${d.stage}, ${d.value}`).join('\n')}`;
  }

  // No match
  return null;
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
          parts: [{ text: `${SYSTEM_PROMPT}\n\n${contextBlock}` }],
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
      if (!text || isLoading) return;

      const newUserMessage: Message = { role: "user", text };
      const updatedHistory = [...messages, newUserMessage];

      setMessages(updatedHistory);
      setInput("");
      setIsLoading(true);

      let reply = "";

      try {
        reply = await callGemini(messages, text);
      } catch (err) {
        console.warn("Gemini unavailable, using local engine:", err);
        reply = smartLocalResponse(text, dashboardContext) || "I didn't quite understand that. Try asking about: deals at risk, pipeline value, Q3 forecast, rep performance, or a specific company name like 'Acme Corp'.";
      }

      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
      setIsLoading(false);
    },
    [input, isLoading, messages, callGemini, dashboardContext]
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
