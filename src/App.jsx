import { createContext, useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { api } from './api.js';
import Layout from './components/Layout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ApplicationsPage from './pages/ApplicationsPage.jsx';
import ApplicationFormPage from './pages/ApplicationFormPage.jsx';
import ApplicationDetailPage from './pages/ApplicationDetailPage.jsx';
import PricingPage from './pages/PricingPage.jsx';
import { ROLE_DEFAULTS } from './utils.js';

export const AppContext = createContext(null);

export default function App() {
  const [config, setConfig] = useState(null);
  const [role, setRole] = useState(() => localStorage.getItem('demo-role') || 'APPLICANT');
  const [actorName, setActorName] = useState(() => localStorage.getItem('demo-actor') || ROLE_DEFAULTS.APPLICANT);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    api('/config').then(setConfig).catch((error) => setNotice({ type: 'error', message: error.message }));
  }, []);

  useEffect(() => {
    localStorage.setItem('demo-role', role);
    localStorage.setItem('demo-actor', actorName);
  }, [role, actorName]);

  const changeRole = (nextRole) => {
    setRole(nextRole);
    setActorName(ROLE_DEFAULTS[nextRole]);
  };

  const context = useMemo(
    () => ({ config, role, actorName, setActorName, changeRole, notice, setNotice }),
    [config, role, actorName, notice],
  );

  return (
    <AppContext.Provider value={context}>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/applications/new" element={<ApplicationFormPage />} />
          <Route path="/applications/:id" element={<ApplicationDetailPage />} />
          <Route path="/applications/:id/edit" element={<ApplicationFormPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </AppContext.Provider>
  );
}
