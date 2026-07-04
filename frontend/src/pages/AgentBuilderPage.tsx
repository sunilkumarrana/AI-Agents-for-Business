import React, { useState } from 'react';
import { Check, X, ArrowRight, ArrowRight as ArrowRightIcon, Shield, Lock, Activity, CheckCircle } from 'lucide-react';
import clsx from 'clsx';
import { Link, useNavigate } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useAppContext } from '../contexts/AppContext';

export const AgentBuilderPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sourceSystem, setSourceSystem] = useState('');
  const [targetSystem, setTargetSystem] = useState('');
  const [requirements, setRequirements] = useState('');
  const [agentGoals, setAgentGoals] = useState('');
  const [hasAttemptedContinue, setHasAttemptedContinue] = useState(false);
  const { deployAgent } = useAppContext();
  const navigate = useNavigate();

  const [wireStatus, setWireStatus] = useState<'pending' | 'processing' | 'approved' | 'rejected'>('pending');

  const handleWireAction = (action: 'approved' | 'rejected') => {
    setWireStatus('processing');
    setTimeout(() => {
      setWireStatus(action);
    }, 1000);
  };

  const SMART_TARGETS: Record<string, string[]> = {
    // CRM systems → other CRMs, finance, communication
    Salesforce:      ['HubSpot', 'NetSuite', 'SAP', 'Slack', 'Microsoft 365'],
    HubSpot:         ['Salesforce', 'NetSuite', 'Slack', 'Microsoft 365', 'Jira'],

    // ERP / Finance → other ERP, accounting, CRM
    SAP:             ['Oracle', 'NetSuite', 'Workday', 'Salesforce', 'ServiceNow'],
    Oracle:          ['SAP', 'NetSuite', 'Workday', 'Salesforce', 'Microsoft 365'],
    NetSuite:        ['QuickBooks', 'SAP', 'Oracle', 'Salesforce', 'Microsoft 365'],
    QuickBooks:      ['NetSuite', 'SAP', 'Oracle', 'Microsoft 365', 'Salesforce'],

    // HR / Workforce → ERP, communication
    Workday:         ['SAP', 'Oracle', 'Microsoft 365', 'Slack', 'ServiceNow'],

    // Communication / Collaboration → ticketing, CRM, project tools
    Slack:           ['Jira', 'Microsoft 365', 'ServiceNow', 'Salesforce', 'Zendesk'],
    'Microsoft 365': ['Slack', 'ServiceNow', 'Jira', 'Salesforce', 'SAP'],

    // Ticketing / Support → CRM, communication, ITSM
    Jira:            ['Slack', 'ServiceNow', 'Microsoft 365', 'Salesforce', 'Zendesk'],
    Zendesk:         ['Salesforce', 'HubSpot', 'Jira', 'Slack', 'ServiceNow'],
    ServiceNow:      ['Jira', 'SAP', 'Oracle', 'Microsoft 365', 'Slack'],
  };

  const performanceData = [
    { month: 'Jan', value: 30 },
    { month: 'Feb', value: 40 },
    { month: 'Mar', value: 35 },
    { month: 'Apr', value: 50 },
    { month: 'May', value: 45 },
    { month: 'Jun', value: 60 }
  ];

  const pieData = [
    { name: 'Finance', value: 45, color: '#9333EA' },
    { name: 'Sales/Ops', value: 30, color: '#3B82F6' },
    { name: 'Product', value: 15, color: '#F59E0B' },
    { name: 'Other', value: 10, color: '#64748B' }
  ];

  const integrations = [
    'Salesforce', 'SAP', 'HubSpot', 'Slack',
    'Jira', 'Workday', 'Zendesk', 'Oracle',
    'QuickBooks', 'NetSuite', 'Microsoft 365', 'ServiceNow'
  ];

  const steps = [
    { num: 1, label: 'Connect Systems' },
    { num: 2, label: 'Define Goals' },
    { num: 3, label: 'Configure Agent' },
    { num: 4, label: 'Review & Deploy' }
  ];

  const handleContinue = () => {
    if (step === 2 && agentGoals.trim().length === 0) {
      setHasAttemptedContinue(true);
      return;
    }
    setHasAttemptedContinue(false);
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep(prev => Math.min(prev + 1, 5));
    }, 800);
  };

  const handleDeploy = () => {
    setIsProcessing(true);
    setTimeout(() => {
      deployAgent({
        id: Date.now().toString(),
        name: `${sourceSystem || 'System A'} ↔ ${targetSystem || 'System B'} Sync`,
        role: `Data synchronization & workflow automation`,
        status: 'Active',
        tools: ['sync_data()', 'approve_workflow()'],
        lastAction: 'Just deployed',
        totalActions: 0
      });
      setIsProcessing(false);
      setStep(5);
    }, 1200);
  };

  return (
    <div className="space-y-16 max-w-6xl mx-auto pb-12 pt-8">
      
      {/* Top Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 lg:gap-8 items-start">
        {/* Left: Security & Compliance + HITL Preview */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Enterprise-Grade Security & Compliance</h2>
          <p className="text-slate-400 mb-6">Security is built-in, not bolted on.</p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#121824] border border-[#1e3a66]/40 p-4 rounded-xl flex items-center gap-4">
              <Shield className="w-6 h-6 text-warning" />
              <div>
                <div className="text-white font-bold text-sm">SOC 2</div>
                <div className="text-slate-400 text-xs">Type II Certified</div>
              </div>
            </div>
            <div className="bg-[#121824] border border-[#1e3a66]/40 p-4 rounded-xl flex items-center gap-4">
              <Lock className="w-6 h-6 text-blue-400" />
              <div>
                <div className="text-white font-bold text-sm">GDPR</div>
                <div className="text-slate-400 text-xs">Compliant</div>
              </div>
            </div>
            <div className="bg-[#121824] border border-[#1e3a66]/40 p-4 rounded-xl flex items-center gap-4">
              <Activity className="w-6 h-6 text-blue-300" />
              <div>
                <div className="text-white font-bold text-sm">HIPAA</div>
                <div className="text-slate-400 text-xs">Compliant</div>
              </div>
            </div>
            <div className="bg-[#121824] border border-[#1e3a66]/40 p-4 rounded-xl flex items-center gap-4">
              <CheckCircle className="w-6 h-6 text-slate-300" />
              <div>
                <div className="text-white font-bold text-sm">ISO 27001</div>
                <div className="text-slate-400 text-xs">Certified</div>
              </div>
            </div>
          </div>
          <p className="text-slate-400 text-sm mb-10">
            Your data is encrypted, siloed, and never used to train public models.
          </p>

          <div className="bg-[#121824] border border-[#1e3a66]/40 p-6 rounded-2xl">
            <h2 className="text-xl font-bold text-white mb-1">Human-in-the-Loop (HITL) Preview</h2>
            <p className="text-slate-400 mb-6 text-sm">Critical actions require human approval.</p>
            
            <div className="bg-[#0f1522] border border-[#1e3a66]/60 p-4 rounded-xl flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-[#1e3a66]/40 pb-3">
                <span className="text-white font-semibold text-sm">Pending Action: Wire Transfer</span>
                {wireStatus === 'pending' && <span className="text-[10px] font-bold bg-warning/20 text-warning px-2 py-1 rounded border border-warning/30">REQUIRES REVIEW</span>}
                {wireStatus === 'approved' && <span className="text-[10px] font-bold bg-success/20 text-success px-2 py-1 rounded border border-success/30">APPROVED</span>}
                {wireStatus === 'rejected' && <span className="text-[10px] font-bold bg-danger/20 text-danger px-2 py-1 rounded border border-danger/30">REJECTED</span>}
                {wireStatus === 'processing' && <span className="text-[10px] font-bold bg-accent/20 text-accent px-2 py-1 rounded border border-accent/30">PROCESSING...</span>}
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-300">
                <div><span className="text-slate-500 mr-1">Vendor:</span> Acme Corp</div>
                <div><span className="text-slate-500 mr-1">Invoice:</span> #4092</div>
                <div><span className="text-slate-500 mr-1">Amount:</span> $24,500.00</div>
                <div><span className="text-slate-500 mr-1">Risk Assessment:</span> <span className="text-slate-300">Low</span></div>
              </div>
              {wireStatus === 'pending' ? (
                <div className="flex items-center gap-3 mt-2">
                  <button onClick={() => handleWireAction('approved')} className="flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-lg border border-success/30 bg-success/10 text-success hover:bg-success/20 transition-colors text-sm font-medium">
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => handleWireAction('rejected')} className="flex-1 flex items-center justify-center gap-2 px-6 py-2 rounded-lg border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20 transition-colors text-sm font-medium">
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              ) : wireStatus === 'processing' ? (
                <div className="flex items-center justify-center mt-2 py-2">
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="flex items-center justify-between mt-2 py-1 px-2">
                   <span className={clsx("text-sm font-medium flex items-center gap-2", wireStatus === 'approved' ? 'text-success' : 'text-danger')}>
                     {wireStatus === 'approved' ? <><Check className="w-4 h-4"/> Transfer Approved</> : <><X className="w-4 h-4"/> Transfer Rejected</>}
                   </span>
                   <button onClick={() => setWireStatus('pending')} className="text-xs text-slate-400 hover:text-white transition-colors underline">Reset (demo)</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Analytics & Impact Dashboard */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Analytics & Impact Dashboard</h2>
          <p className="text-slate-400 mb-6">Track real impact with agent performance analytics.</p>
          
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-[#121824] border border-[#1e3a66]/40 p-4 rounded-xl text-center">
              <div className="text-xl font-bold text-[#a855f7] mb-1">14x</div>
              <div className="text-[10px] text-slate-400">Faster Processing</div>
            </div>
            <div className="bg-[#121824] border border-[#1e3a66]/40 p-4 rounded-xl text-center">
              <div className="text-xl font-bold text-warning mb-1">99.2%</div>
              <div className="text-[10px] text-slate-400">Accuracy Rate</div>
            </div>
            <div className="bg-[#121824] border border-[#1e3a66]/40 p-4 rounded-xl text-center">
              <div className="text-xl font-bold text-success mb-1">12,450</div>
              <div className="text-[10px] text-slate-400">Hours Saved</div>
            </div>
            <div className="bg-[#121824] border border-[#1e3a66]/40 p-4 rounded-xl text-center">
              <div className="text-xl font-bold text-success mb-1">$620K</div>
              <div className="text-[10px] text-slate-400">Cost Savings</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#121824] border border-[#1e3a66]/40 p-5 rounded-xl flex flex-col">
              <h3 className="text-white font-semibold text-sm mb-4">Performance Over Time</h3>
              <div className="flex-1 min-h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <Line type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} dot={{ r: 3, fill: "#a855f7" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 mt-2 px-2">
                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
              </div>
            </div>

            <div className="bg-[#121824] border border-[#1e3a66]/40 p-5 rounded-xl flex flex-col justify-between">
              <div>
                <h3 className="text-white font-semibold text-sm mb-4">Hours Saved by Department</h3>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={25}
                          outerRadius={40}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {pieData.map((entry) => (
                      <div key={entry.name} className="flex justify-between items-center text-[10px]">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                          <span className="text-slate-300">{entry.name}</span>
                        </div>
                        <span className="text-slate-400">{entry.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <Link 
                to="/dashboard"
                className="mt-4 w-full bg-[#1e3a66]/30 hover:bg-[#1e3a66]/60 transition-colors text-slate-200 text-xs font-medium py-2.5 rounded-lg flex justify-center items-center gap-2"
              >
                View Full Dashboard <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-start">
        
        {/* Left Column: Integrations */}
        <div className="pt-4">
          <h2 className="text-2xl font-bold text-white mb-1">Seamless Integrations</h2>
          <p className="text-slate-400 mb-8">Our agents connect with the tools you already use.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {integrations.map(name => (
              <button 
                key={name}
                onClick={() => {
                  setSourceSystem(name);
                  setTargetSystem('');
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }}
                className="bg-[#0b101a] border border-[#1e3a66]/40 text-slate-300 text-sm py-3 px-2 rounded-lg hover:bg-[#1e3a66]/20 transition-colors flex items-center justify-center"
              >
                {name}
              </button>
            ))}
          </div>
          
          <p className="text-sm text-slate-500">100+ integrations and growing</p>
        </div>

        {/* Right Column: Agent Builder */}
        <div className="bg-[#121824] border border-[#1e3a66]/40 p-8 rounded-2xl">
          <h2 className="text-2xl font-bold text-white mb-1">Build Your Custom Agent</h2>
          <p className="text-slate-400 mb-8 text-sm">Tell us what you need, we'll build it.</p>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-10 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[1px] bg-[#1e3a66]/40 -z-10"></div>
            {steps.map((s) => {
              const isActive = s.num === step;
              const isPast = s.num < step;
              return (
                <div key={s.num} className="flex items-center gap-2 bg-[#121824] px-2 z-10">
                  <div className={clsx(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border",
                    isActive ? "bg-accent text-white border-accent" : 
                    isPast ? "bg-accent/20 text-accent border-accent/40" : 
                    "bg-[#0b101a] text-slate-500 border-[#1e3a66]/50"
                  )}>
                    {s.num}
                  </div>
                  <span className={clsx(
                    "text-xs hidden md:block",
                    isActive || isPast ? "text-slate-300" : "text-slate-600"
                  )}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Form Content based on Step */}
          {step === 1 && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
              <div>
                <label className="block text-sm text-white mb-3">* Which systems should your agent connect?</label>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">Source System</label>
                    <select 
                      value={sourceSystem}
                      onChange={e => {
                        setSourceSystem(e.target.value);
                        setTargetSystem('');
                      }}
                      className="w-full bg-[#0b101a] border border-[#1e3a66]/50 text-white text-sm rounded-lg px-3 py-2.5 outline-none focus:border-accent"
                    >
                      <option value="">Select a system</option>
                      {integrations.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="mt-5 text-slate-500">
                    <ArrowRightIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">Target System</label>
                    <select 
                      value={targetSystem}
                      onChange={e => setTargetSystem(e.target.value)}
                      disabled={!sourceSystem}
                      className={clsx("w-full bg-[#0b101a] border border-[#1e3a66]/50 text-white text-sm rounded-lg px-3 py-2.5 outline-none focus:border-accent", !sourceSystem && "opacity-50 cursor-not-allowed")}
                    >
                      <option value="">Select a system</option>
                      {sourceSystem && (() => {
                        const recs = (SMART_TARGETS[sourceSystem] || []).filter(opt => opt !== sourceSystem);
                        const others = integrations.filter(opt => opt !== sourceSystem && !recs.includes(opt));
                        return (
                          <>
                            {recs.length > 0 && (
                              <optgroup label="Recommended">
                                {recs.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </optgroup>
                            )}
                            <optgroup label="Other">
                              {others.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </optgroup>
                          </>
                        );
                      })()}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Additional Requirements</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="text" 
                    value={requirements}
                    onChange={e => setRequirements(e.target.value)}
                    placeholder="e.g. Sync new Salesforce leads to HubSpot daily"
                    className="flex-1 bg-[#0b101a] border border-[#1e3a66]/50 text-white text-sm rounded-lg px-3 py-2.5 outline-none focus:border-accent"
                  />
                  <button 
                    onClick={handleContinue}
                    disabled={isProcessing || !sourceSystem || !targetSystem}
                    className="bg-[#9333EA] hover:bg-[#a855f7] text-white text-sm font-medium px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>Continue <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
              <div>
                <label className="block text-sm text-white mb-3">* Define Agent Goals</label>
                <p className="text-xs text-slate-400 mb-2">Describe what this agent should accomplish with the connected systems.</p>
                <textarea 
                  value={agentGoals}
                  onChange={e => {
                    setAgentGoals(e.target.value);
                    if (hasAttemptedContinue) setHasAttemptedContinue(false);
                  }}
                  className={clsx(
                    "w-full h-32 bg-[#0b101a] border text-white text-sm rounded-lg px-3 py-3 outline-none resize-none",
                    hasAttemptedContinue && agentGoals.trim().length === 0 ? "border-danger focus:border-danger" : "border-[#1e3a66]/50 focus:border-accent"
                  )}
                  placeholder="e.g., Automatically sync closed-won deals from Salesforce to NetSuite and generate an invoice..."
                ></textarea>
                {hasAttemptedContinue && agentGoals.trim().length === 0 && (
                  <p className="text-danger text-xs mt-2">Please describe your agent's goals to continue.</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setStep(1)}
                  className="bg-[#1e3a66]/30 hover:bg-[#1e3a66]/50 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors flex-1 md:flex-none"
                >
                  Back
                </button>
                <button 
                  onClick={handleContinue}
                  disabled={isProcessing}
                  className={clsx(
                    "text-white text-sm font-medium px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors min-w-[120px] flex-1 md:flex-none",
                    agentGoals.trim().length === 0 ? "bg-[#9333EA]/50 opacity-70 cursor-not-allowed" : "bg-[#9333EA] hover:bg-[#a855f7]"
                  )}
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>Continue <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
              <div>
                <label className="block text-sm text-white mb-4">* Configure Agent Permissions</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-[#0b101a] border border-[#1e3a66]/40 rounded-lg cursor-pointer hover:border-accent/50 transition-colors">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-accent focus:ring-accent focus:ring-offset-slate-900" defaultChecked />
                    <div>
                      <div className="text-sm text-white font-medium">Require Human Approval (HITL)</div>
                      <div className="text-xs text-slate-400">Agent will pause and request approval before taking destructive actions.</div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-[#0b101a] border border-[#1e3a66]/40 rounded-lg cursor-pointer hover:border-accent/50 transition-colors">
                    <input type="checkbox" className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-accent focus:ring-accent focus:ring-offset-slate-900" defaultChecked />
                    <div>
                      <div className="text-sm text-white font-medium">Real-time Sync</div>
                      <div className="text-xs text-slate-400">Sync data immediately upon trigger event.</div>
                    </div>
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setStep(2)}
                  className="bg-[#1e3a66]/30 hover:bg-[#1e3a66]/50 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors flex-1 md:flex-none"
                >
                  Back
                </button>
                <button 
                  onClick={handleContinue}
                  disabled={isProcessing}
                  className="bg-[#9333EA] hover:bg-[#a855f7] text-white text-sm font-medium px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors min-w-[120px] disabled:opacity-70 flex-1 md:flex-none"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>Continue <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
              <div>
                <label className="block text-sm text-white mb-4">Review & Deploy</label>
                <div className="bg-[#0b101a] border border-[#1e3a66]/40 rounded-lg p-4 space-y-4">
                  <div className="flex justify-between border-b border-[#1e3a66]/30 pb-3">
                    <span className="text-slate-400 text-sm">Connections</span>
                    <span className="text-white text-sm font-medium">{sourceSystem || 'System A'} → {targetSystem || 'System B'}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#1e3a66]/30 pb-3">
                    <span className="text-slate-400 text-sm">Human Approval (HITL)</span>
                    <span className="text-success text-sm font-medium">Enabled</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-sm">Real-time Sync</span>
                    <span className="text-success text-sm font-medium">Enabled</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setStep(3)}
                  className="bg-[#1e3a66]/30 hover:bg-[#1e3a66]/50 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors flex-1 md:flex-none"
                >
                  Back
                </button>
                <button 
                  onClick={handleDeploy}
                  disabled={isProcessing}
                  className="bg-success hover:bg-emerald-600 text-white text-sm font-medium px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors min-w-[120px] disabled:opacity-70 flex-1 md:flex-none"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>Deploy Agent <Check className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          )}

          {step >= 5 && (
            <div className="space-y-6 text-center py-8 animate-[fadeIn_0.3s_ease-out]">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-success" />
              </div>
              <h3 className="text-xl font-bold text-white">Agent Deployed Successfully!</h3>
              <p className="text-slate-400 text-sm">
                Successfully configured and deployed the agent between {sourceSystem || 'System A'} and {targetSystem || 'System B'}.
              </p>
                <button 
                  onClick={() => {
                    setStep(1);
                    navigate('/agents');
                  }}
                  className="mt-4 bg-[#1e3a66]/30 hover:bg-[#1e3a66]/50 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
                >
                  View Active Agents
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
