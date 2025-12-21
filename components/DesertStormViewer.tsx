
import React, { useState, useEffect, useRef } from 'react';
import { DesertStormApi, MockApi } from '../services/mockBackend';
import { Player } from '../types';
import { useLanguage } from '../utils/i18n';
// @ts-ignore
import html2canvas from 'html2canvas';
import { useToast } from './Toast';

interface HydratedTeam {
    teamAMain: Player[];
    teamASubs: Player[];
    teamBMain: Player[];
    teamBSubs: Player[];
}

interface DesertStormViewerProps {
    onBack: () => void;
    onCreateProfile?: () => void;
    allowRegistration?: boolean;
}

const DesertStormViewer: React.FC<DesertStormViewerProps> = ({ onBack, onCreateProfile, allowRegistration = true }) => {
    const { t } = useLanguage();
    const { addToast } = useToast();
    const [data, setData] = useState<HydratedTeam>({ teamAMain: [], teamASubs: [], teamBMain: [], teamBSubs: [] });
    const [loading, setLoading] = useState(true);
    const exportRef = useRef<HTMLDivElement>(null);
    
    const [showRegister, setShowRegister] = useState(false);
    const [regName, setRegName] = useState('');
    const [regTime, setRegTime] = useState<'14:00' | '23:00' | 'ANY'>('ANY');
    const [searchCandidates, setSearchCandidates] = useState<Player[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

    // Feature Detection for Export
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const canShare = !!navigator.share;

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const teams = await DesertStormApi.getTeams();
            const playersRes = await MockApi.getPlayers({ language: 'all', search: '', sort: 'power_desc', activeOnly: false });
            const allPlayers = playersRes.items;

            if (teams) {
                const hydrate = (ids: string[]) => ids.map(id => allPlayers.find(p => p.id === id)).filter(Boolean) as Player[];
                setData({
                    teamAMain: hydrate(teams.teamAMain),
                    teamASubs: hydrate(teams.teamASubs),
                    teamBMain: hydrate(teams.teamBMain),
                    teamBSubs: hydrate(teams.teamBSubs),
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const getLocalTime = (gmt3Hour: number) => {
        const date = new Date();
        date.setUTCHours(gmt3Hour - 3, 0, 0, 0);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const handleSearch = async (val: string) => {
        setRegName(val);
        setSelectedPlayer(null);
        if (val.length >= 2) {
            const res = await MockApi.getPlayers({ search: val, language: 'all', sort: 'power_desc', activeOnly: true });
            setSearchCandidates(res.items.slice(0, 8));
        } else {
            setSearchCandidates([]);
        }
    };

    const submitRegistration = async () => {
        if (!selectedPlayer) {
            addToast('error', 'Select your profile');
            return;
        }
        try {
            await DesertStormApi.register(selectedPlayer.id, regTime);
            addToast('success', `Applied: ${selectedPlayer.name}`);
            setShowRegister(false);
            setRegName('');
            setSelectedPlayer(null);
        } catch (e: any) {
            addToast('error', 'Sync Failed');
        }
    };

    const getTotalPower = (players: Player[]) => {
        const total = players.reduce((sum, p) => sum + (p.firstSquadPower || 0), 0);
        return (total / 1000000000).toFixed(2) + 'B';
    };

    const handleExportAction = async (action: 'copy' | 'download' | 'share') => {
        if (!exportRef.current) return;
        try {
            addToast('info', 'Rendering Tactical Image...');
            
            const canvas = await html2canvas(exportRef.current, { 
                backgroundColor: '#020617', 
                scale: 2,
                logging: false,
                useCORS: true
            });

            canvas.toBlob(async (blob: Blob | null) => {
                if (!blob) throw new Error("Capture failed");

                if (action === 'copy') {
                    try {
                        const item = new ClipboardItem({ 'image/png': blob });
                        await navigator.clipboard.write([item]);
                        addToast('success', 'Roster copied to clipboard');
                    } catch (err) {
                        addToast('error', 'Clipboard access denied');
                    }
                } else if (action === 'share') {
                    const file = new File([blob], "ASN1_Roster.png", { type: "image/png" });
                    if (navigator.share) {
                        await navigator.share({
                            files: [file],
                            title: 'Desert Storm Roster',
                            text: 'Latest orders for ASN1 Alliance.'
                        });
                        addToast('success', 'Shared successfully');
                    }
                } else {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `ASN1_Roster_${new Date().toISOString().split('T')[0]}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    addToast('success', 'Image saved to downloads');
                }
            }, 'image/png');
        } catch(e) { 
            addToast('error', 'Export error'); 
            console.error(e);
        }
    };

    const PlayerList = ({ players, title, color }: { players: Player[], title: string, color: string }) => (
        <div className="mb-6">
            <div className={`flex justify-between items-center mb-2 border-b ${color} pb-1`}>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{title}</span>
                <span className="text-[9px] font-mono text-slate-600 font-bold">{players.length}</span>
            </div>
            <div className="space-y-1">
                {players.length > 0 ? players.map((p, i) => (
                    <div key={p.id} className="flex justify-between items-center bg-black/20 border border-white/5 p-2 rounded shadow-sm">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[8px] font-mono text-slate-700 font-bold">{i + 1}</span>
                            <span className="text-xs font-bold text-slate-200 truncate">{p.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-sky-500 ml-2">{(p.firstSquadPower/1000000).toFixed(1)}M</span>
                    </div>
                )) : <div className="text-[10px] text-slate-700 italic py-2 text-center bg-black/10 rounded">TBD</div>}
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 border-b border-white/5 pb-6 gap-4 px-4">
                <div className="flex items-center gap-4 w-full">
                    <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-white/5 hover:border-sky-500 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                        <h2 className="text-xl font-header font-black text-white uppercase tracking-wider">DESERT STORM</h2>
                        <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Weekly Desert Storm Deployment</p>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    {allowRegistration && (
                        <button onClick={() => setShowRegister(true)} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/10">
                             JOIN EVENT
                        </button>
                    )}
                    
                    {/* Device-Specific Export Controls */}
                    <div className="flex rounded-xl overflow-hidden border border-slate-700">
                        {(!isMobile || !canShare) ? (
                            <button 
                                onClick={() => handleExportAction('copy')} 
                                className="bg-slate-800 hover:bg-slate-700 text-sky-400 px-3 py-3 text-[10px] font-black uppercase tracking-widest border-r border-slate-700 transition-colors flex items-center gap-2"
                                title="Copy to clipboard"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                COPY
                            </button>
                        ) : (
                            <button 
                                onClick={() => handleExportAction('share')} 
                                className="bg-slate-800 hover:bg-slate-700 text-sky-400 px-3 py-3 text-[10px] font-black uppercase tracking-widest border-r border-slate-700 transition-colors flex items-center gap-2"
                                title="Share native"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                                SHARE
                            </button>
                        )}
                        <button 
                            onClick={() => handleExportAction('download')} 
                            className="bg-slate-800 hover:bg-slate-700 text-sky-400 px-3 py-3 text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                            title="Download PNG"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M16 10l-4 4m0 0l-4-4m4 4V4" /></svg>
                            DL
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4 text-sky-500">
                    <div className="w-8 h-8 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
                    <p className="font-mono text-[10px] uppercase tracking-widest">Accessing Intel...</p>
                </div>
            ) : (
                <div className="px-4 space-y-6 pb-20">
                    
                    {/* Team A Vertical Block */}
                    <div className="bg-[#0f172a] rounded-2xl border border-amber-500/30 overflow-hidden shadow-2xl">
                         <div className="p-5 bg-gradient-to-r from-amber-500/10 to-transparent flex justify-between items-center border-b border-amber-500/20">
                            <div>
                                <h3 className="text-2xl font-header font-black text-white">TEAM A</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">14:00 GMT+3</span>
                                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded uppercase">Your Time: {getLocalTime(14)}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest">NET POWER</p>
                                <p className="text-xl font-mono font-black text-white">{getTotalPower([...data.teamAMain, ...data.teamASubs])}</p>
                            </div>
                         </div>
                         <div className="p-5">
                            <PlayerList players={data.teamAMain} title="Squad 1 (Main Offensive)" color="border-amber-500/20" />
                            <PlayerList players={data.teamASubs} title="Squad 1 (Reserves)" color="border-slate-800" />
                         </div>
                    </div>

                    {/* Team B Vertical Block */}
                    <div className="bg-[#0f172a] rounded-2xl border border-sky-500/30 overflow-hidden shadow-2xl">
                         <div className="p-5 bg-gradient-to-r from-sky-500/10 to-transparent flex justify-between items-center border-b border-sky-500/20">
                            <div>
                                <h3 className="text-2xl font-header font-black text-white">TEAM B</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-mono font-bold text-sky-500 bg-sky-500/10 px-2 py-0.5 rounded">23:00 GMT+3</span>
                                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded uppercase">Your Time: {getLocalTime(23)}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-black text-sky-500 uppercase tracking-widest">NET POWER</p>
                                <p className="text-xl font-mono font-black text-white">{getTotalPower([...data.teamBMain, ...data.teamBSubs])}</p>
                            </div>
                         </div>
                         <div className="p-5">
                            <PlayerList players={data.teamBMain} title="Squad 1 (Main Offensive)" color="border-sky-500/20" />
                            <PlayerList players={data.teamBSubs} title="Squad 1 (Reserves)" color="border-slate-800" />
                         </div>
                    </div>

                    {/* Hidden Export Container - Positioned and fixed for proper capture */}
                    <div style={{ position: 'fixed', left: '-5000px', top: '0', width: '800px', zIndex: -1 }}>
                        <div ref={exportRef} className="bg-[#020617] p-12 w-[800px] text-white">
                            <div className="text-center mb-10 border-b border-slate-800 pb-10">
                                <h1 className="text-5xl font-header font-black tracking-[0.4em] text-white">DESERT STORM ROSTER</h1>
                                <p className="text-sm text-slate-500 font-mono mt-4 uppercase tracking-[0.2em]">ASN1 ALLIANCE STRATEGIC COMMAND</p>
                            </div>
                            <div className="grid grid-cols-2 gap-16">
                                <div>
                                    <h2 className="text-4xl font-black italic border-b-4 border-amber-500 pb-3 flex justify-between items-end">
                                        TEAM A <span className="text-xl font-mono not-italic text-amber-500">{getTotalPower([...data.teamAMain, ...data.teamASubs])}</span>
                                    </h2>
                                    <div className="mt-8"><PlayerList players={data.teamAMain} title="MAIN OFFENSIVE" color="border-amber-500/30" /></div>
                                    <PlayerList players={data.teamASubs} title="RESERVE SQUAD" color="border-amber-900/20" />
                                </div>
                                <div>
                                    <h2 className="text-4xl font-black italic border-b-4 border-sky-500 pb-3 flex justify-between items-end">
                                        TEAM B <span className="text-xl font-mono not-italic text-sky-500">{getTotalPower([...data.teamBMain, ...data.teamBSubs])}</span>
                                    </h2>
                                    <div className="mt-8"><PlayerList players={data.teamBMain} title="MAIN OFFENSIVE" color="border-sky-500/30" /></div>
                                    <PlayerList players={data.teamBSubs} title="RESERVE SQUAD" color="border-sky-900/20" />
                                </div>
                            </div>
                            <div className="mt-16 pt-8 border-t border-slate-800 text-center">
                                <span className="text-xs text-slate-600 font-mono tracking-widest uppercase italic">Transmission Verified // ASN1 Tactical Interface</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Registration Modal */}
            {showRegister && (
                <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
                    <div className="bg-[#0b1121] w-full max-w-md rounded-2xl border border-white/5 shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                            <h3 className="text-sm font-header font-black text-white uppercase tracking-widest">Apply for Slot</h3>
                            <button onClick={() => setShowRegister(false)} className="text-slate-500 hover:text-white transition-colors">✕</button>
                        </div>
                        
                        <div className="p-6 space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Identify Your Profile</label>
                                <input 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-sky-500 outline-none transition-all placeholder-slate-700 text-sm"
                                    value={regName}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Enter commander name..."
                                />
                                {selectedPlayer ? (
                                    <div className="bg-sky-500/10 border border-sky-500/30 p-3 rounded-xl flex justify-between items-center">
                                        <span className="text-sm font-bold text-white uppercase">{selectedPlayer.name}</span>
                                        <button onClick={() => setSelectedPlayer(null)} className="text-[9px] font-black text-slate-500 hover:text-rose-500 uppercase">Clear</button>
                                    </div>
                                ) : searchCandidates.length > 0 && (
                                    <div className="bg-slate-950 border border-slate-800 rounded-xl mt-1 divide-y divide-slate-800 max-h-40 overflow-y-auto">
                                        {searchCandidates.map(p => (
                                            <button key={p.id} onClick={() => { setSelectedPlayer(p); setRegName(p.name); setSearchCandidates([]); }} className="w-full px-4 py-3 hover:bg-sky-500/10 text-left flex justify-between">
                                                <span className="text-xs text-slate-300 font-bold">{p.name}</span>
                                                <span className="text-[10px] text-sky-500 font-mono">{(p.firstSquadPower/1000000).toFixed(1)}M</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Deployment Time</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        { val: '14:00', label: `TEAM A (${getLocalTime(14)} LOCAL)` },
                                        { val: '23:00', label: `TEAM B (${getLocalTime(23)} LOCAL)` },
                                        { val: 'ANY', label: 'EITHER TIME (ANY)' }
                                    ].map(opt => (
                                        <button 
                                            key={opt.val} 
                                            onClick={() => setRegTime(opt.val as any)} 
                                            className={`w-full py-4 px-4 rounded-xl border text-[10px] font-black transition-all flex justify-between items-center ${regTime === opt.val ? 'bg-sky-600 border-sky-400 text-white shadow-lg' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                                        >
                                            {opt.label}
                                            {regTime === opt.val && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-900/50 border-t border-white/5">
                            <button 
                                onClick={submitRegistration} 
                                disabled={!selectedPlayer}
                                className={`w-full py-4 rounded-xl font-header font-black uppercase tracking-widest text-xs transition-all ${selectedPlayer ? 'bg-sky-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 opacity-50 cursor-not-allowed'}`}
                            >
                                Submit Application
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DesertStormViewer;
