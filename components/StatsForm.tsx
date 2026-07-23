import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MockApi } from '../services/mockBackend';
import { Player, Language } from '../types';
import { useLanguage } from '../utils/i18n';
import { CustomDropdown } from './CustomDropdown';
import { useToast } from './Toast';
import { calculateStsRemainingCost, calculateDefRemainingCost, calculateAirMasteryRemainingCost, calculateTankMasteryRemainingCost, calculateMissileMasteryRemainingCost } from '../utils/gameLogic';
import { 
  User, 
  Zap, 
  Flame, 
  Swords, 
  Shield, 
  Award, 
  Building2, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  RotateCcw
} from 'lucide-react';

const defaultFormData = {
  name: '', firstSquadPower: '', secondSquadPower: '', thirdSquadPower: '', fourthSquadPower: '', totalHeroPower: '',
  heroPercent: '', duelPercent: '', unitsPercent: '',
  t10Morale: '1', t10Protection: '0', t10Hp: '0', t10Atk: '0', t10Def: '0', t10Elite: '0',
  stsPowerBoost1: '0', stsFinalStand1: '0', stsFierceAssault1: '0', stsVigilantFormation1: '0',
  stsExtraDrillGround: '0', stsBarrackExpansion1: '0', stsFocusedTraining1: '0',
  stsFinalStand2: '0', stsFierceAssault2: '0', stsVigilantFormation2: '0',
  stsDrillGroundExpansion: '0', stsRapidMarch1: '0',
  stsFinalStand3: '0', stsFierceAssault3: '0', stsVigilantFormation3: '0', stsFatalStrike1: '0',
  defExtraHospitals: '0', defHoldLine1: '0', defCounterDefense1: '0', defSolidDefense1: '0',
  defFortifications: '0', defInfirmaryExpansion1: '0', defEfficientHealing: '0',
  defHoldLine2: '0', defCounterDefense2: '0', defSolidDefense2: '0',
  defResourceProtection: '0', defRapidMarch1: '0',
  defHoldLine3: '0', defCounterDefense3: '0', defSolidDefense3: '0',
  defSurvivalSkills: '0',
  techLevel: '', barracksLevel: '', tankCenterLevel: '', airCenterLevel: '', missileCenterLevel: '',
  masteryAirHp1: '0', masteryAirAtk1: '0', masteryAirDef1: '0', masteryAirDamage1: '0', masteryAirMarch1: '0',
  masteryAirHp2: '0', masteryAirAtk2: '0', masteryAirDef2: '0', masteryAirDamage2: '0', masteryAirUltDef1: '0',
  masteryAirHp3: '0', masteryAirAtk3: '0', masteryAirDef3: '0', masteryAirDamage3: '0', masteryAirMarch2: '0',
  masteryAirHp4: '0', masteryAirAtk4: '0', masteryAirDef4: '0', masteryAirDamage4: '0', masteryAirUltDef2: '0',
  masteryTankHp1: '0', masteryTankAtk1: '0', masteryTankDef1: '0', masteryTankDamage1: '0', masteryTankMarch1: '0',
  masteryTankHp2: '0', masteryTankAtk2: '0', masteryTankDef2: '0', masteryTankDamage2: '0', masteryTankUltDef1: '0',
  masteryTankHp3: '0', masteryTankAtk3: '0', masteryTankDef3: '0', masteryTankDamage3: '0', masteryTankMarch2: '0',
  masteryTankHp4: '0', masteryTankAtk4: '0', masteryTankDef4: '0', masteryTankDamage4: '0', masteryTankUltDef2: '0',
  masteryMissileHp1: '0', masteryMissileAtk1: '0', masteryMissileDef1: '0', masteryMissileDamage1: '0', masteryMissileMarch1: '0',
  masteryMissileHp2: '0', masteryMissileAtk2: '0', masteryMissileDef2: '0', masteryMissileDamage2: '0', masteryMissileUltDef1: '0',
  masteryMissileHp3: '0', masteryMissileAtk3: '0', masteryMissileDef3: '0', masteryMissileDamage3: '0', masteryMissileMarch2: '0',
  masteryMissileHp4: '0', masteryMissileAtk4: '0', masteryMissileDef4: '0', masteryMissileDamage4: '0', masteryMissileUltDef2: '0',
};

const FormInput = ({ label, name, val, change, req, locked, type="text", loading, onBlur, autoComplete, suffix, children }: any) => (
  <div className="relative group flex flex-col gap-1.5">
      {label && (
        <label className={`text-[10px] uppercase font-bold tracking-widest block ${locked ? 'text-amber-400' : 'text-sky-400/90'}`}>
            {label} {req && <span className="text-rose-400">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
          <input 
              type={type} name={name} value={val} onChange={change} required={req} onBlur={onBlur} autoComplete={autoComplete}
              className={`w-full bg-slate-950/80 border rounded-xl py-2 px-3 text-xs text-white font-mono focus:outline-none transition-all
                  ${locked 
                      ? 'border-amber-500/40 focus:border-amber-400 text-amber-100 bg-amber-500/5' 
                      : 'border-slate-800 focus:border-sky-500/80 focus:ring-1 focus:ring-sky-500/30'
                  }
              `}
          />
          {suffix && <span className="absolute right-3 text-[10px] font-mono font-bold text-slate-500">{suffix}</span>}
      </div>
      {children}
  </div>
);

const TechNode = ({ id, label, value, onChange, binary, hint, max=10, accentColor='sky' }: any) => {
    const isMax = Number(value) === max;
    const options = binary 
        ? [{ value: 0, label: '0' }, { value: 1, label: '1' }]
        : Array.from({length:max+1},(_,x)=>({value:x,label:x===max?'MAX':String(x)}));

    const colors: any = {
        amber: { border: 'border-amber-500/30', hover: 'hover:border-amber-400', shadow: 'hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]', icon: 'text-amber-400', iconBg: 'border-amber-500/50', maxBg: 'bg-amber-500/10', maxText: 'text-amber-400', ring: 'ring-amber-500/50' },
        sky: { border: 'border-sky-500/30', hover: 'hover:border-sky-400', shadow: 'hover:shadow-[0_0_15px_rgba(14,165,233,0.2)]', icon: 'text-sky-400', iconBg: 'border-sky-500/50', maxBg: 'bg-sky-500/10', maxText: 'text-sky-400', ring: 'ring-sky-500/50' },
        rose: { border: 'border-rose-500/30', hover: 'hover:border-rose-400', shadow: 'hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]', icon: 'text-rose-400', iconBg: 'border-rose-500/50', maxBg: 'bg-rose-500/10', maxText: 'text-rose-400', ring: 'ring-rose-500/50' },
        purple: { border: 'border-purple-500/50', hover: 'hover:border-purple-400', shadow: 'hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]', icon: 'text-purple-400', iconBg: 'border-purple-500', maxBg: 'bg-purple-500/10', maxText: 'text-purple-400', ring: 'ring-purple-500/50' }
    };

    const c = colors[binary ? 'purple' : accentColor] || colors.sky;

    return (
        <div className={`relative group bg-[#0f172a] rounded-xl border p-1 w-full max-w-[140px] transition-all z-10 ${c.border} ${c.hover} ${c.shadow} ${isMax ? c.maxBg + ' ring-1 ring-inset ' + c.ring : ''}`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                 <div className={`w-8 h-8 rounded-full bg-slate-900 border flex items-center justify-center shadow-lg transition-all ${c.iconBg} ${isMax ? 'scale-110 border-white/20' : ''}`}>
                     <svg className={`w-4 h-4 transition-colors ${c.icon} ${isMax ? 'text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 </div>
            </div>
            <div className="pt-6 pb-2 px-1 text-center">
                <label className={`block text-[8px] font-bold uppercase mb-2 truncate px-1 transition-colors ${isMax ? c.maxText : 'text-slate-400'}`}>{label}</label>
                <CustomDropdown value={value} onChange={onChange} options={options} disableSearch className={`text-xs ${isMax ? 'font-black' : ''}`} />
                {hint && <div className="mt-1 text-[7px] font-mono text-slate-600 uppercase tracking-tighter leading-none">{hint}</div>}
            </div>
            {isMax && (
                <div className={`absolute -right-1 -top-1 w-4 h-4 rounded-full bg-emerald-500 border border-white/20 shadow-lg flex items-center justify-center z-20 animate-pulse`}>
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                </div>
            )}
        </div>
    );
};

const MasteryTree = ({ type, formData, setFormData, resources, fR }: any) => {
    const prefix = type.charAt(0).toUpperCase() + type.slice(1);
    const displayTitle = type === 'air' ? 'Aircraft' : type === 'tank' ? 'Tank' : 'Missile Vehicle';
    const accentColor = type === 'air' ? 'amber' : type === 'tank' ? 'sky' : 'rose';
    
    // Tailwind class mappings to avoid dynamic string interpolation issues
    const borderClasses: any = { amber: 'border-amber-500/10', sky: 'border-sky-500/10', rose: 'border-rose-500/10' };
    const textClasses: any = { amber: 'text-amber-500', sky: 'text-sky-500', rose: 'text-rose-500' };
    const bgClasses: any = { amber: 'bg-amber-500/20', sky: 'bg-sky-500/20', rose: 'bg-rose-500/20' };
    const lineClasses: any = { amber: 'bg-amber-500/20', sky: 'bg-sky-500/20', rose: 'bg-rose-500/20' };
    const shadowClasses: any = { amber: 'shadow-[inset_0_0_20px_rgba(245,158,11,0.05)]', sky: 'shadow-[inset_0_0_20px_rgba(14,165,233,0.05)]', rose: 'shadow-[inset_0_0_20px_rgba(244,63,94,0.05)]' };

    const nodes = [
        { key: 'Hp1', label: `${displayTitle} Synergy - HP I`, max: 10 },
        { key: 'Atk1', label: `${displayTitle} Synergy - Attack I`, max: 10 },
        { key: 'Def1', label: `${displayTitle} Synergy - Defense I`, max: 10 },
        { key: 'Damage1', label: `${displayTitle} Synergy - Damage I`, max: 5 },
        { key: 'March1', label: `${displayTitle} - March Size I`, max: 5 },
        { key: 'Hp2', label: `${displayTitle} - HP I`, max: 10 },
        { key: 'Atk2', label: `${displayTitle} - Attack I`, max: 10 },
        { key: 'Def2', label: `${displayTitle} - Defense I`, max: 10 },
        { key: 'Damage2', label: `${displayTitle} - Damage I`, max: 5 },
        { key: 'UltDef1', label: `${displayTitle} - Ultimate Defense I`, max: 10 },
        { key: 'Hp3', label: `${displayTitle} Synergy - HP II`, max: 10 },
        { key: 'Atk3', label: `${displayTitle} Synergy - Attack II`, max: 10 },
        { key: 'Def3', label: `${displayTitle} Synergy - Defense II`, max: 10 },
        { key: 'Damage3', label: `${displayTitle} Synergy - Damage II`, max: 5 },
        { key: 'March2', label: `${displayTitle} - March Size II`, max: 5 },
        { key: 'Hp4', label: `${displayTitle} - HP II`, max: 10 },
        { key: 'Atk4', label: `${displayTitle} - Attack II`, max: 10 },
        { key: 'Def4', label: `${displayTitle} - Defense II`, max: 10 },
        { key: 'Damage4', label: `${displayTitle} - Damage II`, max: 5 },
        { key: 'UltDef2', label: `${displayTitle} - Ultimate Defense II`, max: 10 },
    ];

    const getVal = (key: string) => formData[`mastery${prefix}${key}`];
    const setVal = (key: string, v: any) => setFormData((p: any) => ({ ...p, [`mastery${prefix}${key}`]: v }));

    return (
        <div className={`bg-[#0a0f1e]/50 p-8 rounded-xl border ${borderClasses[accentColor]} space-y-10 ${shadowClasses[accentColor]}`}>
            <h4 className={`text-[10px] font-black ${textClasses[accentColor]} uppercase tracking-[0.3em]`}>{displayTitle.toUpperCase()} MASTERY PROTOCOL</h4>
            
            <div className="flex flex-col items-center">
                {/* Tier 1: Synergy I */}
                <div className="flex gap-4">
                    <TechNode label={nodes[0].label} value={getVal(nodes[0].key)} onChange={(v:any)=>setVal(nodes[0].key, v)} accentColor={accentColor} />
                    <TechNode label={nodes[1].label} value={getVal(nodes[1].key)} onChange={(v:any)=>setVal(nodes[1].key, v)} accentColor={accentColor} />
                    <TechNode label={nodes[2].label} value={getVal(nodes[2].key)} onChange={(v:any)=>setVal(nodes[2].key, v)} accentColor={accentColor} />
                </div>
                <div className={`relative w-full flex justify-center py-6`}>
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 h-full w-px ${lineClasses[accentColor]}`}></div>
                    <div className={`absolute top-0 left-[calc(50%-70px)] right-[calc(50%-70px)] h-px ${lineClasses[accentColor]}`}></div>
                </div>

                {/* Tier 2: Synergy DMG I */}
                <TechNode label={nodes[3].label} value={getVal(nodes[3].key)} onChange={(v:any)=>setVal(nodes[3].key, v)} max={nodes[3].max} accentColor={accentColor} />
                <div className={`h-6 w-px ${lineClasses[accentColor]}`}></div>

                {/* Tier 3: March I */}
                <TechNode label={nodes[4].label} value={getVal(nodes[4].key)} onChange={(v:any)=>setVal(nodes[4].key, v)} max={nodes[4].max} accentColor={accentColor} />
                <div className={`relative w-full flex justify-center py-6`}>
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 h-full w-px ${lineClasses[accentColor]}`}></div>
                    <div className={`absolute top-0 left-[calc(50%-70px)] right-[calc(50%-70px)] h-px ${lineClasses[accentColor]}`}></div>
                </div>

                {/* Tier 4: Unit I */}
                <div className="flex gap-4">
                    <TechNode label={nodes[5].label} value={getVal(nodes[5].key)} onChange={(v:any)=>setVal(nodes[5].key, v)} accentColor={accentColor} />
                    <TechNode label={nodes[6].label} value={getVal(nodes[6].key)} onChange={(v:any)=>setVal(nodes[6].key, v)} accentColor={accentColor} />
                    <TechNode label={nodes[7].label} value={getVal(nodes[7].key)} onChange={(v:any)=>setVal(nodes[7].key, v)} accentColor={accentColor} />
                </div>
                <div className={`relative w-full flex justify-center py-6`}>
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 h-full w-px ${lineClasses[accentColor]}`}></div>
                    <div className={`absolute top-0 left-[calc(50%-70px)] right-[calc(50%-70px)] h-px ${lineClasses[accentColor]}`}></div>
                </div>

                {/* Tier 5: Unit DMG I */}
                <TechNode label={nodes[8].label} value={getVal(nodes[8].key)} onChange={(v:any)=>setVal(nodes[8].key, v)} max={nodes[8].max} accentColor={accentColor} />
                <div className={`h-6 w-px ${lineClasses[accentColor]}`}></div>

                {/* Tier 6: Ult Def I */}
                <TechNode label={nodes[9].label} value={getVal(nodes[9].key)} onChange={(v:any)=>setVal(nodes[9].key, v)} accentColor={accentColor} />
                <div className={`relative w-full flex justify-center py-6`}>
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 h-full w-px ${lineClasses[accentColor]}`}></div>
                    <div className={`absolute top-0 left-[calc(50%-70px)] right-[calc(50%-70px)] h-px ${lineClasses[accentColor]}`}></div>
                </div>

                {/* Tier 7: Synergy II */}
                <div className="flex gap-4">
                    <TechNode label={nodes[10].label} value={getVal(nodes[10].key)} onChange={(v:any)=>setVal(nodes[10].key, v)} accentColor={accentColor} />
                    <TechNode label={nodes[11].label} value={getVal(nodes[11].key)} onChange={(v:any)=>setVal(nodes[11].key, v)} accentColor={accentColor} />
                    <TechNode label={nodes[12].label} value={getVal(nodes[12].key)} onChange={(v:any)=>setVal(nodes[12].key, v)} accentColor={accentColor} />
                </div>
                <div className={`relative w-full flex justify-center py-6`}>
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 h-full w-px ${lineClasses[accentColor]}`}></div>
                    <div className={`absolute top-0 left-[calc(50%-70px)] right-[calc(50%-70px)] h-px ${lineClasses[accentColor]}`}></div>
                </div>

                {/* Tier 8: Synergy DMG II */}
                <TechNode label={nodes[13].label} value={getVal(nodes[13].key)} onChange={(v:any)=>setVal(nodes[13].key, v)} max={nodes[13].max} accentColor={accentColor} />
                <div className={`h-6 w-px ${lineClasses[accentColor]}`}></div>

                {/* Tier 9: March II */}
                <TechNode label={nodes[14].label} value={getVal(nodes[14].key)} onChange={(v:any)=>setVal(nodes[14].key, v)} max={nodes[14].max} accentColor={accentColor} />
                <div className={`relative w-full flex justify-center py-6`}>
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 h-full w-px ${lineClasses[accentColor]}`}></div>
                    <div className={`absolute top-0 left-[calc(50%-70px)] right-[calc(50%-70px)] h-px ${lineClasses[accentColor]}`}></div>
                </div>

                {/* Tier 10: Unit II */}
                <div className="flex gap-4">
                    <TechNode label={nodes[15].label} value={getVal(nodes[15].key)} onChange={(v:any)=>setVal(nodes[15].key, v)} accentColor={accentColor} />
                    <TechNode label={nodes[16].label} value={getVal(nodes[16].key)} onChange={(v:any)=>setVal(nodes[16].key, v)} accentColor={accentColor} />
                    <TechNode label={nodes[17].label} value={getVal(nodes[17].key)} onChange={(v:any)=>setVal(nodes[17].key, v)} accentColor={accentColor} />
                </div>
                <div className={`relative w-full flex justify-center py-6`}>
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 h-full w-px ${lineClasses[accentColor]}`}></div>
                    <div className={`absolute top-0 left-[calc(50%-70px)] right-[calc(50%-70px)] h-px ${lineClasses[accentColor]}`}></div>
                </div>

                {/* Tier 11: Unit DMG II */}
                <TechNode label={nodes[18].label} value={getVal(nodes[18].key)} onChange={(v:any)=>setVal(nodes[18].key, v)} max={nodes[18].max} accentColor={accentColor} />
                <div className={`h-6 w-px ${lineClasses[accentColor]}`}></div>

                {/* Tier 12: Ult Def II */}
                <TechNode label={nodes[19].label} value={getVal(nodes[19].key)} onChange={(v:any)=>setVal(nodes[19].key, v)} accentColor={accentColor} />
            </div>

            {/* Resource Summary */}
            <div className="bg-black/40 border border-slate-800 p-4 rounded-lg flex justify-around shadow-inner">
                <div className="text-center">
                    <span className={`text-[10px] ${textClasses[accentColor]} block uppercase font-black tracking-widest`}>{type.toUpperCase()} GOLD</span>
                    <span className="text-sm font-mono text-white font-bold">{fR(resources.gold)}</span>
                </div>
                <div className="text-center border-x border-white/5 px-8">
                    <span className="text-[10px] text-purple-400 block uppercase font-black tracking-widest">{type.toUpperCase()} VALOR</span>
                    <span className="text-sm font-mono text-white font-bold">{resources.valor.toLocaleString()}</span>
                </div>
                <div className="text-center">
                    <span className="text-[10px] text-emerald-500 block uppercase font-black tracking-widest">{type.toUpperCase()} F/I</span>
                    <span className="text-sm font-mono text-white font-bold">{fR(resources.foodIron)}</span>
                </div>
            </div>
        </div>
    );
};

const Section = ({ title, color, isOpen, onToggle, children }: any) => {
  return (
    <div className={`overflow-hidden rounded-2xl border transition-all duration-500 ${isOpen ? 'bg-[#0a0f1e]/80 border-white/10 shadow-2xl' : 'bg-[#0a0f1e]/30 border-white/5 hover:border-white/10'}`}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center justify-between group transition-colors focus:outline-none"
      >
        <div className="flex items-center gap-4">
          <div className={`w-1 h-8 rounded-full transition-all duration-500 ${
            isOpen 
              ? color === 'sky' ? 'bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.5)]'
              : color === 'amber' ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
              : color === 'indigo' ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]'
              : color === 'rose' ? 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]'
              : color === 'emerald' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
              : 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]'
            : 'bg-slate-700 group-hover:bg-slate-600'
          }`}></div>
          <div className="text-left">
            <h3 className={`text-xs font-black uppercase tracking-[0.2em] transition-colors duration-500 ${isOpen ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>
              {title}
            </h3>
          </div>
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${isOpen ? 'bg-white/10 rotate-180' : 'bg-white/5'}`}>
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="px-6 pb-8 pt-2 border-t border-white/5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatsForm: React.FC<{ onSuccess: () => void; onBack: () => void }> = ({ onSuccess, onBack }) => {
  const { t, language } = useLanguage();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Player[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeMasteryTab, setActiveMasteryTab] = useState<'tank' | 'missile' | 'air'>('air');
  const searchTimeout = useRef<any>(null);
  
  const [activeTab, setActiveTab] = useState<string>('profile');

  const TABS = [
    { id: 'profile', label: 'Profile & Power', desc: 'Identity & squad ratings', icon: User, color: 'sky' },
    { id: 'sts', label: 'Siege to Seize', desc: 'Siege field tactics & ops', icon: Swords, color: 'rose' },
    { id: 'def', label: 'Defense Fortifications', desc: 'Infiltrator counters & hospitals', icon: Shield, color: 'sky' },
    { id: 'mastery', label: 'Mastery Protocol', desc: 'Vehicle tactical synergy', icon: Award, color: 'amber' },
    { id: 'buildings', label: 'Strategic Infrastructures', desc: 'Command center & war yards', icon: Building2, color: 'emerald' },
  ];

  const activeTabIndex = TABS.findIndex(t => t.id === activeTab);

  const handleNext = () => {
    if (activeTabIndex < TABS.length - 1) {
      setActiveTab(TABS[activeTabIndex + 1].id);
    }
  };

  const handlePrev = () => {
    if (activeTabIndex > 0) {
      setActiveTab(TABS[activeTabIndex - 1].id);
    }
  };

  const [formData, setFormData] = useState({ language: 'english' as Language, ...defaultFormData });

  React.useEffect(() => {
    const saved = localStorage.getItem('asn1_last_submission');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed, language }));
      } catch(e) {}
    }
  }, []);


  const resourcesNeeded = { gold: 0, valor: 0, foodIron: 0 };
  const stsResources = useMemo(() => calculateStsRemainingCost(formData), [formData]);
  const defResources = useMemo(() => calculateDefRemainingCost(formData), [formData]);
  const airMasteryResources = useMemo(() => calculateAirMasteryRemainingCost(formData), [formData]);
  const tankMasteryResources = useMemo(() => calculateTankMasteryRemainingCost(formData), [formData]);
  const missileMasteryResources = useMemo(() => calculateMissileMasteryRemainingCost(formData), [formData]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setFormData(prev => ({ ...prev, name: val }));
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      if (val.length >= 2) {
          searchTimeout.current = setTimeout(async () => {
              try {
                  const res = await MockApi.getPlayers({ search: val, language: 'all', sort: 'power_desc', activeOnly: false });
                  setSuggestions(res.items.slice(0, 5));
                  setShowSuggestions(true);
              } catch(e) {}
          }, 150);
      }
  };

  const populateWithPlayer = (match: Player) => {
      addToast('info', `Profile Synced: ${match.name}`);
      const nV = (v: any) => v === undefined ? '0' : String(v/1e6);
      const sV = (v: any) => v === undefined ? '0' : String(v);

      setFormData(prev => ({
          ...prev,
          name: match.name,
          language: match.language,
          firstSquadPower: nV(match.firstSquadPower),
          secondSquadPower: nV(match.secondSquadPower),
          thirdSquadPower: nV(match.thirdSquadPower),
          fourthSquadPower: nV(match.fourthSquadPower),
          totalHeroPower: nV(match.totalHeroPower),
          heroPercent: sV(match.heroPercent),
          duelPercent: sV(match.duelPercent),
          unitsPercent: sV(match.unitsPercent),
          t10Morale: sV(match.t10Morale),
          t10Protection: sV(match.t10Protection),
          t10Hp: sV(match.t10Hp),
          t10Atk: sV(match.t10Atk),
          t10Def: sV(match.t10Def),
          t10Elite: sV(match.t10Elite),
          stsPowerBoost1: sV(match.stsPowerBoost1),
          stsFinalStand1: sV(match.stsFinalStand1),
          stsFierceAssault1: sV(match.stsFierceAssault1),
          stsVigilantFormation1: sV(match.stsVigilantFormation1),
          stsExtraDrillGround: sV(match.stsExtraDrillGround),
          stsBarrackExpansion1: sV(match.stsBarrackExpansion1),
          stsFocusedTraining1: sV(match.stsFocusedTraining1),
          stsFinalStand2: sV(match.stsFinalStand2),
          stsFierceAssault2: sV(match.stsFierceAssault2),
          stsVigilantFormation2: sV(match.stsVigilantFormation2),
          stsDrillGroundExpansion: sV(match.stsDrillGroundExpansion),
          stsRapidMarch1: sV(match.stsRapidMarch1),
          stsFinalStand3: sV(match.stsFinalStand3),
          stsFierceAssault3: sV(match.stsFierceAssault3),
          stsVigilantFormation3: sV(match.stsVigilantFormation3),
          stsFatalStrike1: sV(match.stsFatalStrike1),
          defExtraHospitals: sV(match.defExtraHospitals),
          defHoldLine1: sV(match.defHoldLine1),
          defCounterDefense1: sV(match.defCounterDefense1),
          defSolidDefense1: sV(match.defSolidDefense1),
          defFortifications: sV(match.defFortifications),
          defInfirmaryExpansion1: sV(match.defInfirmaryExpansion1),
          defEfficientHealing: sV(match.defEfficientHealing),
          defHoldLine2: sV(match.defHoldLine2),
          defCounterDefense2: sV(match.defCounterDefense2),
          defSolidDefense2: sV(match.defSolidDefense2),
          defResourceProtection: sV(match.defResourceProtection),
          defRapidMarch1: sV(match.defRapidMarch1),
          defHoldLine3: sV(match.defHoldLine3),
          defCounterDefense3: sV(match.defCounterDefense3),
          defSolidDefense3: sV(match.defSolidDefense3),
          defSurvivalSkills: sV(match.defSurvivalSkills),
          techLevel: sV(match.techLevel),
          barracksLevel: sV(match.barracksLevel),
          tankCenterLevel: sV(match.tankCenterLevel),
          airCenterLevel: sV(match.airCenterLevel),
          missileCenterLevel: sV(match.missileCenterLevel),
          masteryAirHp1: sV(match.masteryAirHp1),
          masteryAirAtk1: sV(match.masteryAirAtk1),
          masteryAirDef1: sV(match.masteryAirDef1),
          masteryAirDamage1: sV(match.masteryAirDamage1),
          masteryAirMarch1: sV(match.masteryAirMarch1),
          masteryAirHp2: sV(match.masteryAirHp2),
          masteryAirAtk2: sV(match.masteryAirAtk2),
          masteryAirDef2: sV(match.masteryAirDef2),
          masteryAirDamage2: sV(match.masteryAirDamage2),
          masteryAirUltDef1: sV(match.masteryAirUltDef1),
          masteryAirHp3: sV(match.masteryAirHp3),
          masteryAirAtk3: sV(match.masteryAirAtk3),
          masteryAirDef3: sV(match.masteryAirDef3),
          masteryAirDamage3: sV(match.masteryAirDamage3),
          masteryAirMarch2: sV(match.masteryAirMarch2),
          masteryAirHp4: sV(match.masteryAirHp4),
          masteryAirAtk4: sV(match.masteryAirAtk4),
          masteryAirDef4: sV(match.masteryAirDef4),
          masteryAirDamage4: sV(match.masteryAirDamage4),
          masteryAirUltDef2: sV(match.masteryAirUltDef2),
          masteryTankHp1: sV(match.masteryTankHp1),
          masteryTankAtk1: sV(match.masteryTankAtk1),
          masteryTankDef1: sV(match.masteryTankDef1),
          masteryTankDamage1: sV(match.masteryTankDamage1),
          masteryTankMarch1: sV(match.masteryTankMarch1),
          masteryTankHp2: sV(match.masteryTankHp2),
          masteryTankAtk2: sV(match.masteryTankAtk2),
          masteryTankDef2: sV(match.masteryTankDef2),
          masteryTankDamage2: sV(match.masteryTankDamage2),
          masteryTankUltDef1: sV(match.masteryTankUltDef1),
          masteryTankHp3: sV(match.masteryTankHp3),
          masteryTankAtk3: sV(match.masteryTankAtk3),
          masteryTankDef3: sV(match.masteryTankDef3),
          masteryTankDamage3: sV(match.masteryTankDamage3),
          masteryTankMarch2: sV(match.masteryTankMarch2),
          masteryTankHp4: sV(match.masteryTankHp4),
          masteryTankAtk4: sV(match.masteryTankAtk4),
          masteryTankDef4: sV(match.masteryTankDef4),
          masteryTankDamage4: sV(match.masteryTankDamage4),
          masteryTankUltDef2: sV(match.masteryTankUltDef2),
          masteryMissileHp1: sV(match.masteryMissileHp1),
          masteryMissileAtk1: sV(match.masteryMissileAtk1),
          masteryMissileDef1: sV(match.masteryMissileDef1),
          masteryMissileDamage1: sV(match.masteryMissileDamage1),
          masteryMissileMarch1: sV(match.masteryMissileMarch1),
          masteryMissileHp2: sV(match.masteryMissileHp2),
          masteryMissileAtk2: sV(match.masteryMissileAtk2),
          masteryMissileDef2: sV(match.masteryMissileDef2),
          masteryMissileDamage2: sV(match.masteryMissileDamage2),
          masteryMissileUltDef1: sV(match.masteryMissileUltDef1),
          masteryMissileHp3: sV(match.masteryMissileHp3),
          masteryMissileAtk3: sV(match.masteryMissileAtk3),
          masteryMissileDef3: sV(match.masteryMissileDef3),
          masteryMissileDamage3: sV(match.masteryMissileDamage3),
          masteryMissileMarch2: sV(match.masteryMissileMarch2),
          masteryMissileHp4: sV(match.masteryMissileHp4),
          masteryMissileAtk4: sV(match.masteryMissileAtk4),
          masteryMissileDef4: sV(match.masteryMissileDef4),
          masteryMissileDamage4: sV(match.masteryMissileDamage4),
          masteryMissileUltDef2: sV(match.masteryMissileUltDef2)
      }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const norm = (v: any) => { const n = Number(v); return n > 1000 ? n : Math.round(n * 1e6); };
    try {
        const res = await MockApi.upsertPlayer({
            name: formData.name,
            language: formData.language,
            firstSquadPower: norm(formData.firstSquadPower),
            secondSquadPower: norm(formData.secondSquadPower),
            thirdSquadPower: norm(formData.thirdSquadPower),
            fourthSquadPower: norm(formData.fourthSquadPower),
            totalHeroPower: norm(formData.totalHeroPower),
            heroPercent: 0,
            duelPercent: 0,
            unitsPercent: 0,
            t10Morale: Number(formData.t10Morale),
            t10Protection: Number(formData.t10Protection),
            t10Hp: Number(formData.t10Hp),
            t10Atk: Number(formData.t10Atk),
            t10Def: Number(formData.t10Def),
            t10Elite: Number(formData.t10Elite),
            stsPowerBoost1: Number(formData.stsPowerBoost1),
            stsFinalStand1: Number(formData.stsFinalStand1),
            stsFierceAssault1: Number(formData.stsFierceAssault1),
            stsVigilantFormation1: Number(formData.stsVigilantFormation1),
            stsExtraDrillGround: Number(formData.stsExtraDrillGround),
            stsBarrackExpansion1: Number(formData.stsBarrackExpansion1),
            stsFocusedTraining1: Number(formData.stsFocusedTraining1),
            stsFinalStand2: Number(formData.stsFinalStand2),
            stsFierceAssault2: Number(formData.stsFierceAssault2),
            stsVigilantFormation2: Number(formData.stsVigilantFormation2),
            stsDrillGroundExpansion: Number(formData.stsDrillGroundExpansion),
            stsRapidMarch1: Number(formData.stsRapidMarch1),
            stsFinalStand3: Number(formData.stsFinalStand3),
            stsFierceAssault3: Number(formData.stsFierceAssault3),
            stsVigilantFormation3: Number(formData.stsVigilantFormation3),
            stsFatalStrike1: Number(formData.stsFatalStrike1),
            defExtraHospitals: Number(formData.defExtraHospitals),
            defHoldLine1: Number(formData.defHoldLine1),
            defCounterDefense1: Number(formData.defCounterDefense1),
            defSolidDefense1: Number(formData.defSolidDefense1),
            defFortifications: Number(formData.defFortifications),
            defInfirmaryExpansion1: Number(formData.defInfirmaryExpansion1),
            defEfficientHealing: Number(formData.defEfficientHealing),
            defHoldLine2: Number(formData.defHoldLine2),
            defCounterDefense2: Number(formData.defCounterDefense2),
            defSolidDefense2: Number(formData.defSolidDefense2),
            defResourceProtection: Number(formData.defResourceProtection),
            defRapidMarch1: Number(formData.defRapidMarch1),
            defHoldLine3: Number(formData.defHoldLine3),
            defCounterDefense3: Number(formData.defCounterDefense3),
            defSolidDefense3: Number(formData.defSolidDefense3),
            defSurvivalSkills: Number(formData.defSurvivalSkills),
            techLevel: Number(formData.techLevel),
            barracksLevel: Number(formData.barracksLevel),
            tankCenterLevel: Number(formData.tankCenterLevel),
            airCenterLevel: Number(formData.airCenterLevel),
            missileCenterLevel: Number(formData.missileCenterLevel),
            masteryAirHp1: Number(formData.masteryAirHp1),
            masteryAirAtk1: Number(formData.masteryAirAtk1),
            masteryAirDef1: Number(formData.masteryAirDef1),
            masteryAirDamage1: Number(formData.masteryAirDamage1),
            masteryAirMarch1: Number(formData.masteryAirMarch1),
            masteryAirHp2: Number(formData.masteryAirHp2),
            masteryAirAtk2: Number(formData.masteryAirAtk2),
            masteryAirDef2: Number(formData.masteryAirDef2),
            masteryAirDamage2: Number(formData.masteryAirDamage2),
            masteryAirUltDef1: Number(formData.masteryAirUltDef1),
            masteryAirHp3: Number(formData.masteryAirHp3),
            masteryAirAtk3: Number(formData.masteryAirAtk3),
            masteryAirDef3: Number(formData.masteryAirDef3),
            masteryAirDamage3: Number(formData.masteryAirDamage3),
            masteryAirMarch2: Number(formData.masteryAirMarch2),
            masteryAirHp4: Number(formData.masteryAirHp4),
            masteryAirAtk4: Number(formData.masteryAirAtk4),
            masteryAirDef4: Number(formData.masteryAirDef4),
            masteryAirDamage4: Number(formData.masteryAirDamage4),
            masteryAirUltDef2: Number(formData.masteryAirUltDef2),
            masteryTankHp1: Number(formData.masteryTankHp1),
            masteryTankAtk1: Number(formData.masteryTankAtk1),
            masteryTankDef1: Number(formData.masteryTankDef1),
            masteryTankDamage1: Number(formData.masteryTankDamage1),
            masteryTankMarch1: Number(formData.masteryTankMarch1),
            masteryTankHp2: Number(formData.masteryTankHp2),
            masteryTankAtk2: Number(formData.masteryTankAtk2),
            masteryTankDef2: Number(formData.masteryTankDef2),
            masteryTankDamage2: Number(formData.masteryTankDamage2),
            masteryTankUltDef1: Number(formData.masteryTankUltDef1),
            masteryTankHp3: Number(formData.masteryTankHp3),
            masteryTankAtk3: Number(formData.masteryTankAtk3),
            masteryTankDef3: Number(formData.masteryTankDef3),
            masteryTankDamage3: Number(formData.masteryTankDamage3),
            masteryTankMarch2: Number(formData.masteryTankMarch2),
            masteryTankHp4: Number(formData.masteryTankHp4),
            masteryTankAtk4: Number(formData.masteryTankAtk4),
            masteryTankDef4: Number(formData.masteryTankDef4),
            masteryTankDamage4: Number(formData.masteryTankDamage4),
            masteryTankUltDef2: Number(formData.masteryTankUltDef2),
            masteryMissileHp1: Number(formData.masteryMissileHp1),
            masteryMissileAtk1: Number(formData.masteryMissileAtk1),
            masteryMissileDef1: Number(formData.masteryMissileDef1),
            masteryMissileDamage1: Number(formData.masteryMissileDamage1),
            masteryMissileMarch1: Number(formData.masteryMissileMarch1),
            masteryMissileHp2: Number(formData.masteryMissileHp2),
            masteryMissileAtk2: Number(formData.masteryMissileAtk2),
            masteryMissileDef2: Number(formData.masteryMissileDef2),
            masteryMissileDamage2: Number(formData.masteryMissileDamage2),
            masteryMissileUltDef1: Number(formData.masteryMissileUltDef1),
            masteryMissileHp3: Number(formData.masteryMissileHp3),
            masteryMissileAtk3: Number(formData.masteryMissileAtk3),
            masteryMissileDef3: Number(formData.masteryMissileDef3),
            masteryMissileDamage3: Number(formData.masteryMissileDamage3),
            masteryMissileMarch2: Number(formData.masteryMissileMarch2),
            masteryMissileHp4: Number(formData.masteryMissileHp4),
            masteryMissileAtk4: Number(formData.masteryMissileAtk4),
            masteryMissileDef4: Number(formData.masteryMissileDef4),
            masteryMissileDamage4: Number(formData.masteryMissileDamage4),
            masteryMissileUltDef2: Number(formData.masteryMissileUltDef2)
        } as any);
        if(res.success) {
            localStorage.setItem('asn1_last_submission', JSON.stringify(formData));
            onSuccess();
        } else throw new Error(res.error);
    } catch(err: any) { addToast('error', err.message); } finally { setLoading(false); }
  };

  const fR = (n: number) => n >= 1e9 ? (n/1e9).toFixed(1)+'B' : (n/1e6).toFixed(0)+'M';

  const moraleOptions = Array.from({ length: 10 }, (_, i) => ({
      value: i + 1,
      label: i + 1 === 10 ? '10 (MAX)' : String(i + 1)
  }));

  return (
    <div className="relative w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
            <div className="flex items-center gap-4">
                <button onClick={onBack} type="button" className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-700 hover:border-sky-500 hover:text-sky-500 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <h2 className="text-xl font-header font-bold text-white uppercase tracking-widest flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-sm"></span>
                    {t('form.title')}
                </h2>
            </div>
            <button type="button" onClick={() => setFormData({ language, ...defaultFormData })} className="text-[10px] font-bold text-slate-500 hover:text-white uppercase px-3 py-1 border border-slate-800 rounded transition-colors hover:bg-slate-800/50">Reset</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* Visual Category Sub-Menu with polished Icons */}
                <div className="md:col-span-4 lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-col gap-2">
                    {TABS.map(tab => {
                        const IconComponent = tab.icon;
                        const isActive = activeTab === tab.id;
                        
                        let activeClass = "";
                        if (tab.color === 'sky') activeClass = "border-sky-500/50 bg-sky-500/10 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.15)]";
                        else if (tab.color === 'emerald') activeClass = "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]";
                        else if (tab.color === 'indigo') activeClass = "border-indigo-500/50 bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.15)]";
                        else if (tab.color === 'rose') activeClass = "border-rose-500/50 bg-rose-500/10 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]";
                        else if (tab.color === 'amber') activeClass = "border-amber-500/50 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)]";

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-all hover:scale-[1.01] ${
                                    isActive 
                                        ? activeClass 
                                        : "border-white/5 bg-slate-900/30 text-slate-400 hover:text-slate-300 hover:border-white/10"
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                    isActive 
                                        ? tab.color === 'sky' ? 'bg-sky-500/20 text-sky-400'
                                          : tab.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400'
                                          : tab.color === 'indigo' ? 'bg-indigo-500/20 text-indigo-400'
                                          : tab.color === 'rose' ? 'bg-rose-500/20 text-rose-400'
                                          : 'bg-amber-500/20 text-amber-400'
                                        : 'bg-slate-900 text-slate-500'
                                }`}>
                                    <IconComponent className="w-4 h-4" />
                                </div>
                                <div className="hidden md:block">
                                    <h4 className="text-[10px] font-black uppercase tracking-wider">
                                        {tab.id === 'profile' ? t('tab.profile')
                                         : tab.id === 'sts' ? t('tab.sts')
                                         : tab.id === 'def' ? t('tab.def')
                                         : tab.id === 'mastery' ? t('tab.mastery')
                                         : t('tab.buildings')}
                                    </h4>
                                    <p className="text-[7.5px] text-slate-500 uppercase tracking-tight leading-none truncate max-w-[130px]">
                                        {tab.id === 'profile' ? t('section.identity.desc')
                                         : tab.id === 'sts' ? t('sts.title')
                                         : tab.id === 'def' ? t('def.title')
                                         : tab.id === 'mastery' ? t('tab.mastery')
                                         : t('section.infrastructure.desc')}
                                    </p>
                                </div>
                                <div className="md:hidden">
                                    <h4 className="text-[9px] font-black uppercase tracking-wider truncate">
                                        {tab.id === 'profile' ? t('tab.profile').split(' ')[0]
                                         : tab.id === 'sts' ? t('tab.sts').split(' ')[0]
                                         : tab.id === 'def' ? t('tab.def').split(' ')[0]
                                         : tab.id === 'mastery' ? t('tab.mastery').split(' ')[0]
                                         : t('tab.buildings').split(' ')[0]}
                                    </h4>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Main Tab sheet control dashboard */}
                <div className="md:col-span-8 lg:col-span-9 bg-[#0b1329]/80 border border-white/5 p-6 md:p-8 rounded-2xl relative shadow-2xl min-h-[460px] flex flex-col justify-between">
                    
                    <div className="space-y-6">
                        
                        {/* Profile tab sheet */}
                        {activeTab === 'profile' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black text-white uppercase tracking-wider">{t('tab.profile')}</h3>
                                        <p className="text-[9px] text-slate-500 uppercase tracking-widest leading-none">{t('section.identity.desc')}</p>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('section.identity')}</h4>
                                        <div className="relative">
                                            <FormInput 
                                                label={t('label.name')} 
                                                name="name" 
                                                val={formData.name} 
                                                change={handleNameChange} 
                                                req={true} 
                                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} 
                                                autoComplete="off"
                                            >
                                                {showSuggestions && suggestions.length > 0 && (
                                                    <div className="absolute top-full left-0 w-full bg-[#0a0f1e] border border-slate-700 z-50 rounded-b-xl overflow-hidden divide-y divide-slate-800">
                                                        {suggestions.map(s => (
                                                            <button key={s.id} type="button" onClick={() => populateWithPlayer(s)} className="w-full px-6 py-4 text-left hover:bg-sky-500/10 transition-colors flex justify-between items-center group">
                                                                <span className="text-sm font-bold text-white group-hover:text-sky-400">{s.name}</span>
                                                                <span className="text-[10px] font-mono text-slate-500">{(s.firstSquadPower/1e6).toFixed(1)}M</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </FormInput>
                                        </div>
                                    </div>

                                    <div className="space-y-4 border-t border-white/5 pt-6">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('section.power')}</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            <FormInput label={t('label.power')+"(M)"} name="firstSquadPower" val={formData.firstSquadPower} change={(e:any)=>setFormData(p=>({...p,firstSquadPower:e.target.value}))} req={true} type="number" />
                                            <FormInput label={t('label.squad2')+"(M)"} name="secondSquadPower" val={formData.secondSquadPower} change={(e:any)=>setFormData(p=>({...p,secondSquadPower:e.target.value}))} type="number" />
                                            <FormInput label={t('label.squad3')+"(M)"} name="thirdSquadPower" val={formData.thirdSquadPower} change={(e:any)=>setFormData(p=>({...p,thirdSquadPower:e.target.value}))} type="number" />
                                            <FormInput label={t('label.squad4')+"(M)"} name="fourthSquadPower" val={formData.fourthSquadPower} change={(e:any)=>setFormData(p=>({...p,fourthSquadPower:e.target.value}))} type="number" />
                                            <div className="col-span-2 md:col-span-4 mt-2">
                                                <FormInput label={t('label.totalHeroPower')+"(M)"} name="totalHeroPower" val={formData.totalHeroPower} change={(e:any)=>setFormData(p=>({...p,totalHeroPower:e.target.value}))} req={true} type="number" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* T10 drop-sheet */}
                        {false && activeTab === 't10' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                        <Flame className="w-5 h-5 animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black text-white uppercase tracking-wider">{t('t10.title')}</h3>
                                        <p className="text-[9px] text-slate-500 uppercase tracking-widest leading-none">{t('section.t10.desc')}</p>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <div className="flex flex-col items-center">
                                         <div className="max-w-xs w-full text-left space-y-2 mb-10">
                                            <label className="block text-[10px] font-bold text-sky-500 uppercase tracking-widest ml-1">Morale Level *</label>
                                            <CustomDropdown 
                                                value={formData.t10Morale} 
                                                onChange={(v: any) => setFormData(p => ({...p, t10Morale: String(v)}))} 
                                                options={moraleOptions}
                                                disableSearch
                                            />
                                         </div>

                                         <TechNode label={t('t10.protection')} value={formData.t10Protection} onChange={(v:any)=>setFormData(p=>({...p,t10Protection:v}))} />
                                         <div className="h-6 w-px bg-indigo-500/30"></div>
                                         <div className="flex gap-4">
                                             <TechNode label={t('t10.hp')} value={formData.t10Hp} onChange={(v:any)=>setFormData(p=>({...p,t10Hp:v}))} />
                                             <TechNode label={t('t10.atk')} value={formData.t10Atk} onChange={(v:any)=>setFormData(p=>({...p,t10Atk:v}))} />
                                             <TechNode label={t('t10.def')} value={formData.t10Def} onChange={(v:any)=>setFormData(p=>({...p,t10Def:v}))} />
                                         </div>
                                         <div className="h-6 w-px bg-indigo-500/30"></div>
                                         <TechNode label="Elite Units" value={formData.t10Elite} onChange={(v:any)=>setFormData(p=>({...p,t10Elite:v}))} binary />
                                    </div>
                                    
                                    <div className="bg-black/40 border border-slate-800 p-4 rounded-lg flex justify-around shadow-inner">
                                        <div className="text-center">
                                            <span className="text-[10px] text-amber-500 block uppercase font-black tracking-widest">SF GOLD</span>
                                            <span className="text-sm font-mono text-white font-bold">{fR(resourcesNeeded.gold)}</span>
                                        </div>
                                        <div className="text-center border-x border-white/5 px-8">
                                            <span className="text-[10px] text-purple-400 block uppercase font-black tracking-widest">SF VALOR</span>
                                            <span className="text-sm font-mono text-white font-bold">{resourcesNeeded.valor.toLocaleString()}</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-[10px] text-emerald-500 block uppercase font-black tracking-widest">SF F/I</span>
                                            <span className="text-sm font-mono text-white font-bold">{fR(resourcesNeeded.foodIron)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* STS tab sheet */}
                        {activeTab === 'sts' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                                        <Swords className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black text-white uppercase tracking-wider">{t('tab.sts')}</h3>
                                        <p className="text-[9px] text-slate-500 uppercase tracking-widest leading-none">{t('sts.title')}</p>
                                    </div>
                                </div>
                                <div className="space-y-10">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="flex gap-4">
                                            <TechNode label={t('sts.final_stand')+" I"} value={formData.stsFinalStand1} onChange={(v:any)=>setFormData(p=>({...p,stsFinalStand1:v}))} accentColor="rose" />
                                            <TechNode label={t('sts.fierce_assault')+" I"} value={formData.stsFierceAssault1} onChange={(v:any)=>setFormData(p=>({...p,stsFierceAssault1:v}))} accentColor="rose" />
                                            <TechNode label={t('sts.vigilant')+" I"} value={formData.stsVigilantFormation1} onChange={(v:any)=>setFormData(p=>({...p,stsVigilantFormation1:v}))} accentColor="rose" />
                                        </div>
                                        <div className="h-6 w-px bg-rose-500/30"></div>
                                        <div className="flex gap-4">
                                            <TechNode label={t('sts.final_stand')+" II"} value={formData.stsFinalStand2} onChange={(v:any)=>setFormData(p=>({...p,stsFinalStand2:v}))} accentColor="rose" />
                                            <TechNode label={t('sts.fierce_assault')+" II"} value={formData.stsFierceAssault2} onChange={(v:any)=>setFormData(p=>({...p,stsFierceAssault2:v}))} accentColor="rose" />
                                            <TechNode label={t('sts.vigilant')+" II"} value={formData.stsVigilantFormation2} onChange={(v:any)=>setFormData(p=>({...p,stsVigilantFormation2:v}))} accentColor="rose" />
                                        </div>
                                        <div className="h-6 w-px bg-rose-500/30"></div>
                                        <div className="flex gap-4">
                                            <TechNode label={t('sts.final_stand')+" III"} value={formData.stsFinalStand3} onChange={(v:any)=>setFormData(p=>({...p,stsFinalStand3:v}))} hint="REQ: T10 Lv4" accentColor="rose" />
                                            <TechNode label={t('sts.fierce_assault')+" III"} value={formData.stsFierceAssault3} onChange={(v:any)=>setFormData(p=>({...p,stsFierceAssault3:v}))} hint="REQ: T10 Lv4" accentColor="rose" />
                                            <TechNode label={t('sts.vigilant')+" III"} value={formData.stsVigilantFormation3} onChange={(v:any)=>setFormData(p=>({...p,stsVigilantFormation3:v}))} hint="REQ: T10 Lv4" accentColor="rose" />
                                        </div>
                                    </div>

                                    <div className="bg-black/40 border border-slate-800 p-4 rounded-lg flex justify-around shadow-inner">
                                        <div className="text-center">
                                            <span className="text-[10px] text-amber-500 block uppercase font-black tracking-widest">STS GOLD</span>
                                            <span className="text-sm font-mono text-white font-bold">{fR(stsResources.gold)}</span>
                                        </div>
                                        <div className="text-center border-x border-white/5 px-8">
                                            <span className="text-[10px] text-purple-400 block uppercase font-black tracking-widest">STS VALOR</span>
                                            <span className="text-sm font-mono text-white font-bold">{stsResources.valor.toLocaleString()}</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-[10px] text-emerald-500 block uppercase font-black tracking-widest">STS F/I</span>
                                            <span className="text-sm font-mono text-white font-bold">{fR(stsResources.foodIron)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Defense tab sheet */}
                        {activeTab === 'def' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                                        <Shield className="w-5 h-5 animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black text-white uppercase tracking-wider">{t('tab.def')}</h3>
                                        <p className="text-[9px] text-slate-500 uppercase tracking-widest leading-none">{t('def.title')}</p>
                                    </div>
                                </div>
                                <div className="space-y-10">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="flex gap-4">
                                            <TechNode label={t('def.hold_line')+" I"} value={formData.defHoldLine1} onChange={(v:any)=>setFormData(p=>({...p,defHoldLine1:v}))} />
                                            <TechNode label={t('def.counter_defense')+" I"} value={formData.defCounterDefense1} onChange={(v:any)=>setFormData(p=>({...p,defCounterDefense1:v}))} />
                                            <TechNode label={t('def.solid_defense')+" I"} value={formData.defSolidDefense1} onChange={(v:any)=>setFormData(p=>({...p,defSolidDefense1:v}))} />
                                        </div>
                                        <div className="h-6 w-px bg-sky-500/30"></div>
                                        <div className="flex gap-4">
                                            <TechNode label={t('def.hold_line')+" II"} value={formData.defHoldLine2} onChange={(v:any)=>setFormData(p=>({...p,defHoldLine2:v}))} hint="REQ: T3 Lv1" />
                                            <TechNode label={t('def.counter_defense')+" II"} value={formData.defCounterDefense2} onChange={(v:any)=>setFormData(p=>({...p,defCounterDefense2:v}))} hint="REQ: T3 Lv1" />
                                            <TechNode label={t('def.solid_defense')+" II"} value={formData.defSolidDefense2} onChange={(v:any)=>setFormData(p=>({...p,defSolidDefense2:v}))} hint="REQ: T3 Lv1" />
                                        </div>
                                        <div className="h-6 w-px bg-sky-500/30"></div>
                                        <div className="flex gap-4">
                                            <TechNode label={t('def.hold_line')+" III"} value={formData.defHoldLine3} onChange={(v:any)=>setFormData(p=>({...p,defHoldLine3:v}))} hint="REQ: T6 Lv4" />
                                            <TechNode label={t('def.counter_defense')+" III"} value={formData.defCounterDefense3} onChange={(v:any)=>setFormData(p=>({...p,defCounterDefense3:v}))} hint="REQ: T6 Lv4" />
                                            <TechNode label={t('def.solid_defense')+" III"} value={formData.defSolidDefense3} onChange={(v:any)=>setFormData(p=>({...p,defSolidDefense3:v}))} hint="REQ: T6 Lv4" />
                                        </div>
                                    </div>

                                    <div className="bg-black/40 border border-slate-800 p-4 rounded-lg flex justify-around shadow-inner">
                                        <div className="text-center">
                                            <span className="text-[10px] text-amber-500 block uppercase font-black tracking-widest">DEF GOLD</span>
                                            <span className="text-sm font-mono text-white font-bold">{fR(defResources.gold)}</span>
                                        </div>
                                        <div className="text-center border-x border-white/5 px-8">
                                            <span className="text-[10px] text-purple-400 block uppercase font-black tracking-widest">DEF VALOR</span>
                                            <span className="text-sm font-mono text-white font-bold">{defResources.valor.toLocaleString()}</span>
                                        </div>
                                        <div className="text-center">
                                            <span className="text-[10px] text-emerald-500 block uppercase font-black tracking-widest">DEF F/I</span>
                                            <span className="text-sm font-mono text-white font-bold">{fR(defResources.foodIron)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Mastery tab sheet */}
                        {activeTab === 'mastery' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                                        <Award className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black text-white uppercase tracking-wider">{t('tab.mastery')}</h3>
                                        <p className="text-[9px] text-slate-500 uppercase tracking-widest leading-none">{t('tab.mastery')}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        {(['air', 'tank', 'missile'] as const).map(tab => (
                                            <button
                                                key={tab}
                                                type="button"
                                                onClick={() => setActiveMasteryTab(tab)}
                                                className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                                                    ${activeMasteryTab === tab 
                                                        ? tab === 'air' ? 'bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                                                          : tab === 'tank' ? 'bg-sky-500 text-white shadow-[0_0_20px_rgba(14,165,233,0.3)]'
                                                          : 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                                                        : 'bg-[#0f172a] text-slate-500 border border-white/5 hover:border-white/10 hover:text-slate-300'
                                                    }
                                                `}
                                            >
                                                {tab === 'air' ? t('mastery.air') : tab === 'tank' ? t('mastery.tank') : t('mastery.missile')}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="animate-in fade-in zoom-in-95 duration-500">
                                        {activeMasteryTab === 'air' && <MasteryTree type="air" formData={formData} setFormData={setFormData} resources={airMasteryResources} fR={fR} />}
                                        {activeMasteryTab === 'tank' && <MasteryTree type="tank" formData={formData} setFormData={setFormData} resources={tankMasteryResources} fR={fR} />}
                                        {activeMasteryTab === 'missile' && <MasteryTree type="missile" formData={formData} setFormData={setFormData} resources={missileMasteryResources} fR={fR} />}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Buildings tab sheet */}
                        {activeTab === 'buildings' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                        <Building2 className="w-5 h-5 animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-black text-white uppercase tracking-wider">{t('tab.buildings')}</h3>
                                        <p className="text-[9px] text-slate-500 uppercase tracking-widest leading-none">{t('section.infrastructure.desc')}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                                    <FormInput label={t('level.barracks')} name="barracksLevel" val={formData.barracksLevel} change={(e:any)=>setFormData(p=>({...p,barracksLevel:e.target.value}))} suffix="lvl" type="number" />
                                    <FormInput label={t('level.tech')} name="techLevel" val={formData.techLevel} change={(e:any)=>setFormData(p=>({...p,techLevel:e.target.value}))} suffix="lvl" type="number" />
                                    <FormInput label={t('level.tank')} name="tankCenterLevel" val={formData.tankCenterLevel} change={(e:any)=>setFormData(p=>({...p,tankCenterLevel:e.target.value}))} suffix="lvl" type="number" />
                                    <FormInput label={t('level.air')} name="airCenterLevel" val={formData.airCenterLevel} change={(e:any)=>setFormData(p=>({...p,airCenterLevel:e.target.value}))} suffix="lvl" type="number" />
                                    <FormInput label={t('level.missile')} name="missileCenterLevel" val={formData.missileCenterLevel} change={(e:any)=>setFormData(p=>({...p,missileCenterLevel:e.target.value}))} suffix="lvl" type="number" />
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Step Navigation & Sync Footer */}
                    <div className="flex flex-col sm:flex-row justify-between items-center bg-black/20 border-t border-white/5 pt-6 mt-12 gap-4">
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handlePrev}
                                disabled={activeTabIndex === 0}
                                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-white/10 text-slate-300 disabled:opacity-30 disabled:pointer-events-none rounded-xl text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 transition-all cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4" /> Previous
                            </button>
                            
                            <button
                                type="button"
                                onClick={handleNext}
                                disabled={activeTabIndex === TABS.length - 1}
                                className="px-4 py-2 bg-slate-900 border border-slate-800 hover:border-white/10 text-sky-400 disabled:opacity-30 disabled:pointer-events-none rounded-xl text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 transition-all cursor-pointer"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                            STEP {activeTabIndex + 1} OF {TABS.length} : {
                                TABS[activeTabIndex].id === 'profile' ? t('tab.profile')
                                : TABS[activeTabIndex].id === 'sts' ? t('tab.sts')
                                : TABS[activeTabIndex].id === 'def' ? t('tab.def')
                                : TABS[activeTabIndex].id === 'mastery' ? t('tab.mastery')
                                : t('tab.buildings')
                            }
                        </span>

                        <button 
                            type="submit" 
                            disabled={loading || !formData.name} 
                            className="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white font-black uppercase tracking-[0.2em] rounded-xl text-[10px] flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(14,165,233,0.3)] disabled:opacity-30"
                        >
                            {loading ? (
                                <>
                                    <div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Broadcasting...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    {t('form.submit')}
                                </>
                            )}
                        </button>
                    </div>

                </div>
            </div>
        </form>
    </div>
  );
};

export default StatsForm;