
import React from 'react';
import { Player } from '../types';
import { useLanguage } from '../utils/i18n';

interface PlayerCardProps {
  player: Player;
  rank?: number;
}

const formatNumber = (num: number) => new Intl.NumberFormat('en-US').format(num);

// Icons
const DuelIcon = () => <svg className="w-full h-full text-sky-500" viewBox="0 0 24 24" fill="currentColor"><path d="M14.5 3.5l1.5 1.5-4 4L14 11l4-4 1.5 1.5L8.5 19.5l-2-2L17.5 6.5l-3-3z"/><path d="M10.5 6.5l8 8-1.5 1.5-8-8 1.5-1.5z"/><path d="M5.2 17.8L6.2 18.8L3.5 21.5L2.5 20.5L5.2 17.8Z"/></svg>;
const HeroIcon = () => <svg className="w-full h-full text-amber-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z"/></svg>;
const UnitsIcon = () => <svg className="w-full h-full text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>;

// T10 Icons
const IconSword = () => <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M13.5 4.5l2 2-7.5 7.5-3-1.5 1.5-3 7-5zm-5 8l-2 2H2v-4.5l2-2 3.5 3.5z" clipRule="evenodd"/></svg>;
const IconShield = () => <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 002 0V7z" clipRule="evenodd"/></svg>;
const IconHeart = () => <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg>;
const IconProtect = () => <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>;
const MoraleIcon = () => <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M20 12h-1.56l-1.34-4.02C16.48 6.13 14.54 5 12.38 5h-0.76c-2.16 0-4.1 1.13-4.72 2.98L5.56 12H4c-1.1 0-2 0.9-2 2v2h20v-2c0-1.1-0.9-2-2-2z M12 21c-2.38 0-4.48-1.21-5.69-3.04l-0.57-0.85C5.39 16.59 5 15.85 5 15h14c0 0.85-0.39 1.59-0.74 2.11l-0.57 0.85C16.48 19.79 14.38 21 12 21z"/></svg>;


const PlayerCard: React.FC<PlayerCardProps> = ({ player, rank }) => {
  const { t, language } = useLanguage();

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
          <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-slate-900 border border-white/10 ${color} transition-colors shadow-lg`}>
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
             
             {/* Primary Power */}
             <div className="flex justify-between items-end border-b border-white/5 pb-4">
                 <div>
                     <p className="text-[9px] font-bold text-sky-500 uppercase tracking-[0.2em] mb-1">{t('label.power')}</p>
                     <p className="text-2xl font-mono font-bold text-white">{formatNumber(player.firstSquadPower)}</p>
                 </div>
                 {player.totalHeroPower > 0 && (
                     <div className="text-end">
                         <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">{t('card.hero_pwr')}</p>
                         <p className="text-lg font-mono font-bold text-amber-400">{formatMillions(player.totalHeroPower)}</p>
                     </div>
                 )}
             </div>

             {/* Secondary Squads Grid */}
             {hasExtraSquads && (
                 <div className="grid grid-cols-3 gap-3 border-b border-white/5 pb-4">
                    <div className="bg-slate-900/50 p-2 rounded border border-white/5 text-center">
                        <p className="text-[8px] text-slate-500 uppercase font-bold mb-1">{t('label.squad2')}</p>
                        <p className="text-xs font-mono font-bold text-slate-300">{player.secondSquadPower ? formatMillions(player.secondSquadPower) : '-'}</p>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded border border-white/5 text-center">
                        <p className="text-[8px] text-slate-500 uppercase font-bold mb-1">{t('label.squad3')}</p>
                        <p className="text-xs font-mono font-bold text-slate-300">{player.thirdSquadPower ? formatMillions(player.thirdSquadPower) : '-'}</p>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded border border-white/5 text-center">
                        <p className="text-[8px] text-slate-500 uppercase font-bold mb-1">{t('label.squad4')}</p>
                        <p className="text-xs font-mono font-bold text-slate-300">{player.fourthSquadPower ? formatMillions(player.fourthSquadPower) : '-'}</p>
                    </div>
                 </div>
             )}

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