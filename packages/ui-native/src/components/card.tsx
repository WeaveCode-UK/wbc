import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme-provider';
import type { ReactNode } from 'react';

type CardVariant = 'elevated' | 'flat' | 'action' | 'glass';

interface CardProps {
  variant?: CardVariant;
  accentColor?: string;
  children: ReactNode;
  padding?: number;
}

export function Card({ variant = 'elevated', accentColor, children, padding }: CardProps) {
  const { md3: c } = useTheme();

  const bgColor = variant === 'flat' ? c.surfaceContainerLow
    : variant === 'glass' ? c.surface
    : c.surfaceContainerLowest;

  return (
    <View style={[
      styles.base,
      {
        backgroundColor: bgColor,
        borderRadius: 16,
        padding: padding ?? 16,
      },
      (variant === 'elevated' || variant === 'action') && {
        borderWidth: 0.5,
        borderColor: c.outlineVariant + '33',
        shadowColor: '#191C1E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      },
      variant === 'action' && accentColor && {
        borderLeftWidth: 4,
        borderLeftColor: accentColor,
      },
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {},
});
