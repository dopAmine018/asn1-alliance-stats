import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import StatsForm from './components/StatsForm';
import StatsViewer from './components/StatsViewer';
import AdminDashboard from './components/AdminDashboard';
import { MockApi } from './services/mockBackend';
import { useLanguage } from './utils/i18n';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'public' | 'admin'>('public');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    // Initialize mock database
    MockApi.initialize();
  }, []);

  const handleFormSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'public' && (
        <div className="animate-fade-in space-y-10">
          <section>
             <StatsForm onSuccess={handleFormSuccess} />
          </section>
          <section>
            <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold text-white">{t('viewer.leaderboard')}</h2>
                <div className="h-px flex-1 bg-slate-800"></div>
            </div>
            <StatsViewer refreshTrigger={refreshTrigger} />
          </section>
        </div>
      )}

      {activeTab === 'admin' && (
        <AdminDashboard />
      )}
    </Layout>
  );
};

export default App;