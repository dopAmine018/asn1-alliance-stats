import React, { useState, useRef } from 'react';
import { toBlob } from 'html-to-image';
import { Player } from '../types';
import { useToast } from './Toast';
import { useLanguage } from '../utils/i18n';

export interface MapBuildingAssignment {
    id: string;
    name: string;
    generationRate: string;
    x: number; // percentage from left
    y: number; // percentage from top
    color: 'blue' | 'red' | 'gold';
    assignedPlayers: string[]; // Player names or IDs
    priority: 'P1 - Primary' | 'P2 - Secondary' | 'P3 - Hold' | 'P4 - Reserve';
    notes: string;
}

const DEFAULT_BUILDINGS: MapBuildingAssignment[] = [
    {
        id: 'central_command',
        name: 'Central Command',
        generationRate: '+80/s',
        x: 50,
        y: 47,
        color: 'gold',
        assignedPlayers: [],
        priority: 'P1 - Primary',
        notes: 'Main Command Center - High Priority Rally Point',
    },
    {
        id: 'north_silo',
        name: 'North Radar Tower',
        generationRate: '+10/s',
        x: 50,
        y: 18,
        color: 'blue',
        assignedPlayers: [],
        priority: 'P2 - Secondary',
        notes: 'Fast Capture & Vision Control',
    },
    {
        id: 'south_silo',
        name: 'South Silo Plant',
        generationRate: '+10/s',
        x: 50,
        y: 78,
        color: 'red',
        assignedPlayers: [],
        priority: 'P2 - Secondary',
        notes: 'Southern Buffer & Reinforcement Zone',
    },
    {
        id: 'nw_refinery',
        name: 'NW Oil Refinery',
        generationRate: '+50/s',
        x: 14,
        y: 29,
        color: 'blue',
        assignedPlayers: [],
        priority: 'P1 - Primary',
        notes: 'Left Flank Energy Engine',
    },
    {
        id: 'ne_hospital',
        name: 'NE Field Hospital',
        generationRate: '+30/s',
        x: 88,
        y: 33,
        color: 'red',
        assignedPlayers: [],
        priority: 'P2 - Secondary',
        notes: 'Healing & Recovery Station',
    },
    {
        id: 'w_arsenal',
        name: 'West Tech Arsenal',
        generationRate: '+50/s',
        x: 13,
        y: 55,
        color: 'blue',
        assignedPlayers: [],
        priority: 'P1 - Primary',
        notes: 'Heavy Attack Squad Deployment',
    },
    {
        id: 'e_hospital',
        name: 'East Field Hospital',
        generationRate: '+30/s',
        x: 88,
        y: 56,
        color: 'red',
        assignedPlayers: [],
        priority: 'P2 - Secondary',
        notes: 'Hospital Hold & Defense',
    },
    {
        id: 'sw_hospital',
        name: 'SW Field Hospital',
        generationRate: '+30/s',
        x: 29,
        y: 83,
        color: 'blue',
        assignedPlayers: [],
        priority: 'P3 - Hold',
        notes: 'Rear Hospital Support',
    },
    {
        id: 'se_arsenal',
        name: 'SE Tech Arsenal',
        generationRate: '+50/s',
        x: 71,
        y: 82,
        color: 'red',
        assignedPlayers: [],
        priority: 'P1 - Primary',
        notes: 'Right Flank Offensive Command',
    },
    {
        id: 'se_silo',
        name: 'SE Radar Silo',
        generationRate: '+10/s',
        x: 88,
        y: 80,
        color: 'red',
        assignedPlayers: [],
        priority: 'P3 - Hold',
        notes: 'Corner Lookout Post',
    },
];

interface Props {
    teamAMain: Player[];
    teamASubs: Player[];
    teamBMain: Player[];
    teamBSubs: Player[];
    allPlayers?: Player[];
    sessionName?: string;
    onClose: () => void;
}

export const DesertStormMapPlanner: React.FC<Props> = ({
    teamAMain,
    teamASubs,
    teamBMain,
    teamBSubs,
    allPlayers = [],
    sessionName = 'Desert Storm War Plan',
    onClose,
}) => {
    const { addToast } = useToast();
    const { t } = useLanguage();

    const [mapImageUrl, setMapImageUrl] = useState<string>('/desert_storm_map.jpg');
    const [buildings, setBuildings] = useState<MapBuildingAssignment[]>(DEFAULT_BUILDINGS);
    const [activeBuildingId, setActiveBuildingId] = useState<string>('central_command');
    const [isCapturing, setIsCapturing] = useState(false);
    const [customPlayerInput, setCustomPlayerInput] = useState('');

    const mapPosterRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeBuilding = buildings.find(b => b.id === activeBuildingId) || buildings[0];

    // Auto Fill Algorithm to place commanders across map buildings
    const handleAutoAssign = () => {
        const sortedA = [...teamAMain, ...teamASubs].sort((a, b) => b.firstSquadPower - a.firstSquadPower);
        const sortedB = [...teamBMain, ...teamBSubs].sort((a, b) => b.firstSquadPower - a.firstSquadPower);

        const newBuildings = buildings.map(b => {
            let names: string[] = [];
            let color: 'blue' | 'red' | 'gold' = 'gold';

            if (b.id === 'central_command') {
                // Top 2 power from Team A and Team B
                const topA = sortedA.slice(0, 2).map(p => p.name);
                const topB = sortedB.slice(0, 2).map(p => p.name);
                names = [...topA, ...topB];
                color = 'gold';
            } else if (b.id === 'w_arsenal' || b.id === 'nw_refinery') {
                names = sortedA.slice(2, 5).map(p => p.name);
                color = 'blue';
            } else if (b.id === 'se_arsenal' || b.id === 'ne_hospital') {
                names = sortedB.slice(2, 5).map(p => p.name);
                color = 'red';
            } else if (b.id === 'sw_hospital' || b.id === 'north_silo') {
                names = sortedA.slice(5, 8).map(p => p.name);
                color = 'blue';
            } else if (b.id === 'e_hospital' || b.id === 'south_silo' || b.id === 'se_silo') {
                names = sortedB.slice(5, 8).map(p => p.name);
                color = 'red';
            }

            return {
                ...b,
                assignedPlayers: names,
                color,
            };
        });

        setBuildings(newBuildings);
        addToast('success', '⚡ Auto-assigned commanders across the Desert Storm map!');
    };

    // Custom Map Image Upload Handler
    const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setMapImageUrl(event.target.result as string);
                addToast('success', '📷 Uploaded custom Desert Storm map screenshot!');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleAddPlayerToBuilding = (playerName: string) => {
        if (!playerName.trim()) return;
        setBuildings(prev => prev.map(b => {
            if (b.id === activeBuildingId) {
                if (b.assignedPlayers.includes(playerName)) return b;
                return { ...b, assignedPlayers: [...b.assignedPlayers, playerName] };
            }
            return b;
        }));
        setCustomPlayerInput('');
    };

    const handleRemovePlayerFromBuilding = (playerName: string) => {
        setBuildings(prev => prev.map(b => {
            if (b.id === activeBuildingId) {
                return { ...b, assignedPlayers: b.assignedPlayers.filter(p => p !== playerName) };
            }
            return b;
        }));
    };

    const handleUpdateBuilding = (field: keyof MapBuildingAssignment, value: any) => {
        setBuildings(prev => prev.map(b => b.id === activeBuildingId ? { ...b, [field]: value } : b));
    };

    // PNG Generation and Save to Phone
    const handleSaveMapToPhone = async () => {
        setIsCapturing(true);

        try {
            await new Promise(r => setTimeout(r, 150));

            if (!mapPosterRef.current) throw new Error('Poster element missing');

            const blob = await toBlob(mapPosterRef.current, {
                quality: 0.95,
                pixelRatio: 2,
                backgroundColor: '#0a0f1d',
                cacheBust: true,
            });

            if (!blob) throw new Error('Could not render image blob');

            const dateStr = new Date().toISOString().slice(0, 10);
            const fileName = `ASN1_DesertStorm_Tactical_Plan_${dateStr}.png`;
            const file = new File([blob], fileName, { type: 'image/png' });

            let shared = false;

            // 1. Mobile Native Web Share API - opens native phone action sheet ("Save to Photos" / "Save to Files")
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        title: 'ASN1 Desert Storm Map Plan',
                        text: 'ASN1 Alliance Desert Storm Tactical Map Plan',
                        files: [file],
                    });
                    shared = true;
                    addToast('success', '📱 Saved/Shared Tactical Map Plan!');
                } catch (shareErr) {
                    if ((shareErr as Error).name !== 'AbortError') {
                        console.warn('Native share failed, using direct download link:', shareErr);
                    } else {
                        shared = true; // User dismissed share modal
                    }
                }
            }

            // 2. Direct Browser File Download (Saves directly to downloads on phone / computer)
            if (!shared) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                addToast('success', '📥 Tactical Map image saved to phone downloads!');

                // Also copy to clipboard as bonus convenience
                if (navigator.clipboard && window.ClipboardItem) {
                    try {
                        const item = new ClipboardItem({ 'image/png': blob });
                        await navigator.clipboard.write([item]);
                    } catch (clipErr) {
                        // ignore clipboard errors
                    }
                }

                setTimeout(() => URL.revokeObjectURL(url), 5000);
            }
        } catch (err) {
            console.error('Failed to export map plan image:', err);
            addToast('error', 'Failed to capture map image');
        } finally {
            setIsCapturing(false);
        }
    };

    // Candidate players to pick from
    const availablePlayersList = [
        ...teamAMain.map(p => ({ ...p, teamLabel: 'Team A Main (14:00)' })),
        ...teamASubs.map(p => ({ ...p, teamLabel: 'Team A Sub' })),
        ...teamBMain.map(p => ({ ...p, teamLabel: 'Team B Main (23:00)' })),
        ...teamBSubs.map(p => ({ ...p, teamLabel: 'Team B Sub' })),
        ...allPlayers.filter(p => 
            !teamAMain.some(x => x.id === p.id) &&
            !teamASubs.some(x => x.id === p.id) &&
            !teamBMain.some(x => x.id === p.id) &&
            !teamBSubs.some(x => x.id === p.id)
        ).map(p => ({ ...p, teamLabel: 'Roster Member' })),
    ];

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 overflow-y-auto p-3 sm:p-6 flex flex-col items-center">
            <div className="w-full max-w-7xl bg-[#0a0f1d] border border-amber-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-6">
                
                {/* Header Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-black text-xl shadow-lg">
                            🗺️
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                                Desert Storm Tactical Map Plan
                            </h2>
                            <p className="text-xs text-amber-400/80 font-mono">
                                Customize commanders and objectives on each building then save image to phone
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleCustomImageUpload} 
                            accept="image/*" 
                            className="hidden" 
                        />
                        
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
                            title="Upload your own Desert Storm screenshot image"
                        >
                            <span>📷</span> Upload Custom Map
                        </button>

                        <button
                            onClick={handleAutoAssign}
                            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black uppercase tracking-wider border border-amber-400/30 shadow-lg transition-all flex items-center gap-1.5"
                        >
                            <span>⚡</span> Auto-Assign Teams
                        </button>

                        <button
                            onClick={handleSaveMapToPhone}
                            disabled={isCapturing}
                            className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black uppercase tracking-wider border border-sky-400/30 shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isCapturing ? (
                                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            )}
                            <span>Save Map to Phone</span>
                        </button>

                        <button
                            onClick={onClose}
                            className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all"
                        >
                            Close ✕
                        </button>
                    </div>
                </div>

                {/* Main Content Grid: Interactive Canvas Map on Left, Customizer on Right */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Interactive Preview Canvas */}
                    <div className="lg:col-span-8 flex flex-col items-center">
                        <div className="text-xs font-mono text-slate-400 mb-2 flex items-center gap-2">
                            <span>👇 Click any building pin on the map to edit its assigned commanders</span>
                        </div>

                        <div className="relative w-full max-w-[800px] aspect-square rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-2xl bg-black select-none">
                            <img 
                                src={mapImageUrl} 
                                alt="Desert Storm Map" 
                                className="w-full h-full object-cover"
                            />

                            {/* Building Overlay Pins */}
                            {buildings.map(b => {
                                const isSelected = b.id === activeBuildingId;
                                const hasPlayers = b.assignedPlayers.length > 0;

                                let badgeColorClass = 'bg-amber-500/90 border-amber-300 text-amber-950';
                                if (b.color === 'blue') badgeColorClass = 'bg-sky-600/90 border-sky-300 text-white';
                                if (b.color === 'red') badgeColorClass = 'bg-rose-600/90 border-rose-300 text-white';

                                return (
                                    <div 
                                        key={b.id}
                                        onClick={() => setActiveBuildingId(b.id)}
                                        style={{ left: `${b.x}%`, top: `${b.y}%` }}
                                        className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all z-20 group ${
                                            isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                                        }`}
                                    >
                                        <div className={`p-1.5 rounded-xl border-2 shadow-xl backdrop-blur-md flex flex-col items-center min-w-[90px] max-w-[130px] ${
                                            isSelected ? 'ring-4 ring-amber-400 border-white shadow-amber-500/50' : 'border-slate-700 bg-slate-950/80'
                                        }`}>
                                            <div className="flex items-center justify-between w-full gap-1">
                                                <span className={`text-[8px] font-black uppercase px-1 py-0.2 rounded ${badgeColorClass}`}>
                                                    {b.color}
                                                </span>
                                                <span className="text-[8px] font-mono font-bold text-amber-400">
                                                    {b.generationRate}
                                                </span>
                                            </div>

                                            <div className="text-[10px] font-black text-white truncate max-w-full mt-0.5">
                                                {b.name}
                                            </div>

                                            {hasPlayers ? (
                                                <div className="mt-1 w-full bg-slate-900/90 p-1 rounded border border-slate-700/80 space-y-0.5 text-center">
                                                    {b.assignedPlayers.slice(0, 3).map((p, idx) => (
                                                        <div key={idx} className="text-[8px] font-bold text-slate-200 truncate">
                                                            {p}
                                                        </div>
                                                    ))}
                                                    {b.assignedPlayers.length > 3 && (
                                                        <div className="text-[7px] text-amber-400 font-mono font-bold">
                                                            +{b.assignedPlayers.length - 3} more
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-[8px] text-slate-500 italic mt-0.5">
                                                    Click to assign
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Building Editor Controls Panel */}
                    <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
                        <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                            <div>
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono">Building Customizer</span>
                                <h3 className="text-lg font-black text-white">{activeBuilding.name}</h3>
                            </div>
                            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                                {activeBuilding.generationRate}
                            </span>
                        </div>

                        {/* Team Color & Priority */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Team Allegiance</label>
                                <select 
                                    value={activeBuilding.color}
                                    onChange={(e) => handleUpdateBuilding('color', e.target.value)}
                                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-bold"
                                >
                                    <option value="gold">🟡 Joint (Gold)</option>
                                    <option value="blue">🔷 Team A (Blue)</option>
                                    <option value="red">🔴 Team B (Red)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Tactical Priority</label>
                                <select 
                                    value={activeBuilding.priority}
                                    onChange={(e) => handleUpdateBuilding('priority', e.target.value)}
                                    className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-bold"
                                >
                                    <option value="P1 - Primary">P1 - Primary Target</option>
                                    <option value="P2 - Secondary">P2 - Secondary Target</option>
                                    <option value="P3 - Hold">P3 - Defense Hold</option>
                                    <option value="P4 - Reserve">P4 - Reserve Support</option>
                                </select>
                            </div>
                        </div>

                        {/* Tactical Orders / Notes */}
                        <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Building Tactical Orders</label>
                            <input 
                                type="text"
                                value={activeBuilding.notes}
                                onChange={(e) => handleUpdateBuilding('notes', e.target.value)}
                                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono"
                                placeholder="Tactical instructions for commanders..."
                            />
                        </div>

                        {/* Assigned Commanders Section */}
                        <div className="space-y-2 flex-1 flex flex-col">
                            <label className="text-[9px] font-bold text-slate-400 uppercase flex justify-between">
                                <span>Assigned Commanders</span>
                                <span className="text-amber-400 font-mono font-bold">{activeBuilding.assignedPlayers.length} Stationed</span>
                            </label>

                            {/* Active Assigned Chips */}
                            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800 min-h-[70px] max-h-[140px] overflow-y-auto custom-scrollbar">
                                {activeBuilding.assignedPlayers.length > 0 ? activeBuilding.assignedPlayers.map((name, i) => (
                                    <span 
                                        key={i} 
                                        className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg"
                                    >
                                        <span>{name}</span>
                                        <button 
                                            onClick={() => handleRemovePlayerFromBuilding(name)}
                                            className="text-rose-400 hover:text-rose-300 font-black text-xs ml-1"
                                        >
                                            ✕
                                        </button>
                                    </span>
                                )) : (
                                    <div className="text-[10px] text-slate-600 font-mono flex items-center justify-center w-full h-full italic">
                                        No commanders assigned to this building yet
                                    </div>
                                )}
                            </div>

                            {/* Fast Select Dropdown / Manual Add */}
                            <div className="space-y-2 pt-2 border-t border-slate-800">
                                <label className="text-[9px] font-bold text-slate-400 uppercase">Quick Add Commander</label>
                                <select 
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            handleAddPlayerToBuilding(e.target.value);
                                            e.target.value = '';
                                        }
                                    }}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono"
                                >
                                    <option value="">-- Choose Roster Commander --</option>
                                    {availablePlayersList.map(p => (
                                        <option key={p.id} value={p.name}>
                                            {p.name} ({(p.firstSquadPower/1000000).toFixed(1)}M - {p.teamLabel})
                                        </option>
                                    ))}
                                </select>

                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={customPlayerInput}
                                        onChange={(e) => setCustomPlayerInput(e.target.value)}
                                        placeholder="Or type custom name..."
                                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono"
                                    />
                                    <button 
                                        onClick={() => handleAddPlayerToBuilding(customPlayerInput)}
                                        className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* HIDDEN OFFSCREEN POSTER RENDER ELEMENT FOR HIGH-RES PNG CAPTURE */}
                <div className="fixed top-[-9999px] left-[-9999px] pointer-events-none opacity-0 z-[-9999]">
                    <div 
                        ref={mapPosterRef}
                        className="w-[1000px] bg-[#0a0f1d] text-white p-8 border-2 border-amber-500/50 rounded-3xl shadow-2xl font-sans"
                    >
                        {/* Poster Header */}
                        <div className="flex items-center justify-between border-b-2 border-amber-500/40 pb-6 mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-amber-400 font-black text-3xl shadow-lg">
                                    ⚔️
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black uppercase tracking-wider text-amber-400">
                                        ASN1 DESERT STORM TACTICAL PLAN
                                    </h1>
                                    <p className="text-sm text-slate-400 font-mono tracking-widest uppercase">
                                        {sessionName} • ALLIANCE COMMAND DISTRIBUTION
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-mono text-amber-400 bg-amber-950/80 border border-amber-500/40 px-3 py-1.5 rounded-xl font-bold">
                                    TACTICAL MAP READY
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1.5 font-mono">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                            </div>
                        </div>

                        {/* Map Image Render with Overlays */}
                        <div className="relative w-full h-[650px] rounded-2xl overflow-hidden border-2 border-amber-500/30 bg-slate-950 mb-6">
                            <img src={mapImageUrl} alt="Map Poster" className="w-full h-full object-cover" />

                            {buildings.map(b => {
                                let badgeColorClass = 'bg-amber-500 border-amber-200 text-slate-950';
                                if (b.color === 'blue') badgeColorClass = 'bg-sky-600 border-sky-200 text-white';
                                if (b.color === 'red') badgeColorClass = 'bg-rose-600 border-rose-200 text-white';

                                return (
                                    <div 
                                        key={b.id}
                                        style={{ left: `${b.x}%`, top: `${b.y}%` }}
                                        className="absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-2xl border-2 border-slate-700 bg-slate-950/90 shadow-2xl min-w-[130px] max-w-[160px]"
                                    >
                                        <div className="flex justify-between items-center w-full gap-1 mb-1">
                                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${badgeColorClass}`}>
                                                {b.color}
                                            </span>
                                            <span className="text-[9px] font-mono font-bold text-amber-400">
                                                {b.generationRate}
                                            </span>
                                        </div>

                                        <div className="text-xs font-black text-white truncate border-b border-slate-800 pb-1">
                                            {b.name}
                                        </div>

                                        {b.assignedPlayers.length > 0 ? (
                                            <div className="mt-1 space-y-0.5">
                                                {b.assignedPlayers.map((p, idx) => (
                                                    <div key={idx} className="text-[10px] font-bold text-slate-200 truncate">
                                                        • {p}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-[9px] text-slate-500 italic mt-1">
                                                Unassigned
                                            </div>
                                        )}

                                        {b.notes && (
                                            <div className="mt-1 pt-1 border-t border-slate-800 text-[8px] text-amber-300 font-mono leading-tight">
                                                {b.notes}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Building Summary Table Footer */}
                        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                                <span className="font-bold text-amber-400 uppercase">PRIMARY OBJECTIVES & CORNERSTONES</span>
                                {buildings.filter(b => b.priority.includes('P1')).map(b => (
                                    <div key={b.id} className="flex justify-between border-b border-slate-800 pb-1 text-slate-300">
                                        <span className="font-bold">{b.name} ({b.color.toUpperCase()})</span>
                                        <span className="text-amber-400">{b.assignedPlayers.length} Commanders</span>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                                <span className="font-bold text-sky-400 uppercase">TACTICAL SUPPORT & FIELD HOSPITALS</span>
                                {buildings.filter(b => !b.priority.includes('P1')).map(b => (
                                    <div key={b.id} className="flex justify-between border-b border-slate-800 pb-1 text-slate-300">
                                        <span>{b.name}</span>
                                        <span className="text-sky-400">{b.assignedPlayers.length} Commanders</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer Disclaimer */}
                        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400 font-mono">
                            <span>🛡️ ASN1 ALLIANCE COMMAND CENTER</span>
                            <span>GENERATED TACTICAL MAP PLAN</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
