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
  const { md3: c } = useTheme();
  return (
    <View style={styles.container}>
      {icon && <View style={[styles.iconBox, { backgroundColor: c.primaryFixed + '33' }]}>{icon}</View>}
      <Text style={[styles.title, { color: c.onSurface }]}>{title}</Text>
      {description && <Text style={[styles.desc, { color: c.onSurfaceVariant }]}>{description}</Text>}
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  iconBox: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '700', fontFamily: 'Epilogue' },
  desc: { fontSize: 13, fontFamily: 'Manrope', textAlign: 'center', maxWidth: 280, marginTop: 6, lineHeight: 20 },
  action: { marginTop: 20 },
});
