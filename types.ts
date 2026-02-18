export type Language = 'english' | 'arabic' | 'turkish' | 'indonesian';

export interface Player {
  id: string;
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
  t10Elite: number; // 0 or 10 (MAX)
  
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
  
  active: boolean;
}

export interface Announcement {
  id: string;
  content: string;
  type: 'info' | 'warning' | 'critical';
  active: boolean;
  createdAt: string;
}

export type SortOption = 'time_desc' | 'time_asc' | 'power_desc' | 'power_asc' | 'total_hero_power_desc' | 'total_hero_power_asc' | 't10_closest';

export interface PlayerFilter {
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
  user: { username: string };
}

export interface VsWeek {
  id: string;
  name: string; 
  createdAt: string;
}

export interface VsRecord {
  id: string;
  weekId: string;
  playerName: string;
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  total: number;
}