#!/usr/bin/env node
/**
 * seed.js — Seeds 500 vehicles into Supabase.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_KEY=your_anon_key node scripts/seed.js
 *
 * Or set values directly below (don't commit real keys).
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

const MAKES_MODELS = {
  Toyota: ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma', 'Tundra', 'Prius'],
  Honda: ['Civic', 'Accord', 'CR-V', 'Pilot', 'HR-V', 'Odyssey'],
  Ford: ['F-150', 'Mustang', 'Explorer', 'Escape', 'Bronco', 'Ranger'],
  Chevrolet: ['Silverado', 'Malibu', 'Equinox', 'Traverse', 'Tahoe', 'Camaro'],
  BMW: ['3 Series', '5 Series', 'X3', 'X5', 'M3', 'M5'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'GLC', 'GLE', 'GLS'],
  Audi: ['A4', 'A6', 'Q3', 'Q5', 'Q7'],
  Tesla: ['Model 3', 'Model S', 'Model X', 'Model Y'],
  Nissan: ['Altima', 'Rogue', 'Murano', 'Pathfinder', 'Frontier'],
  Volkswagen: ['Jetta', 'Passat', 'Tiguan', 'Atlas', 'Golf'],
};

const COLORS = ['Midnight Black','Pearl White','Arctic Silver','Ocean Blue','Racing Red','Forest Green','Space Gray','Champagne Gold'];
const STATUSES = ['in_transit','arrived','inspected','released','hold','damaged'];
const FUELS = ['gasoline','diesel','electric','hybrid','plug_in_hybrid'];
const DRIVES = ['FWD','RWD','AWD','4WD'];
const ENGINES = ['2.0L I4','2.5L I4','3.0L V6','3.5L V6','5.0L V8','Electric Motor','1.5L Turbo'];
const TRANSMISSIONS = ['6-Speed Manual','8-Speed Automatic','CVT','Dual-Clutch','10-Speed Automatic','Single-Speed'];
const TRIMS = ['Base','Sport','Premium','Limited','XLE','Platinum','Touring'];
const LOCATIONS = ['Lot A-North','Lot A-South','Lot B-East','Lot B-West','Dock 1','Dock 2','Dock 3','Inspection Bay'];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
const vin = () => Array.from({ length: 17 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  const r = (Math.random() * 16) | 0;
  return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
});
const randDate = () => {
  const now = Date.now();
  const past = now - 90 * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past)).toISOString();
};

let lotCounter = 1;

function makeVehicle() {
  const makes = Object.keys(MAKES_MODELS);
  const make = rand(makes);
  const model = rand(MAKES_MODELS[make]);
  const fuel = make === 'Tesla' ? 'electric' : rand(FUELS);
  return {
    vin: vin(),
    idempotency_key: uuid(),
    make,
    model,
    year: randInt(2019, 2025),
    trim: rand(TRIMS),
    color: rand(COLORS),
    status: rand(STATUSES),
    fuel_type: fuel,
    drive_type: rand(DRIVES),
    engine: fuel === 'electric' ? 'Electric Motor' : rand(ENGINES),
    transmission: fuel === 'electric' ? 'Single-Speed' : rand(TRANSMISSIONS),
    mileage: randInt(0, 500),
    arrival_date: randDate(),
    location: rand(LOCATIONS),
    // Each lot_number is unique — use a counter padded to avoid collisions
    lot_number: `LOT-${String(lotCounter++).padStart(4, '0')}`,
    inspector_id: Math.random() > 0.4 ? `INS-${randInt(100, 199)}` : null,
    notes: Math.random() > 0.7 ? 'Minor cosmetic inspection required' : '',
  };
}

async function seed(count = 500) {
  console.log(`\n🚗  Seeding ${count} vehicles into Supabase…\n`);

  const BATCH = 20;
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < count; i += BATCH) {
    const batch = Array.from({ length: Math.min(BATCH, count - i) }, makeVehicle);

    const res = await fetch(`${SUPABASE_URL}/rest/v1/vehicles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal,resolution=ignore-duplicates',
      },
      body: JSON.stringify(batch),
    });

    if (res.ok || res.status === 201) {
      created += batch.length;
    } else {
      const text = await res.text();
      console.error(`Batch ${i / BATCH + 1} error ${res.status}:`, text);
      skipped += batch.length;
    }

    process.stdout.write(`\r  Progress: ${Math.min(i + BATCH, count)}/${count}`);
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n\n✅  Done! Inserted ≈${created} vehicles (${skipped} skipped/errored).\n`);
}

seed(500).catch(console.error);
