
import React, { useState, useEffect, Suspense } from 'react';
import Layout from './components/Layout';
import StatsForm from './components/StatsForm';
import StatsViewer from './components/StatsViewer';
import Guidelines from './components/Guidelines';
import TrainScheduleViewer from './components/TrainScheduleViewer';
import DesertStormViewer from './components/DesertStormViewer';
import { MockApi } from './services/mockBackend';
import { Alliance } from './types';
import { useToast } from './components/Toast';

const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));

type View = 'home' | 'leaderboard' | 'update' | 'train' | 'storm' | 'manual' | 'admin';

const GUN1_ALLIANCE: Alliance = {
  id: 'gun1',
  tag: 'GUN1',
  name: 'GUN 1 Alliance',
  adminPass: 'GUN1ADMIN@',
  createdAt: '2025-01-01T00:00:00.000Z'
};

const GUN1Landing: React.FC<{ onView: (v: View) => void }> = ({ onView }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-4">
           <div className="inline-block px-4 py-1.5 rounded-full border border-orange-500/20 bg-orange-500/5 text-orange-500 text-[10px] font-mono font-black uppercase tracking-[0.3em] mb-4">
              Tactical Network Active
           </div>
           <h1 className="text-5xl md:text-7xl font-header font-black text-white uppercase tracking-tight">GUN 1 <span className="text-orange-500">Command</span></h1>
           <p className="text-slate-500 font-mono text-sm tracking-[0.3em] uppercase">Strategic Asset Management Terminal</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl px-4">
          <button 
            onClick={() => onView('update')} 
            className="group bg-slate-900/50 border border-white/10 p-8 rounded-[2rem] hover:border-orange-500 text-left transition-all relative overflow-hidden shadow-2xl h-64 flex flex-col justify-between"
          >
               <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
               <div>
                   <h3 className="text-xl font-header font-black text-white uppercase group-hover:text-orange-400 transition-colors">Sync Stats</h3>
                   <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[0.2em]">Uplink current power dossier</p>
               </div>
               <div className="text-orange-500 opacity-40 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
               </div>
          </button>

          <button 
            onClick={() => onView('leaderboard')} 
            className="group bg-slate-900/50 border border-white/10 p-8 rounded-[2rem] hover:border-emerald-500 text-left transition-all relative overflow-hidden shadow-2xl h-64 flex flex-col justify-between"
          >
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
               <div>
                   <h3 className="text-xl font-header font-black text-white uppercase group-hover:text-emerald-400 transition-colors">Leaderboard</h3>
                   <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[0.2em]">Alliance power rankings</p>
               </div>
               <div className="text-emerald-500 opacity-40 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
               </div>
          </button>

          <button 
            onClick={() => onView('train')} 
            className="group bg-slate-900/50 border border-white/10 p-8 rounded-[2rem] hover:border-sky-500 text-left transition-all relative overflow-hidden shadow-2xl h-64 flex flex-col justify-between"
          >
               <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
               <div>
                   <h3 className="text-xl font-header font-black text-white uppercase group-hover:text-sky-400 transition-colors">Train Schedule</h3>
                   <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-[0.2em]">Logistics rotation</p>
               </div>
               <div className="text-sky-500 opacity-40 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
               </div>
          </button>
      </div>

      <div className="flex gap-4">
          <button onClick={() => onView('storm')} className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest border border-slate-800 px-6 py-3 rounded-xl transition-all hover:bg-slate-800/50">Desert Storm</button>
          <button onClick={() => onView('manual')} className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest border border-slate-800 px-6 py-3 rounded-xl transition-all hover:bg-slate-800/50">Field Manual</button>
      </div>
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');

  return (
    <Layout 
        activeTab={view === 'admin' ? 'admin' : 'public'} 
        onTabChange={(t) => setView(t === 'admin' ? 'admin' : 'home')} 
        onHomeClick={() => setView('home')}
        showHomeBtn={view !== 'home'}
        alliance={GUN1_ALLIANCE}
        onExitAlliance={() => {}}
    >
      {view === 'home' && <GUN1Landing onView={setView} />}
      
      {view === 'leaderboard' && (
        <StatsViewer 
            allianceId="gun1" 
            onBack={() => setView('home')} 
            refreshTrigger={0} 
        />
      )}
      
      {view === 'update' && (
        <StatsForm 
            allianceId="gun1" 
            onSuccess={() => setView('leaderboard')} 
            onBack={() => setView('home')} 
        />
      )}

      {view === 'train' && (
        <TrainScheduleViewer allianceId="gun1" onBack={() => setView('home')} />
      )}

      {view === 'storm' && (
        <DesertStormViewer allianceId="gun1" onBack={() => setView('home')} />
      )}

      {view === 'manual' && (
        <Guidelines onBack={() => setView('home')} />
      )}
      
      {view === 'admin' && (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[40vh] text-orange-500 font-mono text-xs animate-pulse">AUTHORIZING ADMIN ACCESS...</div>}>
            <AdminDashboard alliance={GUN1_ALLIANCE} />
        </Suspense>
      )}
    </Layout>
  );
};

export default App;
