import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme-provider';

interface SegmentedControlProps {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  const { md3: c } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: c.surfaceContainerLow }]}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onChange(opt.value)}
            activeOpacity={0.8}
            style={[
              styles.item,
              active && {
                backgroundColor: c.surfaceContainerLowest,
                shadowColor: '#000',
                shadowOpacity: 0.06,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              },
            ]}
          >
            <Text style={[
              styles.label,
              { color: active ? c.primary : c.onSurfaceVariant },
            ]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', borderRadius: 12, padding: 4, gap: 2 },
  item: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  label: { fontSize: 13, fontWeight: '700', fontFamily: 'Sora' },
});
