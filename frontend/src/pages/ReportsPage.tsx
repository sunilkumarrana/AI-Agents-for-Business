import React, { useState } from 'react';
import { reports } from '../lib/mockData';
import { FileText, Download, Bot, Plus, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { generateReport } from '../services/geminiService';
import { buildPipelineContext } from '../services/liveDataService';

export const ReportsPage: React.FC = () => {
  const { deals, kpis } = useAppContext();
  const [reportList, setReportList] = useState<any[]>(() => {
    const saved = localStorage.getItem('bizmind-reports');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return reports;
      }
    }
    return reports;
  });

  React.useEffect(() => {
    document.title = "BizMind AI — Reports";
    localStorage.setItem('bizmind-reports', JSON.stringify(reportList));
  }, [reportList]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const context = buildPipelineContext(deals, kpis);
      const result = await generateReport(context);
      
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

  const handleDownload = (e: React.MouseEvent, report: any) => {
    e.stopPropagation();
    
    const textContent = report.content || "Report content is currently empty or unavailable.";
    const fullText = `${report.headline}\nDate: ${report.date}\nAgents: ${report.agents.join(", ")}\n\n${textContent}`;
    
    const blob = new Blob([fullText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.headline.replace(/\s+/g, "_").toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Executive Reports</h1>
          <p className="text-slate-400">Auto-generated summaries combining insights across all agents.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setReportList(reports);
              localStorage.removeItem('bizmind-reports');
            }}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white px-3 py-2 transition-colors"
          >
            Reset (demo)
          </button>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-accent hover:bg-blue-500 disabled:bg-blue-900 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                ReportBuilderAgent assembling...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Generate New Report
              </>
            )}
          </button>
        </div>
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
                <button 
                  onClick={(e) => handleDownload(e, report)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-[#1e3a66] rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
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
