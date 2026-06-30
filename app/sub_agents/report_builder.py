from google_adk import BaseAgent, tool

class ReportBuilderAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="ReportBuilderAgent",
            description="Assembles structured reports combining data from all agents.",
            model="gemini-3.5-flash"
        )

    @tool
    def build_weekly_report(self):
        """Compiles insights and data into a structured weekly report."""
        pass

    @tool
    def export_to_pdf(self, report_id: str):
        """Exports a given report to PDF format."""
        pass

    @tool
    def schedule_report(self, frequency: str):
        """Schedules recurring reports."""
        pass
