import React, { useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SyncQueueItem } from '../../types';
import { useVehicleStore } from '../../store/vehicleStore';
import { syncQueueService } from '../../services/syncQueue';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { MAX_RETRY_COUNT } from '../../constants';

function SyncQueueInner() {
  const { syncQueue, isSyncing, isOnline, lastSyncedAt, loadSyncQueue, syncQueue_process } =
    useVehicleStore();

  useEffect(() => { loadSyncQueue(); }, [loadSyncQueue]);

  const handleSync = useCallback(async () => {
    if (!isOnline) {
      Alert.alert('Offline', 'You must be connected to sync records.');
      return;
    }
    const synced = await syncQueue_process();
    Alert.alert(
      synced > 0 ? '✅ Sync Complete' : 'Sync Complete',
      synced > 0
        ? `${synced} record${synced > 1 ? 's' : ''} successfully synced.`
        : 'No new records to sync.'
    );
  }, [isOnline, syncQueue_process]);

  const handleClearFailed = useCallback(async () => {
    Alert.alert('Clear Failed Records', 'Permanently remove all failed records?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: async () => {
          const queue = await syncQueueService.getQueue();
          await syncQueueService.saveQueue(queue.filter((q) => q.status !== 'failed'));
          await loadSyncQueue();
        },
      },
    ]);
  }, [loadSyncQueue]);

  const pendingCount = syncQueue.filter((q) => q.status === 'pending' || q.status === 'syncing').length;
  const failedCount = syncQueue.filter((q) => q.status === 'failed').length;

  return (
    <View className="flex-1 bg-base">
      {/* Stats */}
      <View className="flex-row px-4 pt-4 gap-3">
        {[
          { value: syncQueue.length, label: 'Total', color: '#8888A8' },
          { value: pendingCount, label: 'Pending', color: '#F59E0B' },
          { value: failedCount, label: 'Failed', color: '#EF4444' },
        ].map((s) => (
          <View key={s.label} className="flex-1 bg-surface border border-border rounded-2xl p-4 items-center">
            <Text className="text-3xl font-black tracking-tight" style={{ color: s.color }}>{s.value}</Text>
            <Text className="text-[11px] text-muted font-bold uppercase tracking-wider mt-0.5">{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Connection badge */}
      <View className={`flex-row items-center mx-4 mt-3 px-4 py-2.5 rounded-xl border gap-2 ${
        isOnline
          ? 'bg-emerald-950 border-emerald-800'
          : 'bg-red-950 border-red-800'
      }`}>
        <View className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-400'}`} />
        <Text className={`text-sm font-medium ${isOnline ? 'text-emerald-300' : 'text-red-300'}`}>
          {isOnline ? 'Connected — ready to sync' : 'Offline — sync unavailable'}
        </Text>
      </View>

      {pendingCount > 0 && (
        <TouchableOpacity
          className={`flex-row items-center justify-center mx-4 mt-3 py-3.5 bg-brand rounded-2xl gap-2 ${
            (!isOnline || isSyncing) ? 'opacity-50' : ''
          }`}
          onPress={handleSync}
          disabled={!isOnline || isSyncing}
        >
          {isSyncing ? (
            <><ActivityIndicator color="#fff" size="small" /><Text className="text-white font-bold text-[15px]">Syncing…</Text></>
          ) : (
            <><Text className="text-lg">🔄</Text><Text className="text-white font-bold text-[15px]">Sync {pendingCount} Record{pendingCount > 1 ? 's' : ''} Now</Text></>
          )}
        </TouchableOpacity>
      )}

      {lastSyncedAt && (
        <Text className="text-center text-[11px] text-muted mt-2">
          Last synced: {new Date(lastSyncedAt).toLocaleTimeString()}
        </Text>
      )}

      {failedCount > 0 && (
        <TouchableOpacity
          className="mx-4 mt-2 py-2.5 rounded-xl border border-red-500/40 items-center"
          onPress={handleClearFailed}
        >
          <Text className="text-red-400 font-semibold text-sm">
            Clear {failedCount} Failed Record{failedCount > 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={syncQueue}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SyncQueueCard item={item} />}
        contentContainerStyle={{ padding: 16, paddingTop: 12, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={loadSyncQueue} tintColor="#5B5FEF" />
        }
        ListEmptyComponent={
          <View className="pt-16 items-center px-8">
            <Text className="text-5xl mb-4">✅</Text>
            <Text className="text-lg font-bold text-primary mb-2">Queue is empty</Text>
            <Text className="text-sm text-secondary text-center leading-5">
              All records are synced. New arrivals added offline will appear here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

function SyncQueueCard({ item }: { item: SyncQueueItem }) {
  const cfg = {
    pending: { color: '#F59E0B', icon: '⏳', label: 'Pending' },
    syncing: { color: '#3B82F6', icon: '🔄', label: 'Syncing…' },
    failed:  { color: '#EF4444', icon: '❌', label: 'Failed' },
  }[item.status];

  const exhausted = item.retry_count >= MAX_RETRY_COUNT;

  return (
    <View className="bg-surface border border-border rounded-2xl p-4 mb-2.5">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 mr-3">
          <Text className="text-[11px] text-muted font-mono tracking-wider mb-0.5">
            {item.payload.vin || 'No VIN'}
          </Text>
          <Text className="text-[15px] font-bold text-primary">
            {item.payload.year} {item.payload.make} {item.payload.model}
          </Text>
        </View>
        <View className="flex-row items-center px-2.5 py-1 rounded-full gap-1"
          style={{ backgroundColor: cfg.color + '20' }}>
          <Text className="text-[11px]">{cfg.icon}</Text>
          <Text className="text-[11px] font-bold" style={{ color: cfg.color }}>{cfg.label}</Text>
        </View>
      </View>

      <View className="flex-row gap-3 mb-2">
        {[
          { icon: '📍', label: item.payload.lot_number || '—' },
          { icon: '📅', label: new Date(item.created_at).toLocaleDateString() },
          { icon: '🔁', label: `Retry ${item.retry_count}/${MAX_RETRY_COUNT}` },
        ].map((m) => (
          <View key={m.label} className="flex-row items-center gap-1">
            <Text className="text-[11px]">{m.icon}</Text>
            <Text className="text-[11px] text-secondary">{m.label}</Text>
          </View>
        ))}
      </View>

      {item.status === 'failed' && item.error && (
        <View className="bg-red-950 border-l-2 border-red-500 rounded-lg p-2 mb-2">
          <Text className="text-[11px] text-red-400" numberOfLines={2}>
            {exhausted ? '⛔ Max retries — ' : ''}{item.error}
          </Text>
        </View>
      )}

      <Text className="text-[9px] text-muted font-mono" numberOfLines={1}>
        Key: {item.idempotency_key}
      </Text>
    </View>
  );
}

export default function SyncQueueScreen() {
  return (
    <SafeAreaView className="flex-1 bg-base" edges={['bottom']}>
      <ErrorBoundary screenName="SyncQueue">
        <SyncQueueInner />
      </ErrorBoundary>
    </SafeAreaView>
  );
}
