
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

const DesertStormViewer: React.FC<{ onBack: () => void; onCreateProfile?: () => void }> = ({ onBack, onCreateProfile }) => {
    const { t } = useLanguage();
    const { addToast } = useToast();
    const [data, setData] = useState<HydratedTeam>({ teamAMain: [], teamASubs: [], teamBMain: [], teamBSubs: [] });
    const [loading, setLoading] = useState(true);
    const exportRef = useRef<HTMLDivElement>(null);
    
    // Registration State
    const [showRegister, setShowRegister] = useState(false);
    const [regName, setRegName] = useState('');
    const [regTime, setRegTime] = useState<'14:00' | '23:00'>('14:00');
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
        if (val.length > 2) {
            const res = await MockApi.getPlayers({ search: val, language: 'all', sort: 'power_desc', activeOnly: true });
            setSearchCandidates(res.items.slice(0, 5));
        } else {
            setSearchCandidates([]);
        }
    };

    const submitRegistration = async () => {
        if (!selectedPlayer) {
            addToast('error', 'Select your operative profile first');
            return;
        }
        try {
            await DesertStormApi.register(selectedPlayer.id, regTime);
            addToast('success', `Registered ${selectedPlayer.name} for ${regTime}`);
            setShowRegister(false);
            setRegName('');
            setSelectedPlayer(null);
        } catch (e: any) {
            addToast('error', 'Registration Failed: ' + e.message);
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
                        .then(() => addToast('success', 'Roster copied to clipboard'))
                        .catch(() => addToast('error', 'Clipboard failed'));
                }
            });
        } catch(e) { addToast('error', 'Export failed'); }
    };

    const PlayerList = ({ players, title, color }: { players: Player[], title: string, color: string }) => (
        <div className={`flex flex-col gap-1 mb-4`}>
            <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 pb-1 border-b ${color} text-slate-400 flex justify-between`}>
                <span>{title}</span>
                <span>{players.length} Operatives</span>
            </div>
            {players.length > 0 ? players.map((p, i) => (
                <div key={p.id} className="flex justify-between items-center text-xs py-1 px-2 rounded bg-slate-900/50 border border-slate-800">
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-slate-600 w-4">{i + 1}</span>
                        <span className="text-slate-200 font-bold">{p.name}</span>
                    </div>
                    <span className="font-mono text-sky-500">{(p.firstSquadPower/1000000).toFixed(1)}M</span>
                </div>
            )) : <div className="text-[10px] text-slate-600 italic py-2">TBD</div>}
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-700 hover:border-sky-500 hover:text-sky-500 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                        <h2 className="text-xl font-header font-bold text-white uppercase tracking-[0.2em]">Desert Storm</h2>
                        <p className="text-[10px] text-slate-400 font-mono">Weekly Event Roster</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowRegister(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2 animate-pulse-slow shadow-lg shadow-emerald-900/50">
                        Join Operation
                    </button>
                    <button onClick={handleExport} className="bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Export
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex items-center justify-center text-sky-500 animate-pulse font-mono text-xs uppercase tracking-widest">Decrypting Intel...</div>
            ) : (
                <div className="overflow-x-auto pb-8">
                    <div ref={exportRef} className="bg-[#020617] p-8 min-w-[800px] border border-slate-800 rounded-xl relative">
                        {/* Background Logo */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                             <div className="w-96 h-96 rounded-full border-[20px] border-white"></div>
                        </div>

                        <div className="grid grid-cols-2 gap-12 relative z-10">
                            {/* Team A */}
                            <div className="border-r border-slate-800 pr-12">
                                <div className="flex justify-between items-end mb-6 border-b-4 border-amber-500 pb-2">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-amber-500">☀</span>
                                            <span className="text-[10px] text-slate-400 uppercase tracking-widest">14:00 GMT+3</span>
                                        </div>
                                        <h3 className="text-2xl font-header font-black text-white">TEAM A</h3>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Total Power</div>
                                        <div className="text-xl font-mono text-white">{getTotalPower([...data.teamAMain, ...data.teamASubs])}</div>
                                    </div>
                                </div>
                                <PlayerList players={data.teamAMain} title="Main Force" color="border-amber-500" />
                                <PlayerList players={data.teamASubs} title="Reserves" color="border-amber-900" />
                            </div>

                            {/* Team B */}
                            <div className="pl-4">
                                <div className="flex justify-between items-end mb-6 border-b-4 border-sky-500 pb-2">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sky-500">☾</span>
                                            <span className="text-[10px] text-slate-400 uppercase tracking-widest">23:00 GMT+3</span>
                                        </div>
                                        <h3 className="text-2xl font-header font-black text-white">TEAM B</h3>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-sky-500 font-bold uppercase tracking-widest">Total Power</div>
                                        <div className="text-xl font-mono text-white">{getTotalPower([...data.teamBMain, ...data.teamBSubs])}</div>
                                    </div>
                                </div>
                                <PlayerList players={data.teamBMain} title="Main Force" color="border-sky-500" />
                                <PlayerList players={data.teamBSubs} title="Reserves" color="border-sky-900" />
                            </div>
                        </div>
                        
                        <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                            <span>ASN1 Alliance Command</span>
                            <span>Generated: {new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Registration Modal */}
            {showRegister && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#0f172a] w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-6 relative">
                        <button onClick={() => setShowRegister(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">✕</button>
                        
                        <h3 className="text-lg font-header font-bold text-white mb-6 uppercase tracking-widest">Mission Registration</h3>
                        
                        <div className="space-y-6">
                            {/* Player Search */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Operative Name</label>
                                <input 
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-sky-500 outline-none"
                                    value={regName}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Search your profile..."
                                />
                                {selectedPlayer ? (
                                    <div className="mt-2 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 px-3 py-2 rounded">
                                        <span className="text-emerald-400 font-bold">{selectedPlayer.name}</span>
                                        <span className="text-xs text-white">{(selectedPlayer.firstSquadPower/1000000).toFixed(1)}M</span>
                                    </div>
                                ) : searchCandidates.length > 0 ? (
                                    <div className="mt-2 bg-slate-800 rounded border border-slate-700 max-h-40 overflow-y-auto">
                                        {searchCandidates.map(p => (
                                            <div key={p.id} onClick={() => { setSelectedPlayer(p); setRegName(p.name); setSearchCandidates([]); }} className="px-3 py-2 hover:bg-slate-700 cursor-pointer flex justify-between">
                                                <span className="text-white text-xs font-bold">{p.name}</span>
                                                <span className="text-slate-400 text-xs">{(p.firstSquadPower/1000000).toFixed(1)}M</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : regName.length > 2 && (
                                    <div className="mt-4 p-4 border border-dashed border-slate-700 rounded-lg text-center bg-slate-900/50">
                                        <p className="text-[10px] text-slate-400 mb-2 font-mono uppercase tracking-wide">Operative profile not found.</p>
                                        <button 
                                            onClick={() => { setShowRegister(false); onCreateProfile?.(); }}
                                            className="text-xs font-bold text-sky-400 hover:text-white border border-sky-500/30 hover:bg-sky-500 hover:border-sky-500 px-4 py-2 rounded transition-all uppercase tracking-wider"
                                        >
                                            + Create Profile
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Time Selection */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Time Slot Preference</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => setRegTime('14:00')} 
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${regTime === '14:00' ? 'bg-amber-500/20 border-amber-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                                    >
                                        <span className="text-xl">☀</span>
                                        <span className="text-xs font-bold">14:00 GMT+3</span>
                                    </button>
                                    <button 
                                        onClick={() => setRegTime('23:00')} 
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-all ${regTime === '23:00' ? 'bg-sky-500/20 border-sky-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                                    >
                                        <span className="text-xl">☾</span>
                                        <span className="text-xs font-bold">23:00 GMT+3</span>
                                    </button>
                                </div>
                            </div>

                            <button onClick={submitRegistration} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg uppercase tracking-widest text-xs">
                                Confirm Registration
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DesertStormViewer;
