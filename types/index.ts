export type VehicleStatus =
  | 'in_transit'
  | 'arrived'
  | 'inspected'
  | 'released'
  | 'hold'
  | 'damaged';

export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'plug_in_hybrid';

export type DriveType = 'FWD' | 'RWD' | 'AWD' | '4WD';

export interface Vehicle {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  color: string;
  status: VehicleStatus;
  fuel_type: FuelType;
  drive_type: DriveType;
  mileage: number;
  engine: string;
  transmission: string;
  arrival_date: string;
  location: string;
  lot_number: string;
  inspector_id: string | null;
  notes: string;
  idempotency_key: string;
  created_at: string;
  updated_at: string;
}

export interface NewVehicleForm {
  vin: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  color: string;
  status: VehicleStatus;
  fuel_type: FuelType;
  drive_type: DriveType;
  mileage: number;
  engine: string;
  transmission: string;
  arrival_date: string;
  location: string;
  lot_number: string;
  inspector_id: string;
  notes: string;
}

export interface SyncQueueItem {
  id: string;
  idempotency_key: string;
  payload: NewVehicleForm;
  created_at: string;
  retry_count: number;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
}

export interface ApiResponse<T> {
  data: T;
  total?: number;
  page?: number;
  limit?: number;
}

export interface FilterOptions {
  status?: VehicleStatus | 'all';
  make?: string;
  year?: number;
  search?: string;
}
