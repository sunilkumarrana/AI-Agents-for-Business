import React, { useState, useEffect } from 'react';

const initialAgentLogs = [
  '[12:04:02] PipelineOrchestrator → received query: "flag stale deals"',
  '[12:04:03] PipelineAnalystAgent → running flag_stale_deals()...',
  '[12:04:04] PipelineAnalystAgent → found 7 deals stale > 14 days',
  '[12:04:05] InsightGeneratorAgent → generating recommendations...',
  '[12:04:06] AlertManagerAgent → 2 alerts queued, awaiting approval',
  '[12:04:07] PipelineOrchestrator → response ready',
];

export const AgentActivityFeed: React.FC = () => {
  const [logs, setLogs] = useState<string[]>(initialAgentLogs);
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLooping, setIsLooping] = useState(true);

  useEffect(() => {
    const handleNewLog = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setIsLooping(false); // Stop the infinite loop if we get custom logs
      setLogs(prev => [...prev, customEvent.detail]);
    };
    window.addEventListener('agent-log', handleNewLog);
    return () => window.removeEventListener('agent-log', handleNewLog);
  }, []);

  useEffect(() => {
    if (currentIndex < logs.length) {
      const timer = setTimeout(() => {
        setVisibleLogs((prev) => [...prev, logs[currentIndex]]);
        setCurrentIndex((prev) => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    } else if (isLooping && logs.length === initialAgentLogs.length) {
      // Loop the animation after a delay, only if we haven't received custom logs
      const timer = setTimeout(() => {
        setVisibleLogs([]);
        setCurrentIndex(0);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, logs, isLooping]);

  return (
    <div className="bg-[#060D18] border border-[#1e3a66] rounded-xl p-4 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2 uppercase tracking-wider">
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
        Live Agent Activity
      </h3>
      <div className="flex-1 overflow-y-auto space-y-3 font-mono text-xs">
        {visibleLogs.map((log, index) => (
          <div key={index} className="fade-in-line">
            <span className="text-slate-400">{log.substring(0, 11)}</span>
            <span className={
              log.includes('PipelineOrchestrator') ? 'text-accent font-semibold' :
              log.includes('PipelineAnalystAgent') ? 'text-purple-400' :
              log.includes('InsightGeneratorAgent') ? 'text-emerald-400' :
              log.includes('AlertManagerAgent') ? 'text-warning' : 'text-slate-300'
            }>
              {log.substring(11)}
            </span>
          </div>
        ))}
        {currentIndex < logs.length && (
          <div className="flex items-center">
            <span className="w-2 h-4 bg-slate-400 animate-[blinkTextCursor_0.75s_step-end_infinite] inline-block ml-1"></span>
          </div>
        )}
      </div>
    </div>
  );
};
