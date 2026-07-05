import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { ReportsPage } from './pages/ReportsPage';
import { AlertsPage } from './pages/AlertsPage';
import { AgentsPage } from './pages/AgentsPage';
import { AgentBuilderPage } from './pages/AgentBuilderPage';
import BizMindChatbot from './components/BizMindChatbot';
import { AppProvider } from './contexts/AppContext';

function RefreshRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Store current path in sessionStorage
    sessionStorage.setItem('lastPage', location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    // On fresh load (not navigation), go to home
    const entries = window.performance.getEntriesByType('navigation');
    if (entries.length > 0) {
      const navigationType = entries[0] as PerformanceNavigationTiming;
      if (navigationType.type === 'reload') {
        navigate('/');
      }
    }
  }, [navigate]);
  
  return null;
}

function App() {
  return (
    <AppProvider>
      <Router>
        <RefreshRedirect />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<Layout />}>
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
