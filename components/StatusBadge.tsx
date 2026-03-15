import React from 'react';
import { View, Text } from 'react-native';
import { VehicleStatus } from '../types';
import { STATUS_COLORS, STATUS_LABELS } from '../constants';

interface StatusBadgeProps {
  status: VehicleStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const color = STATUS_COLORS[status] ?? '#888';
  const label = STATUS_LABELS[status] ?? status;
  const pad = size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1';
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';

  return (
    <View
      className={`flex-row items-center rounded-full border self-start gap-1.5 ${pad}`}
      style={{ backgroundColor: color + '20', borderColor: color + '50' }}
    >
      <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      <Text className={`${textSize} font-bold tracking-wide`} style={{ color }}>
        {label}
      </Text>
    </View>
  );
}
