import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme-provider';
import type { TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
}

export function Input({ label, error, helper, ...props }: InputProps) {
  const { md3: c } = useTheme();
  const borderColor = error ? c.error : 'transparent';

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: c.onSurfaceVariant }]}>{label}</Text>}
      <TextInput
        placeholderTextColor={c.outline}
        style={[styles.input, {
          borderColor,
          backgroundColor: c.surfaceContainerLow,
          color: c.onSurface,
          borderWidth: error ? 1 : 0,
        }]}
        {...props}
      />
      {error && <Text style={[styles.helper, { color: c.error }]}>{error}</Text>}
      {helper && !error && <Text style={[styles.helper, { color: c.outline }]}>{helper}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 10, fontFamily: 'Manrope', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  input: { height: 48, paddingHorizontal: 16, fontSize: 14, fontFamily: 'Sora', borderRadius: 12 },
  helper: { fontSize: 11, fontFamily: 'Manrope', marginLeft: 4 },
});
