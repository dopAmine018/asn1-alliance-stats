import React, { useState } from 'react';
import { MockApi } from '../services/mockBackend';
import { Language } from '../types';
import { useLanguage } from '../utils/i18n';
import { CustomDropdown } from './CustomDropdown';
import { useToast } from './Toast';

// --- Icons (Vector Paths - Modern Stroke Style) ---
const DuelIcon = () => (
  <svg className="w-full h-full text-sky-500 drop-shadow-[0_0_8px_rgba(14,165,233,0.3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
    <path d="M13 19l6-6" />
    <path d="M16 16l4 4" />
    <path d="M19 21l-2-2" />
  </svg>
);

const HeroIcon = () => (
  <svg className="w-full h-full text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5z" />
  </svg>
);

const UnitsIcon = () => (
  <svg className="w-full h-full text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconSword = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
    <path d="M13 19l6-6" />
  </svg>
);

const IconShield = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconHeart = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const IconProtect = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const MoraleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

interface StatsFormProps {
  onSuccess: () => void;
}

const STORAGE_KEY = 'asn1_last_submission';

const InputField = ({ label, subLabel, name, value, required = false, type="text", placeholder, onChange, onBlur }: any) => (
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
              onBlur={onBlur}
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

const defaultFormData = {
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
};

const StatsForm: React.FC<StatsFormProps> = ({ onSuccess }) => {
  const { t, language } = useLanguage();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingPlayer, setLoadingPlayer] = useState(false);
  
  const [formData, setFormData] = useState({
    language: 'english' as Language, 
    ...defaultFormData
  });

  // Load saved data on mount
  React.useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormData(prev => ({
          ...prev,
          ...parsed,
          language: language
        }));
      } catch(e) {
        console.error("Error loading saved form data", e);
      }
    }
  }, []);

  React.useEffect(() => { setFormData(prev => ({...prev, language: language })); }, [language]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value })); };
  const handleDropdownChange = (name: string) => (value: string | number) => { setFormData(prev => ({ ...prev, [name]: String(value) })); };

  // New function to load player data from server by name
  const handleNameBlur = async () => {
      if(!formData.name || formData.name.length < 3) return;
      
      setLoadingPlayer(true);
      try {
          // Search for exact match normalized
          const res = await MockApi.getPlayers({
              search: formData.name,
              language: 'all',
              sort: 'time_desc',
              activeOnly: false
          });
          
          if(res.items && res.items.length > 0) {
              // Find best match (exact name match preferred)
              const normalizedInput = formData.name.toLowerCase().trim();
              const match = res.items.find(p => p.nameNormalized === normalizedInput) || res.items[0];
              
              if(match) {
                  addToast('info', `Loaded existing data for ${match.name}`);
                  // Map DB data back to form format
                  const normalizePowerToInput = (val: number | undefined) => val ? String(val / 1000000) : '';
                  
                  setFormData(prev => ({
                      ...prev,
                      name: match.name, // Keep exact casing from DB
                      firstSquadPower: normalizePowerToInput(match.firstSquadPower),
                      secondSquadPower: normalizePowerToInput(match.secondSquadPower),
                      thirdSquadPower: normalizePowerToInput(match.thirdSquadPower),
                      fourthSquadPower: normalizePowerToInput(match.fourthSquadPower),
                      totalHeroPower: normalizePowerToInput(match.totalHeroPower),
                      heroPercent: String(match.heroPercent),
                      duelPercent: String(match.duelPercent),
                      unitsPercent: String(match.unitsPercent),
                      t10Morale: String(match.t10Morale),
                      t10Protection: String(match.t10Protection),
                      t10Hp: String(match.t10Hp),
                      t10Atk: String(match.t10Atk),
                      t10Def: String(match.t10Def),
                      techLevel: String(match.techLevel || ''),
                      barracksLevel: String(match.barracksLevel || ''),
                      tankCenterLevel: String(match.tankCenterLevel || ''),
                      airCenterLevel: String(match.airCenterLevel || ''),
                      missileCenterLevel: String(match.missileCenterLevel || ''),
                  }));
              }
          }
      } catch(e) {
          // Silent fail on lookup
      } finally {
          setLoadingPlayer(false);
      }
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear the form? This will remove your saved data.")) {
        localStorage.removeItem(STORAGE_KEY);
        setFormData({
            language: language,
            ...defaultFormData
        });
        addToast('info', 'Form cleared');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

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
      if (res.success) { 
          localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
          addToast('success', t('form.success')); 
          onSuccess(); 
      } 
      else { throw new Error(res.error || 'Failed to save'); }
    } catch (err: any) { 
      addToast('error', err.message); 
    } finally { 
      setLoading(false); 
    }
  };

  const percentOptions = Array.from({length: 101}, (_, i) => ({ value: i, label: `${i}%` }));
  const levelOptions = Array.from({length: 35}, (_, i) => ({ value: i + 1, label: `Lvl ${i + 1}` }));

  return (
    <div className="glass-panel relative rounded-2xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-50"></div>
        <div className="p-4 sm:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-900/40 gap-3">
            <h2 className="text-lg font-header font-bold text-white tracking-widest uppercase flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                {t('form.title')}
            </h2>
            <div className="flex items-center gap-3 self-start sm:self-auto">
                <button 
                  type="button" 
                  onClick={handleClear} 
                  className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-wider transition-colors px-2 py-1"
                >
                  Clear Form
                </button>
                <div className="text-[9px] font-mono text-sky-500/80 border border-sky-500/20 px-2 py-1 rounded bg-sky-500/5">SECURE UPLINK</div>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-8 sm:space-y-10">
          
          {/* 01: Profile */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
              <div className="md:col-span-4">
                 <h3 className="text-[10px] font-bold text-sky-500 uppercase tracking-[0.2em] mb-2">{t('section.identity')}</h3>
                 <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">{t('section.identity.desc')}</p>
                 <div className="mt-2 text-[10px] text-sky-400 font-mono">
                     * Type name to load existing data
                 </div>
              </div>
              <div className="md:col-span-8 relative">
                  <InputField 
                    label={t('label.name')} 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    onBlur={handleNameBlur}
                    required={true} 
                    placeholder="Commander Name" 
                  />
                  {loadingPlayer && (
                      <div className="absolute right-3 top-9 text-sky-500 animate-spin">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      </div>
                  )}
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
  );
};

export default StatsForm;