
import { createClient } from '@supabase/supabase-js';
import { Player, PlayerFilter, ApiResponse, AuthResponse, VsWeek, VsRecord } from '../types';

// --- Configuration ---

// User Provided Credentials
const PROVIDED_URL = "https://fgrzuylyxfogejwmeakn.supabase.co";
const PROVIDED_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZncnp1eWx5eGZvZ2Vqd21lYWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMjYxMjQsImV4cCI6MjA4MDcwMjEyNH0.-8XkyWwjZIkC3OPrRfNs8vmnRtauee0H2xFz_A0doy8";

// Safe helper to access environment variables
const getEnv = (key: string): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {}

  try {
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}

  return '';
};

// Prioritize Env Vars, fallback to Provided Keys
const rawUrl = getEnv('VITE_SUPABASE_URL') || getEnv('REACT_APP_SUPABASE_URL') || PROVIDED_URL;
const rawKey = getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('REACT_APP_SUPABASE_ANON_KEY') || PROVIDED_KEY;

const supabaseUrl = rawUrl?.trim() || 'https://placeholder.supabase.co';
const supabaseKey = rawKey?.trim() || 'placeholder';

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn("Supabase credentials missing. App will fail to fetch data.");
}

// Initialize Supabase Client (100% Online Mode)
// CONFIG: Disable auth persistence to prevent 'Failed to fetch' in sandboxed iframes
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

// --- Helpers ---

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
  if (p.techLevel !== undefined) out.tech_level = p.techLevel;
  if (p.barracksLevel !== undefined) out.barracks_level = p.barracksLevel;
  if (p.tankCenterLevel !== undefined) out.tank_center_level = p.tankCenterLevel;
  if (p.airCenterLevel !== undefined) out.air_center_level = p.airCenterLevel;
  if (p.missileCenterLevel !== undefined) out.missile_center_level = p.missileCenterLevel;
  if (p.active !== undefined) out.active = p.active;
  
  out.updated_at = new Date().toISOString();
  return out;
};

// Retry helper for flaky connections
const fetchWithRetry = async (fn: () => Promise<any>, retries = 3): Promise<any> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(res => setTimeout(res, 500)); // wait 500ms
      return fetchWithRetry(fn, retries - 1);
    }
    throw error;
  }
};

// --- API Implementation ---

export const MockApi = {
  initialize: () => {
    console.log("App initialized in Online Mode (Supabase)");
  },

  getPlayers: async (filter: PlayerFilter): Promise<{ items: Player[]; total: number }> => {
    return fetchWithRetry(async () => {
        let query = supabase.from('players').select('*', { count: 'exact' });

        if (filter.activeOnly) query = query.eq('active', true);
        if (filter.language !== 'all') query = query.eq('language', filter.language);
        if (filter.search) query = query.ilike('name_normalized', `%${filter.search}%`);

        if (filter.sort === 'power_desc') query = query.order('first_squad_power', { ascending: false });
        else if (filter.sort === 'power_asc') query = query.order('first_squad_power', { ascending: true });
        else if (filter.sort === 'total_hero_power_desc') query = query.order('total_hero_power', { ascending: false });
        else if (filter.sort === 'total_hero_power_asc') query = query.order('total_hero_power', { ascending: true });
        else if (filter.sort === 'time_asc') query = query.order('updated_at', { ascending: true });
        else query = query.order('updated_at', { ascending: false });

        const { data, count, error } = await query;
        if (error) throw error;
        
        return { items: (data || []).map(mapPlayerFromDb), total: count || 0 };
    });
  },

  upsertPlayer: async (playerData: Partial<Player>): Promise<ApiResponse<Player>> => {
    const nameNormalized = playerData.name?.trim().toLowerCase().replace(/\s+/g, ' ') || '';
    const payload = mapPlayerToDb({ ...playerData, nameNormalized });
    
    try {
        const { data, error } = await supabase
          .from('players')
          .upsert(payload, { onConflict: 'language,name_normalized' })
          .select()
          .single();

        if (error) throw error;
        return { success: true, data: mapPlayerFromDb(data) };
    } catch (e: any) {
        console.error("Upsert Failed:", e);
        return { success: false, error: e.message || "Failed to save" };
    }
  },

  login: async (username: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username === 'admin' ? 'admin@admin.com' : username,
      password: password,
    });
    
    if (error) return { success: false, error: error.message };
    return { success: true, data: { token: data.session?.access_token || '', user: { username } } };
  },

  logout: async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('asn1_auth_token');
  },

  adminUpdatePlayer: async (id: string, updates: Partial<Player>): Promise<ApiResponse<Player>> => {
    const payload = mapPlayerToDb(updates);
    const { data, error } = await supabase.from('players').update(payload).eq('id', id).select().single();
    if (error) return { success: false, error: error.message };
    return { success: true, data: mapPlayerFromDb(data) };
  },

  adminDeletePlayer: async (id: string): Promise<ApiResponse<void>> => {
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }
};

export const VsApi = {
  getWeeks: async (): Promise<VsWeek[]> => {
    try {
        const { data, error } = await supabase.from('vs_weeks').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map((w: any) => ({ id: w.id, name: w.name, createdAt: w.created_at }));
    } catch (e) {
        console.error("Get Weeks Failed", e);
        return [];
    }
  },

  createWeek: async (name: string): Promise<VsWeek> => {
    const { data, error } = await supabase.from('vs_weeks').insert({ name }).select().single();
    if (error) throw new Error(error.message);
    return { id: data.id, name: data.name, createdAt: data.created_at };
  },

  getRecords: async (weekId: string): Promise<VsRecord[]> => {
    try {
        const { data, error } = await supabase.from('vs_records').select('*').eq('week_id', weekId);
        if (error) throw error;
        return (data || []).map((r: any) => ({
          id: r.id, weekId: r.week_id, playerName: r.player_name,
          mon: r.mon, tue: r.tue, wed: r.wed, thu: r.thu, fri: r.fri, sat: r.sat, total: r.total
        }));
    } catch (e) {
        console.error("Get Records Failed", e);
        return [];
    }
  },

  addPlayerToWeek: async (weekId: string, playerName: string): Promise<VsRecord> => {
    const { data, error } = await supabase.from('vs_records').insert({
      week_id: weekId, player_name: playerName
    }).select().single();
    
    if (error) throw new Error(error.message);
    
    return {
      id: data.id, weekId: data.week_id, playerName: data.player_name,
      mon: 0, tue: 0, wed: 0, thu: 0, fri: 0, sat: 0, total: 0
    };
  },

  updateRecord: async (record: VsRecord): Promise<void> => {
    const total = (record.mon || 0) + (record.tue || 0) + (record.wed || 0) + (record.thu || 0) + (record.fri || 0) + (record.sat || 0);
    const { error } = await supabase.from('vs_records').update({
      mon: record.mon, tue: record.tue, wed: record.wed, thu: record.thu, fri: record.fri, sat: record.sat, total
    }).eq('id', record.id);
    if (error) console.error("Error updating record:", error);
  }
};
