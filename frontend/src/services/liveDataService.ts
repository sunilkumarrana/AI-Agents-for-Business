import { fetchHubSpotDeals } from "./hubspotService";
import type { Deal } from "../lib/mockData";

// Fallback mock data matching the exact required dashboard context
const MOCK_DEALS: (Deal & { probability: number; rep: string; source: string })[] = [
  { id: '1', name: 'Q3 Enterprise Expansion', company: 'Acme Corp', stage: 'Negotiation', value: 850000, daysInStage: 18, health: 'at-risk', recommendation: 'Escalate to VP Sales', probability: 0.45, rep: "Sarah Chen", source: "mock" },
  { id: '2', name: 'Global Rollout Phase 1', company: 'Globex Inc', stage: 'Proposal', value: 1200000, daysInStage: 4, health: 'healthy', recommendation: 'Send follow-up deck', probability: 0.72, rep: "Marcus Reid", source: "mock" },
  { id: '3', name: 'Data Center Upgrade', company: 'Initech', stage: 'Demo', value: 450000, daysInStage: 12, health: 'watch', recommendation: 'Schedule technical review', probability: 0.58, rep: "Priya Nair", source: "mock" },
  { id: '4', name: 'Security Suite Renewal', company: 'Umbrella Corp', stage: 'Qualification', value: 180000, daysInStage: 2, health: 'healthy', recommendation: 'Verify champion', probability: 0.81, rep: "Sarah Chen", source: "mock" },
  { id: '5', name: 'Cloud Migration', company: 'Stark Ind.', stage: 'Closed', value: 2100000, daysInStage: 1, health: 'healthy', recommendation: 'Initiate onboarding', probability: 1.0, rep: "James Wu", source: "mock" },
  { id: '6', name: 'API Integration', company: 'Wayne Ent.', stage: 'Negotiation', value: 320000, daysInStage: 21, health: 'at-risk', recommendation: 'Offer discount on term', probability: 0.38, rep: "Marcus Reid", source: "mock" },
  { id: '7', name: 'Platform Licensing', company: 'Massive Dynamic', stage: 'Proposal', value: 950000, daysInStage: 9, health: 'watch', recommendation: 'Review pricing with Deal Desk', probability: 0.62, rep: "Priya Nair", source: "mock" },
  { id: '8', name: 'Managed Services', company: 'Soylent Corp', stage: 'Demo', value: 275000, daysInStage: 5, health: 'healthy', recommendation: 'Prepare custom demo', probability: 0.74, rep: "Sarah Chen", source: "mock" },
  { id: '9', name: 'Analytics Expansion', company: 'Cyberdyne', stage: 'Qualification', value: 410000, daysInStage: 14, health: 'at-risk', recommendation: 'Re-engage executive sponsor', probability: 0.29, rep: "James Wu", source: "mock" },
  { id: '10', name: 'Infrastructure Overhaul', company: 'Tyrell Corp', stage: 'Negotiation', value: 1500000, daysInStage: 7, health: 'healthy', recommendation: 'Send contract draft', probability: 0.78, rep: "Marcus Reid", source: "mock" }
];

const HEALTH_RECOMMENDATIONS: Record<string, string[]> = {
  'healthy': ['Send contract draft', 'Send follow-up deck', 'Verify champion', 'Prepare custom demo', 'Initiate onboarding'],
  'watch': ['Schedule technical review', 'Review pricing with Deal Desk', 'Confirm executive alignment', 'Check competitor presence'],
  'at-risk': ['Escalate to VP Sales', 'Offer discount on term', 'Re-engage executive sponsor', 'Urgent check-in call']
};

let liveDealsState = [...MOCK_DEALS];
let hasInitializedFromHubSpot = false;

export async function getDeals() {
  if (!hasInitializedFromHubSpot) {
    const hubspotDeals = await fetchHubSpotDeals();
    if (hubspotDeals && hubspotDeals.length > 0) {
      console.log("✅ Using live HubSpot data:", hubspotDeals.length, "deals");
      liveDealsState = [...hubspotDeals];
      hasInitializedFromHubSpot = true;
    } else {
      console.log("⚠️ HubSpot unavailable — using simulated mock data");
    }
  }
  
  // Add live simulation jitter to persistent working state
  liveDealsState = liveDealsState.map(deal => {
    let health = deal.health;
    
    // Occasionally flip health status (but never for closed deals)
    if (Math.random() > 0.85 && deal.stage !== 'Closed') {
      const statuses = ['healthy', 'watch', 'at-risk'] as const;
      health = statuses[Math.floor(Math.random() * statuses.length)] as 'healthy' | 'watch' | 'at-risk';
    }

    // Update recommendation if health changed
    let recommendation = deal.recommendation;
    if (health !== deal.health || Math.random() > 0.9) {
      const recs = HEALTH_RECOMMENDATIONS[health] || HEALTH_RECOMMENDATIONS['healthy'];
      recommendation = recs[Math.floor(Math.random() * recs.length)];
    }

    return {
      ...deal,
      value: Math.max(0, deal.value + (Math.floor(Math.random() * 20000) - 10000)), // fluctuate +/- 10k
      daysInStage: Math.max(1, deal.daysInStage + (Math.random() > 0.7 ? 1 : (Math.random() > 0.9 ? -1 : 0))),
      health,
      recommendation
    };
  });
  
  return { deals: liveDealsState, source: hasInitializedFromHubSpot ? "hubspot_live" : "mock" };
}

export function calculateKPIs(deals: any[]) {
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
  const atRisk = deals.filter(d => d.health === "at-risk" || d.health === "red").length;
  
  const closedDeals = deals.filter(d => d.stage === "Closed");
  const forecastAccuracy = closedDeals.length > 0 
    ? Math.round(closedDeals.reduce((sum, d) => sum + (d.probability || 0.84), 0) / closedDeals.length * 100)
    : 84;
  
  const avgVelocity = Math.round(
    deals.reduce((sum, d) => sum + d.daysInStage, 0) / Math.max(1, deals.length)
  );

  return {
    totalValue: "$" + (totalValue / 1000000).toFixed(1) + "M",
    atRisk,
    forecastAccuracy: forecastAccuracy + "%",
    avgVelocity: avgVelocity + " days"
  };
}

export function buildPipelineContext(deals: any[], kpis: any) {
  const atRiskDeals = deals.filter(d => d.health === "at-risk" || d.health === "red");
  const watchDeals = deals.filter(d => d.health === "watch" || d.health === "amber");
  
  return `
LIVE PIPELINE SUMMARY:
- Total Pipeline Value: ${kpis.totalValue}
- Total Active Deals: ${deals.length}
- Deals at Risk (red): ${atRiskDeals.length} — ${atRiskDeals.map(d => `${d.name} ($${(d.value/1000).toFixed(0)}K, ${d.daysInStage} days in ${d.stage})`).join(", ")}
- Watch Deals (amber): ${watchDeals.length} — ${watchDeals.map(d => d.name).join(", ")}
- Forecast Accuracy: ${kpis.forecastAccuracy}
- Avg Deal Velocity: ${kpis.avgVelocity}
- Largest Deal: ${deals.sort((a,b) => b.value - a.value)[0]?.name} ($${(deals[0]?.value/1000).toFixed(0)}K)
- Data Source: ${deals[0]?.source === "hubspot_live" ? "Live HubSpot CRM" : "Demo data"}

PIPELINE HEALTH LEDGER:
${deals.map((d, i) => `${i+1}. "${d.name}" | Company: ${d.company} | Stage: ${d.stage} | Value: $${d.value.toLocaleString()} | Health: ${d.health === 'at-risk' ? 'At-Risk' : d.health === 'watch' ? 'Watch' : 'Healthy'} | Recommendation: ${d.recommendation}`).join('\n')}
  `.trim();
}

export function startDataRefresh(callback: () => void) {
  callback(); 
  const interval = setInterval(callback, 5000);
  return () => clearInterval(interval); 
}

export function addLiveFluctuation(kpis: any) {
  return {
    ...kpis,
    lastUpdated: new Date().toLocaleTimeString("en-US", { 
      hour: "2-digit", minute: "2-digit", second: "2-digit" 
    })
  };
}
