import React, { useState, useEffect } from 'react';
import { DesertStormApi, MockApi } from '../services/mockBackend';
import { Player, DesertStormRegistration, DesertStormWeek, PlayerRoleInWeek } from '../types';
import { useLanguage } from '../utils/i18n';
import { useToast } from './Toast';
import { getStalenessInfo } from '../utils/dateUtils';

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

const DesertStormViewer: React.FC<DesertStormViewerProps> = ({ onBack, onCreateProfile, allowRegistration: initialAllowRegistration = true }) => {
    const { t, dir } = useLanguage();
    const { addToast } = useToast();
    
    const [weeks, setWeeks] = useState<DesertStormWeek[]>([]);
    const [selectedWeekId, setSelectedWeekId] = useState<string>('');
    const [data, setData] = useState<HydratedTeam>({ teamAMain: [], teamASubs: [], teamBMain: [], teamBSubs: [] });
    const [participation, setParticipation] = useState<Record<string, PlayerRoleInWeek>>({});
    const [registrations, setRegistrations] = useState<DesertStormRegistration[]>([]);
    const [allPlayers, setAllPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [allowRegistration, setAllowRegistration] = useState(initialAllowRegistration);
    
    const [showRegister, setShowRegister] = useState(false);
    const [regName, setRegName] = useState('');
    const [regPower, setRegPower] = useState<string>('');
    const [regTime, setRegTime] = useState<'14:00' | '23:00' | 'ANY'>('ANY');
    const [searchCandidates, setSearchCandidates] = useState<Player[]>([]);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [allWeeks, playersRes, settings, regs] = await Promise.all([
                DesertStormApi.getWeeks(),
                MockApi.getPlayers({ language: 'all', search: '', sort: 'power_desc', activeOnly: false }),
                MockApi.getSettings(),
                DesertStormApi.getRegistrations()
            ]);

            const players = playersRes.items;
            setAllPlayers(players);
            setWeeks(allWeeks);
            if (regs) setRegistrations(regs);

            const activeWeek = allWeeks.find(w => w.isCurrent) || allWeeks[0];
            if (activeWeek) {
                setSelectedWeekId(activeWeek.id);
                loadWeekData(activeWeek, players);
            }

            if (settings && typeof settings.allow_storm_registration === 'boolean') {
                setAllowRegistration(settings.allow_storm_registration);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadWeekData = (week: DesertStormWeek, players: Player[] = allPlayers) => {
        if (!week) return;
        const hydrate = (ids: string[]) => ids.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[];
        const tms = week.teams || { teamAMain: [], teamASubs: [], teamBMain: [], teamBSubs: [] };
        setData({
            teamAMain: hydrate(tms.teamAMain),
            teamASubs: hydrate(tms.teamASubs),
            teamBMain: hydrate(tms.teamBMain),
            teamBSubs: hydrate(tms.teamBSubs),
        });
        setParticipation(week.participation || {});
    };

    const handleSelectWeek = (weekId: string) => {
        setSelectedWeekId(weekId);
        const w = weeks.find(item => item.id === weekId);
        if (w) loadWeekData(w);
    };

    const currentWeek = weeks.find(w => w.id === selectedWeekId) || weeks[0];

    // Capacity Logic: 30 for Team A (20 Main + 10 Subs), 30 for Team B (20 Main + 10 Subs) = 60 Total
    const TEAM_A_CAPACITY = 30;
    const TEAM_B_CAPACITY = 30;
    const TOTAL_CAPACITY = 60;

    const assignedA = data.teamAMain.length + data.teamASubs.length;
    const assignedB = data.teamBMain.length + data.teamBSubs.length;

    const regsA = registrations.filter(r => r.preference === '14:00').length;
    const regsB = registrations.filter(r => r.preference === '23:00').length;

    const uniqueParticipantIds = new Set([
        ...data.teamAMain.map(p => p.id),
        ...data.teamASubs.map(p => p.id),
        ...data.teamBMain.map(p => p.id),
        ...data.teamBSubs.map(p => p.id),
        ...registrations.map(r => r.playerId)
    ]);

    const countA = Math.max(assignedA, regsA);
    const countB = Math.max(assignedB, regsB);
    const totalOccupied = uniqueParticipantIds.size;

    const slotsLeftA = Math.max(0, TEAM_A_CAPACITY - countA);
    const slotsLeftB = Math.max(0, TEAM_B_CAPACITY - countB);
    const totalSlotsLeft = Math.max(0, TOTAL_CAPACITY - totalOccupied);

    const isAlreadyRegistered = selectedPlayer ? (
        registrations.some(r => r.playerId === selectedPlayer.id) ||
        data.teamAMain.some(p => p.id === selectedPlayer.id) ||
        data.teamASubs.some(p => p.id === selectedPlayer.id) ||
        data.teamBMain.some(p => p.id === selectedPlayer.id) ||
        data.teamBSubs.some(p => p.id === selectedPlayer.id)
    ) : false;

    const pad = (str: string, length: number) => str.length > length ? str.substring(0, length - 3) + '..' : str.padEnd(length, ' ');

    const copyTacticalRoster = async () => {
        const weekLabel = currentWeek ? currentWeek.name : 'WEEKLY';
        let report = `### 🌩️ ASN1 DESERT STORM ROSTER [${weekLabel}]\n\`\`\`\n`;
        
        const renderTeam = (name: string, main: Player[], subs: Player[], pwr: string) => {
            let chunk = `== ${name} (${pwr}) ==\n`;
            chunk += `${pad("RK", 3)} | ${pad("COMMANDER", 15)} | ${pad("POWER", 8)}\n`;
            chunk += `${"-".repeat(3)}-|-${"-".repeat(15)}-|-${"-".repeat(8)}\n`;
            main.forEach((p, i) => {
                chunk += `${pad((i + 1).toString(), 3)} | ${pad(p.name.toUpperCase(), 15)} | ${pad((p.firstSquadPower/1000000).toFixed(1) + "M", 8)}\n`;
            });
            if (subs.length > 0) {
                chunk += `\nRESERVES:\n`;
                subs.forEach(p => {
                    chunk += `>> ${p.name.toUpperCase()} (${(p.firstSquadPower/1000000).toFixed(1)}M)\n`;
                });
            }
            return chunk;
        };

        report += renderTeam(`TEAM A (14:00)`, data.teamAMain, data.teamASubs, getTotalPower([...data.teamAMain, ...data.teamASubs]));
        report += `\n`;
        report += renderTeam(`TEAM B (23:00)`, data.teamBMain, data.teamBSubs, getTotalPower([...data.teamBMain, ...data.teamBSubs]));
        
        report += `\`\`\`\n*Intelligence established by ASN1 Command Terminal*`;

        try {
            await navigator.clipboard.writeText(report);
            addToast('success', 'Tactical Roster Copied');
        } catch (err) {
            addToast('error', 'Clipboard denied');
        }
    };

    const handleSearch = async (val: string) => {
        setRegName(val);
        setSelectedPlayer(null);
        setRegPower('');
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

        if (!regPower || regPower.trim() === '') {
            addToast('error', 'First Squad Power update is required to submit');
            return;
        }

        const numVal = parseFloat(regPower.replace(/,/g, '.'));
        if (isNaN(numVal) || numVal <= 0) {
            addToast('error', 'Please enter a valid First Squad Power (e.g. 25.5)');
            return;
        }

        if (!isAlreadyRegistered) {
            if (regTime === '14:00' && slotsLeftA <= 0) {
                addToast('error', 'Team A (14:00) is currently full (30/30 slots taken)');
                return;
            }
            if (regTime === '23:00' && slotsLeftB <= 0) {
                addToast('error', 'Team B (23:00) is currently full (30/30 slots taken)');
                return;
            }
            if (regTime === 'ANY' && totalSlotsLeft <= 0) {
                addToast('error', 'All Desert Storm slots are currently full (60/60 taken)');
                return;
            }
        }

        try {
            const updatedPower = numVal < 10000 ? Math.round(numVal * 1000000) : Math.round(numVal);

            await MockApi.upsertPlayer({
                ...selectedPlayer,
                firstSquadPower: updatedPower
            });

            await DesertStormApi.register(selectedPlayer.id, regTime);
            addToast('success', `Applied & Power Updated: ${selectedPlayer.name}`);
            setShowRegister(false);
            setRegName('');
            setRegPower('');
            setSelectedPlayer(null);
            fetchData();
        } catch (e: any) {
            addToast('error', 'Sync Failed');
        }
    };

    const getTotalPower = (players: Player[]) => {
        const total = players.reduce((sum, p) => sum + (p.firstSquadPower || 0), 0);
        return (total / 1000000000).toFixed(2) + 'B';
    };

    const PlayerList = ({ players, title, color }: { players: Player[], title: string, color: string }) => (
        <div className="mb-6">
            <div className={`flex justify-between items-center mb-2 border-b ${color} pb-1`}>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{title}</span>
                <span className="text-[9px] font-mono text-slate-600 font-bold">{players.length}</span>
            </div>
            <div className="space-y-1">
                {players.length > 0 ? players.map((p, i) => {
                    const role = participation[p.id] || (title.includes('MAIN') ? 'MAIN' : 'SUB');
                    const roleBadge = role === 'MAIN' 
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : role === 'SUB'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        : 'bg-slate-800 text-slate-500 border-slate-700';

                    return (
                        <div key={p.id} className="flex justify-between items-center bg-black/20 border border-white/5 p-2 rounded shadow-sm">
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[8px] font-mono text-slate-700 font-bold">{i + 1}</span>
                                <span className="text-xs font-bold text-slate-200 truncate">{p.name}</span>
                            </div>
                            <div className="flex items-center gap-2 ml-2">
                                <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded border ${roleBadge}`}>
                                    {role}
                                </span>
                                <span className="text-[10px] font-mono text-sky-500">{(p.firstSquadPower/1000000).toFixed(1)}M</span>
                            </div>
                        </div>
                    );
                }) : <div className="text-[10px] text-slate-700 italic py-2 text-center bg-black/10 rounded">TBD</div>}
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-4xl mx-auto" dir={dir}>
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 border-b border-white/5 pb-6 gap-4 px-4">
                <div className="flex items-center gap-4 w-full">
                    <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-white/5 hover:border-sky-500 transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-header font-black text-white uppercase tracking-wider">{t('storm.title')}</h2>
                            {currentWeek?.isCurrent && (
                                <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold uppercase">
                                    Active Week
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">{t('storm.desc')}</p>
                    </div>
                </div>

                {/* Week Selector Dropdown */}
                <div className="flex items-center gap-2 shrink-0 bg-slate-900 border border-slate-800 p-2 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Week:</span>
                    <select
                        value={selectedWeekId}
                        onChange={(e) => handleSelectWeek(e.target.value)}
                        className="bg-slate-950 text-sky-400 text-xs font-mono font-bold px-3 py-1 rounded-lg border border-slate-700 outline-none"
                    >
                        {weeks.map(w => (
                            <option key={w.id} value={w.id}>
                                {w.name} {w.isCurrent ? '(Current)' : ''}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Application Slot Counters Banner */}
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl mb-8">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-3 text-center">
                    Weekly Application Slot Status
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center font-mono">
                    <div className="bg-amber-950/20 border border-amber-500/30 p-2.5 rounded-xl">
                        <div className="text-[9px] text-amber-400 uppercase font-bold">Team A (14:00)</div>
                        <div className="text-lg font-black text-white">{slotsLeftA} / 30 <span className="text-[10px] font-normal text-slate-400">slots left</span></div>
                    </div>
                    <div className="bg-sky-950/20 border border-sky-500/30 p-2.5 rounded-xl">
                        <div className="text-[9px] text-sky-400 uppercase font-bold">Team B (23:00)</div>
                        <div className="text-lg font-black text-white">{slotsLeftB} / 30 <span className="text-[10px] font-normal text-slate-400">slots left</span></div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                        <div className="text-[9px] text-slate-400 uppercase font-bold">Total Operations Capacity</div>
                        <div className="text-lg font-black text-emerald-400">{totalSlotsLeft} / 60 <span className="text-[10px] font-normal text-slate-400">slots left</span></div>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap justify-between items-center mb-8 gap-4 bg-slate-900/40 p-4 rounded-2xl border border-white/5">
                <div className="flex gap-2">
                    {allowRegistration && (
                        <button 
                            onClick={() => {
                                if (totalSlotsLeft <= 0) {
                                    addToast('error', 'Desert Storm is fully booked! (0 slots remaining)');
                                    return;
                                }
                                setShowRegister(true);
                            }}
                            disabled={totalSlotsLeft <= 0}
                            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all border flex items-center gap-2 ${
                                totalSlotsLeft > 0 
                                ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-400/20 shadow-lg shadow-sky-900/20' 
                                : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            {totalSlotsLeft > 0 ? t('storm.applyNow') : 'ALL SLOTS FULL'}
                        </button>
                    )}
                </div>
                <button 
                    onClick={copyTacticalRoster}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                >
                    <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    Copy Intelligence
                </button>
            </div>

            {/* Modal for Application Registration */}
            {showRegister && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-wider">{t('storm.applyTitle')}</h3>
                                <p className="text-[10px] text-slate-400 mt-0.5">Apply for weekly Desert Storm & keep alliance database power updated</p>
                            </div>
                            <button onClick={() => setShowRegister(false)} className="text-slate-500 hover:text-white">✕</button>
                        </div>

                        <div className="space-y-4">
                            {/* Player search */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">1. Identify Commander</label>
                                    {onCreateProfile && (
                                        <button onClick={onCreateProfile} className="text-[10px] font-bold text-sky-400 hover:underline">
                                            + Register New Profile
                                        </button>
                                    )}
                                </div>
                                <input 
                                    type="text" 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-sky-500 outline-none"
                                    placeholder="Search your in-game name..."
                                    value={regName}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />

                                {searchCandidates.length > 0 && !selectedPlayer && (
                                    <div className="mt-1 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                                        {searchCandidates.map(p => (
                                            <div 
                                                key={p.id} 
                                                onClick={() => {
                                                    setSelectedPlayer(p);
                                                    setRegName(p.name);
                                                    setRegPower((p.firstSquadPower / 1000000).toString());
                                                    setSearchCandidates([]);
                                                }}
                                                className="p-2.5 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer flex justify-between border-b border-slate-900"
                                            >
                                                <span className="font-bold text-white">{p.name}</span>
                                                <span className="font-mono text-sky-400 font-bold">{(p.firstSquadPower/1000000).toFixed(1)}M</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* NOT FOUND ALERT: Redirect to Profile Registration */}
                                {regName.length >= 2 && searchCandidates.length === 0 && !selectedPlayer && (
                                    <div className="mt-3 bg-rose-950/40 border-2 border-rose-500/50 p-4 rounded-xl space-y-3 text-center animate-in fade-in">
                                        <div className="text-xl">⚠️</div>
                                        <div className="text-xs font-black text-rose-400 uppercase tracking-wider">
                                            Commander Not Found in Alliance Database!
                                        </div>
                                        <p className="text-[11px] text-slate-300 leading-relaxed">
                                            The name <span className="font-mono text-amber-400 font-bold">"{regName}"</span> does not exist in our website database.
                                        </p>
                                        <p className="text-[10px] text-slate-400">
                                            To ensure accurate rankings and power records, you must register your Commander Profile first before applying for Desert Storm.
                                        </p>
                                        {onCreateProfile && (
                                            <button
                                                onClick={onCreateProfile}
                                                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-lg transition-all uppercase tracking-wider border border-rose-400/30 flex items-center justify-center gap-2"
                                            >
                                                <span>👤 Register Profile First</span>
                                                <span>→</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {selectedPlayer && (
                                <div className="space-y-4 animate-in fade-in duration-300 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-emerald-400">Selected: {selectedPlayer.name}</span>
                                            {(() => {
                                                const info = getStalenessInfo(selectedPlayer.updatedAt);
                                                return (
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${info.badgeColor}`}>
                                                        {info.statusText}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                        <button onClick={() => { setSelectedPlayer(null); setRegName(''); }} className="text-[10px] text-slate-500 hover:text-slate-300">Change</button>
                                    </div>

                                    {(() => {
                                        const info = getStalenessInfo(selectedPlayer.updatedAt);
                                        if (info.isStale) {
                                            return (
                                                <div className="bg-amber-950/40 border border-amber-500/40 p-2.5 rounded-xl flex items-start gap-2">
                                                    <span className="text-base">⚠️</span>
                                                    <p className="text-[10px] text-amber-300 leading-tight">
                                                        <span className="font-bold uppercase block mb-0.5">Profile Power Outdated!</span>
                                                        Your last power update was <span className="font-mono font-bold text-white">{info.days} days ago</span>. Please enter your exact current First Squad Power below to sync your profile.
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                                            2. Confirm / Update First Squad Power (Millions) <span className="text-rose-500">*</span>
                                        </label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:border-sky-500 outline-none font-mono"
                                            placeholder="e.g. 25.5"
                                            value={regPower}
                                            onChange={(e) => setRegPower(e.target.value)}
                                        />
                                        <p className="text-[9px] text-sky-400/80 mt-1">
                                            ℹ️ This will update your profile power in the official alliance database automatically.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">3. Time Availability Preference</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button 
                                                onClick={() => setRegTime('14:00')}
                                                className={`p-2 rounded-xl text-xs font-bold border ${regTime === '14:00' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                                            >
                                                14:00 UTC ({slotsLeftA} left)
                                            </button>
                                            <button 
                                                onClick={() => setRegTime('23:00')}
                                                className={`p-2 rounded-xl text-xs font-bold border ${regTime === '23:00' ? 'bg-sky-600 border-sky-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                                            >
                                                23:00 UTC ({slotsLeftB} left)
                                            </button>
                                            <button 
                                                onClick={() => setRegTime('ANY')}
                                                className={`p-2 rounded-xl text-xs font-bold border ${regTime === 'ANY' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}
                                            >
                                                ANY TIME ({totalSlotsLeft} left)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!selectedPlayer && onCreateProfile && regName.length < 2 && (
                                <div className="text-center pt-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                                    <p className="text-[10px] text-slate-400 mb-2">New to the alliance or not listed in our database yet?</p>
                                    <button onClick={onCreateProfile} className="text-xs font-bold text-sky-400 hover:text-sky-300 underline">
                                        Create Alliance Profile First →
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                            <button onClick={() => setShowRegister(false)} className="px-4 py-2 text-xs font-bold text-slate-400">Cancel</button>
                            <button 
                                onClick={submitRegistration}
                                disabled={!selectedPlayer}
                                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${selectedPlayer ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/20 hover:bg-sky-500' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                            >
                                Submit Application & Update Power
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Teams Grid View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team A */}
                <div className="bg-slate-900/80 border border-amber-500/20 rounded-2xl p-6 shadow-xl">
                    <div className="flex justify-between items-center border-b border-amber-500/30 pb-3 mb-6">
                        <div>
                            <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest">TEAM A (14:00 UTC)</h3>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">ESTIMATED COMBAT POWER</div>
                        </div>
                        <span className="text-lg font-mono font-black text-white">{getTotalPower([...data.teamAMain, ...data.teamASubs])}</span>
                    </div>

                    <PlayerList players={data.teamAMain} title="MAIN COMBAT FORCE (20 MAX)" color="border-amber-500/30" />
                    <PlayerList players={data.teamASubs} title="RESERVES (10 MAX)" color="border-amber-900/30" />
                </div>

                {/* Team B */}
                <div className="bg-slate-900/80 border border-sky-500/20 rounded-2xl p-6 shadow-xl">
                    <div className="flex justify-between items-center border-b border-sky-500/30 pb-3 mb-6">
                        <div>
                            <h3 className="text-sm font-black text-sky-400 uppercase tracking-widest">TEAM B (23:00 UTC)</h3>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">ESTIMATED COMBAT POWER</div>
                        </div>
                        <span className="text-lg font-mono font-black text-white">{getTotalPower([...data.teamBMain, ...data.teamBSubs])}</span>
                    </div>

                    <PlayerList players={data.teamBMain} title="MAIN COMBAT FORCE (20 MAX)" color="border-sky-500/30" />
                    <PlayerList players={data.teamBSubs} title="RESERVES (10 MAX)" color="border-sky-900/30" />
                </div>
            </div>
        </div>
    );
};

export default DesertStormViewer;
