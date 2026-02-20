import React, { useState, useMemo, useRef } from 'react';
import { MockApi } from '../services/mockBackend';
import { Player, Language } from '../types';
import { useLanguage } from '../utils/i18n';
import { CustomDropdown } from './CustomDropdown';
import { useToast } from './Toast';
import { calculateT10RemainingCost, calculateStsRemainingCost, calculateAirMasteryRemainingCost, calculateTankMasteryRemainingCost, calculateMissileMasteryRemainingCost } from '../utils/gameLogic';

const defaultFormData = {
  name: '', firstSquadPower: '', secondSquadPower: '', thirdSquadPower: '', fourthSquadPower: '', totalHeroPower: '',
  heroPercent: '', duelPercent: '', unitsPercent: '',
  t10Morale: '1', t10Protection: '0', t10Hp: '0', t10Atk: '0', t10Def: '0', t10Elite: '0',
  stsPowerBoost1: '0', stsFinalStand1: '0', stsFierceAssault1: '0', stsVigilantFormation1: '0',
  stsExtraDrillGround: '0', stsBarrackExpansion1: '0', stsFocusedTraining1: '0',
  stsFinalStand2: '0', stsFierceAssault2: '0', stsVigilantFormation2: '0',
  stsDrillGroundExpansion: '0', stsRapidMarch1: '0',
  stsFinalStand3: '0', stsFierceAssault3: '0', stsVigilantFormation3: '0', stsFatalStrike1: '0',
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
  <div className="relative group">
      <div className="flex items-center">
          <input 
              type={type} name={name} value={val} onChange={change} required={req} placeholder=" " onBlur={onBlur} autoComplete={autoComplete}
              className={`peer w-full bg-transparent border-b-2 py-2 px-1 text-sm text-white font-mono placeholder-transparent focus:outline-none transition-all
                  ${locked ? 'border-amber-500/50 focus:border-amber-500 text-amber-100' : 'border-slate-700 focus:border-sky-500'}
              `}
          />
          {suffix && <span className="text-[10px] font-bold text-slate-500 ml-2 mt-1">{suffix}</span>}
      </div>
      <label className={`absolute left-0 -top-4 text-[10px] uppercase font-bold tracking-widest transition-all 
          peer-placeholder-shown:text-xs peer-placeholder-shown:top-2 peer-placeholder-shown:text-slate-500
          peer-focus:-top-4 peer-focus:text-[10px]
          ${locked ? 'text-amber-500 peer-focus:text-amber-400' : 'text-sky-500 peer-focus:text-sky-400'}
      `}>
          {label} {req && '*'}
      </label>
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

const StatsForm: React.FC<{ onSuccess: () => void; onBack: () => void }> = ({ onSuccess, onBack }) => {
  const { t, language } = useLanguage();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Player[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeMasteryTab, setActiveMasteryTab] = useState<'tank' | 'missile' | 'air'>('air');
  const searchTimeout = useRef<any>(null);

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

  const resourcesNeeded = useMemo(() => calculateT10RemainingCost(formData as any), [formData]);
  const stsResources = useMemo(() => calculateStsRemainingCost(formData), [formData]);
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
            heroPercent: Number(formData.heroPercent),
            duelPercent: Number(formData.duelPercent),
            unitsPercent: Number(formData.unitsPercent),
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

        <form onSubmit={handleSubmit} className="space-y-12">
            <section className="space-y-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-l-2 border-sky-500 pl-3">{t('section.identity')}</h3>
                <div className="bg-[#0a0f1e]/50 p-6 rounded-xl border border-white/5 shadow-lg relative">
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
            </section>

            <section className="space-y-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-l-2 border-amber-500 pl-3">{t('section.power')}</h3>
                <div className="bg-[#0a0f1e]/50 p-6 rounded-xl border border-white/5 shadow-lg grid grid-cols-2 md:grid-cols-4 gap-6">
                    <FormInput label={t('label.power')+"(M)"} name="firstSquadPower" val={formData.firstSquadPower} change={(e:any)=>setFormData(p=>({...p,firstSquadPower:e.target.value}))} req={true} type="number" />
                    <FormInput label={t('label.squad2')+"(M)"} name="secondSquadPower" val={formData.secondSquadPower} change={(e:any)=>setFormData(p=>({...p,secondSquadPower:e.target.value}))} type="number" />
                    <FormInput label={t('label.squad3')+"(M)"} name="thirdSquadPower" val={formData.thirdSquadPower} change={(e:any)=>setFormData(p=>({...p,thirdSquadPower:e.target.value}))} type="number" />
                    <FormInput label={t('label.squad4')+"(M)"} name="fourthSquadPower" val={formData.fourthSquadPower} change={(e:any)=>setFormData(p=>({...p,fourthSquadPower:e.target.value}))} type="number" />
                    <div className="col-span-2 md:col-span-4 mt-2">
                        <FormInput label={t('label.totalHeroPower')+"(M)"} name="totalHeroPower" val={formData.totalHeroPower} change={(e:any)=>setFormData(p=>({...p,totalHeroPower:e.target.value}))} req={true} type="number" />
                    </div>
                </div>
            </section>

            <section className="space-y-10">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">{t('section.tech')}</h3>
                
                {/* T10 HUD */}
                <div className="bg-[#0a0f1e]/50 p-6 rounded-xl border border-white/5 space-y-8">
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">T10 PROTOCOL</h4>
                    <div className="flex flex-col items-center">
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
                    {/* T10 Local Resource Summary */}
                    <div className="bg-black/40 border border-slate-800 p-4 rounded-lg flex justify-around shadow-inner">
                        <div className="text-center">
                            <span className="text-[10px] text-amber-500 block uppercase font-black tracking-widest">T10 GOLD</span>
                            <span className="text-sm font-mono text-white font-bold">{fR(resourcesNeeded.gold)}</span>
                        </div>
                        <div className="text-center border-x border-white/5 px-8">
                            <span className="text-[10px] text-purple-400 block uppercase font-black tracking-widest">T10 VALOR</span>
                            <span className="text-sm font-mono text-white font-bold">{resourcesNeeded.valor.toLocaleString()}</span>
                        </div>
                        <div className="text-center">
                            <span className="text-[10px] text-emerald-500 block uppercase font-black tracking-widest">T10 F/I</span>
                            <span className="text-sm font-mono text-white font-bold">{fR(resourcesNeeded.foodIron)}</span>
                        </div>
                    </div>
                </div>

                {/* Siege to Seize Tree */}
                <div className="bg-[#0a0f1e]/50 p-6 rounded-xl border border-rose-500/10 space-y-10 shadow-[inset_0_0_20px_rgba(244,63,94,0.05)]">
                    <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">{t('sts.title')}</h4>
                    
                    <div className="flex flex-col items-center gap-4">
                        <TechNode label={t('sts.power_boost')+" I"} value={formData.stsPowerBoost1} onChange={(v:any)=>setFormData(p=>({...p,stsPowerBoost1:v}))} />
                        <div className="h-6 w-px bg-rose-500/30"></div>
                        <div className="flex gap-4">
                            <TechNode label={t('sts.final_stand')+" I"} value={formData.stsFinalStand1} onChange={(v:any)=>setFormData(p=>({...p,stsFinalStand1:v}))} />
                            <TechNode label={t('sts.fierce_assault')+" I"} value={formData.stsFierceAssault1} onChange={(v:any)=>setFormData(p=>({...p,stsFierceAssault1:v}))} />
                            <TechNode label={t('sts.vigilant')+" I"} value={formData.stsVigilantFormation1} onChange={(v:any)=>setFormData(p=>({...p,stsVigilantFormation1:v}))} />
                        </div>
                        <div className="h-6 w-px bg-rose-500/30"></div>
                        <TechNode label={t('sts.extra_drill')} value={formData.stsExtraDrillGround} onChange={(v:any)=>setFormData(p=>({...p,stsExtraDrillGround:v}))} binary hint="REQ: T2 Lv10" />
                        <div className="h-6 w-px bg-rose-500/30"></div>
                        <div className="flex gap-4">
                            <TechNode label={t('sts.barrack')+" I"} value={formData.stsBarrackExpansion1} onChange={(v:any)=>setFormData(p=>({...p,stsBarrackExpansion1:v}))} />
                            <TechNode label={t('sts.focused')+" I"} value={formData.stsFocusedTraining1} onChange={(v:any)=>setFormData(p=>({...p,stsFocusedTraining1:v}))} />
                        </div>
                        <div className="h-6 w-px bg-rose-500/30"></div>
                        <div className="flex gap-4">
                            <TechNode label={t('sts.final_stand')+" II"} value={formData.stsFinalStand2} onChange={(v:any)=>setFormData(p=>({...p,stsFinalStand2:v}))} />
                            <TechNode label={t('sts.fierce_assault')+" II"} value={formData.stsFierceAssault2} onChange={(v:any)=>setFormData(p=>({...p,stsFierceAssault2:v}))} />
                            <TechNode label={t('sts.vigilant')+" II"} value={formData.stsVigilantFormation2} onChange={(v:any)=>setFormData(p=>({...p,stsVigilantFormation2:v}))} />
                        </div>
                        <div className="h-6 w-px bg-rose-500/30"></div>
                        <TechNode label={t('sts.drill_exp')} value={formData.stsDrillGroundExpansion} onChange={(v:any)=>setFormData(p=>({...p,stsDrillGroundExpansion:v}))} hint="REQ: T5 Lv6" />
                        <div className="h-6 w-px bg-rose-500/30"></div>
                        <TechNode label={t('sts.rapid')} value={formData.stsRapidMarch1} onChange={(v:any)=>setFormData(p=>({...p,stsRapidMarch1:v}))} />
                        <div className="h-6 w-px bg-rose-500/30"></div>
                        <div className="flex gap-4">
                            <TechNode label={t('sts.final_stand')+" III"} value={formData.stsFinalStand3} onChange={(v:any)=>setFormData(p=>({...p,stsFinalStand3:v}))} />
                            <TechNode label={t('sts.fierce_assault')+" III"} value={formData.stsFierceAssault3} onChange={(v:any)=>setFormData(p=>({...p,stsFierceAssault3:v}))} />
                            <TechNode label={t('sts.vigilant')+" III"} value={formData.stsVigilantFormation3} onChange={(v:any)=>setFormData(p=>({...p,stsVigilantFormation3:v}))} />
                        </div>
                        <div className="h-6 w-px bg-rose-500/30"></div>
                        <TechNode label={t('sts.fatal')} value={formData.stsFatalStrike1} onChange={(v:any)=>setFormData(p=>({...p,stsFatalStrike1:v}))} hint="REQ: T7 Lv1" />
                    </div>

                    {/* STS Local Resource Summary */}
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

                {/* Mastery Mini Tab */}
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <button 
                            type="button" 
                            onClick={() => setActiveMasteryTab('tank')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeMasteryTab === 'tank' ? 'bg-sky-500/20 border border-sky-500/50 text-sky-500' : 'bg-slate-900/50 border border-slate-800 text-slate-500 hover:text-slate-400'}`}
                        >
                            Tank Mastery
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setActiveMasteryTab('missile')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeMasteryTab === 'missile' ? 'bg-rose-500/20 border border-rose-500/50 text-rose-500' : 'bg-slate-900/50 border border-slate-800 text-slate-500 hover:text-slate-400'}`}
                        >
                            Missile Mastery
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setActiveMasteryTab('air')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeMasteryTab === 'air' ? 'bg-amber-500/20 border border-amber-500/50 text-amber-500' : 'bg-slate-900/50 border border-slate-800 text-slate-500 hover:text-slate-400'}`}
                        >
                            Air Mastery
                        </button>
                    </div>
                    
                    {activeMasteryTab === 'air' && <MasteryTree type="air" formData={formData} setFormData={setFormData} resources={airMasteryResources} fR={fR} />}
                    {activeMasteryTab === 'tank' && <MasteryTree type="tank" formData={formData} setFormData={setFormData} resources={tankMasteryResources} fR={fR} />}
                    {activeMasteryTab === 'missile' && <MasteryTree type="missile" formData={formData} setFormData={setFormData} resources={missileMasteryResources} fR={fR} />}
                </div>

                <div className="bg-[#0a0f1e]/50 p-6 rounded-xl border border-white/5 grid grid-cols-3 gap-6">
                    <FormInput label={t('stat.hero')} name="heroPercent" val={formData.heroPercent} change={(e:any)=>setFormData(p=>({...p,heroPercent:e.target.value}))} type="number" suffix="%" req={true} />
                    <FormInput label={t('stat.duel')} name="duelPercent" val={formData.duelPercent} change={(e:any)=>setFormData(p=>({...p,duelPercent:e.target.value}))} type="number" suffix="%" req={true} />
                    <FormInput label={t('stat.units')} name="unitsPercent" val={formData.unitsPercent} change={(e:any)=>setFormData(p=>({...p,unitsPercent:e.target.value}))} type="number" suffix="%" req={true} />
                </div>

                <div className="max-w-xs mx-auto text-left space-y-2">
                    <label className="block text-[10px] font-bold text-sky-500 uppercase tracking-widest ml-1">Morale Level *</label>
                    <CustomDropdown 
                        value={formData.t10Morale} 
                        onChange={(v) => setFormData(p => ({...p, t10Morale: String(v)}))} 
                        options={moraleOptions}
                        disableSearch
                    />
                </div>
            </section>

            <section className="space-y-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-l-2 border-emerald-500 pl-3">Buildings</h3>
                <div className="bg-[#0a0f1e]/50 p-6 rounded-xl border border-white/5 grid grid-cols-2 md:grid-cols-5 gap-6">
                    <FormInput label="Barracks" name="barracksLevel" val={formData.barracksLevel} change={(e:any)=>setFormData(p=>({...p,barracksLevel:e.target.value}))} suffix="lvl" type="number" />
                    <FormInput label="Tech Center" name="techLevel" val={formData.techLevel} change={(e:any)=>setFormData(p=>({...p,techLevel:e.target.value}))} suffix="lvl" type="number" />
                    <FormInput label="Tank" name="tankCenterLevel" val={formData.tankCenterLevel} change={(e:any)=>setFormData(p=>({...p,tankCenterLevel:e.target.value}))} suffix="lvl" type="number" />
                    <FormInput label="Air" name="airCenterLevel" val={formData.airCenterLevel} change={(e:any)=>setFormData(p=>({...p,airCenterLevel:e.target.value}))} suffix="lvl" type="number" />
                    <FormInput label="Missile" name="missileCenterLevel" val={formData.missileCenterLevel} change={(e:any)=>setFormData(p=>({...p,missileCenterLevel:e.target.value}))} suffix="lvl" type="number" />
                </div>
            </section>

            <button type="submit" disabled={loading} className="w-full bg-sky-600 hover:bg-sky-500 text-white font-header font-bold py-4 rounded-xl shadow-lg transition-all uppercase tracking-widest">
                {loading ? 'Transmitting...' : t('form.submit')}
            </button>
        </form>
    </div>
  );
};

export default StatsForm;