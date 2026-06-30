import React from 'react';
import { Bot, Activity, Cpu, Server, Clock, Wrench } from 'lucide-react';
import clsx from 'clsx';
import { useAppContext } from '../contexts/AppContext';

export const AgentsPage: React.FC = () => {
  const { agents } = useAppContext();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Bot className="w-6 h-6 text-accent" />
            Agent Swarm Status
          </h1>
          <p className="text-slate-400">Monitor the health and activity of your autonomous revenue team.</p>
        </div>
        
        {/* System Health Panel */}
        <div className="bg-panel border border-[#1e3a66] p-4 rounded-xl flex gap-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#060D18] rounded text-success"><Activity className="w-4 h-4" /></div>
            <div>
              <div className="text-xs text-slate-400">API Health</div>
              <div className="text-sm font-semibold text-white">99.9% (Optimal)</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#060D18] rounded text-accent"><Cpu className="w-4 h-4" /></div>
            <div>
              <div className="text-xs text-slate-400">Memory Usage</div>
              <div className="text-sm font-semibold text-white">2.4 GB / 8.0 GB</div>
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
        {agents.map(agent => (
          <div key={agent.id} className="bg-panel border border-[#1e3a66] p-6 rounded-xl relative overflow-hidden group">
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
                <div className="text-sm font-medium text-white">{agent.lastAction}</div>
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
                  <span key={i} className="font-mono text-xs px-2 py-1 bg-[#1e3a66]/30 text-accent rounded border border-accent/20">
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
