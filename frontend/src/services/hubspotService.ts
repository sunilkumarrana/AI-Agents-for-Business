const HUBSPOT_TOKEN = import.meta.env.VITE_HUBSPOT_TOKEN;

// NOTE: HubSpot API requires a backend proxy to avoid CORS issues in the browser.
// For the demo, we use a CORS proxy.
const PROXY = "https://corsproxy.io/?";
const HUBSPOT_BASE = "https://api.hubapi.com";

export async function fetchHubSpotDeals() {
  if (!HUBSPOT_TOKEN || HUBSPOT_TOKEN === 'your_token_here') {
    return null;
  }

  try {
    const url = `${PROXY}${encodeURIComponent(
      `${HUBSPOT_BASE}/crm/v3/objects/deals?limit=10&properties=dealname,amount,dealstage,closedate,hubspot_owner_id,hs_deal_stage_probability&associations=company,contacts`
    )}`;

    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${HUBSPOT_TOKEN}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`HubSpot API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform HubSpot deal format to BizMind format
    return data.results.map((deal: any) => ({
      id: deal.id,
      name: deal.properties.dealname || "Unnamed Deal",
      company: deal.associations?.companies?.results?.[0]?.id || "Unknown Company",
      stage: normalizeStage(deal.properties.dealstage),
      value: parseInt(deal.properties.amount) || 0,
      closeDate: deal.properties.closedate,
      probability: parseFloat(deal.properties.hs_deal_stage_probability) || 0,
      daysInStage: calculateDaysInStage(deal.properties.hs_date_entered_dealstage),
      health: calculateHealth(deal.properties),
      recommendation: getGenericRecommendation(deal.properties),
      source: "hubspot"
    }));

  } catch (error: any) {
    console.warn("HubSpot fetch failed, using fallback data:", error.message);
    return null; 
  }
}

export async function fetchHubSpotPipelineSummary() {
  if (!HUBSPOT_TOKEN || HUBSPOT_TOKEN === 'your_token_here') {
    return null;
  }

  try {
    const url = `${PROXY}${encodeURIComponent(
      `${HUBSPOT_BASE}/crm/v3/objects/deals?limit=100&properties=amount,dealstage,hs_deal_stage_probability`
    )}`;

    const response = await fetch(url, {
      headers: { "Authorization": `Bearer ${HUBSPOT_TOKEN}` }
    });

    const data = await response.json();
    
    const totalValue = data.results.reduce((sum: number, d: any) => sum + (parseInt(d.properties.amount) || 0), 0);
    const atRisk = data.results.filter((d: any) => parseFloat(d.properties.hs_deal_stage_probability) < 0.3).length;
    
    return {
      totalValue,
      totalDeals: data.results.length,
      atRisk,
      source: "hubspot_live"
    };
  } catch (error) {
    return null;
  }
}

// Helper functions
function normalizeStage(hubspotStage: string) {
  const stageMap: Record<string, string> = {
    "appointmentscheduled": "Qualification",
    "qualifiedtobuy": "Qualification", 
    "presentationscheduled": "Demo",
    "decisionmakerboughtin": "Proposal",
    "contractsent": "Negotiation",
    "closedwon": "Closed Won",
    "closedlost": "Closed Lost"
  };
  return stageMap[hubspotStage] || hubspotStage || "Unknown";
}

function calculateDaysInStage(dateEntered: string) {
  if (!dateEntered) return Math.floor(Math.random() * 30); // fallback for mock testing
  const entered = new Date(dateEntered);
  const now = new Date();
  return Math.floor((now.getTime() - entered.getTime()) / (1000 * 60 * 60 * 24));
}

function calculateHealth(properties: any) {
  const probability = parseFloat(properties.hs_deal_stage_probability) || 0.5;
  const daysInStage = calculateDaysInStage(properties.hs_date_entered_dealstage);
  
  if (probability < 0.3 || daysInStage > 21) return "at-risk";
  if (probability < 0.6 || daysInStage > 14) return "watch";
  return "healthy";
}

function getGenericRecommendation(properties: any) {
    const health = calculateHealth(properties);
    if (health === 'at-risk') return "Escalate immediately";
    if (health === 'watch') return "Review in next sync";
    return "Proceed normally";
}
