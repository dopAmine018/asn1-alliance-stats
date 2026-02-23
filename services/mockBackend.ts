import { createClient } from '@supabase/supabase-js';
import { Player, PlayerFilter, ApiResponse } from '../types';

/* =========================
   SUPABASE CONFIG
========================= */

const supabaseUrl = "https://fgrzuylyxfogejwmeakn.supabase.co";
const supabaseKey = "sb_publishable_QUTjb1rBI3MUvQ_rQo9hIg_RGH5PT-i";

export const supabase = createClient(supabaseUrl, supabaseKey);

/* =========================
   MAPPERS
========================= */

const mapPlayerFromDb = (row: any): Player => ({
  id: row.id,
  allianceId: row.alliance_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  language: row.language,
  name: row.name,
  nameNormalized: row.name_normalized,
  firstSquadPower: row.first_squad_power,
  totalHeroPower: row.total_hero_power,
  heroPercent: row.hero_percent,
  duelPercent: row.duel_percent,
  unitsPercent: row.units_percent,
  t10Morale: row.t10_morale,
  t10Protection: row.t10_protection,
  t10Hp: row.t10_hp,
  t10Atk: row.t10_atk,
  t10Def: row.t10_def,
  t10Elite: row.t10_elite,
  techLevel: row.tech_level,
  barracksLevel: row.barracks_level,
  tankCenterLevel: row.tank_center_level,
  airCenterLevel: row.air_center_level,
  missileCenterLevel: row.missile_center_level,
  active: row.active
});

const mapPlayerToDb = (p: Partial<Player>) => ({
  name: p.name,
  name_normalized: p.nameNormalized,
  language: p.language,
  first_squad_power: p.firstSquadPower,
  total_hero_power: p.totalHeroPower,
  hero_percent: p.heroPercent,
  duel_percent: p.duelPercent,
  units_percent: p.unitsPercent,
  t10_morale: p.t10Morale,
  t10_protection: p.t10Protection,
  t10_hp: p.t10Hp,
  t10_atk: p.t10Atk,
  t10_def: p.t10Def,
  t10_elite: p.t10Elite,
  tech_level: p.techLevel,
  barracks_level: p.barracksLevel,
  tank_center_level: p.tankCenterLevel,
  air_center_level: p.airCenterLevel,
  missile_center_level: p.missileCenterLevel,
  active: p.active,
  updated_at: new Date().toISOString()
});

/* =========================
   PLAYER API
========================= */

export const Api = {

  /* GET PLAYERS */
  getPlayers: async (filter: PlayerFilter) => {
    try {
      let query = supabase
        .from('players')
        .select('*', { count: 'exact' });

      if (filter.activeOnly)
        query = query.eq('active', true);

      if (filter.language !== 'all')
        query = query.eq('language', filter.language);

      if (filter.search)
        query = query.ilike('name_normalized', `%${filter.search}%`);

      const { data, error, count } = await query.order('updated_at', { ascending: false });

      if (error) throw error;

      return {
        items: (data || []).map(mapPlayerFromDb),
        total: count || 0
      };

    } catch (error: any) {
      console.error("GET PLAYERS ERROR:", error);
      throw error;
    }
  },

  /* UPSERT PLAYER */
  upsertPlayer: async (playerData: Partial<Player>): Promise<ApiResponse<Player>> => {
    try {

      const nameNormalized =
        playerData.name?.trim().toLowerCase().replace(/\s+/g, ' ') || '';

      const { data: existing } = await supabase
        .from('players')
        .select('id')
        .eq('name_normalized', nameNormalized)
        .maybeSingle();

      const payload = mapPlayerToDb({
        ...playerData,
        nameNormalized
      });

      let result;

      if (existing) {
        result = await supabase
          .from('players')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('players')
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      return {
        success: true,
        data: mapPlayerFromDb(result.data)
      };

    } catch (error: any) {
      console.error("UPSERT ERROR:", error);
      return { success: false, error: error.message };
    }
  },

  /* DELETE PLAYER */
  deletePlayer: async (id: string): Promise<ApiResponse<void>> => {
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };

    } catch (error: any) {
      console.error("DELETE ERROR:", error);
      return { success: false, error: error.message };
    }
  }

};
