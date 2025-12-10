
export type Language = 'english' | 'arabic' | 'turkish' | 'indonesian';

export interface Player {
  id: string;
  createdAt: string; // ISO Date string
  updatedAt: string; // ISO Date string
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
  
  techLevel: number;
  barracksLevel: number;
  tankCenterLevel: number;
  airCenterLevel: number;
  missileCenterLevel: number;
  
  active: boolean;
}

export type SortOption = 'time_desc' | 'time_asc' | 'power_desc' | 'power_asc' | 'total_hero_power_desc' | 'total_hero_power_asc';

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

// --- VS Tracker Types ---

export interface VsWeek {
  id: string;
  name: string; // e.g. "Week 1: ASN1 vs CFAM"
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
