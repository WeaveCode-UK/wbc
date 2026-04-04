import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme-provider';

interface ToggleProps {
  value: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ value, onChange, disabled }: ToggleProps) {
  const { md3: c } = useTheme();
  return (
    <TouchableOpacity
      onPress={() => !disabled && onChange(!value)}
      activeOpacity={0.7}
      style={[styles.track, {
        backgroundColor: value ? c.primaryContainer : c.surfaceContainerHigh,
        opacity: disabled ? 0.5 : 1,
      }]}
    >
      <View style={[styles.knob, {
        transform: [{ translateX: value ? 22 : 0 }],
        shadowColor: value ? c.primaryContainer : '#000',
        shadowOpacity: value ? 0.3 : 0.1,
      }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: { width: 48, height: 26, borderRadius: 13, padding: 2, justifyContent: 'center' },
  knob: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 3,
  },
});
