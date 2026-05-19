-- ASN1 COMMAND SUPABASE SCHEMA (FULL REBUILD)
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- IMPORTANT: If you already have a 'players' table and want to add missing columns, 
-- you should either DROP the table and run this, or use ALTER TABLE statements.

-- UNCOMMENT THE LINE BELOW TO RESET THE TABLE (WARNING: DELETES DATA)
-- DROP TABLE IF EXISTS players;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PLAYERS TABLE
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alliance_id TEXT DEFAULT 'asn1', -- The column causing the error
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    language TEXT,
    name TEXT,
    name_normalized TEXT UNIQUE,
    
    -- Power Stats
    first_squad_power BIGINT DEFAULT 0,
    second_squad_power BIGINT DEFAULT 0,
    third_squad_power BIGINT DEFAULT 0,
    fourth_squad_power BIGINT DEFAULT 0,
    total_hero_power BIGINT DEFAULT 0,
    
    -- Percentages
    hero_percent INTEGER DEFAULT 0,
    duel_percent INTEGER DEFAULT 0,
    units_percent INTEGER DEFAULT 0,
    
    -- T10 Tech
    t10_morale INTEGER DEFAULT 1,
    t10_protection INTEGER DEFAULT 0,
    t10_hp INTEGER DEFAULT 0,
    t10_atk INTEGER DEFAULT 0,
    t10_def INTEGER DEFAULT 0,
    t10_elite INTEGER DEFAULT 0,
    
    -- Siege to Seize (STS)
    sts_power_boost_1 INTEGER DEFAULT 0,
    sts_final_stand_1 INTEGER DEFAULT 0,
    sts_fierce_assault_1 INTEGER DEFAULT 0,
    sts_vigilant_formation_1 INTEGER DEFAULT 0,
    sts_extra_drill_ground INTEGER DEFAULT 0,
    sts_barrack_expansion_1 INTEGER DEFAULT 0,
    sts_focused_training_1 INTEGER DEFAULT 0,
    sts_final_stand_2 INTEGER DEFAULT 0,
    sts_fierce_assault_2 INTEGER DEFAULT 0,
    sts_vigilant_formation_2 INTEGER DEFAULT 0,
    sts_drill_ground_expansion INTEGER DEFAULT 0,
    sts_rapid_march_1 INTEGER DEFAULT 0,
    sts_final_stand_3 INTEGER DEFAULT 0,
    sts_fierce_assault_3 INTEGER DEFAULT 0,
    sts_vigilant_formation_3 INTEGER DEFAULT 0,
    sts_fatal_strike_1 INTEGER DEFAULT 0,
    
    -- Defense Fortifications
    def_extra_hospitals INTEGER DEFAULT 0,
    def_hold_line_1 INTEGER DEFAULT 0,
    def_counter_defense_1 INTEGER DEFAULT 0,
    def_solid_defense_1 INTEGER DEFAULT 0,
    def_fortifications INTEGER DEFAULT 0,
    def_infirmary_expansion_1 INTEGER DEFAULT 0,
    def_efficient_healing INTEGER DEFAULT 0,
    def_hold_line_2 INTEGER DEFAULT 0,
    def_counter_defense_2 INTEGER DEFAULT 0,
    def_solid_defense_2 INTEGER DEFAULT 0,
    def_resource_protection INTEGER DEFAULT 0,
    def_rapid_march_1 INTEGER DEFAULT 0,
    def_hold_line_3 INTEGER DEFAULT 0,
    def_counter_defense_3 INTEGER DEFAULT 0,
    def_solid_defense_3 INTEGER DEFAULT 0,
    def_survival_skills INTEGER DEFAULT 0,
    
    -- Building Levels
    tech_level INTEGER DEFAULT 0,
    barracks_level INTEGER DEFAULT 0,
    tank_center_level INTEGER DEFAULT 0,
    air_center_level INTEGER DEFAULT 0,
    missile_center_level INTEGER DEFAULT 0,
    
    -- Aircraft Mastery
    mastery_air_hp_1 INTEGER DEFAULT 0,
    mastery_air_atk_1 INTEGER DEFAULT 0,
    mastery_air_def_1 INTEGER DEFAULT 0,
    mastery_air_damage_1 INTEGER DEFAULT 0,
    mastery_air_march_1 INTEGER DEFAULT 0,
    mastery_air_hp_2 INTEGER DEFAULT 0,
    mastery_air_atk_2 INTEGER DEFAULT 0,
    mastery_air_def_2 INTEGER DEFAULT 0,
    mastery_air_damage_2 INTEGER DEFAULT 0,
    mastery_air_ult_def_1 INTEGER DEFAULT 0,
    mastery_air_hp_3 INTEGER DEFAULT 0,
    mastery_air_atk_3 INTEGER DEFAULT 0,
    mastery_air_def_3 INTEGER DEFAULT 0,
    mastery_air_damage_3 INTEGER DEFAULT 0,
    mastery_air_march_2 INTEGER DEFAULT 0,
    mastery_air_hp_4 INTEGER DEFAULT 0,
    mastery_air_atk_4 INTEGER DEFAULT 0,
    mastery_air_def_4 INTEGER DEFAULT 0,
    mastery_air_damage_4 INTEGER DEFAULT 0,
    mastery_air_ult_def_2 INTEGER DEFAULT 0,
    
    -- Tank Mastery
    mastery_tank_hp_1 INTEGER DEFAULT 0,
    mastery_tank_atk_1 INTEGER DEFAULT 0,
    mastery_tank_def_1 INTEGER DEFAULT 0,
    mastery_tank_damage_1 INTEGER DEFAULT 0,
    mastery_tank_march_1 INTEGER DEFAULT 0,
    mastery_tank_hp_2 INTEGER DEFAULT 0,
    mastery_tank_atk_2 INTEGER DEFAULT 0,
    mastery_tank_def_2 INTEGER DEFAULT 0,
    mastery_tank_damage_2 INTEGER DEFAULT 0,
    mastery_tank_ult_def_1 INTEGER DEFAULT 0,
    mastery_tank_hp_3 INTEGER DEFAULT 0,
    mastery_tank_atk_3 INTEGER DEFAULT 0,
    mastery_tank_def_3 INTEGER DEFAULT 0,
    mastery_tank_damage_3 INTEGER DEFAULT 0,
    mastery_tank_march_2 INTEGER DEFAULT 0,
    mastery_tank_hp_4 INTEGER DEFAULT 0,
    mastery_tank_atk_4 INTEGER DEFAULT 0,
    mastery_tank_def_4 INTEGER DEFAULT 0,
    mastery_tank_damage_4 INTEGER DEFAULT 0,
    mastery_tank_ult_def_2 INTEGER DEFAULT 0,
    
    -- Missile Mastery
    mastery_missile_hp_1 INTEGER DEFAULT 0,
    mastery_missile_atk_1 INTEGER DEFAULT 0,
    mastery_missile_def_1 INTEGER DEFAULT 0,
    mastery_missile_damage_1 INTEGER DEFAULT 0,
    mastery_missile_march_1 INTEGER DEFAULT 0,
    mastery_missile_hp_2 INTEGER DEFAULT 0,
    mastery_missile_atk_2 INTEGER DEFAULT 0,
    mastery_missile_def_2 INTEGER DEFAULT 0,
    mastery_missile_damage_2 INTEGER DEFAULT 0,
    mastery_missile_ult_def_1 INTEGER DEFAULT 0,
    mastery_missile_hp_3 INTEGER DEFAULT 0,
    mastery_missile_atk_3 INTEGER DEFAULT 0,
    mastery_missile_def_3 INTEGER DEFAULT 0,
    mastery_missile_damage_3 INTEGER DEFAULT 0,
    mastery_missile_march_2 INTEGER DEFAULT 0,
    mastery_missile_hp_4 INTEGER DEFAULT 0,
    mastery_missile_atk_4 INTEGER DEFAULT 0,
    mastery_missile_def_4 INTEGER DEFAULT 0,
    mastery_missile_damage_4 INTEGER DEFAULT 0,
    mastery_missile_ult_def_2 INTEGER DEFAULT 0,
    
    active BOOLEAN DEFAULT true
);

-- 2. ALLIANCE SETTINGS
CREATE TABLE IF NOT EXISTS alliance_settings (
    setting_name TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. VS WEEKS
CREATE TABLE IF NOT EXISTS vs_weeks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alliance_id TEXT DEFAULT 'asn1',
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. VS RECORDS
CREATE TABLE IF NOT EXISTS vs_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_id UUID REFERENCES vs_weeks(id) ON DELETE CASCADE,
    alliance_id TEXT DEFAULT 'asn1',
    player_name TEXT,
    mon BIGINT DEFAULT 0,
    tue BIGINT DEFAULT 0,
    wed BIGINT DEFAULT 0,
    thu BIGINT DEFAULT 0,
    fri BIGINT DEFAULT 0,
    sat BIGINT DEFAULT 0,
    total BIGINT DEFAULT 0
);

-- 5. TRAIN SCHEDULE
CREATE TABLE IF NOT EXISTS train_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. DESERT STORM TEAMS
CREATE TABLE IF NOT EXISTS desert_storm_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. DESERT STORM REGISTRATIONS
CREATE TABLE IF NOT EXISTS desert_storm_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id TEXT,
    preference TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
