import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme, Card } from '@wbc/ui-native';

export function FinanceScreen() {
  const { colors } = useTheme();
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bgTertiary }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Financeiro</Text>
      <View style={styles.statsGrid}>
        {[{ label: 'Receita', value: 'R$ 15.230', color: colors.success }, { label: 'Despesas', value: 'R$ 3.200', color: colors.danger }, { label: 'Lucro', value: 'R$ 12.030', color: colors.textPrimary }, { label: 'A receber', value: 'R$ 1.850', color: colors.warning }].map((s, i) => (
          <Card key={i} variant="flat">
            <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{s.label}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
          </Card>
        ))}
      </View>
      <Card variant="elevated"><Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Contas a receber</Text><Text style={{ color: colors.textTertiary, fontFamily: 'Sora_400Regular' }}>8 parcelas pendentes — R$ 1.850,00</Text></Card>
      <Card variant="elevated"><Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Despesas do mês</Text><Text style={{ color: colors.textTertiary, fontFamily: 'Sora_400Regular' }}>10 despesas registradas</Text></Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '500', fontFamily: 'Sora_500Medium' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statLabel: { fontSize: 10, fontFamily: 'Sora_400Regular' },
  statValue: { fontSize: 18, fontWeight: '500', fontFamily: 'Sora_500Medium', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '500', fontFamily: 'Sora_500Medium', marginBottom: 4 },
});
