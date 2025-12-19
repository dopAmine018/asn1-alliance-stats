
import React, { useState, useEffect, Suspense } from 'react';
import Layout from './components/Layout';
import StatsForm from './components/StatsForm';
import StatsViewer from './components/StatsViewer';
import TrainScheduleViewer from './components/TrainScheduleViewer';
import DesertStormViewer from './components/DesertStormViewer';
import { MockApi } from './services/mockBackend';
import { useLanguage } from './utils/i18n';

const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));

type ViewState = 'home' | 'leaderboard' | 'update' | 'train_public' | 'storm_public';

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
    
    const loadGlobalState = async () => {
        const [settingsData, playersData] = await Promise.all([
            MockApi.getSettings(),
            MockApi.getPlayers({ language: 'all', search: '', sort: 'power_desc', activeOnly: true })
        ]);

        setSettings(prev => ({ ...prev, ...settingsData }));
        
        const total = playersData.items.reduce((acc, p) => acc + (p.firstSquadPower || 0), 0);
        setStats({
            totalPower: (total / 1000000000).toFixed(2),
            count: playersData.items.length
        });
    };

    loadGlobalState();
  }, [refreshTrigger, activeTab]);

  const handleTabChange = (tab: 'public' | 'admin') => {
    setActiveTab(tab);
    if(tab === 'public') setView('home');
  };

  const Landing = () => (
    <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in zoom-in-95 duration-700">
        
        <div className="text-center mb-16 space-y-6 max-w-3xl mx-auto px-4 relative">
             <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-64 h-64 bg-sky-500/10 blur-[100px] -z-10 rounded-full"></div>
             
             <div className="inline-flex items-center gap-4 px-6 py-2 bg-slate-900/40 border border-white/5 rounded-full mb-4 shadow-2xl backdrop-blur-md transition-all">
                 <div className="flex items-center gap-2.5">
                     <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></span>
                     <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">{t('landing.stat.active')}: <span className="text-white font-bold">{stats.count}</span></span>
                 </div>
                 <div className="w-px h-4 bg-slate-800"></div>
                 <div className="flex items-center gap-2.5">
                     <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shadow-[0_0_8px_#0ea5e9]"></span>
                     <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">{t('landing.stat.power')}: <span className="text-white font-bold">{stats.totalPower}B</span></span>
                 </div>
             </div>
             
             <h1 className="text-4xl md:text-7xl font-header font-bold text-white uppercase tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500 drop-shadow-2xl">
                 {t('landing.welcome')}
             </h1>
             <p className="text-slate-500 font-mono text-sm md:text-base tracking-[0.3em] uppercase opacity-80 max-w-xl mx-auto">
                 {t('landing.subtitle')}
             </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl px-4 pb-20">
            {/* Power Sync */}
            <button 
                onClick={() => setView('update')}
                className="group relative h-60 rounded-3xl overflow-hidden border border-white/5 bg-slate-900/30 hover:bg-slate-900/60 transition-all duration-500 hover:border-sky-500/40 hover:shadow-[0_0_50px_rgba(14,165,233,0.1)] text-left p-8 flex flex-col justify-between click-scale"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-400 mb-6 group-hover:bg-sky-500 group-hover:text-white transition-all duration-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </div>
                    <h3 className="text-xl font-header font-bold text-white uppercase tracking-wider mb-2">{t('landing.action.update')}</h3>
                </div>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{t('landing.action.update.desc')}</p>
            </button>

            {/* Leaderboard */}
            <button 
                onClick={() => setView('leaderboard')}
                className="group relative h-60 rounded-3xl overflow-hidden border border-white/5 bg-slate-900/30 hover:bg-slate-900/60 transition-all duration-500 hover:border-emerald-500/40 hover:shadow-[0_0_50px_rgba(16,185,129,0.1)] text-left p-8 flex flex-col justify-between click-scale"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>
                    </div>
                    <h3 className="text-xl font-header font-bold text-white uppercase tracking-wider mb-2">{t('landing.action.view')}</h3>
                </div>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{t('landing.action.view.desc')}</p>
            </button>

            {/* Train Schedule */}
            {settings.show_train_schedule && (
                 <button 
                    onClick={() => setView('train_public')}
                    className="group relative h-60 rounded-3xl overflow-hidden border border-white/5 bg-slate-900/30 hover:bg-slate-900/60 transition-all duration-500 hover:border-amber-500/40 hover:shadow-[0_0_50px_rgba(245,158,11,0.1)] text-left p-8 flex flex-col justify-between click-scale"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-6 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-xl font-header font-bold text-white uppercase tracking-wider mb-2">{t('landing.action.train')}</h3>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{t('landing.action.train.desc')}</p>
                </button>
             )}

            {/* Desert Storm */}
            {settings.show_desert_storm && (
                <button 
                    onClick={() => setView('storm_public')}
                    className="group relative h-60 rounded-3xl overflow-hidden border border-white/5 bg-slate-900/30 hover:bg-slate-900/60 transition-all duration-500 hover:border-purple-500/40 hover:shadow-[0_0_50px_rgba(168,85,247,0.1)] text-left p-8 flex flex-col justify-between click-scale"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute top-6 right-6 z-20">
                        {settings.allow_storm_registration ? (
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[8px] font-bold uppercase tracking-widest animate-pulse">
                                <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                                OPEN
                            </span>
                        ) : (
                            <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-500 text-[8px] font-bold uppercase tracking-widest">
                                SEALED
                            </span>
                        )}
                    </div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:bg-purple-500 group-hover:text-white transition-all duration-500 shadow-xl">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <h3 className="text-xl font-header font-bold text-white uppercase tracking-wider mb-2">Desert Storm</h3>
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest leading-relaxed">Weekly Deployment</p>
                </button>
            )}
        </div>
    </div>
  );

  return (
    <Layout 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
        onHomeClick={() => setView('home')} 
        showHomeBtn={view !== 'home' && activeTab === 'public'}
        onNavigate={(v) => setView(v)}
    >
      {activeTab === 'public' && (
        <div className="w-full relative">
            <div className="fixed top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-sky-500/20 to-transparent z-[110]"></div>
            {view === 'home' && <Landing />}
            {view === 'leaderboard' && <StatsViewer refreshTrigger={refreshTrigger} onBack={() => setView('home')} />}
            {view === 'update' && <StatsForm onSuccess={() => { setRefreshTrigger(p => p + 1); setView('leaderboard'); }} onBack={() => setView('home')} />}
            {view === 'train_public' && <TrainScheduleViewer onBack={() => setView('home')} />}
            {view === 'storm_public' && <DesertStormViewer onBack={() => setView('home')} onCreateProfile={() => setView('update')} allowRegistration={settings.allow_storm_registration} />}
        </div>
      )}

      {activeTab === 'admin' && (
        <Suspense fallback={<div className="h-96 flex flex-col items-center justify-center text-sky-500 gap-6">
            <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] animate-pulse font-bold">Initializing Command...</p>
        </div>}>
            <AdminDashboard />
        </Suspense>
      )}
    </Layout>
  );
};

export default App;
