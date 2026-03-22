import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useTheme, SegmentedControl, Card, Badge } from '@wbc/ui-native';

const mockSales = [
  { id: '1', client: 'Ana Silva', total: 'R$ 450,00', status: 'Entregue', statusVariant: 'success' as const },
  { id: '2', client: 'Beatriz Santos', total: 'R$ 230,00', status: 'Confirmada', statusVariant: 'info' as const },
  { id: '3', client: 'Carla Oliveira', total: 'R$ 120,00', status: 'Pendente', statusVariant: 'warning' as const },
];

export function SalesListScreen() {
  const { colors } = useTheme();
  const [segment, setSegment] = useState('all');

  return (
    <View style={[styles.container, { backgroundColor: colors.bgTertiary }]}>
      <View style={[styles.header, { backgroundColor: colors.bgPrimary }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Vendas</Text>
        <View style={styles.statsRow}>
          {[{ label: 'Este mês', value: 'R$ 15.230' }, { label: 'Vendas', value: '100' }, { label: 'Pendentes', value: '8' }].map((s, i) => (
            <Card key={i} variant="flat"><Text style={[styles.statLabel, { color: colors.textTertiary }]}>{s.label}</Text><Text style={[styles.statValue, { color: colors.textPrimary }]}>{s.value}</Text></Card>
          ))}
        </View>
        <SegmentedControl options={[{ value: 'all', label: 'Todas' }, { value: 'pending', label: 'Pendentes' }, { value: 'delivered', label: 'Entregues' }]} value={segment} onChange={setSegment} />
      </View>
      <FlatList data={mockSales} keyExtractor={(i) => i.id} contentContainerStyle={styles.list} renderItem={({ item }) => (
        <Card variant="elevated">
          <View style={styles.saleRow}>
            <View style={{ flex: 1 }}><Text style={[styles.saleName, { color: colors.textPrimary }]}>{item.client}</Text><Text style={[styles.saleTotal, { color: colors.textSecondary }]}>{item.total}</Text></View>
            <Badge variant={item.statusVariant}>{item.status}</Badge>
          </View>
        </Card>
      )} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '500', fontFamily: 'Sora_500Medium' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statLabel: { fontSize: 10, fontFamily: 'Sora_400Regular' },
  statValue: { fontSize: 15, fontWeight: '500', fontFamily: 'Sora_500Medium' },
  list: { padding: 16, gap: 8 },
  saleRow: { flexDirection: 'row', alignItems: 'center' },
  saleName: { fontSize: 13, fontWeight: '500', fontFamily: 'Sora_500Medium' },
  saleTotal: { fontSize: 11, fontFamily: 'Sora_400Regular' },
});
