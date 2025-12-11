
import React, { useState, useEffect } from 'react';
import { Player, PlayerFilter } from '../types';
import { MockApi } from '../services/mockBackend';
import PlayerCard from './PlayerCard';
import { useLanguage } from '../utils/i18n';
import { CustomDropdown } from './CustomDropdown';
import { calculateT10RemainingCost } from '../utils/gameLogic';

interface StatsViewerProps {
  refreshTrigger: number;
  onBack: () => void;
}

const StatsViewer: React.FC<StatsViewerProps> = ({ refreshTrigger, onBack }) => {
  const { t } = useLanguage();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Changed activeOnly default to false so missing players appear by default
  const [filter, setFilter] = useState<PlayerFilter>({ language: 'all', search: '', sort: 'time_desc', activeOnly: false });

  const fetchData = async () => {
    if(players.length === 0 && !errorMsg) setLoading(true);
    try {
      const res = await MockApi.getPlayers(filter);
      
      // Client-side Deduplication
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
      
      let uniqueItems = Array.from(uniquePlayersMap.values());
      
      // Client Side Sorting for T10
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
    const interval = setInterval(() => { fetchData(); }, 5000);
    return () => clearInterval(interval);
  }, [filter, refreshTrigger]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => { setFilter(prev => ({ ...prev, search: e.target.value })); };
  
  // Helper to trigger download using Blob (Fixes truncating issues)
  const downloadFile = (content: string, fileName: string, mimeType: string) => {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    if (!players.length) return;
    
    // XML Spreadsheet 2003 format - natively supported by Excel
    let xmlContent = `<?xml version="1.0"?>
    <?mso-application progid="Excel.Sheet"?>
    <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
     xmlns:o="urn:schemas-microsoft-com:office:office"
     xmlns:x="urn:schemas-microsoft-com:office:excel"
     xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
     xmlns:html="http://www.w3.org/TR/REC-html40">
     <Worksheet ss:Name="Leaderboard">
      <Table>
       <Row>
        <Cell><Data ss:Type="String">Player Name</Data></Cell>
        <Cell><Data ss:Type="String">Squad 1 (M)</Data></Cell>
        <Cell><Data ss:Type="String">Squad 2 (M)</Data></Cell>
        <Cell><Data ss:Type="String">Hero Pwr (M)</Data></Cell>
        <Cell><Data ss:Type="String">Hero %</Data></Cell>
        <Cell><Data ss:Type="String">Duel %</Data></Cell>
        <Cell><Data ss:Type="String">Unit %</Data></Cell>
        <Cell><Data ss:Type="String">T10 Morale</Data></Cell>
        <Cell><Data ss:Type="String">T10 Prot</Data></Cell>
        <Cell><Data ss:Type="String">T10 HP</Data></Cell>
        <Cell><Data ss:Type="String">T10 Atk</Data></Cell>
        <Cell><Data ss:Type="String">T10 Def</Data></Cell>
        <Cell><Data ss:Type="String">Tech</Data></Cell>
        <Cell><Data ss:Type="String">Barracks</Data></Cell>
        <Cell><Data ss:Type="String">Updated</Data></Cell>
       </Row>`;

    players.forEach(p => {
       const date = new Date(p.updatedAt).toLocaleDateString();
       const sq1 = (p.firstSquadPower / 1000000).toFixed(2);
       const sq2 = (p.secondSquadPower ? p.secondSquadPower / 1000000 : 0).toFixed(2);
       const heroPwr = (p.totalHeroPower / 1000000).toFixed(2);
       
       // Escape XML special chars
       const safeName = p.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

       xmlContent += `
       <Row>
        <Cell><Data ss:Type="String">${safeName}</Data></Cell>
        <Cell><Data ss:Type="Number">${sq1}</Data></Cell>
        <Cell><Data ss:Type="Number">${sq2}</Data></Cell>
        <Cell><Data ss:Type="Number">${heroPwr}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.heroPercent}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.duelPercent}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.unitsPercent}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.t10Morale || 0}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.t10Protection || 0}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.t10Hp || 0}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.t10Atk || 0}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.t10Def || 0}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.techLevel}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.barracksLevel}</Data></Cell>
        <Cell><Data ss:Type="String">${date}</Data></Cell>
       </Row>`;
    });

    xmlContent += `
      </Table>
     </Worksheet>
    </Workbook>`;

    downloadFile(xmlContent, 'asn1_export.xls', 'application/vnd.ms-excel');
  };

  const languageOptions = [ { value: 'all', label: 'All Regions' }, { value: 'english', label: 'English' }, { value: 'arabic', label: 'Arabic' }, { value: 'turkish', label: 'Turkish' }, { value: 'indonesian', label: 'Indonesian' } ];
  const sortOptions = [ 
      { value: 'power_desc', label: t('sort.highest_power') }, 
      { value: 'power_asc', label: t('sort.lowest_power') }, 
      { value: 'time_desc', label: t('sort.newest') }, 
      { value: 'total_hero_power_desc', label: t('sort.highest_total_hero_power') },
      { value: 't10_closest', label: t('sort.t10_closest') }
  ];

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
        
        {/* Export Group */}
        <div className="md:col-span-2 flex gap-1">
            <button 
                onClick={exportToExcel}
                title="Export Excel"
                className="flex-1 bg-[#0a0f1e] hover:bg-[#0f172a] text-slate-400 hover:text-emerald-400 border border-transparent hover:border-emerald-500/30 rounded-xl px-2 py-3 flex items-center justify-center gap-1 transition-all font-bold text-[10px] uppercase tracking-wider click-scale"
            >
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
               {t('viewer.export')}
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
