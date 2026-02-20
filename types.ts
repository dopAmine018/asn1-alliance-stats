export type Language = 'english' | 'arabic' | 'turkish' | 'indonesian';

export interface Alliance {
  id: string;
  tag: string; // Unique short code like 'ASN1'
  name: string;
  logoUrl?: string;
  adminPass: string;
  createdAt: string;
}

export interface Player {
  id: string;
  allianceId: string; // Multi-tenancy key
  createdAt: string; 
  updatedAt: string; 
  language: Language;
  name: string;
  nameNormalized: string;
  
  firstSquadPower: number;
  secondSquadPower?: number;
  thirdSquadPower?: number;
  fourthSquadPower?: number;
  totalHeroPower: number;
  
  heroPercent: number;
  duelPercent: number;
  unitsPercent: number;
  
  t10Morale: number;
  t10Protection: number;
  t10Hp: number;
  t10Atk: number;
  t10Def: number;
  t10Elite: number; 

  // Siege to Seize nodes
  stsPowerBoost1: number;
  stsFinalStand1: number;
  stsFierceAssault1: number;
  stsVigilantFormation1: number;
  stsExtraDrillGround: number;
  stsBarrackExpansion1: number;
  stsFocusedTraining1: number;
  stsFinalStand2: number;
  stsFierceAssault2: number;
  stsVigilantFormation2: number;
  stsDrillGroundExpansion: number;
  stsRapidMarch1: number;
  stsFinalStand3: number;
  stsFierceAssault3: number;
  stsVigilantFormation3: number;
  stsFatalStrike1: number;
  
  techLevel: number;
  barracksLevel: number;
  tankCenterLevel: number;
  airCenterLevel: number;
  missileCenterLevel: number;
  
  // Air Mastery
  masteryAirHp1: number;
  masteryAirAtk1: number;
  masteryAirDef1: number;
  masteryAirDamage1: number;
  masteryAirMarch1: number;
  masteryAirHp2: number;
  masteryAirAtk2: number;
  masteryAirDef2: number;
  masteryAirDamage2: number;
  masteryAirUltDef1: number;
  masteryAirHp3: number;
  masteryAirAtk3: number;
  masteryAirDef3: number;
  masteryAirDamage3: number;
  masteryAirMarch2: number;
  masteryAirHp4: number;
  masteryAirAtk4: number;
  masteryAirDef4: number;
  masteryAirDamage4: number;
  masteryAirUltDef2: number;

  // Tank Mastery
  masteryTankHp1: number;
  masteryTankAtk1: number;
  masteryTankDef1: number;
  masteryTankDamage1: number;
  masteryTankMarch1: number;
  masteryTankHp2: number;
  masteryTankAtk2: number;
  masteryTankDef2: number;
  masteryTankDamage2: number;
  masteryTankUltDef1: number;
  masteryTankHp3: number;
  masteryTankAtk3: number;
  masteryTankDef3: number;
  masteryTankDamage3: number;
  masteryTankMarch2: number;
  masteryTankHp4: number;
  masteryTankAtk4: number;
  masteryTankDef4: number;
  masteryTankDamage4: number;
  masteryTankUltDef2: number;

  // Missile Mastery
  masteryMissileHp1: number;
  masteryMissileAtk1: number;
  masteryMissileDef1: number;
  masteryMissileDamage1: number;
  masteryMissileMarch1: number;
  masteryMissileHp2: number;
  masteryMissileAtk2: number;
  masteryMissileDef2: number;
  masteryMissileDamage2: number;
  masteryMissileUltDef1: number;
  masteryMissileHp3: number;
  masteryMissileAtk3: number;
  masteryMissileDef3: number;
  masteryMissileDamage3: number;
  masteryMissileMarch2: number;
  masteryMissileHp4: number;
  masteryMissileAtk4: number;
  masteryMissileDef4: number;
  masteryMissileDamage4: number;
  masteryMissileUltDef2: number;

  active: boolean;
}

export interface Announcement {
  id: string;
  allianceId: string;
  content: string;
  type: 'info' | 'warning' | 'critical';
  active: boolean;
  createdAt: string;
}

export type SortOption = 'time_desc' | 'time_asc' | 'power_desc' | 'power_asc' | 'total_hero_power_desc' | 'total_hero_power_asc' | 't10_closest';

export interface PlayerFilter {
  allianceId?: string;
  language: Language | 'all';
  search: string;
  sort: SortOption;
  activeOnly: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
}

export interface AuthResponse {
  token: string;
  alliance: Alliance;
}

export interface VsWeek {
  id: string;
  allianceId: string;
  name: string; 
  createdAt: string;
}

export interface VsRecord {
  id: string;
  weekId: string;
  allianceId: string;
  playerName: string;
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  total: number;
}

export interface DesertStormRegistration {
  id: string;
  playerId: string;
  preference: string;
  createdAt: string;
}