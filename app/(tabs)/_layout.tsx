import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { useVehicleStore } from '../../store/vehicleStore';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
  );
}

function SyncTabIcon({ focused }: { focused: boolean }) {
  const { syncQueue } = useVehicleStore();
  const pending = syncQueue.filter((q) => q.status === 'pending' || q.status === 'failed').length;
  return (
    <View>
      <TabIcon emoji="🔄" focused={focused} />
      {pending > 0 && (
        <View className="absolute -top-1 -right-2 bg-red-500 rounded-full w-4 h-4 items-center justify-center">
          <Text className="text-white text-[9px] font-bold">{pending > 9 ? '9+' : pending}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#12121A',
          borderTopColor: '#252535',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#5B5FEF',
        tabBarInactiveTintColor: '#55556A',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        headerStyle: { backgroundColor: '#12121A' },
        headerTintColor: '#F1F1F8',
        headerTitleStyle: { fontWeight: '700', color: '#F1F1F8' },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Fleet', tabBarIcon: ({ focused }) => <TabIcon emoji="🚗" focused={focused} /> }}
      />
      <Tabs.Screen
        name="new-arrival"
        options={{ title: 'New Arrival', tabBarIcon: ({ focused }) => <TabIcon emoji="➕" focused={focused} /> }}
      />
      <Tabs.Screen
        name="sync"
        options={{ title: 'Sync Queue', tabBarIcon: ({ focused }) => <SyncTabIcon focused={focused} /> }}
      />
    </Tabs>
  );
}
