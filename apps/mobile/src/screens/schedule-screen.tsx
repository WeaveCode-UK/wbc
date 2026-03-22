import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme, SegmentedControl, Card } from '@wbc/ui-native';

export function ScheduleScreen() {
  const { colors } = useTheme();
  const [view, setView] = useState('day');

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgTertiary }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Agenda</Text>
      <SegmentedControl options={[{ value: 'day', label: 'Dia' }, { value: 'week', label: 'Semana' }, { value: 'month', label: 'Mês' }]} value={view} onChange={setView} />
      <Card variant="elevated"><Text style={[styles.eventTitle, { color: colors.textPrimary }]}>14:00 — Visita Daniela Costa</Text><Text style={[styles.eventSub, { color: colors.textTertiary }]}>Demo de produtos, Rua das Flores 123</Text></Card>
      <Card variant="elevated"><Text style={[styles.eventTitle, { color: colors.textPrimary }]}>16:30 — Entrega Beatriz Santos</Text><Text style={[styles.eventSub, { color: colors.textTertiary }]}>3 produtos, Av. Paulista 500</Text></Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '500', fontFamily: 'Sora_500Medium' },
  eventTitle: { fontSize: 13, fontWeight: '500', fontFamily: 'Sora_500Medium' },
  eventSub: { fontSize: 11, fontFamily: 'Sora_400Regular', marginTop: 2 },
});
