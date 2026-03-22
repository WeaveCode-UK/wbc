import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../theme/theme-provider';
import { radius } from '@wbc/shared';
import type { ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type Size = 'lg' | 'md' | 'sm' | 'xs';

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  children: ReactNode;
}

const heights: Record<Size, number> = { lg: 48, md: 40, sm: 32, xs: 26 };
const fontSizes: Record<Size, number> = { lg: 14, md: 13, sm: 11, xs: 11 };

export function Button({ variant = 'primary', size = 'md', loading, disabled, onPress, children }: ButtonProps) {
  const { colors } = useTheme();

  const bgColors: Record<Variant, string> = {
    primary: colors.primary, secondary: colors.bgSecondary, outline: 'transparent',
    ghost: 'transparent', danger: colors.danger, success: colors.success,
  };
  const textColors: Record<Variant, string> = {
    primary: '#FFFFFF', secondary: colors.textPrimary, outline: colors.textPrimary,
    ghost: colors.textSecondary, danger: '#FFFFFF', success: '#FFFFFF',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, { height: heights[size], backgroundColor: bgColors[variant], borderRadius: radius.md, opacity: disabled ? 0.5 : 1 },
        variant === 'outline' ? { borderWidth: 1, borderColor: colors.borderSecondary } : undefined,
      ]}
    >
      {loading ? <ActivityIndicator color={textColors[variant]} size="small" /> : (
        <Text style={{ color: textColors[variant], fontSize: fontSizes[size], fontWeight: '500', fontFamily: 'Sora' }}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, flexDirection: 'row', gap: 8 },
});
