
import React, { useState, useEffect } from 'react';
import { MockApi } from '../services/mockBackend';
import { Player, PlayerFilter } from '../types';
import { useLanguage } from '../utils/i18n';
import VsTracker from './VsTracker';
import TrainManager from './TrainManager';
import { CustomDropdown } from './CustomDropdown';
import { useToast } from './Toast';

const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [token, setToken] = useState(localStorage.getItem('asn1_auth_token'));
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'db' | 'vs' | 'train'>('db');
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<PlayerFilter>({ language: 'all', search: '', sort: 'time_desc', activeOnly: false });
  
  // Edit State
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  useEffect(() => { if (token && activeTab === 'db') fetchPlayers(); }, [token, filter, activeTab]);

  const handleLogin = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      setLoading(true); 
      const res = await MockApi.login('admin', password); 
      setLoading(false); 
      if (res.success && res.data) { 
          localStorage.setItem('asn1_auth_token', res.data.token);
          setToken(res.data.token); 
          addToast('success', 'Authenticated as Admin');
      } else { 
          setError(res.error || 'Login failed'); 
      } 
  };

  const handleLogout = () => { 
    MockApi.logout(); 
    setToken(null); 
    addToast('info', 'Logged out');
  };
  
  const fetchPlayers = async () => { 
    setLoading(true); 
    const res = await MockApi.getPlayers(filter); 
    setPlayers(res.items); 
    setTotalCount(res.total || res.items.length);
    setLoading(false); 
  };
  
  const handleDelete = async (id: string) => { 
      if (!window.confirm('Confirm Deletion?')) return; 
      const res = await MockApi.adminDeletePlayer(id);
      if(res.success) {
          addToast('success', 'Player deleted');
          fetchPlayers();
      } else {
          addToast('error', res.error || 'Delete failed');
      }
  };

  const handleToggleActive = async (player: Player) => { 
      await MockApi.adminUpdatePlayer(player.id, { active: !player.active }); 
      fetchPlayers(); 
  };
  
  const formatPower = (val: number | undefined) => { if (!val) return '-'; return (val / 1000000).toLocaleString(undefined, { maximumFractionDigits: 2 }) + 'M'; };

  // --- Edit Logic ---
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

  const handleEditChange = (field: string, value: any) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const saveEdit = async () => {
    if (!editingPlayer) return;
    
    try {
      const normalizePower = (val: any) => (Number(val) || 0) * 1000000;
      
      const payload: Partial<Player> = {
        name: editForm.name,
        language: editForm.language,
        active: editForm.active,
        
        firstSquadPower: normalizePower(editForm.firstSquadPower),
        secondSquadPower: normalizePower(editForm.secondSquadPower),
        thirdSquadPower: normalizePower(editForm.thirdSquadPower),
        fourthSquadPower: normalizePower(editForm.fourthSquadPower),
        totalHeroPower: normalizePower(editForm.totalHeroPower),
        
        heroPercent: Number(editForm.heroPercent),
        duelPercent: Number(editForm.duelPercent),
        unitsPercent: Number(editForm.unitsPercent),
        
        t10Morale: Number(editForm.t10Morale),
        t10Protection: Number(editForm.t10Protection),
        t10Hp: Number(editForm.t10Hp),
        t10Atk: Number(editForm.t10Atk),
        t10Def: Number(editForm.t10Def),
        
        techLevel: Number(editForm.techLevel),
        barracksLevel: Number(editForm.barracksLevel),
        tankCenterLevel: Number(editForm.tankCenterLevel),
        airCenterLevel: Number(editForm.airCenterLevel),
        missileCenterLevel: Number(editForm.missileCenterLevel),
      };

      const res = await MockApi.adminUpdatePlayer(editingPlayer.id, payload);
      if(res.success) {
          addToast('success', 'Player updated');
          setEditingPlayer(null);
          fetchPlayers();
      } else {
          addToast('error', res.error || 'Update failed');
      }
    } catch (e: any) {
      addToast('error', e.message);
    }
  };

  // --- Components ---
  const EditInput = ({ label, field, type="text", step }: any) => (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] uppercase font-bold text-slate-500">{label}</label>
      <input 
        type={type} 
        step={step}
        className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-sky-500 outline-none"
        value={editForm[field] || ''}
        onChange={(e) => handleEditChange(field, e.target.value)}
      />
    </div>
  );

  const EditDropdown = ({ label, field, max }: any) => {
     const options = Array.from({length: max}, (_, i) => ({ value: i + 1, label: String(i + 1) }));
     return (
       <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase font-bold text-slate-500">{label}</label>
          <CustomDropdown 
            value={editForm[field]} 
            onChange={(v) => handleEditChange(field, v)} 
            options={options} 
            color="blue" 
            disableSearch={true}
            className="text-xs"
          />
       </div>
     );
  };

  if (!token) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-[#0f172a] p-10 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-700 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-sky-500 shadow-[0_0_20px_#0ea5e9]"></div>
           <div className="text-center mb-8">
               <h2 className="text-xl font-header font-bold text-white tracking-widest">{t('admin.login.title')}</h2>
           </div>
           {error && <div className="bg-red-950/20 text-red-500 text-xs p-3 rounded mb-4 border border-red-500/20">{error}</div>}
           <form onSubmit={handleLogin} className="space-y-6">
               <div className="relative">
                   <input 
                    name="password"
                    autoComplete="current-password"
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-sky-500 outline-none text-sm transition-all" 
                    placeholder={t('admin.password')} 
                   />
                   <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-3.5 text-slate-500 hover:text-white text-xs uppercase tracking-wider font-bold">{showPassword ? "HIDE" : "SHOW"}</button>
               </div>
               <button className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-lg text-sm tracking-widest transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)]">
                 {loading ? 'Authenticating...' : t('admin.login.btn')}
               </button>
           </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
      <div className="bg-[#0f172a]/80 backdrop-blur-xl p-2 rounded-xl border border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-24 z-40 shadow-2xl">
        <div className="flex items-center gap-2 p-1 bg-slate-900/50 rounded-lg w-full sm:w-auto overflow-x-auto">
             <button onClick={() => setActiveTab('db')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'db' ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>{t('admin.db')}</button>
             <button onClick={() => setActiveTab('vs')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'vs' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>{t('admin.vs')}</button>
             <button onClick={() => setActiveTab('train')} className={`flex-1 sm:flex-none px-6 py-2.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'train' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>{t('admin.train')}</button>
        </div>
        <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 px-4 py-2 rounded-lg hover:bg-rose-500/10 transition-all uppercase tracking-wider w-full sm:w-auto">{t('admin.terminate')}</button>
      </div>

      <div className="min-h-[600px]">
      {activeTab === 'vs' ? ( <VsTracker /> ) : 
       activeTab === 'train' ? ( <TrainManager /> ) : (
          <div className="bg-[#0f172a] rounded-xl border border-slate-700/50 flex flex-col shadow-xl">
                <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row gap-4 bg-slate-900/50">
                     <div className="relative w-full sm:w-64">
                        <input type="text" placeholder={t('admin.filter')} className="bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white focus:border-sky-500 outline-none w-full font-mono transition-all focus:bg-slate-900" value={filter.search} onChange={(e) => setFilter(prev => ({...prev, search: e.target.value}))} />
                        <svg className="w-4 h-4 text-slate-600 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                     </div>
                     
                     <div className="flex gap-2 w-full sm:w-auto">
                        <div className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-400 font-mono flex items-center justify-center whitespace-nowrap min-w-[100px] shadow-inner">
                            {totalCount} Players
                        </div>
                        <button onClick={() => setFilter(prev => ({...prev, activeOnly: !prev.activeOnly}))} className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase border transition-all ${filter.activeOnly ? 'bg-sky-500/10 border-sky-500 text-sky-400' : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                            {filter.activeOnly ? t('admin.active_only') : t('admin.all_records')}
                        </button>
                     </div>
                </div>
                
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-slate-950 text-[10px] uppercase font-bold text-slate-500 tracking-widest border-b border-slate-800">
                            <tr> <th className="px-6 py-4">{t('admin.status')}</th> <th className="px-6 py-4">{t('admin.identity')}</th> <th className="px-6 py-4">{t('label.power')} (M)</th> <th className="px-6 py-4">{t('label.language')}</th> <th className="px-6 py-4 text-right">{t('admin.control')}</th> </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {players.map(player => (
                                <tr key={player.id} className="hover:bg-sky-500/5 transition-colors group">
                                    <td className="px-6 py-4"><button onClick={() => handleToggleActive(player)} className={`w-8 h-4 rounded-full relative transition-colors ${player.active ? 'bg-emerald-900/30 border border-emerald-500/50' : 'bg-slate-800 border border-slate-600'}`}><div className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full transition-transform ${player.active ? 'translate-x-4 bg-emerald-500' : 'bg-slate-500'}`}></div></button></td>
                                    <td className="px-6 py-4 font-medium text-white group-hover:text-sky-300 transition-colors">{player.name}</td>
                                    <td className="px-6 py-4 font-mono text-sky-400 font-bold">{formatPower(player.firstSquadPower)}</td>
                                    <td className="px-6 py-4"><span className="text-[10px] font-bold border border-slate-700 px-2 py-1 rounded bg-slate-800/50 uppercase text-slate-400">{player.language.substring(0,3)}</span></td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => startEdit(player)} className="text-sky-500 hover:text-white bg-sky-500/10 hover:bg-sky-500 border border-sky-500/20 px-3 py-1 rounded text-[10px] font-bold uppercase transition-all">{t('admin.edit')}</button>
                                    <button onClick={() => handleDelete(player.id)} className="text-rose-500 hover:text-white bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 px-3 py-1 rounded text-[10px] font-bold uppercase transition-all">{t('admin.del')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden p-4 space-y-4">
                    {players.map(player => (
                        <div key={player.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex flex-col gap-3 relative overflow-hidden">
                             <div className={`absolute top-0 left-0 w-1 h-full ${player.active ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                             <div className="flex justify-between items-start pl-3">
                                 <div>
                                     <h3 className="text-white font-bold">{player.name}</h3>
                                     <span className="text-[10px] font-mono text-slate-500 uppercase">{player.language}</span>
                                 </div>
                                 <div className="font-mono text-sky-400 text-sm font-bold">
                                     {formatPower(player.firstSquadPower)}
                                 </div>
                             </div>
                             
                             <div className="flex justify-between items-center pl-3 pt-2 border-t border-slate-800">
                                 <div className="flex items-center gap-2">
                                     <span className="text-[10px] uppercase text-slate-500 font-bold">{t('admin.status')}:</span>
                                     <button onClick={() => handleToggleActive(player)} className={`w-8 h-4 rounded-full relative transition-colors ${player.active ? 'bg-emerald-900/30 border border-emerald-500/50' : 'bg-slate-800 border border-slate-600'}`}><div className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full transition-transform ${player.active ? 'translate-x-4 bg-emerald-500' : 'bg-slate-500'}`}></div></button>
                                 </div>
                                 <div className="flex gap-3">
                                     <button onClick={() => startEdit(player)} className="text-sky-500 text-xs font-bold uppercase border border-sky-500/30 px-2 py-1 rounded hover:bg-sky-500/10">{t('admin.edit')}</button>
                                     <button onClick={() => handleDelete(player.id)} className="text-rose-500 text-xs font-bold uppercase border border-rose-500/30 px-2 py-1 rounded hover:bg-rose-500/10">{t('admin.del')}</button>
                                 </div>
                             </div>
                        </div>
                    ))}
                </div>
          </div>
      )}
      </div>

      {/* Full Edit Modal */}
      {editingPlayer && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
           <div className="bg-[#0f172a] w-full max-w-4xl rounded-2xl border border-slate-700 shadow-2xl my-8 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="p-6 border-b border-slate-700 bg-slate-900/50 flex justify-between items-center sticky top-0 z-10 backdrop-blur">
                  <h3 className="text-lg font-header font-bold text-white uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-sky-500 rounded-sm"></span>
                      Editing: <span className="text-sky-400">{editingPlayer.name}</span>
                  </h3>
                  <button onClick={() => setEditingPlayer(null)} className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
                  {/* Section 1: Identity & Power */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4 bg-slate-900/30 p-4 rounded-xl border border-slate-800">
                          <h4 className="text-xs font-bold text-sky-500 uppercase tracking-widest border-b border-slate-800 pb-2">Identity & Powers (M)</h4>
                          <EditInput label="Name" field="name" />
                          <div className="grid grid-cols-2 gap-4">
                              <EditInput label="Squad 1 (M)" field="firstSquadPower" type="number" step="0.1" />
                              <EditInput label="Squad 2 (M)" field="secondSquadPower" type="number" step="0.1" />
                              <EditInput label="Squad 3 (M)" field="thirdSquadPower" type="number" step="0.1" />
                              <EditInput label="Squad 4 (M)" field="fourthSquadPower" type="number" step="0.1" />
                              <div className="col-span-2">
                                <EditInput label="Total Hero Power (M)" field="totalHeroPower" type="number" step="0.1" />
                              </div>
                          </div>
                      </div>

                      <div className="space-y-4 bg-slate-900/30 p-4 rounded-xl border border-slate-800">
                           <h4 className="text-xs font-bold text-sky-500 uppercase tracking-widest border-b border-slate-800 pb-2">Percentages & T10</h4>
                           <div className="grid grid-cols-3 gap-4">
                              <EditInput label="Hero %" field="heroPercent" type="number" />
                              <EditInput label="Duel %" field="duelPercent" type="number" />
                              <EditInput label="Units %" field="unitsPercent" type="number" />
                           </div>
                           <div className="grid grid-cols-3 gap-4 pt-2">
                              <EditDropdown label="Morale" field="t10Morale" max={10} />
                              <EditDropdown label="Prot" field="t10Protection" max={10} />
                              <EditDropdown label="HP" field="t10Hp" max={10} />
                              <EditDropdown label="Atk" field="t10Atk" max={10} />
                              <EditDropdown label="Def" field="t10Def" max={10} />
                           </div>
                      </div>
                  </div>

                  {/* Section 2: Buildings */}
                  <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800">
                      <h4 className="text-xs font-bold text-sky-500 uppercase tracking-widest border-b border-slate-800 pb-2 mb-4">Building Levels</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                          <EditDropdown label="Tech" field="techLevel" max={35} />
                          <EditDropdown label="Barracks" field="barracksLevel" max={35} />
                          <EditDropdown label="Tank" field="tankCenterLevel" max={35} />
                          <EditDropdown label="Air" field="airCenterLevel" max={35} />
                          <EditDropdown label="Missile" field="missileCenterLevel" max={35} />
                      </div>
                  </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-700 bg-slate-900/50 flex justify-end gap-3 sticky bottom-0 z-10 backdrop-blur">
                  <button onClick={() => setEditingPlayer(null)} className="px-6 py-2 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold uppercase tracking-widest transition-colors">Cancel</button>
                  <button onClick={saveEdit} className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-105">Save Changes</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
