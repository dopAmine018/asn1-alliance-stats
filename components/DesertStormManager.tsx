
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

    const getLocalTime = (gmt3Hour: number) => {
        const date = new Date();
        date.setUTCHours(gmt3Hour - 3, 0, 0, 0);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
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
        const newTeams = { ...teams };
        (Object.keys(newTeams) as Array<keyof TeamState>).forEach(k => {
            newTeams[k] = newTeams[k].filter(id => id !== playerId);
        });

        const limit = listKey.includes('Main') ? 20 : 10;
        if (newTeams[listKey].length >= limit) {
            addToast('error', `Squad Full (${limit})`);
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
            if (currentPlayers.length === 0) {
                 const playersRes = await MockApi.getPlayers({ language: 'all', search: '', sort: 'power_desc', activeOnly: false });
                 currentPlayers = playersRes.items;
                 setAllPlayers(currentPlayers);
            }

            if (currentPlayers.length === 0) {
                throw new Error("No players found in database.");
            }

            currentRegs = await DesertStormApi.getRegistrations();
            setRegistrations(currentRegs);
        } catch(e: any) {
            addToast('error', e.message || 'Data fetch failed');
            setLoading(false);
            return;
        }

        let newTeams: TeamState = { teamAMain: [], teamASubs: [], teamBMain: [], teamBSubs: [] };
        const assignedIds = new Set<string>();

        const regPool = currentRegs.map(reg => ({
            ...reg,
            player: currentPlayers.find(p => p.id === reg.playerId)
        })).filter(item => item.player) as { id: string, preference: string, player: Player }[];

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
                const aMainOpen = newTeams.teamAMain.length < 20;
                const bMainOpen = newTeams.teamBMain.length < 20;
                if (aMainOpen && bMainOpen) {
                    if (newTeams.teamAMain.length <= newTeams.teamBMain.length) newTeams.teamAMain.push(pid);
                    else newTeams.teamBMain.push(pid);
                } else if (aMainOpen) newTeams.teamAMain.push(pid);
                else if (bMainOpen) newTeams.teamBMain.push(pid);
                else {
                    if (newTeams.teamASubs.length <= newTeams.teamBSubs.length && newTeams.teamASubs.length < 10) newTeams.teamASubs.push(pid);
                    else if (newTeams.teamBSubs.length < 10) newTeams.teamBSubs.push(pid);
                    else if (newTeams.teamASubs.length < 10) newTeams.teamASubs.push(pid);
                }
            }
        });

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

            if (aMainFull && bMainFull && aSubFull && bSubFull) return;

            let added = false;
            if (!aMainFull && !bMainFull) {
                if (newTeams.teamAMain.length <= newTeams.teamBMain.length) newTeams.teamAMain.push(pid);
                else newTeams.teamBMain.push(pid);
                added = true;
            } else if (!aMainFull) { newTeams.teamAMain.push(pid); added = true; }
            else if (!bMainFull) { newTeams.teamBMain.push(pid); added = true; }
            else if (!aSubFull && !bSubFull) {
                if (newTeams.teamASubs.length <= newTeams.teamBSubs.length) newTeams.teamASubs.push(pid);
                else newTeams.teamBSubs.push(pid);
                added = true;
            } else if (!aSubFull) { newTeams.teamASubs.push(pid); added = true; }
            else if (!bSubFull) { newTeams.teamBSubs.push(pid); added = true; }
            
            if (added) { assignedIds.add(pid); backfillCount++; }
        });

        setTeams(newTeams);
        setLoading(false);
        addToast('success', `Deployed: ${regPool.length} Regs + ${backfillCount} Auto-Filled.`);
    };

    const handleClearRegs = async () => {
        if(!window.confirm("Clear all registrations?")) return;
        await DesertStormApi.clearRegistrations();
        setRegistrations([]);
        addToast('info', 'Registrations cleared');
    };

    const getCandidates = () => {
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
                    const reg = registrations.find(r => r.playerId === p.id);
                    return { ...p, regPref: reg?.preference };
                });
        }
    };

    const candidates = getCandidates().sort((a,b) => b.firstSquadPower - a.firstSquadPower);

    const TeamColumn = ({ title, listKey, color, gmt3Hour }: { title: string, listKey: keyof TeamState, color: string, gmt3Hour?: number }) => {
        const ids = teams[listKey];
        const limit = listKey.includes('Main') ? 20 : 10;
        const isFull = ids.length >= limit;
        const localTime = gmt3Hour ? getLocalTime(gmt3Hour) : null;
        
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
                    {localTime && <div className="text-[9px] text-slate-400 font-mono">LOCAL: {localTime}</div>}
                    <div className="text-[10px] text-emerald-500 font-mono font-bold mt-1">
                        PWR: {(totalPower/1000000000).toFixed(2)}B
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {ids.map(id => {
                        const player = allPlayers.find(p => p.id === id);
                        if (!player) return null;
                        return (
                            <div key={id} onClick={() => removeFromTeam(id, listKey)} className="flex justify-between items-center p-2 rounded bg-slate-900 border border-slate-800 cursor-pointer hover:border-rose-500 group">
                                <div className="truncate flex-1">
                                    <span className="text-xs font-bold text-white group-hover:text-rose-400">{player.name}</span>
                                    <div className="text-[9px] text-slate-500 font-mono">{(player.firstSquadPower/1000000).toFixed(1)}M</div>
                                </div>
                                <span className="text-rose-500 opacity-0 group-hover:opacity-100 text-[10px]">✕</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-700 gap-4">
                <h2 className="text-xl font-header font-bold text-white uppercase tracking-widest">Desert Storm Command</h2>
                <div className="flex gap-2">
                    <button onClick={handleAutoBalance} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest">Auto-Deploy</button>
                    <button onClick={handleSave} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest">Sync Orders</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-[600px]">
                <div className="lg:col-span-1 bg-[#0f172a] rounded-xl border border-slate-700 flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-slate-700 bg-slate-900 space-y-2">
                        <div className="flex rounded-lg bg-slate-950 p-1">
                            <button onClick={() => setViewMode('registered')} className={`flex-1 text-[10px] font-bold uppercase py-1 rounded ${viewMode === 'registered' ? 'bg-sky-600 text-white' : 'text-slate-500'}`}>Regs</button>
                            <button onClick={() => setViewMode('all')} className={`flex-1 text-[10px] font-bold uppercase py-1 rounded ${viewMode === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}>All</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {candidates.map(p => (
                            <div key={p.id} className="group relative bg-slate-900/50 border border-slate-800 p-2 rounded hover:bg-slate-800">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-300">{p.name}</span>
                                    <span className="text-[9px] font-mono text-sky-500">{(p.firstSquadPower/1000000).toFixed(1)}M</span>
                                </div>
                                <div className="absolute inset-0 bg-slate-900/95 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 z-10 p-1">
                                    <button onClick={() => addToTeam(p.id, 'teamAMain')} className="text-[8px] bg-amber-600 text-white p-1 rounded flex-1">A-Main</button>
                                    <button onClick={() => addToTeam(p.id, 'teamBMain')} className="text-[8px] bg-sky-600 text-white p-1 rounded flex-1">B-Main</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-3 overflow-y-auto">
                    <TeamColumn title="TEAM A (Main)" listKey="teamAMain" color="border-amber-500/50" gmt3Hour={14} />
                    <TeamColumn title="TEAM A (Subs)" listKey="teamASubs" color="border-amber-900/30" />
                    <TeamColumn title="TEAM B (Main)" listKey="teamBMain" color="border-sky-500/50" gmt3Hour={23} />
                    <TeamColumn title="TEAM B (Subs)" listKey="teamBSubs" color="border-sky-900/30" />
                </div>
            </div>
        </div>
    );
};

export default DesertStormManager;
