import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme-provider';
import type { TextInputProps } from 'react-native';

export function SearchBar(props: TextInputProps) {
  const { md3: c } = useTheme();
  return (
    <View style={[styles.container, {
      backgroundColor: c.surfaceContainerLowest,
      borderWidth: 0.5,
      borderColor: c.outlineVariant + '4D',
    }]}>
      <Text style={[styles.icon, { color: c.outline }]}>search</Text>
      <TextInput
        placeholderTextColor={c.outline}
        style={[styles.input, { color: c.onSurface }]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#191C1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  icon: { fontSize: 20, fontFamily: 'Material Symbols Outlined' },
  input: { flex: 1, fontSize: 14, fontFamily: 'Sora' },
});
