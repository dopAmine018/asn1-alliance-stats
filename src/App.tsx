import React, { useState, Suspense, useEffect } from 'react';
import Layout from '../components/Layout';
import StatsForm from '../components/StatsForm';
import StatsViewer from '../components/StatsViewer';
import TrainScheduleViewer from '../components/TrainScheduleViewer';
import DesertStormViewer from '../components/DesertStormViewer';
import { Alliance } from '../types';
import { MockApi } from '../services/mockBackend';
import { useLanguage } from '../utils/i18n';

const AdminDashboard = React.lazy(() => import('../components/AdminDashboard'));

type View = 'home' | 'leaderboard' | 'update' | 'train' | 'storm' | 'admin';

const ASN1_ALLIANCE: Alliance = {
  id: 'asn1',
  tag: 'ASN1',
  name: 'ASN1 Alliance',
  adminPass: 'Asn1!1628@',
  createdAt: '2025-01-01T00:00:00.000Z'
};

const ASN1Landing: React.FC<{ onView: (v: View) => void }> = ({ onView }) => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex flex-col items-center space-y-8">
              {/* Status Pill */}
              <div className="flex items-center gap-6 px-6 py-2 rounded-full border border-white/10 bg-slate-900/40 backdrop-blur-md shadow-2xl">
                  <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{t('landing.stat.active')}: <span className="text-white">101</span></span>
                  </div>
                  <div className="w-[1px] h-3 bg-white/10"></div>
                  <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_#0ea5e9]"></div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">{t('landing.stat.power')}: <span className="text-white">2.56B</span></span>
                  </div>
              </div>

              <div className="text-center space-y-4">
                  <h1 className="text-6xl md:text-8xl font-header font-black text-white uppercase tracking-tighter leading-none">
                      {t('landing.welcome').split(' ')[0]} <span className="text-sky-500">{t('landing.welcome').split(' ').slice(1).join(' ')}</span>
                  </h1>
                  <p className="text-slate-400 font-header font-bold text-xs md:text-sm tracking-[0.4em] uppercase opacity-80">
                      {t('landing.subtitle')}
                  </p>
              </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl px-4">
            <button 
              onClick={() => onView('update')} 
              className="group relative bg-[#0a0a0f]/80 border border-white/5 p-10 rounded-3xl hover:border-sky-500/50 transition-all duration-500 text-left overflow-hidden shadow-2xl"
            >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-sky-500/5 blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-sky-500/10 transition-colors"></div>
                  <div className="relative z-10 space-y-6">
                      <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </div>
                      <div>
                          <h3 className="text-2xl font-header font-black text-white uppercase tracking-tight group-hover:text-sky-400 transition-colors">{t('landing.action.update')}</h3>
                          <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[0.2em] leading-relaxed">{t('landing.action.update.desc')}</p>
                      </div>
                  </div>
            </button>

            <button 
              onClick={() => onView('leaderboard')} 
              className="group relative bg-[#0a0a0f]/80 border border-white/5 p-10 rounded-3xl hover:border-emerald-500/50 transition-all duration-500 text-left overflow-hidden shadow-2xl"
            >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/10 transition-colors"></div>
                  <div className="relative z-10 space-y-6">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                      </div>
                      <div>
                          <h3 className="text-2xl font-header font-black text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{t('landing.action.view')}</h3>
                          <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[0.2em] leading-relaxed">{t('landing.action.view.desc')}</p>
                      </div>
                  </div>
            </button>

            <button 
              onClick={() => onView('storm')} 
              className="group relative bg-[#0a0a0f]/80 border border-white/5 p-10 rounded-3xl hover:border-purple-500/50 transition-all duration-500 text-left overflow-hidden shadow-2xl"
            >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/10 transition-colors"></div>
                  <div className="absolute top-6 right-6 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                          {t('storm.applying_open')}
                      </span>
                  </div>
                  <div className="relative z-10 space-y-6">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      </div>
                      <div>
                          <h3 className="text-2xl font-header font-black text-white uppercase tracking-tight group-hover:text-purple-400 transition-colors">{t('storm.title')}</h3>
                          <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[0.2em] leading-relaxed">{t('storm.desc')}</p>
                      </div>
                  </div>
            </button>
        </div>

        <div className="flex flex-wrap justify-center gap-6">
            <button onClick={() => onView('train')} className="group flex items-center gap-3 px-8 py-4 bg-slate-900/50 border border-white/5 rounded-2xl hover:border-sky-500/30 transition-all">
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-[0.3em] transition-colors">{t('landing.action.train')}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-sky-500/50 group-hover:bg-sky-500 transition-colors"></div>
            </button>
        </div>
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');

  useEffect(() => {
    MockApi.initialize();
  }, []);

  return (
    <Layout 
        activeTab={view === 'admin' ? 'admin' : 'public'} 
        onTabChange={(t) => setView(t === 'admin' ? 'admin' : 'home')} 
        onHomeClick={() => setView('home')}
        showHomeBtn={view !== 'home'}
        alliance={ASN1_ALLIANCE}
        onExitAlliance={() => {}}
    >
      {view === 'home' && <ASN1Landing onView={setView} />}
      
      {view === 'leaderboard' && (
        <StatsViewer 
            allianceId="asn1" 
            onBack={() => setView('home')} 
            refreshTrigger={0} 
        />
      )}
      
      {view === 'update' && (
        <StatsForm 
            allianceId="asn1" 
            onSuccess={() => setView('leaderboard')} 
            onBack={() => setView('home')} 
        />
      )}

      {view === 'train' && (
        <TrainScheduleViewer allianceId="asn1" onBack={() => setView('home')} />
      )}

      {view === 'storm' && (
        <DesertStormViewer allianceId="asn1" onBack={() => setView('home')} />
      )}
      
      {view === 'admin' && (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[40vh] text-orange-500 font-mono text-xs animate-pulse">AUTHORIZING ADMIN ACCESS...</div>}>
            <AdminDashboard alliance={ASN1_ALLIANCE} />
        </Suspense>
      )}
    </Layout>
  );
};

export default App;
