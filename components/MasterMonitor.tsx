import React, { useState, useEffect } from 'react';
import { AuditLog, RosterSnapshot } from '../types';
import { AuditLogger, subscribeToLogs } from '../services/auditLogger';
import { MockApi } from '../services/mockBackend';

interface MasterMonitorProps {
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const MasterMonitor: React.FC<MasterMonitorProps> = ({ addToast }) => {
  const [subTab, setSubTab] = useState<'logs' | 'systems'>('logs');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  // Security PIN unlock
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [masterPin, setMasterPin] = useState('');
  const [pinAttempts, setPinAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(0);
  const [pinError, setPinError] = useState(false);

  // System Settings & Snapshots State
  const [settings, setSettings] = useState<Record<string, any>>({
    show_train_schedule: true,
    show_desert_storm: true,
    allow_storm_registration: true,
    lock_roster_editing: false
  });
  const [snapshots, setSnapshots] = useState<RosterSnapshot[]>([]);
  const [snapshotLabel, setSnapshotLabel] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    const data = await AuditLogger.getLogs();
    setLogs(data);
    setLoading(false);
  };

  const fetchSettingsAndSnapshots = async () => {
    try {
      const s = await MockApi.getSettings();
      if (s) setSettings(s);
      const snaps = await MockApi.getSnapshots();
      if (snaps) setSnapshots(snaps);
    } catch (e) {
      console.error('Error fetching settings/snapshots:', e);
    }
  };

  useEffect(() => {
    fetchLogs();
    const unsubscribe = subscribeToLogs((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isUnlocked) {
      fetchSettingsAndSnapshots();
    }
  }, [isUnlocked]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();

    if (Date.now() < lockoutUntil) {
      const remainingSecs = Math.ceil((lockoutUntil - Date.now()) / 1000);
      addToast('error', `TERMINAL LOCKED: Try again in ${remainingSecs}s`);
      return;
    }

    const SECRET_PIN = '154111';
    if (masterPin.trim() === SECRET_PIN) {
      setIsUnlocked(true);
      setPinError(false);
      setPinAttempts(0);
      addToast('success', 'ACCESS GRANTED: ADMIN TERMINAL UNLOCKED');
      AuditLogger.log('LOGIN', 'MR (Owner) Unlocked Master Terminal', 'MR (Owner)');
    } else {
      const newAttempts = pinAttempts + 1;
      setPinAttempts(newAttempts);
      setPinError(true);
      setMasterPin('');
      AuditLogger.log('LOGIN', `Failed Admin Logs PIN Attempt (${newAttempts}/3)`, 'Unknown Guest');

      if (newAttempts >= 3) {
        const lockDuration = 15 * 60 * 1000; // 15 mins lockout
        setLockoutUntil(Date.now() + lockDuration);
        addToast('error', 'ACCESS DENIED: Maximum 3 attempts reached. Terminal locked for 15 minutes.');
      } else {
        addToast('error', `INVALID PIN: ${3 - newAttempts} attempt(s) remaining`);
      }
    }
  };

  const handleClearLogs = async () => {
    if (window.confirm('Are you sure you want to clear all website activity logs? This action is permanent.')) {
      await AuditLogger.clearLogs();
      setLogs([]);
      addToast('info', 'Website activity logs cleared successfully.');
    }
  };

  const handleSendTestEvent = async () => {
    await AuditLogger.log(
      'SYSTEM_SETTINGS',
      'Master Monitor Security Test Executed',
      'MR (Owner)',
      { testStatus: 'OK', timestamp: new Date().toISOString() }
    );
    addToast('success', 'Test activity logged!');
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `website_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('success', 'Audit logs exported as JSON file.');
  };

  // Systems Handlers
  const handleUpdateSetting = async (key: string, value: boolean) => {
    try {
      await MockApi.updateSetting(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
      addToast('success', `PROTOCOL UPDATED: ${key.toUpperCase()}`);
      await AuditLogger.log('SYSTEM_SETTINGS', `Updated protocol ${key} to ${value}`, 'MR (Owner)');
    } catch (e: any) {
      addToast('error', `SYNC ERROR: ${e.message}`);
    }
  };

  const handleCreateSnapshot = async () => {
    if (!snapshotLabel.trim()) {
      addToast('error', 'Enter a label for the snapshot');
      return;
    }
    try {
      const snap = await MockApi.createSnapshot(snapshotLabel.trim());
      setSnapshots(prev => [snap, ...prev]);
      setSnapshotLabel('');
      addToast('success', `Snapshot Created (${snap.playerCount} Commanders)`);
      await AuditLogger.log('SYSTEM_SETTINGS', `Created roster snapshot: ${snap.label}`, 'MR (Owner)');
    } catch (e: any) {
      addToast('error', e.message || 'Snapshot failed');
    }
  };

  const handleRestoreSnapshot = async (snap: RosterSnapshot) => {
    if (window.confirm(`RESTORE ROSTER SNAPSHOT: "${snap.label}"?\n\nThis will restore ${snap.playerCount} commanders to their exact state on ${new Date(snap.createdAt).toLocaleString()}.`)) {
      const res = await MockApi.restoreSnapshot(snap.id);
      if (res.success) {
        addToast('success', `ROSTER RESTORED: ${snap.playerCount} Commanders restored!`);
        const updatedSnaps = await MockApi.getSnapshots();
        setSnapshots(updatedSnaps);
        await AuditLogger.log('SYSTEM_SETTINGS', `Restored roster snapshot: ${snap.label}`, 'MR (Owner)');
      } else {
        addToast('error', res.error || 'Restore failed');
      }
    }
  };

  const handleDeleteSnapshot = async (id: string) => {
    const updated = await MockApi.deleteSnapshot(id);
    setSnapshots(updated);
    addToast('info', 'Snapshot deleted');
    await AuditLogger.log('SYSTEM_SETTINGS', `Deleted roster snapshot ${id}`, 'MR (Owner)');
  };

  const handleExportBackup = async () => {
    await MockApi.exportRosterBackup();
    addToast('success', 'Full JSON Roster Backup exported!');
    await AuditLogger.log('SYSTEM_SETTINGS', 'Exported full JSON Roster Backup', 'MR (Owner)');
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        const res = await MockApi.importRosterBackup(text);
        if (res.success) {
          addToast('success', `ROSTER RESTORED FROM FILE: ${res.data} Commanders imported!`);
          const updatedSnaps = await MockApi.getSnapshots();
          setSnapshots(updatedSnaps);
          await AuditLogger.log('SYSTEM_SETTINGS', `Imported backup file with ${res.data} commanders`, 'MR (Owner)');
        } else {
          addToast('error', res.error || 'Import failed');
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleTriggerAutoBackupNow = async () => {
    const success = await MockApi.checkAndTriggerAutoBackup(true);
    if (success) {
      addToast('success', '🤖 Automated Data Protection Backup Triggered & Saved!');
      const updatedSnaps = await MockApi.getSnapshots();
      setSnapshots(updatedSnaps);
    } else {
      addToast('info', 'Auto-backup check completed.');
    }
  };

  const handleVaultRecovery = async () => {
    if (window.confirm('EMERGENCY VAULT RECOVERY:\n\nDo you want to restore all commanders from the secondary fail-safe Vault?')) {
      const res = await MockApi.restoreFromVault();
      if (res.success) {
        addToast('success', `VAULT RECOVERY SUCCESSFUL: ${res.data} Commanders restored!`);
        const updatedSnaps = await MockApi.getSnapshots();
        setSnapshots(updatedSnaps);
      } else {
        addToast('error', res.error || 'Vault recovery failed.');
      }
    }
  };

  // Filtering
  const filteredLogs = logs.filter(log => {
    const matchCat = categoryFilter === 'ALL' || log.category === categoryFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      log.actor.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.location.toLowerCase().includes(q) ||
      log.ipAddress.toLowerCase().includes(q) ||
      log.userAgent.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  // Analytics Metrics
  const totalLogs = logs.length;
  const loginEvents = logs.filter(l => l.category === 'LOGIN');
  const failedLogins = loginEvents.filter(l => l.action.toLowerCase().includes('failed') || l.action.toLowerCase().includes('denied'));
  const uniqueIps = new Set(logs.map(l => l.ipAddress)).size;
  const uniqueActors = new Set(logs.map(l => l.actor)).size;

  const getCategoryBadge = (cat: AuditLog['category']) => {
    switch (cat) {
      case 'LOGIN':
        return { label: 'LOGIN', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      case 'MEMBER_UPDATE':
        return { label: 'COMMANDER', color: 'bg-sky-500/10 text-sky-400 border-sky-500/30' };
      case 'DESERT_STORM':
        return { label: 'DESERT STORM', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'TRAIN_SCHEDULE':
        return { label: 'TRAIN', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'VS_TRACKER':
        return { label: 'VS TRACKER', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' };
      case 'SYSTEM_SETTINGS':
        return { label: 'SETTINGS', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      default:
        return { label: cat, color: 'bg-slate-500/10 text-slate-400 border-slate-500/30' };
    }
  };

  if (!isUnlocked) {
    const isLockedOut = Date.now() < lockoutUntil;

    return (
      <div className="flex justify-center items-center min-h-[50vh] animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-[#0f172a] p-8 rounded-3xl border border-rose-500/30 max-w-md w-full shadow-2xl relative overflow-hidden text-center">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500"></div>
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6 text-2xl">
            👑
          </div>
          <h2 className="text-xl font-header font-bold text-white tracking-widest uppercase mb-2">
            ADMIN TERMINAL LOCK (MR)
          </h2>
          <p className="text-xs text-slate-400 font-mono mb-6">
            Exclusive System Protocols & Audit Logs Terminal for MR. Enter PIN to unlock.
          </p>
          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <input
                type="password"
                value={masterPin}
                onChange={(e) => setMasterPin(e.target.value)}
                placeholder="ENTER SECURITY PIN"
                disabled={isLockedOut}
                className={`w-full bg-slate-950 border ${
                  pinError ? 'border-rose-500 text-rose-400' : 'border-white/10 text-white'
                } rounded-xl px-4 py-3 text-center outline-none font-mono tracking-widest text-sm focus:border-rose-500 transition-all ${
                  isLockedOut ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
              {pinAttempts > 0 && !isLockedOut && (
                <div className="text-[11px] text-rose-400 font-mono mt-2">
                  Failed attempts: {pinAttempts}/3 ({3 - pinAttempts} left)
                </div>
              )}
              {isLockedOut && (
                <div className="text-[11px] text-rose-500 font-mono font-bold mt-2">
                  🚫 Terminal Locked due to 3 failed attempts
                </div>
              )}
            </div>
            <button
              disabled={isLockedOut}
              className={`w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-rose-900/30 transition-all ${
                isLockedOut ? 'opacity-50 cursor-not-allowed bg-slate-800' : ''
              }`}
            >
              {isLockedOut ? 'TERMINAL LOCKED' : 'UNLOCK MASTER TERMINAL'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-rose-950/40 via-slate-900 to-indigo-950/40 p-6 md:p-8 rounded-3xl border border-rose-500/20 shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              👑 EXCLUSIVE MASTER TERMINAL (MR)
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[9px] font-mono font-bold rounded-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
              REAL-TIME
            </span>
          </div>
          <h2 className="text-2xl font-header font-black text-white tracking-widest uppercase">
            MASTER CONTROL & AUDIT CENTER
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Exclusive PIN-protected controls for System Protocols, Roster Locks, Backups, and Website Activity Logs.
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-white/10 relative z-10">
          <button
            onClick={() => setSubTab('logs')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              subTab === 'logs'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            📋 Audit Logs
          </button>
          <button
            onClick={() => setSubTab('systems')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              subTab === 'systems'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-950/50'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            🔒 System Protocols & Backups
          </button>
        </div>
      </div>

      {subTab === 'systems' ? (
        <div className="space-y-10 animate-in fade-in duration-300">
          {/* Automated Data Protection & Vault Recovery Banner */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-sky-950/40 rounded-3xl border border-emerald-500/30 p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div>
                      <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5 shadow-sm">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                              🛡️ AUTOMATED DATA PROTECTION ENGINE
                          </span>
                          <span className="px-2.5 py-0.5 bg-sky-500/20 border border-sky-500/30 text-sky-300 text-[9px] font-mono font-bold rounded-md">
                              FAILSFE VAULT: SECURED
                          </span>
                      </div>
                      <h3 className="text-lg font-header font-bold text-white uppercase tracking-widest">
                          Periodic Auto-Backups & Fail-Safe Recovery
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-1 max-w-2xl">
                          The system automatically safeguards commander records in the background every 4 hours and maintains a secondary fail-safe vault copy on every data mutation.
                      </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={handleTriggerAutoBackupNow}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-mono transition-all shadow-lg shadow-emerald-950/50 flex items-center gap-2"
                      >
                          ⚡ Force Auto-Backup
                      </button>
                      <button
                        onClick={handleVaultRecovery}
                        className="bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-mono transition-all flex items-center gap-2"
                      >
                          🛡️ Emergency Vault Recover
                      </button>
                  </div>
              </div>
          </div>

          {/* System Protocols & Security Settings */}
          <div className="bg-[#0f172a] rounded-3xl border border-white/5 p-8 shadow-2xl">
              <h3 className="text-xl font-header font-bold text-white uppercase tracking-widest border-b border-white/5 pb-4 mb-8 flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-sky-500 rounded-sm"></div>
                  System Protocols & Access Safeguards
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    { k: 'show_train_schedule', l: 'Train Visibility', d: 'Enable train scheduler for public view.' },
                    { k: 'show_desert_storm', l: 'Desert Storm Visibility', d: 'Show Desert Storm tactical roster.' },
                    { k: 'allow_storm_registration', l: 'Recruitment Protocol', d: 'Allow operatives to apply for slots.' },
                    { k: 'lock_roster_editing', l: '🔒 Lock Roster Editing (Admin Only)', d: 'Prevent public users from modifying or overwriting player power. Only Admin can edit.' }
                ].map(item => (
                    <div key={item.k} className={`p-6 rounded-2xl border flex items-center justify-between group transition-all duration-300 ${
                      item.k === 'lock_roster_editing' && settings[item.k] 
                        ? 'bg-rose-950/20 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)]' 
                        : 'bg-slate-950/40 border-white/5 hover:border-sky-500/20'
                    }`}>
                        <div className="pr-4">
                            <h4 className={`text-sm font-bold uppercase tracking-wider mb-1 ${item.k === 'lock_roster_editing' ? 'text-rose-400' : 'text-white'}`}>{item.l}</h4>
                            <p className="text-[10px] text-slate-500 font-mono italic">{item.d}</p>
                        </div>
                        <button onClick={() => handleUpdateSetting(item.k, !settings[item.k])} className={`w-12 h-6 rounded-full relative transition-all duration-300 ${settings[item.k] ? (item.k === 'lock_roster_editing' ? 'bg-rose-600 shadow-[0_0_10px_#f43f5e]' : 'bg-emerald-600 shadow-[0_0_10px_#10b981]') : 'bg-slate-800'}`}>
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${settings[item.k] ? 'translate-x-6' : ''}`} />
                        </button>
                    </div>
                ))}
              </div>
          </div>

          {/* Roster Protection, Snapshots & 1-Click Restore */}
          <div className="bg-[#0f172a] rounded-3xl border border-sky-500/20 p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 mb-8 gap-4">
                  <div>
                      <h3 className="text-xl font-header font-bold text-white uppercase tracking-widest flex items-center gap-3">
                          <div className="w-1.5 h-6 bg-emerald-500 rounded-sm"></div>
                          🛡️ Roster Backups & Snapshot Restore
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-1">
                          Protect player data against accidental or unauthorized wipes. Create snapshots, export JSON backups, or restore at any time.
                      </p>
                  </div>

                  <div className="flex items-center gap-3">
                      <button 
                        onClick={handleExportBackup}
                        className="bg-slate-900 hover:bg-slate-800 border border-sky-500/30 text-sky-400 hover:text-white px-4 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-2"
                      >
                          📥 Export Backup (JSON)
                      </button>

                      <label className="bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 text-emerald-400 hover:text-white px-4 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2">
                          📤 Import Backup
                          <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                      </label>
                  </div>
              </div>

              {/* Create Snapshot Form */}
              <div className="bg-slate-950/60 p-6 rounded-2xl border border-white/5 mb-8">
                  <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-3">Create Point-In-Time Roster Snapshot</h4>
                  <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={snapshotLabel}
                        onChange={(e) => setSnapshotLabel(e.target.value)}
                        placeholder="E.g. Pre-Desert Storm Week 12 Backup"
                        className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-xs font-mono outline-none focus:border-sky-500 transition-all"
                      />
                      <button
                        onClick={handleCreateSnapshot}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0"
                      >
                          📸 Save Snapshot
                      </button>
                  </div>
              </div>

              {/* Snapshots List */}
              <div>
                  <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center justify-between">
                      <span>Saved Roster Snapshots ({snapshots.length})</span>
                      <span className="text-[10px] text-slate-500 font-normal">Click Restore to instantly recover all player data</span>
                  </h4>

                  {snapshots.length === 0 ? (
                      <div className="text-center py-10 bg-slate-950/30 rounded-2xl border border-dashed border-white/10">
                          <p className="text-xs text-slate-500 font-mono">No snapshots saved yet. Create a snapshot above to safeguard your roster!</p>
                      </div>
                  ) : (
                      <div className="space-y-3">
                          {snapshots.map((snap) => (
                              <div key={snap.id} className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-sky-500/20 transition-all">
                                  <div>
                                      <div className="flex items-center gap-3">
                                          <h5 className="text-sm font-bold text-white font-mono">{snap.label}</h5>
                                          <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                                              {snap.playerCount} Commanders
                                          </span>
                                      </div>
                                      <p className="text-[10px] text-slate-500 font-mono mt-1">
                                          Saved on: {new Date(snap.createdAt).toLocaleString()}
                                      </p>
                                  </div>

                                  <div className="flex items-center gap-2 self-end sm:self-auto">
                                      <button
                                        onClick={() => handleRestoreSnapshot(snap)}
                                        className="bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-400 hover:text-white px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all"
                                      >
                                          🔄 Restore 1-Click
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSnapshot(snap.id)}
                                        className="bg-rose-500/10 hover:bg-rose-600 text-rose-400 hover:text-white px-3 py-2 rounded-xl text-xs font-mono transition-all"
                                      >
                                          🗑️
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <svg className={`w-4 h-4 text-sky-400 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh
            </button>
            <button
              onClick={handleExportJSON}
              className="px-4 py-2.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export Logs
            </button>
            <button
              onClick={handleSendTestEvent}
              className="px-3.5 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
              title="Log a test activity event"
            >
              🧪 Test Log
            </button>
            <button
              onClick={handleClearLogs}
              className="px-3.5 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
              title="Clear all recorded activity history"
            >
              🗑️ Clear
            </button>
          </div>

          {/* Analytics KPI Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0f172a] p-5 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group hover:border-sky-500/30 transition-all">
              <div className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest mb-1">
                Total Activity Events
              </div>
              <div className="text-2xl font-header font-black text-white">{totalLogs}</div>
              <div className="text-[10px] text-sky-400 font-mono mt-1 flex items-center gap-1">
                <span>●</span> All recorded interactions
              </div>
            </div>

            <div className="bg-[#0f172a] p-5 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group hover:border-rose-500/30 transition-all">
              <div className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest mb-1">
                Login Events
              </div>
              <div className="text-2xl font-header font-black text-rose-400">{loginEvents.length}</div>
              <div className="text-[10px] text-rose-500/80 font-mono mt-1 flex items-center gap-1">
                <span>●</span> {failedLogins.length} Failed / Blocked
              </div>
            </div>

            <div className="bg-[#0f172a] p-5 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
              <div className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest mb-1">
                Unique IP Addresses
              </div>
              <div className="text-2xl font-header font-black text-emerald-400">{uniqueIps}</div>
              <div className="text-[10px] text-emerald-500/80 font-mono mt-1 flex items-center gap-1">
                <span>●</span> Tracked network nodes
              </div>
            </div>

            <div className="bg-[#0f172a] p-5 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden group hover:border-purple-500/30 transition-all">
              <div className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest mb-1">
                Distinct Actors
              </div>
              <div className="text-2xl font-header font-black text-purple-400">{uniqueActors}</div>
              <div className="text-[10px] text-purple-500/80 font-mono mt-1 flex items-center gap-1">
                <span>●</span> Command & Public actors
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-[#0f172a] p-6 rounded-3xl border border-white/5 shadow-2xl space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by Commander name, action, IP address, or location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:border-rose-500 outline-none font-mono transition-all"
                />
                <svg className="w-4 h-4 text-slate-600 absolute left-3.5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                {[
                  { id: 'ALL', label: 'ALL' },
                  { id: 'LOGIN', label: '🔐 LOGINS' },
                  { id: 'MEMBER_UPDATE', label: '👤 COMMANDERS' },
                  { id: 'DESERT_STORM', label: '🌪️ STORM' },
                  { id: 'TRAIN_SCHEDULE', label: '🚂 TRAIN' },
                  { id: 'SYSTEM_SETTINGS', label: '⚙️ PROTOCOLS' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setCategoryFilter(tab.id)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                      categoryFilter === tab.id
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-900/20'
                        : 'bg-slate-950 border-white/5 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Activity Feed List */}
            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-950/60">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-slate-900/80 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                    <th className="p-4">Timestamp</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Actor</th>
                    <th className="p-4">Action Summary</th>
                    <th className="p-4">IP & Location</th>
                    <th className="p-4">Device / OS</th>
                    <th className="p-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs font-mono">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-500 italic">
                        Loading website audit telemetry...
                      </td>
                    </tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-500 italic">
                        No activity logs recorded matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const badge = getCategoryBadge(log.category);
                      const dateObj = new Date(log.createdAt);
                      const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                      const formattedDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });

                      return (
                        <tr key={log.id} className="hover:bg-slate-900/50 transition-colors group">
                          <td className="p-4 text-slate-400 whitespace-nowrap">
                            <div className="text-white font-bold">{formattedTime}</div>
                            <div className="text-[10px] text-slate-500">{formattedDate}</div>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${badge.color}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                              {log.actor}
                            </div>
                          </td>
                          <td className="p-4 max-w-xs md:max-w-md">
                            <div className="text-slate-200 font-semibold truncate group-hover:whitespace-normal group-hover:overflow-visible">
                              {log.action}
                            </div>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <div className="text-slate-300 font-mono text-[11px]">{log.ipAddress}</div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{log.location}</div>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] border border-slate-700">
                              {log.userAgent}
                            </span>
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold uppercase transition-all"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-3xl border border-rose-500/30 max-w-lg w-full p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔍</span>
                <h3 className="text-lg font-header font-bold text-white tracking-widest uppercase">
                  ACTIVITY INSPECTOR
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white p-1 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-white/5">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Timestamp</div>
                  <div className="text-white font-bold">{new Date(selectedLog.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Actor</div>
                  <div className="text-sky-400 font-bold">{selectedLog.actor}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Category</div>
                  <div className="text-rose-400 font-bold">{selectedLog.category}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">IP Address</div>
                  <div className="text-emerald-400 font-bold">{selectedLog.ipAddress}</div>
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 uppercase mb-1">Action Summary</div>
                <div className="p-3 bg-slate-950 rounded-xl text-slate-200 border border-white/5 font-semibold">
                  {selectedLog.action}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 uppercase mb-1">Location & Device metadata</div>
                <div className="p-3 bg-slate-950 rounded-xl text-slate-400 border border-white/5 space-y-1">
                  <div><strong className="text-slate-300">Location:</strong> {selectedLog.location}</div>
                  <div><strong className="text-slate-300">Browser / OS:</strong> {selectedLog.userAgent}</div>
                </div>
              </div>

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <div className="text-[10px] text-slate-500 uppercase mb-1">Raw Payload Details</div>
                  <pre className="p-3 bg-slate-950 rounded-xl text-sky-300 border border-white/5 text-[10px] overflow-x-auto max-h-40">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
