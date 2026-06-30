# BizMind AI: Company Profile Skill

## Overview
This context file serves as the foundational memory for the BizMind AI agent swarm. It defines the company's specific sales process, key performance indicators (KPIs), and operational thresholds, ensuring agents have persistent contextual awareness without requiring repetitive setup prompts from the user.

## Company Details
- **Company Name:** Acme Cloud Solutions
- **Industry:** Enterprise B2B SaaS
- **Target Audience:** Mid-market to Fortune 500 IT Departments

## Sales Process & Stages
The pipeline follows a standard 6-stage enterprise sales motion:

1. **Prospecting:** Initial outreach and lead generation. (Target velocity: 7 days)
2. **Qualification:** BANT (Budget, Authority, Need, Timeline) verified. (Target velocity: 14 days)
3. **Demo:** Technical demonstration to stakeholders. (Target velocity: 10 days)
4. **Proposal:** Pricing, terms, and custom ROI models presented. (Target velocity: 14 days)
5. **Negotiation:** Legal, security review (InfoSec), and procurement. (Target velocity: 21 days)
6. **Closed:** Contract signed (Won) or Deal Lost.

## KPI Definitions & Thresholds
- **Stale Deal Threshold:** Any deal in a single stage for more than 1.5x the target velocity.
- **High-Value Deal:** Any deal with ACV (Annual Contract Value) > $250,000.
- **At-Risk Warning:** If a High-Value Deal enters the "Stale" state, immediately trigger a High Severity alert.
- **Forecast Accuracy Target:** 85% or higher variance between committed pipeline and closed-won revenue.

## Agent Guidelines
- **InsightGeneratorAgent:** Should always format currency in USD. Compare current metrics to historical averages when identifying trends.
- **AlertManagerAgent:** Must never send external emails or Slack messages without explicit human approval (Human-in-the-loop).
- **ReportBuilderAgent:** Default reporting cadence is Friday at 8:00 AM local time.
