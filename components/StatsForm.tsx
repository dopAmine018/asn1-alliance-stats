import React, { useState, useMemo, useRef } from 'react';
import { MockApi } from '../services/mockBackend';
import { Player, Language } from '../types';
import { useLanguage } from '../utils/i18n';
import { CustomDropdown } from './CustomDropdown';
import { useToast } from './Toast';
import { calculateT10RemainingCost } from '../utils/gameLogic';

const defaultFormData = {
  name: '', firstSquadPower: '', secondSquadPower: '', thirdSquadPower: '', fourthSquadPower: '', totalHeroPower: '',
  heroPercent: '0', duelPercent: '0', unitsPercent: '0',
  t10Morale: '1', t10Protection: '0', t10Hp: '0', t10Atk: '0', t10Def: '0', t10Elite: '0',
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
      {locked && <div className="absolute right-0 top-2 text-amber-500"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg></div>}
      {loading && <div className="absolute right-0 top-2 text-sky-500 animate-spin">⟳</div>}
      {children}
  </div>
);

const TechNode = ({ id, label, value, onChange, binary }: any) => {
    const options = binary 
        ? [{ value: 0, label: '0' }, { value: 10, label: 'MAX' }]
        : Array.from({length:11},(_,x)=>({value:x,label:x===10?'MAX':String(x)}));

    return (
        <div className={`relative group bg-[#0f172a] rounded-xl border p-1 w-full max-w-[140px] hover:shadow-[0_0_15px_rgba(14,165,233,0.2)] transition-all z-10 ${binary ? 'border-purple-500/50 hover:border-purple-400' : 'border-sky-500/30 hover:border-sky-400'}`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                 <div className={`w-8 h-8 rounded-full bg-slate-900 border flex items-center justify-center shadow-lg ${binary ? 'border-purple-500 text-purple-400' : 'border-sky-500/50 text-sky-400'}`}>
                     {id === 't10Protection' ? (
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                     ) : id === 't10Hp' ? (
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                     ) : id === 't10Atk' ? (
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                     ) : id === 't10Elite' ? (
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
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
                    options={options} 
                    disableSearch 
                    className="text-xs" 
                />
            </div>
        </div>
    );
};

const StatsForm: React.FC<{ onSuccess: () => void; onBack: () => void }> = ({ onSuccess, onBack }) => {
  const { t, language } = useLanguage();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingPlayer, setLoadingPlayer] = useState(false);
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
      } else {
          setSuggestions([]);
          setShowSuggestions(false);
      }
  };

  const populateWithPlayer = (match: Player) => {
      addToast('info', `Profile Synced: ${match.name}`);
      const norm = (v: number|undefined) => v ? String(v/1000000) : '';
      setFormData(prev => ({
          ...prev, name: match.name,
          firstSquadPower: norm(match.firstSquadPower), 
          secondSquadPower: norm(match.secondSquadPower),
          thirdSquadPower: norm(match.thirdSquadPower),
          fourthSquadPower: norm(match.fourthSquadPower),
          totalHeroPower: norm(match.totalHeroPower),
          heroPercent: String(match.heroPercent), duelPercent: String(match.duelPercent), unitsPercent: String(match.unitsPercent),
          t10Morale: String(match.t10Morale), t10Protection: String(match.t10Protection), t10Hp: String(match.t10Hp), t10Atk: String(match.t10Atk), t10Def: String(match.t10Def), t10Elite: String(match.t10Elite || 0),
          techLevel: String(match.techLevel || ''), barracksLevel: String(match.barracksLevel || ''),
          tankCenterLevel: String(match.tankCenterLevel || ''), airCenterLevel: String(match.airCenterLevel || ''), missileCenterLevel: String(match.missileCenterLevel || ''),
      }));
  };

  const resourcesNeeded = useMemo(() => {
    return calculateT10RemainingCost({
        t10Protection: Number(formData.t10Protection),
        t10Hp: Number(formData.t10Hp),
        t10Atk: Number(formData.t10Atk),
        t10Def: Number(formData.t10Def),
        t10Elite: Number(formData.t10Elite),
        barracksLevel: Number(formData.barracksLevel),
        techLevel: Number(formData.techLevel)
    });
  }, [formData.t10Protection, formData.t10Hp, formData.t10Atk, formData.t10Def, formData.t10Elite, formData.barracksLevel, formData.techLevel]);

  const formatResource = (num: number) => {
      if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B';
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      return num.toString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const norm = (v: string) => { const n = Number(v); if(isNaN(n)) return 0; return n > 1000 ? n : n * 1000000; };
    
    try {
        // Validation: Ensure everything is filled
        const requiredFields = [
            formData.name, formData.firstSquadPower, formData.secondSquadPower, formData.thirdSquadPower, 
            formData.fourthSquadPower, formData.totalHeroPower, formData.barracksLevel, formData.techLevel,
            formData.tankCenterLevel, formData.airCenterLevel, formData.missileCenterLevel
        ];

        if (requiredFields.some(field => !field || field.trim() === '')) {
            throw new Error("All intelligence fields are mandatory for HQ synchronization.");
        }
        
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
            techLevel: Number(formData.techLevel), 
            barracksLevel: Number(formData.barracksLevel),
            tankCenterLevel: Number(formData.tankCenterLevel),
            airCenterLevel: Number(formData.airCenterLevel),
            missileCenterLevel: Number(formData.missileCenterLevel)
        });
        if(res.success) {
            localStorage.setItem('asn1_last_submission', JSON.stringify(formData));
            addToast('success', 'Power Sync Complete');
            onSuccess();
        } else throw new Error(res.error);
    } catch(err: any) { addToast('error', err.message); } finally { setLoading(false); }
  };

  const moraleOptions = Array.from({ length: 10 }, (_, i) => ({
      value: i + 1,
      label: i + 1 === 10 ? '10 (MAX)' : String(i + 1)
  }));

  return (
    <div className="relative w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-700 hover:border-sky-500 hover:text-sky-500 transition-all">
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
                <div className="bg-[#0a0f1e]/50 p-6 rounded-xl border border-white/5 shadow-lg relative transition-all hover:border-sky-500/20">
                    <FormInput 
                        label={t('label.name')} 
                        name="name" 
                        val={formData.name} 
                        change={handleNameChange} 
                        req={true} 
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} 
                        loading={loadingPlayer} 
                        autoComplete="off"
                    >
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 w-full bg-[#0f172a] border border-slate-700 border-t-0 rounded-b-lg shadow-xl z-50">
                                {suggestions.map(s => (
                                    <div key={s.id} onMouseDown={() => populateWithPlayer(s)} className="px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer border-b border-slate-800 last:border-0 flex justify-between">
                                        <span className="font-bold">{s.name}</span>
                                        <span className="text-xs text-sky-500 font-mono">{(s.firstSquadPower/1000000).toFixed(1)}M</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </FormInput>
                </div>
            </section>

            <section className="space-y-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-l-2 border-amber-500 pl-3">{t('section.power')}</h3>
                <div className="bg-[#0a0f1e]/50 p-6 rounded-xl border border-white/5 shadow-lg flex flex-col gap-8 transition-all hover:border-amber-500/20">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <FormInput label={t('label.power') + " (M)"} name="firstSquadPower" val={formData.firstSquadPower} change={(e: any) => setFormData(p => ({...p, firstSquadPower: e.target.value}))} req={true} type="number" />
                        <FormInput label={t('label.squad2') + " (M)"} name="secondSquadPower" val={formData.secondSquadPower} change={(e: any) => setFormData(p => ({...p, secondSquadPower: e.target.value}))} req={true} type="number" />
                        <FormInput label={t('label.squad3') + " (M)"} name="thirdSquadPower" val={formData.thirdSquadPower} change={(e: any) => setFormData(p => ({...p, thirdSquadPower: e.target.value}))} req={true} type="number" />
                        <FormInput label={t('label.squad4') + " (M)"} name="fourthSquadPower" val={formData.fourthSquadPower} change={(e: any) => setFormData(p => ({...p, fourthSquadPower: e.target.value}))} type="number" req={true} />
                        <FormInput label={t('label.totalHeroPower') + " (M)"} name="totalHeroPower" val={formData.totalHeroPower} change={(e: any) => setFormData(p => ({...p, totalHeroPower: e.target.value}))} req={true} type="number" />
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-l-2 border-indigo-500 pl-3">{t('section.tech')}</h3>
                <div className="bg-[#0a0f1e]/50 p-6 rounded-xl border border-white/5 shadow-lg space-y-8 text-center transition-all hover:border-indigo-500/20">
                    <div className="flex flex-col items-center relative mb-8">
                         <TechNode id="t10Protection" label={t('t10.protection')} value={formData.t10Protection} onChange={(v: any) => setFormData(p => ({...p, t10Protection: String(v)}))} />
                         <div className="h-6 w-px bg-sky-500/30"></div>
                         <div className="flex justify-center gap-4 relative z-20">
                             <TechNode id="t10Hp" label={t('t10.hp')} value={formData.t10Hp} onChange={(v: any) => setFormData(p => ({...p, t10Hp: String(v)}))} />
                             <TechNode id="t10Atk" label={t('t10.atk')} value={formData.t10Atk} onChange={(v: any) => setFormData(p => ({...p, t10Atk: String(v)}))} />
                             <TechNode id="t10Def" label={t('t10.def')} value={formData.t10Def} onChange={(v: any) => setFormData(p => ({...p, t10Def: String(v)}))} />
                         </div>
                         <div className="h-6 w-px bg-sky-500/30"></div>
                         <TechNode id="t10Elite" label="Elite Units" value={formData.t10Elite} onChange={(v: any) => setFormData(p => ({...p, t10Elite: String(v)}))} binary />
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

                    <div className="relative overflow-hidden rounded-lg bg-black/40 border border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
                        <div>
                            <h4 className="text-xs font-bold text-sky-400 uppercase tracking-widest">{t('calc.remaining')}</h4>
                            <p className="text-[9px] text-slate-500 font-mono">Projected resources to finish T10.</p>
                        </div>
                        <div className="flex gap-6">
                            <div className="text-center"><span className="text-[10px] text-amber-500 block uppercase">Gold</span><span className="text-lg font-mono text-white font-bold">{formatResource(resourcesNeeded.gold)}</span></div>
                            <div className="text-center"><span className="text-[10px] text-purple-400 block uppercase">Valor</span><span className="text-lg font-mono text-white font-bold">{resourcesNeeded.valor.toLocaleString()}</span></div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-l-2 border-emerald-500 pl-3">{t('section.infrastructure')}</h3>
                <div className="bg-[#0a0f1e]/50 p-6 rounded-xl border border-white/5 shadow-lg grid grid-cols-2 md:grid-cols-3 gap-6 transition-all hover:border-emerald-500/20">
                    <FormInput label="Barracks" name="barracksLevel" val={formData.barracksLevel} change={(e: any) => setFormData(p => ({...p, barracksLevel: e.target.value}))} type="number" suffix="lvl" req={true} />
                    <FormInput label="Tech Center" name="techLevel" val={formData.techLevel} change={(e: any) => setFormData(p => ({...p, techLevel: e.target.value}))} type="number" suffix="lvl" req={true} />
                    <FormInput label="Tank" name="tankCenterLevel" val={formData.tankCenterLevel} change={(e: any) => setFormData(p => ({...p, tankCenterLevel: e.target.value}))} type="number" suffix="lvl" req={true} />
                    <FormInput label="Air" name="airCenterLevel" val={formData.airCenterLevel} change={(e: any) => setFormData(p => ({...p, airCenterLevel: e.target.value}))} type="number" suffix="lvl" req={true} />
                    <FormInput label="Missile" name="missileCenterLevel" val={formData.missileCenterLevel} change={(e: any) => setFormData(p => ({...p, missileCenterLevel: e.target.value}))} type="number" suffix="lvl" req={true} />
                </div>
            </section>

            <div className="flex justify-end pt-4 pb-12">
                <button type="submit" disabled={loading} className="bg-sky-600 hover:bg-sky-500 text-white font-header font-bold py-4 px-12 rounded-sm transition-all shadow-lg shadow-sky-500/20 uppercase tracking-widest click-scale">
                    {loading ? 'Transmitting...' : t('form.submit')}
                </button>
            </div>
        </form>
    </div>
  );
};

export default StatsForm;