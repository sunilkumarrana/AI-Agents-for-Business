import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getDeals, calculateKPIs, startDataRefresh, addLiveFluctuation } from '../services/liveDataService';
import { agentsData } from '../lib/mockData';
import type { AgentStatus } from '../lib/mockData';

interface AppContextType {
  deals: any[];
  kpis: any;
  dataSource: string;
  lastUpdated: string | null;
  dealsAtRisk: number;
  decrementDealsAtRisk: () => void;
  refreshData: () => Promise<void>;
  agents: AgentStatus[];
  deployAgent: (agent: AgentStatus) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [deals, setDeals] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any>({ totalValue: "...", atRisk: "...", forecastAccuracy: "...", avgVelocity: "..." });
  const [dataSource, setDataSource] = useState("loading");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentStatus[]>(agentsData);
  
  const [manualRiskOverride, setManualRiskOverride] = useState<number>(0);

  const deployAgent = useCallback((newAgent: AgentStatus) => {
    setAgents(prev => [...prev, newAgent]);
  }, []);

  const loadData = useCallback(async () => {
    const { deals: fetchedDeals, source } = await getDeals();
    const calculatedKpis = calculateKPIs(fetchedDeals);
    
    setDeals(fetchedDeals);
    setKpis(addLiveFluctuation(calculatedKpis));
    setDataSource(source);
    setLastUpdated(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    const cleanup = startDataRefresh(loadData);
    return cleanup;
  }, [loadData]);

  const dealsAtRisk = Math.max(0, (typeof kpis.atRisk === 'number' ? kpis.atRisk : parseInt(kpis.atRisk) || 0) - manualRiskOverride);
  const decrementDealsAtRisk = () => setManualRiskOverride(prev => prev + 1);
  
  return (
    <AppContext.Provider value={{ deals, kpis, dataSource, lastUpdated, dealsAtRisk, decrementDealsAtRisk, refreshData: loadData, agents, deployAgent }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
