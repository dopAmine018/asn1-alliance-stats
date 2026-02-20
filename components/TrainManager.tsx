import React, { useState, useEffect, useRef } from 'react';
import { Player } from '../types';
import { MockApi, TrainApi } from '../services/mockBackend';
import { calculateT10RemainingCost } from '../utils/gameLogic';
import { useLanguage } from '../utils/i18n';
import { useToast } from './Toast';

interface EnrichedPlayer extends Player {
    remainingGold: number;
    remainingFood: number;
    remainingValor: number;
    totalCostScore: number; // Used for sorting
}

interface TrainDay {
    dayName: string;
    conductor: EnrichedPlayer | null;
    vip: EnrichedPlayer | null;
    mode: 'VIP' | 'Guardian'; // VIP: Conductor Defends. Guardian: VIP Defends.
    defender: EnrichedPlayer | null;
}

const PlayerSearchInput = ({ value, onChange, placeholder, candidates, onEnter }: { value: string, onChange: (v: string) => void, placeholder: string, candidates: EnrichedPlayer[], onEnter: () => void }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    const suggestions = value.length > 1 
        ? candidates.filter(p => p.name.toLowerCase().includes(value.toLowerCase())).slice(0, 5) 
        : [];

    return (
        <div className="relative w-full">
            <input 
                type="text" 
                value={value} 
                onChange={(e) => { onChange(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={(e) => e.key === 'Enter' && onEnter()}
                placeholder={placeholder}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:border-sky-500 outline-none font-bold placeholder-slate-600"
            />
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-[#0f172a] border border-slate-700 shadow-xl z-50 rounded-b max-h-40 overflow-y-auto">
                    {suggestions.map(s => (
                        <div 
                            key={s.id} 
                            className="px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer border-b border-slate-800 last:border-0 flex justify-between items-center"
                            onMouseDown={() => { onChange(s.name); setShowSuggestions(false); }}
                        >
                            <span className="font-bold">{s.name}</span>
                            <span className="font-mono text-[9px] text-sky-500">{(s.firstSquadPower/1000000).toFixed(1)}M</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const TrainManager: React.FC = () => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [candidates, setCandidates] = useState<EnrichedPlayer[]>([]);
  const [schedule, setSchedule] = useState<TrainDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isManualMode, setIsManualMode] = useState(false);
  const [editingDayIdx, setEditingDayIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ conductorName: string, vipName: string }>({ conductorName: '', vipName: '' });

  const hasRestoredRef = useRef(false);

  useEffect(() => {
      fetchAndAnalyze();
      const interval = setInterval(fetchAndAnalyze, 15000);
      return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      if (candidates.length > 0) {
          if (editingDayIdx !== null) return;
          
          setSchedule(prevSchedule => {
              if (prevSchedule.length === 0) return prevSchedule;

              return prevSchedule.map(day => {
                const newConductor = day.conductor ? candidates.find(c => c.id === day.conductor!.id) || day.conductor : null;
                const newVip = day.vip ? candidates.find(c => c.id === day.vip!.id) || day.vip : null;
                
                let mode: 'VIP' | 'Guardian' = 'VIP';
                let defender = null;

                if (newConductor && newVip) {
                    if (newConductor.firstSquadPower >= newVip.firstSquadPower) {
                        mode = 'VIP';
                        defender = newConductor;
                    } else {
                        mode = 'Guardian';
                        defender = newVip;
                    }
                } else if (newConductor) {
                    defender = newConductor;
                } else if (newVip) {
                    mode = 'Guardian';
                    defender = newVip;
                }

                return {
                    ...day,
                    conductor: newConductor,
                    vip: newVip,
                    defender,
                    mode
                };
            });
          });
      }
  }, [candidates]);

  const fetchAndAnalyze = async () => {
      if (candidates.length === 0) setLoading(true);
      
      try {
          const res = await MockApi.getPlayers({ language: 'all', search: '', sort: 'power_desc', activeOnly: false });
          
          const enriched: EnrichedPlayer[] = res.items.map(p => {
              const cost = calculateT10RemainingCost(p);
              return {
                  ...p,
                  remainingGold: cost.gold,
                  remainingFood: cost.foodIron,
                  remainingValor: cost.valor,
                  totalCostScore: cost.gold
              };
          });

          const sorted = enriched.sort((a, b) => {
              if (a.remainingGold === 0 && b.remainingGold === 0) {
                  return b.firstSquadPower - a.firstSquadPower;
              }
              if (a.remainingGold === 0) return 1;
              if (b.remainingGold === 0) return -1;
              return a.totalCostScore - b.totalCostScore;
          });

          setCandidates(sorted);
          
          if (editingDayIdx === null) {
              const savedScheduleData = await TrainApi.getSchedule();
              
              if (savedScheduleData) {
                  try {
                      const restoredSchedule: TrainDay[] = savedScheduleData.schedule.map((d: any) => {
                          const conductor = sorted.find(p => p.id === d.conductorId) || null;
                          const vip = sorted.find(p => p.id === d.vipId) || null;
                          let mode: 'VIP' | 'Guardian' = 'VIP';
                          let defender = null;
                          if (conductor && vip) {
                            if (conductor.firstSquadPower >= vip.firstSquadPower) { mode = 'VIP'; defender = conductor; }
                            else { mode = 'Guardian'; defender = vip; }
                          } else if (conductor) defender = conductor;
                          else if (vip) { mode = 'Guardian'; defender = vip; }

                          return {
                              dayName: d.dayName,
                              conductor,
                              vip,
                              mode,
                              defender
                          };
                      });
                      
                      const currentJSON = JSON.stringify(schedule.map(d => ({c: d.conductor?.id, v: d.vip?.id})));
                      const newJSON = JSON.stringify(restoredSchedule.map(d => ({c: d.conductor?.id, v: d.vip?.id})));
                      
                      if (currentJSON !== newJSON) {
                          setSchedule(restoredSchedule);
                          setIsManualMode(true);
                          if (!hasRestoredRef.current && schedule.length === 0) {
                              addToast('info', 'Synced with Alliance Command');
                              hasRestoredRef.current = true;
                          }
                      }
                  } catch (e) {
                      console.error("Failed to restore schedule", e);
                  }
              }
          }
      } catch(e) {
          console.error("Failed to fetch players", e);
      } finally {
          setLoading(false);
      }
  };

  const handleAutoDeploy = async () => {
    if (!candidates.length) return;
    if (!window.confirm("AUTO-DEPLOY ENGINE:\nThis will analyze current T10 progress and squad power to generate the most efficient weekly rotation.\n\nOverwrite existing schedule?")) return;

    setLoading(true);
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    
    // Algorithm: Find players who need T10, sort by closest (lowest gold)
    // Only use active players
    const activeCandidates = candidates.filter(p => p.active);
    
    if (activeCandidates.length < 2) {
        addToast('error', 'Insufficient active agents for deployment');
        setLoading(false);
        return;
    }

    const newSchedule: TrainDay[] = [];

    for (let i = 0; i < 7; i++) {
        // Simple rotation for the demo, but logic prioritized T10-seekers
        const pairIndex = Math.floor(i / 2) % Math.max(1, Math.floor(activeCandidates.length / 2));
        const p1 = activeCandidates[pairIndex * 2];
        const p2 = activeCandidates[pairIndex * 2 + 1];

        if (!p1 || !p2) {
            newSchedule.push({ dayName: days[i], conductor: null, vip: null, mode: 'VIP', defender: null });
            continue;
        }

        const isSwap = i % 2 !== 0; 
        let conductor = isSwap ? p2 : p1;
        let passenger = isSwap ? p1 : p2;

        let mode: 'VIP' | 'Guardian' = 'VIP';
        let defender = conductor;

        if (conductor.firstSquadPower < passenger.firstSquadPower) {
            mode = 'Guardian';
            defender = passenger;
        }

        newSchedule.push({
            dayName: days[i],
            conductor,
            vip: passenger,
            mode,
            defender
        });
    }

    setSchedule(newSchedule);
    await pushScheduleToCloud(newSchedule);
    addToast('success', 'Tactical Auto-Deployment Synchronized');
    setLoading(false);
  };

  const pushScheduleToCloud = async (newSchedule: TrainDay[]) => {
      try {
          const payload = {
              timestamp: Date.now(),
              schedule: newSchedule.map(d => ({
                  dayName: d.dayName,
                  conductorId: d.conductor?.id,
                  vipId: d.vip?.id
              }))
          };
          await TrainApi.saveSchedule(payload);
      } catch (e: any) {
          addToast('error', 'Failed to sync schedule');
      }
  };

  const startEdit = (idx: number) => {
      const day = schedule[idx];
      setEditForm({
          conductorName: day.conductor?.name || '',
          vipName: day.vip?.name || ''
      });
      setEditingDayIdx(idx);
  };

  const saveEdit = async (idx: number) => {
      const findPlayer = (name: string) => {
          if (!name || !name.trim()) return null;
          const normalizedInput = name.trim().toLowerCase();
          return candidates.find(p => p.name.trim().toLowerCase() === normalizedInput) || null;
      };
      
      const userInputConductor = findPlayer(editForm.conductorName);
      const userInputVip = findPlayer(editForm.vipName);

      if (editForm.conductorName.trim() && !userInputConductor) {
          addToast('error', `Player "${editForm.conductorName}" not found!`);
          return;
      }
      if (editForm.vipName.trim() && !userInputVip) {
          addToast('error', `Player "${editForm.vipName}" not found!`);
          return;
      }

      let pairGroupIndices: number[] = [];
      if (idx === 0 || idx === 1 || idx === 6) pairGroupIndices = [0, 1, 6];
      else if (idx === 2 || idx === 3) pairGroupIndices = [2, 3];
      else if (idx === 4 || idx === 5) pairGroupIndices = [4, 5];

      const isSwapDay = idx % 2 !== 0; 
      
      let p1: EnrichedPlayer | null = null;
      let p2: EnrichedPlayer | null = null;

      if (!isSwapDay) {
          p1 = userInputConductor;
          p2 = userInputVip;
      } else {
          p1 = userInputVip;
          p2 = userInputConductor;
      }

      const newSchedule = [...schedule];

      pairGroupIndices.forEach(dayIndex => {
          const isThisDaySwap = dayIndex % 2 !== 0; 
          
          let dayConductor = isThisDaySwap ? p2 : p1;
          let dayVip = isThisDaySwap ? p1 : p2;

          let mode: 'VIP' | 'Guardian' = 'VIP';
          let defender = null;

          if (dayConductor && dayVip) {
              if (dayConductor.firstSquadPower >= dayVip.firstSquadPower) {
                  mode = 'VIP';
                  defender = dayConductor;
              } else {
                  mode = 'Guardian';
                  defender = dayVip;
              }
          } else if (dayConductor) {
              defender = dayConductor;
          } else if (dayVip) {
              mode = 'Guardian';
              defender = dayVip;
          }

          newSchedule[dayIndex] = {
              ...newSchedule[dayIndex],
              conductor: dayConductor,
              vip: dayVip,
              mode,
              defender
          };
      });

      setSchedule(newSchedule);
      setIsManualMode(true);
      setEditingDayIdx(null);
      await pushScheduleToCloud(newSchedule);
      addToast('success', 'Schedule updated & synced');
  };

  const cancelEdit = () => {
      setEditingDayIdx(null);
  };

  const handleManualSync = async () => {
      if (schedule.length > 0) {
          await pushScheduleToCloud(schedule);
          addToast('success', 'Forced Push Complete');
      }
      fetchAndAnalyze();
  };

  const copyTacticalOrders = async () => {
      if (schedule.length === 0) return;
      let report = `### 🚆 GUN 1 Train Schedule\n\`\`\`\n`;
      
      schedule.forEach(day => {
          const dayLabel = t(`day.${day.dayName}` as any);
          const condName = day.conductor?.name || "TBD";
          const condPwr = day.conductor ? `(${(day.conductor.firstSquadPower / 1000000).toFixed(1)}M)` : "";
          
          const vipName = day.vip?.name || "TBD";
          const vipPwr = day.vip ? `(${(day.vip.firstSquadPower / 1000000).toFixed(1)}M)` : "";
          
          report += `📅 ${dayLabel}\n`;
          report += `👑 Conductor: ${condName} ${condPwr}\n`;
          
          if (day.mode === 'Guardian') {
              report += `🛡️ Guardian: ${vipName} ${vipPwr}\n`;
          } else {
              report += `💎 Passenger: ${vipName} ${vipPwr}\n`;
          }
          report += `${"-".repeat(23)}\n`;
      });
      
      report += `\`\`\`\n*Generated by GUN 1 Command Terminal*`;

      try {
          await navigator.clipboard.writeText(report);
          addToast('success', 'Tactical Orders Copied');
      } catch (err) {
          addToast('error', 'Clipboard denied');
      }
  };

  const formatNumber = (num: number) => {
      if (num === 0) return "DONE";
      if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
      return num.toString();
  };
  
  const DefenderShield = () => (
      <span className="inline-flex items-center gap-1 bg-blue-900/40 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ml-2 animate-pulse">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          DEF
      </span>
  );

  const filteredCandidates = candidates.filter(c => 
     c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
        <div className="bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-amber-500 p-6 rounded-r-xl flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="w-full">
                <h2 className="text-xl font-header font-bold text-white uppercase tracking-widest flex items-center gap-3">
                    {t('train.title')}
                </h2>
                <p className="text-xs text-slate-400 mt-2 font-mono uppercase tracking-widest">Strategic Train Distribution Logic</p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
                <button 
                    onClick={handleAutoDeploy}
                    disabled={loading}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 click-scale border border-amber-400/20"
                >
                    <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Auto Deploy</span>
                </button>
                <button 
                    onClick={copyTacticalOrders} 
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-900/20 click-scale border border-sky-400/20"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Tactical Copy</span>
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#0f172a] border border-slate-700 rounded-xl overflow-hidden flex flex-col h-[600px]">
                <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center gap-2">
                    <div className="flex flex-col">
                        <h3 className="text-sm font-bold text-sky-500 uppercase tracking-widest">{t('train.candidates')}</h3>
                        <div className="text-[10px] text-slate-500 font-mono">{candidates.length} Found</div>
                    </div>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder={t('train.search')} 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-sky-500 outline-none w-32 sm:w-48 font-mono"
                        />
                    </div>
                </div>
                
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950 text-[9px] uppercase font-bold text-slate-500 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3">#</th>
                                <th className="px-4 py-3">{t('admin.identity')}</th>
                                <th className="px-4 py-3 text-center">T10 Adv</th>
                                <th className="px-4 py-3 text-right">Gold</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-sm">
                            {filteredCandidates.map((p, idx) => (
                                <tr key={p.id} className={`hover:bg-white/5 transition-colors ${p.remainingGold === 0 ? 'opacity-40' : ''}`}>
                                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{idx + 1}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-white flex items-center gap-2">
                                            {p.name}
                                            <span className={`text-[9px] font-mono ${p.active ? 'text-sky-500' : 'text-slate-600'}`}>{(p.firstSquadPower/1000000).toFixed(1)}M {!p.active && '(MIA)'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center gap-1 text-[9px] font-mono">
                                            <span className="bg-sky-900/40 text-sky-400 px-1 rounded">{p.t10Protection || 0}</span>
                                            <span className="bg-emerald-900/40 text-emerald-400 px-1 rounded">{p.t10Hp || 0}</span>
                                            <span className="bg-rose-900/40 text-rose-400 px-1 rounded">{p.t10Atk || 0}</span>
                                        </div>
                                    </td>
                                    <td className={`px-4 py-3 text-right font-mono font-bold ${p.remainingGold === 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {formatNumber(p.remainingGold)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex flex-col h-[600px] gap-4">
                 <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-widest">{t('train.schedule')}</h3>
                    <button onClick={handleManualSync} className="text-[10px] text-slate-400 hover:text-white uppercase font-bold border border-slate-700 px-3 py-1.5 rounded transition-all">
                        Force Sync
                    </button>
                 </div>

                 <div className="overflow-y-auto custom-scrollbar flex-1 space-y-4 pr-2">
                     {schedule.map((day, idx) => (
                        <div key={idx} className={`bg-[#0f172a] border rounded-xl overflow-hidden relative transition-colors ${editingDayIdx === idx ? 'border-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.2)]' : 'border-slate-700'}`}>
                            <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${day.mode === 'VIP' ? 'from-amber-500 to-amber-700' : 'from-sky-500 to-indigo-500'}`}></div>
                            
                            <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                                <h4 className="text-xs font-header font-bold text-white uppercase tracking-widest">{t(`day.${day.dayName}` as any)}</h4>
                                {editingDayIdx === idx ? (
                                    <div className="flex gap-2">
                                        <button onClick={() => saveEdit(idx)} className="text-[9px] font-bold bg-emerald-600 text-white px-3 py-1 rounded">SAVE</button>
                                        <button onClick={cancelEdit} className="text-[9px] font-bold bg-slate-700 text-slate-300 px-3 py-1 rounded">CANCEL</button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${day.mode === 'VIP' ? 'border-amber-500/30 text-amber-500 bg-amber-500/10' : 'border-sky-500/30 text-sky-500 bg-sky-500/10'}`}>
                                            {day.mode === 'VIP' ? 'VIP' : 'GUARD'}
                                        </span>
                                        <button onClick={() => startEdit(idx)} className="text-slate-500 hover:text-sky-400 p-1">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 divide-x divide-slate-800">
                                <div className="p-3 flex flex-col gap-1 relative overflow-hidden">
                                    <span className="text-[8px] font-bold text-amber-500 uppercase tracking-widest mb-1">CONDUCTOR</span>
                                    {editingDayIdx === idx ? (
                                        <PlayerSearchInput 
                                            value={editForm.conductorName} 
                                            onChange={(v) => setEditForm(prev => ({...prev, conductorName: v}))}
                                            onEnter={() => saveEdit(idx)}
                                            placeholder="Name..."
                                            candidates={candidates}
                                        />
                                    ) : (
                                        <div className="text-sm font-bold text-white truncate flex items-center gap-1">
                                            {day.conductor?.name || 'TBD'}
                                            {day.defender?.id === day.conductor?.id && <DefenderShield />}
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 flex flex-col gap-1 relative overflow-hidden">
                                    <span className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${day.mode === 'Guardian' ? 'text-sky-400' : 'text-purple-500'}`}>
                                        {day.mode === 'Guardian' ? 'GUARDIAN' : 'PASSENGER'}
                                    </span>
                                    {editingDayIdx === idx ? (
                                        <PlayerSearchInput 
                                            value={editForm.vipName} 
                                            onChange={(v) => setEditForm(prev => ({...prev, vipName: v}))}
                                            onEnter={() => saveEdit(idx)}
                                            placeholder="Name..."
                                            candidates={candidates}
                                        />
                                    ) : (
                                        <div className="text-sm font-bold text-white truncate flex items-center gap-1">
                                            {day.vip?.name || 'TBD'}
                                            {day.defender?.id === day.vip?.id && <DefenderShield />}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                     ))}
                 </div>
            </div>
        </div>
    </div>
  );
};

export default TrainManager;