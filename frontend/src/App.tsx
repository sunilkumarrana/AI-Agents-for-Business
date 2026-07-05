import { HashRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ReportsPage } from './pages/ReportsPage';
import { AlertsPage } from './pages/AlertsPage';
import { AgentsPage } from './pages/AgentsPage';
import { AgentBuilderPage } from './pages/AgentBuilderPage';
import BizMindChatbot from './components/BizMindChatbot';
import { AppProvider } from './contexts/AppContext';

function ScrollToHome() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // On first load/refresh, always go to home
    navigate('/');
  }, []); // empty dependency = runs only on mount/refresh
  
  return null;
}

function App() {
  return (
    <AppProvider>
      <Router>
        <ScrollToHome />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<AgentBuilderPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/builder" element={<AgentBuilderPage />} />
          </Route>
        </Routes>
        <BizMindChatbot />
      </Router>
    </AppProvider>
  );
}

export default App;
