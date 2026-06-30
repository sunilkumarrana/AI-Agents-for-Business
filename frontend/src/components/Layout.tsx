import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex bg-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-[#1e3a66] bg-[#060D18]">
          <div className="text-xl font-bold tracking-tight text-white">BizMind <span className="text-accent">AI</span></div>
          <button className="text-slate-400 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
