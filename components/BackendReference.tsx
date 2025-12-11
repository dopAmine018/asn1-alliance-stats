
import React from 'react';

const BackendReference: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in p-4 sm:p-0">
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
        <h2 className="text-2xl font-bold text-emerald-400 mb-4">Supabase Setup Guide</h2>
        <p className="text-slate-300 mb-4">
          To enable the backend, copy the SQL below and run it in the <strong>SQL Editor</strong> of your Supabase dashboard.
        </p>
      </div>
      
      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-semibold text-amber-500 mb-3">🛠️ QUICK FIX: Missing Train Schedule</h3>
          <p className="text-sm text-slate-400 mb-2">If you see "Failed to fetch train schedule", run this block:</p>
          <pre className="bg-slate-950 p-4 rounded-lg border border-amber-500/30 overflow-x-auto text-sm text-amber-400 font-mono select-all">
{`create table if not exists train_schedule (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  schedule_data jsonb not null
);

alter table train_schedule enable row level security;

create policy "Public Access Train" on train_schedule 
for all 
using (true) 
with check (true);
`}
          </pre>
        </section>

        <section>
          <h3 className="text-xl font-semibold text-white mb-3">Full SQL Schema (For New Projects)</h3>
          <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 overflow-x-auto text-sm text-sky-400 font-mono select-all">
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

-- 4. Enable RLS
alter table players enable row level security;
alter table vs_weeks enable row level security;
alter table vs_records enable row level security;
alter table train_schedule enable row level security;

-- 5. Policies
create policy "Public Access" on players for all using (true) with check (true);
create policy "Public Access VS" on vs_weeks for all using (true) with check (true);
create policy "Public Access Records" on vs_records for all using (true) with check (true);
create policy "Public Access Train" on train_schedule for all using (true) with check (true);
`}
          </pre>
        </section>
      </div>
    </div>
  );
};

export default BackendReference;
