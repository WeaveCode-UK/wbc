import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme-provider';

interface StepIndicatorProps {
  total: number;
  current: number;
}

export function StepIndicator({ total, current }: StepIndicatorProps) {
  const { md3: c } = useTheme();
  return (
    <View style={styles.container}>
      {Array.from({ length: total }, (_, i) => {
        const active = i === current;
        const completed = i < current;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              {
                width: active ? 24 : 8,
                backgroundColor: active || completed ? c.primaryContainer : c.surfaceContainerHigh,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'center', gap: 8, alignItems: 'center' },
  dot: { height: 8, borderRadius: 9999 },
});
