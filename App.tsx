import React, { useState, useEffect, Suspense } from 'react';
import Layout from './components/Layout';
import StatsForm from './components/StatsForm';
import StatsViewer from './components/StatsViewer';
import TrainScheduleViewer from './components/TrainScheduleViewer';
import DesertStormViewer from './components/DesertStormViewer';
import { MockApi } from './services/mockBackend';
import { useLanguage } from './utils/i18n';
import { Alliance } from './types';

const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));

type ViewState = 'home' | 'leaderboard' | 'update' | 'train_public' | 'storm_public';

const GUN1_ALLIANCE: Alliance = {
  id: 'gun1',
  tag: 'GUN1',
  name: 'GUN 1 Alliance',
  adminPass: 'GUN1ADMIN@',
  createdAt: '2025-01-01T00:00:00.000Z'
};

const GUN1Landing: React.FC<{ onView: (v: ViewState) => void, stats: any }> = ({ onView, stats }) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in zoom-in-95 duration-700">
        <div className="text-center mb-12 space-y-4 max-w-2xl mx-auto">
             <div className="inline-flex items-center gap-4 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-full mb-6">
                 <div className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                     <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">{t('landing.stat.active')}: <span className="text-white font-bold">{stats.count}</span></span>
                 </div>
                 <div className="w-px h-3 bg-slate-800"></div>
                 <div className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
                     <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">{t('landing.stat.power')}: <span className="text-white font-bold">{stats.totalPower}B</span></span>
                 </div>
             </div>
             
             <h1 className="text-4xl md:text-6xl font-header font-black text-white uppercase tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">
                 GUN 1 <span className="text-orange-500">Command</span>
             </h1>
             <p className="text-slate-400 font-mono text-sm md:text-base tracking-widest uppercase">
                 {t('landing.subtitle')}
             </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl px-4">
            <button 
                onClick={() => onView('update')}
                className="group relative h-48 rounded-2xl overflow-hidden border border-white/10 bg-[#0f172a]/60 hover:bg-[#0f172a] transition-all duration-300 hover:border-sky-500/50 hover:shadow-[0_0_30px_rgba(14,165,233,0.1)] text-left p-6 flex flex-col justify-between"
            >
                <div className="relative z-10">
                    <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 mb-3 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </div>
                    <h3 className="text-lg font-header font-bold text-white uppercase tracking-wider">{t('landing.action.update')}</h3>
                </div>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{t('landing.action.update.desc')}</p>
            </button>

            <button 
                onClick={() => onView('leaderboard')}
                className="group relative h-48 rounded-2xl overflow-hidden border border-white/10 bg-[#0f172a]/60 hover:bg-[#0f172a] transition-all duration-300 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] text-left p-6 flex flex-col justify-between"
            >
                <div className="relative z-10">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <h3 className="text-lg font-header font-bold text-white uppercase tracking-wider">{t('landing.action.view')}</h3>
                </div>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{t('landing.action.view.desc')}</p>
            </button>

             {/* Dynamic Settings Toggles would go here if we were using settings from state */}
             <button 
                onClick={() => onView('train_public')}
                className="group relative h-48 rounded-2xl overflow-hidden border border-white/10 bg-[#0f172a]/60 hover:bg-[#0f172a] transition-all duration-300 hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] text-left p-6 flex flex-col justify-between"
            >
                <div className="relative z-10">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 mb-3 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h3 className="text-lg font-header font-bold text-white uppercase tracking-wider">{t('landing.action.train')}</h3>
                </div>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{t('landing.action.train.desc')}</p>
            </button>

            <button 
                onClick={() => onView('storm_public')}
                className="group relative h-48 rounded-2xl overflow-hidden border border-white/10 bg-[#0f172a]/60 hover:bg-[#0f172a] transition-all duration-300 hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)] text-left p-6 flex flex-col justify-between"
            >
                <div className="relative z-10">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-3 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <h3 className="text-lg font-header font-bold text-white uppercase tracking-wider">Desert Storm</h3>
                </div>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Weekly Team Roster</p>
            </button>
        </div>
    </div>
  );
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'public' | 'admin'>('public');
  const [view, setView] = useState<ViewState>('home');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { t } = useLanguage();
  const [stats, setStats] = useState({ totalPower: '0', count: 0 });
  const [settings, setSettings] = useState<Record<string, any>>({
    show_train_schedule: true,
    show_desert_storm: true,
    allow_storm_registration: true
  });

  useEffect(() => {
    MockApi.initialize();
    
    // Fetch Settings
    MockApi.getSettings().then(data => {
      setSettings(prev => ({ ...prev, ...data }));
    });

    // Quick fetch for hero stats
    MockApi.getPlayers({ language: 'all', search: '', sort: 'power_desc', activeOnly: true }).then(res => {
        const total = res.items.reduce((acc, p) => acc + (p.firstSquadPower || 0), 0);
        setStats({
            totalPower: (total / 1000000000).toFixed(2),
            count: res.items.length
        });
    });
  }, [refreshTrigger, activeTab]);

  const handleFormSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setView('leaderboard'); 
  };

  const handleTabChange = (tab: 'public' | 'admin') => {
    setActiveTab(tab);
    if(tab === 'public') setView('home');
  };

  return (
    <Layout 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onHomeClick={() => setView('home')} 
        showHomeBtn={view !== 'home' && activeTab === 'public'}
        onNavigate={(v) => setView(v as any)}
        alliance={GUN1_ALLIANCE}
    >
      {activeTab === 'public' && (
        <>
            {view === 'home' && <GUN1Landing onView={setView} stats={stats} />}
            {view === 'leaderboard' && <StatsViewer refreshTrigger={refreshTrigger} onBack={() => setView('home')} />}
            {view === 'update' && <StatsForm onSuccess={handleFormSuccess} onBack={() => setView('home')} />}
            {view === 'train_public' && <TrainScheduleViewer onBack={() => setView('home')} />}
            {view === 'storm_public' && <DesertStormViewer onBack={() => setView('home')} allowRegistration={settings.allow_storm_registration} />}
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