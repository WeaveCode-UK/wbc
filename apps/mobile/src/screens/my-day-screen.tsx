import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, Card } from '@wbc/ui-native';

export function MyDayScreen() {
  const { colors } = useTheme();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgTertiary }]} contentContainerStyle={styles.content}>
      <Text style={[styles.greeting, { color: colors.textPrimary }]}>{greeting}! 👋</Text>
      <Text style={[styles.subtitle, { color: colors.textTertiary }]}>Aqui está o resumo do seu dia</Text>

      <View style={styles.statsRow}>
        {[{ label: 'Vendas', value: '12', change: '+3' }, { label: 'Faturamento', value: 'R$ 2.450' }, { label: 'Pendentes', value: '5' }].map((stat, i) => (
          <Card key={i} variant="flat">
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{stat.label}</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stat.value}</Text>
            {stat.change && <Text style={[styles.statChange, { color: colors.success }]}>{stat.change}</Text>}
          </Card>
        ))}
      </View>

      <View style={[styles.banner, { backgroundColor: colors.primarySurface }]}>
        <Text style={{ fontSize: 18 }}>🎯</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.bannerTitle, { color: colors.primary }]}>Meta do mês: 65%</Text>
          <View style={[styles.progressTrack, { backgroundColor: colors.bgSecondary }]}>
            <View style={[styles.progressFill, { width: '65%', backgroundColor: colors.primary }]} />
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Ações do dia</Text>

      {[
        { color: colors.danger, title: 'Cobrança pendente', subtitle: 'Ana Silva — R$ 150,00', action: 'Cobrar' },
        { color: colors.warning, title: 'Lembrete reposição', subtitle: 'Beatriz Santos — Creme', action: 'Enviar' },
        { color: colors.success, title: 'Aniversário hoje 🎂', subtitle: 'Carla Oliveira', action: 'Parabenizar' },
        { color: colors.info, title: 'Agendamento às 14h', subtitle: 'Visita — Daniela Costa', action: 'Ver' },
      ].map((item, i) => (
        <Card key={i} variant="action" accentColor={item.color}>
          <View style={styles.actionRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>{item.title}</Text>
              <Text style={[styles.actionSub, { color: colors.textTertiary }]}>{item.subtitle}</Text>
            </View>
            <TouchableOpacity><Text style={[styles.actionBtn, { color: colors.primary }]}>{item.action}</Text></TouchableOpacity>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  greeting: { fontSize: 24, fontWeight: '500', fontFamily: 'Sora_500Medium' },
  subtitle: { fontSize: 13, fontFamily: 'Sora_400Regular', marginBottom: 4 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statLabel: { fontSize: 11, fontFamily: 'Sora_400Regular' },
  statValue: { fontSize: 18, fontWeight: '500', fontFamily: 'Sora_500Medium', marginTop: 2 },
  statChange: { fontSize: 11, fontFamily: 'Sora_400Regular' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 10, padding: 12 },
  bannerTitle: { fontSize: 13, fontWeight: '500', fontFamily: 'Sora_500Medium', marginBottom: 4 },
  progressTrack: { height: 6, borderRadius: 3 },
  progressFill: { height: 6, borderRadius: 3 },
  sectionTitle: { fontSize: 15, fontWeight: '500', fontFamily: 'Sora_500Medium', marginTop: 8 },
  actionRow: { flexDirection: 'row', alignItems: 'center' },
  actionTitle: { fontSize: 13, fontWeight: '500', fontFamily: 'Sora_500Medium' },
  actionSub: { fontSize: 11, fontFamily: 'Sora_400Regular', marginTop: 1 },
  actionBtn: { fontSize: 11, fontWeight: '500', fontFamily: 'Sora_500Medium' },
});
