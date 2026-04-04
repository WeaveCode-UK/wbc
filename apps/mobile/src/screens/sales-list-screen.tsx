import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, SegmentedControl, Badge, Card } from '@wbc/ui-native';

const mockSales = [
  { id: '1', client: 'Ana Silva', products: 'Kit Cronos + Serum Facial', total: 'R$ 450,00', date: '22 Out', status: 'Entregue', statusVariant: 'success' as const },
  { id: '2', client: 'Beatriz Santos', products: 'Batom Matte Rosa', total: 'R$ 230,00', date: '21 Out', status: 'Confirmada', statusVariant: 'info' as const },
  { id: '3', client: 'Carla Oliveira', products: 'Creme Hidratante 200ml', total: 'R$ 120,00', date: '20 Out', status: 'Pendente', statusVariant: 'warning' as const },
  { id: '4', client: 'Diana Ferreira', products: 'Kit SkinCare Completo', total: 'R$ 680,00', date: '19 Out', status: 'Entregue', statusVariant: 'success' as const },
  { id: '5', client: 'Elisa Mendes', products: 'Perfume Floral 50ml', total: 'R$ 195,00', date: '18 Out', status: 'Pendente', statusVariant: 'warning' as const },
];

export function SalesListScreen() {
  const { md3: c } = useTheme();
  const [segment, setSegment] = useState('all');

  return (
    <View style={[styles.container, { backgroundColor: c.surface }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.onSurface }]}>Vendas</Text>

        {/* Stat Cards with left-border accents */}
        <View style={styles.statsRow}>
          <View style={{ flex: 1 }}>
            <Card variant="action" accentColor={c.primaryContainer} padding={14}>
              <Text style={[styles.statOverline, { color: c.outline }]}>ESTE MES</Text>
              <Text style={[styles.statValue, { color: c.onSurface }]}>R$ 15.230</Text>
            </Card>
          </View>
          <View style={{ flex: 1 }}>
            <Card variant="action" accentColor={c.success} padding={14}>
              <Text style={[styles.statOverline, { color: c.outline }]}>VENDAS</Text>
              <Text style={[styles.statValue, { color: c.onSurface }]}>100</Text>
            </Card>
          </View>
          <View style={{ flex: 1 }}>
            <Card variant="action" accentColor={c.warning} padding={14}>
              <Text style={[styles.statOverline, { color: c.outline }]}>PENDENTES</Text>
              <Text style={[styles.statValue, { color: c.onSurface }]}>8</Text>
            </Card>
          </View>
        </View>

        <SegmentedControl
          options={[
            { value: 'all', label: 'Todas' },
            { value: 'pending', label: 'Pendentes' },
            { value: 'delivered', label: 'Entregues' },
          ]}
          value={segment}
          onChange={setSegment}
        />
      </View>

      {/* Sales List */}
      <FlatList
        data={mockSales}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.85}>
            <View
              style={[
                styles.saleCard,
                {
                  backgroundColor: c.surfaceContainerLowest,
                  borderWidth: 0.5,
                  borderColor: c.outlineVariant + '33',
                },
              ]}
            >
              <View style={styles.saleTop}>
                <View style={styles.saleClientRow}>
                  <Text style={[styles.saleClient, { color: c.onSurface }]}>{item.client}</Text>
                  <Badge variant={item.statusVariant}>{item.status}</Badge>
                </View>
                <Text style={[styles.saleProducts, { color: c.outline }]}>{item.products}</Text>
              </View>
              <View style={[styles.saleBottom, { borderTopColor: c.outlineVariant + '1A' }]}>
                <Text style={[styles.saleDate, { color: c.onSurfaceVariant }]}>{item.date}</Text>
                <Text style={[styles.saleTotal, { color: c.onSurface }]}>{item.total}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Epilogue',
    letterSpacing: -0.3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statOverline: {
    fontSize: 8,
    fontWeight: '700',
    fontFamily: 'Manrope',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Epilogue',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    gap: 10,
  },
  saleCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#191C1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  saleTop: {
    padding: 16,
    gap: 4,
  },
  saleClientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saleClient: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Sora',
    flex: 1,
  },
  saleProducts: {
    fontSize: 12,
    fontFamily: 'Manrope',
    marginTop: 2,
  },
  saleBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 0.5,
  },
  saleDate: {
    fontSize: 11,
    fontFamily: 'Manrope',
    fontWeight: '500',
  },
  saleTotal: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Sora',
  },
});
