import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme-provider';

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
}

export function ProgressBar({ value, max = 100, variant = 'primary' }: ProgressBarProps) {
  const { colors } = useTheme();
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colorMap = { primary: colors.primary, success: colors.success, warning: colors.warning, danger: colors.danger };

  return (
    <View style={[styles.track, { backgroundColor: colors.bgSecondary }]}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: colorMap[variant] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});
