import React, { useState, useMemo, useRef } from 'react';
import { MockApi } from '../services/mockBackend';
import { Player, Language } from '../types';
import { useLanguage } from '../utils/i18n';
import { CustomDropdown } from './CustomDropdown';
import { useToast } from './Toast';
import { calculateT10RemainingCost, calculateStsRemainingCost } from '../utils/gameLogic';

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

const TechNode = ({ id, label, value, onChange, binary, hint, max=10 }: any) => {
    const options = binary 
        ? [{ value: 0, label: '0' }, { value: 1, label: '1' }]
        : Array.from({length:max+1},(_,x)=>({value:x,label:x===max?'MAX':String(x)}));

    return (
        <div className={`relative group bg-[#0f172a] rounded-xl border p-1 w-full max-w-[140px] hover:shadow-[0_0_15px_rgba(14,165,233,0.2)] transition-all z-10 ${binary ? 'border-purple-500/50 hover:border-purple-400' : 'border-sky-500/30 hover:border-sky-400'}`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                 <div className={`w-8 h-8 rounded-full bg-slate-900 border flex items-center justify-center shadow-lg ${binary ? 'border-purple-500 text-purple-400' : 'border-sky-500/50 text-sky-400'}`}>
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 </div>
            </div>
            <div className="pt-6 pb-2 px-1 text-center">
                <label className="block text-[8px] font-bold text-slate-400 uppercase mb-2 truncate px-1">{label}</label>
                <CustomDropdown value={value} onChange={onChange} options={options} disableSearch className="text-xs" />
                {hint && <div className="mt-1 text-[7px] font-mono text-slate-600 uppercase tracking-tighter leading-none">{hint}</div>}
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
          missileCenterLevel: sV(match.missileCenterLevel)
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
            missileCenterLevel: Number(formData.missileCenterLevel)
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