import React, { useState, useEffect } from 'react';
import { VsWeek, VsRecord, Player } from '../types';
import { VsApi, MockApi } from '../services/mockBackend';
import { CustomDropdown } from './CustomDropdown';
import { useLanguage } from '../utils/i18n';
import { useToast } from './Toast';

const VsTracker: React.FC = () => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [weeks, setWeeks] = useState<VsWeek[]>([]);
  const [selectedWeekId, setSelectedWeekId] = useState<string>('');
  const [records, setRecords] = useState<VsRecord[]>([]);
  const [newWeekName, setNewWeekName] = useState('');
  const [showNewWeekModal, setShowNewWeekModal] = useState(false);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState('');

  useEffect(() => { loadWeeks(); loadAllPlayers(); }, []);
  
  // Real-time Polling for Records
  useEffect(() => { 
    if (selectedWeekId) { 
        loadRecords(selectedWeekId); 
        const interval = setInterval(() => { loadRecords(selectedWeekId); }, 3000);
        return () => clearInterval(interval);
    } else { 
        setRecords([]); 
    } 
  }, [selectedWeekId]);

  const loadWeeks = async () => { const data = await VsApi.getWeeks(); data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); setWeeks(data); if (data.length > 0 && !selectedWeekId) { setSelectedWeekId(data[0].id); } };
  const loadAllPlayers = async () => { const res = await MockApi.getPlayers({ language: 'all', search: '', sort: 'power_desc', activeOnly: false }); setAllPlayers(res.items); };
  
  const loadRecords = async (weekId: string) => { const data = await VsApi.getRecords(weekId); setRecords(data); };
  
  const handleCreateWeek = async () => { 
      if (!newWeekName.trim()) return; 
      try {
        const week = await VsApi.createWeek(newWeekName); 
        setNewWeekName(''); 
        setShowNewWeekModal(false); 
        await loadWeeks(); 
        setSelectedWeekId(week.id); 
        addToast('success', 'Duel created');
      } catch (e: any) {
        addToast('error', e.message);
      }
  };

  const handleAddPlayer = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      if (!newPlayerName.trim() || !selectedWeekId) return; 
      try { 
          await VsApi.addPlayerToWeek(selectedWeekId, newPlayerName); 
          setNewPlayerName(''); 
          loadRecords(selectedWeekId); 
          addToast('success', 'Agent injected');
      } catch (err: any) { 
          addToast('error', err.message); 
      } 
  };

  const handleScoreChange = (record: VsRecord, field: keyof VsRecord, value: string) => { const numVal = Number(value); if(isNaN(numVal)) return; const updated = { ...record, [field]: numVal }; setRecords(prev => prev.map(r => r.id === record.id ? updated : r)); VsApi.updateRecord(updated); };
  
  const exportToCSV = () => { if (!records.length) return; const weekName = weeks.find(w => w.id === selectedWeekId)?.name || 'Week'; let csvContent = "data:text/csv;charset=utf-8,Player Name,Mon,Tue,Wed,Thu,Fri,Sat,Total\n"; records.forEach(r => csvContent += `${r.playerName},${r.mon},${r.tue},${r.wed},${r.thu},${r.fri},${r.sat},${r.total}\n`); const encodedUri = encodeURI(csvContent); const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `${weekName.replace(/\s+/g, '_')}_export.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link); };
  const weekOptions = weeks.map(w => ({ value: w.id, label: w.name }));

  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

  return (
    <div className="space-y-6">
        {/* Controls */}
        <div className="bg-[#0f172a] border border-slate-700/50 p-4 rounded-xl flex flex-col sm:flex-row justify-between gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-1.5 z-10">
               <span className="flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
               </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto relative z-30">
                <div className="w-full sm:w-64">
                     <CustomDropdown value={selectedWeekId} onChange={(val) => setSelectedWeekId(String(val))} options={weekOptions} placeholder={t('vs.select')} color="blue" />
                </div>
                <button onClick={() => setShowNewWeekModal(true)} className="whitespace-nowrap bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all">{t('vs.create_btn')}</button>
            </div>
            {selectedWeekId && (
                <button onClick={exportToCSV} className="text-emerald-500 hover:text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all tracking-wider text-center sm:text-left">{t('vs.extract')}</button>
            )}
        </div>

        {/* Modal */}
        {showNewWeekModal && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-[#0f172a] p-6 rounded-xl w-full max-w-sm border border-sky-500/30 shadow-2xl">
                    <h3 className="text-lg font-header font-bold text-white mb-4 uppercase tracking-widest">{t('vs.modal_title')}</h3>
                    <input autoFocus className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none mb-6 focus:border-sky-500" value={newWeekName} onChange={e => setNewWeekName(e.target.value)} placeholder={t('vs.modal_placeholder')} />
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowNewWeekModal(false)} className="px-4 py-2 text-slate-400 hover:text-white text-xs font-bold uppercase">{t('vs.abort')}</button>
                        <button onClick={handleCreateWeek} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase">{t('vs.launch')}</button>
                    </div>
                </div>
            </div>
        )}

        {/* Table */}
        {selectedWeekId ? (
            <div className="bg-[#0f172a] rounded-xl overflow-hidden border border-slate-700/50 flex flex-col">
                <div className="overflow-x-auto custom-scrollbar pb-2">
                    <table className="w-full text-left text-sm text-slate-400 border-collapse whitespace-nowrap">
                        <thead className="bg-slate-950 text-[10px] uppercase font-bold text-slate-500 tracking-widest border-b border-slate-800">
                            <tr>
                                {/* Sticky Agent Column Header with solid bg */}
                                <th className="sticky left-0 z-20 bg-slate-950 px-4 py-3 border-r border-slate-800 w-32 sm:w-48 shadow-[2px_0_10px_rgba(0,0,0,0.5)] text-sky-500">{t('vs.agent')}</th>
                                {days.map(d => ( <th key={d} className="px-1 py-3 text-center border-r border-slate-800 min-w-[60px]">{t(`day.${d}` as any)}</th> ))}
                                <th className="px-4 py-3 text-right font-black text-white min-w-[80px]">{t('vs.sum')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {records.map(r => (
                                <tr key={r.id} className="hover:bg-white/5 transition-colors group">
                                    {/* Sticky Agent Column Body with solid bg */}
                                    <td className="sticky left-0 z-10 bg-[#0f172a] group-hover:bg-[#1e293b] px-4 py-2 font-medium text-slate-300 border-r border-slate-800 shadow-[2px_0_10px_rgba(0,0,0,0.5)] truncate max-w-[120px] sm:max-w-none">{r.playerName}</td>
                                    {days.map((day) => (
                                         <td key={day} className="p-0 border-r border-slate-800 relative">
                                            <input type="number" className="w-full bg-transparent text-center text-white focus:bg-sky-500/10 focus:text-sky-500 outline-none h-full py-2 appearance-none font-mono" value={r[day] || ''} onChange={(e) => handleScoreChange(r, day, e.target.value)} />
                                        </td>
                                    ))}
                                    <td className="px-4 py-2 text-right font-mono font-bold text-sky-500 bg-slate-900/50">{r.total}</td>
                                </tr>
                            ))}
                            <tr className="bg-slate-900/50">
                                <td colSpan={9} className="p-3 border-t border-slate-800 sticky left-0 z-10 bg-slate-900/95">
                                    <form onSubmit={handleAddPlayer} className="flex gap-2">
                                        <input list="players" className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-xs text-white outline-none min-w-[120px] focus:border-sky-500" placeholder={t('vs.add_agent_ph')} value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} />
                                        <datalist id="players">{allPlayers.map(p => <option key={p.id} value={p.name} />)}</datalist>
                                        <button className="text-[10px] bg-slate-800 px-4 py-1.5 rounded text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-700 uppercase font-bold tracking-widest">{t('vs.inject')}</button>
                                    </form>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        ) : ( <div className="py-20 text-center text-slate-500 font-mono text-sm border-dashed border border-slate-800 rounded-xl">{t('vs.awaiting')}</div> )}
    </div>
  );
};

export default VsTracker;