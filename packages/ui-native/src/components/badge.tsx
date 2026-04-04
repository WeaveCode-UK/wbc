import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme-provider';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
  variant?: Variant;
  children: string;
}

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  const { md3: c } = useTheme();

  const bgColors: Record<Variant, string> = {
    success: c.successBg, warning: c.warningBg, danger: c.dangerBg,
    info: c.infoBg, neutral: c.surfaceContainerHigh,
    primary: c.primaryFixed,
  };
  const textColors: Record<Variant, string> = {
    success: c.successText, warning: c.warningText, danger: c.dangerText,
    info: c.infoText, neutral: c.onSurfaceVariant,
    primary: c.primary,
  };

  return (
    <View style={[styles.badge, { backgroundColor: bgColors[variant] }]}>
      <Text style={[styles.text, { color: textColors[variant] }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', borderRadius: 9999 },
  text: { fontSize: 9, fontWeight: '700', fontFamily: 'Manrope', letterSpacing: 0.5, textTransform: 'uppercase' },
});
