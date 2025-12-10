
import React, { useState, useMemo } from 'react';
import { MockApi } from '../services/mockBackend';
import { Language } from '../types';
import { useLanguage } from '../utils/i18n';
import { CustomDropdown } from './CustomDropdown';
import { useToast } from './Toast';

// --- T10 Resource Data Constants ---
const T10_COSTS = {
    // Morale & Protection
    advProt: {
        gold: [64600000, 92300000, 92300000, 158000000, 158000000, 221000000, 221000000, 287000000, 287000000, 403000000],
        valor: [1280, 1440, 1440, 1600, 1600, 1800, 1800, 2000, 2000, 2000],
        foodIron: [21700000, 31000000, 31000000, 53000000, 53000000, 74000000, 74000000, 96000000, 96000000, 134000000]
    },
    // HP, Atk, Def
    boost3: {
        gold: [92300000, 158000000, 158000000, 221000000, 221000000, 287000000, 287000000, 403000000, 403000000, 563000000],
        valor: [1440, 1600, 1600, 1800, 1800, 2000, 2000, 2200, 2200, 2400],
        foodIron: [31000000, 53000000, 53000000, 74000000, 74000000, 96000000, 96000000, 134000000, 134000000, 175000000]
    },
    // Final Unlock
    unlock: {
        gold: 563000000,
        valor: 2400,
        foodIron: 188000000
    }
};

const defaultFormData = {
  name: '', pin: '', firstSquadPower: '', secondSquadPower: '', thirdSquadPower: '', fourthSquadPower: '', totalHeroPower: '',
  heroPercent: '0', duelPercent: '0', unitsPercent: '0',
  t10Morale: '0', t10Protection: '0', t10Hp: '0', t10Atk: '0', t10Def: '0',
  techLevel: '', barracksLevel: '', tankCenterLevel: '', airCenterLevel: '', missileCenterLevel: '',
};

// --- Sub-components extracted to prevent re-mount/focus loss ---

const FormInput = ({ label, name, val, change, req, locked, type="text", loading, onBlur }: any) => (
  <div className="relative group">
      <input 
          type={type} name={name} value={val} onChange={change} required={req} placeholder=" " onBlur={onBlur}
          className={`peer w-full bg-transparent border-b-2 py-2 px-1 text-sm text-white font-mono placeholder-transparent focus:outline-none transition-all
              ${locked ? 'border-amber-500/50 focus:border-amber-500 text-amber-100' : 'border-slate-700 focus:border-sky-500'}
          `}
      />
      <label className={`absolute left-0 -top-4 text-[10px] uppercase font-bold tracking-widest transition-all 
          peer-placeholder-shown:text-xs peer-placeholder-shown:top-2 peer-placeholder-shown:text-slate-500
          peer-focus:-top-4 peer-focus:text-[10px]
          ${locked ? 'text-amber-500 peer-focus:text-amber-400' : 'text-sky-500 peer-focus:text-sky-400'}
      `}>
          {label} {req && '*'}
      </label>
      {locked && <div className="absolute right-0 top-2 text-amber-500"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg></div>}
      {loading && <div className="absolute right-0 top-2 text-sky-500 animate-spin">⟳</div>}
  </div>
);

const TechNode = ({ id, label, value, onChange }: any) => (
    <div className="relative group bg-[#0f172a] rounded-xl border border-sky-500/30 p-1 w-full max-w-[140px] hover:border-sky-400 hover:shadow-[0_0_15px_rgba(14,165,233,0.2)] transition-all z-10">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
             <div className="w-8 h-8 rounded-full bg-slate-900 border border-sky-500/50 flex items-center justify-center text-sky-400 shadow-lg">
                 {id === 't10Protection' ? (
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                 ) : id === 't10Hp' ? (
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                 ) : id === 't10Atk' ? (
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 ) : (
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                 )}
             </div>
        </div>
        <div className="pt-6 pb-2 px-1 text-center">
            <label className="block text-[8px] font-bold text-slate-400 uppercase mb-2 truncate">{label}</label>
            <CustomDropdown 
                value={value} 
                onChange={onChange} 
                options={Array.from({length:11},(_,x)=>({value:x,label:x===10?'MAX':String(x)}))} 
                disableSearch 
                className="text-xs" 
            />
        </div>
    </div>
);

// --- Main Component ---

const StatsForm: React.FC<{ onSuccess: () => void; onBack: () => void }> = ({ onSuccess, onBack }) => {
  const { t, language } = useLanguage();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingPlayer, setLoadingPlayer] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  
  const [formData, setFormData] = useState({ language: 'english' as Language, ...defaultFormData });

  React.useEffect(() => {
    const saved = localStorage.getItem('asn1_last_submission');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed, language, pin: '' }));
      } catch(e) {}
    }
  }, []);
  React.useEffect(() => { setFormData(prev => ({...prev, language})); }, [language]);

  const handleChange = (e: any) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleDropdown = (name: string) => (val: any) => setFormData(p => ({ ...p, [name]: String(val) }));

  // --- Resource Calculation Logic ---
  const resourcesNeeded = useMemo(() => {
    // Helper to sum remaining costs from array based on current level
    const sumRemaining = (currentLevel: number, costArray: number[]) => {
        if (currentLevel >= 10) return 0;
        return costArray.slice(currentLevel).reduce((a, b) => a + b, 0);
    };

    const prot = parseInt(formData.t10Protection) || 0;
    const hp = parseInt(formData.t10Hp) || 0;
    const atk = parseInt(formData.t10Atk) || 0;
    const def = parseInt(formData.t10Def) || 0;

    let gold = 0, valor = 0, foodIron = 0;

    // Protection
    gold += sumRemaining(prot, T10_COSTS.advProt.gold);
    valor += sumRemaining(prot, T10_COSTS.advProt.valor);
    foodIron += sumRemaining(prot, T10_COSTS.advProt.foodIron);

    // HP
    gold += sumRemaining(hp, T10_COSTS.boost3.gold);
    valor += sumRemaining(hp, T10_COSTS.boost3.valor);
    foodIron += sumRemaining(hp, T10_COSTS.boost3.foodIron);

    // Atk
    gold += sumRemaining(atk, T10_COSTS.boost3.gold);
    valor += sumRemaining(atk, T10_COSTS.boost3.valor);
    foodIron += sumRemaining(atk, T10_COSTS.boost3.foodIron);

    // Def
    gold += sumRemaining(def, T10_COSTS.boost3.gold);
    valor += sumRemaining(def, T10_COSTS.boost3.valor);
    foodIron += sumRemaining(def, T10_COSTS.boost3.foodIron);

    // Final Unlock Cost - Only add if not everything is maxed
    if (prot < 10 || hp < 10 || atk < 10 || def < 10) {
        gold += T10_COSTS.unlock.gold;
        valor += T10_COSTS.unlock.valor;
        foodIron += T10_COSTS.unlock.foodIron;
    }

    return { gold, valor, foodIron };
  }, [formData.t10Protection, formData.t10Hp, formData.t10Atk, formData.t10Def]);

  const formatResource = (num: number) => {
      if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
      return num.toString();
  };

  const handleNameBlur = async () => {
      if(!formData.name || formData.name.length < 3) return;
      setLoadingPlayer(true);
      try {
          const res = await MockApi.getPlayers({ search: formData.name, language: 'all', sort: 'time_desc', activeOnly: false });
          const match = res.items?.find(p => p.nameNormalized === formData.name.toLowerCase().trim());
          if(match) {
              addToast('info', `Uplink established: ${match.name}`);
              setIsLocked(!!(match.pin && match.pin.trim() !== ""));
              
              const norm = (v: number|undefined) => v ? String(v/1000000) : '';
              setFormData(prev => ({
                  ...prev, name: match.name,
                  firstSquadPower: norm(match.firstSquadPower), secondSquadPower: norm(match.secondSquadPower),
                  thirdSquadPower: norm(match.thirdSquadPower), fourthSquadPower: norm(match.fourthSquadPower),
                  totalHeroPower: norm(match.totalHeroPower),
                  heroPercent: String(match.heroPercent), duelPercent: String(match.duelPercent), unitsPercent: String(match.unitsPercent),
                  t10Morale: String(match.t10Morale), t10Protection: String(match.t10Protection), t10Hp: String(match.t10Hp), t10Atk: String(match.t10Atk), t10Def: String(match.t10Def),
                  techLevel: String(match.techLevel || ''), barracksLevel: String(match.barracksLevel || ''),
                  tankCenterLevel: String(match.tankCenterLevel || ''), airCenterLevel: String(match.airCenterLevel || ''), missileCenterLevel: String(match.missileCenterLevel || ''),
              }));
          } else { setIsLocked(false); }
      } catch(e) {} finally { setLoadingPlayer(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const norm = (v: string) => { const n = Number(v); if(isNaN(n)) return 0; return n > 1000 ? n : n * 1000000; };
    try {
        if (!formData.name || !formData.firstSquadPower || !formData.totalHeroPower) throw new Error("Missing critical data");
        if (isLocked && !formData.pin) throw new Error("Security Clearance Required (PIN)");
        
        const payload = {
            ...formData,
            firstSquadPower: norm(formData.firstSquadPower), secondSquadPower: norm(formData.secondSquadPower),
            thirdSquadPower: norm(formData.thirdSquadPower), fourthSquadPower: norm(formData.fourthSquadPower),
            totalHeroPower: norm(formData.totalHeroPower),
            heroPercent: Number(formData.heroPercent), duelPercent: Number(formData.duelPercent), unitsPercent: Number(formData.unitsPercent),
            t10Morale: Number(formData.t10Morale), t10Protection: Number(formData.t10Protection), t10Hp: Number(formData.t10Hp), t10Atk: Number(formData.t10Atk), t10Def: Number(formData.t10Def),
            techLevel: Number(formData.techLevel), barracksLevel: Number(formData.barracksLevel),
            tankCenterLevel: Number(formData.tankCenterLevel), airCenterLevel: Number(formData.airCenterLevel), missileCenterLevel: Number(formData.missileCenterLevel)
        };
        const res = await MockApi.upsertPlayer(payload);
        if(res.success) {
            const { pin, ...safe } = formData;
            localStorage.setItem('asn1_last_submission', JSON.stringify(safe));
            addToast('success', 'Data Upload Complete');
            onSuccess();
        } else {
             if (res.error?.includes("Locked Profile")) throw new Error("Access Denied: Invalid PIN");
             throw new Error(res.error || "Upload Failed");
        }
    } catch(err: any) { addToast('error', err.message); } finally { setLoading(false); }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="absolute inset-0 bg-sky-900/5 blur-3xl -z-10"></div>
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-700 hover:border-sky-500 hover:text-sky-500 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>
                <h2 className="text-xl font-header font-bold text-white uppercase tracking-[0.2em] flex items-center gap-3">
                    <span className="w-2 h-2 bg-emerald-500 rounded-sm animate-pulse"></span>
                    Secure Uplink Terminal
                </h2>
            </div>
            <div className="flex gap-2">
                <button type="button" onClick={() => { localStorage.removeItem('asn1_last_submission'); setFormData({ language, ...defaultFormData }); setIsLocked(false); addToast('info', 'Form Cleared'); }} className="text-[10px] font-bold text-slate-500 hover:text-white uppercase px-3 py-1 border border-slate-800 hover:border-slate-600 rounded transition-colors click-scale">Reset</button>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
            {/* 1. Identity */}
            <section className="space-y-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-l-2 border-sky-500 pl-3">{t('section.identity')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#0a0f1e]/50 p-6 rounded-xl border border-white/5 shadow-lg">
                    <FormInput label={t('label.name')} name="name" val={formData.name} change={handleChange} req={true} onBlur={handleNameBlur} loading={loadingPlayer} />
                    <div>
                        <FormInput label={isLocked ? t('label.pin_locked') : t('label.pin_optional')} name="pin" val={formData.pin} change={handleChange} req={isLocked} locked={isLocked} type="password" />
                        <div className="mt-2 text-right">
                             <a href="https://discord.gg/yVwQT88bxf" target="_blank" className="text-[9px] text-slate-500 hover:text-sky-400 transition-colors">{t('msg.forgot_pin')}</a>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. Power */}
            <section className="space-y-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-l-2 border-amber-500 pl-3">{t('section.power')}</h3>
                <div className="bg-[#0a0f1e]/50 p-6 rounded-xl border border-white/5 shadow-lg flex flex-col gap-8">
                    {/* Squads First */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <FormInput label={t('label.power') + " (M)"} name="firstSquadPower" val={formData.firstSquadPower} change={handleChange} req={true} type="number" />
                        <FormInput label={t('label.squad2') + " (M)"} name="secondSquadPower" val={formData.secondSquadPower} change={handleChange} type="number" />
                        <FormInput label={t('label.squad3') + " (M)"} name="thirdSquadPower" val={formData.thirdSquadPower} change={handleChange} type="number" />
                        <FormInput label={t('label.squad4') + " (M)"} name="fourthSquadPower" val={formData.fourthSquadPower} change={handleChange} type="number" />
                    </div>
                    {/* Total Hero Power Last with Hint */}
                    <div className="w-full max-w-sm mx-auto">
                        <FormInput label={t('label.totalHeroPower') + " (M)"} name="totalHeroPower" val={formData.totalHeroPower} change={handleChange} req={true} type="number" />
                        <p className="text-[9px] text-slate-500 text-center mt-2 font-mono tracking-wide">{t('hint.server_rank')}</p>
                    </div>
                </div>
            </section>

            {/* 3. Technology (Merged Percentages & T10) */}
            <section className="space-y-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">{t('section.tech')}</h3>
                <div className="bg-[#0a0f1e]/50 p-6 rounded-xl border border-white/5 shadow-lg space-y-8">
                     
                     {/* Sub-section: Percentages */}
                     <div>
                         <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Research Center</label>
                         <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                            {['heroPercent', 'duelPercent', 'unitsPercent'].map((k, i) => (
                                <div key={k} className="space-y-2">
                                    <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">{t(i===0?'stat.hero':i===1?'stat.duel':'stat.units' as any)}</label>
                                    <CustomDropdown value={(formData as any)[k]} onChange={handleDropdown(k)} options={Array.from({length:101},(_,x)=>({value:x,label:`${x}%`}))} disableSearch color={i===0?'amber':i===1?'blue':'green'} />
                                </div>
                            ))}
                            {/* Added Morale Here */}
                            <div className="space-y-2">
                                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">{t('t10.morale')}</label>
                                <CustomDropdown value={formData.t10Morale} onChange={handleDropdown('t10Morale')} options={Array.from({length:11},(_,x)=>({value:x,label:`${x}`}))} disableSearch color="purple" />
                            </div>
                         </div>
                     </div>

                     {/* Sub-section: T10 Tree Layout */}
                     <div className="flex flex-col">
                         <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-8 border-b border-white/5 pb-2">T10 Tech Tree</label>
                         
                         {/* Tree Container */}
                         <div className="flex flex-col items-center relative mb-8">
                             {/* Level 1: Protection */}
                             <div className="relative z-20">
                                 <TechNode id="t10Protection" label={t('t10.protection')} value={formData.t10Protection} onChange={handleDropdown('t10Protection')} />
                             </div>

                             {/* Connector Line Vertical */}
                             <div className="h-8 w-px bg-sky-500/30"></div>

                             {/* Horizontal Branch Line */}
                             <div className="w-[80%] sm:w-[320px] h-4 border-t border-x border-sky-500/30 rounded-t-xl relative">
                                 {/* Middle Drop Line */}
                                 <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-px bg-sky-500/30"></div>
                             </div>

                             {/* Level 2: Three Nodes */}
                             <div className="flex justify-between w-full max-w-[420px] gap-2 sm:gap-4 relative z-20 -mt-0.5">
                                 <TechNode id="t10Hp" label={t('t10.hp')} value={formData.t10Hp} onChange={handleDropdown('t10Hp')} />
                                 <TechNode id="t10Atk" label={t('t10.atk')} value={formData.t10Atk} onChange={handleDropdown('t10Atk')} />
                                 <TechNode id="t10Def" label={t('t10.def')} value={formData.t10Def} onChange={handleDropdown('t10Def')} />
                             </div>
                         </div>

                         {/* T10 Resource Scanner Panel */}
                         <div className="relative group overflow-hidden rounded-lg bg-black/40 border border-slate-800 mt-4">
                             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                             {/* Scan Line Animation */}
                             <div className="absolute top-0 left-0 w-full h-[2px] bg-sky-500/50 shadow-[0_0_10px_#0ea5e9] animate-scan-y opacity-50"></div>
                             
                             <div className="relative p-4 flex flex-col sm:flex-row items-center justify-between gap-6">
                                 <div className="text-left space-y-1">
                                     <h4 className="text-xs font-header font-bold text-sky-400 uppercase tracking-widest flex items-center gap-2">
                                         <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-pulse"></span>
                                         {t('calc.remaining')}
                                     </h4>
                                     <p className="text-[9px] text-slate-500 font-mono max-w-[200px]">Projected resources required to complete all research and unlock Tier 10.</p>
                                 </div>

                                 <div className="flex gap-4 sm:gap-8">
                                     {/* Gold */}
                                     <div className="flex flex-col items-center">
                                         <span className="text-[10px] text-amber-500/80 font-bold uppercase tracking-wider">{t('calc.gold')}</span>
                                         <span className="text-lg font-mono font-bold text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]">
                                             {formatResource(resourcesNeeded.gold)}
                                         </span>
                                     </div>
                                     {/* Valor */}
                                     <div className="flex flex-col items-center">
                                         <span className="text-[10px] text-purple-400/80 font-bold uppercase tracking-wider">{t('calc.valor')}</span>
                                         <span className="text-lg font-mono font-bold text-purple-400 drop-shadow-[0_0_5px_rgba(192,132,252,0.5)]">
                                             {resourcesNeeded.valor.toLocaleString()}
                                         </span>
                                     </div>
                                     {/* Food/Iron */}
                                     <div className="flex flex-col items-center">
                                         <span className="text-[10px] text-emerald-500/80 font-bold uppercase tracking-wider">{t('calc.food_iron')}</span>
                                         <span className="text-lg font-mono font-bold text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">
                                             {formatResource(resourcesNeeded.foodIron)}
                                         </span>
                                     </div>
                                 </div>
                             </div>
                         </div>
                     </div>
                </div>
            </section>

            {/* 4. Buildings (Moved to Last) */}
            <section className="space-y-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-l-2 border-emerald-500 pl-3">{t('section.infrastructure')}</h3>
                <div className="bg-[#0a0f1e]/50 p-6 rounded-xl border border-white/5 shadow-lg">
                     <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        {['techLevel','barracksLevel','tankCenterLevel','airCenterLevel','missileCenterLevel'].map((k) => (
                            <div key={k} className="space-y-2">
                                <label className="block text-[9px] font-bold text-slate-400 uppercase truncate">{t(`level.${k.replace('Level','').replace('Center','')}` as any)}</label>
                                <CustomDropdown value={(formData as any)[k]} onChange={handleDropdown(k)} options={Array.from({length:35},(_,x)=>({value:x+1,label:`${x+1}`}))} disableSearch />
                            </div>
                        ))}
                     </div>
                </div>
            </section>

            {/* Action */}
            <div className="flex justify-end pt-4 pb-12">
                <button type="submit" disabled={loading} className="relative group bg-sky-600 hover:bg-sky-500 text-white font-header font-bold py-4 px-12 rounded-sm overflow-hidden transition-all duration-300 click-scale shadow-[0_0_20px_rgba(14,165,233,0.3)]">
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:animate-shine"></div>
                    <span className="relative z-10 uppercase tracking-widest flex items-center gap-3">
                        {loading ? 'Transmitting...' : t('form.submit')}
                        {!loading && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
                    </span>
                </button>
            </div>
        </form>
    </div>
  );
};

export default StatsForm;
