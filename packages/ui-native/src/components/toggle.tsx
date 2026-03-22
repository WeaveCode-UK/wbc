import React from 'react';
import { TouchableOpacity, View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../theme/theme-provider';

interface ToggleProps {
  value: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ value, onChange, disabled }: ToggleProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={() => !disabled && onChange(!value)}
      activeOpacity={0.7}
      style={[styles.track, { backgroundColor: value ? colors.primary : colors.borderSecondary, opacity: disabled ? 0.5 : 1 }]}
    >
      <View style={[styles.knob, { transform: [{ translateX: value ? 16 : 0 }] }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: { width: 36, height: 20, borderRadius: 10, padding: 2, justifyContent: 'center' },
  knob: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFFFFF' },
});
