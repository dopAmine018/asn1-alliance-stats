
import React, { useState, useEffect } from 'react';
import { Player, PlayerFilter } from '../types';
import { MockApi } from '../services/mockBackend';
import PlayerCard from './PlayerCard';
import { useLanguage } from '../utils/i18n';
import { CustomDropdown } from './CustomDropdown';

interface StatsViewerProps {
  refreshTrigger: number;
  onBack: () => void;
}

const StatsViewer: React.FC<StatsViewerProps> = ({ refreshTrigger, onBack }) => {
  const { t } = useLanguage();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [filter, setFilter] = useState<PlayerFilter>({ language: 'all', search: '', sort: 'power_desc', activeOnly: true });

  const fetchData = async () => {
    if(players.length === 0 && !errorMsg) setLoading(true);
    try {
      const res = await MockApi.getPlayers(filter);
      
      // Client-side Deduplication
      // Maps nameNormalized -> Player. If duplicates exist, we take the one with the latest update.
      const uniquePlayersMap = new Map<string, Player>();
      
      res.items.forEach(p => {
          const existing = uniquePlayersMap.get(p.nameNormalized);
          if (!existing) {
              uniquePlayersMap.set(p.nameNormalized, p);
          } else {
              // If duplicate found, keep the one updated most recently
              if (new Date(p.updatedAt) > new Date(existing.updatedAt)) {
                  uniquePlayersMap.set(p.nameNormalized, p);
              }
          }
      });
      
      const uniqueItems = Array.from(uniquePlayersMap.values());
      
      // Re-sort because Map iteration might lose order specific nuances if not careful, 
      // though API usually sorts. Let's rely on API sort order by preserving original relative order where possible 
      // or just sorting again client side to be safe.
      // Since API does sorting, let's filter the original list to maintain that order.
      const uniqueIds = new Set(uniqueItems.map(p => p.id));
      const sortedUniqueItems = res.items.filter(p => uniqueIds.has(p.id));

      setPlayers(sortedUniqueItems);
      setErrorMsg(null);
    } catch (e: any) { 
      setErrorMsg(e.message || "Connection Error");
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, [filter, refreshTrigger]);

  useEffect(() => {
    const interval = setInterval(() => { fetchData(); }, 5000);
    return () => clearInterval(interval);
  }, [filter, refreshTrigger]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => { setFilter(prev => ({ ...prev, search: e.target.value })); };
  
  const exportToCSV = () => {
    if (!players.length) return;
    const BOM = "\uFEFF";
    let csvContent = `data:text/csv;charset=utf-8,${BOM}Player Name,Power (M),Updated,Tech,Barracks\n`;
    players.forEach(p => {
        const date = new Date(p.updatedAt).toLocaleDateString();
        const power = (p.firstSquadPower / 1000000).toFixed(2);
        csvContent += `"${p.name}",${power},${date},${p.techLevel},${p.barracksLevel}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `asn1_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const languageOptions = [ { value: 'all', label: 'All Regions' }, { value: 'english', label: 'English' }, { value: 'arabic', label: 'Arabic' }, { value: 'turkish', label: 'Turkish' }, { value: 'indonesian', label: 'Indonesian' } ];
  const sortOptions = [ { value: 'power_desc', label: t('sort.highest_power') }, { value: 'power_asc', label: t('sort.lowest_power') }, { value: 'time_desc', label: t('sort.newest') }, { value: 'total_hero_power_desc', label: t('sort.highest_total_hero_power') } ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-700 hover:border-sky-500 hover:text-sky-500 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <h3 className="text-xl font-header font-bold text-white uppercase tracking-widest flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-sky-500 rounded-sm"></span>
                    {t('viewer.leaderboard')}
                </h3>
            </div>
            <div className="text-[10px] font-mono text-emerald-500 animate-pulse hidden sm:block">● LIVE FEED</div>
      </div>

      {/* Control Bar */}
      <div className="bg-[#020617] border border-slate-800 p-1.5 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-2 shadow-xl">
        
        {/* Search */}
        <div className="md:col-span-5 relative group">
             <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-600 group-focus-within:text-sky-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
             <input 
                type="text" 
                placeholder={t('viewer.search')}
                value={filter.search}
                onChange={handleSearchChange}
                className="w-full h-full bg-[#0a0f1e] hover:bg-[#0f172a] border border-transparent hover:border-slate-700 rounded-xl ps-12 pe-4 py-3 text-sm text-white placeholder-slate-600 focus:bg-[#0f172a] focus:border-sky-500/50 outline-none transition-all font-mono"
             />
        </div>

        {/* Filters */}
        <div className="md:col-span-2">
             <CustomDropdown value={filter.language} onChange={(val) => setFilter(prev => ({ ...prev, language: val as any }))} options={languageOptions} color="blue" />
        </div>
        <div className="md:col-span-3">
             <CustomDropdown value={filter.sort} onChange={(val) => setFilter(prev => ({ ...prev, sort: val as any }))} options={sortOptions} color="blue" />
        </div>
        
        {/* Export */}
        <div className="md:col-span-2">
            <button 
                onClick={exportToCSV}
                className="w-full h-full bg-[#0a0f1e] hover:bg-[#0f172a] text-slate-400 hover:text-emerald-400 border border-transparent hover:border-emerald-500/30 rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all font-bold text-xs uppercase tracking-widest click-scale"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                CSV
            </button>
        </div>
      </div>

      {/* Grid */}
      {loading && players.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
             {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 rounded-2xl bg-[#0a0f1e] animate-pulse border border-white/5"></div>)}
        </div>
      ) : players.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {players.map((p, index) => (
            <PlayerCard key={p.id} player={p} rank={filter.sort.includes('power_desc') ? index + 1 : undefined} />
          ))}
        </div>
      ) : (
        <div className="py-24 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mb-4 text-slate-700">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">{errorMsg ? "System Offline" : t('viewer.no_results')}</p>
            {errorMsg && <p className="text-rose-500 text-xs mt-2 font-mono">{errorMsg}</p>}
        </div>
      )}
    </div>
  );
};

export default StatsViewer;
