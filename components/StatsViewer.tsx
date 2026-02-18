import React, { useState, useEffect } from 'react';
import { Player, PlayerFilter } from '../types';
import { MockApi } from '../services/mockBackend';
import PlayerCard from './PlayerCard';
import { useLanguage } from '../utils/i18n';
import { CustomDropdown } from './CustomDropdown';
import { calculateT10RemainingCost } from '../utils/gameLogic';
import { useToast } from './Toast';

interface StatsViewerProps {
  refreshTrigger: number;
  onBack: () => void;
}

type ExtractMode = 'power' | 'squads' | 't10';

const StatsViewer: React.FC<StatsViewerProps> = ({ refreshTrigger, onBack }) => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extractMode, setExtractMode] = useState<ExtractMode>('power');
  
  const [filter, setFilter] = useState<PlayerFilter>({ language: 'all', search: '', sort: 'power_desc', activeOnly: false });

  const fetchData = async () => {
    if(players.length === 0 && !errorMsg) setLoading(true);
    try {
      const res = await MockApi.getPlayers(filter);
      const uniquePlayersMap = new Map<string, Player>();
      
      res.items.forEach(p => {
          const existing = uniquePlayersMap.get(p.nameNormalized);
          if (!existing) {
              uniquePlayersMap.set(p.nameNormalized, p);
          } else {
              if (new Date(p.updatedAt) > new Date(existing.updatedAt)) {
                  uniquePlayersMap.set(p.nameNormalized, p);
              }
          }
      });
      
      let uniqueItems = Array.from(uniquePlayersMap.values());
      
      if (filter.sort === 't10_closest') {
          uniqueItems.sort((a, b) => {
              const costA = calculateT10RemainingCost(a).gold;
              const costB = calculateT10RemainingCost(b).gold;
              return costA - costB;
          });
      } else if (filter.sort === 'power_desc') {
          uniqueItems.sort((a, b) => b.firstSquadPower - a.firstSquadPower);
      } else {
          const uniqueIds = new Set(uniqueItems.map(p => p.id));
          uniqueItems = res.items.filter(p => uniqueIds.has(p.id));
      }

      setPlayers(uniqueItems);
      setErrorMsg(null);
    } catch (e: any) { 
      setErrorMsg(e.message || "Connection Error");
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, [filter, refreshTrigger]);

  useEffect(() => {
    const interval = setInterval(() => { fetchData(); }, 15000);
    return () => clearInterval(interval);
  }, [filter, refreshTrigger]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => { setFilter(prev => ({ ...prev, search: e.target.value })); };

  const pad = (str: string, length: number) => {
    const s = String(str);
    return s.length > length ? s.substring(0, length - 3) + '..' : s.padEnd(length, ' ');
  };

  const formatM = (val: number | undefined) => {
    if (val === undefined || val === null) return '0.0';
    return (val / 1000000).toFixed(1);
  };

  const copyTacticalReport = async (mode: ExtractMode) => {
    if (!players.length) return;
    const date = new Date().toLocaleDateString();
    let report = "";
    
    if (mode === 'power') {
        report = `### 📋 GUN1 POWER INTEL [${date}]\n\`\`\`\n`;
        report += `${pad("RK", 3)} ${pad("COMMANDER", 15)} ${pad("S1 PWR", 8)} ${pad("T10%", 5)}\n`;
        report += `${"-".repeat(3)} ${"-".repeat(15)} ${"-".repeat(8)} ${"-".repeat(5)}\n`;
        players.forEach((p, i) => {
            const t10 = (100 - Math.round(calculateT10RemainingCost(p).gold / 35000000000 * 100)) + "%";
            report += `${pad((i + 1).toString(), 3)} ${pad(p.name.toUpperCase(), 15)} ${pad(formatM(p.firstSquadPower) + "M", 8)} ${pad(t10, 5)}\n`;
        });
    } else if (mode === 'squads') {
        report = `### 🚚 GUN1 SQUAD LOGISTICS [${date}]\n\`\`\`\n`;
        report += `${pad("RK", 3)} ${pad("COMMANDER", 14)} | ${pad("S1", 6)} | ${pad("S2", 6)} | ${pad("S3", 6)} | ${pad("S4", 6)}\n`;
        report += `${"-".repeat(3)}-${"-".repeat(14)}-|-${"-".repeat(6)}-|-${"-".repeat(6)}-|-${"-".repeat(6)}-|-${"-".repeat(6)}\n`;
        players.forEach((p, i) => {
            report += `${pad((i + 1).toString(), 3)} ${pad(p.name.toUpperCase(), 14)} | ${pad(formatM(p.firstSquadPower), 6)} | ${pad(formatM(p.secondSquadPower), 6)} | ${pad(formatM(p.thirdSquadPower), 6)} | ${pad(formatM(p.fourthSquadPower), 6)}\n`;
        });
    } else if (mode === 't10') {
        report = `### 💎 GUN1 T10 READINESS [${date}]\n\`\`\`\n`;
        report += `${pad("RK", 3)} ${pad("COMMANDER", 15)} ${pad("GOLD LEFT", 10)} ${pad("ELITE", 5)}\n`;
        report += `${"-".repeat(3)} ${"-".repeat(15)} ${"-".repeat(10)} ${"-".repeat(5)}\n`;
        players.forEach((p, i) => {
            const cost = calculateT10RemainingCost(p);
            const goldStr = cost.gold >= 1000000000 ? (cost.gold / 1000000000).toFixed(2) + "B" : (cost.gold / 1000000).toFixed(0) + "M";
            report += `${pad((i + 1).toString(), 3)} ${pad(p.name.toUpperCase(), 15)} ${pad(goldStr, 10)} ${pad(p.t10Elite === 10 ? "YES" : "NO", 5)}\n`;
        });
    }

    report += `\`\`\`\n*EXTRACTED ALL COMMANDERS FROM GUN1 TERMINAL*`;

    try {
      await navigator.clipboard.writeText(report);
      addToast('success', `EXTRACTED ${players.length} OPERATIVES`);
    } catch (err) {
      addToast('error', 'Clipboard denied');
    }
  };

  const languageOptions = [ { value: 'all', label: 'ALL_REGIONS' }, { value: 'english', label: 'ENGLISH' }, { value: 'arabic', label: 'ARABIC' }, { value: 'turkish', label: 'TURKISH' }, { value: 'indonesian', label: 'INDONESIAN' } ];
  const sortOptions = [ 
      { value: 'power_desc', label: 'MAX_POWER' }, 
      { value: 'power_asc', label: 'MIN_POWER' }, 
      { value: 'total_hero_power_desc', label: 'MAX_HERO_PWR' },
      { value: 'time_desc', label: 'RECENT_SYNC' }, 
      { value: 't10_closest', label: 'T10_PROGRESS' }
  ];

  const extractOptions = [
      { value: 'power', label: 'REPORT: POWER' },
      { value: 'squads', label: 'REPORT: ALL SQUADS' },
      { value: 't10', label: 'REPORT: T10 PROGRESS' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-white/5 hover:border-sky-500 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div>
                    <h3 className="text-xl font-header font-bold text-white uppercase tracking-[0.2em]">{t('viewer.leaderboard')}</h3>
                    <p className="text-[9px] font-mono text-slate-500 tracking-widest mt-0.5 uppercase">Global Alliance Deployment</p>
                </div>
            </div>
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-900/50 rounded-xl border border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-mono text-slate-400 font-bold tracking-[0.3em]">INTEL_FEED_ACTIVE</span>
            </div>
      </div>

      <div className="bg-[#020617]/50 backdrop-blur-md border border-white/5 p-2 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-2 shadow-2xl">
        <div className="md:col-span-3 relative group">
             <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                <svg className="h-3.5 w-3.5 text-slate-500 group-focus-within:text-sky-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
             <input 
                type="text" 
                placeholder="SEARCH_PLAYER..."
                value={filter.search}
                onChange={handleSearchChange}
                className="w-full h-full bg-[#0a0f1e] hover:bg-slate-900 border border-white/5 rounded-xl ps-10 pe-4 py-3 text-[11px] font-bold text-white placeholder-slate-600 focus:border-sky-500/50 outline-none transition-all font-mono uppercase tracking-widest"
             />
        </div>

        <div className="md:col-span-3">
             <CustomDropdown value={filter.language} onChange={(val) => setFilter(prev => ({ ...prev, language: val as any }))} options={languageOptions} />
        </div>
        <div className="md:col-span-3">
             <CustomDropdown value={filter.sort} onChange={(val) => setFilter(prev => ({ ...prev, sort: val as any }))} options={sortOptions} />
        </div>
        
        <div className="md:col-span-3 flex gap-2">
            <div className="flex-1">
                <CustomDropdown 
                    value={extractMode} 
                    onChange={(val) => setExtractMode(val as any)} 
                    options={extractOptions} 
                    className="h-full"
                />
            </div>
            <button 
                onClick={() => copyTacticalReport(extractMode)}
                className="w-14 h-full bg-sky-600 hover:bg-sky-500 text-white border border-sky-400/20 rounded-xl flex items-center justify-center transition-all click-scale shadow-lg"
                title="Extract All Operatives"
            >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            </button>
        </div>
      </div>

      <div className="pb-20">
        {loading && players.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 rounded-2xl bg-[#0a0f1e] animate-pulse border border-white/5"></div>)}
          </div>
        ) : players.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {players.map((p, index) => (
              <PlayerCard key={p.id} player={p} rank={filter.sort === 'power_desc' ? index + 1 : undefined} />
            ))}
          </div>
        ) : (
          <div className="py-32 rounded-3xl border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center bg-slate-900/20">
              <p className="text-slate-500 font-header text-sm uppercase tracking-[0.3em] font-bold">NO_PLAYERS_FOUND</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsViewer;