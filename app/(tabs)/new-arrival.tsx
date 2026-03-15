import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { NewVehicleForm, VehicleStatus, FuelType, DriveType } from '../../types';
import { useVehicleStore } from '../../store/vehicleStore';
import { vehicleApi } from '../../services/api';
import { syncQueueService } from '../../services/syncQueue';
import { TextField, SelectField } from '../../components/FormFields';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { VEHICLE_MAKES } from '../../constants';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const MAKE_OPTIONS = VEHICLE_MAKES.map((m) => ({ label: m, value: m }));

const STATUS_OPTIONS: { label: string; value: VehicleStatus }[] = [
  { label: 'Arrived', value: 'arrived' },
  { label: 'In Transit', value: 'in_transit' },
  { label: 'Inspected', value: 'inspected' },
  { label: 'Released', value: 'released' },
  { label: 'On Hold', value: 'hold' },
  { label: 'Damaged', value: 'damaged' },
];

const FUEL_OPTIONS: { label: string; value: FuelType }[] = [
  { label: 'Gasoline', value: 'gasoline' },
  { label: 'Diesel', value: 'diesel' },
  { label: 'Electric', value: 'electric' },
  { label: 'Hybrid', value: 'hybrid' },
  { label: 'Plug-in Hybrid', value: 'plug_in_hybrid' },
];

const DRIVE_OPTIONS: { label: string; value: DriveType }[] = [
  { label: 'Front-Wheel Drive (FWD)', value: 'FWD' },
  { label: 'Rear-Wheel Drive (RWD)', value: 'RWD' },
  { label: 'All-Wheel Drive (AWD)', value: 'AWD' },
  { label: '4-Wheel Drive (4WD)', value: '4WD' },
];

type FormErrors = Partial<Record<keyof NewVehicleForm | 'vinDuplicate' | 'lotDuplicate', string>>;

function defaultForm(): NewVehicleForm {
  return {
    vin: '', make: 'Toyota', model: '', year: new Date().getFullYear(),
    trim: '', color: '', status: 'arrived', fuel_type: 'gasoline',
    drive_type: 'FWD', mileage: 0, engine: '', transmission: '',
    arrival_date: new Date().toISOString().split('T')[0],
    location: '', lot_number: '', inspector_id: '', notes: '',
  };
}

function validateForm(form: NewVehicleForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.vin.trim()) errors.vin = 'VIN is required';
  else if (form.vin.trim().length !== 17) errors.vin = 'VIN must be exactly 17 characters';
  if (!form.make.trim()) errors.make = 'Make is required';
  if (!form.model.trim()) errors.model = 'Model is required';
  if (!form.year || form.year < 1900 || form.year > new Date().getFullYear() + 2) errors.year = 'Enter a valid year';
  if (!form.lot_number.trim()) errors.lot_number = 'Lot number is required';
  if (!form.location.trim()) errors.location = 'Location is required';
  if (!form.color.trim()) errors.color = 'Color is required';
  return errors;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View className="flex-row items-center mt-6 mb-4 gap-3">
      <Text className="text-xs font-bold text-brand uppercase tracking-widest">{title}</Text>
      <View className="flex-1 h-px bg-border" />
    </View>
  );
}

function NewArrivalInner() {
  const router = useRouter();
  const { isOnline, addVehicleLocally, loadSyncQueue } = useVehicleStore();
  const [form, setForm] = useState<NewVehicleForm>(defaultForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const setField = useCallback(<K extends keyof NewVehicleForm>(key: K, value: NewVehicleForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const handleSubmit = async () => {
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    const idempotency_key = generateUUID();

    try {
      // Check for duplicates (online only)
      if (isOnline) {
        const [vinExists, lotExists] = await Promise.all([
          vehicleApi.checkVinExists(form.vin),
          vehicleApi.checkLotExists(form.lot_number),
        ]);

        if (vinExists) {
          setErrors({ vin: '⚠️ This VIN already exists in the database' });
          setSubmitting(false);
          return;
        }
        if (lotExists) {
          setErrors({ lot_number: '⚠️ This lot number is already occupied' });
          setSubmitting(false);
          return;
        }

        const created = await vehicleApi.createVehicle({ ...form, idempotency_key });
        addVehicleLocally(created);
        Alert.alert(
          '✅ Vehicle Added',
          `${form.year} ${form.make} ${form.model} has been recorded.`,
          [
            { text: 'Add Another', onPress: () => setForm(defaultForm()) },
            { text: 'View Fleet', onPress: () => router.push('/') },
          ]
        );
      } else {
        await syncQueueService.enqueue(form, idempotency_key);
        await loadSyncQueue();
        addVehicleLocally({
          ...form,
          id: `local-${idempotency_key}`,
          idempotency_key,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        Alert.alert(
          '📥 Saved Offline',
          'No connection detected. This record has been saved locally and will sync when you reconnect.',
          [
            { text: 'Add Another', onPress: () => setForm(defaultForm()) },
            { text: 'View Queue', onPress: () => router.push('/sync') },
          ]
        );
      }
      router.push('/')
    } catch (err) {
      // Fallback to queue on any network failure
      await syncQueueService.enqueue(form, idempotency_key);
      await loadSyncQueue();
      Alert.alert(
        '⚠️ Submission Failed',
        'The record has been saved to the sync queue and will retry automatically.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
      
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Offline notice */}
        {!isOnline && (
          <View className="flex-row items-center bg-yellow-950 border border-yellow-600 rounded-2xl p-4 mb-4 gap-3">
            <Text className="text-2xl">📡</Text>
            <View className="flex-1">
              <Text className="text-sm font-bold text-yellow-300 mb-0.5">Offline Mode</Text>
              <Text className="text-xs text-yellow-400 leading-4">
                Your submission will be queued and synced when connectivity is restored.
              </Text>
            </View>
          </View>
        )}

        <SectionHeader title="Vehicle Identity" />
        <TextField label="VIN *" value={form.vin} onChangeText={(v) => setField('vin', v.toUpperCase())}
          placeholder="17-character VIN" autoCapitalize="characters" error={errors.vin}
          hint="Example: 1HGBH41JXMN109186" />
        <SelectField label="Make *" value={form.make} onChange={(v) => setField('make', v)}
          options={MAKE_OPTIONS} error={errors.make} />
        <TextField label="Model *" value={form.model} onChangeText={(v) => setField('model', v)}
          placeholder="e.g. Camry" error={errors.model} />
        <TextField label="Year *" value={form.year.toString()} onChangeText={(v) => setField('year', parseInt(v, 10) || 0)}
          placeholder="e.g. 2024" keyboardType="numeric" error={errors.year} />
        <TextField label="Trim" value={form.trim} onChangeText={(v) => setField('trim', v)} placeholder="e.g. XLE Premium" />
        <TextField label="Color *" value={form.color} onChangeText={(v) => setField('color', v)}
          placeholder="e.g. Midnight Black" error={errors.color} />

        <SectionHeader title="Technical Details" />
        <SelectField label="Fuel Type" value={form.fuel_type} onChange={(v) => setField('fuel_type', v)} options={FUEL_OPTIONS} />
        <SelectField label="Drive Type" value={form.drive_type} onChange={(v) => setField('drive_type', v)} options={DRIVE_OPTIONS} />
        <TextField label="Engine" value={form.engine} onChangeText={(v) => setField('engine', v)} placeholder="e.g. 2.5L I4" />
        <TextField label="Transmission" value={form.transmission} onChangeText={(v) => setField('transmission', v)}
          placeholder="e.g. 8-Speed Automatic" />
        <TextField label="Mileage (miles)" value={form.mileage.toString()}
          onChangeText={(v) => setField('mileage', parseInt(v, 10) || 0)} keyboardType="numeric" placeholder="0" />

        <SectionHeader title="Yard Logistics" />
        <SelectField label="Status" value={form.status} onChange={(v) => setField('status', v)} options={STATUS_OPTIONS} />
        <TextField label="Lot Number *" value={form.lot_number}
          onChangeText={(v) => setField('lot_number', v.toUpperCase())} placeholder="e.g. LOT-0042"
          autoCapitalize="characters" error={errors.lot_number} />
        <TextField label="Location *" value={form.location} onChangeText={(v) => setField('location', v)}
          placeholder="e.g. Dock 3 - Bay 12" error={errors.location} />
        <TextField label="Arrival Date" value={form.arrival_date}
          onChangeText={(v) => setField('arrival_date', v)} placeholder="YYYY-MM-DD" />
        <TextField label="Inspector ID" value={form.inspector_id}
          onChangeText={(v) => setField('inspector_id', v)} placeholder="e.g. INS-142" autoCapitalize="characters" />
        <TextField label="Notes" value={form.notes} onChangeText={(v) => setField('notes', v)}
          placeholder="Any additional observations…" multiline />

        <TouchableOpacity
          className={`bg-brand rounded-2xl py-4 flex-row justify-center items-center gap-2 mt-4 ${
            submitting ? 'opacity-60' : ''
          }`}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text className="text-lg">{isOnline ? '🚀' : '📥'}</Text>
              <Text className="text-white text-base font-bold tracking-wide">
                {isOnline ? 'Submit Vehicle' : 'Save to Sync Queue'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="py-3.5 items-center mt-2"
          onPress={() => { setForm(defaultForm()); setErrors({}); }}
        >
          <Text className="text-muted text-sm font-medium">Reset Form</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function NewArrivalScreen() {
  return (
    <SafeAreaView className="flex-1 bg-base" edges={['bottom']}>
      <ErrorBoundary screenName="NewArrival">
        <NewArrivalInner />
      </ErrorBoundary>
    </SafeAreaView>
  );
}
