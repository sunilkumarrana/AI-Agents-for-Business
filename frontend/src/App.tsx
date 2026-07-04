
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { ReportsPage } from './pages/ReportsPage';
import { AlertsPage } from './pages/AlertsPage';
import { AgentsPage } from './pages/AgentsPage';
import { AgentBuilderPage } from './pages/AgentBuilderPage';
import BizMindChatbot from './components/BizMindChatbot';
import { AppProvider } from './contexts/AppContext';

function App() {
  return (
    <AppProvider>
      <Router>
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
