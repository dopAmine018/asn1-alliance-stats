
import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { MockApi } from '../services/mockBackend';
import { calculateT10RemainingCost } from '../utils/gameLogic';
import { useLanguage } from '../utils/i18n';

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

const TrainManager: React.FC = () => {
  const { t } = useLanguage();
  const [candidates, setCandidates] = useState<EnrichedPlayer[]>([]);
  const [schedule, setSchedule] = useState<TrainDay[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
      fetchAndAnalyze();
  }, []);

  const fetchAndAnalyze = async () => {
      setLoading(true);
      try {
          const res = await MockApi.getPlayers({ language: 'all', search: '', sort: 'power_desc', activeOnly: true });
          
          // Enrich players with cost data
          const enriched: EnrichedPlayer[] = res.items.map(p => {
              const cost = calculateT10RemainingCost(p);
              // Simple Score: Gold is heavily weighted as it's the main bottleneck. 
              return {
                  ...p,
                  remainingGold: cost.gold,
                  remainingFood: cost.foodIron,
                  remainingValor: cost.valor,
                  totalCostScore: cost.gold
              };
          });

          // Filter out those who are already maxed (Cost < 1M roughly)
          // Sort by lowest cost first
          const sorted = enriched
              .filter(p => p.remainingGold > 0) 
              .sort((a, b) => a.totalCostScore - b.totalCostScore);

          setCandidates(sorted);
          
          // Generate Schedule immediately
          generateSchedule(sorted);
      } catch(e) {
          console.error("Failed to fetch players", e);
      } finally {
          setLoading(false);
      }
  };

  const generateSchedule = (list: EnrichedPlayer[]) => {
      const scheduleData: TrainDay[] = [];
      const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

      // We need at least 2 players to start a schedule
      if (list.length < 2) {
          setSchedule([]);
          return;
      }

      for (let i = 0; i < 7; i++) {
          // Logic: 6 Players = 3 Pairs.
          // Pair 1: Days 1, 2 (Index 0,1)
          // Pair 2: Days 3, 4 (Index 2,3)
          // Pair 3: Days 5, 6 (Index 4,5)
          // Day 7: Loop back to Pair 1 (Index 0)
          
          const pairIndex = Math.floor(i / 2) % 3; // Returns 0, 0, 1, 1, 2, 2, 0
          const p1 = list[pairIndex * 2];
          const p2 = list[pairIndex * 2 + 1];

          if (!p1 || !p2) continue;

          // Swap Roles: Even Index (0, 2, 4...) -> P1 Conductor. Odd Index (1, 3, 5...) -> P2 Conductor.
          // This ensures within a 2-day block, they swap.
          const isSwap = i % 2 !== 0;
          
          let conductor = isSwap ? p2 : p1;
          let passenger = isSwap ? p1 : p2;

          // Determine Mode based on Power
          let mode: 'VIP' | 'Guardian' = 'VIP';
          if (conductor.firstSquadPower >= passenger.firstSquadPower) {
              mode = 'VIP'; // Conductor defends
          } else {
              mode = 'Guardian'; // Passenger defends
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

  const formatNumber = (num: number) => {
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
                  &nbsp;&nbsp;<span className="text-slate-500">// 1. Sort by Gold Cost (ASC)</span><br/>
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
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left: Priority Queue Table */}
            <div className="bg-[#0f172a] border border-slate-700 rounded-xl overflow-hidden flex flex-col h-[600px]">
                <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-sky-500 uppercase tracking-widest">{t('train.candidates')}</h3>
                    <div className="text-[10px] text-slate-500 font-mono">{candidates.length} Candidates</div>
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
                            {candidates.map((p, idx) => (
                                <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{idx + 1}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-bold text-white flex items-center gap-2">
                                            {p.name}
                                            <span className="text-[9px] font-mono text-sky-500">{(p.firstSquadPower/1000000).toFixed(1)}M</span>
                                        </div>
                                        <div className="text-[9px] text-slate-500 uppercase">{p.language}</div>
                                    </td>
                                    {/* T10 Advancement Column (Morale Removed) */}
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center gap-1 text-[9px] font-mono">
                                            <span className="bg-sky-900/40 text-sky-400 px-1 rounded" title="Protection">{p.t10Protection || 0}</span>
                                            <span className="bg-emerald-900/40 text-emerald-400 px-1 rounded" title="HP">{p.t10Hp || 0}</span>
                                            <span className="bg-rose-900/40 text-rose-400 px-1 rounded" title="Attack">{p.t10Atk || 0}</span>
                                            <span className="bg-amber-900/40 text-amber-400 px-1 rounded" title="Defense">{p.t10Def || 0}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-amber-500">
                                        {formatNumber(p.remainingGold)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Right: Weekly Schedule Cards */}
            <div className="flex flex-col h-[600px] gap-4">
                 <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-widest">{t('train.schedule')}</h3>
                    <button onClick={fetchAndAnalyze} className="text-[10px] text-slate-400 hover:text-white uppercase font-bold border border-slate-700 px-3 py-1 rounded hover:bg-slate-800 transition-colors">
                        Refresh
                    </button>
                 </div>

                 <div className="overflow-y-auto custom-scrollbar flex-1 space-y-4 pr-2">
                     {schedule.map((day, idx) => (
                         <div key={idx} className="bg-[#0f172a] border border-slate-700 rounded-xl overflow-hidden relative group">
                             {/* Mode Indicator Bar */}
                             <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${day.mode === 'VIP' ? 'from-amber-500 to-amber-700' : 'from-sky-500 to-indigo-500'}`}></div>
                             
                             <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                                 <h4 className="text-xs font-header font-bold text-white uppercase tracking-widest">{t(`day.${day.dayName}` as any)}</h4>
                                 <div className="flex items-center gap-2">
                                     <span className="text-[9px] font-mono text-slate-500 uppercase">Pair {Math.floor(idx/2) % 3 + 1}</span>
                                     <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${day.mode === 'VIP' ? 'border-amber-500/30 text-amber-500 bg-amber-500/10' : 'border-sky-500/30 text-sky-500 bg-sky-500/10'}`}>
                                         {day.mode === 'VIP' ? t('train.mode_vip') : t('train.mode_guardian')}
                                     </span>
                                 </div>
                             </div>

                             <div className="grid grid-cols-2 divide-x divide-slate-800">
                                 {/* Conductor */}
                                 <div className="p-3 flex flex-col gap-1 relative overflow-hidden bg-gradient-to-b from-transparent to-amber-900/5">
                                     <span className="text-[8px] font-bold text-amber-500 uppercase tracking-widest mb-1">{t('train.conductor')}</span>
                                     {day.conductor ? (
                                         <div>
                                             <div className="text-sm font-bold text-white truncate flex items-center">
                                                {day.conductor.name}
                                                {day.defender?.id === day.conductor.id && <DefenderShield />}
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
                                     {day.vip ? (
                                         <div>
                                             <div className="text-sm font-bold text-white truncate flex items-center">
                                                {day.vip.name}
                                                {day.defender?.id === day.vip.id && <DefenderShield />}
                                             </div>
                                             <div className="text-[9px] text-slate-400 font-mono mt-1">
                                                 Need: <span className="text-amber-400">{formatNumber(day.vip.remainingGold)}</span>
                                             </div>
                                         </div>
                                     ) : ( <div className="text-xs text-slate-600 italic">-- Empty --</div> )}
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
