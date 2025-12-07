
import React, { useState } from 'react';
import { MockApi } from '../services/mockBackend';
import { Language } from '../types';
import { useLanguage } from '../utils/i18n';
import { CustomDropdown } from './CustomDropdown';

// --- Icons (Vector Paths) ---
const DuelIcon = () => <svg className="w-full h-full text-sky-500 drop-shadow-[0_0_8px_rgba(14,165,233,0.3)]" viewBox="0 0 24 24" fill="currentColor"><path d="M14.5 3.5l1.5 1.5-4 4L14 11l4-4 1.5 1.5L8.5 19.5l-2-2L17.5 6.5l-3-3z"/><path d="M10.5 6.5l8 8-1.5 1.5-8-8 1.5-1.5z"/><path d="M5.2 17.8L6.2 18.8L3.5 21.5L2.5 20.5L5.2 17.8Z"/></svg>;
const HeroIcon = () => <svg className="w-full h-full text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z"/></svg>;
const UnitsIcon = () => <svg className="w-full h-full text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>;

const IconSword = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M13.5 4.5l2 2-7.5 7.5-3-1.5 1.5-3 7-5zm-5 8l-2 2H2v-4.5l2-2 3.5 3.5z" clipRule="evenodd"/></svg>;
const IconShield = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 002 0V7z" clipRule="evenodd"/></svg>;
const IconHeart = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/></svg>;
const IconProtect = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>;
const MoraleIcon = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20 12h-1.56l-1.34-4.02C16.48 6.13 14.54 5 12.38 5h-0.76c-2.16 0-4.1 1.13-4.72 2.98L5.56 12H4c-1.1 0-2 0.9-2 2v2h20v-2c0-1.1-0.9-2-2-2z M12 21c-2.38 0-4.48-1.21-5.69-3.04l-0.57-0.85C5.39 16.59 5 15.85 5 15h14c0 0.85-0.39 1.59-0.74 2.11l-0.57 0.85C16.48 19.79 14.38 21 12 21z"/></svg>;

interface StatsFormProps {
  onSuccess: () => void;
}

const InputField = ({ label, subLabel, name, value, required = false, type="text", placeholder, onChange }: any) => (
  <div className="space-y-1.5 group w-full">
      <div className="flex justify-between items-baseline px-1">
          <label className={`text-[10px] font-bold uppercase tracking-widest group-focus-within:text-sky-500 transition-colors ${required ? 'text-sky-200' : 'text-slate-400'}`}>
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {subLabel && <span className="text-[10px] text-slate-500 font-mono">{subLabel}</span>}
      </div>
      <div className="relative">
          <input
              type={type}
              step={type === 'number' ? 'any' : undefined}
              name={name}
              value={value}
              onChange={onChange}
              required={required}
              className="w-full bg-slate-900 border border-slate-700/50 rounded-lg px-4 py-3 text-white placeholder-slate-600 outline-none text-sm font-medium font-mono focus:border-sky-500/50 focus:shadow-[0_0_15px_rgba(14,165,233,0.1)] transition-all"
              style={type === 'number' ? { direction: 'ltr' } : undefined}
              placeholder={placeholder}
          />
      </div>
  </div>
);

const T10Badge = ({ name, labelKey, icon: Icon, colorTheme, value, t, onDropdownChange }: any) => {
  const fullLabel = t(labelKey);
  const shortLabel = fullLabel.match(/\[(.*?)\]/)?.[1] || fullLabel;
  const options = [1,2,3,4,5,6,7,8,9,10].map(num => ({ value: num, label: num === 10 ? 'MAX' : String(num) }));
  
  const themes: any = {
      amber: { text: 'text-amber-400', ring: 'ring-amber-500/30' },
      indigo: { text: 'text-indigo-400', ring: 'ring-indigo-500/30' },
      emerald: { text: 'text-emerald-400', ring: 'ring-emerald-500/30' },
      rose: { text: 'text-rose-400', ring: 'ring-rose-500/30' },
      cyan: { text: 'text-cyan-400', ring: 'ring-cyan-500/30' },
  };
  const currentTheme = themes[colorTheme] || themes.indigo;

  return (
    <div className="relative group w-full">
       <div className={`
          relative bg-slate-900 rounded-xl p-3 sm:p-4 flex flex-col items-center gap-3 sm:gap-4
          border border-slate-700/50 group-hover:border-sky-500/30
          shadow-lg transition-all duration-300 h-full
       `}>
          <div className={`
              w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center 
              bg-slate-950 ring-1 ${currentTheme.ring} ${currentTheme.text}
              shadow-lg shrink-0
          `}>
              <Icon />
          </div>

          <div className="w-full">
              <CustomDropdown 
                value={value} 
                onChange={onDropdownChange(name)} 
                options={options} 
                color="blue"
                className="text-xs" 
                disableSearch={true}
              />
          </div>
          
          <div className="text-center w-full px-1">
             <span className={`block text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors truncate`} title={fullLabel}>
                {shortLabel}
             </span>
          </div>
       </div>
    </div>
  );
};

const StatsForm: React.FC<StatsFormProps> = ({ onSuccess }) => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    language: 'english' as Language, 
    name: '',
    firstSquadPower: '',
    secondSquadPower: '',
    thirdSquadPower: '',
    fourthSquadPower: '',
    totalHeroPower: '',
    heroPercent: '0',
    duelPercent: '0',
    unitsPercent: '0',
    t10Morale: '1',
    t10Protection: '1',
    t10Hp: '1',
    t10Atk: '1',
    t10Def: '1',
    techLevel: '',
    barracksLevel: '',
    tankCenterLevel: '',
    airCenterLevel: '',
    missileCenterLevel: '',
  });

  React.useEffect(() => { setFormData(prev => ({...prev, language: language })); }, [language]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value })); };
  const handleDropdownChange = (name: string) => (value: string | number) => { setFormData(prev => ({ ...prev, [name]: String(value) })); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const normalizePower = (val: string | undefined) => {
        if (!val) return undefined;
        const num = Number(val);
        if (isNaN(num)) return undefined;
        if (num > 1000) return num; 
        return num * 1000000;
    };

    try {
      // Required Field Validation
      if (!formData.name) throw new Error("Name is required");
      if (!formData.firstSquadPower) throw new Error("First Squad Power is required");
      if (!formData.secondSquadPower) throw new Error("Second Squad Power is required");
      if (!formData.totalHeroPower) throw new Error("Total Hero Power is required");
      
      if (!formData.techLevel || !formData.barracksLevel || !formData.tankCenterLevel || 
          !formData.airCenterLevel || !formData.missileCenterLevel) {
          throw new Error(t('form.required_error'));
      }

      const payload = { 
        ...formData, 
        firstSquadPower: normalizePower(formData.firstSquadPower) || 0, 
        secondSquadPower: normalizePower(formData.secondSquadPower), 
        thirdSquadPower: normalizePower(formData.thirdSquadPower), 
        fourthSquadPower: normalizePower(formData.fourthSquadPower), 
        totalHeroPower: normalizePower(formData.totalHeroPower) || 0, 
        heroPercent: Number(formData.heroPercent), 
        duelPercent: Number(formData.duelPercent), 
        unitsPercent: Number(formData.unitsPercent), 
        t10Morale: Number(formData.t10Morale), 
        t10Protection: Number(formData.t10Protection), 
        t10Hp: Number(formData.t10Hp), 
        t10Atk: Number(formData.t10Atk), 
        t10Def: Number(formData.t10Def), 
        techLevel: Number(formData.techLevel), 
        barracksLevel: Number(formData.barracksLevel),
        tankCenterLevel: Number(formData.tankCenterLevel),
        airCenterLevel: Number(formData.airCenterLevel),
        missileCenterLevel: Number(formData.missileCenterLevel)
      };
      
      if (payload.firstSquadPower <= 0) throw new Error("Power must be positive");
      
      const res = await MockApi.upsertPlayer(payload);
      if (res.success) { setMessage({ type: 'success', text: t('form.success') }); onSuccess(); } 
      else { throw new Error(res.error || 'Failed to save'); }
    } catch (err: any) { setMessage({ type: 'error', text: err.message }); } finally { setLoading(false); }
  };

  const percentOptions = Array.from({length: 101}, (_, i) => ({ value: i, label: `${i}%` }));
  const levelOptions = Array.from({length: 35}, (_, i) => ({ value: i + 1, label: `Lvl ${i + 1}` }));

  return (
    <>
      {message && (
        <div className="fixed top-28 left-4 right-4 sm:left-auto sm:right-6 z-[10000] bg-slate-900 border border-slate-700 px-6 py-4 rounded-xl flex items-center gap-4 animate-in slide-in-from-right duration-500 shadow-2xl">
           <div className={`w-3 h-3 rounded-full ${message.type === 'success' ? 'bg-emerald-500 shadow-[0_0_10px_#34d399]' : 'bg-rose-500 shadow-[0_0_10px_#fb7185]'}`}></div>
           <div className="flex-1">
               <h4 className="text-sm font-bold text-white uppercase tracking-wider">{message.type === 'success' ? 'Confirmed' : 'Error'}</h4>
               <p className="text-xs text-slate-400 break-words">{message.text}</p>
           </div>
           <button onClick={() => setMessage(null)} className="ml-2 text-slate-500 hover:text-white p-2">✕</button>
        </div>
      )}

      <div className="glass-panel relative rounded-2xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-50"></div>
        <div className="p-4 sm:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/40 gap-3">
            <h2 className="text-lg font-header font-bold text-white tracking-widest uppercase flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                {t('form.title')}
            </h2>
            <div className="self-start sm:self-auto text-[9px] font-mono text-sky-500/80 border border-sky-500/20 px-2 py-1 rounded bg-sky-500/5">SECURE UPLINK</div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-8 sm:space-y-10">
          
          {/* 01: Profile */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
              <div className="md:col-span-4">
                 <h3 className="text-[10px] font-bold text-sky-500 uppercase tracking-[0.2em] mb-2">{t('section.identity')}</h3>
                 <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">{t('section.identity.desc')}</p>
              </div>
              <div className="md:col-span-8">
                  {/* Language selection removed. Automatically uses site language. */}
                  <InputField label={t('label.name')} name="name" value={formData.name} onChange={handleChange} required={true} placeholder="Commander Name" />
              </div>
          </div>

          <div className="h-px bg-white/5 w-full"></div>

          {/* 02: Power */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
              <div className="md:col-span-4">
                 <h3 className="text-[10px] font-bold text-sky-500 uppercase tracking-[0.2em] mb-2">{t('section.power')}</h3>
                 <div className="p-3 rounded-lg bg-slate-900 border border-slate-700/50 inline-block w-full sm:w-auto">
                    <p className="text-[10px] text-slate-400">{t('section.power.desc')}</p>
                 </div>
              </div>
              <div className="md:col-span-8 grid grid-cols-2 gap-4 sm:gap-5">
                  <div className="col-span-2 sm:col-span-1">
                      <InputField label={t('label.power')} subLabel="(M)" name="firstSquadPower" value={formData.firstSquadPower} onChange={handleChange} type="number" required={true} placeholder="24.5" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                      <InputField label={t('label.squad2')} subLabel="(M)" name="secondSquadPower" value={formData.secondSquadPower} onChange={handleChange} type="number" required={true} placeholder="20.0" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                       <InputField label={t('label.squad3')} subLabel="(M)" name="thirdSquadPower" value={formData.thirdSquadPower} onChange={handleChange} type="number" placeholder={t('form.optional')} />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                       <InputField label={t('label.squad4')} subLabel="(M)" name="fourthSquadPower" value={formData.fourthSquadPower} onChange={handleChange} type="number" placeholder={t('form.optional')} />
                  </div>
                  <div className="col-span-2">
                       <InputField label={t('label.totalHeroPower')} subLabel="(M)" name="totalHeroPower" value={formData.totalHeroPower} onChange={handleChange} type="number" required={true} placeholder={t('placeholder.server_rank')} />
                  </div>
              </div>
          </div>

          <div className="h-px bg-white/5 w-full"></div>

          {/* 03: Tech Trees (Stats + T10) */}
          <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
                  <h3 className="text-[10px] font-bold text-sky-500 uppercase tracking-[0.2em]">{t('section.techtree')}</h3>
                  <span className="text-[10px] text-slate-400 font-mono hidden md:inline-block">{t('section.techtree.desc')}</span>
              </div>
              
              {/* Description visible on mobile */}
              <p className="text-[10px] text-slate-400 font-mono md:hidden">{t('section.techtree.desc')}</p>

              <div className="bg-slate-900/30 rounded-2xl p-4 sm:p-6 border border-slate-800 space-y-8">
                  {/* Percentages */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                      {[
                          { label: 'stat.hero', name: 'heroPercent', icon: HeroIcon, color: 'gold' },
                          { label: 'stat.duel', name: 'duelPercent', icon: DuelIcon, color: 'blue' },
                          { label: 'stat.units', name: 'unitsPercent', icon: UnitsIcon, color: 'green' }
                      ].map((stat) => (
                          <div key={stat.name} className="bg-[#0f172a] border border-slate-800 p-3 sm:p-4 rounded-xl flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-700 shrink-0`}>
                                  <div className="w-5 h-5 sm:w-6 sm:h-6"><stat.icon /></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate block">{t(stat.label as any)}</label>
                                  <div className="mt-1 sm:mt-2">
                                      <CustomDropdown 
                                        value={(formData as any)[stat.name]} 
                                        onChange={handleDropdownChange(stat.name)} 
                                        options={percentOptions} 
                                        color={stat.color} 
                                        disableSearch={true}
                                      />
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>

                  {/* T10 Badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                      <T10Badge labelKey="t10.morale" name="t10Morale" value={formData.t10Morale} icon={MoraleIcon} colorTheme="amber" t={t} onDropdownChange={handleDropdownChange} />
                      <T10Badge labelKey="t10.protection" name="t10Protection" value={formData.t10Protection} icon={IconProtect} colorTheme="indigo" t={t} onDropdownChange={handleDropdownChange} />
                      <T10Badge labelKey="t10.hp" name="t10Hp" value={formData.t10Hp} icon={IconHeart} colorTheme="emerald" t={t} onDropdownChange={handleDropdownChange} />
                      <T10Badge labelKey="t10.atk" name="t10Atk" value={formData.t10Atk} icon={IconSword} colorTheme="rose" t={t} onDropdownChange={handleDropdownChange} />
                      <T10Badge labelKey="t10.def" name="t10Def" value={formData.t10Def} icon={IconShield} colorTheme="cyan" t={t} onDropdownChange={handleDropdownChange} />
                  </div>
              </div>
          </div>

          <div className="h-px bg-white/5 w-full"></div>

          {/* 04: Buildings */}
          <div className="bg-slate-900/50 rounded-2xl p-4 sm:p-6 border border-slate-800">
               <div className="flex justify-between items-center mb-6">
                   <h3 className="text-[10px] font-bold text-sky-500 uppercase tracking-[0.2em]">{t('section.buildings')}</h3>
               </div>

               {/* Levels */}
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                   {[
                       { label: 'level.tech', name: 'techLevel' },
                       { label: 'level.barracks', name: 'barracksLevel' },
                       { label: 'level.tank', name: 'tankCenterLevel' },
                       { label: 'level.air', name: 'airCenterLevel' },
                       { label: 'level.missile', name: 'missileCenterLevel' },
                   ].map((item) => (
                       <div key={item.name}>
                           <label className="block text-[10px] font-bold text-sky-200 uppercase tracking-widest mb-2 whitespace-nowrap overflow-hidden text-ellipsis">
                               {t(item.label as any)} <span className="text-rose-500">*</span>
                           </label>
                           <CustomDropdown 
                               value={(formData as any)[item.name]} 
                               onChange={handleDropdownChange(item.name)} 
                               options={levelOptions} 
                               color="blue" 
                               placeholder="Lvl"
                               disableSearch={true}
                            />
                       </div>
                   ))}
               </div>
          </div>

          <div className="pt-4 flex justify-end">
              <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto relative group overflow-hidden bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-header font-bold py-4 px-12 rounded-xl transition-all duration-300 shadow-lg shadow-sky-600/20 active:scale-95"
              >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                      {loading ? t('form.saving').toUpperCase() : t('form.submit').toUpperCase()}
                      {!loading && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
                  </span>
              </button>
          </div>

        </form>
      </div>
    </>
  );
};

export default StatsForm;
