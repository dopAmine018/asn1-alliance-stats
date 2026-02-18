import { createClient } from '@supabase/supabase-js';
import { Player, PlayerFilter, ApiResponse, AuthResponse, VsWeek, VsRecord, Announcement, Alliance, DesertStormRegistration } from '../types';

const PROVIDED_URL = "https://akmsbujnguptxdgxdqbp.supabase.co";
const PROVIDED_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrbXNidWpuZ3VwdHhkZ3hkcWJwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTAxNTM4OSwiZXhwIjoyMDg2NTkxMzg5fQ.uoGB8zvudc1O8J18_3V03L_fhr_G5zlFGEXCbRK79Gc";

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

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || getEnv('REACT_APP_SUPABASE_URL') || PROVIDED_URL;
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('REACT_APP_SUPABASE_ANON_KEY') || PROVIDED_KEY;

const supabase = createClient(supabaseUrl.trim(), supabaseKey.trim(), {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const MOCK_ALLIANCE: Alliance = {
  id: 'gun1',
  tag: 'GUN1',
  name: 'GUN 1 Alliance',
  adminPass: 'GUN1ADMIN@',
  createdAt: '2025-01-01T00:00:00.000Z'
};

const DEFAULT_STS = {
  stsPowerBoost1: 0, stsFinalStand1: 0, stsFierceAssault1: 0, stsVigilantFormation1: 0,
  stsExtraDrillGround: 0, stsBarrackExpansion1: 0, stsFocusedTraining1: 0,
  stsFinalStand2: 0, stsFierceAssault2: 0, stsVigilantFormation2: 0,
  stsDrillGroundExpansion: 0, stsRapidMarch1: 0,
  stsFinalStand3: 0, stsFierceAssault3: 0, stsVigilantFormation3: 0, stsFatalStrike1: 0
};

const INITIAL_MOCK_PLAYERS: Player[] = [
    { id: 'm1', allianceId: 'gun1', ...DEFAULT_STS, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), language: 'english', name: 'imAYAD', nameNormalized: 'imayad', firstSquadPower: 23200000, totalHeroPower: 18500000, heroPercent: 92, duelPercent: 88, unitsPercent: 85, t10Morale: 10, t10Protection: 10, t10Hp: 10, t10Atk: 10, t10Def: 10, t10Elite: 10, techLevel: 35, barracksLevel: 35, tankCenterLevel: 35, airCenterLevel: 35, missileCenterLevel: 35, active: true },
    { id: 'm2', allianceId: 'gun1', ...DEFAULT_STS, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), language: 'turkish', name: 'TuyuLL', nameNormalized: 'tuyull', firstSquadPower: 23000000, totalHeroPower: 18100000, heroPercent: 90, duelPercent: 85, unitsPercent: 82, t10Morale: 10, t10Protection: 10, t10Hp: 10, t10Atk: 10, t10Def: 10, t10Elite: 10, techLevel: 35, barracksLevel: 35, tankCenterLevel: 35, airCenterLevel: 35, missileCenterLevel: 35, active: true },
];

const getLocalMockData = <T>(key: string, initial: T): T => {
    const saved = localStorage.getItem(`asn1_mock_${key}`);
    return saved ? JSON.parse(saved) : initial;
};

const saveLocalMockData = (key: string, data: any) => {
    localStorage.setItem(`asn1_mock_${key}`, JSON.stringify(data));
};

const formatError = (err: any): string => {
  if (!err) return "Unknown database error";
  if (typeof err === 'string') return err;
  return err.message || err.details || "Database transaction failed";
};

const mapPlayerFromDb = (row: any): Player => ({
  id: row.id,
  allianceId: row.alliance_id || 'gun1',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  language: row.language,
  name: row.name,
  nameNormalized: row.name_normalized,
  firstSquadPower: row.first_squad_power,
  secondSquadPower: row.second_squad_power,
  thirdSquadPower: row.third_squad_power,
  fourthSquadPower: row.fourth_squad_power,
  totalHeroPower: row.total_hero_power,
  heroPercent: row.hero_percent,
  duelPercent: row.duel_percent,
  unitsPercent: row.units_percent,
  t10Morale: row.t10_morale,
  t10Protection: row.t10_protection,
  t10Hp: row.t10_hp,
  t10Atk: row.t10_atk,
  t10Def: row.t10_def,
  t10Elite: row.t10_elite || 0,
  stsPowerBoost1: row.sts_power_boost_1 || 0,
  stsFinalStand1: row.sts_final_stand_1 || 0,
  stsFierceAssault1: row.sts_fierce_assault_1 || 0,
  stsVigilantFormation1: row.sts_vigilant_formation_1 || 0,
  stsExtraDrillGround: row.sts_extra_drill_ground || 0,
  stsBarrackExpansion1: row.sts_barrack_expansion_1 || 0,
  stsFocusedTraining1: row.sts_focused_training_1 || 0,
  stsFinalStand2: row.sts_final_stand_2 || 0,
  stsFierceAssault2: row.sts_fierce_assault_2 || 0,
  stsVigilantFormation2: row.sts_vigilant_formation_2 || 0,
  stsDrillGroundExpansion: row.sts_drill_ground_expansion || 0,
  stsRapidMarch1: row.sts_rapid_march_1 || 0,
  stsFinalStand3: row.sts_final_stand_3 || 0,
  stsFierceAssault3: row.sts_fierce_assault_3 || 0,
  stsVigilantFormation3: row.sts_vigilant_formation_3 || 0,
  stsFatalStrike1: row.sts_fatal_strike_1 || 0,
  techLevel: row.tech_level,
  barracksLevel: row.barracks_level,
  tankCenterLevel: row.tank_center_level,
  airCenterLevel: row.air_center_level,
  missileCenterLevel: row.missile_center_level,
  active: row.active
});

const mapPlayerToDb = (p: Partial<Player>) => {
  const out: any = {};
  if (p.name) out.name = p.name;
  if (p.nameNormalized) out.name_normalized = p.nameNormalized;
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
  if (p.stsPowerBoost1 !== undefined) out.sts_power_boost_1 = p.stsPowerBoost1;
  if (p.stsFinalStand1 !== undefined) out.sts_final_stand_1 = p.stsFinalStand1;
  if (p.stsFierceAssault1 !== undefined) out.sts_fierce_assault_1 = p.stsFierceAssault1;
  if (p.stsVigilantFormation1 !== undefined) out.sts_vigilant_formation_1 = p.stsVigilantFormation1;
  if (p.stsExtraDrillGround !== undefined) out.sts_extra_drill_ground = p.stsExtraDrillGround;
  if (p.stsBarrackExpansion1 !== undefined) out.sts_barrack_expansion_1 = p.stsBarrackExpansion1;
  if (p.stsFocusedTraining1 !== undefined) out.sts_focused_training_1 = p.stsFocusedTraining1;
  if (p.stsFinalStand2 !== undefined) out.sts_final_stand_2 = p.stsFinalStand2;
  if (p.stsFierceAssault2 !== undefined) out.sts_fierce_assault_2 = p.stsFierceAssault2;
  if (p.stsVigilantFormation2 !== undefined) out.sts_vigilant_formation_2 = p.stsVigilantFormation2;
  if (p.stsDrillGroundExpansion !== undefined) out.sts_drill_ground_expansion = p.stsDrillGroundExpansion;
  if (p.stsRapidMarch1 !== undefined) out.sts_rapid_march_1 = p.stsRapidMarch1;
  if (p.stsFinalStand3 !== undefined) out.sts_final_stand_3 = p.stsFinalStand3;
  if (p.stsFierceAssault3 !== undefined) out.sts_fierce_assault_3 = p.stsFierceAssault3;
  if (p.stsVigilantFormation3 !== undefined) out.sts_vigilant_formation_3 = p.stsVigilantFormation3;
  if (p.stsFatalStrike1 !== undefined) out.sts_fatal_strike_1 = p.stsFatalStrike1;
  if (p.techLevel !== undefined) out.tech_level = p.techLevel;
  if (p.barracksLevel !== undefined) out.barracks_level = p.barracksLevel;
  if (p.tankCenterLevel !== undefined) out.tank_center_level = p.tankCenterLevel;
  if (p.airCenterLevel !== undefined) out.air_center_level = p.airCenterLevel;
  if (p.missileCenterLevel !== undefined) out.missile_center_level = p.missileCenterLevel;
  if (p.active !== undefined) out.active = p.active;
  out.updated_at = new Date().toISOString();
  return out;
};

export const MockApi = {
  initialize: () => console.log("Uplink Established"),

  getPlayers: async (filter: PlayerFilter): Promise<{ items: Player[]; total: number }> => {
      try {
          let query = supabase.from('players').select('*', { count: 'exact' });
          if (filter.activeOnly) query = query.eq('active', true);
          if (filter.language !== 'all') query = query.eq('language', filter.language);
          if (filter.search) query = query.ilike('name_normalized', `%${filter.search}%`);
          
          if (filter.sort === 'power_desc') query = query.order('first_squad_power', { ascending: false });
          else if (filter.sort === 'power_asc') query = query.order('first_squad_power', { ascending: true });
          else if (filter.sort === 'total_hero_power_desc') query = query.order('total_hero_power', { ascending: false });
          else query = query.order('updated_at', { ascending: false });
          
          const { data, count, error } = await query.range(0, 9999);
          if (error) throw error;
          return { items: (data || []).map(mapPlayerFromDb), total: count || 0 };
      } catch (e: any) {
          const local = getLocalMockData<Player[]>('players', INITIAL_MOCK_PLAYERS);
          let filtered = local;
          if (filter.activeOnly) filtered = filtered.filter(p => p.active);
          if (filter.language !== 'all') filtered = filtered.filter(p => p.language === filter.language);
          if (filter.search) filtered = filtered.filter(p => p.nameNormalized.includes(filter.search.toLowerCase()));
          return { items: filtered, total: filtered.length };
      }
  },

  upsertPlayer: async (playerData: Partial<Player>): Promise<ApiResponse<Player>> => {
      const nameNormalized = playerData.name?.trim().toLowerCase().replace(/\s+/g, ' ') || '';
      try {
          const { data: existingMatch } = await supabase.from('players').select('id').eq('name_normalized', nameNormalized).maybeSingle();
          const payload = mapPlayerToDb({ ...playerData, nameNormalized });
          let result;
          if (existingMatch) result = await supabase.from('players').update(payload).eq('id', existingMatch.id).select().single();
          else result = await supabase.from('players').insert(payload).select().single();
          if (result.error) throw result.error;
          return { success: true, data: mapPlayerFromDb(result.data) };
      } catch (e: any) {
          const local = getLocalMockData<Player[]>('players', INITIAL_MOCK_PLAYERS);
          const idx = local.findIndex(p => p.nameNormalized === nameNormalized);
          const newPlayer: Player = {
              ...(idx >= 0 ? local[idx] : { id: 'm' + Date.now(), createdAt: new Date().toISOString() }),
              ...playerData,
              updatedAt: new Date().toISOString(),
              nameNormalized
          } as Player;
          if (idx >= 0) local[idx] = newPlayer; else local.push(newPlayer);
          saveLocalMockData('players', local);
          return { success: true, data: newPlayer };
      }
  },

  login: async (username: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    if (password === 'GUN1ADMIN@') return { success: true, data: { token: 'mock-token', alliance: MOCK_ALLIANCE } };
    return { success: false, error: 'Access Denied' };
  },

  logout: async () => { localStorage.removeItem('asn1_auth_token'); },

  adminUpdatePlayer: async (id: string, updates: Partial<Player>): Promise<ApiResponse<Player>> => {
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
    try {
      const { data } = await supabase.from('alliance_settings').select('*');
      const settings: Record<string, any> = {};
      (data || []).forEach(row => { settings[row.setting_name] = row.value; });
      return settings;
    } catch (e) { return {}; }
  },

  updateSetting: async (key: string, value: any): Promise<void> => {
    try {
        await supabase.from('alliance_settings').upsert({ setting_name: key, value, updated_at: new Date().toISOString() });
    } catch (e) {}
  }
};

export const VsApi = {
  getWeeks: async (): Promise<VsWeek[]> => {
      try {
          const { data } = await supabase.from('vs_weeks').select('*').order('created_at', { ascending: false });
          return (data || []).map((w: any) => ({ id: w.id, allianceId: w.alliance_id || 'gun1', name: w.name, createdAt: w.created_at }));
      } catch (e) { return []; }
  },
  createWeek: async (name: string): Promise<VsWeek> => {
    const { data } = await supabase.from('vs_weeks').insert({ name, alliance_id: 'gun1' }).select().single();
    return { id: data.id, allianceId: data.alliance_id, name: data.name, createdAt: data.created_at };
  },
  getRecords: async (weekId: string): Promise<VsRecord[]> => {
      const { data } = await supabase.from('vs_records').select('*').eq('week_id', weekId);
      return (data || []).map((r: any) => ({
        id: r.id, weekId: r.week_id, allianceId: r.alliance_id || 'gun1', playerName: r.player_name,
        mon: r.mon, tue: r.tue, wed: r.wed, thu: r.thu, fri: r.fri, sat: r.sat, total: r.total
      }));
  },
  addPlayerToWeek: async (weekId: string, playerName: string) => {
    await supabase.from('vs_records').insert({ week_id: weekId, player_name: playerName, alliance_id: 'gun1' });
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
        await supabase.from('train_schedule').insert({ schedule_data: data });
    }
};

export const DesertStormApi = {
    getTeams: async () => {
        const { data } = await supabase.from('desert_storm_teams').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
        return data?.team_data || null;
    },
    saveTeams: async (data: any) => {
        await supabase.from('desert_storm_teams').insert({ team_data: data });
    },
    register: async (playerId: string, preference: string) => {
        await supabase.from('desert_storm_registrations').delete().eq('player_id', playerId);
        await supabase.from('desert_storm_registrations').insert({ player_id: playerId, preference });
    },
    getRegistrations: async (): Promise<DesertStormRegistration[]> => {
        const { data } = await supabase.from('desert_storm_registrations').select('*');
        return (data || []).map((r: any) => ({ id: r.id, playerId: r.player_id, preference: r.preference, createdAt: r.created_at }));
    }
};