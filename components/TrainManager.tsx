
import React, { useState, useEffect, useRef } from 'react';
import { Player } from '../types';
import { MockApi } from '../services/mockBackend';
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

// Extracted Component to prevent re-mounting on every keystroke
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
  
  // Manual Edit State
  const [isManualMode, setIsManualMode] = useState(false);
  const [editingDayIdx, setEditingDayIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{ conductorName: string, vipName: string }>({ conductorName: '', vipName: '' });

  // Fix for repeated toast notifications
  const hasRestoredRef = useRef(false);

  // Initial Load + Polling
  useEffect(() => {
      fetchAndAnalyze();
      const interval = setInterval(fetchAndAnalyze, 10000); // Poll every 10s
      return () => clearInterval(interval);
  }, []);

  // --- EFFECT 1: Sync Manual Schedule with fresh stats (Backend -> UI) ---
  // This runs ONLY when 'candidates' updates (every 10s), NOT when schedule changes.
  useEffect(() => {
      if (isManualMode && candidates.length > 0) {
          setSchedule(prevSchedule => {
              // Map over the existing schedule and inject the latest stats from 'candidates'
              // This preserves the 'Who' but updates the 'Status'
              return prevSchedule.map(day => {
                const newConductor = day.conductor ? candidates.find(c => c.id === day.conductor!.id) || day.conductor : null;
                const newVip = day.vip ? candidates.find(c => c.id === day.vip!.id) || day.vip : null;
                
                // Recalculate Logic based on potentially new power stats
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
  }, [candidates, isManualMode]); // Removed 'schedule' to prevent infinite loop

  // --- EFFECT 2: Persistence (UI -> LocalStorage) ---
  // This runs whenever the schedule changes (e.g. after edit or sync)
  useEffect(() => {
      if (isManualMode && schedule.length > 0) {
          localStorage.setItem('asn1_manual_schedule', JSON.stringify({
              timestamp: Date.now(),
              schedule: schedule.map(d => ({
                  ...d,
                  conductorId: d.conductor?.id,
                  vipId: d.vip?.id
              }))
          }));
      }
  }, [schedule, isManualMode]);

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

          // Sort: Maxed players (0 gold) go to bottom. Others sort by Gold ASC (closest to finish)
          const sorted = enriched.sort((a, b) => {
              if (a.remainingGold === 0 && b.remainingGold === 0) {
                  return b.firstSquadPower - a.firstSquadPower;
              }
              if (a.remainingGold === 0) return 1;
              if (b.remainingGold === 0) return -1;
              return a.totalCostScore - b.totalCostScore;
          });

          setCandidates(sorted);
          
          // Check for saved manual schedule on first load
          if (!isManualMode && schedule.length === 0) {
              const saved = localStorage.getItem('asn1_manual_schedule');
              if (saved) {
                  try {
                      const parsed = JSON.parse(saved);
                      // Reconstruct schedule using IDs
                      const restoredSchedule: TrainDay[] = parsed.schedule.map((d: any) => {
                          const conductor = sorted.find(p => p.id === d.conductorId) || null;
                          const vip = sorted.find(p => p.id === d.vipId) || null;
                          // Recalc logic
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
                      
                      setSchedule(restoredSchedule);
                      setIsManualMode(true);
                      
                      // Fix: Only show toast ONCE
                      if (!hasRestoredRef.current) {
                          addToast('info', 'Restored saved schedule');
                          hasRestoredRef.current = true;
                      }
                      
                      return; // Skip auto generation
                  } catch (e) {
                      console.error("Failed to restore schedule", e);
                      localStorage.removeItem('asn1_manual_schedule');
                  }
              }
              
              // Fallback to auto gen
              generateSchedule(sorted);
          }
      } catch(e) {
          console.error("Failed to fetch players", e);
      } finally {
          setLoading(false);
      }
  };

  const generateSchedule = (list: EnrichedPlayer[]) => {
      const scheduleData: TrainDay[] = [];
      const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

      if (list.length < 2) {
          setSchedule([]); 
          return;
      }

      for (let i = 0; i < 7; i++) {
          const pairIndex = Math.floor(i / 2) % 3;
          const p1 = list[pairIndex * 2];
          const p2 = list[pairIndex * 2 + 1];

          if (!p1 || !p2) {
              scheduleData.push({
                  dayName: days[i],
                  conductor: null,
                  vip: null,
                  mode: 'VIP',
                  defender: null
              });
              continue;
          }

          // Swap logic: Days 0,2,4,6 = Normal. Days 1,3,5 = Swap.
          const isSwap = i % 2 !== 0; 
          let conductor = isSwap ? p2 : p1;
          let passenger = isSwap ? p1 : p2;

          let mode: 'VIP' | 'Guardian' = 'VIP';
          if (conductor.firstSquadPower >= passenger.firstSquadPower) {
              mode = 'VIP'; 
          } else {
              mode = 'Guardian'; 
          }

          scheduleData.push({
              dayName: days[i],
              conductor,
              vip: passenger,
              mode,
              defender: mode === 'VIP' ? conductor : passenger
          });
      }
      setSchedule(scheduleData);
  };

  // --- Edit Logic ---

  const startEdit = (idx: number) => {
      const day = schedule[idx];
      setEditForm({
          conductorName: day.conductor?.name || '',
          vipName: day.vip?.name || ''
      });
      setEditingDayIdx(idx);
  };

  const saveEdit = (idx: number) => {
      // 1. Find Players
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

      // 2. Identify Pair Logic
      // Pair 0: Index 0, 1, 6
      // Pair 1: Index 2, 3
      // Pair 2: Index 4, 5
      let pairGroupIndices: number[] = [];
      if (idx === 0 || idx === 1 || idx === 6) pairGroupIndices = [0, 1, 6];
      else if (idx === 2 || idx === 3) pairGroupIndices = [2, 3];
      else if (idx === 4 || idx === 5) pairGroupIndices = [4, 5];

      // 3. Determine Base Pair (P1, P2) from the user's input
      // If editing a "Normal" day (0, 2, 4, 6): Conductor is P1, VIP is P2
      // If editing a "Swap" day (1, 3, 5): Conductor is P2, VIP is P1
      const isSwapDay = idx % 2 !== 0; // 1, 3, 5 are swaps
      
      let p1: EnrichedPlayer | null = null;
      let p2: EnrichedPlayer | null = null;

      if (!isSwapDay) {
          p1 = userInputConductor;
          p2 = userInputVip;
      } else {
          p1 = userInputVip;
          p2 = userInputConductor;
      }

      // 4. Update ALL days in this pair group
      const newSchedule = [...schedule];

      pairGroupIndices.forEach(dayIndex => {
          const isThisDaySwap = dayIndex % 2 !== 0; // 1, 3, 5
          
          let dayConductor = isThisDaySwap ? p2 : p1;
          let dayVip = isThisDaySwap ? p1 : p2;

          // Logic Recalc for this day
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
      addToast('success', 'Schedule Updated for Pair');
  };

  const cancelEdit = () => {
      setEditingDayIdx(null);
  };

  const resetToAuto = () => {
      localStorage.removeItem('asn1_manual_schedule');
      setIsManualMode(false);
      generateSchedule(candidates);
      addToast('info', 'Auto-Schedule Resumed');
  };

  // --- Render Helpers ---

  const formatNumber = (num: number) => {
      if (num === 0) return "DONE";
      if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
      return num.toString();
  };
  
  const handlePostSchedule = () => {
      if (schedule.length === 0) return;

      const formatPwr = (p: EnrichedPlayer | null) => p ? `${(p.firstSquadPower/1000000).toFixed(1)}M` : 'N/A';
      
      let text = `🚆 *ASN1 Train Schedule*\n-----------------------\n`;
      
      schedule.forEach((day) => {
          const dayTitle = t(`day.${day.dayName}` as any);
          const conductor = day.conductor?.name || 'Empty';
          const vip = day.vip?.name || 'Empty';
          const modeIcon = day.mode === 'VIP' ? '💎' : '🛡️';
          
          text += `📅 *${dayTitle}*\n`;
          text += `👑 Conductor: ${conductor} (${formatPwr(day.conductor)})\n`;
          text += `${modeIcon} ${day.mode === 'VIP' ? 'Passenger' : 'Guardian'}: ${vip} (${formatPwr(day.vip)})\n`;
          text += `-----------------------\n`;
      });
      
      text += `\nGenerated by ASN1 Command`;
      
      navigator.clipboard.writeText(text).then(() => {
          addToast('success', t('train.copied'));
      });
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
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500/10 to-transparent border-l-4 border-amber-500 p-6 rounded-r-xl flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="w-full">
                <h2 className="text-xl font-header font-bold text-white uppercase tracking-widest flex items-center gap-3">
                    {t('train.title')}
                </h2>
                
                {/* Nerdy Code Description */}
                <div className="font-mono text-[10px] leading-relaxed text-slate-400 bg-black/40 p-3 rounded border border-white/5 mt-3 shadow-inner font-medium">
                  <span className="text-purple-400">const</span> <span className="text-blue-400">trainLogic</span> <span className="text-white">=</span> <span className="text-yellow-400">()</span> <span className="text-purple-400">=&gt;</span> <span className="text-yellow-400">{`{`}</span><br/>
                  &nbsp;&nbsp;<span className="text-slate-500">// 1. Sort by Gold Cost (ASC), Maxed Last</span><br/>
                  &nbsp;&nbsp;<span className="text-purple-400">const</span> <span className="text-white">queue</span> <span className="text-white">=</span> <span className="text-white">players.</span><span className="text-blue-400">sortBy</span><span className="text-yellow-400">(</span><span className="text-green-400">'gold'</span><span className="text-yellow-400">)</span><span className="text-white">;</span><br/>
                  &nbsp;&nbsp;<span className="text-slate-500">// 2. Top 6 Candidates (3 Pairs)</span><br/>
                  &nbsp;&nbsp;<span className="text-purple-400">const</span> <span className="text-white">schedule</span> <span className="text-white">=</span> <span className="text-white">days.</span><span className="text-blue-400">map</span><span className="text-yellow-400">(</span><span className="text-white">day</span> <span className="text-purple-400">=&gt;</span> <span className="text-yellow-400">{`{`}</span><br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-white">role:</span> <span className="text-white">day.isOdd</span> <span className="text-white">?</span> <span className="text-green-400">'SWAP'</span> <span className="text-white">:</span> <span className="text-green-400">'NORMAL'</span><span className="text-white">,</span><br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-white">def:</span> <span className="text-blue-400">Math</span><span className="text-white">.</span><span className="text-blue-400">max</span><span className="text-purple-400">(</span><span className="text-white">p1.pwr, p2.pwr</span><span className="text-purple-400">)</span><br/>
                  &nbsp;&nbsp;<span className="text-yellow-400">{`}`}</span><span className="text-yellow-400">)</span><span className="text-white">;</span><br/>
                  <span className="text-yellow-400">{`}`}</span>
                </div>
            </div>
            <div className="text-right whitespace-nowrap hidden sm:block">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Logic Engine</div>
                <div className="text-xs font-mono text-sky-500">3 Pairs / 7 Days / Auto-Swap</div>
                <div className="text-[9px] font-mono text-slate-600 mt-2">
                    {isManualMode ? <span className="text-amber-500 animate-pulse">MANUAL OVERRIDE</span> : "AUTO SYNC"}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left: Priority Queue Table */}
            <div className="bg-[#0f172a] border border-slate-700 rounded-xl overflow-hidden flex flex-col h-[600px]">
                <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center gap-2">
                    <div className="flex flex-col">
                        <h3 className="text-sm font-bold text-sky-500 uppercase tracking-widest">{t('train.candidates')}</h3>
                        <div className="text-[10px] text-slate-500 font-mono">{candidates.length} Found</div>
                    </div>
                    {/* Search Bar */}
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder={t('train.search')} 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-sky-500 outline-none w-32 sm:w-48 font-mono"
                        />
                        <svg className="w-3 h-3 text-slate-500 absolute right-2 top-1.5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
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
                                            {!p.active && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title={t('admin.inactive')}></span>
                                            )}
                                            <span className="text-[9px] font-mono text-sky-500">{(p.firstSquadPower/1000000).toFixed(1)}M</span>
                                        </div>
                                        <div className="flex gap-2 text-[9px]">
                                            <span className="text-slate-500 uppercase">{p.language}</span>
                                            {!p.active && <span className="text-rose-500 uppercase font-bold tracking-wider">{t('admin.inactive')}</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center gap-1 text-[9px] font-mono">
                                            <span className="bg-sky-900/40 text-sky-400 px-1 rounded" title="Protection">{p.t10Protection || 0}</span>
                                            <span className="bg-emerald-900/40 text-emerald-400 px-1 rounded" title="HP">{p.t10Hp || 0}</span>
                                            <span className="bg-rose-900/40 text-rose-400 px-1 rounded" title="Attack">{p.t10Atk || 0}</span>
                                            <span className="bg-amber-900/40 text-amber-400 px-1 rounded" title="Defense">{p.t10Def || 0}</span>
                                        </div>
                                    </td>
                                    <td className={`px-4 py-3 text-right font-mono font-bold ${p.remainingGold === 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {formatNumber(p.remainingGold)}
                                    </td>
                                </tr>
                            ))}
                            {filteredCandidates.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500 text-xs uppercase tracking-widest">
                                        No candidates found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Right: Weekly Schedule Cards */}
            <div className="flex flex-col h-[600px] gap-4">
                 <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-widest">{t('train.schedule')}</h3>
                    <div className="flex gap-2">
                        <button onClick={handlePostSchedule} className="flex items-center gap-1.5 text-[10px] bg-slate-800 text-sky-400 hover:text-white uppercase font-bold border border-slate-700 px-3 py-1 rounded hover:bg-sky-600 transition-colors">
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                             {t('train.post')}
                        </button>
                        {isManualMode && (
                            <button onClick={resetToAuto} className="text-[10px] text-amber-500 hover:text-white uppercase font-bold border border-amber-500/50 px-3 py-1 rounded hover:bg-amber-600 transition-colors animate-pulse">
                                Reset Auto
                            </button>
                        )}
                        <button onClick={fetchAndAnalyze} className="text-[10px] text-slate-400 hover:text-white uppercase font-bold border border-slate-700 px-3 py-1 rounded hover:bg-slate-800 transition-colors">
                            Sync
                        </button>
                    </div>
                 </div>

                 <div className="overflow-y-auto custom-scrollbar flex-1 space-y-4 pr-2">
                     {schedule.length > 0 ? schedule.map((day, idx) => {
                         const isEditing = editingDayIdx === idx;
                         const conductorMatch = isEditing ? candidates.find(c => c.name.toLowerCase() === editForm.conductorName.toLowerCase().trim()) : null;
                         const vipMatch = isEditing ? candidates.find(c => c.name.toLowerCase() === editForm.vipName.toLowerCase().trim()) : null;

                         return (
                            <div key={idx} className={`bg-[#0f172a] border rounded-xl overflow-hidden relative group transition-colors ${editingDayIdx === idx ? 'border-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.2)]' : 'border-slate-700'}`}>
                                {/* Mode Indicator Bar */}
                                <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${day.mode === 'VIP' ? 'from-amber-500 to-amber-700' : 'from-sky-500 to-indigo-500'}`}></div>
                                
                                {/* Card Header */}
                                <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                                    <h4 className="text-xs font-header font-bold text-white uppercase tracking-widest">{t(`day.${day.dayName}` as any)}</h4>
                                    
                                    {isEditing ? (
                                        <div className="flex gap-2">
                                            <button onClick={() => saveEdit(idx)} className="text-[9px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded uppercase">Save Pair</button>
                                            <button onClick={cancelEdit} className="text-[9px] font-bold bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded uppercase">Cancel</button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-mono text-slate-500 uppercase">Pair {Math.floor(idx/2) % 3 + 1}</span>
                                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${day.mode === 'VIP' ? 'border-amber-500/30 text-amber-500 bg-amber-500/10' : 'border-sky-500/30 text-sky-500 bg-sky-500/10'}`}>
                                                {day.mode === 'VIP' ? t('train.mode_vip') : t('train.mode_guardian')}
                                            </span>
                                            <button onClick={() => startEdit(idx)} className="ml-2 text-slate-500 hover:text-sky-400">
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Card Body */}
                                <div className="grid grid-cols-2 divide-x divide-slate-800">
                                    {/* Conductor */}
                                    <div className="p-3 flex flex-col gap-1 relative overflow-hidden bg-gradient-to-b from-transparent to-amber-900/5">
                                        <span className="text-[8px] font-bold text-amber-500 uppercase tracking-widest mb-1">{t('train.conductor')}</span>
                                        
                                        {isEditing ? (
                                            <div className="mt-1">
                                                <PlayerSearchInput 
                                                    value={editForm.conductorName} 
                                                    onChange={(v) => setEditForm(prev => ({...prev, conductorName: v}))}
                                                    onEnter={() => saveEdit(idx)}
                                                    placeholder="Search Conductor..."
                                                    candidates={candidates}
                                                />
                                                {conductorMatch && (
                                                    <div className="mt-1.5 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded">
                                                        <span className="text-[9px] font-bold text-emerald-400">{conductorMatch.name}</span>
                                                        <span className="text-[9px] font-mono text-white">{formatNumber(conductorMatch.remainingGold)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : day.conductor ? (
                                            <div>
                                                <div className="text-sm font-bold text-white truncate flex items-center gap-1">
                                                    {day.conductor.name}
                                                    {day.defender?.id === day.conductor.id && <DefenderShield />}
                                                    {!day.conductor.active && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Inactive"></span>}
                                                </div>
                                                <div className="text-[9px] text-slate-400 font-mono mt-1">
                                                    Need: <span className="text-amber-400">{formatNumber(day.conductor.remainingGold)}</span>
                                                </div>
                                            </div>
                                        ) : ( <div className="text-xs text-slate-600 italic">-- Empty --</div> )}
                                    </div>

                                    {/* Passenger */}
                                    <div className={`p-3 flex flex-col gap-1 relative overflow-hidden ${day.mode === 'Guardian' ? 'bg-gradient-to-b from-transparent to-sky-900/5' : ''}`}>
                                        <span className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${day.mode === 'Guardian' ? 'text-sky-400' : 'text-purple-500'}`}>
                                            {day.mode === 'Guardian' ? t('train.guardian') : t('train.vip')}
                                        </span>
                                        
                                        {isEditing ? (
                                            <div className="mt-1">
                                                <PlayerSearchInput 
                                                    value={editForm.vipName} 
                                                    onChange={(v) => setEditForm(prev => ({...prev, vipName: v}))}
                                                    onEnter={() => saveEdit(idx)}
                                                    placeholder="Search VIP..."
                                                    candidates={candidates}
                                                />
                                                {vipMatch && (
                                                    <div className="mt-1.5 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded">
                                                        <span className="text-[9px] font-bold text-emerald-400">{vipMatch.name}</span>
                                                        <span className="text-[9px] font-mono text-white">{formatNumber(vipMatch.remainingGold)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : day.vip ? (
                                            <div>
                                                <div className="text-sm font-bold text-white truncate flex items-center gap-1">
                                                    {day.vip.name}
                                                    {day.defender?.id === day.vip.id && <DefenderShield />}
                                                    {!day.vip.active && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" title="Inactive"></span>}
                                                </div>
                                                <div className="text-[9px] text-slate-400 font-mono mt-1">
                                                    Need: <span className="text-amber-400">{formatNumber(day.vip.remainingGold)}</span>
                                                </div>
                                            </div>
                                        ) : ( <div className="text-xs text-slate-600 italic">-- Empty --</div> )}
                                    </div>
                                </div>
                            </div>
                        );
                     }) : (
                         <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
                             Insufficient candidates to generate schedule (Need 2+)
                         </div>
                     )}
                 </div>
            </div>
        </div>
    </div>
  );
};

export default TrainManager;
