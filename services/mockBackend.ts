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
    { id: 'm1', allianceId: 'gun1', ...DEFAULT_STS, ...DEFAULT_MASTERY, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), language: 'english', name: 'imAYAD', nameNormalized: 'imayad', firstSquadPower: 23200000, totalHeroPower: 18500000, heroPercent: 92, duelPercent: 88, unitsPercent: 85, t10Morale: 10, t10Protection: 10, t10Hp: 10, t10Atk: 10, t10Def: 10, t10Elite: 10, techLevel: 35, barracksLevel: 35, tankCenterLevel: 35, airCenterLevel: 35, missileCenterLevel: 35, active: true },
    { id: 'm2', allianceId: 'gun1', ...DEFAULT_STS, ...DEFAULT_MASTERY, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), language: 'turkish', name: 'TuyuLL', nameNormalized: 'tuyull', firstSquadPower: 23000000, totalHeroPower: 18100000, heroPercent: 90, duelPercent: 85, unitsPercent: 82, t10Morale: 10, t10Protection: 10, t10Hp: 10, t10Atk: 10, t10Def: 10, t10Elite: 10, techLevel: 35, barracksLevel: 35, tankCenterLevel: 35, airCenterLevel: 35, missileCenterLevel: 35, active: true },
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
  masteryAirHp1: row.mastery_air_hp_1 || 0,
  masteryAirAtk1: row.mastery_air_atk_1 || 0,
  masteryAirDef1: row.mastery_air_def_1 || 0,
  masteryAirDamage1: row.mastery_air_damage_1 || 0,
  masteryAirMarch1: row.mastery_air_march_1 || 0,
  masteryAirHp2: row.mastery_air_hp_2 || 0,
  masteryAirAtk2: row.mastery_air_atk_2 || 0,
  masteryAirDef2: row.mastery_air_def_2 || 0,
  masteryAirDamage2: row.mastery_air_damage_2 || 0,
  masteryAirUltDef1: row.mastery_air_ult_def_1 || 0,
  masteryAirHp3: row.mastery_air_hp_3 || 0,
  masteryAirAtk3: row.mastery_air_atk_3 || 0,
  masteryAirDef3: row.mastery_air_def_3 || 0,
  masteryAirDamage3: row.mastery_air_damage_3 || 0,
  masteryAirMarch2: row.mastery_air_march_2 || 0,
  masteryAirHp4: row.mastery_air_hp_4 || 0,
  masteryAirAtk4: row.mastery_air_atk_4 || 0,
  masteryAirDef4: row.mastery_air_def_4 || 0,
  masteryAirDamage4: row.mastery_air_damage_4 || 0,
  masteryAirUltDef2: row.mastery_air_ult_def_2 || 0,
  masteryTankHp1: row.mastery_tank_hp_1 || 0,
  masteryTankAtk1: row.mastery_tank_atk_1 || 0,
  masteryTankDef1: row.mastery_tank_def_1 || 0,
  masteryTankDamage1: row.mastery_tank_damage_1 || 0,
  masteryTankMarch1: row.mastery_tank_march_1 || 0,
  masteryTankHp2: row.mastery_tank_hp_2 || 0,
  masteryTankAtk2: row.mastery_tank_atk_2 || 0,
  masteryTankDef2: row.mastery_tank_def_2 || 0,
  masteryTankDamage2: row.mastery_tank_damage_2 || 0,
  masteryTankUltDef1: row.mastery_tank_ult_def_1 || 0,
  masteryTankHp3: row.mastery_tank_hp_3 || 0,
  masteryTankAtk3: row.mastery_tank_atk_3 || 0,
  masteryTankDef3: row.mastery_tank_def_3 || 0,
  masteryTankDamage3: row.mastery_tank_damage_3 || 0,
  masteryTankMarch2: row.mastery_tank_march_2 || 0,
  masteryTankHp4: row.mastery_tank_hp_4 || 0,
  masteryTankAtk4: row.mastery_tank_atk_4 || 0,
  masteryTankDef4: row.mastery_tank_def_4 || 0,
  masteryTankDamage4: row.mastery_tank_damage_4 || 0,
  masteryTankUltDef2: row.mastery_tank_ult_def_2 || 0,
  masteryMissileHp1: row.mastery_missile_hp_1 || 0,
  masteryMissileAtk1: row.mastery_missile_atk_1 || 0,
  masteryMissileDef1: row.mastery_missile_def_1 || 0,
  masteryMissileDamage1: row.mastery_missile_damage_1 || 0,
  masteryMissileMarch1: row.mastery_missile_march_1 || 0,
  masteryMissileHp2: row.mastery_missile_hp_2 || 0,
  masteryMissileAtk2: row.mastery_missile_atk_2 || 0,
  masteryMissileDef2: row.mastery_missile_def_2 || 0,
  masteryMissileDamage2: row.mastery_missile_damage_2 || 0,
  masteryMissileUltDef1: row.mastery_missile_ult_def_1 || 0,
  masteryMissileHp3: row.mastery_missile_hp_3 || 0,
  masteryMissileAtk3: row.mastery_missile_atk_3 || 0,
  masteryMissileDef3: row.mastery_missile_def_3 || 0,
  masteryMissileDamage3: row.mastery_missile_damage_3 || 0,
  masteryMissileMarch2: row.mastery_missile_march_2 || 0,
  masteryMissileHp4: row.mastery_missile_hp_4 || 0,
  masteryMissileAtk4: row.mastery_missile_atk_4 || 0,
  masteryMissileDef4: row.mastery_missile_def_4 || 0,
  masteryMissileDamage4: row.mastery_missile_damage_4 || 0,
  masteryMissileUltDef2: row.mastery_missile_ult_def_2 || 0,
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
  if (p.masteryAirHp1 !== undefined) out.mastery_air_hp_1 = p.masteryAirHp1;
  if (p.masteryAirAtk1 !== undefined) out.mastery_air_atk_1 = p.masteryAirAtk1;
  if (p.masteryAirDef1 !== undefined) out.mastery_air_def_1 = p.masteryAirDef1;
  if (p.masteryAirDamage1 !== undefined) out.mastery_air_damage_1 = p.masteryAirDamage1;
  if (p.masteryAirMarch1 !== undefined) out.mastery_air_march_1 = p.masteryAirMarch1;
  if (p.masteryAirHp2 !== undefined) out.mastery_air_hp_2 = p.masteryAirHp2;
  if (p.masteryAirAtk2 !== undefined) out.mastery_air_atk_2 = p.masteryAirAtk2;
  if (p.masteryAirDef2 !== undefined) out.mastery_air_def_2 = p.masteryAirDef2;
  if (p.masteryAirDamage2 !== undefined) out.mastery_air_damage_2 = p.masteryAirDamage2;
  if (p.masteryAirUltDef1 !== undefined) out.mastery_air_ult_def_1 = p.masteryAirUltDef1;
  if (p.masteryAirHp3 !== undefined) out.mastery_air_hp_3 = p.masteryAirHp3;
  if (p.masteryAirAtk3 !== undefined) out.mastery_air_atk_3 = p.masteryAirAtk3;
  if (p.masteryAirDef3 !== undefined) out.mastery_air_def_3 = p.masteryAirDef3;
  if (p.masteryAirDamage3 !== undefined) out.mastery_air_damage_3 = p.masteryAirDamage3;
  if (p.masteryAirMarch2 !== undefined) out.mastery_air_march_2 = p.masteryAirMarch2;
  if (p.masteryAirHp4 !== undefined) out.mastery_air_hp_4 = p.masteryAirHp4;
  if (p.masteryAirAtk4 !== undefined) out.mastery_air_atk_4 = p.masteryAirAtk4;
  if (p.masteryAirDef4 !== undefined) out.mastery_air_def_4 = p.masteryAirDef4;
  if (p.masteryAirDamage4 !== undefined) out.mastery_air_damage_4 = p.masteryAirDamage4;
  if (p.masteryAirUltDef2 !== undefined) out.mastery_air_ult_def_2 = p.masteryAirUltDef2;
  if (p.masteryTankHp1 !== undefined) out.mastery_tank_hp_1 = p.masteryTankHp1;
  if (p.masteryTankAtk1 !== undefined) out.mastery_tank_atk_1 = p.masteryTankAtk1;
  if (p.masteryTankDef1 !== undefined) out.mastery_tank_def_1 = p.masteryTankDef1;
  if (p.masteryTankDamage1 !== undefined) out.mastery_tank_damage_1 = p.masteryTankDamage1;
  if (p.masteryTankMarch1 !== undefined) out.mastery_tank_march_1 = p.masteryTankMarch1;
  if (p.masteryTankHp2 !== undefined) out.mastery_tank_hp_2 = p.masteryTankHp2;
  if (p.masteryTankAtk2 !== undefined) out.mastery_tank_atk_2 = p.masteryTankAtk2;
  if (p.masteryTankDef2 !== undefined) out.mastery_tank_def_2 = p.masteryTankDef2;
  if (p.masteryTankDamage2 !== undefined) out.mastery_tank_damage_2 = p.masteryTankDamage2;
  if (p.masteryTankUltDef1 !== undefined) out.mastery_tank_ult_def_1 = p.masteryTankUltDef1;
  if (p.masteryTankHp3 !== undefined) out.mastery_tank_hp_3 = p.masteryTankHp3;
  if (p.masteryTankAtk3 !== undefined) out.mastery_tank_atk_3 = p.masteryTankAtk3;
  if (p.masteryTankDef3 !== undefined) out.mastery_tank_def_3 = p.masteryTankDef3;
  if (p.masteryTankDamage3 !== undefined) out.mastery_tank_damage_3 = p.masteryTankDamage3;
  if (p.masteryTankMarch2 !== undefined) out.mastery_tank_march_2 = p.masteryTankMarch2;
  if (p.masteryTankHp4 !== undefined) out.mastery_tank_hp_4 = p.masteryTankHp4;
  if (p.masteryTankAtk4 !== undefined) out.mastery_tank_atk_4 = p.masteryTankAtk4;
  if (p.masteryTankDef4 !== undefined) out.mastery_tank_def_4 = p.masteryTankDef4;
  if (p.masteryTankDamage4 !== undefined) out.mastery_tank_damage_4 = p.masteryTankDamage4;
  if (p.masteryTankUltDef2 !== undefined) out.mastery_tank_ult_def_2 = p.masteryTankUltDef2;
  if (p.masteryMissileHp1 !== undefined) out.mastery_missile_hp_1 = p.masteryMissileHp1;
  if (p.masteryMissileAtk1 !== undefined) out.mastery_missile_atk_1 = p.masteryMissileAtk1;
  if (p.masteryMissileDef1 !== undefined) out.mastery_missile_def_1 = p.masteryMissileDef1;
  if (p.masteryMissileDamage1 !== undefined) out.mastery_missile_damage_1 = p.masteryMissileDamage1;
  if (p.masteryMissileMarch1 !== undefined) out.mastery_missile_march_1 = p.masteryMissileMarch1;
  if (p.masteryMissileHp2 !== undefined) out.mastery_missile_hp_2 = p.masteryMissileHp2;
  if (p.masteryMissileAtk2 !== undefined) out.mastery_missile_atk_2 = p.masteryMissileAtk2;
  if (p.masteryMissileDef2 !== undefined) out.mastery_missile_def_2 = p.masteryMissileDef2;
  if (p.masteryMissileDamage2 !== undefined) out.mastery_missile_damage_2 = p.masteryMissileDamage2;
  if (p.masteryMissileUltDef1 !== undefined) out.mastery_missile_ult_def_1 = p.masteryMissileUltDef1;
  if (p.masteryMissileHp3 !== undefined) out.mastery_missile_hp_3 = p.masteryMissileHp3;
  if (p.masteryMissileAtk3 !== undefined) out.mastery_missile_atk_3 = p.masteryMissileAtk3;
  if (p.masteryMissileDef3 !== undefined) out.mastery_missile_def_3 = p.masteryMissileDef3;
  if (p.masteryMissileDamage3 !== undefined) out.mastery_missile_damage_3 = p.masteryMissileDamage3;
  if (p.masteryMissileMarch2 !== undefined) out.mastery_missile_march_2 = p.masteryMissileMarch2;
  if (p.masteryMissileHp4 !== undefined) out.mastery_missile_hp_4 = p.masteryMissileHp4;
  if (p.masteryMissileAtk4 !== undefined) out.mastery_missile_atk_4 = p.masteryMissileAtk4;
  if (p.masteryMissileDef4 !== undefined) out.mastery_missile_def_4 = p.masteryMissileDef4;
  if (p.masteryMissileDamage4 !== undefined) out.mastery_missile_damage_4 = p.masteryMissileDamage4;
  if (p.masteryMissileUltDef2 !== undefined) out.mastery_missile_ult_def_2 = p.masteryMissileUltDef2;
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