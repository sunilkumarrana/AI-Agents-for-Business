import React, { useState, useRef, useEffect, useCallback } from "react";

/**
 * BizMind AI Chatbot
 * -------------------
 * Complete AI Assistant powered by Gemini API with local fallback.
 */

const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_ENDPOINT = (apiKey: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

function getApiKey(): string | null {
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY as string;
  }
  return null;
}

const SYSTEM_PROMPT = `You are BizMind AI Assistant — a powerful, friendly AI assistant embedded in an enterprise sales pipeline platform. You have two roles:

ROLE 1 - GENERAL AI ASSISTANT:
You can answer ANY question on any topic like a knowledgeable assistant. Be helpful, accurate, and conversational. Handle all types of messages including greetings, small talk, general knowledge, and follow-up questions.

ROLE 2 - BIZMIND PLATFORM EXPERT:
You have complete knowledge of the BizMind AI platform including all deals, agents, features, and data provided in the context below. Use this data to give specific, accurate answers about the pipeline.

PERSONALITY:
- Friendly, professional, and concise
- Use the user's name when known
- Add relevant emojis for visual clarity
- Always be helpful — never refuse a reasonable question
- Handle poor/broken English by understanding the intent
- For pipeline questions, always end with a clear recommended action`;

const SUGGESTED_CHIPS_ROW1 = [
  "Which deals are at risk?",
  "Forecast Q3",
  "Top rep performance",
  "Generate summary"
];
const SUGGESTED_CHIPS_ROW2 = [
  "What is BizMind AI?",
  "Show all agents",
  "Stale deals",
  "Recommend actions"
];

// ---------------------------------------------------------------------------
// HARDCODED DATA
// ---------------------------------------------------------------------------

const PIPELINE_DEALS = [
  { name: "Q3 Enterprise Expansion", company: "Acme Corp", stage: "Negotiation", value: 850000, days: 18, health: "At-Risk", rep: "Marcus Reid", recommendation: "Escalate to VP Sales immediately." },
  { name: "Global Rollout Phase 1", company: "Globex Inc", stage: "Proposal", value: 1200000, days: 4, health: "Healthy", rep: "Sarah Jenkins", recommendation: "Send follow-up deck." },
  { name: "Data Center Upgrade", company: "Initech", stage: "Demo", value: 450000, days: 12, health: "Watch", rep: "Priya Patel", recommendation: "Schedule technical review." },
  { name: "Security Suite Renewal", company: "Umbrella Corp", stage: "Qualification", value: 180000, days: 2, health: "Healthy", rep: "Marcus Reid", recommendation: "Verify champion." },
  { name: "Cloud Migration", company: "Stark Ind.", stage: "Closed", value: 2100000, days: 1, health: "Healthy", rep: "Sarah Jenkins", recommendation: "Initiate onboarding." },
  { name: "API Integration", company: "Wayne Ent.", stage: "Negotiation", value: 320000, days: 21, health: "At-Risk", rep: "Priya Patel", recommendation: "Deploy competitor battlecard." },
  { name: "Platform Licensing", company: "Massive Dynamic", stage: "Proposal", value: 950000, days: 9, health: "Watch", rep: "Marcus Reid", recommendation: "Review pricing with Deal Desk." },
  { name: "Managed Services", company: "Soylent Corp", stage: "Demo", value: 275000, days: 5, health: "Healthy", rep: "Sarah Jenkins", recommendation: "Prepare custom demo." },
  { name: "Analytics Expansion", company: "Cyberdyne", stage: "Qualification", value: 410000, days: 14, health: "At-Risk", rep: "Priya Patel", recommendation: "Re-engage executive sponsor." },
  { name: "Infrastructure Overhaul", company: "Tyrell Corp", stage: "Negotiation", value: 1500000, days: 7, health: "Healthy", rep: "Marcus Reid", recommendation: "Send contract draft." }
];

const AT_RISK_DEALS = PIPELINE_DEALS.filter(d => d.health === 'At-Risk');
const WATCH_DEALS = PIPELINE_DEALS.filter(d => d.health === 'Watch');
const HEALTHY_DEALS = PIPELINE_DEALS.filter(d => d.health === 'Healthy');
const STALE_DEALS = PIPELINE_DEALS.filter(d => d.days >= 14);
const TOTAL_PIPELINE = PIPELINE_DEALS.reduce((s, d) => s + d.value, 0);

const buildContextBlock = () => `
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
- Forecast Accuracy: 100%
- Avg Deal Velocity: 9 days

FULL DEAL TABLE:
${PIPELINE_DEALS.map(d=>
  d.name+' | '+d.company+' | Stage: '+d.stage+' | Value: $'+(d.value/1000).toFixed(0)+'K | Days: '+d.days+' | Health: '+d.health+' | Owner: '+d.rep+' | Action: '+d.recommendation
).join('\n')}

REP PERFORMANCE:
${Object.entries(PIPELINE_DEALS.reduce((acc:any,d)=>{acc[d.rep]=(acc[d.rep]||0)+d.value;return acc},{})).sort((a:any,b:any)=>b[1]-a[1]).map(([rep,val]:any)=>rep+': $'+(val/1000).toFixed(0)+'K').join('\n')}
`;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

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

function extractName(text: string): string | null {
  const match = text.match(/^(i m|im|i am|my name is)\s+([a-z0-9_\s]+)/i);
  if (match && match[2]) {
    const raw = match[2].trim();
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }
  return null;
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------

interface Message {
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

export default function BizMindChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState<string>("");
  
  const getTimestamp = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Hi, I'm BizMind AI Assistant! I can answer any questions about your pipeline or general topics. How can I help you today?",
      timestamp: getTimestamp()
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (isOpen && !isLoading && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen, isLoading]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const clearChat = () => {
    setMessages([{
      role: "assistant",
      text: "Hi, I'm BizMind AI Assistant! I can answer any questions about your pipeline or general topics. How can I help you today?",
      timestamp: getTimestamp()
    }]);
  };

  const callGemini = useCallback(async (history: Message[], userMessage: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey || apiKey === 'your_key_here') {
      throw new Error("No API key");
    }

    const contextBlock = buildContextBlock();
    const contents = [
      ...history.slice(1).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text }],
      })),
      { role: "user", parts: [{ text: userMessage }] },
    ];

    const body = {
      system_instruction: {
        parts: [{ text: `${SYSTEM_PROMPT}\n\n[INJECT FULL PIPELINE CONTEXT HERE]\n${contextBlock}` }],
      },
      contents,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1024,
      },
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(GEMINI_ENDPOINT(apiKey), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error("API response error");
      }

      const data = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? null;

      if (!reply) throw new Error("Empty response");
      return reply.trim();
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }, []);

  const smartLocalFallback = useCallback((text: string): string => {
    const q = text.toLowerCase().trim().replace(/[^\w\s]/g, ' ');
    const user = extractName(q);
    if (user) {
      setUserName(user);
      return `Nice to meet you, ${user}! I'm BizMind AI Assistant. How can I help you with your pipeline today?`;
    }

    if (/hello|hi|hey|howdy|greetings|yo|namaste|helo/i.test(q)) {
      return `Hello${userName ? ' ' + userName : ''}! How can I help you today?`;
    }

    if (/what are you|who are you|are you an ai|what is this|what is bizmind/i.test(q)) {
      return "I am BizMind AI Assistant, a powerful AI copilot embedded in your enterprise sales pipeline platform. I can help you analyze deals, generate forecasts, and monitor your team's performance! 🚀";
    }

    if (/how are you|howre|you ok/i.test(q)) {
      return "Doing great, thanks! Ready to help with your pipeline. What would you like to know?";
    }

    if (/thank|thx|appreciate/i.test(q)) {
      return "You're welcome! Let me know if you need anything else.";
    }

    if (/bye|goodbye|see ya|cya/i.test(q)) {
      return "Goodbye! Good luck with your pipeline! 👋";
    }

    if (/you are good|nice|helpful|great|awesome/i.test(q)) {
      return "Thank you! I'm always here to help you close more deals! 📈";
    }

    if (/not working|useless|bad|suck/i.test(q)) {
      return "I'm really sorry about that. I want to be as helpful as possible — please tell me exactly what you're looking for and I'll do my best to assist you!";
    }

    if (/pipeline|data|overview|summary|all|full/i.test(q)) {
      const atRiskTotal = AT_RISK_DEALS.reduce((s,d)=>s+d.value,0);
      return `**Pipeline Overview** 📊\n\n- Total Value: $${(TOTAL_PIPELINE/1000000).toFixed(1)}M across ${PIPELINE_DEALS.length} deals\n- At-Risk: ${AT_RISK_DEALS.length} deals ($${(atRiskTotal/1000).toFixed(0)}K)\n- Watch: ${WATCH_DEALS.length} deals\n- Healthy: ${HEALTHY_DEALS.length} deals\n- Stale: ${STALE_DEALS.length} deals\n\n→ Recommended Action: Review the ${AT_RISK_DEALS.length} at-risk deals to prevent churn.`;
    }

    if (/risk|danger|stall|stuck|problem|bad|issue|concern/i.test(q)) {
      const totalAtRisk = AT_RISK_DEALS.reduce((s,d)=>s+d.value,0);
      return `You have ${AT_RISK_DEALS.length} at-risk deals totalling $${(totalAtRisk/1000).toFixed(0)}K:\n\n${AT_RISK_DEALS.map(d=>`- **${d.name}** (${d.company}) — $${(d.value/1000).toFixed(0)}K, ${d.days} days\n  Recommendation: ${d.recommendation}`).join('\n\n')}\n\n→ Recommended Action: Escalate Acme Corp immediately. ⚠️`;
    }

    if (/forecast|q3|quarter|revenue|predict|target|number/i.test(q)) {
      return `**Q3 Forecast** 📈\n\n- Forecast Accuracy: 100%\n- Avg Velocity: 9 days\n- Total Pipeline: $${(TOTAL_PIPELINE/1000000).toFixed(1)}M\n- At-Risk: ${AT_RISK_DEALS.length} deals may slip\n\n→ Recommended Action: Address the ${AT_RISK_DEALS.length} at-risk deals to protect Q3 numbers.`;
    }

    if (/rep|perform|person|who|team|sarah|marcus|priya|james|best|top|leader/i.test(q)) {
      return `**Rep Performance:**\n\n1. Sarah Jenkins: $3,575K\n2. Marcus Reid: $3,480K\n3. Priya Patel: $1,180K\n\nTop performer: **Sarah Jenkins** 🥇\n\n→ Recommended Action: Reward Sarah for strong Q3 performance.`;
    }

    if (/stale|old|inactive|movement|activity|overdue|long/i.test(q)) {
      return `${STALE_DEALS.length} deals stale for 14+ days:\n\n${STALE_DEALS.map(d=>`- **${d.name}** (${d.company}) — ${d.days} days in ${d.stage}\n  Action: ${d.recommendation}`).join('\n\n')}\n\n→ Recommended Action: Re-engage stale deals or mark as closed/lost.`;
    }

    if (/recommend|next|action|should|priority|urgent|do|focus/i.test(q)) {
      return `**Top 3 Recommended Actions:** ✅\n\n1. Escalate **Acme Corp** to VP Sales — 18 days stalled\n2. Deploy battlecard for **Wayne Ent.** — competitor mentioned\n3. Re-engage **Cyberdyne** executive sponsor\n\n→ Recommended Action: Execute these three items today.`;
    }

    if (/agent/i.test(q)) {
      return `BizMind AI has several active agents:\n- **PipelineAnalystAgent:** monitors health and velocity\n- **InsightGeneratorAgent:** creates business narratives\n- **AlertManagerAgent:** sends threshold alerts\n- **ReportBuilderAgent:** formats executive reports\n\n→ Recommended Action: Check the Agents tab to build a new agent.`;
    }

    const matchedDeal = PIPELINE_DEALS.find(d => {
      const dealWords = d.name.toLowerCase().replace(/[^\w\s]/g, ' ').split(" ");
      return q.includes(d.company.toLowerCase().replace(/[^\w\s]/g, ' ')) || 
             (dealWords[0] && q.includes(dealWords[0]));
    });
    if (matchedDeal) {
      return `**${matchedDeal.name}** (${matchedDeal.company})\n- Stage: ${matchedDeal.stage}\n- Value: $${(matchedDeal.value/1000).toFixed(0)}K\n- Days in stage: ${matchedDeal.days}\n- Health: ${matchedDeal.health}\n- Owner: ${matchedDeal.rep}\n\n→ Recommended Action: ${matchedDeal.recommendation}`;
    }

    return "I'm your BizMind AI assistant! I can answer questions about your pipeline, deals, agents, or general business topics. What would you like to know? 💡";
  }, [userName]);

  const sendMessage = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || isLoading) return;

    const newUserMessage: Message = { role: "user", text, timestamp: getTimestamp() };
    const updatedHistory = [...messages, newUserMessage];

    setMessages(updatedHistory);
    setInput("");
    setIsLoading(true);

    let reply = "";
    try {
      reply = await callGemini(updatedHistory, text);
    } catch (err) {
      reply = smartLocalFallback(text);
    }

    setMessages((prev) => [...prev, { role: "assistant", text: reply, timestamp: getTimestamp() }]);
    setIsLoading(false);
  };

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
                <p className="text-sm font-semibold text-white">BizMind AI Assistant</p>
                <p className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Online
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                title="Clear chat"
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-700/40 hover:text-white"
              >
                <TrashIcon />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-700/40 hover:text-white"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`relative max-w-[85%] rounded-xl px-4 py-2.5 text-sm group ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-sm"
                      : "bg-[#131d33] text-slate-200 rounded-tl-sm"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="space-y-1">{formatAssistantText(msg.text)}</div>
                  ) : (
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  )}
                  {msg.role === "assistant" && (
                    <button 
                      onClick={() => handleCopy(msg.text)}
                      className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                      title="Copy to clipboard"
                    >
                      <CopyIcon />
                    </button>
                  )}
                </div>
                <span className="mt-1 text-[10px] text-slate-500 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-1.5 rounded-xl rounded-tl-sm bg-[#131d33] px-4 py-3">
                    <TypingDot delay="0ms" />
                    <TypingDot delay="150ms" />
                    <TypingDot delay="300ms" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-700/60 bg-[#0b1220] px-4 py-3">
            <div className="flex flex-nowrap overflow-x-auto gap-2 pb-1 scrollbar-none">
              {SUGGESTED_CHIPS_ROW1.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={isLoading}
                  className="whitespace-nowrap rounded-full border border-slate-700 bg-[#131d33] px-3 py-1.5 text-[11px] text-slate-300 transition-colors hover:border-blue-500 hover:text-white disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex flex-nowrap overflow-x-auto gap-2 pb-1 scrollbar-none">
              {SUGGESTED_CHIPS_ROW2.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={isLoading}
                  className="whitespace-nowrap rounded-full border border-slate-700 bg-[#131d33] px-3 py-1.5 text-[11px] text-slate-300 transition-colors hover:border-blue-500 hover:text-white disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-slate-700/60 px-3 py-3 bg-[#0d1526]">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your pipeline..."
              disabled={isLoading}
              className="flex-1 rounded-lg border border-slate-700 bg-[#0b1220] px-3 py-2 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-blue-500 disabled:opacity-60"
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

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function TypingDot({ delay }: { delay: string }) {
  return (
    <span
      className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
      style={{ animationDelay: delay }}
    />
  );
}
