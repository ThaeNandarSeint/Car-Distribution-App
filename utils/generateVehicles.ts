import { Vehicle, VehicleStatus, FuelType, DriveType } from '../types';

const MAKES_MODELS: Record<string, string[]> = {
  Toyota: ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma', 'Tundra', 'Prius', '4Runner'],
  Honda: ['Civic', 'Accord', 'CR-V', 'Pilot', 'HR-V', 'Ridgeline', 'Odyssey'],
  Ford: ['F-150', 'Mustang', 'Explorer', 'Escape', 'Edge', 'Bronco', 'Ranger'],
  Chevrolet: ['Silverado', 'Malibu', 'Equinox', 'Traverse', 'Tahoe', 'Camaro', 'Colorado'],
  BMW: ['3 Series', '5 Series', '7 Series', 'X3', 'X5', 'X7', 'M3', 'M5'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'GLS', 'AMG GT'],
  Audi: ['A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'TT', 'R8'],
  Tesla: ['Model 3', 'Model S', 'Model X', 'Model Y', 'Cybertruck'],
  Volkswagen: ['Jetta', 'Passat', 'Tiguan', 'Atlas', 'Golf', 'Arteon'],
  Nissan: ['Altima', 'Maxima', 'Rogue', 'Murano', 'Pathfinder', 'Frontier', 'Titan'],
};

const COLORS = ['Midnight Black', 'Pearl White', 'Arctic Silver', 'Ocean Blue', 'Racing Red',
  'Forest Green', 'Sunset Orange', 'Champagne Gold', 'Space Gray', 'Deep Purple'];

const LOCATIONS = ['Lot A-North', 'Lot A-South', 'Lot B-East', 'Lot B-West',
  'Lot C-Main', 'Dock 1', 'Dock 2', 'Dock 3', 'Storage Yard', 'Inspection Bay'];

const STATUSES: VehicleStatus[] = ['in_transit', 'arrived', 'inspected', 'released', 'hold', 'damaged'];
const FUELS: FuelType[] = ['gasoline', 'diesel', 'electric', 'hybrid', 'plug_in_hybrid'];
const DRIVES: DriveType[] = ['FWD', 'RWD', 'AWD', '4WD'];
const ENGINES = ['2.0L I4', '2.5L I4', '3.0L V6', '3.5L V6', '5.0L V8', 'Electric Motor', '1.5L Turbo', '2.0L Turbo'];
const TRANSMISSIONS = ['6-Speed Manual', '8-Speed Automatic', 'CVT', 'Dual-Clutch', '10-Speed Automatic', 'Single-Speed'];
const TRIMS = ['Base', 'Sport', 'Premium', 'Limited', 'XLE', 'Platinum', 'Touring', 'Elite'];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateVIN(): string {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  return Array.from({ length: 17 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function randomDate(start: Date, end: Date): string {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

export function generateVehicles(count: number): Vehicle[] {
  const makes = Object.keys(MAKES_MODELS);
  const vehicles: Vehicle[] = [];

  for (let i = 0; i < count; i++) {
    const make = randomFrom(makes);
    const models = MAKES_MODELS[make];
    const model = randomFrom(models);
    const year = randomInt(2019, 2025);
    const fuel = make === 'Tesla' ? 'electric' : randomFrom(FUELS);
    const now = new Date();
    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    vehicles.push({
      id: `vehicle-${i + 1}`,
      vin: generateVIN(),
      make,
      model,
      year,
      trim: randomFrom(TRIMS),
      color: randomFrom(COLORS),
      status: randomFrom(STATUSES),
      fuel_type: fuel as FuelType,
      drive_type: randomFrom(DRIVES),
      mileage: randomInt(0, 500),
      engine: fuel === 'electric' ? 'Electric Motor' : randomFrom(ENGINES),
      transmission: fuel === 'electric' ? 'Single-Speed' : randomFrom(TRANSMISSIONS),
      arrival_date: randomDate(threeMonthsAgo, now),
      location: randomFrom(LOCATIONS),
      lot_number: `LOT-${String(randomInt(1, 999)).padStart(4, '0')}`,
      inspector_id: Math.random() > 0.4 ? `INS-${randomInt(100, 199)}` : null,
      notes: Math.random() > 0.7 ? 'Minor cosmetic inspection required' : '',
      idempotency_key: `seed-${i + 1}`,
      created_at: randomDate(threeMonthsAgo, now),
      updated_at: randomDate(threeMonthsAgo, now),
    });
  }

  return vehicles;
}
