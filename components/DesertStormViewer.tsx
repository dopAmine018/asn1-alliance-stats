
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
            setSearchCandidates(res.items.slice(0, 8)); 
        } else {
            setSearchCandidates([]);
        }
    };

    const submitRegistration = async () => {
        if (!selectedPlayer) {
            addToast('error', 'Select your operative profile.');
            return;
        }
        try {
            await DesertStormApi.register(selectedPlayer.id, regTime);
            addToast('success', `DEPLOYMENT LOGGED: ${selectedPlayer.name}`);
            setShowRegister(false);
            setRegName('');
            setSelectedPlayer(null);
        } catch (e: any) {
            addToast('error', 'Transmission failure: ' + e.message);
        }
    };

    const getTotalPower = (players: Player[]) => {
        const total = players.reduce((sum, p) => sum + (p.firstSquadPower || 0), 0);
        return (total / 1000000000).toFixed(2) + 'B';
    };

    const handleExport = async () => {
        if (!exportRef.current) return;
        try {
            addToast('info', 'Constructing Tactical Asset...');
            const canvas = await html2canvas(exportRef.current, { backgroundColor: '#020617', scale: 2 });
            canvas.toBlob((blob: any) => {
                if(blob) {
                    navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
                        .then(() => addToast('success', 'Tactical Roster Exported'))
                        .catch(() => addToast('error', 'Clipboard access denied'));
                }
            });
        } catch(e) { addToast('error', 'Export system failure'); }
    };

    const PlayerList = ({ players, title, color }: { players: Player[], title: string, color: string }) => (
        <div className={`flex flex-col gap-1.5 mb-6`}>
            <div className={`text-[10px] font-black uppercase tracking-[0.25em] mb-2.5 pb-2 border-b-2 ${color} text-slate-500 flex justify-between`}>
                <span>{title}</span>
                <span>{players.length} Operatives</span>
            </div>
            {players.length > 0 ? players.map((p, i) => (
                <div key={p.id} className="flex justify-between items-center text-xs py-2 px-3 rounded-xl bg-slate-900/40 border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-center gap-3">
                        <span className="text-[9px] font-mono text-slate-700 w-5 font-black">{i + 1}</span>
                        <span className="text-slate-200 font-black tracking-wide">{p.name}</span>
                    </div>
                    <span className="font-mono font-bold text-sky-500">{(p.firstSquadPower/1000000).toFixed(1)}M</span>
                </div>
            )) : <div className="text-[10px] text-slate-700 font-mono italic py-4 text-center border border-dashed border-white/5 rounded-xl">PENDING DEPLOYMENT</div>}
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 max-w-7xl mx-auto px-4 sm:px-0 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-12 border-b border-white/10 pb-8 gap-6">
                <div className="flex items-center gap-6 w-full sm:w-auto">
                    <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-900/50 border border-white/5 hover:border-sky-500 hover:text-sky-500 transition-all click-scale shadow-2xl">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                        <h2 className="text-2xl sm:text-4xl font-header font-black text-white uppercase tracking-tighter leading-none mb-1">Desert Storm</h2>
                        <p className="text-[10px] text-slate-500 font-mono tracking-[0.4em] uppercase font-black">Strategic Operations Roster</p>
                    </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    {allowRegistration && (
                        <button onClick={() => setShowRegister(true)} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-3 animate-pulse shadow-2xl shadow-emerald-900/40 transition-all click-scale">
                             Apply for Duty
                        </button>
                    )}
                    <button onClick={handleExport} className="flex-1 sm:flex-none bg-slate-900/50 hover:bg-slate-800 text-sky-400 border border-white/5 px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-3 transition-all click-scale shadow-2xl">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Export
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="h-96 flex flex-col items-center justify-center gap-6 text-sky-500">
                    <div className="w-16 h-16 border-4 border-sky-500/10 border-t-sky-500 rounded-full animate-spin shadow-2xl"></div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.5em] animate-pulse font-black">Syncing War Room Assets...</p>
                </div>
            ) : (
                <div className="overflow-x-auto pb-12 custom-scrollbar">
                    <div ref={exportRef} className="bg-[#020617] p-12 min-w-[950px] border border-white/5 rounded-[3rem] relative shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
                        {/* Thematic Background elements */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] pointer-events-none"></div>
                        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-10 pointer-events-none"></div>

                        <div className="grid grid-cols-2 gap-20 relative z-10">
                            {/* Team A */}
                            <div className="border-r border-white/5 pr-20">
                                <div className="flex justify-between items-end mb-10 border-b-8 border-amber-500/80 pb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-amber-500 text-2xl drop-shadow-[0_0_10px_#f59e0b]">☀</span>
                                            <span className="text-[11px] text-slate-500 font-black uppercase tracking-[0.3em]">14:00 GMT+3</span>
                                        </div>
                                        <h3 className="text-5xl font-header font-black text-white italic tracking-tighter uppercase leading-none">Force ALPHA</h3>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-amber-500 font-black uppercase tracking-widest opacity-60 mb-1">Combat Power</div>
                                        <div className="text-3xl font-mono font-black text-white">{getTotalPower([...data.teamAMain, ...data.teamASubs])}</div>
                                    </div>
                                </div>
                                <PlayerList players={data.teamAMain} title="Strike Force" color="border-amber-500/20" />
                                <PlayerList players={data.teamASubs} title="Auxiliary" color="border-amber-900/10" />
                            </div>

                            {/* Team B */}
                            <div className="pl-4">
                                <div className="flex justify-between items-end mb-10 border-b-8 border-sky-500/80 pb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-sky-500 text-2xl drop-shadow-[0_0_10px_#0ea5e9]">☾</span>
                                            <span className="text-[11px] text-slate-500 font-black uppercase tracking-[0.3em]">23:00 GMT+3</span>
                                        </div>
                                        <h3 className="text-5xl font-header font-black text-white italic tracking-tighter uppercase leading-none">Force BRAVO</h3>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-sky-500 font-black uppercase tracking-widest opacity-60 mb-1">Combat Power</div>
                                        <div className="text-3xl font-mono font-black text-white">{getTotalPower([...data.teamBMain, ...data.teamBSubs])}</div>
                                    </div>
                                </div>
                                <PlayerList players={data.teamBMain} title="Strike Force" color="border-sky-500/20" />
                                <PlayerList players={data.teamBSubs} title="Auxiliary" color="border-sky-900/10" />
                            </div>
                        </div>
                        
                        <div className="mt-16 pt-10 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-600 font-mono uppercase tracking-[0.5em] font-black">
                            <div className="flex items-center gap-4">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
                                <span>ASN1 STRATEGIC COMMAND HUB</span>
                            </div>
                            <div className="text-slate-800">
                                RELID: {Math.random().toString(36).substring(2, 10).toUpperCase()} // {new Date().toLocaleDateString('en-GB').toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Registration Modal - Fully Re-engineered */}
            {showRegister && (
                <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex items-center justify-center sm:p-4 animate-in fade-in duration-500">
                    <div className="bg-[#0a0f1e] w-full h-full sm:h-auto sm:max-w-lg sm:rounded-[3rem] border-x sm:border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.9)] flex flex-col relative overflow-hidden animate-in zoom-in-95 duration-500">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500"></div>
                        
                        {/* Modal Header */}
                        <div className="p-10 border-b border-white/5 flex justify-between items-center bg-slate-950/30">
                            <div>
                                <h3 className="text-2xl font-header font-black text-white uppercase tracking-[0.2em] leading-none mb-1">Apply for Duty</h3>
                                <p className="text-[10px] text-emerald-500 font-mono uppercase font-black tracking-widest">Operation: Desert Storm</p>
                            </div>
                            <button onClick={() => setShowRegister(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-slate-500 hover:text-white transition-all click-scale">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        <div className="p-10 overflow-y-auto space-y-10 flex-1 custom-scrollbar">
                            {/* Operative Search */}
                            <div className="space-y-4">
                                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-[0.3em] pl-1">Target Profile Identification</label>
                                <div className="relative group">
                                    <input 
                                        className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-5 text-white focus:border-sky-500/50 outline-none transition-all placeholder-slate-800 shadow-inner font-bold"
                                        value={regName}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        placeholder="INPUT CODENAME..."
                                        autoComplete="off"
                                    />
                                    <div className="absolute right-6 top-5 text-slate-800 group-focus-within:text-sky-500 transition-colors">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                </div>

                                {selectedPlayer ? (
                                    <div className="flex items-center justify-between bg-sky-500/10 border border-sky-500/20 p-6 rounded-3xl animate-in zoom-in-95 duration-300 ring-1 ring-sky-500/30">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-sky-600 flex items-center justify-center text-white font-black text-xl shadow-xl">{selectedPlayer.name[0]}</div>
                                            <div>
                                                <div className="text-lg font-black text-white uppercase tracking-tighter leading-none mb-1">{selectedPlayer.name}</div>
                                                <div className="text-[10px] text-sky-400 font-mono font-black uppercase tracking-widest">Combat Val: {(selectedPlayer.firstSquadPower/1000000).toFixed(1)}M</div>
                                            </div>
                                        </div>
                                        <button onClick={() => setSelectedPlayer(null)} className="text-[10px] font-black text-slate-500 uppercase hover:text-white tracking-widest transition-colors border border-white/5 px-4 py-2 rounded-xl">Clear</button>
                                    </div>
                                ) : searchCandidates.length > 0 ? (
                                    <div className="bg-slate-950 rounded-3xl border border-white/5 divide-y divide-white/5 max-h-[300px] overflow-y-auto custom-scrollbar shadow-2xl">
                                        {searchCandidates.map(p => (
                                            <button 
                                                key={p.id} 
                                                onClick={() => { setSelectedPlayer(p); setRegName(p.name); setSearchCandidates([]); }} 
                                                className="w-full px-8 py-5 hover:bg-sky-500/10 flex justify-between items-center group transition-all duration-300"
                                            >
                                                <span className="text-slate-400 font-black group-hover:text-white text-sm tracking-wide uppercase">{p.name}</span>
                                                <div className="text-right">
                                                    <div className="text-xs text-sky-500 font-mono font-black">{(p.firstSquadPower/1000000).toFixed(1)}M</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : regName.length >= 3 && (
                                    <div className="p-10 border-2 border-dashed border-white/5 rounded-[2rem] text-center bg-white/[0.02]">
                                        <p className="text-xs text-slate-600 mb-6 font-mono uppercase tracking-[0.2em] italic font-black">No matching records found in active database.</p>
                                        <button 
                                            onClick={() => { setShowRegister(false); onCreateProfile?.(); }}
                                            className="w-full py-4 rounded-2xl border border-sky-500/30 text-sky-400 font-black text-[11px] uppercase tracking-[0.3em] hover:bg-sky-500 hover:text-white transition-all shadow-xl"
                                        >
                                            Create Dossier First
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Deployment Preference */}
                            <div className="space-y-6">
                                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-[0.3em] pl-1">Temporal Alignment</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { id: '14:00', label: '14:00', icon: '☀', color: 'amber' },
                                        { id: '23:00', label: '23:00', icon: '☾', color: 'sky' },
                                        { id: 'ANY', label: 'ANY', icon: '◈', color: 'emerald' }
                                    ].map(slot => (
                                        <button 
                                            key={slot.id}
                                            onClick={() => setRegTime(slot.id as any)} 
                                            className={`
                                                relative flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all duration-500
                                                ${regTime === slot.id 
                                                    ? `bg-${slot.color}-500/10 border-${slot.color}-500 text-white scale-105 shadow-[0_0_30px_rgba(0,0,0,0.5)] ring-2 ring-white/10` 
                                                    : 'bg-slate-950 border-white/5 text-slate-700 opacity-40 hover:opacity-100'
                                                }
                                            `}
                                        >
                                            <span className={`text-3xl mb-2 ${regTime === slot.id ? `drop-shadow-[0_0_8px_currentColor]` : ''}`}>{slot.icon}</span>
                                            <span className="text-[11px] font-black uppercase tracking-tighter">{slot.label}</span>
                                            {regTime === slot.id && (
                                                <div className={`absolute top-3 right-3 w-2 h-2 rounded-full bg-${slot.color}-500 animate-ping`}></div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-700 font-mono uppercase text-center tracking-[0.15em] leading-relaxed px-4">'ANY' grants Command full tactical discretion to balance force magnitude.</p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-10 bg-slate-950/50 border-t border-white/5 backdrop-blur-2xl">
                            <button 
                                onClick={submitRegistration} 
                                disabled={!selectedPlayer}
                                className={`
                                    w-full py-6 rounded-[2rem] font-header font-black uppercase tracking-[0.4em] text-sm transition-all duration-700 shadow-2xl click-scale
                                    ${selectedPlayer 
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/30' 
                                        : 'bg-slate-900 text-slate-800 cursor-not-allowed border border-white/5'
                                    }
                                `}
                            >
                                Transmit Deployment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DesertStormViewer;
