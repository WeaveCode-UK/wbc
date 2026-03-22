import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, Avatar, Card, Badge, ProgressBar } from '@wbc/ui-native';

export function ClientProfileScreen() {
  const { colors } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgTertiary }]} contentContainerStyle={styles.content}>
      <View style={styles.profileHeader}>
        <Avatar name="Ana Silva" size="lg" classification="A" />
        <Text style={[styles.name, { color: colors.textPrimary }]}>Ana Silva</Text>
        <Badge variant="success">Classe A</Badge>
      </View>

      <View style={styles.actionStrip}>
        {['💬 WhatsApp', '📞 Ligar', '📦 Vender', '📝 Nota'].map((action, i) => (
          <TouchableOpacity key={i} style={[styles.actionBtn, { backgroundColor: colors.bgSecondary }]}>
            <Text style={[styles.actionLabel, { color: colors.primary }]}>{action}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsGrid}>
        {[{ label: 'Compras', value: '12' }, { label: 'Total gasto', value: 'R$ 2.450' }, { label: 'Última compra', value: '3 dias' }, { label: 'Ticket médio', value: 'R$ 204' }, { label: 'Cashback', value: 'R$ 45' }, { label: 'Score', value: '85' }].map((s, i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: colors.bgSecondary }]}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Card variant="elevated">
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Engajamento</Text>
        <ProgressBar value={85} variant="success" />
        <Text style={[styles.engagementLabel, { color: colors.textTertiary }]}>85/100 — Cliente muito engajada</Text>
      </Card>

      <Card variant="elevated">
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Perfil de beleza</Text>
        <View style={styles.beautyRow}>
          <Text style={[styles.beautyLabel, { color: colors.textTertiary }]}>Pele: Mista</Text>
          <Text style={[styles.beautyLabel, { color: colors.textTertiary }]}>Cabelo: Cacheado</Text>
        </View>
      </Card>

      <Card variant="elevated">
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Notas</Text>
        <Text style={[styles.notes, { color: colors.textSecondary }]}>Prefere produtos sem fragrância. Aniversário da filha em maio.</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  profileHeader: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  name: { fontSize: 18, fontWeight: '500', fontFamily: 'Sora_500Medium' },
  actionStrip: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, alignItems: 'center', borderRadius: 10, padding: 10 },
  actionLabel: { fontSize: 11, fontWeight: '500', fontFamily: 'Sora_500Medium' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: { width: '30%', flexGrow: 1, alignItems: 'center', borderRadius: 10, padding: 10 },
  statValue: { fontSize: 15, fontWeight: '500', fontFamily: 'Sora_500Medium' },
  statLabel: { fontSize: 10, fontFamily: 'Sora_400Regular', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '500', fontFamily: 'Sora_500Medium', marginBottom: 8 },
  engagementLabel: { fontSize: 11, fontFamily: 'Sora_400Regular', marginTop: 4 },
  beautyRow: { flexDirection: 'row', gap: 16 },
  beautyLabel: { fontSize: 13, fontFamily: 'Sora_400Regular' },
  notes: { fontSize: 13, fontFamily: 'Sora_400Regular', lineHeight: 20 },
});
