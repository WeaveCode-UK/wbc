import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme-provider';
import { radius } from '@wbc/shared/src/theme/spacing';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  variant?: Variant;
  children: string;
}

export function Badge({ variant = 'neutral', children }: BadgeProps) {
  const { colors } = useTheme();

  const bgColors: Record<Variant, string> = {
    success: colors.successBg, warning: colors.warningBg, danger: colors.dangerBg,
    info: colors.infoBg, neutral: colors.bgSecondary,
  };
  const textColors: Record<Variant, string> = {
    success: colors.successText, warning: colors.warningText, danger: colors.dangerText,
    info: colors.infoText, neutral: colors.textSecondary,
  };

  return (
    <View style={[styles.badge, { backgroundColor: bgColors[variant], borderRadius: radius.sm }]}>
      <Text style={[styles.text, { color: textColors[variant] }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  text: { fontSize: 11, fontWeight: '500', fontFamily: 'Sora' },
});
