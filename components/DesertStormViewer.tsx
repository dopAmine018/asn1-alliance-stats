
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
    
    // Registration State
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
            setSearchCandidates(res.items.slice(0, 8)); // More candidates for easier mobile selection
        } else {
            setSearchCandidates([]);
        }
    };

    const submitRegistration = async () => {
        if (!selectedPlayer) {
            addToast('error', 'Please select your operative profile');
            return;
        }
        try {
            await DesertStormApi.register(selectedPlayer.id, regTime);
            addToast('success', `Applied: ${selectedPlayer.name} [${regTime}]`);
            setShowRegister(false);
            setRegName('');
            setSelectedPlayer(null);
        } catch (e: any) {
            addToast('error', 'Transmission Failed: ' + e.message);
        }
    };

    const getTotalPower = (players: Player[]) => {
        const total = players.reduce((sum, p) => sum + (p.firstSquadPower || 0), 0);
        return (total / 1000000000).toFixed(2) + 'B';
    };

    const handleExport = async () => {
        if (!exportRef.current) return;
        try {
            addToast('info', 'Generating Intel Asset...');
            const canvas = await html2canvas(exportRef.current, { backgroundColor: '#020617', scale: 2 });
            canvas.toBlob((blob: any) => {
                if(blob) {
                    navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
                        .then(() => addToast('success', 'Orders copied to clipboard'))
                        .catch(() => addToast('error', 'Clipboard permission denied'));
                }
            });
        } catch(e) { addToast('error', 'Export system failure'); }
    };

    const PlayerList = ({ players, title, color }: { players: Player[], title: string, color: string }) => (
        <div className={`flex flex-col gap-1 mb-4`}>
            <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 pb-1 border-b ${color} text-slate-400 flex justify-between`}>
                <span>{title}</span>
                <span>{players.length} Unit(s)</span>
            </div>
            {players.length > 0 ? players.map((p, i) => (
                <div key={p.id} className="flex justify-between items-center text-xs py-1.5 px-2 rounded bg-slate-900/50 border border-slate-800 group hover:border-slate-600 transition-colors">
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-slate-600 w-4">{i + 1}</span>
                        <span className="text-slate-200 font-bold group-hover:text-white">{p.name}</span>
                    </div>
                    <span className="font-mono text-sky-500">{(p.firstSquadPower/1000000).toFixed(1)}M</span>
                </div>
            )) : <div className="text-[10px] text-slate-600 italic py-2">DEPLOYMENT PENDING</div>}
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto px-4 sm:px-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 border-b border-white/10 pb-6 gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-700 hover:border-sky-500 hover:text-sky-500 transition-all click-scale">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-header font-black text-white uppercase tracking-[0.2em]">Desert Storm</h2>
                        <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Weekly Tactical Roster</p>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    {allowRegistration && (
                        <button onClick={() => setShowRegister(true)} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 animate-pulse-slow shadow-lg shadow-emerald-900/40 transition-all click-scale">
                             <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" /></svg>
                             Apply Now
                        </button>
                    )}
                    <button onClick={handleExport} className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all click-scale">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Save Image
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4 text-sky-500">
                    <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] animate-pulse">Decrypting War Assets...</p>
                </div>
            ) : (
                <div className="overflow-x-auto pb-8 custom-scrollbar">
                    <div ref={exportRef} className="bg-[#020617] p-8 min-w-[850px] border border-slate-800 rounded-2xl relative shadow-2xl">
                        {/* Atmospheric Elements */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none"></div>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-sky-500/40 to-transparent"></div>

                        <div className="grid grid-cols-2 gap-16 relative z-10">
                            {/* Team A */}
                            <div className="border-r border-slate-800/50 pr-16">
                                <div className="flex justify-between items-end mb-8 border-b-4 border-amber-500 pb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-amber-500 text-lg">☀</span>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">14:00 GMT+3</span>
                                        </div>
                                        <h3 className="text-3xl font-header font-black text-white italic tracking-tighter">TASK FORCE A</h3>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] text-amber-500 font-black uppercase tracking-widest opacity-70">Total Combat Power</div>
                                        <div className="text-2xl font-mono font-black text-white">{getTotalPower([...data.teamAMain, ...data.teamASubs])}</div>
                                    </div>
                                </div>
                                <PlayerList players={data.teamAMain} title="Primary Offensive" color="border-amber-500/30" />
                                <PlayerList players={data.teamASubs} title="Tactical Reserves" color="border-amber-900/20" />
                            </div>

                            {/* Team B */}
                            <div className="pl-4">
                                <div className="flex justify-between items-end mb-8 border-b-4 border-sky-500 pb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-sky-500 text-lg">☾</span>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">23:00 GMT+3</span>
                                        </div>
                                        <h3 className="text-3xl font-header font-black text-white italic tracking-tighter">TASK FORCE B</h3>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] text-sky-500 font-black uppercase tracking-widest opacity-70">Total Combat Power</div>
                                        <div className="text-2xl font-mono font-black text-white">{getTotalPower([...data.teamBMain, ...data.teamBSubs])}</div>
                                    </div>
                                </div>
                                <PlayerList players={data.teamBMain} title="Primary Offensive" color="border-sky-500/30" />
                                <PlayerList players={data.teamBSubs} title="Tactical Reserves" color="border-sky-900/20" />
                            </div>
                        </div>
                        
                        <div className="mt-12 pt-6 border-t border-slate-800/50 flex justify-between items-center text-[9px] text-slate-500 font-mono uppercase tracking-[0.3em]">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                <span>ASN1 Alliance Strategic Command</span>
                            </div>
                            <span>Generated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Registration Modal - Fully Mobile Optimized */}
            {showRegister && (
                <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center sm:p-4">
                    <div className="bg-[#0b1121] w-full h-full sm:h-auto sm:max-w-md sm:rounded-2xl border-x sm:border border-slate-700 shadow-2xl flex flex-col relative overflow-hidden">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/30">
                            <div>
                                <h3 className="text-lg font-header font-black text-white uppercase tracking-widest">Apply for Duty</h3>
                                <p className="text-[10px] text-emerald-500 font-mono uppercase">Desert Storm Operation</p>
                            </div>
                            <button onClick={() => setShowRegister(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto space-y-8 flex-1">
                            {/* Operative Search */}
                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Identify Operative Profile</label>
                                <div className="relative">
                                    <input 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-5 py-4 text-white focus:border-sky-500 outline-none transition-all placeholder-slate-600 shadow-inner"
                                        value={regName}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        placeholder="Type your name..."
                                        autoComplete="off"
                                    />
                                    <div className="absolute right-4 top-4 text-slate-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                </div>

                                {selectedPlayer ? (
                                    <div className="flex items-center justify-between bg-sky-500/10 border border-sky-500/30 p-4 rounded-xl animate-in zoom-in-95">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-sky-500 flex items-center justify-center text-white font-black">{selectedPlayer.name[0]}</div>
                                            <div>
                                                <div className="text-sm font-bold text-white uppercase tracking-wider">{selectedPlayer.name}</div>
                                                <div className="text-[10px] text-sky-400 font-mono">{(selectedPlayer.firstSquadPower/1000000).toFixed(1)}M Squad Power</div>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedPlayer(null)} className="text-[10px] font-bold text-slate-500 uppercase hover:text-white">Change</button>
                                    </div>
                                ) : searchCandidates.length > 0 ? (
                                    <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800 max-h-[240px] overflow-y-auto custom-scrollbar shadow-2xl">
                                        {searchCandidates.map(p => (
                                            <button 
                                                key={p.id} 
                                                onClick={() => { setSelectedPlayer(p); setRegName(p.name); setSearchCandidates([]); }} 
                                                className="w-full px-5 py-4 hover:bg-sky-500/10 flex justify-between items-center group transition-colors"
                                            >
                                                <span className="text-slate-300 font-bold group-hover:text-white text-sm">{p.name}</span>
                                                <div className="text-right">
                                                    <div className="text-xs text-sky-500 font-mono font-bold">{(p.firstSquadPower/1000000).toFixed(1)}M</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : regName.length >= 3 && (
                                    <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center bg-slate-900/20">
                                        <p className="text-xs text-slate-500 mb-4 font-mono uppercase italic">Operative dossier not found in active database.</p>
                                        <button 
                                            onClick={() => { setShowRegister(false); onCreateProfile?.(); }}
                                            className="w-full py-3 rounded-lg border border-sky-500/30 text-sky-400 font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-sky-500 hover:text-white transition-all"
                                        >
                                            Create Profile First
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Preference Selection */}
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Deployment Preference</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: '14:00', label: '14:00', icon: '☀', color: 'amber' },
                                        { id: '23:00', label: '23:00', icon: '☾', color: 'sky' },
                                        { id: 'ANY', label: 'ANY', icon: '◈', color: 'emerald' }
                                    ].map(slot => (
                                        <button 
                                            key={slot.id}
                                            onClick={() => setRegTime(slot.id as any)} 
                                            className={`
                                                relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-300
                                                ${regTime === slot.id 
                                                    ? `bg-${slot.color}-500/20 border-${slot.color}-500 text-white scale-105 shadow-lg` 
                                                    : 'bg-slate-950 border-slate-800 text-slate-500 opacity-60 hover:opacity-100'
                                                }
                                            `}
                                        >
                                            <span className="text-2xl mb-1">{slot.icon}</span>
                                            <span className="text-[10px] font-black uppercase tracking-tighter">{slot.label}</span>
                                            {regTime === slot.id && (
                                                <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-${slot.color}-500 animate-pulse`}></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[9px] text-slate-600 font-mono uppercase text-center tracking-widest">'ANY' helps command balance task forces for victory.</p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 bg-slate-900/50 border-t border-white/5">
                            <button 
                                onClick={submitRegistration} 
                                disabled={!selectedPlayer}
                                className={`
                                    w-full py-4 rounded-xl font-header font-black uppercase tracking-[0.3em] text-sm transition-all shadow-xl click-scale
                                    ${selectedPlayer 
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-900/20' 
                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                                    }
                                `}
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
