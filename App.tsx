
import React, { useState, useEffect, Suspense } from 'react';
import Layout from './components/Layout';
import StatsForm from './components/StatsForm';
import StatsViewer from './components/StatsViewer';
import { MockApi } from './services/mockBackend';
import { useLanguage } from './utils/i18n';

const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));

type ViewState = 'home' | 'leaderboard' | 'update';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'public' | 'admin'>('public');
  const [view, setView] = useState<ViewState>('home');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { t } = useLanguage();
  const [totalPower, setTotalPower] = useState<string>('0');

  useEffect(() => {
    MockApi.initialize();
    // Quick fetch for hero stats
    MockApi.getPlayers({ language: 'all', search: '', sort: 'power_desc', activeOnly: true }).then(res => {
        const total = res.items.reduce((acc, p) => acc + (p.firstSquadPower || 0), 0);
        setTotalPower((total / 1000000000).toFixed(2)); // Billions
    });
  }, [refreshTrigger]);

  const handleFormSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setView('leaderboard'); // Go to leaderboard after update
  };

  const handleTabChange = (tab: 'public' | 'admin') => {
    setActiveTab(tab);
    if(tab === 'public') setView('home');
  };

  // New Landing Component
  const Landing = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in zoom-in-95 duration-700">
        <div className="text-center mb-12 space-y-4">
             <div className="inline-block px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded-full text-sky-400 text-[10px] font-mono font-bold tracking-[0.2em] uppercase mb-4 animate-pulse">
                System Online • Power: {totalPower}B
             </div>
             <h1 className="text-4xl md:text-6xl font-header font-black text-white uppercase tracking-tight leading-none">
                 {t('landing.welcome')}
             </h1>
             <p className="text-slate-400 font-mono text-sm md:text-base tracking-widest uppercase">
                 {t('landing.subtitle')}
             </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
            {/* Update Card */}
            <button 
                onClick={() => setView('update')}
                className="group relative h-64 rounded-3xl overflow-hidden border border-white/10 bg-[#0f172a]/40 hover:bg-[#0f172a]/80 transition-all duration-500 hover:scale-[1.02] hover:border-sky-500/50 hover:shadow-[0_0_40px_rgba(14,165,233,0.15)] text-left p-8 flex flex-col justify-between"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 mb-4 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </div>
                    <h3 className="text-2xl font-header font-bold text-white uppercase tracking-wider">{t('landing.action.update')}</h3>
                </div>
                
                <div className="relative z-10 flex items-end justify-between">
                     <p className="text-xs text-slate-400 font-mono uppercase tracking-widest max-w-[200px]">{t('landing.action.update.desc')}</p>
                     <span className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:border-sky-400 group-hover:text-sky-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                     </span>
                </div>
            </button>

            {/* View Card */}
            <button 
                onClick={() => setView('leaderboard')}
                className="group relative h-64 rounded-3xl overflow-hidden border border-white/10 bg-[#0f172a]/40 hover:bg-[#0f172a]/80 transition-all duration-500 hover:scale-[1.02] hover:border-emerald-500/50 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] text-left p-8 flex flex-col justify-between"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
                    </div>
                    <h3 className="text-2xl font-header font-bold text-white uppercase tracking-wider">{t('landing.action.view')}</h3>
                </div>
                
                <div className="relative z-10 flex items-end justify-between">
                     <p className="text-xs text-slate-400 font-mono uppercase tracking-widest max-w-[200px]">{t('landing.action.view.desc')}</p>
                     <span className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:border-emerald-400 group-hover:text-emerald-400 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                     </span>
                </div>
            </button>
        </div>
    </div>
  );

  return (
    <Layout 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onHomeClick={() => setView('home')} 
        showHomeBtn={view !== 'home' && activeTab === 'public'}
    >
      {activeTab === 'public' && (
        <>
            {view === 'home' && <Landing />}
            {view === 'leaderboard' && <StatsViewer refreshTrigger={refreshTrigger} onBack={() => setView('home')} />}
            {view === 'update' && <StatsForm onSuccess={handleFormSuccess} onBack={() => setView('home')} />}
        </>
      )}

      {activeTab === 'admin' && (
        <Suspense fallback={<div className="h-96 flex items-center justify-center text-sky-500 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Command Module...</div>}>
            <AdminDashboard />
        </Suspense>
      )}
    </Layout>
  );
};

export default App;
