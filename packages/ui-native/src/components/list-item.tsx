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

export function ListItem({ avatar, title, subtitle, right, separator = true, onPress }: ListItemProps) {
  const { colors } = useTheme();
  const content = (
    <View style={[styles.row, separator && { borderBottomWidth: 0.5, borderBottomColor: colors.borderTertiary }]}>
      {avatar && <View style={styles.avatar}>{avatar}</View>}
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: colors.textTertiary }]}>{subtitle}</Text>}
      </View>
      {right && <View>{right}</View>}
    </View>
  );

  if (onPress) return <TouchableOpacity onPress={onPress}>{content}</TouchableOpacity>;
  return content;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  avatar: { width: 38 },
  info: { flex: 1 },
  title: { fontSize: 13, fontWeight: '500', fontFamily: 'Sora_500Medium' },
  subtitle: { fontSize: 11, fontFamily: 'Sora_400Regular', marginTop: 1 },
});
