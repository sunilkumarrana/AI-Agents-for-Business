# Threat Model: BizMind AI

This document outlines the security posture and threat model for the BizMind AI application using the STRIDE methodology, fulfilling the Day 4 Agent Quality & Security requirements.

## System Boundary
BizMind AI interacts with the user via a React frontend, orchestrates tasks through a Python ADK 2.0 backend, and connects to external CRM data sources and notification APIs.

## STRIDE Analysis

### 1. Spoofing
**Threat:** Malicious actors or compromised internal accounts injecting fake deal data to manipulate pipeline forecasts and agent insights.
**Mitigation:** 
- Strict authentication and authorization for the CRM API endpoints.
- Input validation (Guardrails): All deal values, dates, and pipeline stage names must match expected schema formats before being processed by the `PipelineAnalystAgent`. Unrecognized formats are rejected gracefully.

### 2. Tampering
**Threat:** Manipulation of the pipeline data in transit or altering the thresholds configured in the `AlertManagerAgent`.
**Mitigation:**
- Enforce TLS/HTTPS for all data in transit.
- Implement immutable audit logging for all agent actions (e.g., when `AlertManagerAgent` modifies a threshold).

### 3. Repudiation
**Threat:** Users claiming they did not approve an alert sent to a high-value client.
**Mitigation:**
- The Human-in-the-loop (HITL) approval step explicitly logs the user ID, timestamp, and the exact payload of the approved alert.

### 4. Information Disclosure
**Threat:** Sensitive revenue data, deal negotiations, or executive insights being exposed to unauthorized users or leaking through agent hallucinations.
**Mitigation:**
- Role-Based Access Control (RBAC) ensuring users only see pipeline data they are authorized to view.
- **Output Evaluator:** A lightweight LLM evaluator checks the `InsightGeneratorAgent`'s output for hallucinated numbers or unsupported claims before surfacing them to the user.

### 5. Denial of Service (DoS)
**Threat:** Attackers or runaway sub-agents spamming the Orchestrator with complex queries, exhausting API rate limits and compute resources.
**Mitigation:**
- Rate limiting at the API gateway.
- Timeout limits on all agent-to-agent LLM calls. Token-efficient summarization (Day 3 concept) is used to compress large data payloads.

### 6. Elevation of Privilege
**Threat:** An attacker manipulating a prompt injection to force the `AlertManagerAgent` to execute unauthorized commands or bypass the HITL approval.
**Mitigation:**
- Strict separation of agent privileges via MCP (Model Context Protocol). Agents only have access to their specific tools.
- The `send_alert` tool strictly requires a digitally signed approval token from the frontend UI before executing the external API call.
