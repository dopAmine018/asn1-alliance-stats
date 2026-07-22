
import React, { useState, useEffect } from 'react';
/* Fix: Import DesertStormRegistration from types instead of mockBackend */
import { Player, DesertStormRegistration } from '../types';
import { MockApi, DesertStormApi } from '../services/mockBackend';
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
    const [allowRegistration, setAllowRegistration] = useState<boolean>(true);
    const [viewMode, setViewMode] = useState<'registered' | 'all'>('all');
    const [search, setSearch] = useState('');
    
    // UI state for moving players
    const [activeMoveMenu, setActiveMoveMenu] = useState<{ id: string, from: keyof TeamState } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const playersRes = await MockApi.getPlayers({ language: 'all', search: '', sort: 'power_desc', activeOnly: false });
            setAllPlayers(playersRes.items);
            
            const [savedTeams, regs, settings] = await Promise.all([
                DesertStormApi.getTeams(),
                DesertStormApi.getRegistrations(),
                MockApi.getSettings()
            ]);

            if (savedTeams) setTeams(savedTeams);
            if (regs) setRegistrations(regs);
            if (settings && typeof settings.allow_storm_registration === 'boolean') {
                setAllowRegistration(settings.allow_storm_registration);
            }

        } catch (e) {
            console.error(e);
            addToast('error', 'Failed to load initial data');
        } finally {
            setLoading(false);
        }
    };

    const toggleRegistration = async () => {
        const nextState = !allowRegistration;
        try {
            await MockApi.updateSetting('allow_storm_registration', nextState);
            setAllowRegistration(nextState);
            addToast('success', nextState ? 'Registration OPENED' : 'Registration CLOSED');
        } catch (e) {
            addToast('error', 'Failed to update registration status');
        }
    };

    const getLocalTime = (gmt3Hour: number) => {
        const date = new Date();
        date.setUTCHours(gmt3Hour - 3, 0, 0, 0);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const handleSave = async () => {
        try {
            await DesertStormApi.saveTeams(teams);
            addToast('success', 'Tactical orders synced');
        } catch (e: any) {
            addToast('error', 'Sync failed');
        }
    };

    const addToTeam = (playerId: string, listKey: keyof TeamState) => {
        const newTeams = { ...teams };
        
        // Remove from everywhere first to prevent duplicates
        (Object.keys(newTeams) as Array<keyof TeamState>).forEach(k => {
            newTeams[k] = newTeams[k].filter(id => id !== playerId);
        });

        let finalKey = listKey;

        // TACTICAL OVERFLOW LOGIC:
        // If user targets A-Main and it's full, redirect to A-Subs.
        // If user targets B-Main and it's full, redirect to B-Subs.
        if (listKey === 'teamAMain' && newTeams.teamAMain.length >= 20) {
            finalKey = 'teamASubs';
            addToast('info', 'Main Team A Full - Assigned to Reserves');
        } else if (listKey === 'teamBMain' && newTeams.teamBMain.length >= 20) {
            finalKey = 'teamBSubs';
            addToast('info', 'Main Team B Full - Assigned to Reserves');
        }

        const limit = finalKey.includes('Main') ? 20 : 10;
        if (newTeams[finalKey].length >= limit) {
            addToast('error', 'All Tactical Slots Full for this Group');
            return;
        }

        newTeams[finalKey].push(playerId);
        setTeams(newTeams);
        setActiveMoveMenu(null);
    };

    const removeFromTeam = (playerId: string, listKey: keyof TeamState) => {
        setTeams(prev => ({
            ...prev,
            [listKey]: prev[listKey].filter(id => id !== playerId)
        }));
        setActiveMoveMenu(null);
    };

    // Standard Auto-Balance logic based on preferences and squad power
    const handleAutoBalance = async () => {
        if (!window.confirm("AUTO-BALANCE ROSTERS:\n1. Fill Team A and B based on player registrations & preferences.\n2. Fill remaining slots with top squad power.\n\nExecute?")) return;

        setLoading(true);
        let newTeams: TeamState = { teamAMain: [], teamASubs: [], teamBMain: [], teamBSubs: [] };
        const assignedIds = new Set<string>();

        // 1. Handle registrations (respecting preference)
        const regs = registrations
            .map(r => ({ ...r, player: allPlayers.find(p => p.id === r.playerId) }))
            .filter(r => r.player && r.player.active)
            .sort((a,b) => (b.player?.firstSquadPower || 0) - (a.player?.firstSquadPower || 0));

        regs.forEach(r => {
            const pid = r.playerId;
            if (r.preference === '14:00') {
                if (newTeams.teamAMain.length < 20) newTeams.teamAMain.push(pid);
                else if (newTeams.teamASubs.length < 10) newTeams.teamASubs.push(pid);
            } else if (r.preference === '23:00') {
                if (newTeams.teamBMain.length < 20) newTeams.teamBMain.push(pid);
                else if (newTeams.teamBSubs.length < 10) newTeams.teamBSubs.push(pid);
            } else {
                // ANY preference - balance into whichever main team has fewer members
                if (newTeams.teamAMain.length <= newTeams.teamBMain.length && newTeams.teamAMain.length < 20) {
                    newTeams.teamAMain.push(pid);
                } else if (newTeams.teamBMain.length < 20) {
                    newTeams.teamBMain.push(pid);
                } else if (newTeams.teamASubs.length <= newTeams.teamBSubs.length && newTeams.teamASubs.length < 10) {
                    newTeams.teamASubs.push(pid);
                } else if (newTeams.teamBSubs.length < 10) {
                    newTeams.teamBSubs.push(pid);
                }
            }
            assignedIds.add(pid);
        });

        // 2. Fill remaining gaps with Top Power
        const topPower = allPlayers.filter(p => p.active && !assignedIds.has(p.id)).sort((a,b) => b.firstSquadPower - a.firstSquadPower);
        topPower.forEach(p => {
            if (newTeams.teamAMain.length <= newTeams.teamBMain.length && newTeams.teamAMain.length < 20) {
                newTeams.teamAMain.push(p.id);
            } else if (newTeams.teamBMain.length < 20) {
                newTeams.teamBMain.push(p.id);
            } else if (newTeams.teamASubs.length <= newTeams.teamBSubs.length && newTeams.teamASubs.length < 10) {
                newTeams.teamASubs.push(p.id);
            } else if (newTeams.teamBSubs.length < 10) {
                newTeams.teamBSubs.push(p.id);
            }
        });

        setTeams(newTeams);
        setLoading(false);
        addToast('success', 'Rosters auto-balanced by preferences and power.');
    };

    const getCandidates = () => {
        const inTeamIds = new Set(Object.values(teams).flat());
        return allPlayers
            .filter(p => !inTeamIds.has(p.id) && p.name.toLowerCase().includes(search.toLowerCase()))
            .map(p => {
                const reg = registrations.find(r => r.playerId === p.id);
                return { ...p, regPref: reg?.preference };
            });
    };

    const candidates = getCandidates().sort((a,b) => b.firstSquadPower - a.firstSquadPower);

    const TeamColumn = ({ title, listKey, color, gmt3Hour }: { title: string, listKey: keyof TeamState, color: string, gmt3Hour?: number }) => {
        const ids = teams[listKey];
        const limit = listKey.includes('Main') ? 20 : 10;
        const isFull = ids.length >= limit;
        
        const totalPower = ids.reduce((sum, id) => {
            const p = allPlayers.find(pl => pl.id === id);
            return sum + (p?.firstSquadPower || 0);
        }, 0);

        return (
            <div className={`bg-[#0f172a] rounded-xl border ${color} flex flex-col h-[520px] relative`}>
                <div className={`p-3 border-b ${color} bg-opacity-10 bg-slate-900`}>
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white">{title}</h4>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${isFull ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            {ids.length}/{limit}
                        </span>
                    </div>
                    <div className="text-[10px] text-emerald-500 font-mono font-bold">
                        {(totalPower/1000000000).toFixed(2)}B
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {ids.map(id => {
                        const player = allPlayers.find(p => p.id === id);
                        if (!player) return null;
                        const isMenuOpen = activeMoveMenu?.id === id;

                        return (
                            <div key={id} className="relative">
                                <div 
                                    onClick={() => setActiveMoveMenu(isMenuOpen ? null : { id, from: listKey })}
                                    className={`flex justify-between items-center p-2 rounded bg-slate-900 border transition-all cursor-pointer ${isMenuOpen ? 'border-sky-500 ring-1 ring-sky-500/50' : 'border-slate-800 hover:border-slate-600'}`}
                                >
                                    <div className="truncate flex-1">
                                        <span className="text-xs font-bold text-white">{player.name}</span>
                                        <div className="text-[8px] text-slate-500 font-mono">{(player.firstSquadPower/1000000).toFixed(1)}M</div>
                                    </div>
                                </div>
                                
                                {isMenuOpen && (
                                    <div className="absolute top-0 left-0 w-full h-full bg-[#0a0f1e]/95 backdrop-blur-sm z-20 flex items-center justify-center gap-1 p-1 rounded">
                                        <button onClick={() => addToTeam(id, 'teamAMain')} className="text-[7px] bg-amber-600 text-white p-1 rounded flex-1 h-full uppercase font-bold">A-M</button>
                                        <button onClick={() => addToTeam(id, 'teamBMain')} className="text-[7px] bg-sky-600 text-white p-1 rounded flex-1 h-full uppercase font-bold">B-M</button>
                                        <button onClick={() => removeFromTeam(id, listKey)} className="text-[7px] bg-rose-600 text-white p-1 rounded flex-1 h-full uppercase font-bold">OUT</button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Command Header */}
            <div className="flex flex-col md:flex-row items-center justify-between bg-slate-900/50 p-6 rounded-2xl border border-slate-700 gap-6">
                <div>
                    <h2 className="text-2xl font-header font-black text-white uppercase tracking-[0.2em]">Storm Command</h2>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">OPERATIONAL TACTICS & TEAM MANAGEMENT</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center items-center">
                    <button 
                        onClick={toggleRegistration} 
                        className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${
                            allowRegistration 
                            ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-600/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                            : 'bg-rose-600/20 border-rose-500/50 text-rose-400 hover:bg-rose-600/30'
                        }`}
                        title="Toggle registration availability on main menu"
                    >
                        <span className={`w-2 h-2 rounded-full ${allowRegistration ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                        Registration: {allowRegistration ? 'OPEN' : 'CLOSED'}
                    </button>
                    <button onClick={handleAutoBalance} className="bg-sky-600 hover:bg-sky-500 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-sky-900/20 transition-all border border-sky-400/20">
                         Auto-Balance Roster
                    </button>
                    <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all border border-emerald-400/20">
                        Sync Global
                    </button>
                    <button onClick={() => { if(window.confirm("Clear current rosters?")) setTeams({ teamAMain:[], teamASubs:[], teamBMain:[], teamBSubs:[] }) }} className="text-[10px] font-black text-slate-500 hover:text-rose-500 uppercase px-4">Wipe</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Global Candidate Queue */}
                <div className="lg:col-span-3 bg-[#0f172a] rounded-2xl border border-slate-700 flex flex-col h-[600px] overflow-hidden">
                    <div className="p-4 border-b border-slate-800 bg-slate-900/50 space-y-4">
                        <h3 className="text-xs font-black text-sky-500 uppercase tracking-widest">Database Injector</h3>
                        <input 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-sky-500 outline-none transition-all placeholder-slate-700"
                            placeholder="Find commander..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                        {candidates.length > 0 ? candidates.map(p => (
                            <div key={p.id} className="group relative bg-slate-900/30 border border-white/5 p-3 rounded-xl hover:bg-slate-800/50 transition-all">
                                <div className="flex justify-between items-center">
                                    <div className="min-w-0">
                                        <span className="text-xs font-black text-slate-200 block truncate">{p.name}</span>
                                        <span className="text-[9px] font-mono text-slate-500">{(p.firstSquadPower/1000000).toFixed(1)}M</span>
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-slate-900/95 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 z-10 p-2 rounded-xl transition-opacity">
                                    <button onClick={() => addToTeam(p.id, 'teamAMain')} className="text-[8px] bg-amber-600 text-white p-2 rounded-lg flex-1 font-black uppercase">A-Main</button>
                                    <button onClick={() => addToTeam(p.id, 'teamBMain')} className="text-[8px] bg-sky-600 text-white p-2 rounded-lg flex-1 font-black uppercase">B-Main</button>
                                </div>
                            </div>
                        )) : <div className="text-center py-10 text-[10px] text-slate-600 font-mono">NO TARGETS FOUND</div>}
                    </div>
                </div>

                {/* Team Grid */}
                <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 overflow-y-auto">
                    <TeamColumn title="TEAM A (14:00) MAIN" listKey="teamAMain" color="border-amber-500/40" gmt3Hour={14} />
                    <TeamColumn title="TEAM A (14:00) SUBS" listKey="teamASubs" color="border-amber-900/20" />
                    <TeamColumn title="TEAM B (23:00) MAIN" listKey="teamBMain" color="border-sky-500/40" gmt3Hour={23} />
                    <TeamColumn title="TEAM B (23:00) SUBS" listKey="teamBSubs" color="border-sky-900/20" />
                </div>
            </div>
        </div>
    );
};

export default DesertStormManager;
