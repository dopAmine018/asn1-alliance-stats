import React, { useState } from 'react';
import { Player } from '../types';
import { useLanguage } from '../utils/i18n';

interface PlayerCardProps {
  player: Player;
  rank?: number;
}

const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

// --- Modern Icons (Stroke-based for clarity) ---
const DuelIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
    <path d="M13 19l6-6" />
    <path d="M16 16l4 4" />
    <path d="M19 21l-2-2" />
  </svg>
);

const HeroIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5z" />
  </svg>
);

const UnitsIcon = () => (
  <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

// T10 Mini Icons (Stroke)
const IconSword = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
    <path d="M13 19l6-6" />
  </svg>
);
const IconShield = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const IconHeart = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);
const IconProtect = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const MoraleIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const PlayerCard: React.FC<PlayerCardProps> = ({ player, rank }) => {
  const { t, language } = useLanguage();
  const [showSquads, setShowSquads] = useState(false);

  const LangBadge = ({ lang }: { lang: string }) => {
    const labels: Record<string, string> = { english: 'ENG', arabic: 'ARA', turkish: 'TUR', indonesian: 'IND' };
    return (
      <span className="text-[10px] font-bold text-slate-400 border border-white/10 bg-white/5 rounded px-2 py-0.5 font-mono">
        {labels[lang] || 'ENG'}
      </span>
    );
  };

  const formatMillions = (val: number) => {
      const millions = val / 1000000;
      return parseFloat(millions.toFixed(2)) + 'M';
  };

  const getRankColor = () => {
      if (rank === 1) return 'bg-amber-500 text-black border-amber-500';
      if (rank === 2) return 'bg-slate-300 text-black border-slate-300';
      if (rank === 3) return 'bg-orange-700 text-white border-orange-700';
      return 'bg-slate-900 text-slate-500 border-slate-800';
  };

  const hasExtraSquads = player.secondSquadPower || player.thirdSquadPower || player.fourthSquadPower;

  const T10Item = ({ icon: Icon, value, color, label }: any) => (
      <div className="flex flex-col items-center gap-1 group/t10">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-slate-950 border border-white/10 ${color} transition-colors shadow-lg`}>
              <Icon />
          </div>
          <span className={`text-[10px] font-mono font-bold ${value === 10 ? 'text-sky-400' : 'text-slate-400'}`}>
              {value === 10 ? 'MAX' : value}
          </span>
      </div>
  );

  return (
    <div className="group relative w-full hover:-translate-y-1 transition-transform duration-300">
      
      <div className="relative h-full bg-[#0f172a] rounded-xl border border-slate-800 overflow-hidden flex flex-col shadow-xl">
          
          {/* Rank Badge */}
          {rank && (
              <div className="absolute top-4 pe-4 end-0 z-10">
                  <div className={`w-8 h-8 rounded flex items-center justify-center font-bold font-mono text-sm border ${getRankColor()}`}>
                      #{rank}
                  </div>
              </div>
          )}

          {/* Header */}
          <div className="px-5 py-5 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
             <div className="flex justify-between items-start pe-10">
                 <div>
                    <h3 className="text-lg font-header font-bold text-white tracking-widest truncate group-hover:text-sky-400 transition-colors">{player.name}</h3>
                    <div className="flex items-center gap-3 mt-2">
                        <LangBadge lang={player.language} />
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{new Date(player.updatedAt).toLocaleDateString()}</span>
                    </div>
                 </div>
             </div>
          </div>

          {/* Stats Body */}
          <div className="p-5 flex-1 space-y-6">
             
             {/* Primary Power & Popover for Secondary Squads */}
             <div className="flex justify-between items-end border-b border-white/5 pb-4 relative">
                 <div className="relative">
                     <div 
                        className="flex items-center gap-2 cursor-pointer select-none"
                        onClick={() => setShowSquads(!showSquads)}
                        onMouseEnter={() => setShowSquads(true)}
                        onMouseLeave={() => setShowSquads(false)}
                     >
                        <p className="text-[9px] font-bold text-sky-500 uppercase tracking-[0.2em] mb-1 flex items-center gap-1 group-hover/label:text-sky-400 transition-colors">
                            {t('label.power')}
                            {hasExtraSquads && (
                                <span className="bg-sky-500/10 text-sky-400 text-[8px] px-1.5 py-0.5 rounded border border-sky-500/20">
                                    +SQUADS
                                </span>
                            )}
                        </p>
                     </div>
                     <p className="text-2xl font-mono font-bold text-white">{formatNumber(player.firstSquadPower)}</p>

                     {/* Popover Tooltip */}
                     {hasExtraSquads && (
                        <div 
                            className={`absolute bottom-full left-0 mb-2 z-20 w-48 bg-slate-900 border border-sky-500/30 shadow-2xl rounded-lg p-3 transition-all duration-200 pointer-events-none ${showSquads ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
                        >
                            <div className="space-y-2">
                                <h4 className="text-[9px] font-bold text-sky-500 uppercase tracking-widest border-b border-sky-500/10 pb-1 mb-1">Squad Details (M)</h4>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">{t('label.squad2')}:</span>
                                    <span className="font-mono text-white">{player.secondSquadPower ? formatMillions(player.secondSquadPower) : '-'}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">{t('label.squad3')}:</span>
                                    <span className="font-mono text-white">{player.thirdSquadPower ? formatMillions(player.thirdSquadPower) : '-'}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-400">{t('label.squad4')}:</span>
                                    <span className="font-mono text-white">{player.fourthSquadPower ? formatMillions(player.fourthSquadPower) : '-'}</span>
                                </div>
                            </div>
                            {/* Arrow */}
                            <div className="absolute top-full left-6 -mt-px border-4 border-transparent border-t-slate-900"></div>
                        </div>
                     )}
                 </div>

                 {player.totalHeroPower > 0 && (
                     <div className="text-end">
                         <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">{t('card.hero_pwr')}</p>
                         <p className="text-lg font-mono font-bold text-amber-400">{formatMillions(player.totalHeroPower)}</p>
                     </div>
                 )}
             </div>

             {/* Performance Gauges */}
             <div className="grid grid-cols-3 gap-3">
                 {[
                     { val: player.heroPercent, icon: HeroIcon, col: 'bg-amber-500', txt: 'text-amber-500' },
                     { val: player.duelPercent, icon: DuelIcon, col: 'bg-sky-500', txt: 'text-sky-500' },
                     { val: player.unitsPercent, icon: UnitsIcon, col: 'bg-emerald-500', txt: 'text-emerald-500' }
                 ].map((s, i) => (
                     <div key={i} className="bg-slate-900 p-3 rounded border border-white/5 flex flex-col items-center gap-2 relative overflow-hidden group/stat">
                         <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${s.col} opacity-40 group-hover/stat:h-full group-hover/stat:opacity-5 transition-all duration-500`}></div>
                         <div className={`w-6 h-6 z-10 ${s.txt}`}><s.icon /></div>
                         <span className="font-mono font-bold text-white z-10 text-sm">{s.val}%</span>
                     </div>
                 ))}
             </div>
             
             {/* T10 Stats */}
             <div className="grid grid-cols-5 gap-2 border-t border-white/5 pt-4">
                <T10Item label="Morale" value={player.t10Morale} icon={MoraleIcon} color="text-amber-400 group-hover/t10:border-amber-500/50" />
                <T10Item label="Prot" value={player.t10Protection} icon={IconProtect} color="text-indigo-400 group-hover/t10:border-indigo-500/50" />
                <T10Item label="HP" value={player.t10Hp} icon={IconHeart} color="text-emerald-400 group-hover/t10:border-emerald-500/50" />
                <T10Item label="Atk" value={player.t10Atk} icon={IconSword} color="text-rose-400 group-hover/t10:border-rose-500/50" />
                <T10Item label="Def" value={player.t10Def} icon={IconShield} color="text-cyan-400 group-hover/t10:border-cyan-500/50" />
             </div>
          </div>

          {/* Footer - Tech Info */}
          <div className="px-5 py-3 bg-slate-950 border-t border-white/5 flex flex-wrap gap-x-4 gap-y-2 text-[9px] uppercase font-bold tracking-widest text-slate-500">
              <span className="flex gap-1 items-center">{t('card.tech_short')}: <b className="text-white text-xs">{player.techLevel || '-'}</b></span>
              <span className="flex gap-1 items-center">{t('card.barr_short')}: <b className="text-white text-xs">{player.barracksLevel || '-'}</b></span>
              <span className="flex gap-1 items-center">{t('card.tank_short')}: <b className="text-white text-xs">{player.tankCenterLevel || '-'}</b></span>
              <span className="flex gap-1 items-center">{t('card.air_short')}: <b className="text-white text-xs">{player.airCenterLevel || '-'}</b></span>
              <span className="flex gap-1 items-center">{t('card.misl_short')}: <b className="text-white text-xs">{player.missileCenterLevel || '-'}</b></span>
          </div>
      </div>
    </div>
  );
};

export default PlayerCard;