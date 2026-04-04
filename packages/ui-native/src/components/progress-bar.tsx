import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme-provider';

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'primary' | 'success' | 'warning' | 'danger';
}

export function ProgressBar({ value, max = 100, variant = 'primary' }: ProgressBarProps) {
  const { md3: c } = useTheme();
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colorMap = {
    primary: c.primaryContainer,
    success: c.success,
    warning: c.warning,
    danger: c.error,
  };

  return (
    <View style={[styles.track, { backgroundColor: c.surfaceContainer }]}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: colorMap[variant] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: 9999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 9999 },
});
