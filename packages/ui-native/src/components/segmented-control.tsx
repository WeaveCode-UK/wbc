import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme-provider';

interface SegmentedControlProps {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary }]}>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => onChange(opt.value)}
          style={[styles.item, value === opt.value && { backgroundColor: colors.bgPrimary, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }]}
        >
          <Text style={[styles.label, { color: value === opt.value ? colors.textPrimary : colors.textTertiary }]}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', borderRadius: 8, padding: 2 },
  item: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 6 },
  label: { fontSize: 11, fontWeight: '500', fontFamily: 'Sora_500Medium' },
});
