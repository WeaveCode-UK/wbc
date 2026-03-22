import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme-provider';
import { radius } from '@wbc/shared/src/theme/spacing';
import type { ReactNode } from 'react';

type CardVariant = 'elevated' | 'flat' | 'action';

interface CardProps {
  variant?: CardVariant;
  accentColor?: string;
  children: ReactNode;
}

export function Card({ variant = 'elevated', accentColor, children }: CardProps) {
  const { colors } = useTheme();

  const bgColor = variant === 'flat' ? colors.bgSecondary : colors.bgPrimary;
  const borderStyle = variant === 'elevated' || variant === 'action'
    ? { borderWidth: 0.5, borderColor: colors.borderSecondary }
    : undefined;
  const actionStyle = variant === 'action' && accentColor
    ? { borderLeftWidth: 3, borderLeftColor: accentColor }
    : undefined;

  return (
    <View style={[styles.base, { backgroundColor: bgColor, borderRadius: radius.lg }, borderStyle, actionStyle]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { padding: 16 },
});
