
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

    const handleExport = async () => {
        if (!exportRef.current) return;
        try {
            addToast('info', 'Generating Image...');
            const canvas = await html2canvas(exportRef.current, { backgroundColor: '#020617', scale: 2 });
            canvas.toBlob((blob: any) => {
                if(blob) {
                    navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
                        .then(() => addToast('success', 'Copied to clipboard'))
                        .catch(() => addToast('error', 'Clipboard denied'));
                }
            });
        } catch(e) { addToast('error', 'Export failed'); }
    };

    const PlayerList = ({ players, title, color }: { players: Player[], title: string, color: string }) => (
        <div className="mb-6">
            <div className={`flex justify-between items-center mb-2 border-b ${color} pb-1`}>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</span>
                <span className="text-[9px] font-mono text-slate-500 font-bold">{players.length}</span>
            </div>
            <div className="space-y-1">
                {players.length > 0 ? players.map((p, i) => (
                    <div key={p.id} className="flex justify-between items-center bg-slate-900/40 border border-white/5 p-2 rounded hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[8px] font-mono text-slate-600 font-bold">{i + 1}</span>
                            <span className="text-xs font-bold text-slate-200 truncate">{p.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-sky-500 ml-2">{(p.firstSquadPower/1000000).toFixed(1)}M</span>
                    </div>
                )) : <div className="text-[10px] text-slate-600 italic py-2 text-center bg-black/20 rounded">PENDING</div>}
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto px-4 lg:px-0">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 border-b border-white/10 pb-6 gap-4">
                <div className="flex items-center gap-4 w-full">
                    <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-white/5 hover:border-sky-500 hover:text-sky-500 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                        <h2 className="text-xl font-header font-black text-white uppercase tracking-wider">DESERT STORM</h2>
                        <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Weekly Tactical Deployment</p>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    {allowRegistration && (
                        <button onClick={() => setShowRegister(true)} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all click-scale shadow-lg shadow-emerald-900/20">
                             JOIN
                        </button>
                    )}
                    <button onClick={handleExport} className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all click-scale">
                        IMAGE
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4 text-sky-500">
                    <div className="w-8 h-8 border-2 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
                    <p className="font-mono text-[10px] uppercase tracking-widest">Accessing Intel...</p>
                </div>
            ) : (
                <>
                    {/* Visual Interface for Phone (Responsive) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
                        {/* Team A Phone UI */}
                        <div className="bg-[#0f172a]/40 border border-amber-500/20 rounded-2xl p-5 shadow-2xl">
                             <div className="flex justify-between items-end mb-6 border-b-2 border-amber-500 pb-2">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-amber-500">☀</span>
                                        <span className="text-[9px] text-slate-500 font-bold uppercase">14:00 GMT+3</span>
                                    </div>
                                    <h3 className="text-2xl font-header font-black text-white">TEAM A</h3>
                                </div>
                                <div className="text-right">
                                    <div className="text-[8px] text-amber-500 font-black uppercase">POWER</div>
                                    <div className="text-xl font-mono font-black text-white">{getTotalPower([...data.teamAMain, ...data.teamASubs])}</div>
                                </div>
                             </div>
                             <PlayerList players={data.teamAMain} title="Primary Offensive" color="border-amber-500/30" />
                             <PlayerList players={data.teamASubs} title="Reserves" color="border-amber-900/20" />
                        </div>

                        {/* Team B Phone UI */}
                        <div className="bg-[#0f172a]/40 border border-sky-500/20 rounded-2xl p-5 shadow-2xl">
                             <div className="flex justify-between items-end mb-6 border-b-2 border-sky-500 pb-2">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sky-500">☾</span>
                                        <span className="text-[9px] text-slate-500 font-bold uppercase">23:00 GMT+3</span>
                                    </div>
                                    <h3 className="text-2xl font-header font-black text-white">TEAM B</h3>
                                </div>
                                <div className="text-right">
                                    <div className="text-[8px] text-sky-500 font-black uppercase">POWER</div>
                                    <div className="text-xl font-mono font-black text-white">{getTotalPower([...data.teamBMain, ...data.teamBSubs])}</div>
                                </div>
                             </div>
                             <PlayerList players={data.teamBMain} title="Primary Offensive" color="border-sky-500/30" />
                             <PlayerList players={data.teamBSubs} title="Reserves" color="border-sky-900/20" />
                        </div>
                    </div>

                    {/* Hidden Container for Export (Keeps fixed width for good image aspect ratio) */}
                    <div style={{ position: 'absolute', left: -9999, top: 0 }}>
                        <div ref={exportRef} className="bg-[#020617] p-10 w-[1000px] border border-slate-800 text-white rounded-xl">
                            <div className="flex justify-center mb-8">
                                <h1 className="text-3xl font-header font-black tracking-[0.4em] text-white">DESERT STORM ORDERS</h1>
                            </div>
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <h2 className="text-4xl font-black italic border-b-4 border-amber-500 pb-2 flex justify-between items-end">
                                        TEAM A <span className="text-xl font-mono not-italic text-amber-500">{getTotalPower([...data.teamAMain, ...data.teamASubs])}</span>
                                    </h2>
                                    <PlayerList players={data.teamAMain} title="PRIMARY SQUAD" color="border-amber-500/30" />
                                    <PlayerList players={data.teamASubs} title="RESERVES" color="border-amber-900/20" />
                                </div>
                                <div className="space-y-6">
                                    <h2 className="text-4xl font-black italic border-b-4 border-sky-500 pb-2 flex justify-between items-end">
                                        TEAM B <span className="text-xl font-mono not-italic text-sky-500">{getTotalPower([...data.teamBMain, ...data.teamBSubs])}</span>
                                    </h2>
                                    <PlayerList players={data.teamBMain} title="PRIMARY SQUAD" color="border-sky-500/30" />
                                    <PlayerList players={data.teamBSubs} title="RESERVES" color="border-sky-900/20" />
                                </div>
                            </div>
                            <div className="mt-10 pt-4 border-t border-slate-800 text-center text-xs text-slate-500 font-mono uppercase tracking-widest">
                                ASN1 Alliance Strategic Command // Secured Transmission
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Registration Modal */}
            {showRegister && (
                <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
                    <div className="bg-[#0b1121] w-full max-w-md rounded-2xl border border-white/5 shadow-2xl flex flex-col relative">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-base font-header font-black text-white uppercase tracking-widest">Apply for Entry</h3>
                            <button onClick={() => setShowRegister(false)} className="text-slate-500 hover:text-white transition-colors">✕</button>
                        </div>
                        
                        <div className="p-6 space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Identify Profile</label>
                                <input 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-sky-500 outline-none transition-all placeholder-slate-700 text-sm"
                                    value={regName}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Enter your name..."
                                />
                                {selectedPlayer ? (
                                    <div className="bg-sky-500/10 border border-sky-500/30 p-3 rounded-xl flex justify-between items-center mt-2">
                                        <span className="text-sm font-bold text-white uppercase">{selectedPlayer.name}</span>
                                        <button onClick={() => setSelectedPlayer(null)} className="text-[9px] font-bold text-slate-500">CLEAR</button>
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

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Time Slot</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['14:00', '23:00', 'ANY'].map(t => (
                                        <button key={t} onClick={() => setRegTime(t as any)} className={`py-3 rounded-lg border text-[10px] font-bold transition-all ${regTime === t ? 'bg-sky-600 border-sky-400 text-white' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                                            {t === 'ANY' ? 'EITHER' : t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-900/50 border-t border-white/5 rounded-b-2xl">
                            <button 
                                onClick={submitRegistration} 
                                disabled={!selectedPlayer}
                                className={`w-full py-4 rounded-xl font-header font-black uppercase tracking-widest text-xs transition-all ${selectedPlayer ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/20' : 'bg-slate-800 text-slate-500 opacity-50'}`}
                            >
                                Transmit Application
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DesertStormViewer;
