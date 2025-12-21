import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import { useLanguage } from '../utils/i18n';
import { calculateT10RemainingCost } from '../utils/gameLogic';

interface PlayerCardProps {
  player: Player;
  rank?: number;
}

const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

const PlayerCard: React.FC<PlayerCardProps> = ({ player, rank }) => {
  const { t } = useLanguage();
  const [showOverlay, setShowOverlay] = useState(false);

  const t10Progress = useMemo(() => {
    const cost = calculateT10RemainingCost(player);
    const MAX_GOLD_REF = 30000000000; 
    const pct = Math.max(0, 100 - (cost.gold / MAX_GOLD_REF * 100));
    return Math.round(pct);
  }, [player]);

  const formatMillions = (val: number | undefined) => {
      if (val === undefined || val === null) return 'N/A';
      const millions = val / 1000000;
      return parseFloat(millions.toFixed(2)) + 'M';
  };

  const rankColor = rank === 1 ? 'text-amber-400 border-amber-500/50 bg-amber-500/10 shadow-[0_0_15px_rgba(251,191,36,0.3)]' 
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
        className="group relative w-full h-full cursor-pointer tap-highlight-transparent"
        onMouseEnter={() => setShowOverlay(true)}
        onMouseLeave={() => setShowOverlay(false)}
        onClick={() => setShowOverlay(prev => !prev)}
    >
        <div className="absolute -inset-0.5 bg-gradient-to-b from-sky-500/10 to-indigo-500/10 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
        
        <div className="relative h-full bg-[#0a0f1e] rounded-2xl border border-white/5 overflow-hidden flex flex-col transition-all duration-500 group-hover:border-sky-500/30 group-hover:translate-y-[-2px] shadow-2xl">
            
            <div className="p-5 pb-3">
                <div className="flex justify-between items-start">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                             <h3 className="text-base font-header font-bold text-white tracking-wider truncate max-w-[150px]">{player.name}</h3>
                             <span className="text-[8px] font-black px-1.5 py-0.5 rounded border border-white/10 text-slate-500 bg-white/5 uppercase">{player.language.substring(0,3)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${player.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
                            <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">{t('card.tech_short')}: <b className="text-slate-300">{player.techLevel}</b></span>
                        </div>
                    </div>
                    {rank && (
                        <div className={`w-9 h-9 flex items-center justify-center rounded-lg border backdrop-blur-md font-header font-black text-base transition-all group-hover:scale-110 ${rankColor}`}>
                            #{rank}
                        </div>
                    )}
                </div>
            </div>

            <div className="px-5 py-2">
                <div className="bg-[#0f172a] rounded-xl p-3 border border-white/5 group-hover:border-sky-500/20 transition-colors">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-[8px] text-sky-500 font-black uppercase tracking-[0.2em] mb-0.5">Primary Power</p>
                            <p className="text-2xl font-header font-black text-white tabular-nums tracking-tighter">
                                {formatNumber(player.firstSquadPower / 1000000)}<span className="text-sm text-slate-600 ml-0.5">M</span>
                            </p>
                        </div>
                        <div className="text-right">
                             <p className="text-[8px] text-amber-500 font-black uppercase tracking-[0.2em] mb-0.5">Hero Assets</p>
                             <p className="text-base font-mono font-bold text-slate-300 tabular-nums">
                                {formatNumber(player.totalHeroPower / 1000000)}<span className="text-[10px] text-slate-600 ml-0.5">M</span>
                             </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-5 py-2">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">T10 PROTOCOL PROGRESS</span>
                    <span className="text-[9px] font-mono font-bold text-sky-400">{t10Progress}%</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 shadow-[0_0_10px_#0ea5e9] transition-all duration-1000" style={{ width: `${t10Progress}%` }}></div>
                </div>
            </div>

            <div className="px-5 py-3 grid grid-cols-3 gap-2">
                {[
                    { val: player.heroPercent, label: 'HERO', color: 'text-amber-500' },
                    { val: player.duelPercent, label: 'DUEL', color: 'text-sky-500' },
                    { val: player.unitsPercent, label: 'UNIT', color: 'text-emerald-500' },
                ].map((stat, i) => (
                    <div key={i} className="text-center">
                        <p className={`text-xs font-mono font-black ${stat.color}`}>{stat.val}%</p>
                        <p className="text-[7px] font-bold text-slate-600 tracking-widest">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="mt-auto bg-slate-950/50 border-t border-white/5 p-3 flex justify-between items-center">
                <div className="flex gap-4">
                    <T10Stat label="PRO" val={player.t10Protection} />
                    <T10Stat label="HP" val={player.t10Hp} />
                    <T10Stat label="ATK" val={player.t10Atk} />
                </div>
                <div className="text-right">
                    <p className="text-[8px] text-slate-600 uppercase font-bold tracking-tighter">Updated</p>
                    <p className="text-[9px] font-mono text-slate-500">{new Date(player.updatedAt).toLocaleDateString()}</p>
                </div>
            </div>

            <div className={`absolute inset-0 bg-[#020617]/98 backdrop-blur-md z-20 flex flex-col justify-center items-center p-6 space-y-4 transition-all duration-500 ${showOverlay ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                 <div className="w-full space-y-2">
                    <h4 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.3em] border-b border-sky-500/20 pb-2 flex items-center justify-between">
                        <span>ASSET INTELLIGENCE</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </h4>
                    <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-slate-500">Squad 1</span>
                            <span className="text-white font-bold">{formatMillions(player.firstSquadPower)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-slate-500">Squad 2</span>
                            <span className="text-slate-300">{formatMillions(player.secondSquadPower)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-slate-500">Squad 3</span>
                            <span className="text-slate-300">{formatMillions(player.thirdSquadPower)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-slate-500">Squad 4</span>
                            <span className="text-slate-300">{formatMillions(player.fourthSquadPower)}</span>
                        </div>
                    </div>
                 </div>
                 <div className="w-full bg-slate-900/50 p-3 rounded-lg border border-white/5">
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div><div className="text-[7px] text-slate-500 font-black uppercase mb-1">{t('card.tank_short')}</div><div className="text-sm font-mono font-black text-white">{player.tankCenterLevel}</div></div>
                        <div><div className="text-[7px] text-slate-500 font-black uppercase mb-1">{t('card.air_short')}</div><div className="text-sm font-mono font-black text-white">{player.airCenterLevel}</div></div>
                        <div><div className="text-[7px] text-slate-500 font-black uppercase mb-1">{t('card.misl_short')}</div><div className="text-sm font-mono font-black text-white">{player.missileCenterLevel}</div></div>
                    </div>
                 </div>
                 <button className="text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-white transition-colors">Close Dossier</button>
            </div>
        </div>
    </div>
  );
};

export default PlayerCard;