import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme-provider';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      {icon && <View style={[styles.iconBox, { backgroundColor: colors.bgSecondary }]}>{icon}</View>}
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {description && <Text style={[styles.desc, { color: colors.textTertiary }]}>{description}</Text>}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  iconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 14, fontWeight: '500', fontFamily: 'Sora_500Medium' },
  desc: { fontSize: 12, fontFamily: 'Sora_400Regular', textAlign: 'center', maxWidth: 280, marginTop: 4 },
  action: { marginTop: 16 },
});
