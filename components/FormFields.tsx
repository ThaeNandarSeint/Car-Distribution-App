import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Platform } from 'react-native';

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  error?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  autoCapitalize?: 'none' | 'words' | 'sentences' | 'characters';
  multiline?: boolean;
  hint?: string;
}

export function TextField({
  label, value, onChangeText, placeholder, error,
  keyboardType = 'default', autoCapitalize = 'sentences', multiline, hint,
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View className="mb-4">
      <Text className="text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">{label}</Text>
      {hint && <Text className="text-[11px] text-muted mb-1">{hint}</Text>}
      <TextInput
        className={[
          'bg-elevated border rounded-xl px-4 py-3 text-primary text-[15px]',
          focused ? 'border-brand' : 'border-border',
          error ? 'border-red-500' : '',
          multiline ? 'h-20' : '',
        ].join(' ')}
        style={{ textAlignVertical: multiline ? 'top' : 'center' }}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#55556A"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
      {error && <Text className="text-xs text-red-400 mt-1">{error}</Text>}
    </View>
  );
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  onChange: (val: T) => void;
  options: { label: string; value: T }[];
  error?: string;
}

export function SelectField<T extends string>({
  label, value, onChange, options, error,
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <View className="mb-4">
      <Text className="text-xs font-bold text-secondary uppercase tracking-wider mb-1.5">{label}</Text>
      <TouchableOpacity
        className={`bg-elevated border rounded-xl px-4 py-3.5 flex-row justify-between items-center ${
          error ? 'border-red-500' : 'border-border'
        }`}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text className={selected ? 'text-primary text-[15px]' : 'text-muted text-[15px]'}>
          {selected?.label ?? 'Select…'}
        </Text>
        <Text className="text-muted text-sm">▾</Text>
      </TouchableOpacity>
      {error && <Text className="text-xs text-red-400 mt-1">{error}</Text>}

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
          onPress={() => setOpen(false)}
          activeOpacity={1}
        >
          <View className="bg-elevated rounded-t-3xl p-6 max-h-[65%]">
            <Text className="text-base font-bold text-primary mb-4 text-center">{label}</Text>
            <ScrollView>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  className={`flex-row justify-between items-center py-3.5 px-2 border-b border-border ${
                    opt.value === value ? 'bg-brand/10 rounded-xl border-transparent' : ''
                  }`}
                  onPress={() => { onChange(opt.value); setOpen(false); }}
                >
                  <Text
                    className={`text-[15px] ${opt.value === value ? 'text-brand font-semibold' : 'text-secondary'}`}
                  >
                    {opt.label}
                  </Text>
                  {opt.value === value && (
                    <Text className="text-brand text-base font-bold">✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
