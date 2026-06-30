# BizMind AI

**Your autonomous revenue intelligence team.**

BizMind AI is an enterprise-grade Sales Pipeline & Business Intelligence Agent built for B2B companies. It replaces manual CRM reviews with a multi-agent system that monitors pipeline health, flags at-risk deals, predicts revenue outcomes, and sends proactive alerts.

Built for the **Google × Kaggle 5-Day AI Agents Intensive Vibe Coding Course (2026)**.

## Architecture

The system utilizes Google ADK 2.0 to orchestrate a team of 4 specialized sub-agents.

```text
BizMind AI Architecture
├── PipelineOrchestrator (root agent — ADK 2.0 GraphAgent)
│   ├── PipelineAnalystAgent (sub-agent)
│   │   ├── tool: get_pipeline_summary()
│   │   ├── tool: flag_stale_deals()
│   │   └── tool: calculate_forecast()
│   ├── InsightGeneratorAgent (sub-agent)
│   │   ├── tool: generate_executive_summary()
│   │   ├── tool: identify_trends()
│   │   └── tool: suggest_actions()
│   ├── AlertManagerAgent (sub-agent)
│   │   ├── tool: check_deal_health()
│   │   ├── tool: send_alert() [requires human approval]
│   │   └── tool: set_threshold()
│   └── ReportBuilderAgent (sub-agent)
│       ├── tool: build_weekly_report()
│       ├── tool: export_to_pdf()
│       └── tool: schedule_report()
├── Memory Layer (ADK 2.0 MemoryService)
│   ├── SessionMemory — per-conversation context
│   └── LongTermMemory — user preferences + company profile skill
├── Evaluation Layer
│   ├── InputValidator
│   └── OutputEvaluator
└── Observability Layer
    ├── AgentActivityLogger
    └── SystemHealthMonitor
```

## Features Demo'd from Course Concepts

- **Day 1:** Vibe coded React frontend and ADK 2.0 Orchestrator structure.
- **Day 2:** 4-agent multi-agent system with distinct MCP tools.
- **Day 3:** Persistent context via `CONTEXT.md` (Company Profile Skill).
- **Day 4:** Guardrails, HITL approval (Alerts UI), and STRIDE threat modeling (`SECURITY.md`).
- **Day 5:** System health observability, real-time Agent Activity Feed, and Cloud Run deployability.

## Setup Instructions

### Frontend (React/Vite)
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Open the provided localhost URL in your browser to view the premium dashboard.

### Backend (Python ADK 2.0)
1. Create a virtual environment: `python -m venv venv`
2. Activate the environment:
   - Windows: `venv\Scripts\activate`
   - Unix: `source venv/bin/activate`
3. Install dependencies: `pip install -r requirements.txt`
4. Run the orchestrator: `python app/agent.py`

## Deployment

Deploy the agent backend to Google Cloud Run with a single command using the ADK CLI:
```bash
agents deploy --name bizmind-ai --region us-central1
```
