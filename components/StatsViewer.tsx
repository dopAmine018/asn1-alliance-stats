
import React, { useState, useEffect, useRef } from 'react';
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

const StatsViewer: React.FC<StatsViewerProps> = ({ refreshTrigger, onBack }) => {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  
  const [filter, setFilter] = useState<PlayerFilter>({ language: 'all', search: '', sort: 'time_desc', activeOnly: false });

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

  const pad = (str: string, length: number) => str.length > length ? str.substring(0, length - 3) + '..' : str.padEnd(length, ' ');

  const copyTacticalReport = async () => {
    if (!players.length) return;
    const date = new Date().toLocaleDateString();
    let report = `### 📋 ASN1 ALLIANCE INTEL REPORT [${date}]\n\`\`\`\n`;
    report += `${pad("RK", 3)} ${pad("COMMANDER", 15)} ${pad("POWER", 8)} ${pad("T10%", 5)}\n`;
    report += `${"-".repeat(3)} ${"-".repeat(15)} ${"-".repeat(8)} ${"-".repeat(5)}\n`;

    players.slice(0, 15).forEach((p, i) => {
      const pwr = (p.firstSquadPower / 1000000).toFixed(1) + "M";
      const t10 = (100 - Math.round(calculateT10RemainingCost(p).gold / 35000000000 * 100)) + "%";
      report += `${pad((i + 1).toString(), 3)} ${pad(p.name.toUpperCase(), 15)} ${pad(pwr, 8)} ${pad(t10, 5)}\n`;
    });

    report += `\`\`\`\n*Generated via ASN1 Command Center*`;

    try {
      await navigator.clipboard.writeText(report);
      addToast('success', 'Tactical Report Copied (Discord Ready)');
    } catch (err) {
      addToast('error', 'Clipboard access denied');
    }
  };

  const exportAsCSV = () => {
    if (!players.length) return;
    const headers = ["Rank", "Name", "Region", "Squad 1 (M)", "Squad 2 (M)", "Total Hero Power (M)", "Hero %", "Duel %", "Units %", "T10 Progress", "Last Updated"];
    const rows = players.map((p, i) => [
        i + 1,
        p.name,
        p.language,
        (p.firstSquadPower / 1000000).toFixed(1),
        ((p.secondSquadPower || 0) / 1000000).toFixed(1),
        (p.totalHeroPower / 1000000).toFixed(1),
        p.heroPercent,
        p.duelPercent,
        p.unitsPercent,
        `${100 - Math.round(calculateT10RemainingCost(p).gold / 35000000000 * 100)}%`,
        new Date(p.updatedAt).toLocaleDateString()
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `ASN1_Leaderboard_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'CSV Intelligence Extracted');
  };

  const languageOptions = [ { value: 'all', label: 'ALL_REGIONS' }, { value: 'english', label: 'ENGLISH' }, { value: 'arabic', label: 'ARABIC' }, { value: 'turkish', label: 'TURKISH' }, { value: 'indonesian', label: 'INDONESIAN' } ];
  const sortOptions = [ 
      { value: 'power_desc', label: 'MAX_POWER' }, 
      { value: 'power_asc', label: 'MIN_POWER' }, 
      { value: 'total_hero_power_desc', label: 'MAX_HERO_PWR' },
      { value: 'time_desc', label: 'RECENT_SYNC' }, 
      { value: 't10_closest', label: 'T10_PROGRESS' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-white/5 hover:border-sky-500 hover:text-sky-500 transition-all shadow-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <div>
                    <h3 className="text-xl font-header font-bold text-white uppercase tracking-[0.2em] flex items-center gap-3">
                        {t('viewer.leaderboard')}
                    </h3>
                    <p className="text-[9px] font-mono text-slate-500 tracking-widest mt-0.5 uppercase">Global Alliance Deployment</p>
                </div>
            </div>
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-900/50 rounded-xl border border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[10px] font-mono text-slate-400 font-bold tracking-[0.3em]">ENCRYPTED_FEED_ACTIVE</span>
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
            <button 
                onClick={copyTacticalReport}
                title="Copy Tactical Report"
                className="flex-1 bg-sky-600/10 hover:bg-sky-600 text-sky-400 hover:text-white border border-sky-500/20 rounded-xl flex items-center justify-center transition-all click-scale shadow-lg py-3"
            >
               <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
               <span className="text-[10px] font-bold uppercase tracking-widest">Copy Report</span>
            </button>
            <button 
                onClick={exportAsCSV}
                title="Download CSV"
                className="flex-1 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 rounded-xl flex items-center justify-center transition-all click-scale shadow-lg py-3"
            >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2m3 2h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </button>
        </div>
      </div>

      <div ref={exportRef} className="pb-20">
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
              <div className="w-20 h-20 rounded-3xl bg-slate-900 flex items-center justify-center mb-6 text-slate-700 shadow-2xl border border-white/5">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-slate-500 font-header text-sm uppercase tracking-[0.3em] font-bold">{errorMsg ? "TERMINAL_OFFLINE" : "NO_PLAYERS_FOUND"}</p>
              {errorMsg && <p className="text-rose-500 text-[10px] mt-4 font-mono font-bold">{errorMsg.toUpperCase()}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsViewer;
