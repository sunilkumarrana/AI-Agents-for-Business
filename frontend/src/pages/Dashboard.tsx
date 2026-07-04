import React, { useState, useEffect, useRef } from 'react';
import { AgentActivityFeed } from '../components/AgentActivityFeed';
import { DollarSign, AlertTriangle, Target, Clock, Bot, Globe, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import clsx from 'clsx';
import { useAppContext } from '../contexts/AppContext';
import { generateInsight } from '../services/geminiService';
import { getMarketTrends } from '../services/tavilyService';
import { buildPipelineContext } from '../services/liveDataService';

const funnelData = [
  { stage: 'Prospecting', value: 85 },
  { stage: 'Qualification', value: 62 },
  { stage: 'Demo', value: 45 },
  { stage: 'Proposal', value: 28 },
  { stage: 'Negotiation', value: 12 },
  { stage: 'Closed', value: 8 },
];

const forecastData = [
  { month: 'Jan', committed: 400000, bestCase: 600000, worstCase: 300000 },
  { month: 'Feb', committed: 550000, bestCase: 800000, worstCase: 450000 },
  { month: 'Mar', committed: 700000, bestCase: 1100000, worstCase: 500000 },
  { month: 'Apr', committed: 950000, bestCase: 1400000, worstCase: 750000 },
  { month: 'May', committed: 1200000, bestCase: 1800000, worstCase: 900000 },
  { month: 'Jun', committed: 1800000, bestCase: 2400000, worstCase: 1200000 },
];

export const Dashboard: React.FC = () => {
  const { dealsAtRisk, deals, kpis } = useAppContext();
  const [insightsList, setInsightsList] = useState<any[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const initialLoadRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    if (deals.length > 0) {
      // Don't show global loader on every 5s background tick if we already have it
      if (!initialLoadRef.current) {
        setIsLoadingInsights(true);
        initialLoadRef.current = true;
      }
      
      const context = buildPipelineContext(deals, kpis);
      generateInsight(
        `Analyse this pipeline and give me the 3 most important insights a sales manager needs to know right now. Focus on risk, opportunity, and velocity.`,
        context
      ).then(result => {
        if (mounted && result.success) {
          setInsightsList(prev => {
            const newList = [...prev];
            const insightObj = {
              id: 'live-pipeline-insight',
              agent: "InsightGeneratorAgent",
              timestamp: "Just now",
              message: result.text,
              isAI: true
            };
            
            const existingIndex = newList.findIndex(i => i.id === 'live-pipeline-insight');
            if (existingIndex >= 0) {
              newList[existingIndex] = insightObj;
            } else {
              // Add to bottom
              newList.push(insightObj);
            }
            return newList;
          });
        }
        if (mounted) setIsLoadingInsights(false);
      });
    }
    return () => { mounted = false; };
  }, [deals, kpis]); // Removed insightsList dependency by just setting loading false unconditionally

  const fetchMarketIntel = async () => {
    setIsLoadingInsights(true);
    const trends = await getMarketTrends();
    if (trends.success && trends.answer) {
      const analysis = await generateInsight(
        `Based on these market trends: "${trends.answer}", what are the implications for our B2B sales pipeline? Give 2 specific actions our sales team should take.`
      );
      if (analysis.success) {
        setInsightsList(prev => [{
          id: Date.now(),
          agent: "InsightGeneratorAgent",
          timestamp: "Just now",
          message: `[Market Intel via Tavily Search]\n\n${analysis.text}`,
          isAI: true,
          sources: trends.results.slice(0, 2).map((r: any) => ({ title: r.title, url: r.url, source: r.source }))
        }, ...prev]);
      }
    }
    setIsLoadingInsights(false);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Top KPI Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Pipeline Value', value: kpis.totalValue, icon: DollarSign, color: 'text-success' },
          { label: 'Deals at Risk', value: dealsAtRisk.toString(), icon: AlertTriangle, color: 'text-danger' },
          { label: 'Forecast Accuracy', value: kpis.forecastAccuracy, icon: Target, color: 'text-accent' },
          { label: 'Avg. Deal Velocity', value: kpis.avgVelocity, icon: Clock, color: 'text-warning' },
        ].map((kpi, i) => (
          <div key={i} className="bg-panel border border-[#1e3a66] rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-slate-400 text-sm mb-1">{kpi.label}</div>
              <div className="text-2xl font-bold text-white">{kpi.value}</div>
            </div>
            <div className={clsx("p-3 rounded-lg bg-[#060D18]", kpi.color)}>
              <kpi.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row gap-6 flex-1 min-h-[400px]">
        {/* Main left panel - Pipeline Health Table */}
        <div className="flex-[2] bg-panel border border-[#1e3a66] rounded-xl p-4 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4">Pipeline Health</h3>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-slate-400 border-b border-[#1e3a66]">
                <tr>
                  <th className="pb-3 font-medium">Deal Name</th>
                  <th className="pb-3 font-medium">Company</th>
                  <th className="pb-3 font-medium">Stage</th>
                  <th className="pb-3 font-medium">Value</th>
                  <th className="pb-3 font-medium">Days</th>
                  <th className="pb-3 font-medium">Health</th>
                  <th className="pb-3 font-medium">Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e3a66]/50">
                {deals.map(deal => (
                  <tr key={deal.id} className="hover:bg-[#060D18] transition-colors cursor-pointer group">
                    <td className="py-3 font-medium text-white">{deal.name}</td>
                    <td className="py-3 text-slate-300">{deal.company}</td>
                    <td className="py-3 text-slate-300">
                      <span className="px-2 py-1 bg-[#1e3a66]/50 rounded text-xs">{deal.stage}</span>
                    </td>
                    <td className="py-3 font-medium text-white">${deal.value.toLocaleString()}</td>
                    <td className="py-3 text-slate-400">{deal.daysInStage}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className={clsx(
                          "w-3 h-3 rounded-full",
                          deal.health === 'healthy' ? 'bg-success shadow-[0_0_8px_#10B981]' : 
                          deal.health === 'watch' ? 'bg-warning shadow-[0_0_8px_#F59E0B]' : 
                          'bg-danger shadow-[0_0_8px_#EF4444]'
                        )}></div>
                        <span className="capitalize text-slate-300 text-xs">{deal.health}</span>
                      </div>
                    </td>
                    <td className="py-3 text-slate-400 text-xs max-w-[200px] truncate group-hover:text-accent transition-colors">
                      {deal.recommendation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Centre panel - Insights Feed */}
        <div className="flex-1 bg-panel border border-[#1e3a66] rounded-xl p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Executive Insights</h3>
            <button 
              onClick={fetchMarketIntel}
              disabled={isLoadingInsights}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#112240] hover:bg-[#1e3a66] text-accent text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoadingInsights ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
              Get Market Intel
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {insightsList.length === 0 && !isLoadingInsights && (
              <div className="text-sm text-slate-400 text-center py-8">Waiting for AI insights...</div>
            )}
            {insightsList.map(insight => (
              <div key={insight.id} className="bg-[#060D18] border border-[#1e3a66]/50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-accent">
                    <Bot className="w-3 h-3" />
                    {insight.agent}
                  </div>
                  <span className="text-xs text-slate-500">{insight.timestamp}</span>
                </div>
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {insight.message}
                </div>
                {insight.sources && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {insight.sources.map((s: any) => (
                      <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] px-2 py-1 rounded-full bg-slate-800 text-blue-400 hover:bg-slate-700 transition-colors no-underline">
                        📰 {s.source}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel - Agent Activity Feed */}
        <div className="flex-[0.8] xl:w-80">
          <AgentActivityFeed />
        </div>
      </div>

      {/* Bottom row - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-80">
        <div className="bg-panel border border-[#1e3a66] rounded-xl p-4 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4">Pipeline Stage Funnel</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a66" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis dataKey="stage" type="category" stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  cursor={{fill: '#112240'}}
                  contentStyle={{ backgroundColor: '#0A1628', borderColor: '#1e3a66', color: '#fff' }}
                />
                <Bar dataKey="value" fill="#2563EB" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-panel border border-[#1e3a66] rounded-xl p-4 flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue Forecast (6M)</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a66" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `$${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0A1628', borderColor: '#1e3a66', color: '#fff' }}
                  formatter={(value: any) => [`$${value / 1000}k`, undefined]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="committed" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} name="Committed" />
                <Line type="monotone" dataKey="bestCase" stroke="#2563EB" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Best Case" />
                <Line type="monotone" dataKey="worstCase" stroke="#EF4444" strokeWidth={2} strokeDasharray="3 3" dot={false} name="Worst Case" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
