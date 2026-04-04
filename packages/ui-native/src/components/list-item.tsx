import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme-provider';
import type { ReactNode } from 'react';

interface ListItemProps {
  avatar?: ReactNode;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  separator?: boolean;
  onPress?: () => void;
}

export function ListItem({ avatar, title, subtitle, right, separator = false, onPress }: ListItemProps) {
  const { md3: c } = useTheme();
  const content = (
    <View style={[
      styles.row,
      {
        backgroundColor: c.surfaceContainerLowest,
        borderRadius: 16,
        borderWidth: 0.5,
        borderColor: c.outlineVariant + '1A',
      },
    ]}>
      {avatar && <View>{avatar}</View>}
      <View style={styles.info}>
        <Text style={[styles.title, { color: c.onSurface }]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: c.outline }]}>{subtitle}</Text>}
      </View>
      {right && <View>{right}</View>}
    </View>
  );

  if (onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.85}>{content}</TouchableOpacity>;
  }
  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16,
    shadowColor: '#191C1E', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', fontFamily: 'Sora' },
  subtitle: { fontSize: 11, fontFamily: 'Manrope', marginTop: 2 },
});
