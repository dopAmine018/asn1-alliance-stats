import React, { useState, useEffect } from 'react';
import { Player, DesertStormRegistration, DesertStormWeek, PlayerRoleInWeek } from '../types';
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
    const [weeks, setWeeks] = useState<DesertStormWeek[]>([]);
    const [selectedWeekId, setSelectedWeekId] = useState<string>('');
    const [teams, setTeams] = useState<TeamState>({ teamAMain: [], teamASubs: [], teamBMain: [], teamBSubs: [] });
    const [participation, setParticipation] = useState<Record<string, PlayerRoleInWeek>>({});
    
    const [loading, setLoading] = useState(false);
    const [allowRegistration, setAllowRegistration] = useState<boolean>(true);
    const [search, setSearch] = useState('');
    
    // Start New Week modal state
    const [showStartWeekModal, setShowStartWeekModal] = useState(false);
    const [newWeekName, setNewWeekName] = useState('');

    // UI state for moving players
    const [activeMoveMenu, setActiveMoveMenu] = useState<{ id: string, from: keyof TeamState } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [playersRes, allWeeks, regs, settings] = await Promise.all([
                MockApi.getPlayers({ language: 'all', search: '', sort: 'power_desc', activeOnly: false }),
                DesertStormApi.getWeeks(),
                DesertStormApi.getRegistrations(),
                MockApi.getSettings()
            ]);

            setAllPlayers(playersRes.items);
            setWeeks(allWeeks);
            if (regs) setRegistrations(regs);

            const activeWeek = allWeeks.find(w => w.isCurrent) || allWeeks[0];
            if (activeWeek) {
                setSelectedWeekId(activeWeek.id);
                setTeams(activeWeek.teams || { teamAMain: [], teamASubs: [], teamBMain: [], teamBSubs: [] });
                setParticipation(activeWeek.participation || {});
            }

            if (settings && typeof settings.allow_storm_registration === 'boolean') {
                setAllowRegistration(settings.allow_storm_registration);
            }

        } catch (e) {
            console.error(e);
            addToast('error', 'Failed to load Desert Storm data');
        } finally {
            setLoading(false);
        }
    };

    const currentWeek = weeks.find(w => w.id === selectedWeekId) || weeks[0];

    const handleSelectWeek = (weekId: string) => {
        const target = weeks.find(w => w.id === weekId);
        if (target) {
            setSelectedWeekId(weekId);
            setTeams(target.teams || { teamAMain: [], teamASubs: [], teamBMain: [], teamBSubs: [] });
            setParticipation(target.participation || {});
            addToast('info', `Loaded ${target.name}`);
        }
    };

    const handleStartNewWeek = async () => {
        if (!newWeekName.trim()) {
            addToast('error', 'Please enter a week name');
            return;
        }

        try {
            setLoading(true);
            // Save current week state first
            if (currentWeek) {
                await DesertStormApi.saveWeek({
                    ...currentWeek,
                    teams,
                    participation
                });
            }

            // Create new week and reset registrations
            const createdWeek = await DesertStormApi.startNewWeek(newWeekName.trim());
            const updatedWeeks = await DesertStormApi.getWeeks();
            setWeeks(updatedWeeks);
            setSelectedWeekId(createdWeek.id);
            setTeams({ teamAMain: [], teamASubs: [], teamBMain: [], teamBSubs: [] });
            setParticipation({});
            setRegistrations([]);
            setShowStartWeekModal(false);
            setNewWeekName('');
            addToast('success', `${createdWeek.name} Started! Weekly Registrations Reset.`);
        } catch (e) {
            console.error(e);
            addToast('error', 'Failed to start new week');
        } finally {
            setLoading(false);
        }
    };

    const handleResetRegistrations = async () => {
        if (!window.confirm("RESET REGISTRATIONS:\nClear all active registrations for this week? Players will need to re-apply.")) return;
        try {
            await DesertStormApi.resetRegistrations();
            setRegistrations([]);
            addToast('success', 'Weekly registrations reset successfully');
        } catch (e) {
            addToast('error', 'Failed to reset registrations');
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

    const handleSave = async () => {
        try {
            if (!currentWeek) return;
            const updatedWeek: DesertStormWeek = {
                ...currentWeek,
                teams,
                participation
            };
            await DesertStormApi.saveWeek(updatedWeek);
            
            // Update local state list
            setWeeks(prev => prev.map(w => w.id === updatedWeek.id ? updatedWeek : w));
            addToast('success', `${currentWeek.name} roster & player roles saved!`);
        } catch (e: any) {
            addToast('error', 'Sync failed');
        }
    };

    const setPlayerRole = (playerId: string, role: PlayerRoleInWeek) => {
        setParticipation(prev => ({
            ...prev,
            [playerId]: role
        }));
    };

    const cyclePlayerRole = (playerId: string) => {
        const currentRole = participation[playerId] || 'DID_NOT_PLAY';
        let nextRole: PlayerRoleInWeek = 'MAIN';
        if (currentRole === 'MAIN') nextRole = 'SUB';
        else if (currentRole === 'SUB') nextRole = 'DID_NOT_PLAY';
        else nextRole = 'MAIN';

        setPlayerRole(playerId, nextRole);
    };

    const addToTeam = (playerId: string, listKey: keyof TeamState) => {
        const newTeams = { ...teams };
        
        // Remove from everywhere first
        (Object.keys(newTeams) as Array<keyof TeamState>).forEach(k => {
            newTeams[k] = newTeams[k].filter(id => id !== playerId);
        });

        let finalKey = listKey;

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
        
        // Set default participation role
        const defaultRole: PlayerRoleInWeek = finalKey.includes('Main') ? 'MAIN' : 'SUB';
        setPlayerRole(playerId, defaultRole);

        setActiveMoveMenu(null);
    };

    const removeFromTeam = (playerId: string, listKey: keyof TeamState) => {
        setTeams(prev => ({
            ...prev,
            [listKey]: prev[listKey].filter(id => id !== playerId)
        }));
        setPlayerRole(playerId, 'DID_NOT_PLAY');
        setActiveMoveMenu(null);
    };

    // Rotation-Aware Auto-Balance algorithm
    const handleAutoBalance = async () => {
        if (!window.confirm("SMART ROTATION AUTO-BALANCE:\n1. Respects user registration preferences.\n2. Prioritizes players who were SUB or DID NOT PLAY in previous weeks so everyone rotates to MAIN!\n3. Fills remaining slots with top power.\n\nExecute auto-balance?")) return;

        setLoading(true);
        let newTeams: TeamState = { teamAMain: [], teamASubs: [], teamBMain: [], teamBSubs: [] };
        let newParticipation: Record<string, PlayerRoleInWeek> = { ...participation };
        const assignedIds = new Set<string>();

        // Get past weeks (excluding current) to determine who played MAIN last week
        const pastWeeks = weeks.filter(w => w.id !== selectedWeekId).sort((a,b) => b.weekNumber - a.weekNumber);
        const lastWeek = pastWeeks[0];

        const getLastWeekRole = (pid: string): PlayerRoleInWeek => {
            if (!lastWeek) return 'DID_NOT_PLAY';
            if (lastWeek.participation && lastWeek.participation[pid]) {
                return lastWeek.participation[pid];
            }
            if (lastWeek.teams.teamAMain.includes(pid) || lastWeek.teams.teamBMain.includes(pid)) return 'MAIN';
            if (lastWeek.teams.teamASubs.includes(pid) || lastWeek.teams.teamBSubs.includes(pid)) return 'SUB';
            return 'DID_NOT_PLAY';
        };

        // Sort registered players by Rotation Priority (SUB / DID_NOT_PLAY from last week get top priority for MAIN)
        const regs = registrations
            .map(r => ({
                ...r,
                player: allPlayers.find(p => p.id === r.playerId),
                lastRole: getLastWeekRole(r.playerId)
            }))
            .filter(r => r.player && r.player.active)
            .sort((a, b) => {
                // Priority order for lastRole: 'DID_NOT_PLAY' (0) > 'SUB' (1) > 'MAIN' (2)
                const roleWeight = { 'DID_NOT_PLAY': 0, 'SUB': 1, 'MAIN': 2 };
                const weightDiff = roleWeight[a.lastRole] - roleWeight[b.lastRole];
                if (weightDiff !== 0) return weightDiff;
                return (b.player?.firstSquadPower || 0) - (a.player?.firstSquadPower || 0);
            });

        regs.forEach(r => {
            const pid = r.playerId;
            if (r.preference === '14:00') {
                if (newTeams.teamAMain.length < 20) {
                    newTeams.teamAMain.push(pid);
                    newParticipation[pid] = 'MAIN';
                } else if (newTeams.teamASubs.length < 10) {
                    newTeams.teamASubs.push(pid);
                    newParticipation[pid] = 'SUB';
                }
            } else if (r.preference === '23:00') {
                if (newTeams.teamBMain.length < 20) {
                    newTeams.teamBMain.push(pid);
                    newParticipation[pid] = 'MAIN';
                } else if (newTeams.teamBSubs.length < 10) {
                    newTeams.teamBSubs.push(pid);
                    newParticipation[pid] = 'SUB';
                }
            } else {
                if (newTeams.teamAMain.length <= newTeams.teamBMain.length && newTeams.teamAMain.length < 20) {
                    newTeams.teamAMain.push(pid);
                    newParticipation[pid] = 'MAIN';
                } else if (newTeams.teamBMain.length < 20) {
                    newTeams.teamBMain.push(pid);
                    newParticipation[pid] = 'MAIN';
                } else if (newTeams.teamASubs.length <= newTeams.teamBSubs.length && newTeams.teamASubs.length < 10) {
                    newTeams.teamASubs.push(pid);
                    newParticipation[pid] = 'SUB';
                } else if (newTeams.teamBSubs.length < 10) {
                    newTeams.teamBSubs.push(pid);
                    newParticipation[pid] = 'SUB';
                }
            }
            assignedIds.add(pid);
        });

        // Fill remaining slots with top squad power unassigned players
        const remainingPlayers = allPlayers
            .filter(p => p.active && !assignedIds.has(p.id))
            .sort((a,b) => {
                const aRole = getLastWeekRole(a.id);
                const bRole = getLastWeekRole(b.id);
                const roleWeight = { 'DID_NOT_PLAY': 0, 'SUB': 1, 'MAIN': 2 };
                const weightDiff = roleWeight[aRole] - roleWeight[bRole];
                if (weightDiff !== 0) return weightDiff;
                return b.firstSquadPower - a.firstSquadPower;
            });

        remainingPlayers.forEach(p => {
            const pid = p.id;
            if (newTeams.teamAMain.length <= newTeams.teamBMain.length && newTeams.teamAMain.length < 20) {
                newTeams.teamAMain.push(pid);
                newParticipation[pid] = 'MAIN';
            } else if (newTeams.teamBMain.length < 20) {
                newTeams.teamBMain.push(pid);
                newParticipation[pid] = 'MAIN';
            } else if (newTeams.teamASubs.length <= newTeams.teamBSubs.length && newTeams.teamASubs.length < 10) {
                newTeams.teamASubs.push(pid);
                newParticipation[pid] = 'SUB';
            } else if (newTeams.teamBSubs.length < 10) {
                newTeams.teamBSubs.push(pid);
                newParticipation[pid] = 'SUB';
            }
        });

        setTeams(newTeams);
        setParticipation(newParticipation);
        setLoading(false);
        addToast('success', 'Rosters auto-balanced with weekly rotation priority!');
    };

    // Helper to get past week history badges for a player
    const getPlayerHistoryBadges = (playerId: string) => {
        const history = weeks
            .filter(w => w.id !== selectedWeekId)
            .sort((a,b) => b.weekNumber - a.weekNumber)
            .slice(0, 3); // show last 3 weeks

        if (history.length === 0) return null;

        return (
            <div className="flex gap-1 items-center">
                {history.map(w => {
                    let role: PlayerRoleInWeek = w.participation?.[playerId] || 'DID_NOT_PLAY';
                    if (!w.participation?.[playerId]) {
                        if (w.teams.teamAMain.includes(playerId) || w.teams.teamBMain.includes(playerId)) role = 'MAIN';
                        else if (w.teams.teamASubs.includes(playerId) || w.teams.teamBSubs.includes(playerId)) role = 'SUB';
                    }

                    const badgeStyle = role === 'MAIN' 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : role === 'SUB'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : 'bg-slate-800 text-slate-500 border-slate-700';

                    const roleLabel = role === 'MAIN' ? 'M' : role === 'SUB' ? 'S' : '-';

                    return (
                        <span key={w.id} className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded border ${badgeStyle}`} title={`${w.name}: ${role}`}>
                            W{w.weekNumber}:{roleLabel}
                        </span>
                    );
                })}
            </div>
        );
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

    const RoleSelectorBox = ({ playerId }: { playerId: string }) => {
        const role = participation[playerId] || 'DID_NOT_PLAY';
        
        const style = role === 'MAIN'
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/30'
            : role === 'SUB'
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 hover:bg-amber-500/30'
            : 'bg-slate-800/80 text-slate-500 border-slate-700 hover:bg-slate-700/80';

        const label = role === 'MAIN' ? 'MAIN' : role === 'SUB' ? 'SUB' : 'NO PLAY';

        return (
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); cyclePlayerRole(playerId); }}
                className={`text-[8px] font-mono font-black uppercase px-2 py-0.5 rounded border transition-all ${style}`}
                title="Click to toggle played status (MAIN -> SUB -> NO PLAY)"
            >
                {label}
            </button>
        );
    };

    const TeamColumn = ({ title, listKey, color }: { title: string, listKey: keyof TeamState, color: string }) => {
        const ids = teams[listKey];
        const limit = listKey.includes('Main') ? 20 : 10;
        const isFull = ids.length >= limit;
        
        const totalPower = ids.reduce((sum, id) => {
            const p = allPlayers.find(pl => pl.id === id);
            return sum + (p?.firstSquadPower || 0);
        }, 0);

        return (
            <div className={`bg-[#0f172a] rounded-2xl border ${color} flex flex-col h-[540px] relative`}>
                <div className={`p-3 border-b ${color} bg-opacity-10 bg-slate-900 rounded-t-2xl`}>
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white">{title}</h4>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded ${isFull ? 'bg-rose-500 text-white font-bold' : 'bg-slate-800 text-slate-400'}`}>
                            {ids.length}/{limit}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-emerald-400 font-bold">{(totalPower/1000000000).toFixed(2)}B PWR</span>
                        <span className="text-slate-500 text-[8px] uppercase">Slot limit {limit}</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1.5">
                    {ids.map(id => {
                        const player = allPlayers.find(p => p.id === id);
                        if (!player) return null;
                        const isMenuOpen = activeMoveMenu?.id === id;

                        return (
                            <div key={id} className="relative group">
                                <div 
                                    className={`flex justify-between items-center p-2 rounded-xl bg-slate-900 border transition-all ${isMenuOpen ? 'border-sky-500 ring-1 ring-sky-500/50' : 'border-slate-800/80 hover:border-slate-600'}`}
                                >
                                    <div className="truncate flex-1 min-w-0 pr-2">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-white truncate">{player.name}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-2 mt-0.5">
                                            <span className="text-[8px] text-slate-400 font-mono">{(player.firstSquadPower/1000000).toFixed(1)}M</span>
                                            {getPlayerHistoryBadges(id)}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <RoleSelectorBox playerId={id} />
                                        <button 
                                            onClick={() => setActiveMoveMenu(isMenuOpen ? null : { id, from: listKey })}
                                            className="text-[9px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700"
                                            title="Move player"
                                        >
                                            ⚙️
                                        </button>
                                    </div>
                                </div>
                                
                                {isMenuOpen && (
                                    <div className="absolute inset-0 bg-[#0a0f1e]/95 backdrop-blur-sm z-20 flex items-center justify-center gap-1 p-1 rounded-xl">
                                        <button onClick={() => addToTeam(id, 'teamAMain')} className="text-[7px] bg-amber-600 text-white p-1.5 rounded-lg flex-1 h-full uppercase font-black">A-Main</button>
                                        <button onClick={() => addToTeam(id, 'teamASubs')} className="text-[7px] bg-amber-800 text-white p-1.5 rounded-lg flex-1 h-full uppercase font-black">A-Sub</button>
                                        <button onClick={() => addToTeam(id, 'teamBMain')} className="text-[7px] bg-sky-600 text-white p-1.5 rounded-lg flex-1 h-full uppercase font-black">B-Main</button>
                                        <button onClick={() => addToTeam(id, 'teamBSubs')} className="text-[7px] bg-sky-800 text-white p-1.5 rounded-lg flex-1 h-full uppercase font-black">B-Sub</button>
                                        <button onClick={() => removeFromTeam(id, listKey)} className="text-[7px] bg-rose-600 text-white p-1.5 rounded-lg flex-1 h-full uppercase font-black">Remove</button>
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
            {/* Command Header & Week Manager Bar */}
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-700/80 space-y-6 shadow-xl">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-header font-black text-white uppercase tracking-[0.2em]">Storm Command</h2>
                            {currentWeek?.isCurrent && (
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-1 rounded-full font-mono uppercase font-bold animate-pulse">
                                    ● Active Session
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">WEEKLY DESERT STORM TACTICS & ROTATION MANAGEMENT</p>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center w-full lg:w-auto">
                        {/* Week Selector Dropdown */}
                        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-1.5 rounded-xl">
                            <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Week:</span>
                            <select
                                value={selectedWeekId}
                                onChange={(e) => handleSelectWeek(e.target.value)}
                                className="bg-slate-900 text-white text-xs font-mono font-bold px-3 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-sky-500"
                            >
                                {weeks.map(w => (
                                    <option key={w.id} value={w.id}>
                                        {w.name} {w.isCurrent ? '(Active)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={() => setShowStartWeekModal(true)}
                            className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-sky-900/20 transition-all border border-sky-400/20 flex items-center gap-1.5"
                        >
                            <span>+</span> Start New Week
                        </button>

                        <button
                            onClick={handleResetRegistrations}
                            className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-amber-500/40 transition-all"
                            title="Reset all registrations for players to re-register weekly"
                        >
                            Reset Regs
                        </button>

                        <button 
                            onClick={toggleRegistration} 
                            className={`px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-1.5 ${
                                allowRegistration 
                                ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-600/30' 
                                : 'bg-rose-600/20 border-rose-500/50 text-rose-400 hover:bg-rose-600/30'
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${allowRegistration ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                            Reg: {allowRegistration ? 'OPEN' : 'CLOSED'}
                        </button>

                        <button onClick={handleAutoBalance} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all border border-indigo-400/20">
                             Auto Rotation
                        </button>

                        <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 transition-all border border-emerald-400/20">
                            Sync Week
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal for Starting New Week */}
            {showStartWeekModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
                        <div>
                            <h3 className="text-lg font-black text-white uppercase tracking-wider">Start New Desert Storm Week</h3>
                            <p className="text-xs text-slate-400 mt-1">
                                This will save current week records, create a new session, and reset weekly registrations so commanders can register afresh.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Session Name</label>
                            <input
                                type="text"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:border-sky-500 outline-none font-mono"
                                placeholder={`Week ${weeks.length + 1}`}
                                value={newWeekName}
                                onChange={(e) => setNewWeekName(e.target.value)}
                            />
                        </div>

                        <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-[11px] text-amber-200">
                            ℹ️ Player history from previous weeks will be retained so you can see who played Main, Sub, or Did Not Play last week!
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setShowStartWeekModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStartNewWeek}
                                className="px-5 py-2 rounded-xl text-xs font-black uppercase bg-sky-600 hover:bg-sky-500 text-white border border-sky-400/30 shadow-lg"
                            >
                                Start Session
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Global Candidate Queue & Rotation Injector */}
                <div className="lg:col-span-3 bg-[#0f172a] rounded-2xl border border-slate-700 flex flex-col h-[600px] overflow-hidden">
                    <div className="p-4 border-b border-slate-800 bg-slate-900/50 space-y-3">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-black text-sky-500 uppercase tracking-widest">Database Injector</h3>
                            <span className="text-[9px] font-mono text-slate-400">{candidates.length} Available</span>
                        </div>
                        <input 
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:border-sky-500 outline-none transition-all placeholder-slate-700"
                            placeholder="Search commander..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                        {candidates.length > 0 ? candidates.map(p => {
                            const isReg = registrations.some(r => r.playerId === p.id);
                            return (
                                <div key={p.id} className="group relative bg-slate-900/50 border border-slate-800 p-2.5 rounded-xl hover:border-sky-500/50 transition-all">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-bold text-slate-200 truncate">{p.name}</span>
                                                {isReg && (
                                                    <span className="text-[8px] bg-sky-500/20 text-sky-400 px-1.5 py-0.2 rounded font-mono font-bold">
                                                        REG
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between gap-2 mt-1">
                                                <span className="text-[9px] font-mono text-slate-400 font-bold">{(p.firstSquadPower/1000000).toFixed(1)}M</span>
                                                {getPlayerHistoryBadges(p.id)}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="absolute inset-0 bg-slate-950/95 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 z-10 p-2 rounded-xl transition-opacity">
                                        <button onClick={() => addToTeam(p.id, 'teamAMain')} className="text-[8px] bg-amber-600 text-white p-1.5 rounded-lg flex-1 font-black uppercase">A-Main</button>
                                        <button onClick={() => addToTeam(p.id, 'teamASubs')} className="text-[8px] bg-amber-800 text-white p-1.5 rounded-lg flex-1 font-black uppercase">A-Sub</button>
                                        <button onClick={() => addToTeam(p.id, 'teamBMain')} className="text-[8px] bg-sky-600 text-white p-1.5 rounded-lg flex-1 font-black uppercase">B-Main</button>
                                        <button onClick={() => addToTeam(p.id, 'teamBSubs')} className="text-[8px] bg-sky-800 text-white p-1.5 rounded-lg flex-1 font-black uppercase">B-Sub</button>
                                    </div>
                                </div>
                            );
                        }) : <div className="text-center py-10 text-[10px] text-slate-600 font-mono">NO TARGETS FOUND</div>}
                    </div>
                </div>

                {/* Team Grid */}
                <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 overflow-y-auto">
                    <TeamColumn title="TEAM A (14:00) MAIN" listKey="teamAMain" color="border-amber-500/40" />
                    <TeamColumn title="TEAM A (14:00) SUBS" listKey="teamASubs" color="border-amber-900/30" />
                    <TeamColumn title="TEAM B (23:00) MAIN" listKey="teamBMain" color="border-sky-500/40" />
                    <TeamColumn title="TEAM B (23:00) SUBS" listKey="teamBSubs" color="border-sky-900/30" />
                </div>
            </div>
        </div>
    );
};

export default DesertStormManager;
