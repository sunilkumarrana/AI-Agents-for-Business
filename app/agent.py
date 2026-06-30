from google_adk import GraphAgent, AgentContext
from app.sub_agents.pipeline_analyst import PipelineAnalystAgent
from app.sub_agents.insight_generator import InsightGeneratorAgent
from app.sub_agents.alert_manager import AlertManagerAgent
from app.sub_agents.report_builder import ReportBuilderAgent

class PipelineOrchestrator(GraphAgent):
    """
    Root agent for BizMind AI.
    Orchestrates the workflow between specialist sub-agents based on incoming natural language queries.
    """
    def __init__(self):
        super().__init__(
            name="PipelineOrchestrator",
            description="Autonomous Revenue Intelligence Team Orchestrator",
            model="gemini-3.5-flash"
        )
        
        # Register specialist sub-agents
        self.register_agent(PipelineAnalystAgent())
        self.register_agent(InsightGeneratorAgent())
        self.register_agent(AlertManagerAgent())
        self.register_agent(ReportBuilderAgent())

    async def on_message(self, message: str, context: AgentContext):
        """
        Handles incoming queries, evaluates intent, and delegates to the right sub-agent.
        """
        print(f"[PipelineOrchestrator] Received query: {message}")
        # Orchestration logic handled by ADK 2.0 graph execution
        pass

if __name__ == "__main__":
    agent = PipelineOrchestrator()
    agent.start()
