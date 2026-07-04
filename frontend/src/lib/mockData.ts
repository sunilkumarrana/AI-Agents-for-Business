export interface Deal {
  id: string;
  name: string;
  company: string;
  stage: string;
  value: number;
  daysInStage: number;
  health: 'healthy' | 'watch' | 'at-risk';
  recommendation: string;
}

export const deals: Deal[] = [
  { id: '1', name: 'Q3 Enterprise Expansion', company: 'Acme Corp', stage: 'Negotiation', value: 850000, daysInStage: 18, health: 'at-risk', recommendation: 'Escalate to VP Sales' },
  { id: '2', name: 'Global Rollout Phase 1', company: 'Globex Inc', stage: 'Proposal', value: 1200000, daysInStage: 4, health: 'healthy', recommendation: 'Send follow-up deck' },
  { id: '3', name: 'Data Center Upgrade', company: 'Initech', stage: 'Demo', value: 450000, daysInStage: 12, health: 'watch', recommendation: 'Schedule technical review' },
  { id: '4', name: 'Security Suite Renewal', company: 'Umbrella Corp', stage: 'Qualification', value: 180000, daysInStage: 2, health: 'healthy', recommendation: 'Verify champion' },
  { id: '5', name: 'Cloud Migration', company: 'Stark Ind.', stage: 'Closed', value: 2100000, daysInStage: 1, health: 'healthy', recommendation: 'Initiate onboarding' },
  { id: '6', name: 'API Integration', company: 'Wayne Ent.', stage: 'Negotiation', value: 320000, daysInStage: 21, health: 'at-risk', recommendation: 'Offer discount on term' },
  { id: '7', name: 'Platform Licensing', company: 'Massive Dynamic', stage: 'Proposal', value: 950000, daysInStage: 9, health: 'watch', recommendation: 'Review pricing with Deal Desk' },
  { id: '8', name: 'Managed Services', company: 'Soylent Corp', stage: 'Demo', value: 275000, daysInStage: 5, health: 'healthy', recommendation: 'Prepare custom demo' },
  { id: '9', name: 'Analytics Expansion', company: 'Cyberdyne', stage: 'Qualification', value: 410000, daysInStage: 14, health: 'at-risk', recommendation: 'Re-engage executive sponsor' },
  { id: '10', name: 'Infrastructure Overhaul', company: 'Tyrell Corp', stage: 'Negotiation', value: 1500000, daysInStage: 7, health: 'healthy', recommendation: 'Send contract draft' }
];

export interface Insight {
  id: string;
  agent: string;
  message: string;
  timestamp: string;
}

export const insights: Insight[] = [
  { id: '1', agent: 'InsightGeneratorAgent', message: 'Acme Corp has been in Negotiation for 18 days — 3x your average. Recommend escalation.', timestamp: '10 mins ago' },
  { id: '2', agent: 'PipelineAnalystAgent', message: 'Q3 forecast: $1.8M committed, $600K at risk based on inactivity signals.', timestamp: '1 hour ago' },
  { id: '3', agent: 'InsightGeneratorAgent', message: 'Win rate for deals >$100k dropped 12% this quarter. Common factor: missing champion contact.', timestamp: '3 hours ago' },
  { id: '4', agent: 'PipelineAnalystAgent', message: 'Velocity in Demo stage has improved by 4 days compared to last month.', timestamp: '5 hours ago' }
];

export interface Report {
  id: string;
  date: string;
  headline: string;
  agents: string[];
  content?: string;
}

export const reports: Report[] = [
  { 
    id: '1', date: '2026-06-25', headline: 'Q3 Pipeline Risk Analysis', agents: ['ReportBuilderAgent', 'PipelineAnalystAgent'],
    content: `Based on an analysis of all active deals in the Q3 pipeline, we have identified $2.4M in total revenue that is currently showing signs of stagnation or competitive risk. \n\nThe primary contributor is the Acme Corp Enterprise Expansion deal ($850k), which has remained in the Negotiation stage for 18 days without a response from their primary stakeholder. PipelineAnalystAgent strongly recommends escalating this directly to the VP of Sales immediately to prevent further stalling.\n\nOverall forecast accuracy remains high at 84%, but failing to advance the top 3 watch-list deals by Friday will jeopardize our stretch goal for the quarter.`
  },
  { 
    id: '2', date: '2026-06-18', headline: 'Weekly Forecast Update', agents: ['ReportBuilderAgent'],
    content: `Weekly Summary: Committed revenue has increased to $1.8M for June, with a best-case scenario of $2.4M if the Stark Ind. and Tyrell Corp deals close on schedule. \n\nAverage deal velocity across the board is currently 9 days, representing a 14% improvement over last month. The sales team should prioritize pushing late-stage proposals across the finish line this week to lock in the committed numbers.`
  },
  { 
    id: '3', date: '2026-06-11', headline: 'Stale Deals Audit', agents: ['ReportBuilderAgent', 'InsightGeneratorAgent'],
    content: `A deep-dive audit into the current pipeline has surfaced 7 deals that have been sitting in the Qualification or Demo stages for over 14 days.\n\nInsightGeneratorAgent notes a historical trend: deals that stall at this phase for more than two weeks have a 60% lower close rate. \n\nRecommended Action: Reps should implement the re-engagement playbook for Cyberdyne and Massive Dynamic immediately, or consider marking them as Closed/Lost to refocus efforts on higher-probability opportunities.`
  }
];

export interface Alert {
  id: string;
  severity: 'high' | 'medium' | 'low';
  dealName: string;
  description: string;
  action: string;
  reasoning: string[];
}

export const alerts: Alert[] = [
  { 
    id: '1', severity: 'high', dealName: 'Q3 Enterprise Expansion (Acme Corp)', description: 'Deal in Negotiation > 14 days without stakeholder reply.', action: 'Send escalation email sequence',
    reasoning: [
      "Detected: Deal in Negotiation stage for 14+ days with no stakeholder reply",
      "Checked: Last email thread (no response since June 16)",
      "Decision: Escalation threshold exceeded → recommend VP Sales escalation"
    ]
  },
  { 
    id: '2', severity: 'medium', dealName: 'API Integration (Wayne Ent.)', description: 'Competitor mentioned in recent call transcript.', action: 'Deploy battlecard for competitor X',
    reasoning: [
      "Detected: Mentions of 'competitor X' found in recent Gong call transcript",
      "Checked: Deal value is high ($320k) and stage is Negotiation",
      "Decision: Competitive risk high → deploy battlecard immediately"
    ]
  },
  { 
    id: '3', severity: 'low', dealName: 'Analytics Expansion (Cyberdyne)', description: 'Missing technical validation step.', action: 'Prompt SE to schedule review',
    reasoning: [
      "Detected: Deal moved to Qualification without Technical Validation step",
      "Checked: Sales process rule requires SE approval before next stage",
      "Decision: Process gap identified → prompt SE to schedule review"
    ]
  }
];

export interface AgentStatus {
  id: string;
  name: string;
  role: string;
  status: 'Active' | 'Idle' | 'Standby';
  tools: string[];
  lastAction: string;
  totalActions: number;
}

export const agentsData: AgentStatus[] = [
  { id: '1', name: 'PipelineAnalystAgent', role: 'Pipeline Health & Velocity', status: 'Active', tools: ['get_pipeline_summary()', 'flag_stale_deals()', 'calculate_forecast()'], lastAction: '2 mins ago', totalActions: 145 },
  { id: '2', name: 'InsightGeneratorAgent', role: 'Business Intelligence Narratives', status: 'Idle', tools: ['generate_executive_summary()', 'identify_trends()', 'suggest_actions()'], lastAction: '10 mins ago', totalActions: 42 },
  { id: '3', name: 'AlertManagerAgent', role: 'Threshold Monitoring & Alerts', status: 'Standby', tools: ['check_deal_health()', 'send_alert()', 'set_threshold()'], lastAction: '1 hour ago', totalActions: 18 },
  { id: '4', name: 'ReportBuilderAgent', role: 'Data Assembly & Formatting', status: 'Idle', tools: ['build_weekly_report()', 'export_to_pdf()', 'schedule_report()'], lastAction: '5 hours ago', totalActions: 3 }
];
