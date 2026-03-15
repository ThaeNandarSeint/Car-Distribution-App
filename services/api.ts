import { supabase } from '../lib/supabase';
import { Vehicle, NewVehicleForm } from '../types';

export class SupabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'SupabaseError';
  }
}

function handleError(error: { message: string; code?: string } | null) {
  if (error) throw new SupabaseError(error.message, error.code);
}

export const vehicleApi = {
  async getVehicles(page = 1, limit = 100): Promise<Vehicle[]> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);
    handleError(error);
    return (data ?? []) as Vehicle[];
  },

  async getVehicle(id: string): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .single();
    handleError(error);
    return data as Vehicle;
  },

  /**
   * Upsert on idempotency_key — safe to call multiple times.
   * Unique DB constraints: vin, idempotency_key, lot_number
   */
  async createVehicle(
    payload: NewVehicleForm & { idempotency_key: string }
  ): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .upsert(
        {
          vin: payload.vin.trim().toUpperCase(),
          idempotency_key: payload.idempotency_key,
          make: payload.make,
          model: payload.model,
          year: payload.year,
          trim: payload.trim,
          color: payload.color,
          fuel_type: payload.fuel_type,
          drive_type: payload.drive_type,
          engine: payload.engine,
          transmission: payload.transmission,
          mileage: payload.mileage,
          status: payload.status,
          arrival_date: payload.arrival_date || new Date().toISOString(),
          lot_number: payload.lot_number.trim().toUpperCase(),
          location: payload.location,
          inspector_id: payload.inspector_id || null,
          notes: payload.notes,
        },
        { onConflict: 'idempotency_key', ignoreDuplicates: false }
      )
      .select()
      .single();
    handleError(error);
    return data as Vehicle;
  },

  async checkVinExists(vin: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('vin', vin.trim().toUpperCase());
    if (error) return false;
    return (count ?? 0) > 0;
  },

  async checkLotExists(lotNumber: string, excludeId?: string): Promise<boolean> {
    let query = supabase
      .from('vehicles')
      .select('id', { count: 'exact', head: true })
      .eq('lot_number', lotNumber.trim().toUpperCase());
    if (excludeId) query = query.neq('id', excludeId);
    const { count, error } = await query;
    if (error) return false;
    return (count ?? 0) > 0;
  },

  async updateVehicle(id: string, payload: Partial<Vehicle>): Promise<Vehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    handleError(error);
    return data as Vehicle;
  },

  async searchVehicles(query: string): Promise<Vehicle[]> {
    const q = query.trim();
    if (!q) return [];
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .or(
        `vin.ilike.%${q}%,make.ilike.%${q}%,model.ilike.%${q}%,lot_number.ilike.%${q}%,color.ilike.%${q}%`
      )
      .order('created_at', { ascending: false })
      .limit(200);
    handleError(error);
    return (data ?? []) as Vehicle[];
  },
};
