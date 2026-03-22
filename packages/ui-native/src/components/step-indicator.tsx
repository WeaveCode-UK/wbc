import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme-provider';

interface StepIndicatorProps {
  total: number;
  current: number;
}

export function StepIndicator({ total, current }: StepIndicatorProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.dot, { width: i === current ? 36 : 24, backgroundColor: i <= current ? colors.primary : colors.borderTertiary }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'center', gap: 6, alignItems: 'center' },
  dot: { height: 3, borderRadius: 1.5 },
});
