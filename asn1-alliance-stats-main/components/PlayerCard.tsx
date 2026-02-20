import React, { useMemo } from 'react';
import { Player } from '../types';
import { useLanguage } from '../utils/i18n';
import { calculateT10RemainingCost, calculateStsRemainingCost } from '../utils/gameLogic';

interface PlayerCardProps {
  player: Player;
  rank?: number;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, rank }) => {
  const { t } = useLanguage();

  const t10Progress = useMemo(() => {
    const cost = calculateT10RemainingCost(player);
    const MAX_GOLD_REF = 35000000000; 
    const pct = Math.max(5, 100 - (cost.gold / MAX_GOLD_REF * 100));
    return Math.round(pct);
  }, [player]);

  const stsProgress = useMemo(() => {
    const cost = calculateStsRemainingCost(player);
    const MAX_STS_GOLD_REF = 15000000000; 
    const pct = Math.max(0, 100 - (cost.gold / MAX_STS_GOLD_REF * 100));
    return Math.min(100, Math.round(pct));
  }, [player]);

  const formatM = (val: number | undefined) => {
    if (!val) return '0.0M';
    return (val / 1000000).toFixed(1) + 'M';
  };

  const rankBorder = rank === 1 ? 'border-amber-500/40 shadow-amber-500/5' 
                  : rank === 2 ? 'border-slate-300/40 shadow-slate-300/5'
                  : rank === 3 ? 'border-orange-600/40 shadow-orange-600/5'
                  : 'border-white/5';

  const TinyStat = ({ label, val, color = "text-slate-300" }: any) => (
    <div className="flex flex-col bg-black/20 p-1.5 rounded border border-white/5">
        <span className="text-[6px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">{label}</span>
        <span className={`text-[10px] font-mono font-bold leading-none ${color}`}>{val}</span>
    </div>
  );

  return (
    <div className={`group relative bg-[#0a0f1e] rounded-2xl border ${rankBorder} p-4 transition-all duration-300 hover:border-sky-500/30 hover:bg-[#0d142b] shadow-xl`}>
      
      {/* Header Info */}
      <div className="flex justify-between items-start mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-base font-header font-black text-white truncate uppercase tracking-tight">{player.name}</h3>
            <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-black">{player.language.slice(0,3).toUpperCase()}</span>
          </div>
          <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">SYNCED: {new Date(player.updatedAt).toLocaleDateString()}</p>
        </div>
        {rank && (
          <div className={`w-8 h-8 flex items-center justify-center rounded-lg border font-header font-black text-sm ${rank <= 3 ? 'bg-white/5 text-white' : 'border-slate-800 text-slate-600'}`}>
            #{rank}
          </div>
        )}
      </div>

      {/* Primary Power Block */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-sky-500/5 border border-sky-500/10 rounded-xl p-2.5">
          <p className="text-[7px] font-black text-sky-500 uppercase tracking-widest mb-1">{t('label.power')}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-header font-black text-white">{formatM(player.firstSquadPower).replace('M', '')}</span>
            <span className="text-[10px] text-slate-500 font-bold">M</span>
          </div>
        </div>
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-2.5">
          <p className="text-[7px] font-black text-amber-500 uppercase tracking-widest mb-1">{t('label.totalHeroPower')}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-header font-black text-white">{formatM(player.totalHeroPower).replace('M', '')}</span>
            <span className="text-[10px] text-slate-500 font-bold">M</span>
          </div>
        </div>
      </div>

      {/* Secondary Squads Grid */}
      <div className="grid grid-cols-3 gap-1.5 mb-4">
        <TinyStat label={t('label.squad2')} val={formatM(player.secondSquadPower)} />
        <TinyStat label={t('label.squad3')} val={formatM(player.thirdSquadPower)} />
        <TinyStat label={t('label.squad4')} val={formatM(player.fourthSquadPower)} />
      </div>

      {/* Tech Percentages */}
      <div className="grid grid-cols-3 gap-1.5 mb-4 border-y border-white/5 py-3">
        <div className="text-center">
            <p className="text-[10px] font-mono font-black text-amber-400">{player.heroPercent}%</p>
            <p className="text-[6px] font-bold text-slate-600 uppercase tracking-widest">{t('stat.hero')}</p>
        </div>
        <div className="text-center">
            <p className="text-[10px] font-mono font-black text-sky-400">{player.duelPercent}%</p>
            <p className="text-[6px] font-bold text-slate-600 uppercase tracking-widest">{t('stat.duel')}</p>
        </div>
        <div className="text-center">
            <p className="text-[10px] font-mono font-black text-emerald-400">{player.unitsPercent}%</p>
            <p className="text-[6px] font-bold text-slate-600 uppercase tracking-widest">{t('stat.units')}</p>
        </div>
      </div>

      {/* T10 HUD */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-end">
          <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em]">T10 PROTOCOL</span>
          <span className="text-[9px] font-mono font-black text-sky-400">{t10Progress}%</span>
        </div>
        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden flex">
          <div className="h-full bg-sky-500 transition-all duration-1000" style={{ width: `${t10Progress}%` }}></div>
        </div>
      </div>

      {/* STS HUD */}
      <div className="space-y-1.5 mt-4 pt-4 border-t border-white/5">
        <div className="flex justify-between items-end">
          <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.2em]">STS PROTOCOL</span>
          <span className="text-[9px] font-mono font-black text-rose-400">{stsProgress}%</span>
        </div>
        <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden flex">
          <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${stsProgress}%` }}></div>
        </div>
      </div>

      <div className="flex justify-between pt-3">
          <div className="flex gap-1.5">
              {['t10Protection', 't10Hp', 't10Atk', 't10Def'].map((key) => (
                  <span key={key} className="text-[7px] font-mono text-slate-500 font-bold bg-slate-900 px-1 rounded border border-white/5">
                      {(player as any)[key]}
                  </span>
              ))}
          </div>
          <span className={`text-[7px] font-black uppercase ${player.t10Elite === 10 ? 'text-emerald-500' : 'text-slate-600'}`}>
              {player.t10Elite === 10 ? 'ELITE_READY' : 'T10_LOCKED'}
          </span>
      </div>
    </div>
  );
};

export default PlayerCard;