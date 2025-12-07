
import React, { useState, useEffect } from 'react';
import { MockApi } from '../services/mockBackend';
import { Player, PlayerFilter } from '../types';
import { useLanguage } from '../utils/i18n';
import VsTracker from './VsTracker';

const AdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [token, setToken] = useState(localStorage.getItem('asn1_auth_token'));
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'db' | 'vs'>('db');
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<PlayerFilter>({ language: 'all', search: '', sort: 'time_desc', activeOnly: false });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  useEffect(() => { if (token && activeTab === 'db') fetchPlayers(); }, [token, filter, activeTab]);

  const handleLogin = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); const res = await MockApi.login('admin', password); setLoading(false); if (res.success && res.data) { setToken(res.data.token); } else { setError(res.error || 'Login failed'); } };
  const handleLogout = () => { MockApi.logout(); setToken(null); };
  const fetchPlayers = async () => { setLoading(true); const res = await MockApi.getPlayers(filter); setPlayers(res.items); setLoading(false); };
  const handleDelete = async (id: string) => { if (!window.confirm('Confirm Deletion?')) return; await MockApi.adminDeletePlayer(id); fetchPlayers(); };
  const handleToggleActive = async (player: Player) => { await MockApi.adminUpdatePlayer(player.id, { active: !player.active }); fetchPlayers(); };
  const startEdit = (player: Player) => { setEditingId(player.id); setEditForm({ ...player, firstSquadPower: player.firstSquadPower / 1000000 }); };
  const saveEdit = async () => { if(!editingId) return; const payload = { ...editForm, firstSquadPower: (Number(editForm.firstSquadPower) || 0) * 1000000 }; await MockApi.adminUpdatePlayer(editingId, payload); setEditingId(null); fetchPlayers(); };
  const handleEditChange = (field: keyof Player, value: any) => { setEditForm(prev => ({ ...prev, [field]: value })); };
  const formatPower = (val: number | undefined) => { if (!val) return '-'; return (val / 1000000).toLocaleString(undefined, { maximumFractionDigits: 2 }) + 'M'; };

  if (!token) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="bg-[#0f172a] p-10 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-700 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-sky-500 shadow-[0_0_20px_#0ea5e9]"></div>
           <div className="text-center mb-8">
               <h2 className="text-xl font-header font-bold text-white tracking-widest">{t('admin.login.title')}</h2>
           </div>
           {error && <div className="bg-red-950/20 text-red-500 text-xs p-3 rounded mb-4 border border-red-500/20">{error}</div>}
           <form onSubmit={handleLogin} className="space-y-6">
               <div className="relative">
                   <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-sky-500 outline-none text-sm transition-all" placeholder={t('admin.password')} />
                   <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-3.5 text-slate-500 hover:text-white text-xs uppercase tracking-wider font-bold">{showPassword ? "HIDE" : "SHOW"}</button>
               </div>
               <button className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-lg text-sm tracking-widest transition-all">{t('admin.login.btn')}</button>
           </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0f172a] border border-slate-700">
        <div className="flex items-center gap-2">
             <div className="bg-slate-900 p-1 rounded-lg border border-slate-700 flex">
                 <button onClick={() => setActiveTab('db')} className={`px-6 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'db' ? 'bg-sky-500 text-white' : 'text-slate-500 hover:text-white'}`}>{t('admin.db')}</button>
                 <button onClick={() => setActiveTab('vs')} className={`px-6 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'vs' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white'}`}>{t('admin.vs')}</button>
             </div>
        </div>
        <button onClick={handleLogout} className="text-xs font-bold text-slate-400 hover:text-white border border-slate-700 px-4 py-2 rounded-lg hover:bg-slate-800 transition-all">{t('admin.terminate')}</button>
      </div>

      {activeTab === 'vs' ? ( <VsTracker /> ) : (
          <div className="bg-[#0f172a] rounded-xl overflow-hidden border border-slate-700/50">
                <div className="p-4 border-b border-slate-700/50 flex gap-4 bg-slate-900">
                     <input type="text" placeholder={t('admin.filter')} className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-xs text-white focus:border-sky-500 outline-none w-64 font-mono" value={filter.search} onChange={(e) => setFilter(prev => ({...prev, search: e.target.value}))} />
                     <button onClick={() => setFilter(prev => ({...prev, activeOnly: !prev.activeOnly}))} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase border transition-all ${filter.activeOnly ? 'bg-sky-500 border-sky-500 text-white' : 'bg-transparent border-slate-700 text-slate-400'}`}>{filter.activeOnly ? t('admin.active_only') : t('admin.all_records')}</button>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950 text-[10px] uppercase font-bold text-slate-500 tracking-widest border-b border-slate-800">
                        <tr> <th className="px-6 py-4">{t('admin.status')}</th> <th className="px-6 py-4">{t('admin.identity')}</th> <th className="px-6 py-4">{t('label.power')} (M)</th> <th className="px-6 py-4">{t('label.language')}</th> <th className="px-6 py-4 text-right">{t('admin.control')}</th> </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {players.map(player => {
                            const isEditing = editingId === player.id;
                            return (
                                <tr key={player.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4"><button onClick={() => handleToggleActive(player)} className={`w-8 h-4 rounded-full relative transition-colors ${player.active ? 'bg-emerald-900/30 border border-emerald-500/50' : 'bg-slate-800 border border-slate-600'}`}><div className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full transition-transform ${player.active ? 'translate-x-4 bg-emerald-500' : 'bg-slate-500'}`}></div></button></td>
                                    <td className="px-6 py-4 font-medium text-white">{isEditing ? (<input className="bg-slate-900 border border-sky-500 rounded px-2 py-1 w-full text-white outline-none" value={editForm.name} onChange={(e) => handleEditChange('name', e.target.value)} />) : player.name}</td>
                                    <td className="px-6 py-4 font-mono text-sky-400">{isEditing ? (<input type="number" step="0.1" className="bg-slate-900 border border-sky-500 rounded px-2 py-1 w-24 text-white outline-none" value={editForm.firstSquadPower} onChange={(e) => handleEditChange('firstSquadPower', e.target.value)} />) : formatPower(player.firstSquadPower)}</td>
                                    <td className="px-6 py-4"><span className="text-[10px] font-bold border border-slate-700 px-2 py-1 rounded bg-slate-800 uppercase">{player.language.substring(0,3)}</span></td>
                                    <td className="px-6 py-4 text-right space-x-2">{isEditing ? (<><button onClick={saveEdit} className="text-emerald-500 hover:text-emerald-400 text-xs font-bold uppercase">{t('admin.save')}</button><button onClick={() => setEditingId(null)} className="text-slate-500 hover:text-slate-400 text-xs font-bold uppercase">{t('admin.cancel')}</button></>) : (<><button onClick={() => startEdit(player)} className="text-sky-500 hover:text-sky-400 text-xs font-bold uppercase">{t('admin.edit')}</button><button onClick={() => handleDelete(player.id)} className="text-rose-500 hover:text-rose-400 text-xs font-bold uppercase">{t('admin.del')}</button></>)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                </div>
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;
