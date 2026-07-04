import React, { useState, useRef, useEffect, useCallback } from "react";

// API CONFIG
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_ENDPOINT = (k: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${k}`;

function getApiKey(): string | null {
  try {
    const k = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    if (k && k !== "your_key_here" && k.length > 10) return k;
  } catch {}
  return null;
}

// PIPELINE DATA
const DEALS = [
  { id:"1", name:"Q3 Enterprise Expansion", company:"Acme Corp",       stage:"Negotiation",   value:850000,  days:18, health:"at-risk", rec:"Escalate to VP Sales",            rep:"Sarah Chen" },
  { id:"2", name:"Global Rollout Phase 1",  company:"Globex Inc",      stage:"Proposal",      value:1200000, days:4,  health:"healthy",  rec:"Send follow-up deck",             rep:"Marcus Reid" },
  { id:"3", name:"Data Center Upgrade",     company:"Initech",         stage:"Demo",          value:450000,  days:12, health:"watch",    rec:"Schedule technical review",       rep:"Priya Nair" },
  { id:"4", name:"Security Suite Renewal",  company:"Umbrella Corp",   stage:"Qualification", value:180000,  days:2,  health:"healthy",  rec:"Verify champion",                 rep:"Sarah Chen" },
  { id:"5", name:"Cloud Migration",         company:"Stark Ind.",      stage:"Closed",        value:2100000, days:1,  health:"healthy",  rec:"Initiate onboarding",             rep:"James Wu" },
  { id:"6", name:"API Integration",         company:"Wayne Ent.",      stage:"Negotiation",   value:320000,  days:21, health:"at-risk",  rec:"Offer discount on term",          rep:"Marcus Reid" },
  { id:"7", name:"Platform Licensing",      company:"Massive Dynamic", stage:"Proposal",      value:950000,  days:9,  health:"watch",    rec:"Review pricing with Deal Desk",   rep:"Priya Nair" },
  { id:"8", name:"Managed Services",        company:"Soylent Corp",    stage:"Demo",          value:275000,  days:5,  health:"healthy",  rec:"Prepare custom demo",             rep:"Sarah Chen" },
  { id:"9", name:"Analytics Expansion",     company:"Cyberdyne",       stage:"Qualification", value:410000,  days:14, health:"at-risk",  rec:"Re-engage executive sponsor",     rep:"James Wu" },
  { id:"10",name:"Infrastructure Overhaul", company:"Tyrell Corp",     stage:"Negotiation",   value:1500000, days:7,  health:"healthy",  rec:"Send contract draft",             rep:"Marcus Reid" },
];

const TOTAL    = DEALS.reduce((s,d)=>s+d.value,0);
const AT_RISK  = DEALS.filter(d=>d.health==="at-risk");
const WATCH    = DEALS.filter(d=>d.health==="watch");
const HEALTHY  = DEALS.filter(d=>d.health==="healthy");
const STALE    = DEALS.filter(d=>d.days>14);
const K = (n:number) => `$${(n/1000).toFixed(0)}K`;
const M = (n:number) => `$${(n/1000000).toFixed(1)}M`;

// LOCAL RESPONSE ENGINE
function localReply(input: string): string {
  // normalize: lowercase, remove punctuation, trim
  const q = input.toLowerCase().replace(/[^\w\s]/g," ").trim();
  const words = q.split(/\s+/);
  const has = (...terms: string[]) => terms.some(t => q.includes(t));

  // 1. PURE GREETING — only if message is 1-2 words and is a greeting word
  const greetWords = ["hi","hii","hiii","hey","hello","helo","heya","hiya","yo","sup","howdy","namaste","greetings"];
  if (words.length <= 3 && words.some(w => greetWords.includes(w))) {
    return "Hello! How can I help you today? 👋";
  }

  // 2. PERSONAL INTRO
  if (has("i am","i'm","my name","call me","myself")) {
    const m = q.match(/(?:i am|i'm|my name is|call me|myself)\s+(\w+)/);
    const name = m ? m[1].charAt(0).toUpperCase()+m[1].slice(1) : "there";
    return `Nice to meet you, ${name}! 😊 I'm BizMind AI — your pipeline copilot. How can I help you today?`;
  }

  // 3. WHO ARE YOU / WHAT ARE YOU
  if (has("who are you","what are you","who r you","who is this","are you ai","are you bot","about you","your name","introduce")) {
    return "I'm **BizMind AI** 🤖 — an autonomous revenue operations assistant built into this enterprise sales pipeline platform.\n\nI'm powered by a swarm of AI agents that monitor deals, flag risks, generate forecasts, and recommend actions in real time. I can also answer any question about your pipeline or this platform!\n\nWhat would you like to know?";
  }

  // 4. WHAT IS THIS APP
  if (has("what is this","what is bizmind","about this","about bizmind","what does this","what this app","explain this","what does bizmind","this platform","this website","this app","this tool","this dashboard")) {
    return "**BizMind AI** is an enterprise revenue operations platform 🏢\n\nIt uses a swarm of specialized AI agents:\n- 🟢 **PipelineAnalystAgent** — monitors deal health\n- 💡 **InsightGeneratorAgent** — generates business insights\n- 🔔 **AlertManagerAgent** — monitors risk thresholds\n- 📊 **ReportBuilderAgent** — assembles executive reports\n\nKey features: Live pipeline dashboard, human-in-the-loop alerts, executive reports, and a custom agent builder.\n\nTotal pipeline value currently: **${M(TOTAL)}** across ${DEALS.length} active deals.";
  }

  // 5. HOW ARE YOU
  if (has("how are you","how r you","how you doing","you ok","you good","hows it")) {
    return "I'm doing great, thanks for asking! 😊 Ready to help with your pipeline. What would you like to know?";
  }

  // 6. THANK YOU
  if (has("thank","thanks","thx","ty ","tysm","appreciate")) {
    return "You're welcome! 😊 Let me know if you need anything else.";
  }

  // 7. BYE
  if (words.length <= 3 && has("bye","goodbye","see you","cya","take care","later","farewell")) {
    return "Goodbye! Good luck with your pipeline! 👋 Come back anytime.";
  }

  // 8. AT-RISK DEALS
  if (has("at risk","at-risk","risk","risky","danger","bad deal","problem deal","issue","concern","urgent","critical","which deal")) {
    return `⚠️ You have **${AT_RISK.length} at-risk deals** totalling ${K(AT_RISK.reduce((s,d)=>s+d.value,0))}:\n\n${AT_RISK.map(d=>`🔴 **${d.name}** (${d.company})\n   Stage: ${d.stage} | Value: ${K(d.value)} | ${d.days} days\n   → ${d.rec}`).join("\n\n")}\n\n**Priority action:** Escalate Acme Corp to VP Sales immediately.`;
  }

  // 9. STALE DEALS
  if (has("stale","inactive","no movement","no activity","no update","overdue","stuck","not moving","14 days","old deal")) {
    return `📌 **${STALE.length} stale deals** (14+ days without movement):\n\n${STALE.map(d=>`- **${d.name}** (${d.company}) — ${d.days} days in ${d.stage}\n  → ${d.rec}`).join("\n\n")}`;
  }

  // 10. REP PERFORMANCE
  if (has("rep performance","top rep","best rep","rep breakdown","salesperson","sales team","who is best","performing","sarah","marcus","priya","james","team performance")) {
    const repMap: Record<string,number> = {};
    DEALS.forEach(d=>{ repMap[d.rep]=(repMap[d.rep]||0)+d.value; });
    const sorted = Object.entries(repMap).sort((a,b)=>b[1]-a[1]);
    return `📊 **Rep Performance by Pipeline Value:**\n\n${sorted.map(([rep,val],i)=>`${i+1}. **${rep}**: ${K(val)}`).join("\n")}\n\n🏆 Top performer: **${sorted[0][0]}** at ${K(sorted[0][1])}`;
  }

  // 11. FORECAST / Q3 / REVENUE
  if (has("forecast","q3","quarter","revenue","projection","predict","target","number","how much","financial")) {
    const committed = DEALS.filter(d=>["Negotiation","Closed"].includes(d.stage));
    return `📈 **Q3 Revenue Forecast:**\n\n- Forecast Accuracy: **100%**\n- Committed Pipeline: **${M(committed.reduce((s,d)=>s+d.value,0))}**\n- Total Pipeline: **${M(TOTAL)}**\n- At-Risk: **${AT_RISK.length} deals** may slip\n- Avg Deal Velocity: **9 days**\n\n→ **Action:** Address ${AT_RISK.length} at-risk deals to protect Q3 numbers.`;
  }

  // 12. RECOMMENDATIONS / NEXT ACTIONS
  if (has("recommend","next step","what should","action","priority","what do i do","what to do","focus","urgent","important","suggest","advice","help me","what now")) {
    return `💡 **Top 3 Recommended Actions Right Now:**\n\n1. 🔴 Escalate **Acme Corp** (Q3 Enterprise Expansion) to VP Sales — 18 days stalled in Negotiation\n2. 🔴 Re-engage **Cyberdyne** (Analytics Expansion) executive sponsor — at-risk for 14 days\n3. 🔴 Offer discount on term to **Wayne Ent.** (API Integration) — 21 days in Negotiation at-risk`;
  }

  // 13. SPECIFIC COMPANY LOOKUP
  const found = DEALS.find(d=>
    q.includes(d.company.toLowerCase()) ||
    q.includes(d.name.toLowerCase().split(" ")[0]) ||
    q.includes(d.name.toLowerCase().split(" ")[1]||"___")
  );
  if (found) {
    const icon = found.health==="at-risk"?"🔴":found.health==="watch"?"🟡":"🟢";
    return `${icon} **${found.name}** — ${found.company}\n\n- Stage: ${found.stage}\n- Value: ${K(found.value)}\n- Days in stage: ${found.days}\n- Health: **${found.health}**\n- Owner: ${found.rep}\n\n→ **Recommendation:** ${found.rec}`;
  }

  // 14. WATCH DEALS
  if (has("watch","amber","caution","monitor","careful","attention","warning")) {
    return `🟡 **${WATCH.length} deals need watching:**\n\n${WATCH.map(d=>`- **${d.name}** (${d.company}): ${d.rec}`).join("\n")}`;
  }

  // 15. HEALTHY DEALS
  if (has("healthy","green","good deal","on track","fine","strong","healthy deal")) {
    return `🟢 **${HEALTHY.length} healthy deals on track:**\n\n${HEALTHY.map(d=>`- **${d.name}** (${d.company}) — ${d.stage}, ${K(d.value)}`).join("\n")}`;
  }

  // 16. AGENTS
  if (has("agent","pipeline analyst","insight generator","alert manager","report builder","swarm","bot","ai agent")) {
    return `🤖 **Active Agent Swarm:**\n\n1. **PipelineAnalystAgent** 🟢 Active\n   Tools: get_pipeline_summary(), flag_stale_deals(), calculate_forecast()\n\n2. **InsightGeneratorAgent** 💤 Idle\n   Tools: generate_executive_summary(), identify_trends(), suggest_actions()\n\n3. **AlertManagerAgent** 🟡 Standby\n   Tools: check_deal_health(), send_alert(), set_threshold()\n\n4. **ReportBuilderAgent** 💤 Idle\n   Tools: build_weekly_report(), export_to_pdf(), schedule_report()`;
  }

  // 17. GENERAL PIPELINE / DATA / OVERVIEW (broad catch-all — LAST)
  if (has("pipeline","deal","data","show","give","tell","list","all","overview","full","complete","summary","summar","dashboard","what is","what are","how many")) {
    const atRiskTotal = AT_RISK.reduce((s,d)=>s+d.value,0);
    return `📊 **Pipeline Overview:**\n\n- Total Value: **${M(TOTAL)}** across ${DEALS.length} deals\n- 🔴 At-Risk: **${AT_RISK.length} deals** (${K(atRiskTotal)})\n- 🟡 Watch: **${WATCH.length} deals** need attention\n- 🟢 Healthy: **${HEALTHY.length} deals** on track\n- 📌 Stale: **${STALE.length} deals** (14+ days)\n- Forecast Accuracy: **100%**\n\n**At-Risk Deals:**\n${AT_RISK.map(d=>`🔴 ${d.name} (${d.company}): ${d.rec}`).join("\n")}\n\n**Watch Deals:**\n${WATCH.map(d=>`🟡 ${d.name} (${d.company}): ${d.rec}`).join("\n")}`;
  }

  // 18. FINAL FALLBACK
  return `I'm your BizMind AI pipeline assistant! 🤖 I can help with:\n\n- 📊 "Which deals are at risk?"\n- 📈 "Forecast Q3"\n- 👥 "Top rep performance"\n- 📋 "Generate summary"\n- 🏢 "Tell me about Acme Corp"\n- 🤖 "Show all agents"\n- ⚡ "What should I do next?"\n\nWhat would you like to know?`;
}

// GEMINI API CALL
async function callGemini(history: {role:string;text:string}[], userMsg: string): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error("no_key");

  const ctx = `PIPELINE: Total=${M(TOTAL)}, AtRisk=${AT_RISK.length}, Watch=${WATCH.length}, Healthy=${HEALTHY.length}, Stale=${STALE.length}. Deals: ${DEALS.map(d=>`${d.name}(${d.company},${d.stage},${K(d.value)},${d.days}d,${d.health})`).join("; ")}`;

  const system = `You are BizMind AI — a friendly, knowledgeable assistant for an enterprise sales pipeline platform. Answer ANY question helpfully. For pipeline questions use the data provided. For greetings respond warmly. For "who are you" explain you are BizMind AI. Never mention API keys or technical details. Keep answers concise with emojis where helpful.\n\n${ctx}`;

  const contents = [
    ...history.slice(1).map(m=>({ role: m.role==="assistant"?"model":"user", parts:[{text:m.text}] })),
    { role:"user", parts:[{text:userMsg}] }
  ];

  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(), 12000);

  try {
    const res = await fetch(GEMINI_ENDPOINT(key), {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        system_instruction:{parts:[{text:system}]},
        contents,
        generationConfig:{temperature:0.7, maxOutputTokens:500}
      }),
      signal: ctrl.signal
    });
    clearTimeout(t);
    if (!res.ok) { console.error("Gemini status:", res.status); throw new Error("api_error"); }
    const data = await res.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map((p:any)=>p.text).join("")?.trim();
    if (!reply) throw new Error("empty");
    return reply;
  } catch(e) {
    clearTimeout(t);
    console.error("Gemini failed:", e);
    throw e;
  }
}

// TEXT FORMATTER
function fmt(text: string) {
  return text.split("\n").map((line,i)=>{
    const t = line.trim();
    const isBullet = t.startsWith("- ") || t.startsWith("• ");
    const content = isBullet ? t.replace(/^[-•]\s*/,"") : line;
    const parts = content.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((p,j)=>
      p.startsWith("**")&&p.endsWith("**")
        ? <strong key={j} className="font-semibold text-white">{p.slice(2,-2)}</strong>
        : <React.Fragment key={j}>{p}</React.Fragment>
    );
    if (isBullet) return <li key={i} className="ml-4 list-disc text-slate-200 leading-relaxed">{parts}</li>;
    if (t==="") return <br key={i}/>;
    return <p key={i} className="text-slate-200 leading-relaxed">{parts}</p>;
  });
}

const CHIPS = [
  "Which deals are at risk?","Forecast Q3",
  "Top rep performance","Generate summary",
  "What is BizMind AI?","Show all agents",
  "Stale deals","Recommend actions"
];

interface Msg { role:"user"|"assistant"; text:string; }

export default function BizMindChatbot() {
  const [open,setOpen]       = useState(false);
  const [msgs,setMsgs]       = useState<Msg[]>([{role:"assistant",text:"Hi! I'm BizMind AI — your pipeline copilot. Ask me anything about your deals, forecasts, agents, or just say hello! 👋"}]);
  const [input,setInput]     = useState("");
  const [loading,setLoading] = useState(false);
  const scrollRef            = useRef<HTMLDivElement>(null);
  const inputRef             = useRef<HTMLInputElement>(null);

  useEffect(()=>{ if(scrollRef.current) scrollRef.current.scrollTop=scrollRef.current.scrollHeight; },[msgs,loading]);
  useEffect(()=>{ if(open&&inputRef.current) inputRef.current.focus(); },[open]);

  const send = useCallback(async(override?:string)=>{
    const text=(override??input).trim();
    if(!text||loading) return;
    const userMsg:Msg={role:"user",text};
    const history=[...msgs,userMsg];
    setMsgs(history);
    setInput("");
    setLoading(true);
    let reply="";
    try { reply=await callGemini(msgs,text); }
    catch { reply=localReply(text); }
    setMsgs(p=>[...p,{role:"assistant",text:reply}]);
    setLoading(false);
  },[input,loading,msgs]);

  const onKey=(e:React.KeyboardEvent)=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!open&&(
        <button onClick={()=>setOpen(true)} aria-label="Open chat"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:scale-105 hover:bg-blue-500 active:scale-95 transition-transform">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      )}
      {open&&(
        <div className="flex h-[600px] w-[370px] max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-slate-700/60 bg-[#0b1220] shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-700/60 bg-[#0d1526] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="8" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2"/><circle cx="8.5" cy="14" r="1.5" fill="currentColor"/><circle cx="15.5" cy="14" r="1.5" fill="currentColor"/><path d="M12 8V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="3" r="1" fill="currentColor"/></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Ask BizMind AI</p>
                <p className="flex items-center gap-1 text-[11px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block"/>Online
                </p>
              </div>
            </div>
            <button onClick={()=>setOpen(false)} className="rounded-md p-1 text-slate-400 hover:bg-slate-700/40 hover:text-white transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {msgs.map((m,i)=>(
              <div key={i} className={`flex ${m.role==="user"?"justify-end":"justify-start"}`}>
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${m.role==="user"?"bg-blue-600 text-white":"bg-[#131d33] text-slate-200"}`}>
                  {m.role==="assistant"
                    ?<div className="space-y-1">{fmt(m.text)}</div>
                    :<p className="leading-relaxed">{m.text}</p>
                  }
                </div>
              </div>
            ))}
            {loading&&(
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-xl bg-[#131d33] px-4 py-3">
                  {[0,150,300].map(d=><span key={d} className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{animationDelay:`${d}ms`}}/>)}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-slate-700/60 px-4 py-3">
            {CHIPS.map(q=>(
              <button key={q} onClick={()=>send(q)} disabled={loading}
                className="rounded-full border border-slate-700 bg-[#131d33] px-3 py-1.5 text-xs text-slate-300 hover:border-blue-500 hover:text-white disabled:opacity-50 transition-colors">
                {q}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t border-slate-700/60 px-3 py-3">
            <input ref={inputRef} type="text" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={onKey}
              placeholder="Ask anything about your pipeline..." disabled={loading}
              className="flex-1 rounded-lg border border-slate-700 bg-[#0d1526] px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500 disabled:opacity-60 transition-colors"/>
            <button onClick={()=>send()} disabled={loading||!input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
