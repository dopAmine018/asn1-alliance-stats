import React, { useState, useEffect, useRef } from 'react';
import { toBlob } from 'html-to-image';
import { Player } from '../types';
import { MockApi, TrainApi } from '../services/mockBackend';
import { calculateStsRemainingCost, calculateDefRemainingCost } from '../utils/gameLogic';
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
    
    const suggestions = value.trim().length > 0 
        ? candidates.filter(p => p.name.toLowerCase().includes(value.toLowerCase())).slice(0, 8) 
        : candidates.slice(0, 8);

    return (
        <div className="relative w-full z-50">
            <input 
                type="text" 
                value={value} 
                onChange={(e) => { onChange(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                onKeyDown={(e) => e.key === 'Enter' && onEnter()}
                placeholder={placeholder}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:border-sky-500 outline-none font-bold placeholder-slate-600 shadow-inner"
            />
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-[#0f172a] border border-sky-500/50 shadow-[0_10px_25px_rgba(0,0,0,0.8)] z-[100] rounded-b-xl max-h-52 overflow-y-auto mt-1 divide-y divide-slate-800">
                    {suggestions.map(s => (
                        <div 
                            key={s.id} 
                            className="px-3 py-2.5 text-xs text-slate-200 hover:bg-sky-900/50 hover:text-white cursor-pointer active:bg-sky-800 flex justify-between items-center touch-manipulation"
                            onMouseDown={(e) => { e.preventDefault(); onChange(s.name); setShowSuggestions(false); }}
                            onTouchStart={(e) => { e.preventDefault(); onChange(s.name); setShowSuggestions(false); }}
                        >
                            <span className="font-bold text-white text-xs">{s.name}</span>
                            <span className="font-mono text-[10px] text-sky-400 font-bold bg-sky-950/80 px-2 py-0.5 rounded border border-sky-500/30">
                                {(s.firstSquadPower/1000000).toFixed(1)}M
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

type TrainLogic = 'DEFENSE';

const TrainManager: React.FC = () => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [logicMode] = useState<TrainLogic>('DEFENSE');
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
  }, [logicMode]);

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
              const cost = calculateDefRemainingCost(p);

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
    if (!window.confirm(`AUTO-DEPLOY ENGINE:\nThis will analyze current ${logicMode} progress and squad power to select the TOP 14 active players closest to completion (2 per day across 7 days).\n\nOverwrite existing schedule?`)) return;

    setLoading(true);
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    
    // Algorithm: Find active players sorted by closest to completion (lowest gold needed)
    const activeCandidates = candidates.filter(p => p.active);
    
    if (activeCandidates.length === 0) {
        addToast('error', 'No active agents available for deployment');
        setLoading(false);
        return;
    }

    const newSchedule: TrainDay[] = [];

    for (let i = 0; i < 7; i++) {
        const conductor = activeCandidates[i * 2] || null;
        const passenger = activeCandidates[i * 2 + 1] || null;

        let mode: 'VIP' | 'Guardian' = 'VIP';
        let defender = conductor;

        if (conductor && passenger) {
            if (conductor.firstSquadPower >= passenger.firstSquadPower) {
                mode = 'VIP';
                defender = conductor;
            } else {
                mode = 'Guardian';
                defender = passenger;
            }
        } else if (conductor) {
            mode = 'VIP';
            defender = conductor;
        } else if (passenger) {
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
    addToast('success', 'Top 14 Tactical Auto-Deployment Synchronized');
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

      const newSchedule = [...schedule];

      let dayConductor = userInputConductor;
      let dayVip = userInputVip;

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

      newSchedule[idx] = {
          ...newSchedule[idx],
          conductor: dayConductor,
          vip: dayVip,
          mode,
          defender
      };

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

  const posterRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const saveSchedulePng = async () => {
      if (schedule.length === 0) {
          addToast('error', 'No schedule available to save');
          return;
      }

      setIsCapturing(true);

      try {
          // Give DOM time to stabilize
          await new Promise(r => setTimeout(r, 100));

          if (!posterRef.current) {
              throw new Error('Poster element missing');
          }

          const blob = await toBlob(posterRef.current, {
              quality: 0.95,
              pixelRatio: 2,
              backgroundColor: '#0b1329',
              cacheBust: true,
          });

          if (!blob) {
              throw new Error('Could not render image blob');
          }

          const dateStr = new Date().toISOString().slice(0, 10);
          const fileName = `ASN1_Train_Schedule_${dateStr}.png`;
          const file = new File([blob], fileName, { type: 'image/png' });

          let shared = false;

          // 1. Mobile Web Share API - opens native phone sheet ("Save Image" to Photos/Gallery/Files)
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
              try {
                  await navigator.share({
                      title: 'ASN1 Train Schedule',
                      text: 'ASN1 Alliance Train Schedule',
                      files: [file],
                  });
                  shared = true;
                  addToast('success', '📱 Saved/Shared Schedule Image!');
              } catch (shareErr) {
                  if ((shareErr as Error).name !== 'AbortError') {
                      console.warn('Native share failed, falling back to direct download:', shareErr);
                  } else {
                      shared = true; // User canceled native share dialog
                  }
              }
          }

          // 2. Direct browser file download link (triggers native download on phone/PC)
          if (!shared) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              addToast('success', '📥 Schedule image saved to device downloads!');

              // Also copy to clipboard if supported as extra convenience
              if (navigator.clipboard && window.ClipboardItem) {
                  try {
                      const item = new ClipboardItem({ 'image/png': blob });
                      await navigator.clipboard.write([item]);
                  } catch (clipErr) {
                      // ignore clipboard errors
                  }
              }

              setTimeout(() => URL.revokeObjectURL(url), 5000);
          }
      } catch (err) {
          console.error('Failed to save PNG image:', err);
          addToast('error', 'Failed PNG capture. Copying text orders...');
          await copyTacticalOrdersText();
      } finally {
          setIsCapturing(false);
      }
  };

  const copyTacticalOrdersText = async () => {
      if (schedule.length === 0) return;
      let report = `### 🚆 ASN1 Train Schedule\n\`\`\`\n`;
      
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
      
      report += `\`\`\`\n*Generated by ASN1 Command Terminal*`;

      try {
          await navigator.clipboard.writeText(report);
          addToast('success', 'Text Orders Copied to Clipboard');
      } catch (err) {
          addToast('error', 'Clipboard access denied');
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
                    onClick={saveSchedulePng} 
                    disabled={isCapturing}
                    className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-900/20 click-scale border border-sky-400/20 disabled:opacity-50"
                    title="Save schedule image (PNG) directly to your phone / device"
                >
                    {isCapturing ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-widest">Save PNG to Phone</span>
                </button>
                <button 
                    onClick={copyTacticalOrdersText}
                    className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
                    title="Copy text orders"
                >
                    <span className="text-[10px] font-bold uppercase">Text</span>
                </button>
            </div>
        </div>

        {/* Hidden Offscreen Schedule Poster Template for High-Res PNG Capture */}
        <div className="fixed top-[-9999px] left-[-9999px] pointer-events-none opacity-0 z-[-9999]">
            <div 
                ref={posterRef} 
                className="w-[850px] bg-[#0b1329] text-white p-8 border-2 border-amber-500/50 rounded-2xl shadow-2xl font-sans"
            >
                {/* Poster Header */}
                <div className="flex items-center justify-between border-b-2 border-amber-500/30 pb-6 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-amber-400 font-black text-2xl shadow-lg">
                            🚆
                        </div>
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-wider text-amber-400">ASN1 TRAIN SCHEDULE</h1>
                            <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">ALLIANCE TACTICAL DISTRIBUTION</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-mono text-sky-400 bg-sky-950/80 border border-sky-500/30 px-3 py-1.5 rounded-lg font-bold">
                            COMMAND SYNCED
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1.5 font-mono">
                            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>
                </div>

                {/* Poster Schedule Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {schedule.map((day, idx) => (
                        <div key={idx} className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between shadow-md">
                            <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
                                <span className="text-sm font-bold text-white uppercase tracking-wider">
                                    {t(`day.${day.dayName}` as any)}
                                </span>
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase font-mono ${
                                    day.mode === 'VIP' 
                                        ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' 
                                        : 'border-sky-500/50 bg-sky-500/10 text-sky-400'
                                }`}>
                                    {day.mode === 'VIP' ? 'VIP MODE' : 'GUARDIAN MODE'}
                                </span>
                            </div>

                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between items-center bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                                    <div>
                                        <div className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">Conductor</div>
                                        <div className="font-bold text-white text-sm">{day.conductor?.name || 'TBD'}</div>
                                    </div>
                                    <div className="text-right font-mono text-amber-400 font-bold">
                                        {day.conductor ? `${(day.conductor.firstSquadPower / 1000000).toFixed(1)}M` : '-'}
                                    </div>
                                </div>

                                <div className="flex justify-between items-center bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                                    <div>
                                        <div className={`text-[9px] font-bold uppercase tracking-wider ${day.mode === 'Guardian' ? 'text-sky-400' : 'text-purple-400'}`}>
                                            {day.mode === 'Guardian' ? 'Guardian' : 'Passenger'}
                                        </div>
                                        <div className="font-bold text-white text-sm">{day.vip?.name || 'TBD'}</div>
                                    </div>
                                    <div className="text-right font-mono text-purple-400 font-bold">
                                        {day.vip ? `${(day.vip.firstSquadPower / 1000000).toFixed(1)}M` : '-'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Poster Footer */}
                <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400 font-mono">
                    <span>🛡️ ASN1 ALLIANCE COMMAND</span>
                    <span>GENERATED PNG SCHEDULE</span>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#0f172a] border border-slate-700 rounded-xl overflow-hidden flex flex-col h-[600px]">
                <div className="p-4 bg-slate-900 border-b border-slate-800 space-y-3">
                    <div className="flex justify-between items-center gap-2">
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
                </div>
                
                <div className="overflow-y-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950 text-[9px] uppercase font-bold text-slate-500 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3">#</th>
                                <th className="px-4 py-3">{t('admin.identity')}</th>
                                <th className="px-4 py-3 text-center">DEF Adv</th>
                                <th className="px-4 py-3 text-right">Gold Needed</th>
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
                                            <span className="bg-sky-900/40 text-sky-400 px-1 rounded">{p.defHoldLine1 || 0}</span>
                                            <span className="bg-emerald-900/40 text-emerald-400 px-1 rounded">{p.defCounterDefense1 || 0}</span>
                                            <span className="bg-rose-900/40 text-rose-400 px-1 rounded">{p.defSolidDefense1 || 0}</span>
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

                 <div className="overflow-y-auto custom-scrollbar flex-1 space-y-4 pr-2 pb-36">
                     {schedule.map((day, idx) => (
                        <div 
                            key={idx} 
                            className={`bg-[#0f172a] border rounded-xl relative transition-all ${
                                editingDayIdx === idx 
                                    ? 'border-sky-500 shadow-[0_0_25px_rgba(14,165,233,0.3)] z-30 overflow-visible' 
                                    : 'border-slate-700 overflow-hidden z-1'
                            }`}
                        >
                            <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${day.mode === 'VIP' ? 'from-amber-500 to-amber-700' : 'from-sky-500 to-indigo-500'} rounded-l-xl`}></div>
                            
                            <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                                <h4 className="text-xs font-header font-bold text-white uppercase tracking-widest">{t(`day.${day.dayName}` as any)}</h4>
                                {editingDayIdx === idx ? (
                                    <div className="flex gap-2">
                                        <button onClick={() => saveEdit(idx)} className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded">SAVE</button>
                                        <button onClick={cancelEdit} className="text-[10px] font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1 rounded">CANCEL</button>
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
                                <div className="p-3 flex flex-col gap-1 relative overflow-visible">
                                    <span className="text-[8px] font-bold text-amber-500 uppercase tracking-widest mb-1">CONDUCTOR</span>
                                    {editingDayIdx === idx ? (
                                        <PlayerSearchInput 
                                            value={editForm.conductorName} 
                                            onChange={(v) => setEditForm(prev => ({...prev, conductorName: v}))}
                                            onEnter={() => saveEdit(idx)}
                                            placeholder="Type or select conductor..."
                                            candidates={candidates}
                                        />
                                    ) : (
                                        <div className="text-sm font-bold text-white truncate flex items-center gap-1">
                                            {day.conductor?.name || 'TBD'}
                                            {day.defender?.id === day.conductor?.id && <DefenderShield />}
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 flex flex-col gap-1 relative overflow-visible">
                                    <span className={`text-[8px] font-bold uppercase tracking-widest mb-1 ${day.mode === 'Guardian' ? 'text-sky-400' : 'text-purple-500'}`}>
                                        {day.mode === 'Guardian' ? 'GUARDIAN' : 'PASSENGER'}
                                    </span>
                                    {editingDayIdx === idx ? (
                                        <PlayerSearchInput 
                                            value={editForm.vipName} 
                                            onChange={(v) => setEditForm(prev => ({...prev, vipName: v}))}
                                            onEnter={() => saveEdit(idx)}
                                            placeholder="Type or select passenger..."
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