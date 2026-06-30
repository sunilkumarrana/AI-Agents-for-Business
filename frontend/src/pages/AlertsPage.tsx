import React, { useState } from 'react';
import { alerts as initialAlerts } from '../lib/mockData';
import { ShieldAlert, Check, X, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import { useAppContext } from '../contexts/AppContext';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState(initialAlerts);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [fadingId, setFadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };
  const { decrementDealsAtRisk } = useAppContext();

  const handleDismiss = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const handleApprove = (id: string) => {
    setProcessingId(id);
    setTimeout(() => {
      setFadingId(id);
      setProcessingId(null);
      setTimeout(() => {
        setAlerts(prev => prev.filter(a => a.id !== id));
        decrementDealsAtRisk();
        setToastMessage('✓ Alert approved and sent');
        setTimeout(() => setToastMessage(null), 3000);
      }, 300);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-warning" />
          Active Alerts
        </h1>
        <p className="text-slate-400">Human-in-the-loop review. Approve or dismiss agent recommendations before they are executed.</p>
      </div>

      {alerts.length === 0 ? (
        <div className="bg-panel border border-[#1e3a66] rounded-xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">All Clear</h3>
          <p className="text-slate-400">No active alerts requiring your attention right now.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {alerts.map(alert => (
            <div key={alert.id} className={clsx(
              "bg-panel border border-[#1e3a66] p-6 rounded-xl flex flex-col md:flex-row gap-6 justify-between items-start md:items-center transition-all duration-300",
              fadingId === alert.id ? "opacity-0 translate-x-8" : "opacity-100 translate-x-0"
            )}>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <span className={clsx(
                    "px-2 py-0.5 text-xs font-bold rounded uppercase tracking-wider",
                    alert.severity === 'high' ? 'bg-danger/20 text-danger border border-danger/30' :
                    alert.severity === 'medium' ? 'bg-warning/20 text-warning border border-warning/30' :
                    'bg-accent/20 text-accent border border-accent/30'
                  )}>
                    {alert.severity} Priority
                  </span>
                  <span className="font-semibold text-white">{alert.dealName}</span>
                </div>
                
                <p className="text-slate-300 text-sm">
                  <span className="text-slate-500 font-medium">Issue:</span> {alert.description}
                </p>
                
                <div 
                  className="bg-[#060D18] p-3 rounded-lg border border-[#1e3a66] flex flex-col gap-2 cursor-pointer hover:border-accent/50 transition-colors"
                  onClick={() => toggleExpand(alert.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                      <div>
                        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-1">Agent Recommendation</span>
                        <span className="text-accent text-sm font-medium">{alert.action}</span>
                      </div>
                    </div>
                    {expandedId === alert.id ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 mt-1" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 mt-1" />
                    )}
                  </div>
                  
                  {expandedId === alert.id && (
                    <div className="mt-3 pt-3 border-t border-[#1e3a66]/50 animate-[fadeIn_0.2s_ease-out]">
                      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-2">Agent Reasoning Trace</span>
                      <div className="space-y-2">
                        {alert.reasoning.map((step, idx) => (
                          <div key={idx} className="flex gap-2 text-sm">
                            <span className="text-slate-500 font-mono text-xs mt-0.5">{idx + 1}.</span>
                            <span className="text-slate-300">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  onClick={() => handleDismiss(alert.id)}
                  disabled={processingId !== null}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-4 h-4" />
                  Dismiss
                </button>
                <button 
                  onClick={() => handleApprove(alert.id)}
                  disabled={processingId !== null}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-white bg-success hover:bg-emerald-600 transition-colors disabled:bg-emerald-800 disabled:cursor-not-allowed min-w-[160px]"
                >
                  {processingId === alert.id ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Approve & Send
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-success text-white px-6 py-3 rounded-full shadow-lg font-medium flex items-center gap-2 z-50 animate-[fadeIn_0.3s_ease-out]">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
