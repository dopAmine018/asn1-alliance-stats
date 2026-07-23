import { createClient } from '@supabase/supabase-js';
import { Player, PlayerFilter, ApiResponse, AuthResponse, VsWeek, VsRecord, Announcement, Alliance, DesertStormRegistration, DesertStormWeek, PlayerRoleInWeek, RosterSnapshot } from '../types';
import { AuditLogger } from './auditLogger';

const PROVIDED_URL = "https://fgrzuylyxfogejwmeakn.supabase.co";
const PROVIDED_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncnp1eWx5eGZvZ2Vqd21lYWtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTEyNjEyNCwiZXhwIjoyMDgwNzAyMTI0fQ.3G3BaSOg6uzN_zn7Wf1Ebn4TjAeXsvKGBJO4STzsu8c";

const getEnv = (key: string): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) return import.meta.env[key];
  } catch (e) {}
  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  } catch (e) {}
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || PROVIDED_URL;
const supabaseKey = getEnv('VITE_SUPABASE_SERVICE_ROLE_KEY') || getEnv('VITE_SUPABASE_ANON_KEY') || PROVIDED_KEY;

const supabase = createClient(supabaseUrl.trim(), supabaseKey.trim(), {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const MOCK_ALLIANCE: Alliance = {
  id: 'asn1',
  tag: 'ASN1',
  name: 'ASN1 Alliance',
  createdAt: '2025-01-01T00:00:00.000Z'
};

// Secure Admin Authentication (SHA-256 Hashed Verification)
const ADMIN_PASSWORD_HASH = "3a41fa5869ea0286a9ea0722ba9750e79d7f58ed33143659a02c30c3c559b736";
let loginAttempts = 0;
let lockoutExpiry = 0;

async function hashPasswordInput(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const DEFAULT_STS = {
  stsPowerBoost1: 0, stsFinalStand1: 0, stsFierceAssault1: 0, stsVigilantFormation1: 0,
  stsExtraDrillGround: 0, stsBarrackExpansion1: 0, stsFocusedTraining1: 0,
  stsFinalStand2: 0, stsFierceAssault2: 0, stsVigilantFormation2: 0,
  stsDrillGroundExpansion: 0, stsRapidMarch1: 0,
  stsFinalStand3: 0, stsFierceAssault3: 0, stsVigilantFormation3: 0, stsFatalStrike1: 0
};

const DEFAULT_DEFENSE = {
    defExtraHospitals: 0, defHoldLine1: 0, defCounterDefense1: 0, defSolidDefense1: 0,
    defFortifications: 0, defInfirmaryExpansion1: 0, defEfficientHealing: 0,
    defHoldLine2: 0, defCounterDefense2: 0, defSolidDefense2: 0,
    defResourceProtection: 0, defRapidMarch1: 0,
    defHoldLine3: 0, defCounterDefense3: 0, defSolidDefense3: 0,
    defSurvivalSkills: 0
};

const DEFAULT_MASTERY = {
  masteryAirHp1: 0, masteryAirAtk1: 0, masteryAirDef1: 0, masteryAirDamage1: 0, masteryAirMarch1: 0,
  masteryAirHp2: 0, masteryAirAtk2: 0, masteryAirDef2: 0, masteryAirDamage2: 0, masteryAirUltDef1: 0,
  masteryAirHp3: 0, masteryAirAtk3: 0, masteryAirDef3: 0, masteryAirDamage3: 0, masteryAirMarch2: 0,
  masteryAirHp4: 0, masteryAirAtk4: 0, masteryAirDef4: 0, masteryAirDamage4: 0, masteryAirUltDef2: 0,
  masteryTankHp1: 0, masteryTankAtk1: 0, masteryTankDef1: 0, masteryTankDamage1: 0, masteryTankMarch1: 0,
  masteryTankHp2: 0, masteryTankAtk2: 0, masteryTankDef2: 0, masteryTankDamage2: 0, masteryTankUltDef1: 0,
  masteryTankHp3: 0, masteryTankAtk3: 0, masteryTankDef3: 0, masteryTankDamage3: 0, masteryTankMarch2: 0,
  masteryTankHp4: 0, masteryTankAtk4: 0, masteryTankDef4: 0, masteryTankDamage4: 0, masteryTankUltDef2: 0,
  masteryMissileHp1: 0, masteryMissileAtk1: 0, masteryMissileDef1: 0, masteryMissileDamage1: 0, masteryMissileMarch1: 0,
  masteryMissileHp2: 0, masteryMissileAtk2: 0, masteryMissileDef2: 0, masteryMissileDamage2: 0, masteryMissileUltDef1: 0,
  masteryMissileHp3: 0, masteryMissileAtk3: 0, masteryMissileDef3: 0, masteryMissileDamage3: 0, masteryMissileMarch2: 0,
  masteryMissileHp4: 0, masteryMissileAtk4: 0, masteryMissileDef4: 0, masteryMissileDamage4: 0, masteryMissileUltDef2: 0,
};

const INITIAL_MOCK_PLAYERS: Player[] = [
    { id: 'm1', allianceId: 'asn1', ...DEFAULT_STS, ...DEFAULT_DEFENSE, ...DEFAULT_MASTERY, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), language: 'english', name: 'imAYAD', nameNormalized: 'imayad', firstSquadPower: 23200000, totalHeroPower: 18500000, heroPercent: 92, duelPercent: 88, unitsPercent: 85, t10Morale: 10, t10Protection: 10, t10Hp: 10, t10Atk: 10, t10Def: 10, t10Elite: 10, techLevel: 35, barracksLevel: 35, tankCenterLevel: 35, airCenterLevel: 35, missileCenterLevel: 35, active: true },
    { id: 'm2', allianceId: 'asn1', ...DEFAULT_STS, ...DEFAULT_DEFENSE, ...DEFAULT_MASTERY, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), language: 'turkish', name: 'TuyuLL', nameNormalized: 'tuyull', firstSquadPower: 23000000, totalHeroPower: 18100000, heroPercent: 90, duelPercent: 85, unitsPercent: 82, t10Morale: 10, t10Protection: 10, t10Hp: 10, t10Atk: 10, t10Def: 10, t10Elite: 10, techLevel: 35, barracksLevel: 35, tankCenterLevel: 35, airCenterLevel: 35, missileCenterLevel: 35, active: true },
];

const getLocalMockData = <T>(key: string, initial: T): T => {
    const saved = localStorage.getItem(`asn1_mock_${key}`);
    let result: any = initial;
    if (saved) {
        try {
            result = JSON.parse(saved);
        } catch (e) {}
    }

    if (key === 'players') {
        const playerMap = new Map<string, Player>();

        // 1. Add initial mock base roster
        if (Array.isArray(initial)) {
            for (const p of initial as Player[]) {
                const k = (p.nameNormalized || p.name || '').trim().toLowerCase();
                if (k) playerMap.set(k, p);
            }
        }

        // 2. Merge secondary vault backup if available
        try {
            const vault = localStorage.getItem('asn1_vault_players');
            if (vault) {
                const vaultParsed = JSON.parse(vault);
                if (Array.isArray(vaultParsed)) {
                    for (const p of vaultParsed) {
                        const k = (p.nameNormalized || p.name || '').trim().toLowerCase();
                        if (k) playerMap.set(k, p);
                    }
                }
            }
        } catch (e) {}

        // 3. Merge current saved local storage entries (takes precedence)
        if (Array.isArray(result)) {
            for (const p of result as Player[]) {
                const k = (p.nameNormalized || p.name || '').trim().toLowerCase();
                if (k) playerMap.set(k, p);
            }
        }

        return Array.from(playerMap.values()) as unknown as T;
    }

    return result;
};

const saveLocalMockData = (key: string, data: any) => {
    localStorage.setItem(`asn1_mock_${key}`, JSON.stringify(data));
    // Keep secondary vault copy for data protection guarantee
    if (key === 'players' && Array.isArray(data) && data.length > 0) {
        localStorage.setItem(`asn1_vault_players`, JSON.stringify(data));
    }
};

const mapPlayerFromDb = (row: any): Player => {
  const stats = row.stats_json && typeof row.stats_json === 'object' ? row.stats_json : {};
  return {
    ...DEFAULT_STS,
    ...DEFAULT_DEFENSE,
    ...DEFAULT_MASTERY,
    ...stats,
    id: row.id,
    allianceId: row.alliance_id || 'asn1',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    language: row.language || 'english',
    name: row.name || 'Commander',
    nameNormalized: row.name_normalized || (row.name ? row.name.trim().toLowerCase().replace(/\s+/g, ' ') : (row.id || '')),
    firstSquadPower: row.first_squad_power ?? stats.firstSquadPower ?? 0,
    secondSquadPower: row.second_squad_power ?? stats.secondSquadPower ?? 0,
    thirdSquadPower: row.third_squad_power ?? stats.thirdSquadPower ?? 0,
    fourthSquadPower: row.fourth_squad_power ?? stats.fourthSquadPower ?? 0,
    totalHeroPower: row.total_hero_power ?? stats.totalHeroPower ?? 0,
    heroPercent: row.hero_percent ?? stats.heroPercent ?? 0,
    duelPercent: row.duel_percent ?? stats.duelPercent ?? 0,
    unitsPercent: row.units_percent ?? stats.unitsPercent ?? 0,
    t10Morale: row.t10_morale ?? stats.t10Morale ?? 0,
    t10Protection: row.t10_protection ?? stats.t10Protection ?? 0,
    t10Hp: row.t10_hp ?? stats.t10Hp ?? 0,
    t10Atk: row.t10_atk ?? stats.t10Atk ?? 0,
    t10Def: row.t10_def ?? stats.t10Def ?? 0,
    t10Elite: row.t10_elite ?? stats.t10Elite ?? 0,
    techLevel: row.tech_level ?? stats.techLevel ?? 30,
    barracksLevel: row.barracks_level ?? stats.barracksLevel ?? 30,
    tankCenterLevel: row.tank_center_level ?? stats.tankCenterLevel ?? 30,
    airCenterLevel: row.air_center_level ?? stats.airCenterLevel ?? 30,
    missileCenterLevel: row.missile_center_level ?? stats.missileCenterLevel ?? 30,
    active: row.active !== false
  };
};

const mapPlayerToDb = (p: Partial<Player>) => {
  const nameNormalized = p.nameNormalized || (p.name ? p.name.trim().toLowerCase().replace(/\s+/g, ' ') : '');
  const out: any = {
    updated_at: p.updatedAt || new Date().toISOString(),
    stats_json: p
  };
  if (p.name) out.name = p.name;
  if (nameNormalized) out.name_normalized = nameNormalized;
  if (p.language) out.language = p.language;
  if (p.firstSquadPower !== undefined) out.first_squad_power = p.firstSquadPower;
  if (p.secondSquadPower !== undefined) out.second_squad_power = p.secondSquadPower;
  if (p.thirdSquadPower !== undefined) out.third_squad_power = p.thirdSquadPower;
  if (p.fourthSquadPower !== undefined) out.fourth_squad_power = p.fourthSquadPower;
  if (p.totalHeroPower !== undefined) out.total_hero_power = p.totalHeroPower;
  if (p.heroPercent !== undefined) out.hero_percent = p.heroPercent;
  if (p.duelPercent !== undefined) out.duel_percent = p.duelPercent;
  if (p.unitsPercent !== undefined) out.units_percent = p.unitsPercent;
  if (p.t10Morale !== undefined) out.t10_morale = p.t10Morale;
  if (p.t10Protection !== undefined) out.t10_protection = p.t10Protection;
  if (p.t10Hp !== undefined) out.t10_hp = p.t10Hp;
  if (p.t10Atk !== undefined) out.t10_atk = p.t10Atk;
  if (p.t10Def !== undefined) out.t10_def = p.t10Def;
  if (p.t10Elite !== undefined) out.t10_elite = p.t10Elite;
  if (p.techLevel !== undefined) out.tech_level = p.techLevel;
  if (p.barracksLevel !== undefined) out.barracks_level = p.barracksLevel;
  if (p.tankCenterLevel !== undefined) out.tank_center_level = p.tankCenterLevel;
  if (p.airCenterLevel !== undefined) out.air_center_level = p.airCenterLevel;
  if (p.missileCenterLevel !== undefined) out.missile_center_level = p.missileCenterLevel;
  if (p.active !== undefined) out.active = p.active; else out.active = true;

  return out;
};

export const MockApi = {
  initialize: () => {
      console.log("ASN1 Command Uplink Established");
      console.log("Target URL:", supabaseUrl);
      setTimeout(() => {
          MockApi.checkAndTriggerAutoBackup();
      }, 2000);
  },

  testConnection: async (): Promise<boolean> => {
      try {
          const { error } = await supabase.from('players').select('id').limit(1);
          if (error) return false;
          return true;
      } catch (e) {
          return false;
      }
  },

  getLocalPlayers: (filter: PlayerFilter): { items: Player[]; total: number } => {
      let players = getLocalMockData<Player[]>('players', INITIAL_MOCK_PLAYERS);
      if (filter.activeOnly) players = players.filter(p => p.active);
      if (filter.language !== 'all') players = players.filter(p => p.language === filter.language);
      if (filter.search) {
          const s = filter.search.toLowerCase();
          players = players.filter(p => p.name.toLowerCase().includes(s) || (p.nameNormalized && p.nameNormalized.includes(s)));
      }
      if (filter.sort === 'power_desc') players.sort((a, b) => (b.firstSquadPower || 0) - (a.firstSquadPower || 0));
      else if (filter.sort === 'power_asc') players.sort((a, b) => (a.firstSquadPower || 0) - (b.firstSquadPower || 0));
      else if (filter.sort === 'total_hero_power_desc') players.sort((a, b) => (b.totalHeroPower || 0) - (a.totalHeroPower || 0));
      else players.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      
      return { items: players, total: players.length };
  },

  getPlayers: async (filter: PlayerFilter): Promise<{ items: Player[]; total: number }> => {
      let dbPlayers: Player[] = [];
      try {
          let query = supabase.from('players').select('*');
          if (filter.activeOnly) query = query.eq('active', true);
          if (filter.language !== 'all') query = query.eq('language', filter.language);
          if (filter.search) query = query.ilike('name_normalized', `%${filter.search}%`);
          
          if (filter.sort === 'power_desc') query = query.order('first_squad_power', { ascending: false });
          else if (filter.sort === 'power_asc') query = query.order('first_squad_power', { ascending: true });
          else if (filter.sort === 'total_hero_power_desc') query = query.order('total_hero_power', { ascending: false });
          else query = query.order('updated_at', { ascending: false });
          
          const { data, error } = await query.range(0, 9999);
          if (!error && data && data.length > 0) {
              dbPlayers = data.map(mapPlayerFromDb);
          }
      } catch (e: any) {}

      // Retrieve local mock storage and secondary vault players
      const localRes = MockApi.getLocalPlayers({ language: 'all', search: '', sort: 'power_desc', activeOnly: false });
      const localPlayers = localRes.items;

      // Merge DB and local storage players seamlessly without duplicates
      const playerMap = new Map<string, Player>();

      // Populate local players first
      for (const p of localPlayers) {
          const key = (p.nameNormalized || p.name || '').trim().toLowerCase();
          if (key) playerMap.set(key, p);
      }

      // Merge DB players (fresher DB entries take precedence)
      for (const p of dbPlayers) {
          const key = (p.nameNormalized || p.name || '').trim().toLowerCase();
          if (key) playerMap.set(key, p);
      }

      let merged = Array.from(playerMap.values());

      // Apply filter conditions to merged dataset
      if (filter.activeOnly) merged = merged.filter(p => p.active !== false);
      if (filter.language !== 'all') merged = merged.filter(p => p.language === filter.language);
      if (filter.search) {
          const s = filter.search.toLowerCase();
          merged = merged.filter(p => p.name.toLowerCase().includes(s) || (p.nameNormalized && p.nameNormalized.includes(s)));
      }

      if (filter.sort === 'power_desc') merged.sort((a, b) => (b.firstSquadPower || 0) - (a.firstSquadPower || 0));
      else if (filter.sort === 'power_asc') merged.sort((a, b) => (a.firstSquadPower || 0) - (b.firstSquadPower || 0));
      else if (filter.sort === 'total_hero_power_desc') merged.sort((a, b) => (b.totalHeroPower || 0) - (a.totalHeroPower || 0));
      else merged.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

      return { items: merged, total: merged.length };
  },

  upsertPlayer: async (playerData: Partial<Player>, isAdmin: boolean = false): Promise<ApiResponse<Player>> => {
      // Check Roster Lock Setting if not admin
      if (!isAdmin) {
          const settings = await MockApi.getSettings();
          if (settings.lock_roster_editing) {
              return { success: false, error: 'ROSTER LOCKED: Public editing is disabled by Master Admin. Only Admin can update player records.' };
          }
      }

      const nameNormalized = playerData.name?.trim().toLowerCase().replace(/\s+/g, ' ') || '';

      try {
          const { data: existing, error: fetchError } = await supabase
              .from('players')
              .select('id')
              .eq('name_normalized', nameNormalized)
              .maybeSingle();

          if (!fetchError) {
              const payload = mapPlayerToDb({ ...playerData, nameNormalized });
              let result;
              if (existing) {
                  result = await supabase
                      .from('players')
                      .update(payload)
                      .eq('id', existing.id)
                      .select()
                      .single();
              } else {
                  if (payload.active === undefined) payload.active = true;
                  result = await supabase
                      .from('players')
                      .insert(payload)
                      .select()
                      .single();
              }
              if (!result.error && result.data) {
                  const player = mapPlayerFromDb(result.data);
                  const local = getLocalMockData<Player[]>('players', INITIAL_MOCK_PLAYERS);
                  const idx = local.findIndex(p => p.id === player.id || p.nameNormalized === player.nameNormalized);
                  if (idx >= 0) local[idx] = player; else local.push(player);
                  saveLocalMockData('players', local);
                  await AuditLogger.log(
                      'MEMBER_UPDATE',
                      `Updated Profile: ${player.name} (1st Squad: ${((player.firstSquadPower || 0) / 1000000).toFixed(1)}M, Total Hero: ${((player.totalHeroPower || 0) / 1000000).toFixed(1)}M)`,
                      player.name || 'Commander',
                      {
                          id: player.id,
                          name: player.name,
                          language: player.language,
                          firstSquadPower: player.firstSquadPower,
                          totalHeroPower: player.totalHeroPower,
                          updatedAt: player.updatedAt
                      }
                  );
                  return { success: true, data: player };
              }
          }
      } catch (e: any) {}

      // Fallback to local storage if Supabase fails
      const local = getLocalMockData<Player[]>('players', INITIAL_MOCK_PLAYERS);
      const idx = local.findIndex(p => p.id === playerData.id || (p.nameNormalized && p.nameNormalized === nameNormalized));
      let updated: Player;
      if (idx >= 0) {
          updated = { ...local[idx], ...playerData, nameNormalized, updatedAt: new Date().toISOString() } as Player;
          local[idx] = updated;
      } else {
          updated = {
              id: playerData.id || `m_${Date.now()}`,
              allianceId: 'asn1',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              language: playerData.language || 'english',
              name: playerData.name || 'Commander',
              nameNormalized,
              firstSquadPower: playerData.firstSquadPower || 0,
              totalHeroPower: playerData.totalHeroPower || 0,
              heroPercent: playerData.heroPercent || 0,
              duelPercent: playerData.duelPercent || 0,
              unitsPercent: playerData.unitsPercent || 0,
              t10Morale: playerData.t10Morale || 0,
              t10Protection: playerData.t10Protection || 0,
              t10Hp: playerData.t10Hp || 0,
              t10Atk: playerData.t10Atk || 0,
              t10Def: playerData.t10Def || 0,
              t10Elite: playerData.t10Elite || 0,
              techLevel: playerData.techLevel || 30,
              barracksLevel: playerData.barracksLevel || 30,
              tankCenterLevel: playerData.tankCenterLevel || 30,
              airCenterLevel: playerData.airCenterLevel || 30,
              missileCenterLevel: playerData.missileCenterLevel || 30,
              active: playerData.active ?? true,
              ...DEFAULT_STS, ...DEFAULT_DEFENSE, ...DEFAULT_MASTERY,
              ...playerData
          } as Player;
          local.push(updated);
      }
      saveLocalMockData('players', local);
      await AuditLogger.log(
          'MEMBER_UPDATE',
          `Updated Profile: ${updated.name} (1st Squad: ${((updated.firstSquadPower || 0) / 1000000).toFixed(1)}M, Total Hero: ${((updated.totalHeroPower || 0) / 1000000).toFixed(1)}M)`,
          updated.name || 'Commander',
          {
              id: updated.id,
              name: updated.name,
              language: updated.language,
              firstSquadPower: updated.firstSquadPower,
              totalHeroPower: updated.totalHeroPower,
              updatedAt: updated.updatedAt
          }
      );
      return { success: true, data: updated };
  },

  login: async (username: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    const now = Date.now();
    if (lockoutExpiry > now) {
      const waitMinutes = Math.ceil((lockoutExpiry - now) / 60000);
      return { 
        success: false, 
        error: `SECURITY LOCKOUT: Too many failed attempts. Try again in ${waitMinutes} min.` 
      };
    }

    // Artificial delay to neutralize timing side-channel attacks and brute-force bots
    await new Promise(r => setTimeout(r, 500));

    const hashedInput = await hashPasswordInput(password || '');
    if (hashedInput === ADMIN_PASSWORD_HASH) {
      loginAttempts = 0;
      lockoutExpiry = 0;
      const token = `asn1_sec_${crypto.randomUUID()}_${Date.now()}`;
      AuditLogger.log('LOGIN', 'Master Admin Logged In Successfully', 'Master Admin', { username: username || 'Admin' });
      return { success: true, data: { token, alliance: MOCK_ALLIANCE } };
    }

    loginAttempts++;
    AuditLogger.log('LOGIN', `Failed Admin Password Attempt (Attempt ${loginAttempts}/5)`, 'Unknown Guest', { username: username || 'Guest' });
    if (loginAttempts >= 5) {
      lockoutExpiry = Date.now() + 15 * 60 * 1000; // 15 minute lockout
      AuditLogger.log('LOGIN', 'Terminal Locked Out (5 Failed Attempts)', 'Security Guard');
      return { 
        success: false, 
        error: 'ACCESS DENIED: 5 failed attempts reached. Terminal locked for 15 minutes.' 
      };
    }

    const remaining = 5 - loginAttempts;
    return { 
      success: false, 
      error: `ACCESS DENIED: Invalid password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` 
    };
  },

  logout: async () => { localStorage.removeItem('asn1_auth_token'); },

  adminUpdatePlayer: async (id: string, updates: Partial<Player>): Promise<ApiResponse<Player>> => {
    AuditLogger.log('MEMBER_UPDATE', `Admin modified profile for Commander ${updates.name || id}`, 'Master Admin', { updates });
    try {
        const payload = mapPlayerToDb(updates);
        const { data, error } = await supabase.from('players').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return { success: true, data: mapPlayerFromDb(data) };
    } catch (e: any) {
        const local = getLocalMockData<Player[]>('players', INITIAL_MOCK_PLAYERS);
        const idx = local.findIndex(p => p.id === id);
        if (idx === -1) return { success: false, error: "Mock ID not found" };
        local[idx] = { ...local[idx], ...updates, updatedAt: new Date().toISOString() } as Player;
        saveLocalMockData('players', local);
        return { success: true, data: local[idx] };
    }
  },

  adminDeletePlayer: async (id: string): Promise<ApiResponse<void>> => {
    AuditLogger.log('MEMBER_UPDATE', `Admin deleted Commander ID ${id}`, 'Master Admin');
    try {
        await supabase.from('players').delete().eq('id', id);
        return { success: true };
    } catch (e) {
        const local = getLocalMockData<Player[]>('players', INITIAL_MOCK_PLAYERS);
        saveLocalMockData('players', local.filter(p => p.id !== id));
        return { success: true };
    }
  },

  getSettings: async (): Promise<Record<string, any>> => {
    const defaultSettings = { show_train_schedule: true, show_desert_storm: true, allow_storm_registration: true, lock_roster_editing: false };
    const local = getLocalMockData<Record<string, any>>('settings', defaultSettings);
    try {
      const { data } = await supabase.from('alliance_settings').select('*');
      if (data && data.length > 0) {
        const settings: Record<string, any> = {};
        data.forEach(row => { settings[row.setting_name] = row.value; });
        return { ...defaultSettings, ...local, ...settings };
      }
      return { ...defaultSettings, ...local };
    } catch (e) { 
      return { ...defaultSettings, ...local }; 
    }
  },

  updateSetting: async (key: string, value: any): Promise<void> => {
    AuditLogger.log('SYSTEM_SETTINGS', `Toggled System Protocol [${key}] to ${value ? 'ON' : 'OFF'}`, 'Master Admin');
    const local = getLocalMockData<Record<string, any>>('settings', { show_train_schedule: true, show_desert_storm: true, allow_storm_registration: true, lock_roster_editing: false });
    local[key] = value;
    saveLocalMockData('settings', local);
    try {
        await supabase.from('alliance_settings').upsert({ setting_name: key, value, updated_at: new Date().toISOString() });
    } catch (e) {}
  },

  // Snapshot & Backup Management
  createSnapshot: async (label: string): Promise<RosterSnapshot> => {
    const playersRes = await MockApi.getPlayers({ search: '', language: 'all', sort: 'power_desc', activeOnly: false });
    const players = playersRes.items;
    const newSnapshot: RosterSnapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      label: label.trim() || `Roster Backup (${new Date().toLocaleDateString()})`,
      createdAt: new Date().toISOString(),
      playerCount: players.length,
      players
    };

    const currentSnaps = getLocalMockData<RosterSnapshot[]>('roster_snapshots', []);
    const updatedSnaps = [newSnapshot, ...currentSnaps];
    saveLocalMockData('roster_snapshots', updatedSnaps);

    AuditLogger.log('SYSTEM_SETTINGS', `Created Roster Snapshot "${newSnapshot.label}" (${players.length} Commanders)`, 'Master Admin');
    return newSnapshot;
  },

  getSnapshots: async (): Promise<RosterSnapshot[]> => {
    return getLocalMockData<RosterSnapshot[]>('roster_snapshots', []);
  },

  restoreSnapshot: async (snapshotId: string): Promise<ApiResponse<void>> => {
    const snaps = getLocalMockData<RosterSnapshot[]>('roster_snapshots', []);
    const target = snaps.find(s => s.id === snapshotId);
    if (!target) return { success: false, error: 'Snapshot not found' };

    // Save current state as auto-backup before restoring
    const currentRes = await MockApi.getPlayers({ search: '', language: 'all', sort: 'power_desc', activeOnly: false });
    if (currentRes.items.length > 0) {
      const autoBackup: RosterSnapshot = {
        id: `auto_snap_${Date.now()}`,
        label: `Auto-Backup before Restore (${new Date().toLocaleTimeString()})`,
        createdAt: new Date().toISOString(),
        playerCount: currentRes.items.length,
        players: currentRes.items
      };
      saveLocalMockData('roster_snapshots', [autoBackup, ...snaps]);
    }

    // Overwrite local players
    saveLocalMockData('players', target.players);

    // Sync to Supabase
    try {
      for (const player of target.players) {
        const payload = mapPlayerToDb(player);
        await supabase.from('players').upsert(payload);
      }
    } catch (e) {}

    AuditLogger.log('SYSTEM_SETTINGS', `RESTORED Roster Snapshot "${target.label}" (${target.playerCount} Commanders restored)`, 'Master Admin');
    return { success: true };
  },

  deleteSnapshot: async (snapshotId: string): Promise<RosterSnapshot[]> => {
    const snaps = getLocalMockData<RosterSnapshot[]>('roster_snapshots', []);
    const filtered = snaps.filter(s => s.id !== snapshotId);
    saveLocalMockData('roster_snapshots', filtered);
    return filtered;
  },

  exportRosterBackup: async (): Promise<void> => {
    const playersRes = await MockApi.getPlayers({ search: '', language: 'all', sort: 'power_desc', activeOnly: false });
    const backupObj = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      playerCount: playersRes.items.length,
      players: playersRes.items
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `asn1_alliance_roster_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    AuditLogger.log('SYSTEM_SETTINGS', `Exported Full JSON Roster Backup (${playersRes.items.length} Commanders)`, 'Master Admin');
  },

  importRosterBackup: async (jsonContent: string): Promise<ApiResponse<number>> => {
    try {
      const parsed = JSON.parse(jsonContent);
      const players = Array.isArray(parsed) ? parsed : (parsed.players || []);
      if (!Array.isArray(players) || players.length === 0) {
        return { success: false, error: 'INVALID BACKUP FILE: No valid player records found in JSON.' };
      }

      // Auto-backup current state
      const currentRes = await MockApi.getPlayers({ search: '', language: 'all', sort: 'power_desc', activeOnly: false });
      if (currentRes.items.length > 0) {
        const autoBackup: RosterSnapshot = {
          id: `auto_snap_pre_import_${Date.now()}`,
          label: `Auto-Backup before JSON Import (${new Date().toLocaleTimeString()})`,
          createdAt: new Date().toISOString(),
          playerCount: currentRes.items.length,
          players: currentRes.items
        };
        const currentSnaps = getLocalMockData<RosterSnapshot[]>('roster_snapshots', []);
        saveLocalMockData('roster_snapshots', [autoBackup, ...currentSnaps]);
      }

      saveLocalMockData('players', players);

      try {
        for (const player of players) {
          const payload = mapPlayerToDb(player);
          await supabase.from('players').upsert(payload);
        }
      } catch (e) {}

      AuditLogger.log('SYSTEM_SETTINGS', `Imported Roster Backup from File (${players.length} Commanders restored)`, 'Master Admin');
      return { success: true, data: players.length };
    } catch (e: any) {
      return { success: false, error: 'JSON PARSE ERROR: Invalid file format.' };
    }
  },

  checkAndTriggerAutoBackup: async (force: boolean = false): Promise<boolean> => {
    try {
      const lastBackupStr = localStorage.getItem('asn1_last_auto_backup');
      const now = Date.now();
      const FOUR_HOURS = 4 * 60 * 60 * 1000;
      
      if (force || !lastBackupStr || (now - parseInt(lastBackupStr, 10)) > FOUR_HOURS) {
        const playersRes = await MockApi.getPlayers({ search: '', language: 'all', sort: 'power_desc', activeOnly: false });
        if (playersRes.items && playersRes.items.length > 0) {
          const nowObj = new Date();
          const timeLabel = `${nowObj.toLocaleDateString()} ${nowObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
          const autoSnap: RosterSnapshot = {
            id: `auto_snap_${now}`,
            label: `🤖 Auto Protection Snapshot (${timeLabel})`,
            createdAt: nowObj.toISOString(),
            playerCount: playersRes.items.length,
            players: playersRes.items
          };
          
          const currentSnaps = getLocalMockData<RosterSnapshot[]>('roster_snapshots', []);
          const updatedSnaps = [autoSnap, ...currentSnaps].slice(0, 25);
          saveLocalMockData('roster_snapshots', updatedSnaps);
          localStorage.setItem('asn1_last_auto_backup', now.toString());
          
          AuditLogger.log(
            'SYSTEM_SETTINGS',
            `🤖 Automated Data Protection Backup Created (${playersRes.items.length} Commanders safeguarded)`,
            'System Guardian'
          );
          return true;
        }
      }
    } catch (e) {}
    return false;
  },

  restoreFromVault: async (): Promise<ApiResponse<number>> => {
    try {
      const vaultData = localStorage.getItem('asn1_vault_players');
      if (!vaultData) {
        return { success: false, error: 'VAULT EMPTY: No fail-safe vault backup found.' };
      }
      const players = JSON.parse(vaultData);
      if (!Array.isArray(players) || players.length === 0) {
        return { success: false, error: 'VAULT CORRUPTED: Vault data contains no commanders.' };
      }

      saveLocalMockData('players', players);
      try {
        for (const p of players) {
          await supabase.from('players').upsert(mapPlayerToDb(p));
        }
      } catch (e) {}

      AuditLogger.log('SYSTEM_SETTINGS', `🛡️ Emergency Vault Recovery Restored (${players.length} Commanders)`, 'Master Admin');
      return { success: true, data: players.length };
    } catch (e: any) {
      return { success: false, error: e.message || 'Vault recovery failed' };
    }
  }

};

export const VsApi = {
  getWeeks: async (): Promise<VsWeek[]> => {
      try {
          const { data } = await supabase.from('vs_weeks').select('*').order('created_at', { ascending: false });
          return (data || []).map((w: any) => ({ id: w.id, allianceId: w.alliance_id || 'asn1', name: w.name, createdAt: w.created_at }));
      } catch (e) { return []; }
  },
  createWeek: async (name: string): Promise<VsWeek> => {
    const { data } = await supabase.from('vs_weeks').insert({ name, alliance_id: 'asn1' }).select().single();
    return { id: data.id, allianceId: data.alliance_id || 'asn1', name: data.name, createdAt: data.created_at };
  },
  getRecords: async (weekId: string): Promise<VsRecord[]> => {
      const { data } = await supabase.from('vs_records').select('*').eq('week_id', weekId);
      return (data || []).map((r: any) => ({
        id: r.id, weekId: r.week_id, allianceId: r.alliance_id || 'asn1', playerName: r.player_name,
        mon: r.mon, tue: r.tue, wed: r.wed, thu: r.thu, fri: r.fri, sat: r.sat, total: r.total
      }));
  },
  addPlayerToWeek: async (weekId: string, playerName: string) => {
    await supabase.from('vs_records').insert({ week_id: weekId, player_name: playerName, alliance_id: 'asn1' });
  },
  updateRecord: async (record: VsRecord) => {
    const total = (record.mon || 0) + (record.tue || 0) + (record.wed || 0) + (record.thu || 0) + (record.fri || 0) + (record.sat || 0);
    await supabase.from('vs_records').update({ mon: record.mon, tue: record.tue, wed: record.wed, thu: record.thu, fri: record.fri, sat: record.sat, total }).eq('id', record.id);
  }
};

export const TrainApi = {
    getSchedule: async () => {
        const { data } = await supabase.from('train_schedule').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
        return data?.schedule_data || null;
    },
    saveSchedule: async (data: any) => {
        AuditLogger.log('TRAIN_SCHEDULE', 'Updated Public Train Schedule Roster', 'Master Admin');
        await supabase.from('train_schedule').insert({ schedule_data: data });
    }
};

export const DesertStormApi = {
    getWeeks: async (): Promise<DesertStormWeek[]> => {
        let weeks: DesertStormWeek[] = [];
        try {
            const { data } = await supabase.from('desert_storm_weeks').select('*').order('week_number', { ascending: false });
            if (data && data.length > 0) {
                weeks = data.map((w: any) => ({
                    id: w.id,
                    allianceId: w.alliance_id || 'asn1',
                    weekNumber: w.week_number || 1,
                    name: w.name || `Week ${w.week_number || 1}`,
                    createdAt: w.created_at || new Date().toISOString(),
                    isCurrent: !!w.is_current,
                    teams: w.teams || { teamAMain: [], teamASubs: [], teamBMain: [], teamBSubs: [] },
                    participation: w.participation || {}
                }));
            }
        } catch (e) {}

        if (weeks.length === 0) {
            const local = getLocalMockData<DesertStormWeek[]>('desert_storm_weeks', [
                {
                    id: 'ds_w1',
                    allianceId: 'asn1',
                    weekNumber: 1,
                    name: 'Week 1',
                    createdAt: new Date().toISOString(),
                    isCurrent: true,
                    teams: { teamAMain: [], teamASubs: [], teamBMain: [], teamBSubs: [] },
                    participation: {}
                }
            ]);
            weeks = local;
        }

        // Ensure at least one current week is set
        if (!weeks.some(w => w.isCurrent) && weeks.length > 0) {
            weeks[0].isCurrent = true;
        }

        return weeks;
    },

    getCurrentWeek: async (): Promise<DesertStormWeek> => {
        const weeks = await DesertStormApi.getWeeks();
        return weeks.find(w => w.isCurrent) || weeks[0];
    },

    saveWeek: async (week: DesertStormWeek): Promise<void> => {
        const local = getLocalMockData<DesertStormWeek[]>('desert_storm_weeks', []);
        const idx = local.findIndex(w => w.id === week.id);
        if (idx >= 0) local[idx] = week;
        else local.unshift(week);
        saveLocalMockData('desert_storm_weeks', local);

        try {
            await supabase.from('desert_storm_weeks').upsert({
                id: week.id,
                alliance_id: week.allianceId || 'asn1',
                week_number: week.weekNumber,
                name: week.name,
                created_at: week.createdAt,
                is_current: week.isCurrent,
                teams: week.teams,
                participation: week.participation
            });
        } catch (e) {}
    },

    startNewWeek: async (customName?: string): Promise<DesertStormWeek> => {
        const weeks = await DesertStormApi.getWeeks();
        weeks.forEach(w => { w.isCurrent = false; });

        const maxNum = weeks.reduce((max, w) => Math.max(max, w.weekNumber || 0), 0);
        const nextNum = maxNum + 1;
        
        const newWeek: DesertStormWeek = {
            id: `ds_w${nextNum}_${Date.now()}`,
            allianceId: 'asn1',
            weekNumber: nextNum,
            name: customName || `Week ${nextNum}`,
            createdAt: new Date().toISOString(),
            isCurrent: true,
            teams: { teamAMain: [], teamASubs: [], teamBMain: [], teamBSubs: [] },
            participation: {}
        };

        weeks.unshift(newWeek);
        saveLocalMockData('desert_storm_weeks', weeks);

        try {
            await supabase.from('desert_storm_weeks').update({ is_current: false }).neq('id', newWeek.id);
            await supabase.from('desert_storm_weeks').insert({
                id: newWeek.id,
                alliance_id: 'asn1',
                week_number: newWeek.weekNumber,
                name: newWeek.name,
                created_at: newWeek.createdAt,
                is_current: true,
                teams: newWeek.teams,
                participation: newWeek.participation
            });
        } catch (e) {}

        // Reset weekly registrations for the new week
        await DesertStormApi.resetRegistrations(newWeek.id);
        AuditLogger.log('DESERT_STORM', `Created Desert Storm Week ${newWeek.weekNumber} (${newWeek.name})`, 'Master Admin');

        return newWeek;
    },

    resetRegistrations: async (weekId?: string): Promise<void> => {
        let activeWeekId = weekId;
        if (!activeWeekId) {
            const current = await DesertStormApi.getCurrentWeek();
            activeWeekId = current?.id;
        }

        AuditLogger.log('DESERT_STORM', `Reset Applications for Week ${activeWeekId || 'All'}`, 'Master Admin');

        const local = getLocalMockData<DesertStormRegistration[]>('desert_storm_registrations', []);
        if (activeWeekId) {
            const filtered = local.filter(r => r.weekId && r.weekId !== activeWeekId);
            saveLocalMockData('desert_storm_registrations', filtered);
        } else {
            saveLocalMockData('desert_storm_registrations', []);
        }

        try {
            if (activeWeekId) {
                await supabase.from('desert_storm_registrations').delete().eq('week_id', activeWeekId);
                await supabase.from('desert_storm_registrations').delete().is('week_id', null);
            } else {
                await supabase.from('desert_storm_registrations').delete().neq('id', 'keep_schema_valid');
            }
        } catch (e) {}
    },

    getTeams: async () => {
        const current = await DesertStormApi.getCurrentWeek();
        return current?.teams || { teamAMain: [], teamASubs: [], teamBMain: [], teamBSubs: [] };
    },

    saveTeams: async (teams: any, participation?: Record<string, PlayerRoleInWeek>) => {
        const current = await DesertStormApi.getCurrentWeek();
        if (current) {
            current.teams = teams;
            if (participation) {
                current.participation = participation;
            } else {
                // Default participation mapping if not explicitly provided
                const part: Record<string, PlayerRoleInWeek> = { ...current.participation };
                teams.teamAMain?.forEach((id: string) => { part[id] = part[id] || 'MAIN'; });
                teams.teamBMain?.forEach((id: string) => { part[id] = part[id] || 'MAIN'; });
                teams.teamASubs?.forEach((id: string) => { part[id] = part[id] || 'SUB'; });
                teams.teamBSubs?.forEach((id: string) => { part[id] = part[id] || 'SUB'; });
                current.participation = part;
            }
            await DesertStormApi.saveWeek(current);
        }
    },

    register: async (playerId: string, preference: string, weekId?: string) => {
        let activeWeekId = weekId;
        if (!activeWeekId) {
            const current = await DesertStormApi.getCurrentWeek();
            activeWeekId = current?.id || 'default_week';
        }

        const local = getLocalMockData<DesertStormRegistration[]>('desert_storm_registrations', []);
        const filtered = local.filter(r => !(r.playerId === playerId && (r.weekId === activeWeekId || !r.weekId)));
        const newReg: DesertStormRegistration = {
            id: `reg_${Date.now()}`,
            playerId,
            preference,
            createdAt: new Date().toISOString(),
            weekId: activeWeekId
        };
        filtered.push(newReg);
        saveLocalMockData('desert_storm_registrations', filtered);

        try {
            await supabase.from('desert_storm_registrations').delete().eq('player_id', playerId).eq('week_id', activeWeekId);
            await supabase.from('desert_storm_registrations').delete().eq('player_id', playerId).is('week_id', null);
            await supabase.from('desert_storm_registrations').insert({
                player_id: playerId,
                preference,
                week_id: activeWeekId
            });
        } catch (e) {
            try {
                await supabase.from('desert_storm_registrations').delete().eq('player_id', playerId);
                await supabase.from('desert_storm_registrations').insert({ player_id: playerId, preference });
            } catch (err) {}
        }

        AuditLogger.log('DESERT_STORM', `Commander Registered for Desert Storm (${preference})`, playerId, { preference, weekId: activeWeekId });
    },

    deleteWeek: async (weekId: string): Promise<DesertStormWeek[]> => {
        let local = getLocalMockData<DesertStormWeek[]>('desert_storm_weeks', []);
        local = local.filter(w => w.id !== weekId);
        
        // Ensure at least one remaining week is set as current if needed
        if (local.length > 0 && !local.some(w => w.isCurrent)) {
            local[0].isCurrent = true;
        }
        saveLocalMockData('desert_storm_weeks', local);

        try {
            await supabase.from('desert_storm_weeks').delete().eq('id', weekId);
            if (local.length > 0 && local[0].isCurrent) {
                await supabase.from('desert_storm_weeks').update({ is_current: true }).eq('id', local[0].id);
            }
        } catch (e) {}

        // Also clean up registrations for deleted week
        await DesertStormApi.resetRegistrations(weekId);

        return DesertStormApi.getWeeks();
    },

    getRegistrations: async (weekId?: string): Promise<DesertStormRegistration[]> => {
        let activeWeekId = weekId;
        if (!activeWeekId) {
            const current = await DesertStormApi.getCurrentWeek();
            activeWeekId = current?.id;
        }

        let allRegs: DesertStormRegistration[] = [];

        try {
            const { data } = await supabase.from('desert_storm_registrations').select('*');
            if (data && data.length > 0) {
                allRegs = data.map((r: any) => ({
                    id: r.id,
                    playerId: r.player_id,
                    preference: r.preference,
                    createdAt: r.created_at,
                    weekId: r.week_id
                }));
            }
        } catch (e) {}

        if (allRegs.length === 0) {
            allRegs = getLocalMockData<DesertStormRegistration[]>('desert_storm_registrations', []);
        }

        if (!activeWeekId) return allRegs;

        return allRegs.filter(r => r.weekId === activeWeekId);
    }
};