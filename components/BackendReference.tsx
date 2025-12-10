
import React from 'react';

const BackendReference: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
        <h2 className="text-2xl font-bold text-emerald-400 mb-4">Supabase Setup Guide</h2>
        <p className="text-slate-300 mb-4">
          To enable the shared backend, go to the <strong>SQL Editor</strong> in your Supabase dashboard and run the following script.
        </p>
      </div>

      <div className="space-y-6">
        <section>
          <h3 className="text-xl font-semibold text-white mb-3">SQL Schema Script</h3>
          <pre className="bg-slate-950 p-4 rounded-lg border border-slate-800 overflow-x-auto text-sm text-sky-400 font-mono">
{`-- 1. Create Players Table
create table players (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  language text not null,
  name text not null,
  name_normalized text not null,
  pin text, -- Optional Security PIN
  
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
  
  active boolean default true,

  -- Unique constraint for Upsert logic
  unique(language, name_normalized)
);

-- 2. Create VS Tracker Tables
create table vs_weeks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null
);

create table vs_records (
  id uuid default gen_random_uuid() primary key,
  week_id uuid references vs_weeks(id) on delete cascade,
  player_name text not null,
  mon int default 0,
  tue int default 0,
  wed int default 0,
  thu int default 0,
  fri int default 0,
  sat int default 0,
  total int default 0
);

-- 3. Enable RLS (Optional for now, required for secure production)
alter table players enable row level security;
alter table vs_weeks enable row level security;
alter table vs_records enable row level security;

-- Allow public read/write for this hobby project
create policy "Public Access" on players for all using (true) with check (true);
create policy "Public Access VS" on vs_weeks for all using (true) with check (true);
create policy "Public Access Records" on vs_records for all using (true) with check (true);
`}
          </pre>
        </section>

        <section>
            <h3 className="text-xl font-semibold text-white mb-3">Admin Login Setup</h3>
            <p className="text-slate-400 mb-2">
                For the admin panel to work, go to <strong>Authentication &gt; Users</strong> in Supabase and create a user with:
            </p>
            <ul className="list-disc list-inside text-slate-300 font-mono text-sm ml-4">
                <li>Email: <strong>admin@admin.com</strong></li>
                <li>Password: <strong>(your chosen password)</strong></li>
            </ul>
        </section>
      </div>
    </div>
  );
};

export default BackendReference;
