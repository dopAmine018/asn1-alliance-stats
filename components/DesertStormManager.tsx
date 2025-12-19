
import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { MockApi, DesertStormApi, DesertStormRegistration } from '../services/mockBackend';
import { useToast } from './Toast';
import { useLanguage } from '../utils/i18n';

interface TeamState {
    teamAMain: string[];
    teamASubs: string[];
    teamBMain: string[];
    teamBSubs: string[];
}

const DesertStormManager: React.FC = () => {
    const { addToast } = useToast();
    const { t } = useLanguage();
    const [allPlayers, setAllPlayers] = useState<Player[]>([]);
    const [registrations, setRegistrations] = useState<DesertStormRegistration[]>([]);
    const [teams, setTeams] = useState<TeamState>({ teamAMain: [], teamASubs: [], teamBMain: [], teamBSubs: [] });
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'registered' | 'all'>('registered');
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load ALL players (activeOnly: false) to ensure we can resolve IDs for inactive players
            const playersRes = await MockApi.getPlayers({ language: 'all', search: '', sort: 'power_desc', activeOnly: false });
            setAllPlayers(playersRes.items);
            
            const [savedTeams, regs] = await Promise.all([
                DesertStormApi.getTeams(),
                DesertStormApi.getRegistrations()
            ]);

            if (savedTeams) setTeams(savedTeams);
            if (regs) setRegistrations(regs);

        } catch (e) {
            console.error(e);
            addToast('error', 'Failed to load initial data');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await DesertStormApi.saveTeams(teams);
            addToast('success', 'Tactical orders synced successfully');
        } catch (e: any) {
            addToast('error', e.message || 'Failed to save');
        }
    };

    const addToTeam = (playerId: string, listKey: keyof TeamState) => {
        // Remove from all other lists first
        const newTeams = { ...teams };
        (Object.keys(newTeams) as Array<keyof TeamState>).forEach(k => {
            newTeams[k] = newTeams[k].filter(id => id !== playerId);
        });

        // Limits
        const limit = listKey.includes('Main') ? 20 : 10;
        if (newTeams[listKey].length >= limit) {
            addToast('error', `${listKey.includes('Main') ? 'Main Squad' : 'Reserves'} Full (${limit})`);
            return;
        }

        newTeams[listKey].push(playerId);
        setTeams(newTeams);
    };

    const removeFromTeam = (playerId: string, listKey: keyof TeamState) => {
        setTeams(prev => ({
            ...prev,
            [listKey]: prev[listKey].filter(id => id !== playerId)
        }));
    };

    const handleAutoBalance = async () => {
        if (!window.confirm("Auto-Deploy Strategy:\n1. Place REGISTERED players first (by Power).\n2. Fill remaining slots with Top Active Players (Balanced).\n\nProceed?")) return;

        setLoading(true);
        
        let currentPlayers = allPlayers;
        let currentRegs = registrations;

        try {
            // 1. Ensure Players Data Exists
            if (currentPlayers.length === 0) {
                 const playersRes = await MockApi.getPlayers({ language: 'all', search: '', sort: 'power_desc', activeOnly: false });
                 currentPlayers = playersRes.items;
                 setAllPlayers(currentPlayers);
            }

            if (currentPlayers.length === 0) {
                throw new Error("No players found in database.");
            }

            // 2. Refresh Registrations
            currentRegs = await DesertStormApi.getRegistrations();
            setRegistrations(currentRegs);
        } catch(e: any) {
            console.warn("Auto-deploy data fetch failed", e);
            addToast('error', e.message || 'Data fetch failed');
            setLoading(false);
            return;
        }

        let newTeams: TeamState = { teamAMain: [], teamASubs: [], teamBMain: [], teamBSubs: [] };
        const assignedIds = new Set<string>();

        // 3. Process Registrations (Sorted by Power)
        const regPool = currentRegs.map(reg => ({
            ...reg,
            player: currentPlayers.find(p => p.id === reg.playerId)
        })).filter(item => item.player) as { id: string, preference: string, player: Player }[];

        // Sort by Power Descending
        regPool.sort((a, b) => b.player.firstSquadPower - a.player.firstSquadPower);

        regPool.forEach(item => {
            const pid = item.player.id;
            assignedIds.add(pid);
            
            if (item.preference === '14:00') {
                if (newTeams.teamAMain.length < 20) newTeams.teamAMain.push(pid);
                else if (newTeams.teamASubs.length < 10) newTeams.teamASubs.push(pid);
            } else if (item.preference === '23:00') {
                if (newTeams.teamBMain.length < 20) newTeams.teamBMain.push(pid);
                else if (newTeams.teamBSubs.length < 10) newTeams.teamBSubs.push(pid);
            } else {
                // ANY Preference: Intelligently fill gaps
                const aMainOpen = newTeams.teamAMain.length < 20;
                const bMainOpen = newTeams.teamBMain.length < 20;
                
                if (aMainOpen && bMainOpen) {
                    // Balance counts
                    if (newTeams.teamAMain.length <= newTeams.teamBMain.length) newTeams.teamAMain.push(pid);
                    else newTeams.teamBMain.push(pid);
                } else if (aMainOpen) {
                    newTeams.teamAMain.push(pid);
                } else if (bMainOpen) {
                    newTeams.teamBMain.push(pid);
                } else {
                    // Subs logic
                    if (newTeams.teamASubs.length <= newTeams.teamBSubs.length && newTeams.teamASubs.length < 10) newTeams.teamASubs.push(pid);
                    else if (newTeams.teamBSubs.length < 10) newTeams.teamBSubs.push(pid);
                    else if (newTeams.teamASubs.length < 10) newTeams.teamASubs.push(pid);
                }
            }
        });

        // 4. Backfill with Top Power Active Players (Unregistered)
        // Use currentPlayers local variable to ensure we use fresh data
        const candidates = currentPlayers
            .filter(p => p.active && !assignedIds.has(p.id))
            .sort((a, b) => b.firstSquadPower - a.firstSquadPower);
            
        let backfillCount = 0;

        candidates.forEach(p => {
            const pid = p.id;
            const aMainFull = newTeams.teamAMain.length >= 20;
            const bMainFull = newTeams.teamBMain.length >= 20;
            const aSubFull = newTeams.teamASubs.length >= 10;
            const bSubFull = newTeams.teamBSubs.length >= 10;

            // Stop if everything is full
            if (aMainFull && bMainFull && aSubFull && bSubFull) return;

            let added = false;

            if (!aMainFull && !bMainFull) {
                // Balance Main Squads
                if (newTeams.teamAMain.length <= newTeams.teamBMain.length) newTeams.teamAMain.push(pid);
                else newTeams.teamBMain.push(pid);
                added = true;
            } else if (!aMainFull) {
                newTeams.teamAMain.push(pid);
                added = true;
            } else if (!bMainFull) {
                newTeams.teamBMain.push(pid);
                added = true;
            } else if (!aSubFull && !bSubFull) {
                // Balance Subs
                if (newTeams.teamASubs.length <= newTeams.teamBSubs.length) newTeams.teamASubs.push(pid);
                else newTeams.teamBSubs.push(pid);
                added = true;
            } else if (!aSubFull) {
                newTeams.teamASubs.push(pid);
                added = true;
            } else if (!bSubFull) {
                newTeams.teamBSubs.push(pid);
                added = true;
            }
            
            if (added) {
                assignedIds.add(pid);
                backfillCount++;
            }
        });

        setTeams(newTeams);
        setLoading(false);
        addToast('success', `Deployed: ${regPool.length} Regs + ${backfillCount} Auto-Filled. CLICK SYNC TO SAVE.`);
    };

    const handleClearRegs = async () => {
        if(!window.confirm("Clear all registrations? This is for weekly reset.")) return;
        await DesertStormApi.clearRegistrations();
        setRegistrations([]);
        addToast('info', 'Registrations cleared');
    };

    // Filter Logic for Recruitment Column
    const getCandidates = () => {
        // IDs already in a team
        const inTeamIds = new Set(Object.values(teams).flat());
        
        if (viewMode === 'registered') {
            return registrations
                .filter(r => !inTeamIds.has(r.playerId))
                .map(r => {
                    const p = allPlayers.find(pl => pl.id === r.playerId);
                    return p ? { ...p, regPref: r.preference } : null;
                })
                .filter(Boolean) as (Player & { regPref: string })[];
        } else {
            return allPlayers
                .filter(p => !inTeamIds.has(p.id) && p.name.toLowerCase().includes(search.toLowerCase()))
                .map(p => {
                    // Check if registered even in 'all' view
                    const reg = registrations.find(r => r.playerId === p.id);
                    return { ...p, regPref: reg?.preference };
                });
        }
    };

    const candidates = getCandidates().sort((a,b) => b.firstSquadPower - a.firstSquadPower);

    const TeamColumn = ({ title, listKey, color, time }: { title: string, listKey: keyof TeamState, color: string, time?: string }) => {
        const ids = teams[listKey];
        const limit = listKey.includes('Main') ? 20 : 10;
        const isFull = ids.length >= limit;
        
        const totalPower = ids.reduce((sum, id) => {
            const p = allPlayers.find(pl => pl.id === id);
            return sum + (p?.firstSquadPower || 0);
        }, 0);

        return (
            <div className={`bg-[#0f172a] rounded-xl border ${color} flex flex-col h-[500px]`}>
                <div className={`p-3 border-b ${color} bg-opacity-10 bg-slate-900`}>
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white">{title}</h4>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${isFull ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            {ids.length}/{limit}
                        </span>
                    </div>
                    {time && <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1">{time}</div>}
                    <div className="text-[10px] text-emerald-500 font-mono font-bold mt-1">
                        PWR: {(totalPower/1000000000).toFixed(2)}B
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {ids.map(id => {
                        const player = allPlayers.find(p => p.id === id);
                        if (!player) return null;
                        const reg = registrations.find(r => r.playerId === id);
                        // Warning if placed in wrong time slot (Only warns if explicitly registered for other slot, ignored for backfill/ANY)
                        const wrongSlot = (time?.includes('14:00') && reg?.preference === '23:00') || (time?.includes('23:00') && reg?.preference === '14:00');

                        return (
                            <div key={id} onClick={() => removeFromTeam(id, listKey)} className={`flex justify-between items-center p-2 rounded bg-slate-900 border cursor-pointer group transition-colors ${wrongSlot ? 'border-amber-500/50' : 'border-slate-800 hover:border-rose-500'}`}>
                                <div className="truncate flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-white group-hover:text-rose-400">{player.name}</span>
                                        {wrongSlot && <span className="text-[8px] bg-amber-500 text-black px-1 rounded font-bold">!</span>}
                                        {/* Indicator for Auto-Filled/Backfilled players (No Reg) */}
                                        {!reg && <span className="text-[8px] bg-slate-700 text-slate-300 px-1 rounded font-mono">AUTO</span>}
                                    </div>
                                    <div className="text-[9px] text-slate-500 font-mono">{(player.firstSquadPower/1000000).toFixed(1)}M</div>
                                </div>
                                <span className="text-rose-500 opacity-0 group-hover:opacity-100 text-[10px]">✕</span>
                            </div>
                        );
                    })}
                    {ids.length === 0 && <div className="text-center text-[10px] text-slate-600 py-4 italic">Empty Formation</div>}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-700 gap-4">
                <div>
                    <h2 className="text-xl font-header font-bold text-white uppercase tracking-widest">Desert Storm Command</h2>
                    <div className="flex items-center gap-3 mt-1">
                        <p className="text-[10px] text-slate-400 font-mono">20 Main + 10 Subs per Team</p>
                        <span className="w-px h-3 bg-slate-700"></span>
                        <p className="text-[10px] text-emerald-500 font-mono">{registrations.length} Signed Up</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleAutoBalance} disabled={loading} className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all">
                        {loading ? 'Deploying...' : 'Auto-Deploy'}
                    </button>
                    <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">
                        Sync Orders
                    </button>
                    <button onClick={handleClearRegs} className="bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 px-3 py-2 rounded-lg text-xs font-bold uppercase border border-slate-700 transition-all">
                        Reset Regs
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[600px]">
                
                {/* Candidates Pool */}
                <div className="lg:col-span-1 bg-[#0f172a] rounded-xl border border-slate-700 flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-slate-700 bg-slate-900 space-y-2">
                        <div className="flex rounded-lg bg-slate-950 p-1">
                            <button onClick={() => setViewMode('registered')} className={`flex-1 text-[10px] font-bold uppercase py-1 rounded ${viewMode === 'registered' ? 'bg-sky-600 text-white' : 'text-slate-500'}`}>Registered</button>
                            <button onClick={() => setViewMode('all')} className={`flex-1 text-[10px] font-bold uppercase py-1 rounded ${viewMode === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>All</button>
                        </div>
                        {viewMode === 'all' && (
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white outline-none"
                            />
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {candidates.map(p => (
                            <div key={p.id} className="group relative bg-slate-900/50 border border-slate-800 p-2 rounded hover:bg-slate-800 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            {p.regPref === '14:00' && <span className="text-[10px] text-amber-500" title="14:00">☀</span>}
                                            {p.regPref === '23:00' && <span className="text-[10px] text-sky-500" title="23:00">☾</span>}
                                            <span className="text-xs font-bold text-slate-300">{p.name}</span>
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-mono text-sky-500">{(p.firstSquadPower/1000000).toFixed(1)}M</span>
                                </div>
                                {/* Hover Menu */}
                                <div className="absolute inset-0 bg-slate-900/95 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <div className="grid grid-cols-2 gap-1 w-full px-1">
                                        <button onClick={() => addToTeam(p.id, 'teamAMain')} className="text-[8px] bg-amber-600 text-white py-1 rounded hover:bg-amber-500">A-Main</button>
                                        <button onClick={() => addToTeam(p.id, 'teamBMain')} className="text-[8px] bg-sky-600 text-white py-1 rounded hover:bg-sky-500">B-Main</button>
                                        <button onClick={() => addToTeam(p.id, 'teamASubs')} className="text-[8px] bg-amber-900/50 text-amber-200 border border-amber-600 py-1 rounded hover:bg-amber-800">A-Sub</button>
                                        <button onClick={() => addToTeam(p.id, 'teamBSubs')} className="text-[8px] bg-sky-900/50 text-sky-200 border border-sky-600 py-1 rounded hover:bg-sky-800">B-Sub</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {candidates.length === 0 && <div className="text-center text-[10px] text-slate-500 pt-4">No candidates</div>}
                    </div>
                </div>

                {/* Team Columns */}
                <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-3 overflow-y-auto">
                    <TeamColumn title="Team A (Main)" listKey="teamAMain" color="border-amber-500/50" time="☀ 14:00" />
                    <TeamColumn title="Team A (Subs)" listKey="teamASubs" color="border-amber-900/30" time="Reserves" />
                    <TeamColumn title="Team B (Main)" listKey="teamBMain" color="border-sky-500/50" time="☾ 23:00" />
                    <TeamColumn title="Team B (Subs)" listKey="teamBSubs" color="border-sky-900/30" time="Reserves" />
                </div>
            </div>
        </div>
    );
};

export default DesertStormManager;
