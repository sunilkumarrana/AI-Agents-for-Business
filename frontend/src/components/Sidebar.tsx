import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Bell, Users, Bot, Wrench } from 'lucide-react';
import clsx from 'clsx';
import { useAppContext } from '../contexts/AppContext';

export const Sidebar: React.FC = () => {
  const { dataSource } = useAppContext();
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Alerts', path: '/alerts', icon: Bell },
    { name: 'Agents', path: '/agents', icon: Users },
    { name: 'Builder', path: '/builder', icon: Wrench },
  ];

  return (
    <aside className="w-64 bg-[#060D18] border-r border-[#1e3a66] flex flex-col h-screen hidden md:flex sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <Bot className="w-8 h-8 text-accent" />
        <span className="text-xl font-bold tracking-tight text-white">BizMind <span className="text-accent">AI</span></span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 text-sm font-medium',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-slate-400 hover:bg-[#112240] hover:text-white'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 m-4 rounded-xl bg-[#112240] border border-[#1e3a66]">
        <div className="text-xs text-slate-400 mb-2">System Status</div>
        <div className="flex items-center gap-2 text-sm font-medium text-success mb-3">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
          All Agents Active
        </div>
        <div className="text-[11px] text-[#64748b] pt-3 border-t border-[#1e3a66]/50">
          DATA SOURCE
          <div className={clsx(
            "font-semibold mt-1",
            dataSource === "hubspot_live" ? "text-success" : "text-warning"
          )}>
            {dataSource === "hubspot_live" ? "● Live HubSpot" : "● Demo Mode"}
          </div>
        </div>
      </div>
    </aside>
  );
};
