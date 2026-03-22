import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme-provider';
import { radius } from '@wbc/shared';
import type { TextInputProps } from 'react-native';

export function SearchBar(props: TextInputProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.bgSecondary, borderRadius: radius.md }]}>
      <TextInput
        placeholderTextColor={colors.textTertiary}
        style={[styles.input, { color: colors.textPrimary }]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 38, paddingHorizontal: 12, justifyContent: 'center' },
  input: { fontSize: 13, fontFamily: 'Sora_400Regular' },
});
