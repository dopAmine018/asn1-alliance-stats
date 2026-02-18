import React, { useState, useEffect, useRef } from 'react';
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
  const [newPlayerName, setNewPlayerName] = useState('');
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadWeeks(); loadAllPlayers(); }, []);
  
  useEffect(() => { 
    if (selectedWeekId) { 
        loadRecords(selectedWeekId); 
        const interval = setInterval(() => { loadRecords(selectedWeekId); }, 5000);
        return () => clearInterval(interval);
    } else { 
        setRecords([]); 
    } 
  }, [selectedWeekId]);

  const loadWeeks = async () => { const data = await VsApi.getWeeks(); data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); setWeeks(data); if (data.length > 0 && !selectedWeekId) { setSelectedWeekId(data[0].id); } };
  const loadAllPlayers = async () => { await MockApi.getPlayers({ language: 'all', search: '', sort: 'power_desc', activeOnly: false }); };
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

  const handleScoreChange = (record: VsRecord, field: keyof VsRecord, value: string) => { 
      const numVal = Number(value); 
      if(isNaN(numVal)) return; 
      const updated = { ...record, [field]: numVal }; 
      setRecords(prev => prev.map(r => r.id === record.id ? updated : r)); 
      VsApi.updateRecord(updated); 
  };

  const pad = (str: string, length: number) => str.length > length ? str.substring(0, length - 3) + '..' : str.padEnd(length, ' ');

  const copyStandings = async () => {
    if (!records.length) return;
    const weekName = weeks.find(w => w.id === selectedWeekId)?.name || 'Operation';
    let report = `### 🎯 VS STANDINGS: ${weekName.toUpperCase()}\n\`\`\`\n`;
    report += `${pad("RK", 3)} ${pad("AGENT", 15)} ${pad("TOTAL PTS", 10)}\n`;
    report += `${"-".repeat(3)} ${"-".repeat(15)} ${"-".repeat(10)}\n`;

    const sorted = [...records].sort((a, b) => b.total - a.total);
    sorted.forEach((r, i) => {
      report += `${pad((i + 1).toString(), 3)} ${pad(r.playerName.toUpperCase(), 15)} ${pad(r.total.toLocaleString(), 10)}\n`;
    });

    report += `\`\`\`\n*Intelligence gathered from GUN1 Command Terminal*`;

    try {
      await navigator.clipboard.writeText(report);
      addToast('success', 'Tactical Intel Copied');
    } catch (err) {
      addToast('error', 'Clipboard denied');
    }
  };

  const weekOptions = weeks.map(w => ({ value: w.id, label: w.name }));
  const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

  return (
    <div className="space-y-6">
        <div className="bg-[#0f172a] border border-slate-700/50 p-4 rounded-xl flex flex-col sm:flex-row justify-between gap-4 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto relative z-30">
                <div className="w-full sm:w-64">
                     <CustomDropdown value={selectedWeekId} onChange={(val) => setSelectedWeekId(String(val))} options={weekOptions} placeholder={t('vs.select')} />
                </div>
                <button onClick={() => setShowNewWeekModal(true)} className="whitespace-nowrap bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all">{t('vs.create_btn')}</button>
            </div>
            
            {selectedWeekId && (
                <div className="flex gap-2">
                    <button 
                        onClick={copyStandings} 
                        className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white transition-all flex items-center gap-2 shadow-lg click-scale"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Tactical Copy</span>
                    </button>
                </div>
            )}
        </div>

        {showNewWeekModal && (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-[#0f172a] p-6 rounded-xl w-full max-w-sm border border-sky-500/30 shadow-2xl">
                    <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-4">{t('vs.modal_title')}</h3>
                    <input 
                        type="text" 
                        value={newWeekName} 
                        onChange={e => setNewWeekName(e.target.value)} 
                        placeholder={t('vs.modal_placeholder')}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-sky-500 outline-none mb-6"
                    />
                    <div className="flex gap-3">
                        <button onClick={() => setShowNewWeekModal(false)} className="flex-1 px-4 py-3 rounded-lg border border-slate-700 text-slate-400 font-bold uppercase text-[10px] tracking-widest">{t('vs.abort')}</button>
                        <button onClick={handleCreateWeek} className="flex-1 px-4 py-3 rounded-lg bg-sky-600 text-white font-bold uppercase text-[10px] tracking-widest">{t('vs.launch')}</button>
                    </div>
                </div>
            </div>
        )}

        <div className="bg-[#0f172a] rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950/50 border-b border-slate-800">
                <form onSubmit={handleAddPlayer} className="flex gap-2">
                    <input 
                        type="text" 
                        value={newPlayerName} 
                        onChange={e => setNewPlayerName(e.target.value)} 
                        placeholder={t('vs.add_agent_ph')}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-xs text-white focus:border-sky-500 outline-none"
                    />
                    <button type="submit" className="bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold uppercase tracking-widest px-6 py-2 rounded-lg transition-all">{t('vs.inject')}</button>
                </form>
            </div>

            <div className="overflow-x-auto custom-scrollbar" ref={tableRef}>
                <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-950 text-slate-500 font-bold uppercase tracking-widest border-b border-slate-800">
                        <tr>
                            <th className="px-4 py-3">#</th>
                            <th className="px-4 py-3 min-w-[120px]">{t('vs.agent')}</th>
                            {days.map(d => <th key={d} className="px-2 py-3 text-center uppercase">{t(`day.${d}` as any).slice(0,3)}</th>)}
                            <th className="px-4 py-3 text-right text-sky-500">{t('vs.sum')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {records.length > 0 ? [...records].sort((a,b) => b.total - a.total).map((r, i) => (
                            <tr key={r.id} className="hover:bg-sky-500/[0.02] transition-colors group">
                                <td className="px-4 py-3 text-slate-600 font-mono">{i + 1}</td>
                                <td className="px-4 py-3 font-bold text-white">{r.playerName}</td>
                                {days.map(d => (
                                    <td key={d} className="px-2 py-2">
                                        <input 
                                            type="number" 
                                            value={r[d] || 0} 
                                            onChange={e => handleScoreChange(r, d, e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded px-1 py-1 text-center text-slate-300 focus:border-sky-500 outline-none"
                                        />
                                    </td>
                                ))}
                                <td className="px-4 py-3 text-right font-mono font-black text-sky-400 bg-sky-500/5">
                                    {r.total.toLocaleString()}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={9} className="py-20 text-center text-slate-600 font-mono uppercase tracking-[0.2em]">
                                    {t('vs.awaiting')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default VsTracker;