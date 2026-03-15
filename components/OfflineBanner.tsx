import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { useVehicleStore } from '../store/vehicleStore';

export function OfflineBanner() {
  const { isOnline, syncQueue, isSyncing } = useVehicleStore();
  const slideAnim = useRef(new Animated.Value(0)).current;

  const pendingCount = syncQueue.filter(
    (q) => q.status === 'pending' || q.status === 'syncing'
  ).length;

  const visible = !isOnline || pendingCount > 0;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, slideAnim]);

  const getMessage = () => {
    if (!isOnline && pendingCount > 0) return `Offline · ${pendingCount} record${pendingCount > 1 ? 's' : ''} pending sync`;
    if (!isOnline) return 'Offline · Forms saved locally';
    if (isSyncing) return `Syncing ${pendingCount} record${pendingCount > 1 ? 's' : ''}…`;
    if (pendingCount > 0) return `${pendingCount} record${pendingCount > 1 ? 's' : ''} pending sync`;
    return '';
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
        opacity: slideAnim,
        backgroundColor: !isOnline ? '#2D1B00' : '#0D1F2D',
        borderBottomWidth: 1,
        borderBottomColor: !isOnline ? '#F59E0B' : '#3B82F6',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
      }}
    >
      <View className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
      <Text className="text-xs font-medium text-yellow-300">{getMessage()}</Text>
    </Animated.View>
  );
}
