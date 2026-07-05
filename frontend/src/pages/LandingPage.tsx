import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShieldAlert, FileBarChart, ArrowRight, Bot } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[50%] rounded-full bg-accent/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[50%] rounded-full bg-success/10 blur-[120px]"></div>
      </div>

      <div className="z-10 max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-8">
          <div className="bg-panel p-4 rounded-2xl border border-[#1e3a66] shadow-[0_0_40px_rgba(37,99,235,0.2)]">
            <Bot className="w-16 h-16 text-accent" />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
          Your Autonomous <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-400">
            Revenue Intelligence
          </span> Team
        </h1>
        
        <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-12">
          BizMind AI monitors your pipeline 24/7, flags at-risk deals, and delivers executive-ready insights — powered by Gemini 2.0 Flash multi-agent AI.
        </p>
        
        <Link 
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-accent hover:bg-blue-500 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:scale-105"
        >
          Launch Dashboard
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      <div className="z-10 max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { icon: Activity, title: 'Pipeline Intelligence', desc: 'Real-time analysis of deal velocity, stage progression, and win rates.' },
          { icon: ShieldAlert, title: 'Proactive Alerts', desc: 'Never miss a beat with thresholds that catch stale deals before they drop.' },
          { icon: FileBarChart, title: 'Executive Reports', desc: 'Narrative-driven insights generated automatically for your weekly syncs.' }
        ].map((feature, i) => (
          <div key={i} className="bg-panel/50 backdrop-blur-md border border-[#1e3a66] p-8 rounded-2xl hover:bg-panel transition-colors duration-300">
            <feature.icon className="w-10 h-10 text-accent mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
            <p className="text-slate-400">{feature.desc}</p>
          </div>
        ))}
      </div>

      <footer className="z-10 mt-auto py-8 text-slate-500 text-sm text-center">
        Built with Google ADK 2.0 • Gemini 3.5 Flash • Kaggle Vibe Coding Capstone 2026
      </footer>
    </div>
  );
};
