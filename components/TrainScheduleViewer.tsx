import React, { useState, useEffect } from 'react';
import { TrainApi } from '../services/mockBackend';
import { useLanguage } from '../utils/i18n';

interface TrainDay {
    dayName: string;
    conductorId: string;
    vipId: string;
    conductorName?: string;
    vipName?: string;
    conductorPower?: number;
    vipPower?: number;
    mode?: 'VIP' | 'Guardian';
    defenderName?: string;
}

const TrainScheduleViewer: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { t } = useLanguage();
    const [schedule, setSchedule] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const data = await TrainApi.getSchedule();
                // We need to fetch players to hydrate names if the DB only stores IDs (depends on backend impl)
                // Assuming getSchedule returns hydrated data or sufficient info. 
                // Based on previous MockApi logic, it saves IDs but the TrainManager hydrated it.
                // For this read-only view, we might need to fetch players too if the DB json is minimal.
                // However, let's assume the "Snapshot" saved in TrainApi.saveSchedule included names or we re-fetch.
                
                // Correction: TrainApi.saveSchedule saves { schedule: [ {dayName, conductorId, vipId} ] }
                // We need to fetch players to get names.
                const playersRes = await import('../services/mockBackend').then(m => m.MockApi.getPlayers({language:'all', search:'', sort:'power_desc', activeOnly:false}));
                const allPlayers = playersRes.items;

                if (data && data.schedule) {
                    const hydrated = data.schedule.map((d: any) => {
                        const cond = allPlayers.find(p => p.id === d.conductorId);
                        const vip = allPlayers.find(p => p.id === d.vipId);
                        
                        let mode = 'VIP';
                        let defenderName = cond?.name;

                        if (cond && vip) {
                            if (cond.firstSquadPower < vip.firstSquadPower) {
                                mode = 'Guardian';
                                defenderName = vip.name;
                            }
                        } else if (vip) {
                            mode = 'Guardian';
                            defenderName = vip.name;
                        }

                        return {
                            dayName: d.dayName,
                            conductorName: cond?.name || 'TBD',
                            vipName: vip?.name || 'TBD',
                            conductorPower: cond?.firstSquadPower,
                            vipPower: vip?.firstSquadPower,
                            mode,
                            defenderName
                        };
                    });
                    setSchedule(hydrated);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchSchedule();
    }, []);

    const formatPower = (val?: number) => val ? (val/1000000).toFixed(1) + 'M' : '-';

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
             {/* Header */}
             <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-700 hover:border-sky-500 hover:text-sky-500 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                        <h2 className="text-xl font-header font-bold text-white uppercase tracking-[0.2em]">{t('train.public_view')}</h2>
                        <p className="text-[10px] text-slate-400 font-mono">Synced from Command HQ</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1,2,3,4,5,6,7].map(i => <div key={i} className="h-32 bg-slate-900/50 rounded-xl animate-pulse border border-slate-800"></div>)}
                </div>
            ) : schedule.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {schedule.map((day, idx) => (
                        <div key={idx} className="bg-[#0f172a] border border-slate-700/50 rounded-xl overflow-hidden group hover:border-sky-500/30 transition-all">
                            <div className={`h-1 w-full bg-gradient-to-r ${day.mode === 'VIP' ? 'from-amber-500 to-amber-700' : 'from-sky-500 to-indigo-500'}`}></div>
                            <div className="p-4">
                                <h3 className="text-xs font-header font-bold text-white uppercase tracking-widest mb-4 flex justify-between">
                                    {t(`day.${day.dayName}` as any)}
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded border ${day.mode === 'VIP' ? 'border-amber-500/20 text-amber-500' : 'border-sky-500/20 text-sky-500'}`}>
                                        {day.mode === 'VIP' ? 'VIP' : 'GUARD'}
                                    </span>
                                </h3>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded border border-slate-800/50">
                                        <div>
                                            <div className="text-[8px] text-slate-500 uppercase tracking-wider mb-0.5">Conductor</div>
                                            <div className="text-sm font-bold text-white">{day.conductorName}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-mono text-amber-500">{formatPower(day.conductorPower)}</div>
                                            {day.defenderName === day.conductorName && <div className="text-[8px] text-sky-500 font-bold uppercase">Defending</div>}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded border border-slate-800/50">
                                        <div>
                                            <div className="text-[8px] text-slate-500 uppercase tracking-wider mb-0.5">{day.mode === 'VIP' ? 'Passenger' : 'Guardian'}</div>
                                            <div className="text-sm font-bold text-white">{day.vipName}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-mono text-purple-500">{formatPower(day.vipPower)}</div>
                                            {day.defenderName === day.vipName && <div className="text-[8px] text-sky-500 font-bold uppercase">Defending</div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800 rounded-xl">
                    <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mb-4 text-slate-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">No Active Orders</p>
                    <p className="text-slate-600 text-[10px] mt-1">Check back after command update.</p>
                </div>
            )}
        </div>
    );
};

export default TrainScheduleViewer;