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

// LOCAL RESPONSE ENGINE (KEYWORD MATCHING)
function getResponse(input: string): string {
  const q = input.toLowerCase();
  const wordCount = q.trim().split(/\s+/).length;

  if (q.includes("that's it") || q.includes("thats it") || 
      q.includes("no thanks") || q.includes("nothing else") || 
      q.includes("i'm done") || q.includes("im done") || 
      q.includes("bye") || q.includes("goodbye") || 
      q.includes("that's all") || q.includes("thats all")) {
    return "Thank you so much for using BizMind AI! 🌟 It was a pleasure helping you today. Wishing you a great day and closed deals ahead! 🚀 Come back anytime you need pipeline insights.";
  }

  if (q.includes("cricket") || q.includes("football") || 
      q.includes("movie") || q.includes("recipe") || 
      q.includes("weather") || q.includes("news") || 
      q.includes("sport") || q.includes("game") || 
      q.includes("music") || q.includes("song") || 
      q.includes("film") || q.includes("cook") || 
      q.includes("travel") || q.includes("hotel") || 
      q.includes("flight") || q.includes("politics") || 
      q.includes("capital of") || q.includes("population of") || 
      q.includes("history of") || q.includes("solve") || 
      q.includes("calculate") || q.includes("math") || 
      q.includes("equation") || q.includes("poem") || 
      q.includes("story") || q.includes("joke")) {
    return "That question is not related to BizMind AI 😊 I'm specifically built to help with your sales pipeline, deals, forecasts, agent activity, and revenue operations. Is there anything about your pipeline I can help you with?";
  }

  if (wordCount <= 3 && (
      q.includes("hi") || q.includes("hey") || 
      q.includes("hello") || q.includes("helo") || 
      q.includes("hii") || q.includes("hiii") || 
      q.includes("heya") || q.includes("hiya") || 
      q.includes("howdy") || q.includes("namaste") || 
      q.includes("good morning") || q.includes("good evening") || 
      q.includes("good afternoon"))) {
    return "Hello! 👋 Welcome to BizMind AI — your autonomous revenue intelligence assistant. I can help you with:\n\n📊 Pipeline overview and deal details\n⚠️ At-risk and stale deals\n📈 Q3 forecast and revenue projections\n👥 Rep performance breakdown\n🤖 Agent swarm activity\n💡 Recommended next actions\n\nWhat would you like to know?";
  }

  if (q.includes("i'm ") || q.includes("im ") || 
      q.includes("i am ") || q.includes("my name is") || 
      q.includes("call me")) {
    let name = "there";
    const parts = q.split(/i'm |im |i am |my name is |call me /);
    if (parts[1]) {
      name = parts[1].trim().split(" ")[0];
      name = name.charAt(0).toUpperCase() + name.slice(1);
    }
    return `Nice to meet you, ${name}! 😊 I'm BizMind AI — your pipeline copilot. I'm here to help you monitor deals, track risks, and stay on top of your revenue targets. What would you like to know about your pipeline today?`;
  }

  if (q.includes("who are you") || q.includes("what are you") || 
      q.includes("about you") || q.includes("who r you") || 
      q.includes("introduce yourself") || q.includes("your name") || 
      q.includes("are you ai") || q.includes("are you a bot")) {
    return "I'm **BizMind AI** 🤖 — an autonomous revenue operations assistant built into this enterprise sales pipeline platform.\n\nI'm powered by a swarm of 4 specialized AI agents:\n🟢 PipelineAnalystAgent — monitors deal health\n💡 InsightGeneratorAgent — generates insights\n🔔 AlertManagerAgent — flags risks\n📊 ReportBuilderAgent — builds reports\n\nAsk me anything about your pipeline!";
  }

  if (q.includes("what is this") || q.includes("what is bizmind") || 
      q.includes("about bizmind") || q.includes("about this app") || 
      q.includes("what does this") || q.includes("this platform") || 
      q.includes("this website") || q.includes("this tool") || 
      q.includes("explain bizmind") || q.includes("what this")) {
    return "**BizMind AI** is an enterprise revenue intelligence platform 🏢\n\nIt uses 4 AI agents to monitor your sales pipeline 24/7, flag at-risk deals, generate executive reports, and recommend next actions — all with human approval before anything is executed.\n\n📊 Total pipeline: $8.2M across 10 active deals\n⚠️ Currently tracking 3 at-risk deals\n✅ Forecast accuracy: 100%";
  }

  if (q.includes("how are you") || q.includes("how r you") || 
      q.includes("how are u") || q.includes("you ok") || 
      q.includes("you good") || q.includes("how do you do")) {
    return "I'm doing great, thank you for asking! 😊 Always ready to help with your pipeline. What would you like to know today?";
  }

  if (q.includes("thank you") || q.includes("thanks") || 
      q.includes("thank u") || q.includes("thx") || 
      q.includes("thnks") || q.includes("appreciate")) {
    return "You're very welcome! 😊 Happy to help anytime. Is there anything else about your pipeline I can assist you with?";
  }

  if (q.includes("all details") || q.includes("today pipeline") || 
      q.includes("show details") || q.includes("full pipeline") || 
      q.includes("complete pipeline") || q.includes("all data") || 
      q.includes("show everything") || q.includes("full details") || 
      q.includes("pipeline details") || q.includes("show pipeline") || 
      q.includes("give details") || q.includes("tell me everything") || 
      q.includes("all deals") || q.includes("show all")) {
    return "📊 **Complete Pipeline Overview — Today**\n\n💰 Total Value: **$8.2M** across 10 deals\n⚠️ At-Risk: **3 deals**\n🟡 Watch: **2 deals**\n✅ Healthy: **5 deals**\n📌 Stale (14+ days): **3 deals**\n📈 Forecast Accuracy: **100%**\n⚡ Avg Deal Velocity: **9 days**\n\n**All 10 Deals:**\n🔴 Q3 Enterprise Expansion — Acme Corp | Negotiation | $850K | 18 days | AT-RISK\n🟢 Global Rollout Phase 1 — Globex Inc | Proposal | $1.2M | 4 days | Healthy\n🟡 Data Center Upgrade — Initech | Demo | $450K | 12 days | Watch\n🟢 Security Suite Renewal — Umbrella Corp | Qualification | $180K | 2 days | Healthy\n🟢 Cloud Migration — Stark Ind. | Closed | $2.1M | 1 day | Healthy\n🔴 API Integration — Wayne Ent. | Negotiation | $320K | 21 days | AT-RISK\n🟡 Platform Licensing — Massive Dynamic | Proposal | $950K | 9 days | Watch\n🟢 Managed Services — Soylent Corp | Demo | $275K | 5 days | Healthy\n🔴 Analytics Expansion — Cyberdyne | Qualification | $410K | 14 days | AT-RISK\n🟢 Infrastructure Overhaul — Tyrell Corp | Negotiation | $1.5M | 7 days | Healthy\n\n→ **Top Action:** Escalate Acme Corp to VP Sales immediately.";
  }

  if (q.includes("at risk") || q.includes("at-risk") || 
      q.includes("risk") || q.includes("risky") || 
      q.includes("danger") || q.includes("bad deal") || 
      q.includes("problem deal") || q.includes("which deal") || 
      q.includes("critical") || q.includes("urgent")) {
    return "⚠️ **3 At-Risk Deals** requiring immediate attention:\n\n🔴 **Q3 Enterprise Expansion** — Acme Corp\nNegotiation | $850K | 18 days stalled\n→ Escalate to VP Sales immediately\n\n🔴 **API Integration** — Wayne Ent.\nNegotiation | $320K | 21 days stalled\n→ Offer discount on term\n\n🔴 **Analytics Expansion** — Cyberdyne\nQualification | $410K | 14 days stalled\n→ Re-engage executive sponsor\n\n💰 Total at-risk value: **$1.58M**\n\n→ **Priority:** Start with Acme Corp — highest value and longest stall.";
  }

  if (q.includes("stale") || q.includes("inactive") || 
      q.includes("no movement") || q.includes("no activity") || 
      q.includes("not moving") || q.includes("stuck") || 
      q.includes("old deal") || q.includes("overdue") || 
      q.includes("no update") || q.includes("no reply")) {
    return "📌 **3 Stale Deals** (14+ days without movement):\n\n1. **Q3 Enterprise Expansion** — Acme Corp | 18 days in Negotiation\n   → Escalate to VP Sales\n\n2. **API Integration** — Wayne Ent. | 21 days in Negotiation\n   → Offer discount on term\n\n3. **Analytics Expansion** — Cyberdyne | 14 days in Qualification\n   → Re-engage executive sponsor\n\n→ These 3 deals need outreach today.";
  }

  if (q.includes("forecast") || q.includes("q3") || 
      q.includes("quarter") || q.includes("revenue") || 
      q.includes("projection") || q.includes("predict") || 
      q.includes("target") || q.includes("number") || 
      q.includes("financial")) {
    return "📈 **Q3 Revenue Forecast:**\n\n✅ Forecast Accuracy: **100%**\n💰 Total Pipeline: **$8.2M**\n📊 Committed (Negotiation + Closed): **$4.67M**\n📉 Best Case (all deals close): **$8.2M**\n⚠️ At-Risk: 3 deals ($1.58M may slip)\n\n**6-Month Projection:**\nJan: $600K → Feb: $800K → Mar: $1.1M\nApr: $1.4M → May: $1.8M → Jun: $2.4M\n\n→ **Action:** Protect Q3 by addressing 3 at-risk deals this week.";
  }

  if (q.includes("rep") || q.includes("performance") || 
      q.includes("salesperson") || q.includes("who is best") || 
      q.includes("top performer") || q.includes("best rep") || 
      q.includes("sarah") || q.includes("marcus") || 
      q.includes("priya") || q.includes("james") || 
      q.includes("team") || q.includes("who perform")) {
    return "👥 **Rep Performance by Pipeline Value:**\n\n1. 🏆 **Marcus Reid**: $3.77M (3 deals)\n2. **Sarah Chen**: $1.305M (3 deals)\n3. **James Wu**: $2.51M (2 deals)\n4. **Priya Nair**: $1.4M (2 deals)\n\n🏆 Top performer: **Marcus Reid** — managing Infrastructure Overhaul ($1.5M), API Integration ($320K), and Global Rollout ($1.2M)\n\n→ James Wu has 2 at-risk deals — recommend a check-in call today.";
  }

  if (q.includes("recommend") || q.includes("next step") || 
      q.includes("what should") || q.includes("action") || 
      q.includes("priority") || q.includes("what to do") || 
      q.includes("focus") || q.includes("suggest") || 
      q.includes("advice") || q.includes("what now") || 
      q.includes("help me") || q.includes("what do i")) {
    return "💡 **Top 3 Recommended Actions Right Now:**\n\n1. 🔴 **Escalate Acme Corp** (Q3 Enterprise Expansion) to VP Sales\n   18 days stalled in Negotiation — highest priority\n\n2. 🔴 **Re-engage Cyberdyne** (Analytics Expansion) executive sponsor\n   14 days in Qualification with no movement\n\n3. 🔴 **Offer discount** to Wayne Ent. (API Integration)\n   21 days in Negotiation — longest stall in the pipeline\n\n→ Completing all 3 this week protects $1.58M in at-risk revenue.";
  }

  if (q.includes("summary") || q.includes("generate") || 
      q.includes("report") || q.includes("overview") || 
      q.includes("snapshot") || q.includes("brief") || 
      q.includes("status update") || q.includes("update me")) {
    return "📋 **Executive Pipeline Summary:**\n\n💰 Total Value: **$8.2M** | 10 Active Deals\n🔴 At-Risk: 3 deals ($1.58M)\n🟡 Watch: 2 deals ($1.4M)\n🟢 Healthy: 5 deals ($5.23M)\n📌 Stale: 3 deals (14+ days)\n📈 Forecast Accuracy: 100%\n\n**This Week's Priorities:**\n1. Escalate Acme Corp → VP Sales\n2. Re-engage Cyberdyne sponsor\n3. Offer discount to Wayne Ent.\n\n**Top Deal:** Cloud Migration — Stark Ind. CLOSED at $2.1M ✅\n\n→ Overall pipeline health is moderate. Immediate action on 3 at-risk deals needed.";
  }

  if (q.includes("watch") || q.includes("caution") || 
      q.includes("monitor") || q.includes("amber") || 
      q.includes("careful") || q.includes("attention")) {
    return "🟡 **2 Deals Need Watching:**\n\n1. **Data Center Upgrade** — Initech\n   Demo | $450K | 12 days\n   → Schedule technical review\n\n2. **Platform Licensing** — Massive Dynamic\n   Proposal | $950K | 9 days\n   → Review pricing with Deal Desk\n\n💰 Total watch value: **$1.4M**\n→ These deals are not yet at-risk but need attention this week.";
  }

  if (q.includes("healthy") || q.includes("good deal") || 
      q.includes("on track") || q.includes("green") || 
      q.includes("doing well") || q.includes("strong deal")) {
    return "🟢 **5 Healthy Deals on Track:**\n\n1. Global Rollout Phase 1 — Globex Inc | $1.2M\n2. Security Suite Renewal — Umbrella Corp | $180K\n3. Cloud Migration — Stark Ind. | $2.1M ✅ CLOSED\n4. Managed Services — Soylent Corp | $275K\n5. Infrastructure Overhaul — Tyrell Corp | $1.5M\n\n💰 Total healthy value: **$5.23M**\n→ Great progress! Focus energy on the 3 at-risk deals now.";
  }

  if (q.includes("agent") || q.includes("swarm") || 
      q.includes("pipeline analyst") || q.includes("insight generator") || 
      q.includes("alert manager") || q.includes("report builder") || 
      q.includes("how many agent") || q.includes("active agent")) {
    return "🤖 **Agent Swarm Status:**\n\n1. 🟢 **PipelineAnalystAgent** — ACTIVE\n   Tools: get_pipeline_summary(), flag_stale_deals(), calculate_forecast()\n   Last action: 2 mins ago | Actions today: 145\n\n2. 💤 **InsightGeneratorAgent** — IDLE\n   Tools: generate_executive_summary(), identify_trends(), suggest_actions()\n   Last action: 10 mins ago | Actions today: 42\n\n3. 🟡 **AlertManagerAgent** — STANDBY\n   Tools: check_deal_health(), send_alert(), set_threshold()\n   Last action: 1 hour ago | Actions today: 18\n\n4. 💤 **ReportBuilderAgent** — IDLE\n   Tools: build_weekly_report(), export_to_pdf(), schedule_report()\n   Last action: 5 hours ago | Actions today: 3";
  }

  if (q.includes("acme") || q.includes("acme corp")) {
    return "🔴 **Q3 Enterprise Expansion — Acme Corp**\n\nStage: Negotiation | Value: $850K | Days: 18\nHealth: AT-RISK | Owner: Sarah Chen\n\n→ **Recommendation:** Escalate to VP Sales immediately — this deal has been stalled for 18 days with no stakeholder reply.";
  }
  if (q.includes("globex") || q.includes("globex inc")) {
    return "🟢 **Global Rollout Phase 1 — Globex Inc**\n\nStage: Proposal | Value: $1.2M | Days: 4\nHealth: Healthy | Owner: Marcus Reid\n\n→ **Recommendation:** Send follow-up deck — deal is progressing well.";
  }
  if (q.includes("initech")) {
    return "🟡 **Data Center Upgrade — Initech**\n\nStage: Demo | Value: $450K | Days: 12\nHealth: Watch | Owner: Priya Nair\n\n→ **Recommendation:** Schedule technical review this week before it moves to at-risk.";
  }
  if (q.includes("umbrella") || q.includes("umbrella corp")) {
    return "🟢 **Security Suite Renewal — Umbrella Corp**\n\nStage: Qualification | Value: $180K | Days: 2\nHealth: Healthy | Owner: Sarah Chen\n\n→ **Recommendation:** Verify champion — early stage, good momentum.";
  }
  if (q.includes("stark") || q.includes("stark ind")) {
    return "🟢 **Cloud Migration — Stark Ind.**\n\nStage: CLOSED ✅ | Value: $2.1M | Days: 1\nHealth: Healthy | Owner: James Wu\n\n→ **Recommendation:** Initiate onboarding — congratulations, this deal is closed!";
  }
  if (q.includes("wayne") || q.includes("wayne ent")) {
    return "🔴 **API Integration — Wayne Ent.**\n\nStage: Negotiation | Value: $320K | Days: 21\nHealth: AT-RISK | Owner: Marcus Reid\n\n→ **Recommendation:** Offer discount on term — longest stalled deal in the pipeline at 21 days.";
  }
  if (q.includes("massive dynamic") || q.includes("massive")) {
    return "🟡 **Platform Licensing — Massive Dynamic**\n\nStage: Proposal | Value: $950K | Days: 9\nHealth: Watch | Owner: Priya Nair\n\n→ **Recommendation:** Review pricing with Deal Desk before responding to buyer.";
  }
  if (q.includes("soylent") || q.includes("soylent corp")) {
    return "🟢 **Managed Services — Soylent Corp**\n\nStage: Demo | Value: $275K | Days: 5\nHealth: Healthy | Owner: Sarah Chen\n\n→ **Recommendation:** Prepare custom demo — good momentum, keep it moving.";
  }
  if (q.includes("cyberdyne")) {
    return "🔴 **Analytics Expansion — Cyberdyne**\n\nStage: Qualification | Value: $410K | Days: 14\nHealth: AT-RISK | Owner: James Wu\n\n→ **Recommendation:** Re-engage executive sponsor immediately — deal has gone quiet.";
  }
  if (q.includes("tyrell") || q.includes("tyrell corp")) {
    return "🟢 **Infrastructure Overhaul — Tyrell Corp**\n\nStage: Negotiation | Value: $1.5M | Days: 7\nHealth: Healthy | Owner: Marcus Reid\n\n→ **Recommendation:** Send contract draft — largest active deal, keep momentum going.";
  }

  if (q.includes("pipeline value") || q.includes("total value") || 
      q.includes("how much") || q.includes("total pipeline") || 
      q.includes("pipeline worth") || q.includes("pipeline size")) {
    return "💰 **Total Pipeline Value: $8.2M**\n\nBreakdown by health:\n🔴 At-Risk: $1.58M (3 deals)\n🟡 Watch: $1.4M (2 deals)\n🟢 Healthy: $5.23M (5 deals)\n\nBreakdown by stage:\n✅ Closed: $2.1M\n🤝 Negotiation: $2.67M\n📋 Proposal: $2.15M\n🎯 Demo: $725K\n🔍 Qualification: $590K";
  }

  if (q.includes("alert") || q.includes("approval") || 
      q.includes("approve") || q.includes("dismiss") || 
      q.includes("hitl") || q.includes("human in the loop") || 
      q.includes("pending") || q.includes("review")) {
    return "🔔 **Active Alerts — Human Approval Required:**\n\n🔴 HIGH PRIORITY\nQ3 Enterprise Expansion (Acme Corp)\nIssue: 14+ days in Negotiation without stakeholder reply\nAgent Recommendation: Send escalation email sequence\n\n🟡 MEDIUM PRIORITY\nAPI Integration (Wayne Ent.)\nIssue: Competitor mentioned in recent call transcript\nAgent Recommendation: Deploy battlecard for competitor X\n\n🔵 LOW PRIORITY\nAnalytics Expansion (Cyberdyne)\nIssue: Missing technical validation step\nAgent Recommendation: Prompt SE to schedule review\n\n→ Go to the Alerts page to Approve & Send or Dismiss each action.";
  }

  if (q.includes("report") || q.includes("executive report") || 
      q.includes("weekly report") || q.includes("generate report") || 
      q.includes("pipeline report") || q.includes("audit")) {
    return "📄 **Executive Reports Available:**\n\n1. 📊 Q3 Pipeline Risk Analysis (2026-06-25)\n   Generated by: ReportBuilderAgent + PipelineAnalystAgent\n\n2. 📈 Weekly Forecast Update (2026-06-18)\n   Generated by: ReportBuilderAgent\n\n3. 🔍 Stale Deals Audit (2026-06-11)\n   Generated by: ReportBuilderAgent + InsightGeneratorAgent\n\n→ Go to the Reports page to view, expand, or download any report. Click 'Generate New Report' for a fresh Gemini-powered analysis.";
  }

  if (q.includes("nothing") || q.includes("no query") || 
      q.includes("no question") || q.includes("all good") || 
      q.includes("i'm fine") || q.includes("im fine") || 
      q.includes("not now") || q.includes("maybe later")) {
    return "No problem at all! 😊 Whenever you need pipeline insights, deal updates, or revenue analysis — I'm right here. Have a productive day and good luck closing those deals! 🚀";
  }

  return "I'm not sure I understood that completely 😊 Could you rephrase it? I'm here to help with:\n\n📊 Pipeline data and deal details\n⚠️ At-risk and stale deals\n📈 Forecasts and revenue projections\n👥 Rep performance\n🤖 Agent activity\n💡 Recommended actions\n\nIs there anything about your pipeline I can help you with?";
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
  "Show all details","Stale deals",
  "Recommend actions","Show all agents"
];

interface Msg { role:"user"|"assistant"; text:string; }

export default function BizMindChatbot() {
  const [open,setOpen]       = useState(false);
  const [msgs,setMsgs]       = useState<Msg[]>([{role:"assistant",text:"Hi! I'm BizMind AI — your pipeline copilot. Ask me anything about your deals, forecasts, agents, or just say hello! 👋"}]);
  const [input,setInput]     = useState("");
  const [loading,setLoading] = useState(false);
  const [idleCount,setIdleCount] = useState(0);
  const scrollRef            = useRef<HTMLDivElement>(null);
  const inputRef             = useRef<HTMLInputElement>(null);

  useEffect(()=>{ if(scrollRef.current) scrollRef.current.scrollTop=scrollRef.current.scrollHeight; },[msgs,loading]);
  useEffect(()=>{ if(open&&inputRef.current) inputRef.current.focus(); },[open]);

  const send = useCallback(async(override?:string)=>{
    const text=(override??input).trim();
    if(!text||loading) return;
    
    // Check inactivity rule
    let currentIdle = idleCount;
    if (!text.includes("?")) {
      currentIdle += 1;
    } else {
      currentIdle = 0;
    }
    setIdleCount(currentIdle);

    const userMsg:Msg={role:"user",text};
    const history=[...msgs,userMsg];
    setMsgs(history);
    setInput("");
    setLoading(true);
    let reply="";
    try { 
      reply=await callGemini(msgs,text); 
    } catch { 
      reply=getResponse(text); 
    }
    
    if (currentIdle >= 2) {
      reply += "\n\n💬 Is there anything else I can help you with?";
      setIdleCount(0); // Reset after appending
    }

    setMsgs(p=>[...p,{role:"assistant",text:reply}]);
    setLoading(false);
  },[input,loading,msgs,idleCount]);

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
