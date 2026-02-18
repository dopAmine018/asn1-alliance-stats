
import React from 'react';

const BackendReference: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in p-4 sm:p-0">
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
        <h2 className="text-2xl font-bold text-emerald-400 mb-4">Supabase Step-by-Step Guide</h2>
        <ol className="list-decimal list-inside text-slate-300 space-y-2 mb-4 font-mono text-sm">
            <li>Log in to your <strong>Supabase Dashboard</strong>.</li>
            <li>Go to the <strong>SQL Editor</strong> (Icon on the left sidebar).</li>
            <li>Click <strong>New Query</strong>.</li>
            <li>Copy the code block below and paste it into the editor.</li>
            <li>Click <strong>Run</strong> (bottom right corner).</li>
        </ol>
      </div>
      
      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-semibold text-white mb-3">SQL Initialization Script</h3>
          <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 overflow-x-auto text-xs text-sky-400 font-mono select-all">
{`-- 1. Create Players Table
create table if not exists players (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  language text not null,
  name text not null,
  name_normalized text not null unique,
  first_squad_power bigint default 0,
  second_squad_power bigint default 0,
  third_squad_power bigint default 0,
  fourth_squad_power bigint default 0,
  total_hero_power bigint default 0,
  hero_percent float default 0,
  duel_percent float default 0,
  units_percent float default 0,
  t10_morale float default 1,
  t10_protection float default 1,
  t10_hp float default 1,
  t10_atk float default 1,
  t10_def float default 1,
  t10_elite float default 0,
  tech_level int default 0,
  barracks_level int default 0,
  tank_center_level int default 0,
  air_center_level int default 0,
  missile_center_level int default 0,
  active boolean default true
);

-- 2. Create VS Tracker Tables
create table if not exists vs_weeks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null
);

create table if not exists vs_records (
  id uuid default gen_random_uuid() primary key,
  week_id uuid references vs_weeks(id) on delete cascade,
  player_name text not null,
  mon int default 0, tue int default 0, wed int default 0,
  thu int default 0, fri int default 0, sat int default 0,
  total int default 0
);

-- 3. Create Train Schedule Table
create table if not exists train_schedule (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  schedule_data jsonb not null
);

-- 4. Create Desert Storm Table
create table if not exists desert_storm_teams (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  team_data jsonb not null
);

-- 5. Create Registration Table
create table if not exists desert_storm_registrations (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  player_id uuid references players(id) on delete cascade,
  preference text not null
);

-- 6. Create Settings Table (Clean Slate version)
drop table if exists alliance_settings;
create table alliance_settings (
  setting_name text primary key,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Enable RLS
alter table players enable row level security;
alter table vs_weeks enable row level security;
alter table vs_records enable row level security;
alter table train_schedule enable row level security;
alter table desert_storm_teams enable row level security;
alter table desert_storm_registrations enable row level security;
alter table alliance_settings enable row level security;

-- 8. Safe Policies (Will not error if they already exist)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public Access" ON players;
    DROP POLICY IF EXISTS "Public Access VS" ON vs_weeks;
    DROP POLICY IF EXISTS "Public Access Records" ON vs_records;
    DROP POLICY IF EXISTS "Public Access Train" ON train_schedule;
    DROP POLICY IF EXISTS "Public Access Storm" ON desert_storm_teams;
    DROP POLICY IF EXISTS "Public Access Reg" ON desert_storm_registrations;
    DROP POLICY IF EXISTS "Public Access Settings" ON alliance_settings;
END $$;

create policy "Public Access" on players for all using (true) with check (true);
create policy "Public Access VS" on vs_weeks for all using (true) with check (true);
create policy "Public Access Records" on vs_records for all using (true) with check (true);
create policy "Public Access Train" on train_schedule for all using (true) with check (true);
create policy "Public Access Storm" on desert_storm_teams for all using (true) with check (true);
create policy "Public Access Reg" on desert_storm_registrations for all using (true) with check (true);
create policy "Public Access Settings" on alliance_settings for all using (true) with check (true);
`}
          </pre>
        </section>
      </div>
    </div>
  );
};

export default BackendReference;