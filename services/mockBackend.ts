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

const mapPlayerFromDb = (row: any): Player => ({
  id: row.id,
  allianceId: row.alliance_id || 'asn1',
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
  defExtraHospitals: row.def_extra_hospitals || 0,
  defHoldLine1: row.def_hold_line_1 || 0,
  defCounterDefense1: row.def_counter_defense_1 || 0,
  defSolidDefense1: row.def_solid_defense_1 || 0,
  defFortifications: row.def_fortifications || 0,
  defInfirmaryExpansion1: row.def_infirmary_expansion_1 || 0,
  defEfficientHealing: row.def_efficient_healing || 0,
  defHoldLine2: row.def_hold_line_2 || 0,
  defCounterDefense2: row.def_counter_defense_2 || 0,
  defSolidDefense2: row.def_solid_defense_2 || 0,
  defResourceProtection: row.def_resource_protection || 0,
  defRapidMarch1: row.def_rapid_march_1 || 0,
  defHoldLine3: row.def_hold_line_3 || 0,
  defCounterDefense3: row.def_counter_defense_3 || 0,
  defSolidDefense3: row.def_solid_defense_3 || 0,
  defSurvivalSkills: row.def_survival_skills || 0,
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
  if (p.defExtraHospitals !== undefined) out.def_extra_hospitals = p.defExtraHospitals;
  if (p.defHoldLine1 !== undefined) out.def_hold_line_1 = p.defHoldLine1;
  if (p.defCounterDefense1 !== undefined) out.def_counter_defense_1 = p.defCounterDefense1;
  if (p.defSolidDefense1 !== undefined) out.def_solid_defense_1 = p.defSolidDefense1;
  if (p.defFortifications !== undefined) out.def_fortifications = p.defFortifications;
  if (p.defInfirmaryExpansion1 !== undefined) out.def_infirmary_expansion_1 = p.defInfirmaryExpansion1;
  if (p.defEfficientHealing !== undefined) out.def_efficient_healing = p.defEfficientHealing;
  if (p.defHoldLine2 !== undefined) out.def_hold_line_2 = p.defHoldLine2;
  if (p.defCounterDefense2 !== undefined) out.def_counter_defense_2 = p.defCounterDefense2;
  if (p.defSolidDefense2 !== undefined) out.def_solid_defense_2 = p.defSolidDefense2;
  if (p.defResourceProtection !== undefined) out.def_resource_protection = p.defResourceProtection;
  if (p.defRapidMarch1 !== undefined) out.def_rapid_march_1 = p.defRapidMarch1;
  if (p.defHoldLine3 !== undefined) out.def_hold_line_3 = p.defHoldLine3;
  if (p.defCounterDefense3 !== undefined) out.def_counter_defense_3 = p.defCounterDefense3;
  if (p.defSolidDefense3 !== undefined) out.def_solid_defense_3 = p.defSolidDefense3;
  if (p.defSurvivalSkills !== undefined) out.def_survival_skills = p.defSurvivalSkills;
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
                  AuditLogger.log('MEMBER_UPDATE', `Updated Power to ${((player.firstSquadPower || 0) / 1000000).toFixed(1)}M`, player.name || 'Commander', { firstSquadPower: player.firstSquadPower });
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
      AuditLogger.log('MEMBER_UPDATE', `Updated Power to ${((updated.firstSquadPower || 0) / 1000000).toFixed(1)}M`, updated.name || 'Commander', { firstSquadPower: updated.firstSquadPower });
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