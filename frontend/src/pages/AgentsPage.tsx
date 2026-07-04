import React, { useState, useEffect } from 'react';
import { Bot, Activity, Cpu, Server, Clock, Wrench } from 'lucide-react';
import clsx from 'clsx';
import { useAppContext } from '../contexts/AppContext';

export const AgentsPage: React.FC = () => {
  const { agents: initialAgents } = useAppContext();
  
  const [localAgents, setLocalAgents] = useState(() => 
    initialAgents.map(a => ({ 
      ...a, 
      lastActionSecs: a.lastAction === 'Just deployed' ? 0 : Math.floor(Math.random() * 60) + 10,
      updated: false,
      activeTool: null as string | null
    }))
  );
  
  const [apiHealth, setApiHealth] = useState(99.9);
  const [memoryUsage, setMemoryUsage] = useState(2.4);

  useEffect(() => {
    const timer = setInterval(() => {
      setLocalAgents(prev => prev.map(a => ({
        ...a,
        lastActionSecs: a.lastActionSecs + 1,
        updated: false
      })));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setApiHealth(prev => Math.min(100, Math.max(98.0, prev + (Math.random() * 0.4 - 0.2))));
      setMemoryUsage(prev => Math.min(8.0, Math.max(1.5, prev + (Math.random() * 0.6 - 0.3))));
      
      setLocalAgents(prev => {
        const newAgents = [...prev];
        const numToUpdate = Math.floor(Math.random() * 2) + 1; // 1 or 2
        
        const indices: number[] = [];
        while (indices.length < numToUpdate) {
          const r = Math.floor(Math.random() * newAgents.length);
          if (!indices.includes(r)) indices.push(r);
        }
        
        indices.forEach(idx => {
          const statuses: ('Active'|'Standby'|'Idle')[] = ['Active', 'Standby', 'Idle'];
          const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
          const tools = newAgents[idx].tools;
          const newActiveTool = newStatus === 'Active' ? tools[Math.floor(Math.random() * tools.length)] : null;
          
          newAgents[idx] = {
            ...newAgents[idx],
            status: newStatus,
            totalActions: newAgents[idx].totalActions + Math.floor(Math.random() * 3) + 1,
            lastActionSecs: 0,
            updated: true,
            activeTool: newActiveTool
          };
        });
        return newAgents;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatLastAction = (secs: number) => {
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    return `${mins}m ago`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Bot className="w-6 h-6 text-accent" />
            Agent Swarm Status
          </h1>
          <p className="text-slate-400">Monitor the health and activity of your autonomous revenue team.</p>
          <button onClick={() => { localStorage.removeItem('bizmind_agents'); window.location.reload(); }} className="text-xs text-slate-500 hover:text-white transition-colors underline mt-2">Reset agents (demo)</button>
        </div>
        
        {/* System Health Panel */}
        <div className="bg-panel border border-[#1e3a66] p-4 rounded-xl flex gap-6 shadow-sm transition-colors">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#060D18] rounded text-success"><Activity className="w-4 h-4" /></div>
            <div>
              <div className="text-xs text-slate-400">API Health</div>
              <div className="text-sm font-semibold text-white">{apiHealth.toFixed(1)}% (Optimal)</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#060D18] rounded text-accent"><Cpu className="w-4 h-4" /></div>
            <div>
              <div className="text-xs text-slate-400">Memory Usage</div>
              <div className="text-sm font-semibold text-white">{memoryUsage.toFixed(1)} GB / 8.0 GB</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#060D18] rounded text-slate-300"><Server className="w-4 h-4" /></div>
            <div>
              <div className="text-xs text-slate-400">Last Deploy</div>
              <div className="text-sm font-semibold text-white">2 hours ago</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {localAgents.map(agent => (
          <div key={agent.id} className={clsx(
            "bg-panel border border-[#1e3a66] p-6 rounded-xl relative overflow-hidden group transition-all duration-500",
            agent.updated && "shadow-[0_0_15px_rgba(37,99,235,0.4)] border-accent"
          )}>
            {/* Background decoration */}
            <div className={clsx(
              "absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[60px] opacity-20 pointer-events-none transition-all duration-500",
              agent.status === 'Active' ? 'bg-success group-hover:opacity-40' :
              agent.status === 'Standby' ? 'bg-warning group-hover:opacity-30' :
              'bg-slate-400 group-hover:opacity-30'
            )}></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#060D18] rounded-xl border border-[#1e3a66]">
                  <Bot className={clsx(
                    "w-6 h-6",
                    agent.status === 'Active' ? 'text-success' :
                    agent.status === 'Standby' ? 'text-warning' : 'text-slate-400'
                  )} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{agent.name}</h3>
                  <div className="text-sm text-slate-400">{agent.role}</div>
                </div>
              </div>
              <span className={clsx(
                "px-2.5 py-1 text-xs font-bold rounded-full border",
                agent.status === 'Active' ? 'bg-success/10 text-success border-success/30' :
                agent.status === 'Standby' ? 'bg-warning/10 text-warning border-warning/30' :
                'bg-slate-800 text-slate-300 border-slate-700'
              )}>
                {agent.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
              <div className="bg-[#060D18] p-3 rounded-lg border border-[#1e3a66]/50">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                  <Clock className="w-3 h-3" /> Last Action
                </div>
                <div className="text-sm font-medium text-white">{formatLastAction(agent.lastActionSecs)}</div>
              </div>
              <div className="bg-[#060D18] p-3 rounded-lg border border-[#1e3a66]/50">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                  <Activity className="w-3 h-3" /> Actions Today
                </div>
                <div className="text-sm font-medium text-white">{agent.totalActions}</div>
              </div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                <Wrench className="w-3 h-3" /> Available Tools
              </div>
              <div className="flex flex-wrap gap-2">
                {agent.tools.map((tool, i) => (
                  <span key={i} className={clsx(
                    "font-mono text-xs px-2 py-1 rounded border transition-all duration-300",
                    agent.activeTool === tool 
                      ? "bg-accent text-white border-accent shadow-[0_0_8px_rgba(37,99,235,0.6)] animate-pulse" 
                      : "bg-[#1e3a66]/30 text-accent border-accent/20"
                  )}>
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
