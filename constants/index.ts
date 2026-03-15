export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const COLORS = {
  background: '#0A0A0F',
  surface: '#12121A',
  surfaceElevated: '#1A1A26',
  surfaceBorder: '#252535',
  primary: '#5B5FEF',
  primaryLight: '#7B7FF5',
  primaryDark: '#3D40C9',
  accent: '#F5A623',
  statusInTransit: '#3B82F6',
  statusArrived: '#10B981',
  statusInspected: '#8B5CF6',
  statusReleased: '#06B6D4',
  statusHold: '#F59E0B',
  statusDamaged: '#EF4444',
  textPrimary: '#F1F1F8',
  textSecondary: '#8888A8',
  textMuted: '#55556A',
  white: '#FFFFFF',
  black: '#000000',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  offlineBg: '#2D1B00',
  offlineBorder: '#F59E0B',
  offlineText: '#FCD34D',
};

export const STATUS_LABELS: Record<string, string> = {
  in_transit: 'In Transit',
  arrived: 'Arrived',
  inspected: 'Inspected',
  released: 'Released',
  hold: 'On Hold',
  damaged: 'Damaged',
  all: 'All',
};

export const STATUS_COLORS: Record<string, string> = {
  in_transit: COLORS.statusInTransit,
  arrived: COLORS.statusArrived,
  inspected: COLORS.statusInspected,
  released: COLORS.statusReleased,
  hold: COLORS.statusHold,
  damaged: COLORS.statusDamaged,
};

export const VEHICLE_MAKES = [
  'Toyota','Honda','Ford','Chevrolet','BMW','Mercedes-Benz',
  'Audi','Volkswagen','Nissan','Hyundai','Kia','Mazda',
  'Subaru','Lexus','Acura','Infiniti','Cadillac','Lincoln',
  'Jeep','RAM','Dodge','Chrysler','GMC','Buick',
  'Volvo','Porsche','Land Rover','Jaguar','Mitsubishi','Tesla',
];

export const SYNC_STORAGE_KEY = '@autotrack_sync_queue';
export const MAX_RETRY_COUNT = 3;
export const SYNC_INTERVAL_MS = 30000;
