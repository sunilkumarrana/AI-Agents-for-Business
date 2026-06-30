from google_adk import BaseAgent, tool

class AlertManagerAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="AlertManagerAgent",
            description="Monitors thresholds and sends proactive alerts with human-in-the-loop approval.",
            model="gemini-3.5-flash"
        )

    @tool
    def check_deal_health(self):
        """Evaluates ongoing deals against predefined health thresholds."""
        pass

    @tool
    def send_alert(self, alert_id: str):
        """Sends an alert to the user. Requires human-in-the-loop approval before firing."""
        pass

    @tool
    def set_threshold(self, metric: str, value: float):
        """Configures alert thresholds."""
        pass
