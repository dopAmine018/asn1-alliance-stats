import React, { useState, useEffect, Suspense } from 'react';
import Layout from './components/Layout';
import StatsForm from './components/StatsForm';
import StatsViewer from './components/StatsViewer';
import { MockApi } from './services/mockBackend';
import { useLanguage } from './utils/i18n';

// Lazy load Admin Dashboard to improve initial load performance for public users
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));

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
    window.scrollTo({ top: 500, behavior: 'smooth' });
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
        <Suspense fallback={
            <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-mono text-sky-500 uppercase tracking-widest">Loading Admin Module...</p>
            </div>
        }>
            <AdminDashboard />
        </Suspense>
      )}
    </Layout>
  );
};

export default App;