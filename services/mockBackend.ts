
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
  initialize: () => console.log("App initialized in Tactical Mode (Supabase)"),

  getPlayers: async (filter: PlayerFilter): Promise<{ items: Player[]; total: number }> => {
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
  },

  upsertPlayer: async (playerData: Partial<Player>): Promise<ApiResponse<Player>> => {
      const nameNormalized = playerData.name?.trim().toLowerCase().replace(/\s+/g, ' ') || '';
      const { data: existingMatch } = await supabase.from('players').select('id').eq('name_normalized', nameNormalized).maybeSingle();
      const payload = mapPlayerToDb({ ...playerData, nameNormalized });
      try {
          let result;
          if (existingMatch) result = await supabase.from('players').update(payload).eq('id', existingMatch.id).select().single();
          else result = await supabase.from('players').insert(payload).select().single();
          if (result.error) throw result.error;
          return { success: true, data: mapPlayerFromDb(result.data) };
      } catch (e: any) {
          return { success: false, error: formatError(e) };
      }
  },

  login: async (username: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username === 'admin' ? 'admin@admin.com' : username,
      password,
    });
    if (error) return { success: false, error: formatError(error) };
    return { success: true, data: { token: data.session?.access_token || '', user: { username } } };
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('asn1_auth_token');
  },

  adminUpdatePlayer: async (id: string, updates: Partial<Player>): Promise<ApiResponse<Player>> => {
    const payload = mapPlayerToDb(updates);
    const { data, error } = await supabase.from('players').update(payload).eq('id', id).select().single();
    if (error) return { success: false, error: formatError(error) };
    return { success: true, data: mapPlayerFromDb(data) };
  },

  adminDeletePlayer: async (id: string): Promise<ApiResponse<void>> => {
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) return { success: false, error: formatError(error) };
    return { success: true };
  },

  getSettings: async (): Promise<Record<string, any>> => {
    try {
      const { data, error } = await supabase.from('alliance_settings').select('*');
      if (error) return {};
      const settings: Record<string, any> = {};
      (data || []).forEach(row => { settings[row.setting_name] = row.value; });
      return settings;
    } catch (e) { return {}; }
  },

  updateSetting: async (key: string, value: any): Promise<void> => {
    const { error } = await supabase.from('alliance_settings').upsert({ 
      setting_name: key, value, updated_at: new Date().toISOString() 
    }, { onConflict: 'setting_name' });
    if (error) throw new Error(formatError(error));
  },

  getAnnouncements: async (): Promise<Announcement[]> => {
    const { data } = await supabase.from('announcements').select('*').eq('active', true).order('created_at', { ascending: false });
    return (data || []).map((a: any) => ({
      id: a.id, content: a.content, type: a.type, active: a.active, createdAt: a.created_at
    }));
  },

  updateAnnouncement: async (content: string, type: 'info'|'warning'|'critical'): Promise<void> => {
    await supabase.from('announcements').update({ active: false }).neq('id', 'placeholder');
    const { error } = await supabase.from('announcements').insert({ content, type, active: true });
    if (error) throw new Error(formatError(error));
  }
};

export const VsApi = {
  getWeeks: async (): Promise<VsWeek[]> => {
      const { data, error } = await supabase.from('vs_weeks').select('*').order('created_at', { ascending: false });
      if (error) return [];
      return (data || []).map((w: any) => ({ id: w.id, name: w.name, createdAt: w.created_at }));
  },
  createWeek: async (name: string): Promise<VsWeek> => {
    const { data, error } = await supabase.from('vs_weeks').insert({ name }).select().single();
    if (error) throw new Error(formatError(error));
    return { id: data.id, name: data.name, createdAt: data.created_at };
  },
  getRecords: async (weekId: string): Promise<VsRecord[]> => {
      const { data, error } = await supabase.from('vs_records').select('*').eq('week_id', weekId).range(0, 9999);
      if (error) return [];
      return (data || []).map((r: any) => ({
        id: r.id, weekId: r.week_id, playerName: r.player_name,
        mon: r.mon, tue: r.tue, wed: r.wed, thu: r.thu, fri: r.fri, sat: r.sat, total: r.total
      }));
  },
  addPlayerToWeek: async (weekId: string, playerName: string): Promise<VsRecord> => {
    const { data, error } = await supabase.from('vs_records').insert({ week_id: weekId, player_name: playerName }).select().single();
    if (error) throw new Error(formatError(error));
    return { id: data.id, weekId: data.week_id, playerName: data.player_name, mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, total: 0 };
  },
  updateRecord: async (record: VsRecord): Promise<void> => {
    const total = (record.mon || 0) + (record.tue || 0) + (record.wed || 0) + (record.thu || 0) + (record.fri || 0) + (record.sat || 0);
    const { error } = await supabase.from('vs_records').update({ mon: record.mon, tue: record.tue, wed: record.wed, thu: record.thu, fri: record.fri, sat: record.sat, total }).eq('id', record.id);
  }
};

export const TrainApi = {
    getSchedule: async (): Promise<any | null> => {
        const { data } = await supabase.from('train_schedule').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
        return data?.schedule_data || null;
    },
    saveSchedule: async (scheduleData: any): Promise<void> => {
        const { error } = await supabase.from('train_schedule').insert({ schedule_data: scheduleData });
        if (error) throw new Error(formatError(error));
    }
};

export interface DesertStormData { teamAMain: string[]; teamASubs: string[]; teamBMain: string[]; teamBSubs: string[]; }
export interface DesertStormRegistration { id: string; playerId: string; preference: '14:00' | '23:00' | 'ANY'; createdAt: string; }

export const DesertStormApi = {
    getTeams: async (): Promise<DesertStormData | null> => {
        const { data } = await supabase.from('desert_storm_teams').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle();
        return data?.team_data || null;
    },
    saveTeams: async (data: DesertStormData) => {
        const { error } = await supabase.from('desert_storm_teams').insert({ team_data: data });
        if (error) throw new Error(formatError(error));
    },
    register: async (playerId: string, preference: string) => {
         await supabase.from('desert_storm_registrations').delete().eq('player_id', playerId);
         const { error } = await supabase.from('desert_storm_registrations').insert({ player_id: playerId, preference });
         if (error) throw new Error(formatError(error));
    },
    getRegistrations: async (): Promise<DesertStormRegistration[]> => {
        const { data } = await supabase.from('desert_storm_registrations').select('*');
        return (data || []).map((r: any) => ({ id: r.id, playerId: r.player_id, preference: r.preference, createdAt: r.created_at }));
    },
    clearRegistrations: async () => {
        const { error } = await supabase.from('desert_storm_registrations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw new Error(formatError(error));
    }
};
