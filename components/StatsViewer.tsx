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
    
    let xmlContent = `<?xml version="1.0"?>
    <?mso-application progid="Excel.Sheet"?>
    <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
     xmlns:o="urn:schemas-microsoft-com:office:office"
     xmlns:x="urn:schemas-microsoft-com:office:excel"
     xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
     xmlns:html="http://www.w3.org/TR/REC-html40">
     <Worksheet ss:Name="ASN1_Intelligence">
      <Table>
       <Row>
        <Cell><Data ss:Type="String">Player Name</Data></Cell>
        <Cell><Data ss:Type="String">Squad 1 (M)</Data></Cell>
        <Cell><Data ss:Type="String">Squad 2 (M)</Data></Cell>
        <Cell><Data ss:Type="String">Squad 3 (M)</Data></Cell>
        <Cell><Data ss:Type="String">Squad 4 (M)</Data></Cell>
        <Cell><Data ss:Type="String">Hero Aggregate (M)</Data></Cell>
        <Cell><Data ss:Type="String">Hero %</Data></Cell>
        <Cell><Data ss:Type="String">Duel %</Data></Cell>
        <Cell><Data ss:Type="String">Unit %</Data></Cell>
        <Cell><Data ss:Type="String">T10 Morale</Data></Cell>
        <Cell><Data ss:Type="String">T10 Prot</Data></Cell>
        <Cell><Data ss:Type="String">T10 HP</Data></Cell>
        <Cell><Data ss:Type="String">T10 Atk</Data></Cell>
        <Cell><Data ss:Type="String">T10 Def</Data></Cell>
        <Cell><Data ss:Type="String">Tech Center</Data></Cell>
        <Cell><Data ss:Type="String">Barracks</Data></Cell>
        <Cell><Data ss:Type="String">Tank</Data></Cell>
        <Cell><Data ss:Type="String">Air</Data></Cell>
        <Cell><Data ss:Type="String">Missile</Data></Cell>
        <Cell><Data ss:Type="String">Updated</Data></Cell>
       </Row>`;

    players.forEach(p => {
       const date = new Date(p.updatedAt).toLocaleDateString();
       const sq1 = (p.firstSquadPower / 1000000).toFixed(2);
       const sq2 = (p.secondSquadPower ? p.secondSquadPower / 1000000 : 0).toFixed(2);
       const sq3 = (p.thirdSquadPower ? p.thirdSquadPower / 1000000 : 0).toFixed(2);
       const sq4 = (p.fourthSquadPower ? p.fourthSquadPower / 1000000 : 0).toFixed(2);
       const heroPwr = (p.totalHeroPower / 1000000).toFixed(2);
       const safeName = p.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

       xmlContent += `
       <Row>
        <Cell><Data ss:Type="String">${safeName}</Data></Cell>
        <Cell><Data ss:Type="Number">${sq1}</Data></Cell>
        <Cell><Data ss:Type="Number">${sq2}</Data></Cell>
        <Cell><Data ss:Type="Number">${sq3}</Data></Cell>
        <Cell><Data ss:Type="Number">${sq4}</Data></Cell>
        <Cell><Data ss:Type="Number">${heroPwr}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.heroPercent}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.duelPercent}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.unitsPercent}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.t10Morale || 0}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.t10Protection || 0}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.t10Hp || 0}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.t10Atk || 0}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.t10Def || 0}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.techLevel || 0}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.barracksLevel || 0}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.tankCenterLevel || 0}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.airCenterLevel || 0}</Data></Cell>
        <Cell><Data ss:Type="Number">${p.missileCenterLevel || 0}</Data></Cell>
        <Cell><Data ss:Type="String">${date}</Data></Cell>
       </Row>`;
    });

    xmlContent += `
      </Table>
     </Worksheet>
    </Workbook>`;

    downloadFile(xmlContent, 'ASN1_Alliance_Stats.xls', 'application/vnd.ms-excel');
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
        <div className="md:col-span-5 relative group">
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
        
        <div className="md:col-span-1">
            <button 
                onClick={exportToExcel}
                className="w-full h-full bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white border border-emerald-500/20 rounded-xl flex items-center justify-center transition-all click-scale shadow-lg"
            >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 10l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
        </div>
      </div>

      {loading && players.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
             {[1,2,3,4,5,6].map(i => <div key={i} className="h-64 rounded-2xl bg-[#0a0f1e] animate-pulse border border-white/5"></div>)}
        </div>
      ) : players.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
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
  );
};

export default StatsViewer;