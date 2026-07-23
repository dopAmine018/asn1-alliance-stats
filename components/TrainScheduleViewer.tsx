import React, { useState, useEffect, useRef } from 'react';
import { toBlob } from 'html-to-image';
import { TrainApi } from '../services/mockBackend';
import { useLanguage } from '../utils/i18n';
import { useToast } from './Toast';

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
    const { t, dir } = useLanguage();
    const { addToast } = useToast();
    const [schedule, setSchedule] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCapturing, setIsCapturing] = useState(false);
    const posterRef = useRef<HTMLDivElement>(null);

    const saveSchedulePng = async () => {
        if (schedule.length === 0) {
            addToast('error', 'No schedule available');
            return;
        }

        setIsCapturing(true);

        try {
            await new Promise(r => setTimeout(r, 100));

            if (!posterRef.current) throw new Error('Poster element missing');

            const blob = await toBlob(posterRef.current, {
                quality: 0.95,
                pixelRatio: 2,
                backgroundColor: '#0b1329',
                cacheBust: true,
            });

            if (!blob) throw new Error('Could not render image');

            const dateStr = new Date().toISOString().slice(0, 10);
            const fileName = `ASN1_Train_Schedule_${dateStr}.png`;
            const file = new File([blob], fileName, { type: 'image/png' });

            let shared = false;

            // 1. Mobile Web Share API - opens native phone sheet ("Save Image" to Photos/Gallery/Files)
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        title: 'ASN1 Train Schedule',
                        text: 'ASN1 Alliance Train Schedule',
                        files: [file],
                    });
                    shared = true;
                    addToast('success', '📱 Saved/Shared Schedule Image!');
                } catch (shareErr) {
                    if ((shareErr as Error).name !== 'AbortError') {
                        console.warn('Native share failed, falling back to direct download:', shareErr);
                    } else {
                        shared = true; // User canceled native share sheet
                    }
                }
            }

            // 2. Direct browser file download link
            if (!shared) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                addToast('success', '📥 Schedule image saved to downloads!');

                if (navigator.clipboard && window.ClipboardItem) {
                    try {
                        const item = new ClipboardItem({ 'image/png': blob });
                        await navigator.clipboard.write([item]);
                    } catch (clipErr) {
                        // ignore clipboard errors
                    }
                }

                setTimeout(() => URL.revokeObjectURL(url), 5000);
            }
        } catch (err) {
            console.error('PNG Capture error:', err);
            addToast('error', 'Failed to generate PNG image');
        } finally {
            setIsCapturing(false);
        }
    };

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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto" dir={dir}>
             {/* Header */}
             <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-700 hover:border-sky-500 hover:text-sky-500 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                        <h2 className="text-xl font-header font-bold text-white uppercase tracking-[0.2em]">{t('train.public_view')}</h2>
                        <p className="text-[10px] text-slate-400 font-mono">{t('train.synced_hq')}</p>
                    </div>
                </div>

                {schedule.length > 0 && (
                    <button 
                        onClick={saveSchedulePng}
                        disabled={isCapturing}
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white transition-all flex items-center gap-2 shadow-lg shadow-sky-900/20 text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                    >
                        {isCapturing ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        )}
                        <span>Save PNG to Phone</span>
                    </button>
                )}
            </div>

            {/* Hidden Offscreen Schedule Poster Template for High-Res PNG Capture */}
            <div className="fixed top-[-9999px] left-[-9999px] pointer-events-none opacity-0 z-[-9999]">
                <div 
                    ref={posterRef} 
                    className="w-[850px] bg-[#0b1329] text-white p-8 border-2 border-amber-500/50 rounded-2xl shadow-2xl font-sans"
                >
                    {/* Poster Header */}
                    <div className="flex items-center justify-between border-b-2 border-amber-500/30 pb-6 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-amber-400 font-black text-2xl shadow-lg">
                                🚆
                            </div>
                            <div>
                                <h1 className="text-2xl font-black uppercase tracking-wider text-amber-400">ASN1 TRAIN SCHEDULE</h1>
                                <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">ALLIANCE TACTICAL DISTRIBUTION</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-mono text-sky-400 bg-sky-950/80 border border-sky-500/30 px-3 py-1.5 rounded-lg font-bold">
                                COMMAND SYNCED
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1.5 font-mono">
                                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                        </div>
                    </div>

                    {/* Poster Schedule Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        {schedule.map((day, idx) => (
                            <div key={idx} className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between shadow-md">
                                <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
                                    <span className="text-sm font-bold text-white uppercase tracking-wider">
                                        {t(`day.${day.dayName}` as any)}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border uppercase font-mono ${
                                        day.mode === 'VIP' 
                                            ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' 
                                            : 'border-sky-500/50 bg-sky-500/10 text-sky-400'
                                    }`}>
                                        {day.mode === 'VIP' ? 'VIP MODE' : 'GUARDIAN MODE'}
                                    </span>
                                </div>

                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between items-center bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                                        <div>
                                            <div className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">Conductor</div>
                                            <div className="font-bold text-white text-sm">{day.conductorName || 'TBD'}</div>
                                        </div>
                                        <div className="text-right font-mono text-amber-400 font-bold">
                                            {formatPower(day.conductorPower)}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                                        <div>
                                            <div className={`text-[9px] font-bold uppercase tracking-wider ${day.mode === 'Guardian' ? 'text-sky-400' : 'text-purple-400'}`}>
                                                {day.mode === 'Guardian' ? 'Guardian' : 'Passenger'}
                                            </div>
                                            <div className="font-bold text-white text-sm">{day.vipName || 'TBD'}</div>
                                        </div>
                                        <div className="text-right font-mono text-purple-400 font-bold">
                                            {formatPower(day.vipPower)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Poster Footer */}
                    <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400 font-mono">
                        <span>🛡️ ASN1 ALLIANCE COMMAND</span>
                        <span>GENERATED PNG SCHEDULE</span>
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
                                            <div className="text-[8px] text-slate-500 uppercase tracking-wider mb-0.5">{t('train.conductor')}</div>
                                            <div className="text-sm font-bold text-white">{day.conductorName}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-mono text-amber-500">{formatPower(day.conductorPower)}</div>
                                            {day.defenderName === day.conductorName && <div className="text-[8px] text-sky-500 font-bold uppercase">{t('train.defending')}</div>}
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center p-2 bg-slate-900/50 rounded border border-slate-800/50">
                                        <div>
                                            <div className="text-[8px] text-slate-500 uppercase tracking-wider mb-0.5">{day.mode === 'VIP' ? t('train.vip') : t('train.guardian')}</div>
                                            <div className="text-sm font-bold text-white">{day.vipName}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-mono text-purple-500">{formatPower(day.vipPower)}</div>
                                            {day.defenderName === day.vipName && <div className="text-[8px] text-sky-500 font-bold uppercase">{t('train.defending')}</div>}
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
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">{t('train.no_orders')}</p>
                    <p className="text-slate-600 text-[10px] mt-1">{t('train.check_back')}</p>
                </div>
            )}
        </div>
    );
};

export default TrainScheduleViewer;