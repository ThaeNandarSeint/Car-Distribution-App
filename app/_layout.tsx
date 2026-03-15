import '../global.css';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { OfflineBanner } from '../components/OfflineBanner';
import { useNetworkMonitor } from '../hooks/useNetworkMonitor';
import { useVehicleStore } from '../store/vehicleStore';

function RootLayoutInner() {
  useNetworkMonitor();
  const { loadSyncQueue } = useVehicleStore();

  useEffect(() => {
    loadSyncQueue();
  }, [loadSyncQueue]);

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0F' }}>
      <OfflineBanner />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#12121A' },
          headerTintColor: '#F1F1F8',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 17,
            color: '#F1F1F8',
          },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#0A0A0F' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="vehicle/[id]"
          options={{
            title: 'Vehicle Detail',
            headerBackTitle: 'Fleet',
            presentation: 'card',
          }}
        />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ErrorBoundary screenName="Root">
        <RootLayoutInner />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
