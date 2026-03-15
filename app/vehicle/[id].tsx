import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Vehicle } from '../../types';
import { vehicleApi } from '../../services/api';
import { useVehicleStore } from '../../store/vehicleStore';
import { StatusBadge } from '../../components/StatusBadge';
import { ErrorBoundary } from '../../components/ErrorBoundary';

function VehicleDetailInner() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { vehicles } = useVehicleStore();
  const [vehicle, setVehicle] = useState<Vehicle | null>(
    () => vehicles.find((v) => v.id === id) ?? null
  );
  const [loading, setLoading] = useState(!vehicle);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicle && id) {
      setLoading(true);
      vehicleApi.getVehicle(id)
        .then(setVehicle)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id, vehicle]);

  if (loading) {
    return (
      <View className="flex-1 bg-base justify-center items-center">
        <ActivityIndicator size="large" color="#5B5FEF" />
      </View>
    );
  }

  if (error || !vehicle) {
    return (
      <View className="flex-1 bg-base justify-center items-center px-8">
        <Text className="text-4xl mb-4">⚠️</Text>
        <Text className="text-lg font-bold text-primary mb-2">Vehicle not found</Text>
        <Text className="text-sm text-secondary text-center mb-6">{error ?? 'This record may have been removed.'}</Text>
        <TouchableOpacity className="bg-brand px-8 py-3.5 rounded-full" onPress={() => router.back()}>
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLocal = vehicle.id.startsWith('local-');

  return (
    <ScrollView className="flex-1 bg-base" contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View className="bg-surface border border-border rounded-3xl p-6 mb-4 flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="text-[11px] text-brand font-bold tracking-widest uppercase mb-0.5">{vehicle.year}</Text>
          <Text className="text-2xl font-black text-primary tracking-tight mb-1">
            {vehicle.make} {vehicle.model}
          </Text>
          <Text className="text-sm text-secondary font-medium">{vehicle.trim}</Text>
        </View>
        <View className="items-end gap-2">
          <StatusBadge status={vehicle.status} />
          {isLocal && (
            <View className="bg-yellow-500/20 border border-yellow-500/40 rounded-full px-3 py-1">
              <Text className="text-xs text-yellow-400 font-semibold">📥 Pending Sync</Text>
            </View>
          )}
        </View>
      </View>

      {/* VIN */}
      <View className="bg-elevated border border-border rounded-xl p-4 mb-4">
        <Text className="text-[10px] text-muted font-bold uppercase tracking-widest mb-1">VIN</Text>
        <Text className="text-lg text-primary font-mono tracking-widest">{vehicle.vin}</Text>
      </View>

      <DetailSection title="Technical Specifications">
        <DetailRow icon="🎨" label="Color" value={vehicle.color} />
        <DetailRow icon="⛽" label="Fuel Type" value={vehicle.fuel_type.replace('_', ' ')} />
        <DetailRow icon="🔧" label="Engine" value={vehicle.engine || '—'} />
        <DetailRow icon="⚙️" label="Transmission" value={vehicle.transmission || '—'} />
        <DetailRow icon="🚗" label="Drive Type" value={vehicle.drive_type} />
        <DetailRow icon="📏" label="Mileage" value={`${vehicle.mileage.toLocaleString()} miles`} last />
      </DetailSection>

      <DetailSection title="Yard & Logistics">
        <DetailRow icon="📍" label="Location" value={vehicle.location} />
        <DetailRow icon="🏷️" label="Lot Number" value={vehicle.lot_number} />
        <DetailRow icon="📅" label="Arrival Date"
          value={vehicle.arrival_date ? new Date(vehicle.arrival_date).toLocaleDateString() : '—'} />
        <DetailRow icon="👤" label="Inspector" value={vehicle.inspector_id ?? 'Unassigned'} last />
      </DetailSection>

      {vehicle.notes ? (
        <DetailSection title="Notes">
          <Text className="text-sm text-secondary leading-5 p-4">{vehicle.notes}</Text>
        </DetailSection>
      ) : null}

      <DetailSection title="Record Info">
        <DetailRow icon="🕐" label="Created"
          value={vehicle.created_at ? new Date(vehicle.created_at).toLocaleString() : '—'} />
        <DetailRow icon="🔑" label="Idempotency Key" value={vehicle.idempotency_key || '—'} mono last />
      </DetailSection>
    </ScrollView>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-5">
      <Text className="text-[11px] text-brand font-bold uppercase tracking-widest mb-2">{title}</Text>
      <View className="bg-surface border border-border rounded-2xl overflow-hidden">{children}</View>
    </View>
  );
}

function DetailRow({ icon, label, value, mono, last }: {
  icon: string; label: string; value: string; mono?: boolean; last?: boolean;
}) {
  return (
    <View className={`flex-row justify-between items-center px-4 py-3 ${!last ? 'border-b border-border' : ''}`}>
      <View className="flex-row items-center gap-2 flex-1">
        <Text className="text-sm">{icon}</Text>
        <Text className="text-sm text-secondary font-medium">{label}</Text>
      </View>
      <Text
        className={`text-sm font-semibold text-primary max-w-[50%] text-right capitalize ${mono ? 'font-mono text-[10px] text-muted' : ''}`}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

export default function VehicleDetailScreen() {
  return (
    <SafeAreaView className="flex-1 bg-base" edges={['bottom']}>
      <ErrorBoundary screenName="VehicleDetail">
        <VehicleDetailInner />
      </ErrorBoundary>
    </SafeAreaView>
  );
}
