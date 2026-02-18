import { createClient } from '@supabase/supabase-js';
import { Player, PlayerFilter, ApiResponse, AuthResponse, VsWeek, VsRecord, Announcement } from '../types';

const PROVIDED_URL = "https://fgrzuylyxfogejwmeakn.supabase.co";
const PROVIDED_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncnp1eWx5eGZvZ2Vqd21lYWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMjYxMjQsImV4cCI6MjA4MDcwMjEyNH0.-8XkyWwjZIkC3OPrRfNs8vmnRtauee0H2xFz_A0doy8";

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

// --- TACTICAL MOCK FALLBACK DATA ---
const INITIAL_MOCK_PLAYERS: Player[] = [
    { id: 'm1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), language: 'english', name: 'imAYAD', nameNormalized: 'imayad', firstSquadPower: 23200000, totalHeroPower: 18500000, heroPercent: 92, duelPercent: 88, unitsPercent: 85, t10Morale: 10, t10Protection: 10, t10Hp: 10, t10Atk: 10, t10Def: 10, t10Elite: 10, stsPowerBoost1: 0, stsFinalStand1: 0, stsFierceAssault1: 0, stsVigilantFormation1: 0, stsExtraDrillGround: 0, stsBarrackExpansion1: 0, stsFocusedTraining1: 0, stsFinalStand2: 0, stsFierceAssault2: 0, stsVigilantFormation2: 0, stsDrillGroundExpansion: 0, stsRapidMarch1: 0, stsFinalStand3: 0, stsFierceAssault3: 0, stsVigilantFormation3: 0, stsFatalStrike1: 0, techLevel: 35, barracksLevel: 35, tankCenterLevel: 35, airCenterLevel: 35, missileCenterLevel: 35, active: true },
    { id: 'm2', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), language: 'turkish', name: 'TuyuLL', nameNormalized: 'tuyull', firstSquadPower: 23000000, totalHeroPower: 18100000, heroPercent: 90, duelPercent: 85, unitsPercent: 82, t10Morale: 10, t10Protection: 10, t10Hp: 10, t10Atk: 10, t10Def: 10, t10Elite: 10, stsPowerBoost1: 0, stsFinalStand1: 0, stsFierceAssault1: 0, stsVigilantFormation1: 0, stsExtraDrillGround: 0, stsBarrackExpansion1: 0, stsFocusedTraining1: 0, stsFinalStand2: 0, stsFierceAssault2: 0, stsVigilantFormation2: 0, stsDrillGroundExpansion: 0, stsRapidMarch1: 0, stsFinalStand3: 0, stsFierceAssault3: 0, stsVigilantFormation3: 0, stsFatalStrike1: 0, techLevel: 35, barracksLevel: 35, tankCenterLevel: 35, airCenterLevel: 35, missileCenterLevel: 35, active: true },
    { id: 'm3', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), language: 'indonesian', name: 'Sukakamuturu', nameNormalized: 'sukakamuturu', firstSquadPower: 21300000, totalHeroPower: 16500000, heroPercent: 85, duelPercent: 80, unitsPercent: 78, t10Morale: 8, t10Protection: 9, t10Hp: 8, t10Atk: 8, t10Def: 8, t10Elite: 0, stsPowerBoost1: 0, stsFinalStand1: 0, stsFierceAssault1: 0, stsVigilantFormation1: 0, stsExtraDrillGround: 0, stsBarrackExpansion1: 0, stsFocusedTraining1: 0, stsFinalStand2: 0, stsFierceAssault2: 0, stsVigilantFormation2: 0, stsDrillGroundExpansion: 0, stsRapidMarch1: 0, stsFinalStand3: 0, stsFierceAssault3: 0, stsVigilantFormation3: 0, stsFatalStrike1: 0, techLevel: 32, barracksLevel: 32, tankCenterLevel: 32, airCenterLevel: 32, missileCenterLevel: 32, active: true }
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
  initialize: () => console.log("App initialized in Tactical Mode (Supabase Hybrid)"),

  getPlayers: async (filter: PlayerFilter): Promise<{ items: Player[]; total: number }> => {
      try {
          let query = supabase.from('players').select('*', { count: 'exact' });
          if (filter.activeOnly) query = query.eq('active', true);
          if (filter.language !== 'all') query = query.eq('language', filter.language);
          if (filter.search) query = query.ilike('name_normalized', `%${filter.search}%`);
          
          if (filter.sort === 'power_desc') query = query.order('first_squad_power', { ascending: false });
          else if (filter.sort === 'power_asc') query = query.order('first_squad_power', { ascending: true });
          else if (filter.sort === 'total_hero_power_desc') query = query.order('total_hero_power', { ascending: false });
          else if (filter.sort === 'time_asc') query = query.order('updated_at', { ascending: true });
          else query = query.order('updated_at', { ascending: false });
          
          const { data, count, error } = await query.range(0, 9999);
          if (error) throw new Error(formatError(error));
          return { items: (data || []).map(mapPlayerFromDb), total: count || 0 };
      } catch (e: any) {
          if (e.message?.includes('fetch') || e.name === 'TypeError') {
              console.warn("Project Unreachable. Switching to Tactical Mock Database.");
              const local = getLocalMockData<Player[]>('players', INITIAL_MOCK_PLAYERS);
              let filtered = local;
              if (filter.activeOnly) filtered = filtered.filter(p => p.active);
              if (filter.language !== 'all') filtered = filtered.filter(p => p.language === filter.language);
              if (filter.search) filtered = filtered.filter(p => p.nameNormalized.includes(filter.search.toLowerCase()));
              return { items: filtered, total: filtered.length };
          }
          throw e;
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
          if (e.message?.includes('fetch') || e.name === 'TypeError') {
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
          return { success: false, error: formatError(e) };
      }
  },

  login: async (username: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: username === 'admin' ? 'admin@admin.com' : username,
          password,
        });
        if (error) throw error;
        return { success: true, data: { token: data.session?.access_token || '', user: { username } } };
    } catch (e: any) {
        if (e.message?.includes('fetch') || e.name === 'TypeError') {
            if (password === 'ASN1-2024') return { success: true, data: { token: 'mock-token', user: { username } } };
            return { success: false, error: "Cloud unreachable. Use local access key." };
        }
        return { success: false, error: formatError(e) };
    }
  },

  logout: async () => {
    try { await supabase.auth.signOut(); } catch(e) {}
    localStorage.removeItem('asn1_auth_token');
  },

  adminUpdatePlayer: async (id: string, updates: Partial<Player>): Promise<ApiResponse<Player>> => {
    try {
        const payload = mapPlayerToDb(updates);
        const { data, error } = await supabase.from('players').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return { success: true, data: mapPlayerFromDb(data) };
    } catch (e: any) {
        if (e.message?.includes('fetch') || e.name === 'TypeError') {
            const local = getLocalMockData<Player[]>('players', INITIAL_MOCK_PLAYERS);
            const idx = local.findIndex(p => p.id === id);
            if (idx === -1) return { success: false, error: "Mock ID not found" };
            local[idx] = { ...local[idx], ...updates, updatedAt: new Date().toISOString() } as Player;
            saveLocalMockData('players', local);
            return { success: true, data: local[idx] };
        }
        return { success: false, error: formatError(e) };
    }
  },

  adminDeletePlayer: async (id: string): Promise<ApiResponse<void>> => {
    try {
        const { error } = await supabase.from('players').delete().eq('id', id);
        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        if (e.message?.includes('fetch') || e.name === 'TypeError') {
            const local = getLocalMockData<Player[]>('players', INITIAL_MOCK_PLAYERS);
            saveLocalMockData('players', local.filter(p => p.id !== id));
            return { success: true };
        }
        return { success: false, error: formatError(e) };
    }
  },

  getSettings: async (): Promise<Record<string, any>> => {
    try {
      const { data, error } = await supabase.from('alliance_settings').select('*');
      if (error) throw error;
      const settings: Record<string, any> = {};
      (data || []).forEach(row => { settings[row.setting_name] = row.value; });
      return settings;
    } catch (e: any) { 
        return getLocalMockData('settings', { show_train_schedule: true, show_desert_storm: true, allow_storm_registration: true });
    }
  },

  updateSetting: async (key: string, value: any): Promise<void> => {
    try {
        const { error } = await supabase.from('alliance_settings').upsert({ 
          setting_name: key, value, updated_at: new Date().toISOString() 
        }, { onConflict: 'setting_name' });
        if (error) throw error;
    } catch (e: any) {
        const local = getLocalMockData<any>('settings', {});
        local[key] = value;
        saveLocalMockData('settings', local);
    }
  },

  getAnnouncements: async (): Promise<Announcement[]> => {
    try {
        const { data } = await supabase.from('announcements').select('*').eq('active', true).order('created_at', { ascending: false });
        return (data || []).map((a: any) => ({
          id: a.id, content: a.content, type: a.type, active: a.active, createdAt: a.created_at
        }));
    } catch (e) { return []; }
  }
};

export const VsApi = {
  getWeeks: async (): Promise<VsWeek[]> => {
      try {
          const { data, error } = await supabase.from('vs_weeks').select('*').order('created_at', { ascending: false });
          if (error) throw error;
          return (data || []).map((w: any) => ({ id: w.id, name: w.name, createdAt: w.created_at }));
      } catch (e) { return getLocalMockData('vs_weeks', []); }
  },
  createWeek: async (name: string): Promise<VsWeek> => {
    try {
        const { data, error } = await supabase.from('vs_weeks').insert({ name }).select().single();
        if (error) throw error;
        return { id: data.id, name: data.name, createdAt: data.created_at };
    } catch (e) {
        const local = getLocalMockData<VsWeek[]>('vs_weeks', []);
        const nw = { id: 'v' + Date.now(), name, createdAt: new Date().toISOString() };
        local.push(nw);
        saveLocalMockData('vs_weeks', local);
        return nw;
    }
  },
  getRecords: async (weekId: string): Promise<VsRecord[]> => {
      try {
          const { data, error } = await supabase.from('vs_records').select('*').eq('week_id', weekId).range(0, 9999);
          if (error) throw error;
          return (data || []).map((r: any) => ({
            id: r.id, weekId: r.week_id, playerName: r.player_name,
            mon: r.mon, tue: r.tue, wed: r.wed, thu: r.thu, fri: r.fri, sat: r.sat, total: r.total
          }));
      } catch (e) { return getLocalMockData(`vs_recs_${weekId}`, []); }
  },
  addPlayerToWeek: async (weekId: string, playerName: string): Promise<VsRecord> => {
    try {
        const { data, error } = await supabase.from('vs_records').insert({ week_id: weekId, player_name: playerName }).select().single();
        if (error) throw error;
        return { id: data.id, weekId: data.week_id, playerName: data.player_name, mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, total: 0 };
    } catch (e) {
        const local = getLocalMockData<VsRecord[]>(`vs_recs_${weekId}`, []);
        const nr = { id: 'vr' + Date.now(), weekId, playerName, mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, total: 0 };
        local.push(nr);
        saveLocalMockData(`vs_recs_${weekId}`, local);
        return nr;
    }
  },
  updateRecord: async (record: VsRecord): Promise<void> => {
    const total = (record.mon || 0) + (record.tue || 0) + (record.wed || 0) + (record.thu || 0) + (record.fri || 0) + (record.sat || 0);
    try {
        const { error } = await supabase.from('vs_records').update({ mon: record.mon, tue: record.tue, wed: record.wed, thu: record.thu, fri: record.fri, sat: record.sat, total }).eq('id', record.id);
        if (error) throw error;
    } catch (e) {
        const local = getLocalMockData<VsRecord[]>(`vs_recs_${record.weekId}`, []);
        const idx = local.findIndex(r => r.id === record.id);
        if (idx >= 0) { local[idx] = { ...record, total }; saveLocalMockData(`vs_recs_${record.weekId}`, local); }
    }
  }
};

export const TrainApi = {
    getSchedule: async (): Promise<any | null> => {
        try {
            const { data } = await supabase.from('train_schedule').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
            return data?.schedule_data || null;
        } catch (e) { return getLocalMockData('train_sched', null); }
    },
    saveSchedule: async (scheduleData: any): Promise<void> => {
        try {
            const { error } = await supabase.from('train_schedule').insert({ schedule_data: scheduleData });
            if (error) throw error;
        } catch (e) { saveLocalMockData('train_sched', scheduleData); }
    }
};

export interface DesertStormData { teamAMain: string[]; teamASubs: string[]; teamBMain: string[]; teamBSubs: string[]; }
export interface DesertStormRegistration { id: string; playerId: string; preference: '14:00' | '23:00' | 'ANY'; createdAt: string; }

export const DesertStormApi = {
    getTeams: async (): Promise<DesertStormData | null> => {
        try {
            const { data } = await supabase.from('desert_storm_teams').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
            return data?.team_data || null;
        } catch (e) { return getLocalMockData('storm_teams', null); }
    },
    saveTeams: async (data: DesertStormData) => {
        try {
            const { error } = await supabase.from('desert_storm_teams').insert({ team_data: data });
            if (error) throw error;
        } catch (e) { saveLocalMockData('storm_teams', data); }
    },
    register: async (playerId: string, preference: string) => {
         try {
             await supabase.from('desert_storm_registrations').delete().eq('player_id', playerId);
             const { error } = await supabase.from('desert_storm_registrations').insert({ player_id: playerId, preference });
             if (error) throw error;
         } catch (e) {
             const local = getLocalMockData<DesertStormRegistration[]>('storm_regs', []);
             const nr = { id: 'dsr' + Date.now(), playerId, preference: preference as any, createdAt: new Date().toISOString() };
             const filtered = local.filter(r => r.playerId !== playerId);
             filtered.push(nr);
             saveLocalMockData('storm_regs', filtered);
         }
    },
    getRegistrations: async (): Promise<DesertStormRegistration[]> => {
        try {
            const { data } = await supabase.from('desert_storm_registrations').select('*');
            return (data || []).map((r: any) => ({ id: r.id, playerId: r.player_id, preference: r.preference, createdAt: r.created_at }));
        } catch (e) { return getLocalMockData('storm_regs', []); }
    },
    clearRegistrations: async () => {
        try {
            const { error } = await supabase.from('desert_storm_registrations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
            if (error) throw error;
        } catch (e) { saveLocalMockData('storm_regs', []); }
    }
};