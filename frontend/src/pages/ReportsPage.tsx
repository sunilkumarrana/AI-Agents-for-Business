import React, { useState } from 'react';
import { reports } from '../lib/mockData';
import { FileText, Download, Bot, Plus, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { generateReport } from '../services/geminiService';

export const ReportsPage: React.FC = () => {
  const { deals } = useAppContext();
  const [reportList, setReportList] = useState<any[]>(reports);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const result = await generateReport(deals);
      
      if (result.success) {
        const newReport = {
          id: Date.now().toString(),
          date: new Date().toISOString().split("T")[0],
          headline: `Pipeline Intelligence Report — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
          content: result.text,
          agents: ["ReportBuilderAgent", "InsightGeneratorAgent", "PipelineAnalystAgent"],
          isNew: true
        };
        setReportList(prev => [newReport, ...prev]);
        setExpandedId(newReport.id); // auto-expand the new report
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Executive Reports</h1>
          <p className="text-slate-400">Auto-generated summaries combining insights across all agents.</p>
        </div>
        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-accent hover:bg-blue-500 disabled:bg-blue-900 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              ReportBuilderAgent assembling report...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Generate New Report
            </>
          )}
        </button>
      </div>

      <div className="grid gap-4">
        {reportList.map(report => (
          <div key={report.id} className="bg-panel border border-[#1e3a66] rounded-xl overflow-hidden transition-colors">
            <div 
              onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
              className="p-6 flex items-center justify-between group hover:bg-[#1e3a66]/30 cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#060D18] rounded-lg text-accent">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">{report.date}</div>
                  <h3 className="text-lg font-semibold text-white mb-3">{report.headline}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {report.agents.map((agent: string, i: number) => (
                      <span key={i} className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                        <Bot className="w-3 h-3" />
                        {agent}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button className="p-2 text-slate-400 hover:text-white hover:bg-[#1e3a66] rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                  <Download className="w-5 h-5" />
                </button>
                {report.content && (
                  <div className="text-slate-400 p-2">
                    {expandedId === report.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                )}
              </div>
            </div>
            
            {expandedId === report.id && report.content && (
              <div className="p-6 border-t border-[#1e3a66] bg-[#060D18]/50">
                <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">
                  {report.content}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
