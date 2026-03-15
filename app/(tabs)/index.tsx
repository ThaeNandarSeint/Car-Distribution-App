import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  RefreshControl, ActivityIndicator, ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Vehicle, VehicleStatus } from '../../types';
import { useVehicleStore } from '../../store/vehicleStore';
import { VehicleCard } from '../../components/VehicleCard';
import { ErrorBoundary } from '../../components/ErrorBoundary';

const STATUS_FILTERS: Array<{ label: string; value: VehicleStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'In Transit', value: 'in_transit' },
  { label: 'Arrived', value: 'arrived' },
  { label: 'Inspected', value: 'inspected' },
  { label: 'Released', value: 'released' },
  { label: 'On Hold', value: 'hold' },
  { label: 'Damaged', value: 'damaged' },
];

function FleetScreenInner() {
  const router = useRouter();
  const { filteredVehicles, isLoading, error, filters, fetchVehicles, applyFilters, clearError, lastFetched } =
    useVehicleStore();

  const [searchText, setSearchText] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (!lastFetched) fetchVehicles(); }, [fetchVehicles, lastFetched]);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => applyFilters({ ...filters, search: text }), 300);
  }, [filters, applyFilters]);

  const handleStatusFilter = useCallback((status: VehicleStatus | 'all') => {
    applyFilters({ ...filters, status });
  }, [filters, applyFilters]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVehicles();
    setRefreshing(false);
  }, [fetchVehicles]);

  const keyExtractor = useCallback((item: Vehicle) => item.id, []);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<Vehicle>) => (
    <VehicleCard vehicle={item} onPress={(v) => router.push(`/vehicle/${v.id}`)} />
  ), [router]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: 132, offset: 132 * index, index,
  }), []);

  const ListHeader = (
    <View>
      {/* Header */}
      <View className="px-4 pt-4 pb-2 flex-row justify-between items-center">
        <View>
          <Text className="text-2xl font-black text-primary tracking-tight">Fleet</Text>
          <Text className="text-xs text-muted mt-0.5">
            {filteredVehicles.length.toLocaleString()} vehicles
            {lastFetched ? ` · ${new Date(lastFetched).toLocaleTimeString()}` : ''}
          </Text>
        </View>
        <TouchableOpacity
          className="bg-brand/20 border border-brand/40 rounded-xl px-3 py-1.5"
          onPress={() => { clearError(); fetchVehicles(); }}
        >
          <Text className="text-brand text-xs font-semibold">Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View className="mx-4 mb-3 flex-row items-center bg-elevated border border-border rounded-2xl px-4 gap-2">
        <Text className="text-base">🔍</Text>
        <TextInput
          className="flex-1 h-11 text-primary text-[15px]"
          value={searchText}
          onChangeText={handleSearch}
          placeholder="Search VIN, make, model, lot…"
          placeholderTextColor="#55556A"
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Status filters */}
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(f) => f.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className={`px-3.5 py-1.5 rounded-full border ${
              filters.status === item.value
                ? 'bg-brand/25 border-brand'
                : 'bg-elevated border-border'
            }`}
            onPress={() => handleStatusFilter(item.value)}
          >
            <Text className={`text-[13px] font-medium ${
              filters.status === item.value ? 'text-brand font-bold' : 'text-secondary'
            }`}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  if (error) {
    return (
      <View className="flex-1 justify-center items-center px-8">
        <Text className="text-4xl mb-4">⚠️</Text>
        <Text className="text-lg font-bold text-primary mb-2">Failed to load fleet</Text>
        <Text className="text-sm text-secondary text-center mb-6">{error}</Text>
        <TouchableOpacity
          className="bg-brand px-8 py-3.5 rounded-full"
          onPress={() => { clearError(); fetchVehicles(); }}
        >
          <Text className="text-white font-bold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {isLoading && !refreshing && filteredVehicles.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#5B5FEF" />
          <Text className="text-secondary text-sm mt-4">Loading fleet…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredVehicles}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={15}
          maxToRenderPerBatch={20}
          windowSize={10}
          removeClippedSubviews={true}
          updateCellsBatchingPeriod={50}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#5B5FEF" />
          }
          ListEmptyComponent={
            <View className="pt-20 items-center px-8">
              <Text className="text-5xl mb-4">🔍</Text>
              <Text className="text-lg font-bold text-primary mb-2">No vehicles found</Text>
              <Text className="text-sm text-secondary text-center">Try adjusting your search or filters</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

export default function FleetScreen() {
  return (
    <SafeAreaView className="flex-1 bg-base" edges={['bottom']}>
      <ErrorBoundary screenName="Fleet">
        <FleetScreenInner />
      </ErrorBoundary>
    </SafeAreaView>
  );
}
