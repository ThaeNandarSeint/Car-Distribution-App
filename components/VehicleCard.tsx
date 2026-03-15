import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Vehicle } from '../types';
import { StatusBadge } from './StatusBadge';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: (vehicle: Vehicle) => void;
}

const FUEL_ICONS: Record<string, string> = {
  gasoline: '⛽', diesel: '🛢️', electric: '⚡', hybrid: '🌿', plug_in_hybrid: '🔌',
};

export const VehicleCard = memo(function VehicleCard({ vehicle, onPress }: VehicleCardProps) {
  return (
    <TouchableOpacity
      className="bg-surface rounded-2xl p-4 mx-4 mb-2.5 border border-border active:opacity-75"
      onPress={() => onPress(vehicle)}
      activeOpacity={0.75}
    >
      <View className="flex-row justify-between items-start mb-1">
        <View className="flex-1 mr-3">
          <Text className="text-[11px] text-brand font-bold tracking-widest uppercase mb-0.5">
            {vehicle.year}
          </Text>
          <Text className="text-base font-bold text-primary tracking-tight" numberOfLines={1}>
            {vehicle.make} {vehicle.model}
          </Text>
        </View>
        <StatusBadge status={vehicle.status} size="sm" />
      </View>

      <Text className="text-[11px] text-muted font-mono tracking-wider mb-2.5">
        {vehicle.vin}
      </Text>

      <View className="flex-row flex-wrap gap-1.5">
        {[
          { icon: '📍', label: vehicle.lot_number },
          { icon: FUEL_ICONS[vehicle.fuel_type] ?? '⛽', label: vehicle.fuel_type.replace('_', ' ') },
          { icon: '🎨', label: vehicle.color },
          { icon: '📏', label: `${vehicle.mileage} mi` },
        ].map((chip) => (
          <View key={chip.label} className="flex-row items-center bg-elevated px-2 py-0.5 rounded-md gap-1">
            <Text className="text-[11px]">{chip.icon}</Text>
            <Text className="text-[11px] text-secondary font-medium capitalize" numberOfLines={1}>
              {chip.label}
            </Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
});
