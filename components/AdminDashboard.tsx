import React, { useState, useEffect } from 'react';
import { MockApi } from '../services/mockBackend';
import { Player, PlayerFilter } from '../types';
import { useLanguage } from '../utils/i18n';
import VsTracker from './VsTracker';
import TrainManager from './TrainManager';
import DesertStormManager from './DesertStormManager';
import { CustomDropdown } from './CustomDropdown';
import { useToast } from './Toast';

const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [token, setToken] = useState(localStorage.getItem('asn1_auth_token'));
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'db' | 'vs' | 'train' | 'storm' | 'settings'>('db');
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState<PlayerFilter>({ language: 'all', search: '', sort: 'time_desc', activeOnly: false });
  
  // Settings State
  const [settings, setSettings] = useState<Record<string, any>>({
    show_train_schedule: true, show_desert_storm: true, allow_storm_registration: true
  });

  // Edit State
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  useEffect(() => { 
    if (token) {
        if (activeTab === 'db') fetchPlayers();
        if (activeTab === 'settings') fetchSettings();
    }
  }, [token, filter, activeTab]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
        const data = await MockApi.getSettings();
        setSettings(prev => ({ ...prev, ...data }));
    } catch (e) {} finally { setLoading(false); }
  };

  const handleUpdateSetting = async (key: string, value: any) => {
    try {
      await MockApi.updateSetting(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
      addToast('success', `SETTING UPDATED: ${key.toUpperCase()}`);
    } catch (e: any) { addToast('error', `SYNC ERROR: ${e.message}`); }
  };

  const handleLogin = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      setLoading(true); 
      const res = await MockApi.login('admin', password); 
      setLoading(false); 
      if (res.success && res.data) { 
          localStorage.setItem('asn1_auth_token', res.data.token);
          setToken(res.data.token); 
          addToast('success', 'ACCESS GRANTED');
      } else { addToast('error', res.error || 'INVALID ACCESS CODE'); } 
  };

  const handleLogout = () => { 
    MockApi.logout(); 
    setToken(null); 
    addToast('info', 'SESSION TERMINATED');
  };
  
  const fetchPlayers = async () => { 
    setLoading(true); 
    const res = await MockApi.getPlayers(filter); 
    setPlayers(res.items); 
    setTotalCount(res.total || res.items.length);
    setLoading(false); 
  };
  
  const formatPower = (val: number | undefined) => { if (val === undefined || val === null) return '-'; return (val / 1000000).toLocaleString(undefined, { maximumFractionDigits: 1 }) + 'M'; };

  const startEdit = (player: Player) => {
    setEditingPlayer(player);
    setEditForm({
      ...player,
      firstSquadPower: player.firstSquadPower / 1000000,
      secondSquadPower: (player.secondSquadPower || 0) / 1000000,
      thirdSquadPower: (player.thirdSquadPower || 0) / 1000000,
      fourthSquadPower: (player.fourthSquadPower || 0) / 1000000,
      totalHeroPower: (player.totalHeroPower || 0) / 1000000,
    });
  };

  const saveEdit = async () => {
    if (!editingPlayer) return;
    try {
      const normalizePower = (val: any) => {
          const n = Number(val);
          if (isNaN(n) || val === '') return 0;
          return Math.round(n * 1000000);
      };
      const payload: Partial<Player> = {
        name: editForm.name, language: editForm.language, active: editForm.active,
        firstSquadPower: normalizePower(editForm.firstSquadPower),
        secondSquadPower: normalizePower(editForm.secondSquadPower),
        thirdSquadPower: normalizePower(editForm.thirdSquadPower),
        fourthSquadPower: normalizePower(editForm.fourthSquadPower),
        totalHeroPower: normalizePower(editForm.totalHeroPower),
        heroPercent: Number(editForm.heroPercent), duelPercent: Number(editForm.duelPercent), unitsPercent: Number(editForm.unitsPercent),
        t10Morale: Number(editForm.t10Morale), t10Protection: Number(editForm.t10Protection), t10Hp: Number(editForm.t10Hp),
        t10Atk: Number(editForm.t10Atk), t10Def: Number(editForm.t10Def), t10Elite: Number(editForm.t10Elite),
        stsPowerBoost1: Number(editForm.stsPowerBoost1 || 0),
        stsFinalStand1: Number(editForm.stsFinalStand1 || 0),
        stsFierceAssault1: Number(editForm.stsFierceAssault1 || 0),
        stsVigilantFormation1: Number(editForm.stsVigilantFormation1 || 0),
        stsExtraDrillGround: Number(editForm.stsExtraDrillGround || 0),
        stsBarrackExpansion1: Number(editForm.stsBarrackExpansion1 || 0),
        stsFocusedTraining1: Number(editForm.stsFocusedTraining1 || 0),
        stsFinalStand2: Number(editForm.stsFinalStand2 || 0),
        stsFierceAssault2: Number(editForm.stsFierceAssault2 || 0),
        stsVigilantFormation2: Number(editForm.stsVigilantFormation2 || 0),
        stsDrillGroundExpansion: Number(editForm.stsDrillGroundExpansion || 0),
        stsRapidMarch1: Number(editForm.stsRapidMarch1 || 0),
        stsFinalStand3: Number(editForm.stsFinalStand3 || 0),
        stsFierceAssault3: Number(editForm.stsFierceAssault3 || 0),
        stsVigilantFormation3: Number(editForm.stsVigilantFormation3 || 0),
        stsFatalStrike1: Number(editForm.stsFatalStrike1 || 0),
        techLevel: Number(editForm.techLevel), barracksLevel: Number(editForm.barracksLevel),
        tankCenterLevel: Number(editForm.tankCenterLevel), airCenterLevel: Number(editForm.airCenterLevel), missileCenterLevel: Number(editForm.missileCenterLevel),
      };
      const res = await MockApi.adminUpdatePlayer(editingPlayer.id, payload);
      if(res.success) {
          addToast('success', 'PROFILE OVERRIDE COMPLETE');
          setEditingPlayer(null);
          fetchPlayers();
      } else { addToast('error', res.error || 'UPDATE FAILED'); }
    } catch (e: any) { addToast('error', e.message); }
  };

  const SettingsView = () => (
    <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-[#0f172a] rounded-3xl border border-white/5 p-8 shadow-2xl">
          <h3 className="text-xl font-header font-bold text-white uppercase tracking-widest border-b border-white/5 pb-4 mb-8 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-sky-500 rounded-sm"></div>
              System Protocols
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
                { k: 'show_train_schedule', l: 'Train Visibility', d: 'Enable train scheduler for public view.' },
                { k: 'show_desert_storm', l: 'Desert Storm Visibility', d: 'Show Desert Storm tactical roster.' },
                { k: 'allow_storm_registration', l: 'Recruitment Protocol', d: 'Allow operatives to apply for slots.' }
            ].map(item => (
                <div key={item.k} className="p-6 bg-slate-950/40 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-sky-500/20 transition-all duration-300">
                    <div className="pr-4">
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1">{item.l}</h4>
                        <p className="text-[10px] text-slate-500 font-mono italic">{item.d}</p>
                    </div>
                    <button onClick={() => handleUpdateSetting(item.k, !settings[item.k])} className={`w-12 h-6 rounded-full relative transition-all duration-300 ${settings[item.k] ? 'bg-emerald-600 shadow-[0_0_10px_#10b981]' : 'bg-slate-800'}`}>
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${settings[item.k] ? 'translate-x-6' : ''}`} />
                    </button>
                </div>
            ))}
          </div>
      </div>
    </div>
  );

  if (!token) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-700">
        <div className="bg-[#0f172a] p-10 rounded-[2rem] shadow-2xl w-full max-w-sm border border-white/5 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-sky-500 shadow-[0_0_20px_#0ea5e9]"></div>
           <div className="text-center mb-10">
               <h2 className="text-lg font-header font-bold text-white tracking-widest uppercase">{t('admin.login.title')}</h2>
           </div>
           <form onSubmit={handleLogin} className="space-y-6">
               <div className="relative group">
                   <input 
                    name="password"
                    autoComplete="current-password"
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full bg-slate-950 border border-white/5 group-hover:border-sky-500/50 rounded-xl px-5 py-4 text-white focus:border-sky-500 outline-none text-sm transition-all font-mono" 
                    placeholder="ENTER ACCESS KEY" 
                   />
                   <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-4.5 text-slate-600 hover:text-white text-[9px] uppercase tracking-widest font-bold">{showPassword ? "HIDE" : "SHOW"}</button>
               </div>
               <button className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(14,165,233,0.3)]">
                 {loading ? 'VERIFYING...' : t('admin.login.btn')}
               </button>
           </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12">
      <div className="bg-[#0f172a]/95 backdrop-blur-xl p-2 rounded-2xl border border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-24 z-40 shadow-2xl">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/50 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
             {[
                 { id: 'db', label: t('admin.db'), color: 'bg-sky-600' },
                 { id: 'vs', label: t('admin.vs'), color: 'bg-indigo-600' },
                 { id: 'train', label: t('admin.train'), color: 'bg-amber-600' },
                 { id: 'storm', label: 'Desert Storm', color: 'bg-purple-600' },
                 { id: 'settings', label: 'Systems', color: 'bg-slate-700' }
             ].map(tab => (
                 <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id ? `${tab.color} text-white shadow-lg` : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}>
                     {tab.label}
                 </button>
             ))}
        </div>
        <button onClick={handleLogout} className="text-[10px] font-bold text-rose-500 hover:text-white border border-rose-500/20 hover:bg-rose-500 px-6 py-3 rounded-xl transition-all uppercase tracking-widest w-full sm:w-auto">{t('admin.terminate')}</button>
      </div>

      <div className="min-h-[600px] animate-in slide-in-from-bottom-2 duration-500">
      {activeTab === 'vs' ? ( <VsTracker /> ) : 
       activeTab === 'train' ? ( <TrainManager /> ) :
       activeTab === 'storm' ? ( <DesertStormManager /> ) : 
       activeTab === 'settings' ? ( <SettingsView /> ) : (
          <div className="bg-[#0f172a] rounded-3xl border border-white/5 flex flex-col shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row gap-6 bg-slate-950/20 items-center">
                     <div className="relative w-full sm:w-80 group">
                        <input type="text" placeholder={t('admin.filter')} className="bg-slate-950 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-[11px] text-white focus:border-sky-500 outline-none w-full font-mono transition-all" value={filter.search} onChange={(e) => setFilter(prev => ({...prev, search: e.target.value}))} />
                        <svg className="w-4 h-4 text-slate-700 absolute left-4 top-3.5 transition-colors group-focus-within:text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                     </div>
                     <div className="flex gap-4 items-center">
                        <div className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest">
                            TOTAL ASSETS: <span className="text-sky-500">{totalCount}</span>
                        </div>
                        <div className="w-px h-6 bg-slate-800"></div>
                        <button onClick={() => setFilter(prev => ({...prev, activeOnly: !prev.activeOnly}))} className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all ${filter.activeOnly ? 'bg-sky-500/10 border-sky-500 text-sky-400' : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-300'}`}>
                            {filter.activeOnly ? t('admin.active_only') : t('admin.all_records')}
                        </button>
                     </div>
                </div>
                
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-sm text-slate-400">
                        <thead className="bg-slate-950 text-[9px] uppercase font-bold text-slate-600 tracking-widest border-b border-white/5">
                            <tr> <th className="px-8 py-5">{t('admin.status')}</th> <th className="px-8 py-5">{t('label.name')}</th> <th className="px-8 py-5">Power Rating</th> <th className="px-8 py-5">Region</th> <th className="px-8 py-5 text-right">Action</th> </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {players.map(player => (
                                <tr key={player.id} className="hover:bg-sky-500/[0.02] transition-colors group">
                                    <td className="px-8 py-4">
                                        <button onClick={async () => { await MockApi.adminUpdatePlayer(player.id, { active: !player.active }); fetchPlayers(); }} className={`w-8 h-4 rounded-full relative transition-colors ${player.active ? 'bg-emerald-600' : 'bg-slate-800'}`}>
                                            <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${player.active ? 'translate-x-4' : ''}`}></div>
                                        </button>
                                    </td>
                                    <td className="px-8 py-4 font-bold text-white group-hover:text-sky-400 transition-colors">{player.name}</td>
                                    <td className="px-8 py-4 font-mono text-xs text-slate-300">{formatPower(player.firstSquadPower)}</td>
                                    <td className="px-8 py-4"><span className="text-[9px] font-bold border border-white/5 px-2.5 py-1 rounded-lg bg-white/5 uppercase text-slate-500">{player.language}</span></td>
                                    <td className="px-8 py-4 text-right space-x-3">
                                        <button onClick={() => startEdit(player)} className="text-[10px] font-bold text-sky-500 hover:text-white uppercase tracking-widest">{t('admin.edit')}</button>
                                        <button onClick={async () => { if(window.confirm('WIPE DATABASE ENTRY?')) { await MockApi.adminDeletePlayer(player.id); fetchPlayers(); } }} className="text-[10px] font-bold text-rose-500 hover:text-white uppercase tracking-widest">{t('admin.del')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
          </div>
      )}
      </div>

      {/* Manual Override Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
           <div className="bg-[#0f172a] w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95">
              <div className="p-8 border-b border-white/5 bg-slate-900/50 flex justify-between items-center sticky top-0 z-10">
                  <div>
                      <h3 className="text-lg font-header font-bold text-white uppercase tracking-widest">{t('admin.control')}</h3>
                      <p className="text-[10px] text-sky-500 font-mono mt-1 font-bold">TARGET: {editingPlayer.name}</p>
                  </div>
                  <button onClick={() => setEditingPlayer(null)} className="text-slate-500 hover:text-white p-2 hover:bg-white/5 rounded-full transition-all">✕</button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-5">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Profile & Power (M)</label>
                          <input className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-sky-500 outline-none" value={editForm.name} onChange={e => setEditForm(p => ({...p, name: e.target.value}))} />
                          <div className="grid grid-cols-2 gap-4">
                              <div><label className="text-[9px] font-bold text-slate-600 uppercase">Squad 1</label><input type="number" step="0.1" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-mono" value={editForm.firstSquadPower} onChange={e => setEditForm(p => ({...p, firstSquadPower: e.target.value}))} /></div>
                              <div><label className="text-[9px] font-bold text-slate-600 uppercase">Squad 2</label><input type="number" step="0.1" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-mono" value={editForm.secondSquadPower} onChange={e => setEditForm(p => ({...p, secondSquadPower: e.target.value}))} /></div>
                              <div><label className="text-[9px] font-bold text-slate-600 uppercase">Squad 3</label><input type="number" step="0.1" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-mono" value={editForm.thirdSquadPower} onChange={e => setEditForm(p => ({...p, thirdSquadPower: e.target.value}))} /></div>
                              <div><label className="text-[9px] font-bold text-slate-600 uppercase">Squad 4</label><input type="number" step="0.1" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-mono" value={editForm.fourthSquadPower} onChange={e => setEditForm(p => ({...p, fourthSquadPower: e.target.value}))} /></div>
                          </div>
                          <div><label className="text-[9px] font-bold text-slate-600 uppercase">Hero Aggregate</label><input type="number" step="0.1" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs font-mono" value={editForm.totalHeroPower} onChange={e => setEditForm(p => ({...p, totalHeroPower: e.target.value}))} /></div>
                      </div>

                      <div className="space-y-5">
                           <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tech Stats & T10</label>
                           <div className="grid grid-cols-3 gap-3">
                              <div><label className="text-[9px] text-slate-600 font-bold block mb-1">HERO%</label><input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white" value={editForm.heroPercent} onChange={e => setEditForm(p => ({...p, heroPercent: e.target.value}))} /></div>
                              <div><label className="text-[9px] text-slate-600 font-bold block mb-1">DUEL%</label><input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white" value={editForm.duelPercent} onChange={e => setEditForm(p => ({...p, duelPercent: e.target.value}))} /></div>
                              <div><label className="text-[9px] text-slate-600 font-bold block mb-1">UNIT%</label><input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white" value={editForm.unitsPercent} onChange={e => setEditForm(p => ({...p, unitsPercent: e.target.value}))} /></div>
                           </div>
                           <div className="grid grid-cols-2 gap-3">
                              <div><label className="text-[9px] text-slate-600 font-bold block mb-1">MORALE</label><input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white" value={editForm.t10Morale} onChange={e => setEditForm(p => ({...p, t10Morale: e.target.value}))} /></div>
                              <div><label className="text-[9px] text-slate-600 font-bold block mb-1">T10 ELITE</label><select className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white" value={editForm.t10Elite} onChange={e => setEditForm(p => ({...p, t10Elite: e.target.value}))}><option value="0">0 (Locked)</option><option value="10">10 (Max)</option></select></div>
                           </div>
                           <div className="space-y-1">
                                <label className="text-[9px] text-slate-600 font-bold block mb-1">STS LEVELS (0-10)</label>
                                <div className="grid grid-cols-4 gap-1">
                                    {['stsPowerBoost1', 'stsFinalStand1', 'stsFierceAssault1', 'stsVigilantFormation1', 'stsExtraDrillGround', 'stsBarrackExpansion1', 'stsFocusedTraining1', 'stsFinalStand2', 'stsFierceAssault2', 'stsVigilantFormation2', 'stsDrillGroundExpansion', 'stsRapidMarch1', 'stsFinalStand3', 'stsFierceAssault3', 'stsVigilantFormation3', 'stsFatalStrike1'].map(field => (
                                        <div key={field}>
                                            <label className="text-[6px] text-slate-700 block truncate">{field.replace('sts','')}</label>
                                            <input type="number" min="0" max="10" className="w-full bg-slate-950 border border-slate-800 rounded p-1 text-[8px] text-white" value={editForm[field] || 0} onChange={e => setEditForm(p => ({...p, [field]: e.target.value}))} />
                                        </div>
                                    ))}
                                </div>
                           </div>
                      </div>
                  </div>
              </div>

              <div className="p-8 border-t border-white/5 bg-slate-900/50 flex justify-end gap-4 sticky bottom-0 z-10">
                  <button onClick={() => setEditingPlayer(null)} className="px-8 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all">Cancel</button>
                  <button onClick={saveEdit} className="px-8 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold uppercase tracking-widest shadow-xl transition-all">Commit Changes</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;