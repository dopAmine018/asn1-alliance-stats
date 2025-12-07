
import React, { useState, useEffect } from 'react';
import { Player, PlayerFilter } from '../types';
import { MockApi } from '../services/mockBackend';
import PlayerCard from './PlayerCard';
import { useLanguage } from '../utils/i18n';
import { CustomDropdown } from './CustomDropdown';

interface StatsViewerProps {
  refreshTrigger: number;
}

const StatsViewer: React.FC<StatsViewerProps> = ({ refreshTrigger }) => {
  const { t } = useLanguage();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [filter, setFilter] = useState<PlayerFilter>({ language: 'all', search: '', sort: 'time_desc', activeOnly: true });

  const fetchData = async () => {
    // Only set loading on initial fetch
    if(players.length === 0 && !errorMsg) setLoading(true);
    try {
      const res = await MockApi.getPlayers(filter);
      setPlayers(res.items);
      setErrorMsg(null); // Clear error on success
    } catch (e: any) { 
      console.error("Fetch failed:", e);
      setErrorMsg(e.message || "Connection Error");
    } finally { 
      setLoading(false); 
    }
  };

  // Initial fetch and on filter change
  useEffect(() => { fetchData(); }, [filter, refreshTrigger]);

  // Real-time Polling (Every 3 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
        fetchData();
    }, 3000);
    return () => clearInterval(interval);
  }, [filter, refreshTrigger]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => { setFilter(prev => ({ ...prev, search: e.target.value })); };
  
  const exportToCSV = () => {
    if (!players.length) return;

    // BOM for Excel to recognize UTF-8
    const BOM = "\uFEFF";
    
    // Header Row
    let csvContent = `data:text/csv;charset=utf-8,${BOM}Player Name,Updated At,Tech Level,Barracks Level,T10 Morale,T10 Protection,T10 HP,T10 Atk,T10 Def\n`;

    // Data Rows
    players.forEach(p => {
        const date = new Date(p.updatedAt).toLocaleString();
        // Escape quotes in name if necessary
        const name = `"${p.name.replace(/"/g, '""')}"`;
        
        csvContent += `${name},${date},${p.techLevel},${p.barracksLevel},${p.t10Morale},${p.t10Protection},${p.t10Hp},${p.t10Atk},${p.t10Def}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `asn1_stats_export_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const languageOptions = [ { value: 'all', label: 'All Languages' }, { value: 'english', label: 'English' }, { value: 'arabic', label: 'Arabic' }, { value: 'turkish', label: 'Turkish' }, { value: 'indonesian', label: 'Indonesian' } ];
  const sortOptions = [ { value: 'time_desc', label: t('sort.newest') }, { value: 'time_asc', label: t('sort.oldest') }, { value: 'power_desc', label: t('sort.highest_power') }, { value: 'power_asc', label: t('sort.lowest_power') }, { value: 'total_hero_power_desc', label: t('sort.highest_total_hero_power') }, { value: 'total_hero_power_asc', label: t('sort.lowest_total_hero_power') } ];

  return (
    <div className="space-y-8 relative z-0">
      {/* Control Bar */}
      <div className="bg-[#0f172a] border border-slate-700/50 p-4 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-4 items-center shadow-lg relative overflow-hidden">
        
        {/* Live Indicator */}
        <div className="absolute top-0 right-0 p-1.5 z-50">
           <div className="flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
               </span>
               <span className="text-[9px] font-black text-emerald-500 tracking-widest uppercase">LIVE</span>
           </div>
        </div>

        {/* Search */}
        <div className="md:col-span-5 relative z-10 group">
             <div className="absolute inset-y-0 start-0 ps-4 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-500 group-focus-within:text-sky-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
             <input 
                type="text" 
                placeholder={t('viewer.search')}
                value={filter.search}
                onChange={handleSearchChange}
                className="w-full bg-[#020617] border border-slate-700/50 rounded-lg ps-12 pe-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-sky-500/50 outline-none transition-all font-mono"
             />
        </div>

        {/* Dropdowns */}
        <div className="md:col-span-2 relative z-30">
             <CustomDropdown value={filter.language} onChange={(val) => setFilter(prev => ({ ...prev, language: val as any }))} options={languageOptions} color="blue" />
        </div>
        <div className="md:col-span-3 relative z-30">
             <CustomDropdown value={filter.sort} onChange={(val) => setFilter(prev => ({ ...prev, sort: val as any }))} options={sortOptions} color="blue" />
        </div>
        
        {/* Export Button */}
        <div className="md:col-span-2 relative z-30">
            <button 
                onClick={exportToCSV}
                className="w-full bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 hover:border-emerald-500/50 rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 transition-all font-bold text-xs uppercase tracking-widest"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                {t('viewer.export')}
            </button>
        </div>
      </div>

      {/* Grid */}
      {loading && players.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
             {[1,2,3].map(i => <div key={i} className="h-72 rounded-xl bg-slate-800/30 animate-pulse border border-white/5"></div>)}
        </div>
      ) : players.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {players.map((p, index) => (
            <PlayerCard key={p.id} player={p} rank={filter.sort.includes('power_desc') ? index + 1 : undefined} />
          ))}
        </div>
      ) : (
        <div className="bg-[#0f172a] py-20 rounded-xl text-center border-dashed border border-slate-700/50">
            {errorMsg ? (
                <div className="text-rose-500 space-y-2">
                    <p className="font-bold uppercase tracking-widest">Database Connection Error</p>
                    <p className="text-xs font-mono opacity-75 max-w-lg mx-auto">{errorMsg}</p>
                </div>
            ) : (
                <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">{t('viewer.no_results')}</p>
            )}
        </div>
      )}
    </div>
  );
};

export default StatsViewer;
