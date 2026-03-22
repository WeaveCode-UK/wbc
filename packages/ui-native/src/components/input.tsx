import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme-provider';
import { radius } from '@wbc/shared';
import type { TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
}

export function Input({ label, error, helper, ...props }: InputProps) {
  const { colors } = useTheme();
  const borderColor = error ? colors.danger : colors.borderSecondary;

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.textTertiary }]}>{label}</Text>}
      <TextInput
        placeholderTextColor={colors.textTertiary}
        style={[styles.input, { borderColor, backgroundColor: colors.bgPrimary, color: colors.textPrimary, borderRadius: radius.md }]}
        {...props}
      />
      {error && <Text style={[styles.helper, { color: colors.danger }]}>{error}</Text>}
      {helper && !error && <Text style={[styles.helper, { color: colors.textTertiary }]}>{helper}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  label: { fontSize: 11, fontFamily: 'Sora' },
  input: { height: 40, borderWidth: 0.5, paddingHorizontal: 12, fontSize: 13, fontFamily: 'Sora' },
  helper: { fontSize: 11, fontFamily: 'Sora' },
});
