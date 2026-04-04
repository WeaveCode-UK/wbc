import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { useTheme } from '../theme/theme-provider';
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
  icon?: ReactNode;
}

const heights: Record<Size, number> = { lg: 52, md: 44, sm: 36, xs: 28 };
const fontSizes: Record<Size, number> = { lg: 15, md: 13, sm: 11, xs: 10 };
const paddings: Record<Size, number> = { lg: 24, md: 20, sm: 16, xs: 12 };

export function Button({ variant = 'primary', size = 'md', loading, disabled, onPress, children, icon }: ButtonProps) {
  const { md3: c } = useTheme();

  const bgColors: Record<Variant, string> = {
    primary: c.primaryContainer, secondary: c.surfaceContainerLowest, outline: 'transparent',
    ghost: 'transparent', danger: c.error, success: c.success,
  };
  const textColors: Record<Variant, string> = {
    primary: c.onPrimary, secondary: c.primary, outline: c.onSurface,
    ghost: c.onSurfaceVariant, danger: c.onError, success: '#FFFFFF',
  };
  const borderStyles = variant === 'outline'
    ? { borderWidth: 1, borderColor: c.outlineVariant + '33' }
    : variant === 'secondary'
      ? { borderWidth: 0.5, borderColor: c.primary + '33' }
      : undefined;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.base,
        {
          height: heights[size],
          backgroundColor: bgColors[variant],
          paddingHorizontal: paddings[size],
          borderRadius: 12,
          opacity: disabled ? 0.5 : 1,
        },
        variant === 'primary' ? styles.primaryShadow : undefined,
        borderStyles,
      ]}
    >
      {loading ? <ActivityIndicator color={textColors[variant]} size="small" /> : (
        <View style={styles.content}>
          {icon}
          <Text style={{
            color: textColors[variant],
            fontSize: fontSizes[size],
            fontWeight: '700',
            fontFamily: 'Sora',
            letterSpacing: size === 'xs' || size === 'sm' ? 0.8 : 0,
            textTransform: size === 'xs' || size === 'sm' ? 'uppercase' : undefined,
          }}>
            {children}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryShadow: {
    shadowColor: '#8127E8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
});
