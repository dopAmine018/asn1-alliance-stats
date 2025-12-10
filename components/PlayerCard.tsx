
import React, { useState } from 'react';
import { Player } from '../types';
import { useLanguage } from '../utils/i18n';

interface PlayerCardProps {
  player: Player;
  rank?: number;
}

const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

// Icons
const DuelIcon = () => ( <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 17.5L3 6V3h3l11.5 11.5" /><path d="M13 19l6-6" /><path d="M16 16l4 4" /><path d="M19 21l-2-2" /></svg> );
const HeroIcon = () => ( <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5z" /></svg> );
const UnitsIcon = () => ( <svg className="w-full h-full" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> );

const PlayerCard: React.FC<PlayerCardProps> = ({ player, rank }) => {
  const { t } = useLanguage();
  const [showOverlay, setShowOverlay] = useState(false);

  const formatMillions = (val: number) => {
      const millions = val / 1000000;
      return parseFloat(millions.toFixed(2)) + 'M';
  };

  const rankColor = rank === 1 ? 'text-amber-400 border-amber-500/50 bg-amber-500/10' 
                  : rank === 2 ? 'text-slate-200 border-slate-400/50 bg-slate-400/10'
                  : rank === 3 ? 'text-orange-400 border-orange-500/50 bg-orange-500/10'
                  : 'text-slate-500 border-slate-800 bg-slate-900';

  const T10Stat = ({ label, val }: { label: string, val: number }) => (
    <div className="flex flex-col items-center">
        <span className={`text-xs font-mono font-bold ${val === 10 ? 'text-sky-400' : 'text-slate-500'}`}>{val === 10 ? 'MAX' : val}</span>
        <span className="text-[8px] uppercase font-bold text-slate-600 tracking-wider">{label}</span>
    </div>
  );

  return (
    <div 
        className="group relative w-full h-full cursor-pointer"
        onMouseEnter={() => setShowOverlay(true)}
        onMouseLeave={() => setShowOverlay(false)}
        onClick={() => setShowOverlay(prev => !prev)}
    >
        {/* Glow Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-b from-sky-500/20 to-indigo-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-700"></div>
        
        <div className="relative h-full bg-[#0a0f1e] rounded-2xl border border-white/10 overflow-hidden flex flex-col transition-all duration-300 group-hover:border-sky-500/40 group-hover:translate-y-[-4px] shadow-2xl">
            
            {/* Header / Identity */}
            <div className="p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
                </div>

                <div className="flex justify-between items-start relative z-10">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                             <h3 className="text-lg font-header font-bold text-white tracking-wider truncate max-w-[180px]">{player.name}</h3>
                             <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/10 text-slate-400 bg-white/5 uppercase">{player.language.substring(0,3)}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Last Scan: {new Date(player.updatedAt).toLocaleDateString()}
                        </p>
                    </div>
                    {rank && (
                        <div className={`w-10 h-10 flex items-center justify-center rounded-lg border backdrop-blur-md font-header font-bold text-lg shadow-lg ${rankColor}`}>
                            #{rank}
                        </div>
                    )}
                </div>
            </div>

            {/* Separator */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            {/* Main Stats */}
            <div className="p-5 space-y-6 flex-1 bg-gradient-to-b from-transparent to-[#020617]">
                
                {/* Power Row */}
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-[9px] text-sky-500 font-bold uppercase tracking-[0.2em] mb-1">Squad Power</p>
                        <p className="text-3xl font-header font-bold text-white tabular-nums tracking-tight">
                            {formatNumber(player.firstSquadPower / 1000000)}<span className="text-lg text-slate-500 ml-1">M</span>
                        </p>
                    </div>
                    {player.totalHeroPower > 0 && (
                        <div className="text-right">
                             <p className="text-[9px] text-amber-500 font-bold uppercase tracking-[0.2em] mb-1">Hero Pwr</p>
                             <p className="text-xl font-mono font-bold text-slate-200 tabular-nums">
                                {formatNumber(player.totalHeroPower / 1000000)}<span className="text-sm text-slate-600 ml-0.5">M</span>
                             </p>
                        </div>
                    )}
                </div>

                {/* Gauges */}
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { val: player.heroPercent, label: 'HERO', color: 'bg-amber-500', icon: HeroIcon },
                        { val: player.duelPercent, label: 'DUEL', color: 'bg-sky-500', icon: DuelIcon },
                        { val: player.unitsPercent, label: 'UNIT', color: 'bg-emerald-500', icon: UnitsIcon },
                    ].map((stat, i) => (
                        <div key={i} className="bg-slate-900/50 rounded-lg p-2 border border-white/5 flex flex-col items-center gap-1 group/gauge hover:border-white/20 transition-colors">
                            <div className="flex items-center gap-1.5 mb-1">
                                <div className={`w-3 h-3 ${stat.color.replace('bg-', 'text-')}`}><stat.icon/></div>
                                <span className="text-[9px] font-bold text-slate-500 tracking-wider">{stat.label}</span>
                            </div>
                            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full ${stat.color} transition-all duration-1000`} style={{ width: `${Math.min(stat.val, 100)}%` }}></div>
                            </div>
                            <span className="text-xs font-mono font-bold text-white">{stat.val}%</span>
                        </div>
                    ))}
                </div>

                {/* T10 Grid */}
                <div className="bg-slate-950/50 rounded-lg p-3 border border-white/5 flex justify-between">
                    <T10Stat label="MOR" val={player.t10Morale} />
                    <div className="w-px bg-white/5"></div>
                    <T10Stat label="PRO" val={player.t10Protection} />
                    <div className="w-px bg-white/5"></div>
                    <T10Stat label="HP" val={player.t10Hp} />
                    <div className="w-px bg-white/5"></div>
                    <T10Stat label="ATK" val={player.t10Atk} />
                    <div className="w-px bg-white/5"></div>
                    <T10Stat label="DEF" val={player.t10Def} />
                </div>
            </div>

            {/* Footer Tech */}
            <div className="bg-[#050914] border-t border-white/5 p-3 flex justify-between items-center text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                <div className="flex gap-3">
                    <span>TECH: <b className="text-white">{player.techLevel}</b></span>
                    <span>BARR: <b className="text-white">{player.barracksLevel}</b></span>
                </div>
                {(player.secondSquadPower || 0) > 0 && (
                   <span className="text-sky-500 font-bold">+ {Math.round(((player.secondSquadPower || 0) + (player.thirdSquadPower || 0) + (player.fourthSquadPower || 0)) / 1000000)}M Res</span>
                )}
            </div>

            {/* Expandable Overlay (Hover/Click) */}
            <div className={`absolute inset-0 bg-[#020617]/95 backdrop-blur-sm z-20 flex flex-col justify-center items-center p-6 space-y-4 transition-all duration-300 ${showOverlay ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                 <div className="w-full space-y-2">
                    <h4 className="text-xs font-bold text-sky-500 uppercase tracking-widest border-b border-sky-500/20 pb-1">Squad Details</h4>
                    <div className="flex justify-between text-xs font-mono text-slate-300"><span>Squad 1</span><span>{formatMillions(player.firstSquadPower)}</span></div>
                    <div className="flex justify-between text-xs font-mono text-slate-300"><span>Squad 2</span><span>{player.secondSquadPower ? formatMillions(player.secondSquadPower) : '-'}</span></div>
                    <div className="flex justify-between text-xs font-mono text-slate-300"><span>Squad 3</span><span>{player.thirdSquadPower ? formatMillions(player.thirdSquadPower) : '-'}</span></div>
                    <div className="flex justify-between text-xs font-mono text-slate-300"><span>Squad 4</span><span>{player.fourthSquadPower ? formatMillions(player.fourthSquadPower) : '-'}</span></div>
                 </div>
                 <div className="w-full pt-2">
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div><div className="text-[9px] text-slate-500 uppercase">Tank</div><div className="text-white font-mono font-bold">{player.tankCenterLevel}</div></div>
                        <div><div className="text-[9px] text-slate-500 uppercase">Air</div><div className="text-white font-mono font-bold">{player.airCenterLevel}</div></div>
                        <div><div className="text-[9px] text-slate-500 uppercase">Misl</div><div className="text-white font-mono font-bold">{player.missileCenterLevel}</div></div>
                    </div>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default PlayerCard;
